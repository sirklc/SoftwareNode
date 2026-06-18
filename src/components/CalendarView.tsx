import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { Page, CalendarEvent } from '../types'

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const COLORS = ['#2eaadc','#e03e3e','#0f7b6c','#cb912f','#9065b0','#c14b8a','#448361']

interface Props { page: Page }

interface EventModalProps {
  date: string
  events: CalendarEvent[]
  onClose: () => void
  onAdd: (title: string, color: string) => void
  onDelete: (id: number) => void
}

function EventModal({ date, events, onClose, onAdd, onDelete }: EventModalProps) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(COLORS[0])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-80 p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-[14px] text-[#37352f]">{date}</span>
          <button onClick={onClose} className="text-[#9b9a97] hover:text-[#37352f]"><X size={16} /></button>
        </div>

        {events.map(ev => (
          <div key={ev.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#f1f1ef] group">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ev.color }} />
              <span className="text-[13px] text-[#37352f]">{ev.title}</span>
            </div>
            <button
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
              onClick={() => onDelete(ev.id)}
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <div className="mt-3 border-t border-[#e9e9e7] pt-3 space-y-2">
          <input
            autoFocus
            placeholder="Etkinlik ekle..."
            className="w-full text-[13px] border border-[#e9e9e7] rounded-lg px-3 py-2 outline-none focus:border-[#2eaadc] placeholder-[#9b9a97]"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && title.trim()) {
                onAdd(title.trim(), color)
                setTitle('')
              }
            }}
          />
          <div className="flex items-center gap-1.5">
            {COLORS.map(c => (
              <button
                key={c}
                className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button
            disabled={!title.trim()}
            className="w-full bg-[#37352f] text-white text-[13px] rounded-lg py-2 disabled:opacity-40"
            onClick={() => { if (title.trim()) { onAdd(title.trim(), color); setTitle('') } }}
          >
            Ekle
          </button>
        </div>
      </div>
    </div>
  )
}

export function CalendarView({ page }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [modal, setModal] = useState<string | null>(null)

  const loadEvents = async () => {
    const ev = await window.api.getEvents(year, month)
    setEvents(ev)
  }

  useEffect(() => { loadEvents() }, [year, month, page.id])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }

  const addEvent = async (title: string, color: string) => {
    if (!modal) return
    await window.api.addEvent(title, modal, color, '')
    loadEvents()
  }

  const deleteEvent = async (id: number) => {
    await window.api.deleteEvent(id)
    loadEvents()
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0
  const prevDays = new Date(year, month - 1, 0).getDate()

  const cells: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = []

  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevDays - i
    const pm = month === 1 ? 12 : month - 1
    const py = month === 1 ? year - 1 : year
    cells.push({ date: `${py}-${String(pm).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, isCurrentMonth: false, isToday: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d
    cells.push({ date: dateStr, day: d, isCurrentMonth: true, isToday })
  }

  const remaining = (7 - (cells.length % 7)) % 7
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 12 ? 1 : month + 1
    const ny = month === 12 ? year + 1 : year
    cells.push({ date: `${ny}-${String(nm).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, isCurrentMonth: false, isToday: false })
  }

  const eventsByDate: Record<string, CalendarEvent[]> = {}
  events.forEach(ev => {
    if (!eventsByDate[ev.event_date]) eventsByDate[ev.event_date] = []
    eventsByDate[ev.event_date].push(ev)
  })

  const modalEvents = modal ? (eventsByDate[modal] || []) : []

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[1200px] mx-auto px-12 py-10">
        {/* Title */}
        <h1 className="text-[40px] font-bold text-[#37352f] mb-6">{page.title}</h1>

        {/* Nav */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-[#efefef] transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[18px] font-semibold text-[#37352f] min-w-[160px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-[#efefef] transition-colors">
            <ChevronRight size={16} />
          </button>
          <button onClick={goToday} className="ml-2 px-3 py-1 text-[13px] border border-[#e9e9e7] rounded-lg hover:bg-[#f1f1ef] transition-colors">
            Bugün
          </button>
        </div>

        {/* Grid */}
        <div className="border border-[#e9e9e7] rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-[#f7f7f5] border-b border-[#e9e9e7]">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-[12px] font-semibold text-[#9b9a97] uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.date] || []
              const isLastRow = idx >= cells.length - 7
              const isLastCol = (idx + 1) % 7 === 0
              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 cursor-pointer hover:bg-[#f7f7f5] transition-colors ${
                    !isLastRow ? 'border-b border-[#e9e9e7]' : ''
                  } ${!isLastCol ? 'border-r border-[#e9e9e7]' : ''}`}
                  onClick={() => setModal(cell.date)}
                >
                  {/* Day number */}
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium mb-1 ${
                    cell.isToday
                      ? 'bg-[#37352f] text-white'
                      : cell.isCurrentMonth
                      ? 'text-[#37352f]'
                      : 'text-[#c7c6c4]'
                  }`}>
                    {cell.day}
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[11px] px-1.5 py-0.5 rounded truncate text-white font-medium"
                        style={{ background: ev.color }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[11px] text-[#9b9a97] px-1">+{dayEvents.length - 3} daha</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {modal && (
        <EventModal
          date={modal}
          events={modalEvents}
          onClose={() => setModal(null)}
          onAdd={addEvent}
          onDelete={deleteEvent}
        />
      )}
    </div>
  )
}
