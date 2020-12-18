const electron = require('electron')
import { app, BrowserWindow, ipcMain } from 'electron'
//import '../renderer/store'
const path = require('path')

//用一个Tray来表示一个图标,这个图标处于正在运行的系统的通知区,通常被添加到一个context menu上
const Menu = electron.Menu
const Tray = electron.Tray
//托盘对象
let appTray = null
//图标闪烁
let flashTrayTimer = null
//系统托盘图标目录
let trayIcon = path.join(__dirname, '../../build/icons')
//闪烁图标的2个图标
let trayIco1 = path.join(trayIcon, 'icon.ico')
let trayIco2 = path.join(trayIcon, 'icon3.ico')

let isMinIco = false //是否点击了关闭窗口只有小图标

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 350,
    resizable: false, //是否可以改变窗口size，默认为 true
    maximizable: false, //窗口是否可以最大化. 在 Linux 上无效. 默认为 true
    autoHideMenuBar: true, //Auto hide the menu bar unless the Alt key is pressed. 默认值为 false
    webPreferences: {
      nodeIntegration: true, //没有这句会报错require is not defined
      webSecurity: false,
      enableRemoteModule:true //electron 10中，我们需要加入该参数才能调用该模块
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('close', (e) => {
    isMinIco = true
    e.preventDefault()
    mainWindow.hide()
  })

  //登录后窗口大小修改
  ipcMain.on('after-login-window', () => {
    //修改窗口大小
    mainWindow.setResizable(true)
    mainWindow.setSize(850, 563)
    mainWindow.setResizable(false)
    //设置窗口居中
    mainWindow.center()
  })

  //登录窗口大小修改
  ipcMain.on('login-window', () => {
    mainWindow.setResizable(true)
    //修改窗口大小
    mainWindow.setSize(350, 563)
    mainWindow.setResizable(false)
    //设置窗口居中
    mainWindow.center()
  })

  //触发右下角图标闪烁
  ipcMain.on('flashTray', () => {
    isMinIco && flashTray(true)
  })

  //系统托盘右键菜单
  var trayMenuTemplate = [
    {
      label: '打开主界面',
      click: function () {
        isMinIco = false
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()
        flashTray(false)
      }
    },
    {
      label: '关于',
      click: function () {}
    },
    {
      label: '退出微信',
      click: function () {
        if(process.platform !== 'darwin') {
          // 清空登录信息
          mainWindow.webContents.send('clearLoggedInfo')
          mainWindow = null
          destroyTray()
          app.exit()
        }
      }
    }
  ]

  appTray = new Tray(path.join(trayIcon, 'icon.ico'))

  //图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate)

  //设置此托盘图标的悬停提示内容
  appTray.setToolTip('whz的微信')

  //设置此图标的上下文菜单
  appTray.setContextMenu(contextMenu)
  // 托盘点击事件
  appTray.on('click', () => {
    if(mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()

    flashTray(false)
  })
}

// 托盘图标闪烁
function flashTray(flash) {
  let hasIco = false
  if (flash) {
    if (flashTrayTimer) return
    flashTrayTimer = setInterval(() => {
      appTray.setImage(hasIco ? trayIco1 : trayIco2)
      hasIco = !hasIco
    }, 500)
  } else {
    if (flashTrayTimer) {
      clearInterval(flashTrayTimer)
      flashTrayTimer = null
    }
    appTray.setImage(trayIco1)
  }
}

// 销毁托盘图标
function destroyTray() {
  flashTray(false)
  appTray.destroy()
  appTray = null
}

app.on('ready', createWindow)

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
