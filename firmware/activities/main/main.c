#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/rmt_tx.h"
#include "driver/usb_serial_jtag.h"
#include "esp_timer.h"
#include "esp_random.h"
#include "esp_mac.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "cJSON.h"
#include "led_strip_encoder.h"

// V1B: display MUST be disconnected. No display/audio/SD drivers initialized.
typedef struct { char color[8]; int on_ms; int off_ms; } blink_t;
static blink_t blink = {"#26c8af",500,500};
static nvs_handle_t storage;
static char boot_id[33];
static char device_id[13];
static rmt_channel_handle_t channel;
static rmt_encoder_handle_t encoder;
static bool valid_color(const char *s) {
    if (!s || strlen(s)!=7 || s[0]!='#') return false;
    for (int i=1;i<7;i++) if (!isxdigit((unsigned char)s[i])) return false;
    return true;
}
static bool valid_time(const cJSON *v) { return cJSON_IsNumber(v) && v->valuedouble==v->valueint && v->valueint>=100 && v->valueint<=5000; }
static void pixel(bool lit) {
    unsigned long rgb=strtoul(blink.color+1,NULL,16);
    // Conservative prototype brightness cap: 1/8; validate on physical kit.
    uint8_t grb[3]={lit?((rgb>>8)&255)/8:0,lit?((rgb>>16)&255)/8:0,lit?(rgb&255)/8:0};
    rmt_transmit_config_t tx={0};
    ESP_ERROR_CHECK(rmt_transmit(channel,encoder,grb,sizeof(grb),&tx));
    ESP_ERROR_CHECK(rmt_tx_wait_all_done(channel,100));
}
static void command(char *line) {
    cJSON *req=cJSON_Parse(line); if (!req) return;
    cJSON *id=cJSON_GetObjectItemCaseSensitive(req,"id"), *protocol=cJSON_GetObjectItemCaseSensitive(req,"protocol"), *cmd=cJSON_GetObjectItemCaseSensitive(req,"command");
    if (!cJSON_IsNumber(id)) { cJSON_Delete(req); return; }
    cJSON *reply=cJSON_CreateObject(), *result=NULL; const char *error=NULL;
    cJSON_AddNumberToObject(reply,"protocol",1); cJSON_AddNumberToObject(reply,"id",id->valuedouble);
    if (!cJSON_IsNumber(protocol) || protocol->valuedouble!=1 || !cJSON_IsString(cmd)) error="Invalid protocol";
    else if (!strcmp(cmd->valuestring,"hello")) result=cJSON_Parse("{\"protocol\":1,\"firmware\":\"hol-activities\",\"board\":\"v1b\",\"version\":\"0.1.0\",\"capabilities\":[\"blink\"]}");
    else if (!strcmp(cmd->valuestring,"blink.get")) {
        result=cJSON_CreateObject(); cJSON_AddStringToObject(result,"color",blink.color); cJSON_AddNumberToObject(result,"onMs",blink.on_ms); cJSON_AddNumberToObject(result,"offMs",blink.off_ms);
    } else if (!strcmp(cmd->valuestring,"blink.set")) {
        cJSON *p=cJSON_GetObjectItemCaseSensitive(req,"params"), *color=cJSON_GetObjectItemCaseSensitive(p,"color"), *on=cJSON_GetObjectItemCaseSensitive(p,"onMs"), *off=cJSON_GetObjectItemCaseSensitive(p,"offMs");
        if (!cJSON_IsString(color) || !valid_color(color->valuestring) || !valid_time(on) || !valid_time(off)) error="Invalid blink parameters";
        else {
            blink_t next={0}; strcpy(next.color,color->valuestring); for(int i=1;i<7;i++) next.color[i]=tolower((unsigned char)next.color[i]); next.on_ms=on->valueint; next.off_ms=off->valueint;
            esp_err_t err=nvs_set_blob(storage,"blink",&next,sizeof(next)); if(err==ESP_OK) err=nvs_commit(storage);
            if(err!=ESP_OK) error="Persistence failed"; else { blink=next; result=cJSON_Parse("{\"persisted\":true}"); }
        }
    } else error="Unknown command";
    if(result && cJSON_IsString(cmd) && !strcmp(cmd->valuestring,"hello")) { cJSON_AddStringToObject(result,"bootId",boot_id); cJSON_AddStringToObject(result,"deviceId",device_id); }
    cJSON_AddBoolToObject(reply,"ok",!error);
    if(error) cJSON_AddStringToObject(reply,"error",error); else cJSON_AddItemToObject(reply,"result",result);
    char *output=cJSON_PrintUnformatted(reply);
    if(output) { usb_serial_jtag_write_bytes(output,strlen(output),pdMS_TO_TICKS(100)); usb_serial_jtag_write_bytes("\n",1,pdMS_TO_TICKS(100)); free(output); }
    cJSON_Delete(reply); cJSON_Delete(req);
}
void app_main(void) {
    uint8_t mac[6]; ESP_ERROR_CHECK(esp_read_mac(mac, ESP_MAC_WIFI_STA));
    snprintf(device_id,sizeof(device_id),"%02x%02x%02x%02x%02x%02x",mac[0],mac[1],mac[2],mac[3],mac[4],mac[5]);
    uint32_t nonce[4]; esp_fill_random(nonce,sizeof(nonce));
    snprintf(boot_id,sizeof(boot_id),"%08lx%08lx%08lx%08lx",(unsigned long)nonce[0],(unsigned long)nonce[1],(unsigned long)nonce[2],(unsigned long)nonce[3]);
    ESP_ERROR_CHECK(nvs_flash_init()); // Never erase existing NVS on initialization failure.
    ESP_ERROR_CHECK(nvs_open("hol_activity",NVS_READWRITE,&storage));
    blink_t saved={0}; size_t size=sizeof(saved);
    if(nvs_get_blob(storage,"blink",&saved,&size)==ESP_OK && size==sizeof(saved) && saved.color[7]==0 && valid_color(saved.color) && saved.on_ms>=100 && saved.on_ms<=5000 && saved.off_ms>=100 && saved.off_ms<=5000) blink=saved;
    rmt_tx_channel_config_t config={.clk_src=RMT_CLK_SRC_DEFAULT,.gpio_num=48,.mem_block_symbols=64,.resolution_hz=10000000,.trans_queue_depth=4};
    ESP_ERROR_CHECK(rmt_new_tx_channel(&config,&channel));
    led_strip_encoder_config_t enc={.resolution=10000000}; ESP_ERROR_CHECK(rmt_new_led_strip_encoder(&enc,&encoder)); ESP_ERROR_CHECK(rmt_enable(channel));
    usb_serial_jtag_driver_config_t usb=USB_SERIAL_JTAG_DRIVER_CONFIG_DEFAULT(); ESP_ERROR_CHECK(usb_serial_jtag_driver_install(&usb));
    for(int i=0;i<3;i++){pixel(true);vTaskDelay(pdMS_TO_TICKS(150));pixel(false);vTaskDelay(pdMS_TO_TICKS(150));}
    char line[512]; size_t used=0; bool discard=false, lit=false; int64_t deadline=0;
    while(true) {
        int64_t now=esp_timer_get_time(); if(now>=deadline){lit=!lit;pixel(lit);deadline=now+(int64_t)(lit?blink.on_ms:blink.off_ms)*1000;}
        char ch; int count=usb_serial_jtag_read_bytes(&ch,1,pdMS_TO_TICKS(10));
        if(count==1){if(ch=='\n'){if(!discard){line[used]=0;command(line);}used=0;discard=false;}else if(used<sizeof(line)-1 && !discard)line[used++]=ch;else discard=true;}
    }
}
