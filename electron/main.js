const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const db = require('./database')

const isDev = process.env.NODE_ENV !== 'production'

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// ── IPC Handlers ───────────────────────────────────────────────────────────

ipcMain.handle('db:getPages',    (_, parentId) => db.getPages(parentId ?? null))
ipcMain.handle('db:getAllPages', ()             => db.getAllPages())
ipcMain.handle('db:getPage',    (_, id)        => db.getPage(id))
ipcMain.handle('db:createPage', (_, title, parentId, icon, pageType) => db.createPage(title, parentId, icon, pageType))
ipcMain.handle('db:updatePage', (_, id, fields) => db.updatePage(id, fields))
ipcMain.handle('db:deletePage', (_, id)        => db.deletePage(id))

ipcMain.handle('db:getContent',  (_, pageId)          => db.getContent(pageId))
ipcMain.handle('db:saveContent', (_, pageId, content) => db.saveContent(pageId, content))

ipcMain.handle('db:getDbColumns',   (_, pageId)        => db.getDbColumns(pageId))
ipcMain.handle('db:addDbColumn',    (_, pageId, name, colType) => db.addDbColumn(pageId, name, colType))
ipcMain.handle('db:deleteDbColumn', (_, id)            => db.deleteDbColumn(id))
ipcMain.handle('db:renameDbColumn', (_, id, name)      => db.renameDbColumn(id, name))
ipcMain.handle('db:getDbRows',      (_, pageId)        => db.getDbRows(pageId))
ipcMain.handle('db:addDbRow',       (_, pageId)        => db.addDbRow(pageId))
ipcMain.handle('db:updateDbRow',    (_, id, rowData)   => db.updateDbRow(id, rowData))
ipcMain.handle('db:deleteDbRow',    (_, id)            => db.deleteDbRow(id))

ipcMain.handle('db:getEvents',    (_, year, month)            => db.getEvents(year, month))
ipcMain.handle('db:addEvent',     (_, title, date, color, note) => db.addEvent(title, date, color, note))
ipcMain.handle('db:deleteEvent',  (_, id)                    => db.deleteEvent(id))
ipcMain.handle('db:updateEvent',  (_, id, fields)            => db.updateEvent(id, fields))
