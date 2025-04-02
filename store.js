const Store = require('electron-store');
//Store.initRenderer();

const schema = {
  settings: {
    type: 'object',
    properties: {
      port: { type: 'string' },
      baudrate: { type: 'string' },
      databit: { type: 'string' },
      stopbit: { type: 'string' },
      parity: { type: 'string' },
      flowcontrol: { type: 'string' },
      cr: { type: 'boolean' },
      lf: { type: 'boolean' }
    },
    default: {
      port: '',
      baudrate: '115200',
      databit: '8',
      stopbit: '1',
      parity: 'none',
      flowcontrol: 'none',
      cr: false,
      lf: true
    }
  },
  windowState: {
    type: 'object',
    properties: {
      bounds: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        },
        default: { x: 10, y: 10, width: 800, height: 600 } // 기본값 추가
      },
      isMaximized: { type: 'boolean', default: false } // 기본값 추가
    },
    default: { // 전체 windowState의 기본값 설정
      bounds: { x: 10, y: 10, width: 800, height: 600 },
      isMaximized: false
    }
  }
};

const store = new Store({ schema });

module.exports = store;
