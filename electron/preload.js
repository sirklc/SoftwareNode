const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Pages
  getPages: (parentId) => ipcRenderer.invoke('db:getPages', parentId),
  getAllPages: () => ipcRenderer.invoke('db:getAllPages'),
  getPage: (id) => ipcRenderer.invoke('db:getPage', id),
  createPage: (title, parentId, icon, pageType) => ipcRenderer.invoke('db:createPage', title, parentId, icon, pageType),
  updatePage: (id, fields) => ipcRenderer.invoke('db:updatePage', id, fields),
  deletePage: (id) => ipcRenderer.invoke('db:deletePage', id),

  // Content
  getContent: (pageId) => ipcRenderer.invoke('db:getContent', pageId),
  saveContent: (pageId, content) => ipcRenderer.invoke('db:saveContent', pageId, content),

  // Database view
  getDbColumns: (pageId) => ipcRenderer.invoke('db:getDbColumns', pageId),
  addDbColumn: (pageId, name, colType) => ipcRenderer.invoke('db:addDbColumn', pageId, name, colType),
  deleteDbColumn: (id) => ipcRenderer.invoke('db:deleteDbColumn', id),
  renameDbColumn: (id, name) => ipcRenderer.invoke('db:renameDbColumn', id, name),
  getDbRows: (pageId) => ipcRenderer.invoke('db:getDbRows', pageId),
  addDbRow: (pageId) => ipcRenderer.invoke('db:addDbRow', pageId),
  updateDbRow: (id, rowData) => ipcRenderer.invoke('db:updateDbRow', id, rowData),
  deleteDbRow: (id) => ipcRenderer.invoke('db:deleteDbRow', id),

  // Calendar
  getEvents: (year, month) => ipcRenderer.invoke('db:getEvents', year, month),
  addEvent: (title, date, color, note) => ipcRenderer.invoke('db:addEvent', title, date, color, note),
  deleteEvent: (id) => ipcRenderer.invoke('db:deleteEvent', id),
  updateEvent: (id, fields) => ipcRenderer.invoke('db:updateEvent', id, fields),
})
