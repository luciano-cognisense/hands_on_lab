# Local renderer dependency

Three.js 0.180.0, MIT license (see THREE-LICENSE.txt).
Source archive: https://registry.npmjs.org/three/-/three-0.180.0.tgz

Unmodified production ES modules: three.module.min.js, three.core.min.js.
OrbitControls.js is from examples/jsm/controls; only its import specifier was changed from `three` to `./three.module.min.js` for this static site.

No CDN or network dependency at runtime. This directory is not a generated application build.
