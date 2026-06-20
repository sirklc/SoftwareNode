const path = require('path')
const os = require('os')
const fs = require('fs')

const DB_DIR = path.join(os.homedir(), '.softwarenode')
const DB_PATH = path.join(DB_DIR, 'data.db.json')

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

// ── In-memory store with JSON persistence ──────────────────────────────────

function loadStore() {
  if (fs.existsSync(DB_PATH)) {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) } catch {}
  }
  return {
    pages: [], page_content: {}, db_columns: [], db_rows: [],
    calendar_events: [], finance_entries: [], content_items: [], _seq: {}
  }
}

function saveStore() {
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

let store = loadStore()
if (!store.finance_entries) store.finance_entries = []
if (!store.content_items) store.content_items = []
if (!store.sidebar_categories) store.sidebar_categories = []
if (!store.tasks) store.tasks = []
if (!store.books) store.books = []
if (!store.dev_projects) store.dev_projects = []
if (!store.dev_logs) store.dev_logs = []
if (!store.dev_snippets) store.dev_snippets = []

function nextId(table) {
  store._seq[table] = (store._seq[table] || 0) + 1
  return store._seq[table]
}

// ── Pages ──────────────────────────────────────────────────────────────────

function getPages(parentId = null) {
  return store.pages
    .filter(p => parentId === null ? p.parent_id === null : p.parent_id === parentId)
    .sort((a, b) => a.id - b.id)
}

function getAllPages() {
  return store.pages
    .map(p => ({ category_id: null, order_index: p.id, ...p }))
    .sort((a, b) => a.order_index - b.order_index)
}

function getPage(id) {
  return store.pages.find(p => p.id === id) || null
}

function createPage(title = 'Başlıksız', parentId = null, icon = '📄', pageType = 'note', categoryId = null) {
  const page = {
    id: nextId('pages'),
    title,
    parent_id: parentId,
    category_id: parentId ? null : categoryId, // only root pages have categories
    icon,
    cover: '',
    page_type: pageType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  store.pages.push(page)
  saveStore()
  return page.id
}

function updatePage(id, fields) {
  const page = store.pages.find(p => p.id === id)
  if (!page) return
  Object.assign(page, fields, { updated_at: new Date().toISOString() })
  saveStore()
}

function deletePage(id) {
  const children = store.pages.filter(p => p.parent_id === id).map(p => p.id)
  children.forEach(cid => deletePage(cid))

  store.pages = store.pages.filter(p => p.id !== id)
  delete store.page_content[id]
  store.db_columns = store.db_columns.filter(c => c.page_id !== id)
  store.db_rows = store.db_rows.filter(r => r.page_id !== id)
  store.finance_entries = store.finance_entries.filter(e => e.page_id !== id)
  store.content_items = store.content_items.filter(c => c.page_id !== id)
  saveStore()
}

// ── Page content ───────────────────────────────────────────────────────────

function getContent(pageId) {
  return store.page_content[pageId] || []
}

function saveContent(pageId, content) {
  store.page_content[pageId] = content
  saveStore()
}

function getContentByKey(key) {
  return store.page_content[key] || []
}

function saveContentByKey(key, content) {
  store.page_content[key] = content
  saveStore()
}

// ── Database view ──────────────────────────────────────────────────────────

function getDbColumns(pageId) {
  return store.db_columns
    .filter(c => c.page_id === pageId)
    .sort((a, b) => a.order_index - b.order_index)
}

function addDbColumn(pageId, name, colType = 'text') {
  const count = store.db_columns.filter(c => c.page_id === pageId).length
  const col = { id: nextId('db_columns'), page_id: pageId, name, col_type: colType, order_index: count }
  store.db_columns.push(col)
  saveStore()
  return col.id
}

function deleteDbColumn(id) {
  store.db_columns = store.db_columns.filter(c => c.id !== id)
  saveStore()
}

function renameDbColumn(id, name) {
  const col = store.db_columns.find(c => c.id === id)
  if (col) { col.name = name; saveStore() }
}

function getDbRows(pageId) {
  return store.db_rows.filter(r => r.page_id === pageId).sort((a, b) => a.id - b.id)
}

function addDbRow(pageId) {
  const row = { id: nextId('db_rows'), page_id: pageId, row_data: {}, created_at: new Date().toISOString() }
  store.db_rows.push(row)
  saveStore()
  return row.id
}

function updateDbRow(id, rowData) {
  const row = store.db_rows.find(r => r.id === id)
  if (row) { row.row_data = rowData; saveStore() }
}

function deleteDbRow(id) {
  store.db_rows = store.db_rows.filter(r => r.id !== id)
  saveStore()
}

// ── Calendar ────────────────────────────────────────────────────────────────

// Get events in a date range, including recurring event occurrences
function fmtDate(d) {
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0')
}

function getEventsInRange(startDate, endDate) {
  const result = []
  store.calendar_events.forEach(ev => {
    const recurring = ev.recurring || 'yok'
    const origDate = new Date(ev.event_date + 'T00:00:00')
    const startD  = new Date(startDate + 'T00:00:00')
    const endD    = new Date(endDate + 'T00:00:00')

    if (recurring === 'yok') {
      if (ev.event_date >= startDate && ev.event_date <= endDate) {
        result.push({ ...ev })
      }
    } else if (recurring === 'haftalık') {
      const days = ev.recurring_days || []
      const cur = new Date(startD)
      while (cur <= endD) {
        if (cur >= origDate) {
          const dow = (cur.getDay() + 6) % 7
          if (days.includes(dow)) {
            result.push({ ...ev, event_date: fmtDate(cur), _is_occurrence: true })
          }
        }
        cur.setDate(cur.getDate() + 1)
      }
    } else if (recurring === 'aylık') {
      const dayOfMonth = origDate.getDate()
      // Walk month by month across the range
      let cur = new Date(startD.getFullYear(), startD.getMonth(), 1)
      while (cur <= endD) {
        const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate()
        const day = Math.min(dayOfMonth, lastDay)
        const occ = new Date(cur.getFullYear(), cur.getMonth(), day)
        if (occ >= origDate && occ >= startD && occ <= endD) {
          result.push({ ...ev, event_date: fmtDate(occ), _is_occurrence: fmtDate(occ) !== ev.event_date })
        }
        cur.setMonth(cur.getMonth() + 1)
      }
    } else if (recurring === 'yıllık') {
      const mo  = origDate.getMonth()
      const day = origDate.getDate()
      for (let y = startD.getFullYear(); y <= endD.getFullYear(); y++) {
        const occ = new Date(y, mo, day)
        if (occ >= origDate && occ >= startD && occ <= endD) {
          result.push({ ...ev, event_date: fmtDate(occ), _is_occurrence: fmtDate(occ) !== ev.event_date })
        }
      }
    }
  })
  return result
}

function getEvents(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return getEventsInRange(startDate, endDate)
}

function addEvent(title, eventDate, color = '#2eaadc', note = '', startTime = '', endTime = '', allDay = true, recurring = 'yok', recurringDays = []) {
  const ev = {
    id: nextId('calendar_events'),
    title, event_date: eventDate, color, note,
    start_time: startTime, end_time: endTime, all_day: allDay,
    recurring, recurring_days: recurringDays,
  }
  store.calendar_events.push(ev)
  saveStore()
  return ev.id
}

function deleteEvent(id) {
  store.calendar_events = store.calendar_events.filter(e => e.id !== id)
  saveStore()
}

function updateEvent(id, fields) {
  const ev = store.calendar_events.find(e => e.id === id)
  if (ev) { Object.assign(ev, fields); saveStore() }
}

// ── Finance ────────────────────────────────────────────────────────────────

function getFinanceEntries(pageId) {
  return store.finance_entries
    .filter(e => e.page_id === pageId)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id)
}

function addFinanceEntry(pageId, title, amount, type, category, date, note, recurring) {
  const entry = {
    id: nextId('finance_entries'),
    page_id: pageId,
    title, amount, type, category, date, note, recurring,
    calendar_event_id: null,
    created_at: new Date().toISOString(),
  }
  if (date) {
    const label = type === 'gelir' ? `💰 ${title} (+${amount}₺)` : `💸 ${title} (-${amount}₺)`
    const color = type === 'gelir' ? '#0f7b6c' : '#e03e3e'
    let calRecurring = 'yok'
    let calRecurringDays = []
    if (recurring === 'haftalık') {
      calRecurring = 'haftalık'
      const dow = (new Date(date + 'T00:00:00').getDay() + 6) % 7
      calRecurringDays = [dow]
    } else if (recurring === 'aylık' || recurring === 'yıllık') {
      calRecurring = recurring
    }
    const evId = nextId('calendar_events')
    store.calendar_events.push({ id: evId, title: label, event_date: date, color, note: note || '', start_time: '', end_time: '', all_day: true, recurring: calRecurring, recurring_days: calRecurringDays })
    entry.calendar_event_id = evId
  }
  store.finance_entries.push(entry)
  saveStore()
  return entry.id
}

function updateFinanceEntry(id, fields) {
  const entry = store.finance_entries.find(e => e.id === id)
  if (!entry) return
  const prevDate = entry.date
  Object.assign(entry, fields)
  if (entry.calendar_event_id) {
    const ev = store.calendar_events.find(e => e.id === entry.calendar_event_id)
    if (ev) {
      ev.event_date = entry.date || ev.event_date
      ev.title = entry.type === 'gelir'
        ? `💰 ${entry.title} (+${entry.amount}₺)`
        : `💸 ${entry.title} (-${entry.amount}₺)`
      ev.color = entry.type === 'gelir' ? '#0f7b6c' : '#e03e3e'
      if (!entry.date) {
        store.calendar_events = store.calendar_events.filter(e => e.id !== entry.calendar_event_id)
        entry.calendar_event_id = null
      }
    }
  } else if (entry.date && entry.date !== prevDate) {
    const label = entry.type === 'gelir' ? `💰 ${entry.title} (+${entry.amount}₺)` : `💸 ${entry.title} (-${entry.amount}₺)`
    const color = entry.type === 'gelir' ? '#0f7b6c' : '#e03e3e'
    const evId = nextId('calendar_events')
    store.calendar_events.push({ id: evId, title: label, event_date: entry.date, color, note: entry.note || '', start_time: '', end_time: '', all_day: true, recurring: 'yok', recurring_days: [] })
    entry.calendar_event_id = evId
  }
  saveStore()
}

function deleteFinanceEntry(id) {
  const entry = store.finance_entries.find(e => e.id === id)
  if (entry && entry.calendar_event_id) {
    store.calendar_events = store.calendar_events.filter(e => e.id !== entry.calendar_event_id)
  }
  store.finance_entries = store.finance_entries.filter(e => e.id !== id)
  saveStore()
}

// ── Content Items ──────────────────────────────────────────────────────────

function getContentItems(pageId) {
  return store.content_items
    .filter(c => c.page_id === pageId)
    .sort((a, b) => a.id - b.id)
}

function addContentItem(pageId, title, platform, contentType, status, scheduledDate, description, thumbnailPath, tags) {
  const item = {
    id: nextId('content_items'),
    page_id: pageId,
    title, platform, content_type: contentType, status,
    scheduled_date: scheduledDate, description, thumbnail_path: thumbnailPath, tags,
    calendar_event_id: null,
    created_at: new Date().toISOString(),
  }
  if (scheduledDate) {
    const emoji = contentType === 'video' ? '🎬' : contentType === 'fotoğraf' ? '📸' : '📱'
    const evId = nextId('calendar_events')
    store.calendar_events.push({ id: evId, title: `${emoji} ${title} (${platform})`, event_date: scheduledDate, color: '#9065b0', note: description || '', start_time: '', end_time: '', all_day: true, recurring: 'yok', recurring_days: [] })
    item.calendar_event_id = evId
  }
  store.content_items.push(item)
  saveStore()
  return item.id
}

function updateContentItem(id, fields) {
  const item = store.content_items.find(c => c.id === id)
  if (!item) return
  const prevDate = item.scheduled_date
  Object.assign(item, fields)
  if (item.calendar_event_id) {
    const ev = store.calendar_events.find(e => e.id === item.calendar_event_id)
    if (ev) {
      if (!item.scheduled_date) {
        store.calendar_events = store.calendar_events.filter(e => e.id !== item.calendar_event_id)
        item.calendar_event_id = null
      } else {
        ev.event_date = item.scheduled_date
        const emoji = item.content_type === 'video' ? '🎬' : item.content_type === 'fotoğraf' ? '📸' : '📱'
        ev.title = `${emoji} ${item.title} (${item.platform})`
      }
    }
  } else if (item.scheduled_date && item.scheduled_date !== prevDate) {
    const emoji = item.content_type === 'video' ? '🎬' : item.content_type === 'fotoğraf' ? '📸' : '📱'
    const evId = nextId('calendar_events')
    store.calendar_events.push({ id: evId, title: `${emoji} ${item.title} (${item.platform})`, event_date: item.scheduled_date, color: '#9065b0', note: item.description || '', start_time: '', end_time: '', all_day: true, recurring: 'yok', recurring_days: [] })
    item.calendar_event_id = evId
  }
  saveStore()
}

function deleteContentItem(id) {
  const item = store.content_items.find(c => c.id === id)
  if (item && item.calendar_event_id) {
    store.calendar_events = store.calendar_events.filter(e => e.id !== item.calendar_event_id)
  }
  store.content_items = store.content_items.filter(c => c.id !== id)
  saveStore()
}

// ── Sidebar Categories ──────────────────────────────────────────────────────

function getCategories() {
  return [...store.sidebar_categories].sort((a, b) => (a.order || 0) - (b.order || 0))
}

function createCategory(name) {
  const cat = {
    id: nextId('sidebar_categories'),
    name,
    order: store.sidebar_categories.length,
    created_at: new Date().toISOString(),
  }
  store.sidebar_categories.push(cat)
  saveStore()
  return cat.id
}

function updateCategory(id, fields) {
  const cat = store.sidebar_categories.find(c => c.id === id)
  if (cat) { Object.assign(cat, fields); saveStore() }
}

function deleteCategory(id) {
  store.pages.forEach(p => { if (p.category_id === id) p.category_id = null })
  store.sidebar_categories = store.sidebar_categories.filter(c => c.id !== id)
  saveStore()
}

function reorderPages(pageIds) {
  pageIds.forEach((id, idx) => {
    const page = store.pages.find(p => p.id === id)
    if (page) page.order_index = idx
  })
  saveStore()
}

function reorderCategories(catIds) {
  catIds.forEach((id, idx) => {
    const cat = store.sidebar_categories.find(c => c.id === id)
    if (cat) cat.order = idx
  })
  saveStore()
}

// ── Tasks ──────────────────────────────────────────────────────────────────

function getTasks() {
  return [...store.tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'done' ? 1 : -1
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return a.id - b.id
  })
}

