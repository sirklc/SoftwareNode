export interface Page {
  id: number
  title: string
  parent_id: number | null
  category_id: number | null
  icon: string
  cover: string
  page_type: 'note' | 'database' | 'calendar' | 'finance' | 'content' | 'group' | 'dev'
  created_at: string
  updated_at: string
}

export interface DevProject {
  id: number
  page_id: number
  title: string
  description: string
  status: 'idea' | 'building' | 'done' | 'archived'
  tech_stack: string
  github_url: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

export interface DevLogEntry {
  id: number
  page_id: number
  date: string
  title: string
  body: string
  tags: string
  created_at: string
}

export interface DevSnippet {
  id: number
  page_id: number
  title: string
  language: string
  code: string
  description: string
  tags: string
  created_at: string
}

export interface SidebarCategory {
  id: number
  name: string
  order: number
  created_at: string
}

export interface DbColumn {
  id: number
  page_id: number
  name: string
  col_type: 'text' | 'number' | 'checkbox' | 'date' | 'select'
  order_index: number
}

export interface DbRow {
  id: number
  page_id: number
  row_data: Record<string, string | number | boolean>
  created_at: string
}

export interface CalendarEvent {
  id: number
  title: string
  event_date: string
  color: string
  note: string
  start_time: string
  end_time: string
  all_day: boolean
  recurring: string
  recurring_days: number[]
  _is_occurrence?: boolean
}

export interface FinanceEntry {
  id: number
  page_id: number
  title: string
  amount: number
  type: 'gelir' | 'gider'
  category: string
  date: string
  note: string
  recurring: 'yok' | 'haftalık' | 'aylık' | 'yıllık'
  calendar_event_id: number | null
  created_at: string
}

export interface Book {
  id: number
  title: string
  author: string
  status: 'okunacak' | 'okunuyor' | 'okundu'
  total_pages: number
  current_page: number
  rating: number
  cover_color: string
  created_at: string
}

export interface Task {
  id: number
  title: string
  due_date: string | null
  category: string
  status: 'todo' | 'done'
  created_at: string
}

export interface ContentItem {
  id: number
  page_id: number
  title: string
  platform: string
  content_type: string
  status: 'fikir' | 'planlandı' | 'çekimde' | 'kurgu' | 'yayında'
  scheduled_date: string
  description: string
  thumbnail_path: string
  tags: string
  calendar_event_id: number | null
  created_at: string
}

declare global {
  interface Window {
    api: {
      getPages: (parentId?: number | null) => Promise<Page[]>
      getAllPages: () => Promise<Page[]>
      getPage: (id: number) => Promise<Page>
      createPage: (title: string, parentId: number | null, icon: string, pageType: string, categoryId?: number | null) => Promise<number>
      updatePage: (id: number, fields: Partial<Page>) => Promise<void>
      deletePage: (id: number) => Promise<void>

      getContent: (pageId: number) => Promise<unknown[]>
      saveContent: (pageId: number, content: unknown[]) => Promise<void>
      getContentByKey: (key: string) => Promise<unknown>
      saveContentByKey: (key: string, content: unknown) => Promise<void>

      getDbColumns: (pageId: number) => Promise<DbColumn[]>
      addDbColumn: (pageId: number, name: string, colType: string) => Promise<number>
      deleteDbColumn: (id: number) => Promise<void>
      renameDbColumn: (id: number, name: string) => Promise<void>
      getDbRows: (pageId: number) => Promise<DbRow[]>
      addDbRow: (pageId: number) => Promise<number>
      updateDbRow: (id: number, rowData: Record<string, unknown>) => Promise<void>
      deleteDbRow: (id: number) => Promise<void>

      getEvents: (year: number, month: number) => Promise<CalendarEvent[]>
      getEventsInRange: (start: string, end: string) => Promise<CalendarEvent[]>
      addEvent: (title: string, date: string, color: string, note: string, startTime?: string, endTime?: string, allDay?: boolean, recurring?: string, recurringDays?: number[]) => Promise<number>
      deleteEvent: (id: number) => Promise<void>
      updateEvent: (id: number, fields: Partial<CalendarEvent>) => Promise<void>

      getFinanceEntries: (pageId: number) => Promise<FinanceEntry[]>
      addFinanceEntry: (pageId: number, title: string, amount: number, type: string, category: string, date: string, note: string, recurring: string) => Promise<number>
      updateFinanceEntry: (id: number, fields: Partial<FinanceEntry>) => Promise<void>
      deleteFinanceEntry: (id: number) => Promise<void>

      getContentItems: (pageId: number) => Promise<ContentItem[]>
      addContentItem: (pageId: number, title: string, platform: string, contentType: string, status: string, scheduledDate: string, description: string, thumbnailPath: string, tags: string) => Promise<number>
      updateContentItem: (id: number, fields: Partial<ContentItem>) => Promise<void>
      deleteContentItem: (id: number) => Promise<void>

      getCategories: () => Promise<import('./types').SidebarCategory[]>
      createCategory: (name: string) => Promise<number>
      updateCategory: (id: number, fields: Partial<import('./types').SidebarCategory>) => Promise<void>
      deleteCategory: (id: number) => Promise<void>
      reorderPages: (pageIds: number[]) => Promise<void>
      reorderCategories: (catIds: number[]) => Promise<void>

      getTasks: () => Promise<Task[]>
      createTask: (title: string, dueDate: string | null, category: string) => Promise<number>
      updateTask: (id: number, fields: Partial<Task>) => Promise<void>
      deleteTask: (id: number) => Promise<void>

      getBooks: () => Promise<Book[]>
      createBook: (title: string, author: string, status: string, totalPages: number, color: string) => Promise<number>
      updateBook: (id: number, fields: Partial<Book>) => Promise<void>
      deleteBook: (id: number) => Promise<void>

      getDevProjects: (pageId: number) => Promise<DevProject[]>
      addDevProject: (pageId: number, title: string, description: string, status: string, techStack: string, githubUrl: string, priority: string) => Promise<number>
      updateDevProject: (id: number, fields: Partial<DevProject>) => Promise<void>
      deleteDevProject: (id: number) => Promise<void>

      getDevLogs: (pageId: number) => Promise<DevLogEntry[]>
      addDevLog: (pageId: number, date: string, title: string, body: string, tags: string) => Promise<number>
      updateDevLog: (id: number, fields: Partial<DevLogEntry>) => Promise<void>
      deleteDevLog: (id: number) => Promise<void>

      getDevSnippets: (pageId: number) => Promise<DevSnippet[]>
      addDevSnippet: (pageId: number, title: string, language: string, code: string, description: string, tags: string) => Promise<number>
      updateDevSnippet: (id: number, fields: Partial<DevSnippet>) => Promise<void>
      deleteDevSnippet: (id: number) => Promise<void>
    }
  }
}
