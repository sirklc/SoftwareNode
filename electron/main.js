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
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // F12 ile DevTools aç/kapat
  win.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win.webContents.toggleDevTools()
    }
  })
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// ── IPC Handlers ───────────────────────────────────────────────────────────

ipcMain.handle('db:getPages',    (_, parentId) => db.getPages(parentId ?? null))
ipcMain.handle('db:getAllPages', ()             => db.getAllPages())
ipcMain.handle('db:getPage',    (_, id)        => db.getPage(id))
ipcMain.handle('db:createPage', (_, title, parentId, icon, pageType, categoryId) => db.createPage(title, parentId, icon, pageType, categoryId ?? null))
ipcMain.handle('db:updatePage', (_, id, fields) => db.updatePage(id, fields))
ipcMain.handle('db:deletePage', (_, id)        => db.deletePage(id))

ipcMain.handle('db:getContent',       (_, pageId)          => db.getContent(pageId))
ipcMain.handle('db:saveContent',      (_, pageId, content) => db.saveContent(pageId, content))
ipcMain.handle('db:getContentByKey',  (_, key)             => db.getContentByKey(key))
ipcMain.handle('db:saveContentByKey', (_, key, content)    => db.saveContentByKey(key, content))

ipcMain.handle('db:getDbColumns',   (_, pageId)        => db.getDbColumns(pageId))
ipcMain.handle('db:addDbColumn',    (_, pageId, name, colType) => db.addDbColumn(pageId, name, colType))
ipcMain.handle('db:deleteDbColumn', (_, id)            => db.deleteDbColumn(id))
ipcMain.handle('db:renameDbColumn', (_, id, name)      => db.renameDbColumn(id, name))
ipcMain.handle('db:getDbRows',      (_, pageId)        => db.getDbRows(pageId))
ipcMain.handle('db:addDbRow',       (_, pageId)        => db.addDbRow(pageId))
ipcMain.handle('db:updateDbRow',    (_, id, rowData)   => db.updateDbRow(id, rowData))
ipcMain.handle('db:deleteDbRow',    (_, id)            => db.deleteDbRow(id))

ipcMain.handle('db:getEvents',        (_, year, month)          => db.getEvents(year, month))
ipcMain.handle('db:getEventsInRange', (_, start, end)         => db.getEventsInRange(start, end))
ipcMain.handle('db:addEvent',     (_, title, date, color, note, startTime, endTime, allDay, recurring, recurringDays) => db.addEvent(title, date, color, note, startTime, endTime, allDay, recurring, recurringDays))
ipcMain.handle('db:deleteEvent',  (_, id)                    => db.deleteEvent(id))
ipcMain.handle('db:updateEvent',  (_, id, fields)            => db.updateEvent(id, fields))

ipcMain.handle('db:getFinanceEntries',  (_, pageId)                                           => db.getFinanceEntries(pageId))
ipcMain.handle('db:addFinanceEntry',    (_, pageId, title, amount, type, category, date, note, recurring) => db.addFinanceEntry(pageId, title, amount, type, category, date, note, recurring))
ipcMain.handle('db:updateFinanceEntry', (_, id, fields)                                       => db.updateFinanceEntry(id, fields))
ipcMain.handle('db:deleteFinanceEntry', (_, id)                                               => db.deleteFinanceEntry(id))

ipcMain.handle('db:getContentItems',  (_, pageId)                                                                    => db.getContentItems(pageId))
ipcMain.handle('db:addContentItem',   (_, pageId, title, platform, contentType, status, scheduledDate, description, thumbnailPath, tags) => db.addContentItem(pageId, title, platform, contentType, status, scheduledDate, description, thumbnailPath, tags))
ipcMain.handle('db:updateContentItem', (_, id, fields)                                                               => db.updateContentItem(id, fields))
ipcMain.handle('db:deleteContentItem', (_, id)                                                                        => db.deleteContentItem(id))

ipcMain.handle('db:getCategories',      ()              => db.getCategories())
ipcMain.handle('db:createCategory',    (_, name)       => db.createCategory(name))
ipcMain.handle('db:updateCategory',    (_, id, fields) => db.updateCategory(id, fields))
ipcMain.handle('db:deleteCategory',    (_, id)         => db.deleteCategory(id))
ipcMain.handle('db:reorderPages',      (_, pageIds)    => db.reorderPages(pageIds))
ipcMain.handle('db:reorderCategories', (_, catIds)     => db.reorderCategories(catIds))

ipcMain.handle('db:getTasks',    ()                          => db.getTasks())
ipcMain.handle('db:createTask',  (_, title, dueDate, cat)   => db.createTask(title, dueDate, cat))
ipcMain.handle('db:updateTask',  (_, id, fields)            => db.updateTask(id, fields))
ipcMain.handle('db:deleteTask',  (_, id)                    => db.deleteTask(id))

ipcMain.handle('db:getBooks',    ()                                              => db.getBooks())
ipcMain.handle('db:createBook',  (_, title, author, status, totalPages, color)  => db.createBook(title, author, status, totalPages, color))
ipcMain.handle('db:updateBook',  (_, id, fields)                                => db.updateBook(id, fields))
ipcMain.handle('db:deleteBook',  (_, id)                                        => db.deleteBook(id))

ipcMain.handle('db:getDevProjects',   (_, pageId)                                                          => db.getDevProjects(pageId))
ipcMain.handle('db:addDevProject',    (_, pageId, title, description, status, techStack, githubUrl, priority) => db.addDevProject(pageId, title, description, status, techStack, githubUrl, priority))
ipcMain.handle('db:updateDevProject', (_, id, fields)                                                      => db.updateDevProject(id, fields))
ipcMain.handle('db:deleteDevProject', (_, id)                                                              => db.deleteDevProject(id))

ipcMain.handle('db:getDevLogs',   (_, pageId)                              => db.getDevLogs(pageId))
ipcMain.handle('db:addDevLog',    (_, pageId, date, title, body, tags)    => db.addDevLog(pageId, date, title, body, tags))
ipcMain.handle('db:updateDevLog', (_, id, fields)                         => db.updateDevLog(id, fields))
ipcMain.handle('db:deleteDevLog', (_, id)                                 => db.deleteDevLog(id))

ipcMain.handle('db:getDevSnippets',   (_, pageId)                                            => db.getDevSnippets(pageId))
ipcMain.handle('db:addDevSnippet',    (_, pageId, title, language, code, description, tags)  => db.addDevSnippet(pageId, title, language, code, description, tags))
ipcMain.handle('db:updateDevSnippet', (_, id, fields)                                        => db.updateDevSnippet(id, fields))
ipcMain.handle('db:deleteDevSnippet', (_, id)                                                => db.deleteDevSnippet(id))
