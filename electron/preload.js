const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Pages
  getPages: (parentId) => ipcRenderer.invoke('db:getPages', parentId),
  getAllPages: () => ipcRenderer.invoke('db:getAllPages'),
  getPage: (id) => ipcRenderer.invoke('db:getPage', id),
  createPage: (title, parentId, icon, pageType, categoryId) => ipcRenderer.invoke('db:createPage', title, parentId, icon, pageType, categoryId ?? null),
  updatePage: (id, fields) => ipcRenderer.invoke('db:updatePage', id, fields),
  deletePage: (id) => ipcRenderer.invoke('db:deletePage', id),

  // Content
  getContent: (pageId) => ipcRenderer.invoke('db:getContent', pageId),
  saveContent: (pageId, content) => ipcRenderer.invoke('db:saveContent', pageId, content),
  getContentByKey: (key) => ipcRenderer.invoke('db:getContentByKey', key),
  saveContentByKey: (key, content) => ipcRenderer.invoke('db:saveContentByKey', key, content),

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
  getEventsInRange: (start, end) => ipcRenderer.invoke('db:getEventsInRange', start, end),
  addEvent: (title, date, color, note, startTime, endTime, allDay, recurring, recurringDays) =>
    ipcRenderer.invoke('db:addEvent', title, date, color, note, startTime, endTime, allDay, recurring, recurringDays),
  deleteEvent: (id) => ipcRenderer.invoke('db:deleteEvent', id),
  updateEvent: (id, fields) => ipcRenderer.invoke('db:updateEvent', id, fields),

  // Finance
  getFinanceEntries: (pageId) => ipcRenderer.invoke('db:getFinanceEntries', pageId),
  addFinanceEntry: (pageId, title, amount, type, category, date, note, recurring) =>
    ipcRenderer.invoke('db:addFinanceEntry', pageId, title, amount, type, category, date, note, recurring),
  updateFinanceEntry: (id, fields) => ipcRenderer.invoke('db:updateFinanceEntry', id, fields),
  deleteFinanceEntry: (id) => ipcRenderer.invoke('db:deleteFinanceEntry', id),

  // Content items
  getContentItems: (pageId) => ipcRenderer.invoke('db:getContentItems', pageId),
  addContentItem: (pageId, title, platform, contentType, status, scheduledDate, description, thumbnailPath, tags) =>
    ipcRenderer.invoke('db:addContentItem', pageId, title, platform, contentType, status, scheduledDate, description, thumbnailPath, tags),
  updateContentItem: (id, fields) => ipcRenderer.invoke('db:updateContentItem', id, fields),
  deleteContentItem: (id) => ipcRenderer.invoke('db:deleteContentItem', id),

  // Sidebar categories
  getCategories: () => ipcRenderer.invoke('db:getCategories'),
  createCategory: (name) => ipcRenderer.invoke('db:createCategory', name),
  updateCategory: (id, fields) => ipcRenderer.invoke('db:updateCategory', id, fields),
  deleteCategory: (id) => ipcRenderer.invoke('db:deleteCategory', id),
  reorderPages: (pageIds) => ipcRenderer.invoke('db:reorderPages', pageIds),
  reorderCategories: (catIds) => ipcRenderer.invoke('db:reorderCategories', catIds),

  getTasks: () => ipcRenderer.invoke('db:getTasks'),
  createTask: (title, dueDate, category) => ipcRenderer.invoke('db:createTask', title, dueDate, category),
  updateTask: (id, fields) => ipcRenderer.invoke('db:updateTask', id, fields),
  deleteTask: (id) => ipcRenderer.invoke('db:deleteTask', id),

  getBooks: () => ipcRenderer.invoke('db:getBooks'),
  createBook: (title, author, status, totalPages, color) => ipcRenderer.invoke('db:createBook', title, author, status, totalPages, color),
  updateBook: (id, fields) => ipcRenderer.invoke('db:updateBook', id, fields),
  deleteBook: (id) => ipcRenderer.invoke('db:deleteBook', id),

  getDevProjects: (pageId) => ipcRenderer.invoke('db:getDevProjects', pageId),
  addDevProject: (pageId, title, description, status, techStack, githubUrl, priority) =>
    ipcRenderer.invoke('db:addDevProject', pageId, title, description, status, techStack, githubUrl, priority),
  updateDevProject: (id, fields) => ipcRenderer.invoke('db:updateDevProject', id, fields),
  deleteDevProject: (id) => ipcRenderer.invoke('db:deleteDevProject', id),

  getDevLogs: (pageId) => ipcRenderer.invoke('db:getDevLogs', pageId),
  addDevLog: (pageId, date, title, body, tags) => ipcRenderer.invoke('db:addDevLog', pageId, date, title, body, tags),
  updateDevLog: (id, fields) => ipcRenderer.invoke('db:updateDevLog', id, fields),
  deleteDevLog: (id) => ipcRenderer.invoke('db:deleteDevLog', id),

  getDevSnippets: (pageId) => ipcRenderer.invoke('db:getDevSnippets', pageId),
  addDevSnippet: (pageId, title, language, code, description, tags) =>
    ipcRenderer.invoke('db:addDevSnippet', pageId, title, language, code, description, tags),
  updateDevSnippet: (id, fields) => ipcRenderer.invoke('db:updateDevSnippet', id, fields),
  deleteDevSnippet: (id) => ipcRenderer.invoke('db:deleteDevSnippet', id),
})