function createTask(title, dueDate = null, category = 'Genel') {
  const task = {
    id: nextId('tasks'),
    title,
    due_date: dueDate,
    category,
    status: 'todo',
    created_at: new Date().toISOString(),
  }
  store.tasks.push(task)
  saveStore()
  return task.id
}

function updateTask(id, fields) {
  const task = store.tasks.find(t => t.id === id)
  if (task) { Object.assign(task, fields); saveStore() }
}

function deleteTask(id) {
  store.tasks = store.tasks.filter(t => t.id !== id)
  saveStore()
}

module.exports = {
  getPages, getAllPages, getPage, createPage, updatePage, deletePage,
  getContent, saveContent, getContentByKey, saveContentByKey,
  getDbColumns, addDbColumn, deleteDbColumn, renameDbColumn,
  getDbRows, addDbRow, updateDbRow, deleteDbRow,
  getEvents, getEventsInRange, addEvent, deleteEvent, updateEvent,
  getFinanceEntries, addFinanceEntry, updateFinanceEntry, deleteFinanceEntry,
  getContentItems, addContentItem, updateContentItem, deleteContentItem,
  getCategories, createCategory, updateCategory, deleteCategory,
  reorderPages, reorderCategories,
  getTasks, createTask, updateTask, deleteTask,
  getBooks, createBook, updateBook, deleteBook,
  getDevProjects, addDevProject, updateDevProject, deleteDevProject,
  getDevLogs, addDevLog, updateDevLog, deleteDevLog,
  getDevSnippets, addDevSnippet, updateDevSnippet, deleteDevSnippet,
}

