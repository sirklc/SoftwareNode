import React, { useEffect, useState, useRef } from 'react'
import { CheckSquare, Square, Trash2, Plus, Calendar, Clock, FileText } from 'lucide-react'
import { Task, CalendarEvent, Page } from '../types'
import { usePageStore } from '../store/usePageStore'

const CATEGORIES = ['Genel', 'İş', 'Kişisel', 'Proje']


function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return 'İyi geceler'
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi öğleden sonralar'
  return 'İyi akşamlar'
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short',
  })
}

function daysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000)
  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Yarın'
  if (diff < 0)  return `${Math.abs(diff)} gün geçti`
  return `${diff} gün sonra`
}

function isPast(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getTime() < Date.now()
}

// ── TaskRow ────────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onDelete: () => void
}) {
  const done = task.status === 'done'
  const overdue = !done && task.due_date && isPast(task.due_date)

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f7f7] group transition-colors">
      <button onClick={onToggle} className={`flex-shrink-0 transition-colors ${done ? 'text-green-500' : 'text-[#9b9a97] hover:text-[#37352f]'}`}>
        {done ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>
      <span className={`flex-1 text-[13.5px] min-w-0 truncate ${done ? 'line-through text-[#9b9a97]' : 'text-[#37352f]'}`}>
        {task.title}
      </span>
      {task.due_date && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 ${
          done ? 'text-[#9b9a97]'
          : overdue ? 'bg-red-50 text-red-500'
          : 'bg-[#f1f1ef] text-[#9b9a97]'
        }`}>
          {done ? formatDate(task.due_date) : daysUntil(task.due_date)}
        </span>
      )}
      <span className="text-[11px] text-[#9b9a97] bg-[#f1f1ef] px-1.5 py-0.5 rounded flex-shrink-0 hidden group-hover:inline">
        {task.category}
      </span>
      <button
        onClick={onDelete}
        className="hidden group-hover:flex text-[#9b9a97] hover:text-red-500 transition-colors flex-shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── AddTaskRow ─────────────────────────────────────────────────────────────────

function AddTaskRow({ onAdd }: { onAdd: (title: string, dueDate: string | null, category: string) => void }) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('Genel')
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!title.trim()) { setActive(false); setTitle(''); return }
    onAdd(title.trim(), dueDate || null, category)
    setTitle('')
    setDueDate('')
    setCategory('Genel')
    setActive(false)
  }

  if (!active) {
    return (
      <button
        onClick={() => { setActive(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        className="flex items-center gap-2 px-4 py-2.5 w-full text-left text-[13px] text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f7f7] transition-colors"
      >
        <Plus size={14} />
        <span>Yeni görev ekle</span>
      </button>
    )
  }

  return (
    <div className="px-4 py-2.5 border-t border-[#e9e9e7] bg-[#fafafa]">
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setActive(false); setTitle('') } }}
        placeholder="Görev başlığı..."
        className="w-full text-[13.5px] text-[#37352f] bg-transparent outline-none placeholder:text-[#9b9a97] mb-2"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 border border-[#e9e9e7] rounded px-2 py-1">
          <Calendar size={11} className="text-[#9b9a97]" />
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="text-[11px] text-[#37352f] bg-transparent outline-none"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="text-[11px] text-[#37352f] border border-[#e9e9e7] rounded px-2 py-1 bg-white outline-none"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={submit} className="text-[11px] bg-[#37352f] text-white rounded px-3 py-1 hover:bg-[#2d2b28] transition-colors">
          Ekle
        </button>
        <button onClick={() => { setActive(false); setTitle('') }} className="text-[11px] text-[#9b9a97] hover:text-[#37352f] px-2 py-1">
          İptal
        </button>
      </div>
    </div>
  )
}

// ── RecentCard ─────────────────────────────────────────────────────────────────

function RecentCard({ page, onClick }: { page: Page; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 p-4 w-[160px] min-w-[160px] border border-[#e9e9e7] rounded-xl hover:bg-[#f7f7f7] hover:border-[#d9d9d7] transition-all text-left"
    >
      <span className="text-3xl leading-none">{page.icon || '📄'}</span>
      <span className="text-[13px] font-medium text-[#37352f] truncate w-full">{page.title || 'Başlıksız'}</span>
    </button>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────────

export function Home() {
  const { pages, recentPageIds, selectPage } = usePageStore()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showDone, setShowDone] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const todayStr = now.toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const textPrimary   = 'text-[#37352f]'
  const textSecondary = 'text-[#9b9a97]'
  const glass         = 'bg-white border border-[#e9e9e7]'
  const glassHover    = 'hover:bg-[#f7f7f5]'

  const recentPages = recentPageIds
    .map(id => pages.find(p => p.id === id))
    .filter(Boolean) as Page[]

  const loadTasks = () =>
    window.api.getTasks().then(setTasks).catch(err => console.error('getTasks failed:', err))

  useEffect(() => {
    const today = new Date()
    const in7 = new Date(today); in7.setDate(today.getDate() + 7)
    const start = today.toISOString().slice(0, 10)
    const end = in7.toISOString().slice(0, 10)
    window.api.getEventsInRange(start, end).then(setEvents).catch(err => console.error('getEventsInRange failed:', err))
    loadTasks()
  }, [])

  const addTask = async (title: string, dueDate: string | null, category: string) => {
    try {
      await window.api.createTask(title, dueDate, category)
      loadTasks()
    } catch (err) {
      console.error('createTask failed:', err)
    }
  }

  const toggleTask = async (task: Task) => {
    try {
      await window.api.updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
      loadTasks()
    } catch (err) {
      console.error('updateTask failed:', err)
    }
  }

  const deleteTask = async (id: number) => {
    try {
      await window.api.deleteTask(id)
      loadTasks()
    } catch (err) {
      console.error('deleteTask failed:', err)
    }
  }

  const pending = tasks.filter(t => t.status === 'todo')
  const done    = tasks.filter(t => t.status === 'done')

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-[820px] mx-auto px-12 py-12">

        {/* Greeting */}
        <div className="mb-10">
          <h1 className={`text-[38px] font-bold tracking-tight ${textPrimary}`}>{getGreeting()} 👋</h1>
          <p className={`text-[13px] mt-1 capitalize ${textSecondary}`}>{todayStr}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Toplam Sayfa', value: pages.length, icon: <FileText size={16} className="text-blue-400" /> },
            { label: 'Bu Hafta Etkinlik', value: events.length, icon: <Calendar size={16} className="text-purple-400" /> },
            { label: 'Bekleyen Görev', value: pending.length, icon: <CheckSquare size={16} className="text-green-500" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className={`flex items-center gap-3 p-4 border rounded-xl ${glass}`}>
              {icon}
              <div>
                <p className={`text-[22px] font-bold leading-none ${textPrimary}`}>{value}</p>
                <p className={`text-[11px] mt-0.5 ${textSecondary}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recently Visited */}
        {recentPages.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} className={textSecondary} />
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${textSecondary}`}>Son Açılanlar</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {recentPages.map(page => (
                <button
                  key={page.id}
                  onClick={() => selectPage(page.id, page.page_type)}
                  className={`flex flex-col gap-3 p-4 w-[160px] min-w-[160px] border rounded-xl transition-all text-left ${glass} ${glassHover}`}
                >
                  <span className="text-3xl leading-none">{page.icon || '📄'}</span>
                  <span className={`text-[13px] font-medium truncate w-full ${textPrimary}`}>{page.title || 'Başlıksız'}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={13} className={textSecondary} />
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${textSecondary}`}>Yaklaşan Etkinlikler</span>
          </div>
          <div className={`border rounded-xl overflow-hidden ${glass}`}>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar size={32} className={`mb-3 opacity-30 ${textPrimary}`} />
                <p className={`text-[13px] ${textSecondary}`}>Önümüzdeki 7 günde etkinlik yok</p>
              </div>
            ) : (
              <div>
                {events.slice(0, 6).map((ev, i) => (
                  <div
                    key={`${ev.id}-${ev.event_date}-${i}`}
                    className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 border-black/5 ${glassHover} transition-colors`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ev.color || '#2eaadc' }} />
                    <span className={`flex-1 text-[13.5px] truncate ${textPrimary}`}>{ev.title}</span>
                    <span className={`text-[11px] flex-shrink-0 ${textSecondary}`}>{formatDate(ev.event_date)}</span>
                    {ev.start_time && (
                      <span className={`text-[11px] flex-shrink-0 ${textSecondary}`}>{ev.start_time}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={13} className={textSecondary} />
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${textSecondary}`}>Görevlerim</span>
            </div>
            {done.length > 0 && (
              <button
                onClick={() => setShowDone(v => !v)}
                className={`text-[11px] transition-colors ${textSecondary} hover:${textPrimary}`}
              >
                {showDone ? 'Tamamlananları gizle' : `${done.length} tamamlandı`}
              </button>
            )}
          </div>

          <div className={`border rounded-xl overflow-hidden ${glass}`}>
            {pending.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckSquare size={28} className={`mb-2 opacity-30 ${textPrimary}`} />
                <p className={`text-[13px] ${textSecondary}`}>Bekleyen görev yok</p>
              </div>
            )}
            {pending.map(task => (
              <div key={task.id} className={`border-b last:border-0 border-black/5`}>
                <TaskRow task={task} onToggle={() => toggleTask(task)} onDelete={() => deleteTask(task.id)} />
              </div>
            ))}
            <AddTaskRow onAdd={addTask} />
          </div>

          {/* Completed tasks */}
          {showDone && done.length > 0 && (
            <div className={`mt-4 border rounded-xl overflow-hidden opacity-60 ${glass}`}>
              {done.map(task => (
                <div key={task.id} className={`border-b last:border-0 border-black/5`}>
                  <TaskRow task={task} onToggle={() => toggleTask(task)} onDelete={() => deleteTask(task.id)} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom padding */}
        <div className="h-16" />
      </div>
    </div>
  )
}
