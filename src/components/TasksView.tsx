import React, { useEffect, useState } from 'react'
import { CheckSquare, Square, Trash2, Plus, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { Task } from '../types'

const CATEGORIES = ['Genel', 'İş', 'Kişisel', 'Proje']

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function weekEndStr() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function isPast(dateStr: string) {
  return dateStr < todayStr()
}

function isToday(dateStr: string) {
  return dateStr === todayStr()
}

function isThisWeek(dateStr: string) {
  return dateStr > todayStr() && dateStr <= weekEndStr()
}

// ── Task Row ──────────────────────────────────────────────────────────────────

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
  const today = !done && task.due_date && isToday(task.due_date)

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f7f5] group transition-colors">
      <button
        onClick={onToggle}
        className={`flex-shrink-0 transition-colors ${done ? 'text-green-500' : 'text-[#9b9a97] hover:text-[#37352f]'}`}
      >
        {done ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>
      <span className={`flex-1 text-[13.5px] min-w-0 truncate ${done ? 'line-through text-[#9b9a97]' : 'text-[#37352f]'}`}>
        {task.title}
      </span>
      <span className="text-[11px] text-[#9b9a97] bg-[#f1f1ef] px-1.5 py-0.5 rounded flex-shrink-0 hidden group-hover:inline">
        {task.category}
      </span>
      {task.due_date && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 ${
          done    ? 'text-[#9b9a97]'
          : overdue ? 'bg-red-50 text-red-500'
          : today   ? 'bg-orange-50 text-orange-500'
          : 'bg-[#f1f1ef] text-[#9b9a97]'
        }`}>
          {done ? fmtDate(task.due_date) : overdue ? `${fmtDate(task.due_date)} - Gecikti` : fmtDate(task.due_date)}
        </span>
      )}
      <button
        onClick={onDelete}
        className="hidden group-hover:flex text-[#9b9a97] hover:text-red-500 transition-colors flex-shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Add Task Row ──────────────────────────────────────────────────────────────

function AddTaskRow({
  onAdd,
  defaultDate,
}: {
  onAdd: (title: string, dueDate: string | null, category: string) => void
  defaultDate?: string
}) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(defaultDate || '')
  const [category, setCategory] = useState('Genel')

  const submit = () => {
    if (!title.trim()) { setActive(false); setTitle(''); return }
    onAdd(title.trim(), dueDate || null, category)
    setTitle('')
    setDueDate(defaultDate || '')
    setCategory('Genel')
    setActive(false)
  }

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="flex items-center gap-2 px-4 py-2.5 w-full text-left text-[13px] text-[#9b9a97] hover:text-[#37352f] hover:bg-[#f7f7f5] transition-colors"
      >
        <Plus size={14} />
        <span>Yeni görev ekle</span>
      </button>
    )
  }

  return (
    <div className="px-4 py-2.5 border-t border-[#e9e9e7] bg-[#fafafa]">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') { setActive(false); setTitle('') }
        }}
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

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  tasks,
  onToggle,
  onDelete,
  onAdd,
  addDefaultDate,
  accent,
  collapsible = false,
}: {
  title: string
  icon: React.ReactNode
  tasks: Task[]
  onToggle: (t: Task) => void
  onDelete: (id: number) => void
  onAdd?: (title: string, dueDate: string | null, category: string) => void
  addDefaultDate?: string
  accent?: string
  collapsible?: boolean
}) {
  const [collapsed, setCollapsed] = useState(collapsible)

  return (
    <section className="mb-6">
      <button
        onClick={() => collapsible && setCollapsed(v => !v)}
        className={`flex items-center gap-2 mb-2 w-full text-left ${collapsible ? 'hover:opacity-70' : ''}`}
      >
        <span className={accent || 'text-[#9b9a97]'}>{icon}</span>
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${accent || 'text-[#9b9a97]'}`}>{title}</span>
        <span className="text-[11px] text-[#9b9a97] ml-1">({tasks.length})</span>
        {collapsible && (
          <span className="text-[10px] text-[#9b9a97] ml-auto">{collapsed ? '▸' : '▾'}</span>
        )}
      </button>

      {!collapsed && (
        <div className="border border-[#e9e9e7] rounded-xl overflow-hidden bg-white">
          {tasks.length === 0 && !onAdd && (
            <p className="px-4 py-3 text-[13px] text-[#9b9a97]">Görev yok</p>
          )}
          {tasks.map((task, i) => (
            <div key={task.id} className={i < tasks.length - 1 || onAdd ? 'border-b border-[#e9e9e7]' : ''}>
              <TaskRow task={task} onToggle={() => onToggle(task)} onDelete={() => onDelete(task.id)} />
            </div>
          ))}
          {onAdd && <AddTaskRow onAdd={onAdd} defaultDate={addDefaultDate} />}
        </div>
      )}
    </section>
  )
}