// ── Dev Projects ───────────────────────────────────────────────────────────────

function getDevProjects(pageId) {
  return store.dev_projects.filter(p => p.page_id === pageId).sort((a, b) => a.id - b.id)
}

function addDevProject(pageId, title, description = '', status = 'idea', techStack = '', githubUrl = '', priority = 'medium') {
  const proj = {
    id: nextId('dev_projects'),
    page_id: pageId, title, description, status,
    tech_stack: techStack, github_url: githubUrl, priority,
    created_at: new Date().toISOString(),
  }
  store.dev_projects.push(proj)
  saveStore()
  return proj.id
}

function updateDevProject(id, fields) {
  const proj = store.dev_projects.find(p => p.id === id)
  if (proj) { Object.assign(proj, fields); saveStore() }
}

function deleteDevProject(id) {
  store.dev_projects = store.dev_projects.filter(p => p.id !== id)
  saveStore()
}

// ── Dev Log ────────────────────────────────────────────────────────────────────

function getDevLogs(pageId) {
  return store.dev_logs
    .filter(l => l.page_id === pageId)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id)
}

function addDevLog(pageId, date, title, body = '', tags = '') {
  const entry = {
    id: nextId('dev_logs'),
    page_id: pageId, date, title, body, tags,
    created_at: new Date().toISOString(),
  }
  store.dev_logs.push(entry)
  saveStore()
  return entry.id
}

