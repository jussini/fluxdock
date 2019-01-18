// Modules to control application life and create native browser window
const {app, BrowserWindow, shell, session} = require('electron')
const initializeContextMenu = require('electron-context-menu')

initializeContextMenu({
	prepend: (params, browserWindow) => [{
		label: 'Flowdock',
    visible: false,
    showInspectElement: false
	}]
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, show: false})
  const appSession = session.fromPartition("persist:flowdockapp")
  mainWindow.webContents.session = appSession

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  appSession.cookies.on('changed', function(event, cookie, cause, removed) {
    if (cookie.session && !removed) {
      const url = `${(!cookie.httpOnly && cookie.secure) ? 'https' : 'http'}://${cookie.domain}${cookie.path}`
      appSession.cookies.set({
        url: url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expirationDate: Math.floor(new Date().getTime()/1000)+1209600
      }, function(err) {
        if (err) {
          console.error('Error trying to persist cookie', err, cookie);
        }
      });
    }
  });


  // for opening the links in actual browser window instead of app window
  const handleRedirect = (e, url) => {
    console.log("Handle redirect", url)
    if(url != mainWindow.webContents.getURL()) {
      e.preventDefault()
      shell.openExternal(url)
    }
  }
  mainWindow.webContents.on('will-navigate', handleRedirect)
  mainWindow.webContents.on('new-window', handleRedirect)

  // and load the login of flowdock. If logged in, will redirect to chat.
  mainWindow.loadURL('https://www.flowdock.com/login')

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
