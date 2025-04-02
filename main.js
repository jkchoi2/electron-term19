const { app, BrowserWindow, ipcMain, Menu,nativeTheme } = require('electron/main')
const path = require('path')
const url = require('url')
const store = require('./store');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow= null;

function make_customMenu () {
  // 기존 메뉴 가져오기
  let menuTemplate = [];
  const defaultMenu = Menu.getApplicationMenu();

  if (defaultMenu) {
    menuTemplate = defaultMenu.items.map(item => ({
      label: item.label,
      submenu: item.submenu ? item.submenu.items.map(subItem => ({
        label: subItem.label,
        click: subItem.click,
        role: subItem.role
      })) : []
    }));
  } else {
    menuTemplate = [];
  }

  // 사용자 메뉴 추가
  menuTemplate.push({
    label: 'Custom Menu',
    submenu: [
      { label: 'Option 1', click: () => console.log('Option 1 clicked') },
      { label: 'Option 2', click: () => console.log('Option 2 clicked') }
    ]
  });

  // 새로운 메뉴 설정
  const updatedMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(updatedMenu);
 }

function createWindow () {
  mainWindow = new BrowserWindow({
    minWidth: 1024, // 수정: minwidth -> minWidth
    height: 768,
    minWidth: 600,
    minHeight: 400,
  webPreferences: {
      nodeIntegration: true,  // defautlt=false,Node.js
      contextIsolation: false,// default=true,
      enableRemoteModule: false,// default=false,
      sandbox: false,           // default=false,
      preload: path.join(__dirname, 'preload.js')
    },
    //title: 'Serial Terminal',
    //icon: path.join(__dirname, 'assets/icon.png')
  })

  //mainWindow.loadFile('index.html');
  mainWindow.loadURL(url.format({
     pathname: path.join(__dirname, 'index.html'),
     protocol: 'file:',
     slashes: true
   }))
  make_customMenu();

}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


// Handle settings load
ipcMain.handle('load-settings', () => {
  return store.get('settings', {});
});

// Handle settings save
ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
});