function updateDevLog(id, fields) {
  const entry = store.dev_logs.find(l => l.id === id)
  if (entry) { Object.assign(entry, fields); saveStore() }
}

function deleteDevLog(id) {
  store.dev_logs = store.dev_logs.filter(l => l.id !== id)
  saveStore()
}

// ── Dev Snippets ───────────────────────────────────────────────────────────────

function getDevSnippets(pageId) {
  return store.dev_snippets.filter(s => s.page_id === pageId).sort((a, b) => a.id - b.id)
}

function addDevSnippet(pageId, title, language, code, description = '', tags = '') {
  const snippet = {
    id: nextId('dev_snippets'),
    page_id: pageId, title, language, code, description, tags,
    created_at: new Date().toISOString(),
  }
  store.dev_snippets.push(snippet)
  saveStore()
  return snippet.id
}

function updateDevSnippet(id, fields) {
  const snippet = store.dev_snippets.find(s => s.id === id)
  if (snippet) { Object.assign(snippet, fields); saveStore() }
}

function deleteDevSnippet(id) {
  store.dev_snippets = store.dev_snippets.filter(s => s.id !== id)
  saveStore()
}

// ── Books ──────────────────────────────────────────────────────────────────

function getBooks() {
  return [...store.books].sort((a, b) => a.id - b.id)
}

function createBook(title, author, status = 'okunacak', totalPages = 0, coverColor = '#2eaadc') {
  const book = {
    id: nextId('books'),
    title, author, status,
    total_pages: totalPages,
    current_page: 0,
    rating: 0,
    cover_color: coverColor,
    created_at: new Date().toISOString(),
  }
  store.books.push(book)
  saveStore()
  return book.id
}

function updateBook(id, fields) {
  const book = store.books.find(b => b.id === id)
  if (book) { Object.assign(book, fields); saveStore() }
}

function deleteBook(id) {
  store.books = store.books.filter(b => b.id !== id)
  saveStore()
}
