export interface Page {
  id: number
  title: string
  parent_id: number | null
  icon: string
  cover: string
  page_type: 'note' | 'database' | 'calendar'
  created_at: string
  updated_at: string
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
}

declare global {
  interface Window {
    api: {
      getPages: (parentId?: number | null) => Promise<Page[]>
      getAllPages: () => Promise<Page[]>
      getPage: (id: number) => Promise<Page>
      createPage: (title: string, parentId: number | null, icon: string, pageType: string) => Promise<number>
      updatePage: (id: number, fields: Partial<Page>) => Promise<void>
      deletePage: (id: number) => Promise<void>

      getContent: (pageId: number) => Promise<unknown[]>
      saveContent: (pageId: number, content: unknown[]) => Promise<void>

      getDbColumns: (pageId: number) => Promise<DbColumn[]>
      addDbColumn: (pageId: number, name: string, colType: string) => Promise<number>
      deleteDbColumn: (id: number) => Promise<void>
      renameDbColumn: (id: number, name: string) => Promise<void>
      getDbRows: (pageId: number) => Promise<DbRow[]>
      addDbRow: (pageId: number) => Promise<number>
      updateDbRow: (id: number, rowData: Record<string, unknown>) => Promise<void>
      deleteDbRow: (id: number) => Promise<void>

      getEvents: (year: number, month: number) => Promise<CalendarEvent[]>
      addEvent: (title: string, date: string, color: string, note: string) => Promise<number>
      deleteEvent: (id: number) => Promise<void>
      updateEvent: (id: number, fields: Partial<CalendarEvent>) => Promise<void>
    }
  }
}