// ── TasksView ─────────────────────────────────────────────────────────────────

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([])

  const load = () =>
    window.api.getTasks().then(setTasks).catch(err => console.error('getTasks:', err))

  useEffect(() => { load() }, [])

  const addTask = async (title: string, dueDate: string | null, category: string) => {
    await window.api.createTask(title, dueDate, category)
    load()
  }

  const toggleTask = async (task: Task) => {
    await window.api.updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
    load()
  }

  const deleteTask = async (id: number) => {
    await window.api.deleteTask(id)
    load()
  }

  const today = todayStr()
  const weekEnd = weekEndStr()

  const overdue    = tasks.filter(t => t.status === 'todo' && t.due_date && t.due_date < today)
  const todayTasks = tasks.filter(t => t.status === 'todo' && t.due_date === today)
  const thisWeek   = tasks.filter(t => t.status === 'todo' && t.due_date && t.due_date > today && t.due_date <= weekEnd)
  const upcoming   = tasks.filter(t => t.status === 'todo' && t.due_date && t.due_date > weekEnd)
  const noDue      = tasks.filter(t => t.status === 'todo' && !t.due_date)
  const done       = tasks.filter(t => t.status === 'done')

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-[720px] mx-auto px-10 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <CheckSquare size={28} className="text-[#37352f]" />
          <div>
            <h1 className="text-[28px] font-bold text-[#37352f]">Görevlerim</h1>
            <p className="text-[13px] text-[#9b9a97]">
              {tasks.filter(t => t.status === 'todo').length} bekleyen · {done.length} tamamlandı
            </p>
          </div>
        </div>

        {overdue.length > 0 && (
          <Section
            title="Gecikmiş"
            icon={<AlertTriangle size={13} />}
            tasks={overdue}
            onToggle={toggleTask}
            onDelete={deleteTask}
            accent="text-red-500"
          />
        )}

        <Section
          title="Bugün"
          icon={<Clock size={13} />}
          tasks={todayTasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onAdd={addTask}
          addDefaultDate={today}
          accent="text-orange-500"
        />

        {thisWeek.length > 0 && (
          <Section
            title="Bu Hafta"
            icon={<Calendar size={13} />}
            tasks={thisWeek}
            onToggle={toggleTask}
            onDelete={deleteTask}
            accent="text-blue-500"
          />
        )}

        {upcoming.length > 0 && (
          <Section
            title="Yaklaşan"
            icon={<Calendar size={13} />}
            tasks={upcoming}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}

        <Section
          title="Tarihsiz"
          icon={<Square size={13} />}
          tasks={noDue}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onAdd={addTask}
        />

        {done.length > 0 && (
          <Section
            title="Tamamlandı"
            icon={<CheckSquare size={13} />}
            tasks={done}
            onToggle={toggleTask}
            onDelete={deleteTask}
            collapsible
          />
        )}

        <div className="h-16" />
      </div>
    </div>
  )
}
