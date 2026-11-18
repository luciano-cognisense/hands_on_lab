// Protocolo experimental HOL/1: uma mensagem JSON por linha.
export function validateBlink(value) {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value.color) ||
      !['onMs', 'offMs'].every(k => Number.isInteger(value[k]) && value[k] >= 100 && value[k] <= 5000)) {
    throw new Error('Escolha uma cor e tempos inteiros entre 100 e 5.000 ms.');
  }
  return {color: value.color.toLowerCase(), onMs: value.onMs, offMs: value.offMs};
}
export class Device {
  constructor() { this.pending = new Map(); this.sequence = 0; this.ready = false; this.onDisconnect = null; }
  async connect(serial = globalThis.navigator?.serial) {
    if (!serial) throw new Error('Este navegador não oferece comunicação USB serial.');
    if (this.port) throw new Error('Já existe uma conexão aberta.');
    this.port = await serial.requestPort();
    try {
      await this.port.open({baudRate: 115200});
      this.writer = this.port.writable.getWriter();
      this.reader = this.port.readable.getReader();
      this.readTask = this.readLoop();
      const info = await this.request('hello');
      if (!info || info.protocol !== 1 || info.firmware !== 'hol-activities' || info.board !== 'v1b' ||
          typeof info.version !== 'string' || !Array.isArray(info.capabilities) || !info.capabilities.includes('blink') || !/^[0-9a-f]{12}$/.test(info.deviceId) || !/^[0-9a-f]{32}$/.test(info.bootId)) {
        throw new Error('Firmware de atividades V1B compatível não identificado.');
      }
      this.info = info;
      this.ready = true;
      return info;
    } catch (error) { await this.close(); throw error; }
  }
  async request(command, params) {
    if (!this.writer) throw new Error('Conecte o console primeiro.');
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('O console não confirmou o comando.')); }, 5000);
      this.pending.set(id, {resolve, reject, timer});
      this.writer.write(new TextEncoder().encode(JSON.stringify({protocol: 1, id, command, params}) + '\n'))
        .catch(error => { clearTimeout(timer); this.pending.delete(id); reject(error); });
    });
  }
  accept(line) {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.protocol !== 1) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id); clearTimeout(pending.timer);
    if (message.ok === true) pending.resolve(message.result);
    else pending.reject(new Error(typeof message.error === 'string' ? message.error : 'Comando recusado pelo console.'));
  }
  async readLoop() {
    const decoder = new TextDecoder(); let buffer = '';
    try {
      while (true) {
        const {value, done} = await this.reader.read();
        if (done) break;
        buffer += decoder.decode(value, {stream: true});
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) {
          if (index > 8192) throw new Error('Resposta USB excedeu o limite.');
          this.accept(buffer.slice(0, index)); buffer = buffer.slice(index + 1);
        }
        if (buffer.length > 8192) throw new Error('Resposta USB excedeu o limite.');
      }
    } catch { /* Todas as operações pendentes são rejeitadas abaixo. */ }
    finally {
      this.ready = false;
      this.onDisconnect?.();
      for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('Conexão com o console interrompida.')); }
      this.pending.clear();
    }
  }
  async saveBlink(value) {
    if (!this.ready) throw new Error('Identifique um firmware compatível primeiro.');
    const params = validateBlink(value);
    this.saved = null;
    const saved = await this.request('blink.set', params);
    if (saved?.persisted !== true) throw new Error('O console não confirmou a persistência.');
    const actual = await this.request('blink.get');
    if (!actual || Object.keys(params).some(k => actual[k] !== params[k])) throw new Error('A leitura do console diverge das escolhas enviadas.');
    this.saved = {params, bootId: this.info?.bootId, deviceId: this.info?.deviceId};
    return actual;
  }
  async verifyAfterRestart() {
    if (!this.ready || !this.saved) throw new Error('Salve o Blink e reconecte após reiniciar.');
    if (!this.saved.deviceId || this.saved.deviceId !== this.info?.deviceId) throw new Error('Este não é o mesmo console usado no salvamento.');
    if (!this.saved.bootId || !this.info?.bootId || this.saved.bootId === this.info.bootId) {
      throw new Error('Ainda não foi identificado um novo reinício do console.');
    }
    const actual = await this.request('blink.get');
    if (!actual || Object.keys(this.saved.params).some(k => actual[k] !== this.saved.params[k])) {
      throw new Error('Os parâmetros após reiniciar não correspondem aos salvos.');
    }
    this.saved = null;
    return actual;
  }
  async close() {
    this.ready = false;
    if (this.reader) { await this.reader.cancel().catch(() => {}); await this.readTask; this.reader.releaseLock(); }
    if (this.writer) this.writer.releaseLock();
    if (this.port) await this.port.close().catch(() => {});
    this.port = this.reader = this.writer = null;
  }
}
