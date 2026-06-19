import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, RefreshCw } from 'lucide-react'
import { Page, CalendarEvent } from '../types'

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const DAYS_LONG = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const COLORS = ['#2eaadc','#e03e3e','#0f7b6c','#cb912f','#9065b0','#c14b8a','#448361']

const HOUR_HEIGHT = 64   // px per hour in time grid
const TIME_START = 6     // 06:00
const TIME_END = 23      // until 23:00
const HOURS = Array.from({ length: TIME_END - TIME_START }, (_, i) => TIME_START + i)

type ViewMode = 'month' | 'week' | 'day'

// ── Helpers ───────────────────────────────────────────────────────────────────

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

const getMondayOfWeek = (d: Date): Date => {
  const dow = d.getDay() // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon
}

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const timeToMinutes = (t: string) => {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

const timeToY = (t: string): number => {
  const min = timeToMinutes(t) - TIME_START * 60
  return Math.max(0, min * HOUR_HEIGHT / 60)
}

const durationToPx = (start: string, end: string): number => {
  if (!start || !end) return HOUR_HEIGHT
  const diff = timeToMinutes(end) - timeToMinutes(start)
  return Math.max(24, diff * HOUR_HEIGHT / 60)
}

const fmtTime = (t: string) => {
  if (!t) return ''
  const [h, m] = t.split(':')
  return `${h}:${m}`
}

const isToday = (dateStr: string) => dateStr === toDateStr(new Date())

// ── Types ────────────────────────────────────────────────────────────────────

interface EventFormState {
  title: string
  color: string
  note: string
  allDay: boolean
  startTime: string
  endTime: string
  recurring: string
  recurringDays: number[]
}

interface ModalState {
  date: string
  startTime?: string
  event?: CalendarEvent
}

const defaultForm = (date = '', startTime = ''): EventFormState => ({
  title: '', color: COLORS[0], note: '',
  allDay: !startTime,
  startTime: startTime || '09:00',
  endTime: startTime ? addOneHour(startTime) : '10:00',
  recurring: 'yok',
  recurringDays: [],
})

function addOneHour(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const nh = Math.min(h + 1, 23)
  return `${String(nh).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

// ── Event Modal ───────────────────────────────────────────────────────────────

interface EventModalProps {
  modal: ModalState
  onClose: () => void
  onSave: (form: EventFormState) => void
  onDelete?: () => void
}

function EventModal({ modal, onClose, onSave, onDelete }: EventModalProps) {
  const [form, setForm] = useState<EventFormState>(() =>
    modal.event
      ? {
          title: modal.event.title,
          color: modal.event.color,
          note: modal.event.note || '',
          allDay: modal.event.all_day !== false,
          startTime: modal.event.start_time || '09:00',
          endTime: modal.event.end_time || '10:00',
          recurring: modal.event.recurring || 'yok',
          recurringDays: modal.event.recurring_days || [],
        }
      : defaultForm(modal.date, modal.startTime)
  )

  const toggleDay = (d: number) => {
    setForm(f => ({
      ...f,
      recurringDays: f.recurringDays.includes(d)
        ? f.recurringDays.filter(x => x !== d)
        : [...f.recurringDays, d].sort(),
    }))
  }

  const fmtModalDate = (s: string) => {
    if (!s) return ''
    const [y, m, d] = s.split('-')
    return `${d} ${MONTHS[parseInt(m) - 1]} ${y}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-semibold text-[#37352f]">
            {modal.event ? 'Etkinliği Düzenle' : `${fmtModalDate(modal.date)}`}
          </span>
          <button onClick={onClose} className="text-[#9b9a97] hover:text-[#37352f]"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            placeholder="Etkinlik adı..."
            className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && form.title.trim() && onSave(form)}
          />

          {/* All-day toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, allDay: !f.allDay }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.allDay ? 'bg-[#2eaadc]' : 'bg-[#e9e9e7]'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.allDay ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-[13px] text-[#37352f]">Tüm gün</span>
          </div>

          {/* Time inputs (shown when not all-day) */}
          {!form.allDay && (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#9b9a97] flex-shrink-0" />
              <input
                type="time"
                className="flex-1 border border-[#e9e9e7] rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#2eaadc]"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              />
              <span className="text-[#9b9a97] text-[13px]">—</span>
              <input
                type="time"
                className="flex-1 border border-[#e9e9e7] rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#2eaadc]"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          )}

          {/* Recurring */}
          <div className="flex items-center gap-3">
            <RefreshCw size={13} className="text-[#9b9a97] flex-shrink-0" />
            <select
              className="flex-1 border border-[#e9e9e7] rounded-lg px-2 py-1.5 text-[13px] outline-none focus:border-[#2eaadc]"
              value={form.recurring}
              onChange={e => setForm(f => ({ ...f, recurring: e.target.value, recurringDays: [] }))}
            >
              <option value="yok">Tekrar Yok</option>
              <option value="haftalık">Her Hafta (seçili günler)</option>
            </select>
          </div>

          {/* Weekly day selector */}
          {form.recurring === 'haftalık' && (
            <div className="flex gap-1 pl-5">
              {DAYS_SHORT.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`w-8 h-8 rounded-full text-[11px] font-semibold transition-colors ${
                    form.recurringDays.includes(i)
                      ? 'bg-[#2eaadc] text-white'
                      : 'bg-[#f1f1ef] text-[#9b9a97] hover:bg-[#e0e0de]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Color picker */}
          <div className="flex items-center gap-1.5">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>

          <textarea
            rows={2}
            placeholder="Not ekle..."
            className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc] resize-none"
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            disabled={!form.title.trim()}
            onClick={() => onSave(form)}
            className="flex-1 py-2 bg-[#37352f] text-white rounded-lg text-[13px] font-medium disabled:opacity-40 hover:bg-[#2f2d28] transition-colors"
          >
            {modal.event ? 'Güncelle' : 'Kaydet'}
          </button>
          {modal.event && onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-[13px] hover:bg-red-50 transition-colors"
            >
              Sil
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-2 border border-[#e9e9e7] text-[#9b9a97] rounded-lg text-[13px] hover:bg-[#f1f1ef] transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Month View ────────────────────────────────────────────────────────────────

interface MonthViewProps {
  year: number
  month: number
  events: CalendarEvent[]
  onDayClick: (date: string) => void
  onEventClick: (ev: CalendarEvent) => void
}

function MonthView({ year, month, events, onDayClick, onEventClick }: MonthViewProps) {
  const today = toDateStr(new Date())
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7

  const cells: { date: string; day: number; cur: boolean }[] = []
  const prevDays = new Date(year, month - 1, 0).getDate()

  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevDays - i
    const pm = month === 1 ? 12 : month - 1
    const py = month === 1 ? year - 1 : year
    cells.push({ date: `${py}-${String(pm).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, cur: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, cur: true })
  }
  const rem = (7 - cells.length % 7) % 7
  for (let d = 1; d <= rem; d++) {
    const nm = month === 12 ? 1 : month + 1
    const ny = month === 12 ? year + 1 : year
    cells.push({ date: `${ny}-${String(nm).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, cur: false })
  }

  const byDate: Record<string, CalendarEvent[]> = {}
  events.forEach(ev => {
    if (!byDate[ev.event_date]) byDate[ev.event_date] = []
    byDate[ev.event_date].push(ev)
  })

  return (
    <div className="border border-[#e9e9e7] rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 bg-[#f7f7f5] border-b border-[#e9e9e7]">
        {DAYS_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const dayEvs = byDate[cell.date] || []
          const isLastRow = idx >= cells.length - 7
          const isLastCol = (idx + 1) % 7 === 0
          return (
            <div
              key={idx}
              onClick={() => onDayClick(cell.date)}
              className={`min-h-[100px] p-2 cursor-pointer hover:bg-[#f7f7f5] transition-colors ${
                !isLastRow ? 'border-b border-[#e9e9e7]' : ''
              } ${!isLastCol ? 'border-r border-[#e9e9e7]' : ''}`}
            >
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium mb-1 ${
                cell.date === today ? 'bg-[#37352f] text-white'
                : cell.cur ? 'text-[#37352f]' : 'text-[#c7c6c4]'
              }`}>
                {cell.day}
              </div>
              <div className="space-y-0.5">
                {dayEvs.slice(0, 3).map((ev, ei) => (
                  <div
                    key={`${ev.id}-${ei}`}
                    onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                    className="text-[11px] px-1.5 py-0.5 rounded truncate text-white font-medium cursor-pointer hover:opacity-80"
                    style={{ background: ev.color }}
                  >
                    {!ev.all_day && ev.start_time && (
                      <span className="opacity-75 mr-1">{fmtTime(ev.start_time)}</span>
                    )}
                    {ev.recurring && ev.recurring !== 'yok' && <span className="mr-0.5">↻</span>}
                    {ev.title}
                  </div>
                ))}
                {dayEvs.length > 3 && (
                  <div className="text-[11px] text-[#9b9a97] px-1">+{dayEvs.length - 3} daha</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week / Day Time Grid ──────────────────────────────────────────────────────

interface TimeGridProps {
  days: Date[]
  events: CalendarEvent[]
  onSlotClick: (date: string, time: string) => void
  onEventClick: (ev: CalendarEvent) => void
}

function TimeGrid({ days, events, onSlotClick, onEventClick }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = toDateStr(new Date())

  useEffect(() => {
    // Scroll to 7:00
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (7 - TIME_START) * HOUR_HEIGHT
    }
  }, [])

  const byDate: Record<string, CalendarEvent[]> = {}
  const allDayEvs: Record<string, CalendarEvent[]> = {}

  events.forEach(ev => {
    const d = ev.event_date
    if (ev.all_day !== false || !ev.start_time) {
      if (!allDayEvs[d]) allDayEvs[d] = []
      allDayEvs[d].push(ev)
    } else {
      if (!byDate[d]) byDate[d] = []
      byDate[d].push(ev)
    }
  })

  const handleGridClick = (dateStr: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const hour = Math.floor(y / HOUR_HEIGHT) + TIME_START
    const minute = Math.round((y % HOUR_HEIGHT) / HOUR_HEIGHT * 2) * 30
    const h = Math.min(hour, TIME_END - 1)
    const m = minute >= 60 ? 0 : minute
    const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
    onSlotClick(dateStr, timeStr)
  }

  const totalHeight = HOURS.length * HOUR_HEIGHT

  return (
    <div className="flex-1 flex flex-col overflow-hidden border border-[#e9e9e7] rounded-xl">
      {/* All-day row */}
      <div className="flex border-b border-[#e9e9e7] bg-[#f7f7f5] flex-shrink-0">
        <div className="w-14 flex-shrink-0 border-r border-[#e9e9e7] px-1 py-1 text-[10px] text-[#9b9a97] text-right">
          Tüm gün
        </div>
        {days.map((day, di) => {
          const dateStr = toDateStr(day)
          const evs = allDayEvs[dateStr] || []
          return (
            <div
              key={di}
              className={`flex-1 min-h-[32px] border-r last:border-r-0 border-[#e9e9e7] p-1 ${dateStr === today ? 'bg-blue-50/40' : ''}`}
              onClick={() => onSlotClick(dateStr, '')}
            >
              {evs.map((ev, ei) => (
                <div
                  key={`${ev.id}-${ei}`}
                  onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                  className="text-[11px] px-1.5 py-0.5 rounded text-white truncate font-medium mb-0.5 cursor-pointer hover:opacity-80"
                  style={{ background: ev.color }}
                >
                  {ev.recurring && ev.recurring !== 'yok' && '↻ '}{ev.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: totalHeight }}>
          {/* Hour labels */}
          <div className="w-14 flex-shrink-0 relative border-r border-[#e9e9e7]">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[11px] text-[#9b9a97] leading-none"
                style={{ top: (h - TIME_START) * HOUR_HEIGHT - 6 }}
              >
                {String(h).padStart(2,'0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => {
            const dateStr = toDateStr(day)
            const dayEvs = byDate[dateStr] || []
            return (
              <div
                key={di}
                className={`flex-1 relative border-r last:border-r-0 border-[#e9e9e7] cursor-pointer ${dateStr === today ? 'bg-blue-50/20' : ''}`}
                style={{ height: totalHeight }}
                onClick={e => handleGridClick(dateStr, e)}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-[#f1f1ef]"
                    style={{ top: (h - TIME_START) * HOUR_HEIGHT }}
                  />
                ))}
                {/* Half-hour lines */}
                {HOURS.map(h => (
                  <div
                    key={`half-${h}`}
                    className="absolute w-full border-t border-dashed border-[#f7f7f5]"
                    style={{ top: (h - TIME_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Events */}
                {dayEvs.map((ev, ei) => {
                  const top = timeToY(ev.start_time)
                  const height = durationToPx(ev.start_time, ev.end_time)
                  return (
                    <div
                      key={`${ev.id}-${ei}`}
                      onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                      className="absolute left-1 right-1 rounded-md px-1.5 py-1 text-white text-[11px] font-medium overflow-hidden cursor-pointer hover:opacity-90 shadow-sm"
                      style={{ top, height: height - 2, background: ev.color, zIndex: 1 }}
                    >
                      <div className="font-semibold truncate">
                        {ev.recurring && ev.recurring !== 'yok' && '↻ '}{ev.title}
                      </div>
                      {height > 32 && (
                        <div className="opacity-80 text-[10px]">{fmtTime(ev.start_time)} – {fmtTime(ev.end_time)}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main CalendarView ─────────────────────────────────────────────────────────

interface Props { page?: Page }

export function CalendarView({ page }: Props) {
  const todayDate = new Date()
  const [view, setView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [modal, setModal] = useState<ModalState | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const getDateRange = useCallback((): { start: string; end: string } => {
    if (view === 'month') {
      const start = `${year}-${String(month).padStart(2,'0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const end = `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`
      // Include prev/next month padding weeks
      const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7
      const padStart = addDays(new Date(start), -firstDow)
      const padEnd = addDays(new Date(end), 14)
      return { start: toDateStr(padStart), end: toDateStr(padEnd) }
    } else if (view === 'week') {
      const mon = getMondayOfWeek(currentDate)
      return { start: toDateStr(mon), end: toDateStr(addDays(mon, 6)) }
    } else {
      const d = toDateStr(currentDate)
      return { start: d, end: d }
    }
  }, [view, currentDate, year, month])

  const loadEvents = useCallback(async () => {
    const { start, end } = getDateRange()
    const evs = await window.api.getEventsInRange(start, end)
    setEvents(evs)
  }, [getDateRange])

  useEffect(() => { loadEvents() }, [loadEvents])

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setCurrentDate(d)
  }

  const goToday = () => setCurrentDate(new Date())

  // Header label
  const headerLabel = (() => {
    if (view === 'month') return `${MONTHS[month - 1]} ${year}`
    if (view === 'week') {
      const mon = getMondayOfWeek(currentDate)
      const sun = addDays(mon, 6)
      if (mon.getMonth() === sun.getMonth())
        return `${mon.getDate()} – ${sun.getDate()} ${MONTHS[mon.getMonth()]} ${mon.getFullYear()}`
      return `${mon.getDate()} ${MONTHS_SHORT[mon.getMonth()]} – ${sun.getDate()} ${MONTHS_SHORT[sun.getMonth()]} ${sun.getFullYear()}`
    }
    return `${DAYS_LONG[(currentDate.getDay() + 6) % 7]}, ${currentDate.getDate()} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  })()

  // Week view day headers
  const weekDays = (() => {
    const mon = getMondayOfWeek(currentDate)
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
  })()

  // Open modal for adding
  const openAdd = (date: string, startTime?: string) => {
    setModal({ date, startTime })
  }

  // Open modal for editing
  const openEdit = (ev: CalendarEvent) => {
    setModal({ date: ev.event_date, event: ev })
  }

  const handleSave = async (form: EventFormState) => {
    if (!form.title.trim()) return
    if (modal?.event) {
      await window.api.updateEvent(modal.event.id, {
        title: form.title,
        color: form.color,
        note: form.note,
        start_time: form.allDay ? '' : form.startTime,
        end_time: form.allDay ? '' : form.endTime,
        all_day: form.allDay,
        recurring: form.recurring,
        recurring_days: form.recurringDays,
      })
    } else if (modal) {
      await window.api.addEvent(
        form.title, modal.date, form.color, form.note,
        form.allDay ? '' : form.startTime,
        form.allDay ? '' : form.endTime,
        form.allDay,
        form.recurring,
        form.recurringDays,
      )
    }
    setModal(null)
    loadEvents()
  }

  const handleDelete = async () => {
    if (modal?.event) {
      await window.api.deleteEvent(modal.event.id)
      setModal(null)
      loadEvents()
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="max-w-[1200px] w-full mx-auto px-8 py-6 flex flex-col flex-1 overflow-hidden">
        {/* Title */}
        <h1 className="text-[32px] font-bold text-[#37352f] mb-5 flex-shrink-0">{page?.title ?? 'Takvim'}</h1>

        {/* Nav bar */}
        <div className="flex items-center gap-3 mb-5 flex-shrink-0">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-[#efefef] transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[17px] font-semibold text-[#37352f] min-w-[200px] text-center">{headerLabel}</span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded hover:bg-[#efefef] transition-colors">
            <ChevronRight size={16} />
          </button>
          <button onClick={goToday} className="ml-1 px-3 py-1 text-[13px] border border-[#e9e9e7] rounded-lg hover:bg-[#f1f1ef] transition-colors">
            Bugün
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* View switcher */}
          <div className="flex p-1 bg-[#f1f1ef] rounded-lg">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => {
              const labels = { day: 'Gün', week: 'Hafta', month: 'Ay' }
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                    view === v ? 'bg-white text-[#37352f] shadow-sm' : 'text-[#9b9a97] hover:text-[#37352f]'
                  }`}
                >
                  {labels[v]}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => openAdd(toDateStr(currentDate))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#37352f] text-white rounded-lg text-[13px] hover:bg-[#2f2d28] transition-colors"
          >
            <Plus size={13} /> Ekle
          </button>
        </div>

        {/* Views */}
        {view === 'month' && (
          <div className="overflow-auto flex-1">
            <MonthView
              year={year}
              month={month}
              events={events}
              onDayClick={date => openAdd(date)}
              onEventClick={openEdit}
            />
          </div>
        )}

        {view === 'week' && (
          <>
            {/* Day headers */}
            <div className="flex flex-shrink-0 border-t border-l border-r border-[#e9e9e7] rounded-t-xl overflow-hidden bg-[#f7f7f5]">
              <div className="w-14 flex-shrink-0 border-r border-[#e9e9e7]" />
              {weekDays.map((d, i) => {
                const dateStr = toDateStr(d)
                const isT = dateStr === toDateStr(new Date())
                return (
                  <div key={i} className="flex-1 py-2 text-center border-r last:border-r-0 border-[#e9e9e7]">
                    <div className="text-[11px] text-[#9b9a97] uppercase tracking-wide font-semibold">{DAYS_SHORT[i]}</div>
                    <div className={`mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-[15px] font-semibold ${isT ? 'bg-[#37352f] text-white' : 'text-[#37352f]'}`}>
                      {d.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
            <TimeGrid
              days={weekDays}
              events={events}
              onSlotClick={(date, time) => openAdd(date, time || undefined)}
              onEventClick={openEdit}
            />
          </>
        )}

        {view === 'day' && (
          <>
            <div className="flex flex-shrink-0 border-t border-l border-r border-[#e9e9e7] rounded-t-xl overflow-hidden bg-[#f7f7f5]">
              <div className="w-14 flex-shrink-0 border-r border-[#e9e9e7]" />
              <div className="flex-1 py-2 text-center">
                <div className="text-[11px] text-[#9b9a97] uppercase tracking-wide font-semibold">
                  {DAYS_SHORT[(currentDate.getDay() + 6) % 7]}
                </div>
                <div className={`mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-[15px] font-semibold ${isToday(toDateStr(currentDate)) ? 'bg-[#37352f] text-white' : 'text-[#37352f]'}`}>
                  {currentDate.getDate()}
                </div>
              </div>
            </div>
            <TimeGrid
              days={[currentDate]}
              events={events}
              onSlotClick={(date, time) => openAdd(date, time || undefined)}
              onEventClick={openEdit}
            />
          </>
        )}
      </div>

      {modal && (
        <EventModal
          modal={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.event ? handleDelete : undefined}
        />
      )}
    </div>
  )
}
