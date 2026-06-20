import React, { useEffect, useState, useRef } from 'react'
import { Plus, X, Edit2, Trash2, ExternalLink, Copy, Check, Code2, BookOpen, LayoutList, Columns3 } from 'lucide-react'
import { Page, DevProject, DevLogEntry, DevSnippet } from '../types'

// ── Constants ──────────────────────────────────────────────────────────────────

type ProjectStatus = DevProject['status']
type ProjectPriority = DevProject['priority']
type TabId = 'board' | 'projects' | 'devlog' | 'snippets'

const STATUSES: ProjectStatus[] = ['idea', 'building', 'done', 'archived']
const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: 'Fikir', building: 'Geliştirmede', done: 'Tamamlandı', archived: 'Arşiv'
}
const STATUS_COLORS: Record<ProjectStatus, string> = {
  idea: '#cb912f', building: '#2eaadc', done: '#0f7b6c', archived: '#9b9a97'
}
const STATUS_ICONS: Record<ProjectStatus, string> = {
  idea: '💡', building: '🔨', done: '✅', archived: '📦'
}

const PRIORITIES: ProjectPriority[] = ['high', 'medium', 'low']
const PRIORITY_LABELS: Record<ProjectPriority, string> = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }
const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  high: '#e03e3e', medium: '#cb912f', low: '#0f7b6c'
}

const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C', 'C++',
  'SQL', 'Bash', 'CSS', 'HTML', 'JSON', 'YAML', 'Markdown', 'Diğer'
]
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#cb912f', Python: '#3572a5',
  Rust: '#e03e3e', Go: '#00acd7', Java: '#b07219', C: '#555555', 'C++': '#f34b7d',
  SQL: '#9065b0', Bash: '#37352f', CSS: '#9065b0', HTML: '#e03e3e',
  JSON: '#0f7b6c', YAML: '#0f7b6c', Markdown: '#9b9a97', 'Diğer': '#9b9a97'
}

const today = () => new Date().toISOString().slice(0, 10)

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

// ── Project Card (Board) ───────────────────────────────────────────────────────

function ProjectCard({ proj, onEdit, onDelete, onStatusChange }: {
  proj: DevProject
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (s: ProjectStatus) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const techs = proj.tech_stack ? proj.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="bg-white rounded-xl border border-[#e9e9e7] shadow-sm hover:shadow-md transition-shadow group p-3">
      {/* Priority stripe */}
      <div
        className="h-1 rounded-full mb-3"
        style={{ background: PRIORITY_COLORS[proj.priority] }}
      />

      <p className="text-[14px] font-semibold text-[#37352f] leading-snug mb-1.5 line-clamp-2">
        {proj.title}
      </p>

      {proj.description && (
        <p className="text-[12px] text-[#9b9a97] line-clamp-2 mb-2">{proj.description}</p>
      )}

      {techs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {techs.slice(0, 4).map(t => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
              style={{ background: LANG_COLORS[t] || '#9b9a97' }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#f1f1ef]">
        <div className="flex items-center gap-1.5">
          {/* Status pill */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors hover:opacity-80"
              style={{ background: STATUS_COLORS[proj.status] + '22', color: STATUS_COLORS[proj.status] }}
            >
              {STATUS_ICONS[proj.status]} {STATUS_LABELS[proj.status]}
            </button>
            {menuOpen && (
              <div className="absolute bottom-7 left-0 z-50 bg-white border border-[#e9e9e7] rounded-xl shadow-lg py-1 w-40">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(s); setMenuOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#f1f1ef] transition-colors ${proj.status === s ? 'font-semibold' : ''}`}
                    style={{ color: STATUS_COLORS[s] }}
                  >
                    {STATUS_ICONS[s]} {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GitHub link */}
          {proj.github_url && (
            <a
              href={proj.github_url}
              target="_blank"
              rel="noreferrer"
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f1f1ef] text-[#9b9a97]"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={11} />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f1f1ef] text-[#9b9a97]">
            <Edit2 size={11} />
          </button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-400">
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Snippet Card ───────────────────────────────────────────────────────────────

function SnippetCard({ snippet, onEdit, onDelete }: {
  snippet: DevSnippet
  onEdit: () => void
  onDelete: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(snippet.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#e9e9e7] shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#f1f1ef]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ background: LANG_COLORS[snippet.language] || '#9b9a97' }}
          >
            {snippet.language}
          </span>
          <span className="text-[13px] font-semibold text-[#37352f] truncate">{snippet.title}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={copy}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f1f1ef] text-[#9b9a97] transition-colors"
            title="Kopyala"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
          <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f1f1ef] text-[#9b9a97] opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 size={11} />
          </button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {snippet.description && (
        <p className="px-3 pt-2 text-[12px] text-[#9b9a97]">{snippet.description}</p>
      )}

      <pre className="px-3 py-2.5 text-[11.5px] font-mono text-[#37352f] bg-[#f7f7f5] rounded-b-xl overflow-x-auto leading-relaxed max-h-40 overflow-y-auto">
        {snippet.code}
      </pre>

      {snippet.tags && (
        <div className="px-3 py-2 flex flex-wrap gap-1">
          {snippet.tags.split(',').filter(t => t.trim()).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-[#f1f1ef] text-[#9b9a97] rounded-full">
              #{t.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props { page: Page }

export function DevView({ page }: Props) {
  const [tab, setTab] = useState<TabId>('board')
  const [projects, setProjects] = useState<DevProject[]>([])
  const [logs, setLogs] = useState<DevLogEntry[]>([])
  const [snippets, setSnippets] = useState<DevSnippet[]>([])

  // ── Project modal state
  const [projModal, setProjModal] = useState<false | 'add' | number>(false)
  const [projForm, setProjForm] = useState({
    title: '', description: '', status: 'idea' as ProjectStatus,
    tech_stack: '', github_url: '', priority: 'medium' as ProjectPriority,
  })
  const [defaultColStatus, setDefaultColStatus] = useState<ProjectStatus>('idea')

  // ── Log modal state
  const [logModal, setLogModal] = useState<false | 'add' | number>(false)
  const [logForm, setLogForm] = useState({ date: today(), title: '', body: '', tags: '' })

  // ── Snippet modal state
  const [snipModal, setSnipModal] = useState<false | 'add' | number>(false)
  const [snipForm, setSnipForm] = useState({
    title: '', language: 'TypeScript', code: '', description: '', tags: ''
  })

  // ── Language filter for snippets
  const [langFilter, setLangFilter] = useState('Tümü')

  // ── Loaders
  const loadProjects = () => window.api.getDevProjects(page.id).then(setProjects)
  const loadLogs = () => window.api.getDevLogs(page.id).then(setLogs)
  const loadSnippets = () => window.api.getDevSnippets(page.id).then(setSnippets)

  useEffect(() => {
    loadProjects()
    loadLogs()
    loadSnippets()
  }, [page.id])

  // ── Project CRUD
  const openAddProj = (status: ProjectStatus = 'idea') => {
    setDefaultColStatus(status)
    setProjForm({ title: '', description: '', status, tech_stack: '', github_url: '', priority: 'medium' })
    setProjModal('add')
  }

  const openEditProj = (proj: DevProject) => {
    setProjForm({
      title: proj.title, description: proj.description, status: proj.status,
      tech_stack: proj.tech_stack, github_url: proj.github_url, priority: proj.priority,
    })
    setProjModal(proj.id)
  }

  const saveProj = async () => {
    if (!projForm.title.trim()) return
    if (projModal === 'add') {
      await window.api.addDevProject(
        page.id, projForm.title.trim(), projForm.description,
        projForm.status, projForm.tech_stack, projForm.github_url, projForm.priority
      )
    } else if (typeof projModal === 'number') {
      await window.api.updateDevProject(projModal, {
        title: projForm.title.trim(), description: projForm.description,
        status: projForm.status, tech_stack: projForm.tech_stack,
        github_url: projForm.github_url, priority: projForm.priority,
      })
    }
    setProjModal(false)
    loadProjects()
  }

  const deleteProj = async (id: number) => { await window.api.deleteDevProject(id); loadProjects() }
  const changeProjStatus = async (id: number, status: ProjectStatus) => {
    await window.api.updateDevProject(id, { status }); loadProjects()
  }

  // ── Log CRUD
  const openAddLog = () => { setLogForm({ date: today(), title: '', body: '', tags: '' }); setLogModal('add') }
  const openEditLog = (entry: DevLogEntry) => {
    setLogForm({ date: entry.date, title: entry.title, body: entry.body, tags: entry.tags })
    setLogModal(entry.id)
  }
  const saveLog = async () => {
    if (!logForm.title.trim()) return
    if (logModal === 'add') {
      await window.api.addDevLog(page.id, logForm.date, logForm.title.trim(), logForm.body, logForm.tags)
    } else if (typeof logModal === 'number') {
      await window.api.updateDevLog(logModal, { date: logForm.date, title: logForm.title.trim(), body: logForm.body, tags: logForm.tags })
    }
    setLogModal(false)
    loadLogs()
  }
  const deleteLog = async (id: number) => { await window.api.deleteDevLog(id); loadLogs() }

  // ── Snippet CRUD
  const openAddSnip = () => {
    setSnipForm({ title: '', language: 'TypeScript', code: '', description: '', tags: '' })
    setSnipModal('add')
  }
  const openEditSnip = (s: DevSnippet) => {
    setSnipForm({ title: s.title, language: s.language, code: s.code, description: s.description, tags: s.tags })
    setSnipModal(s.id)
  }
  const saveSnip = async () => {
    if (!snipForm.title.trim() || !snipForm.code.trim()) return
    if (snipModal === 'add') {
      await window.api.addDevSnippet(page.id, snipForm.title.trim(), snipForm.language, snipForm.code, snipForm.description, snipForm.tags)
    } else if (typeof snipModal === 'number') {
      await window.api.updateDevSnippet(snipModal, {
        title: snipForm.title.trim(), language: snipForm.language,
        code: snipForm.code, description: snipForm.description, tags: snipForm.tags,
      })
    }
    setSnipModal(false)
    loadSnippets()
  }
  const deleteSnip = async (id: number) => { await window.api.deleteDevSnippet(id); loadSnippets() }

  // ── Derived data
  const filteredSnippets = langFilter === 'Tümü'
    ? snippets
    : snippets.filter(s => s.language === langFilter)

  const usedLangs = ['Tümü', ...Array.from(new Set(snippets.map(s => s.language)))]

  // ── Tabs config
  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'board',    label: 'Pano',     icon: <Columns3 size={14} /> },
    { id: 'projects', label: 'Projeler', icon: <LayoutList size={14} /> },
    { id: 'devlog',   label: 'DevLog',   icon: <BookOpen size={14} /> },
    { id: 'snippets', label: 'Snippets', icon: <Code2 size={14} /> },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[1400px] mx-auto px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[36px] font-bold text-[#37352f]">{page.icon} {page.title}</h1>
          <div className="flex items-center gap-3 text-[12px] text-[#9b9a97]">
            <span>{projects.filter(p => p.status === 'building').length} aktif proje</span>
            <span>·</span>
            <span>{logs.length} log</span>
            <span>·</span>
            <span>{snippets.length} snippet</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-6 border-b border-[#e9e9e7]">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-[#37352f] text-[#37352f]'
                  : 'border-transparent text-[#9b9a97] hover:text-[#37352f]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── BOARD TAB ── */}
        {tab === 'board' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map(status => {
              const colProjs = projects.filter(p => p.status === status)
              return (
                <div key={status} className="flex-shrink-0 w-[250px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{STATUS_ICONS[status]}</span>
                      <span className="text-[13px] font-semibold text-[#37352f]">{STATUS_LABELS[status]}</span>
                      <span className="text-[11px] px-1.5 py-0.5 bg-[#f1f1ef] text-[#9b9a97] rounded-full">
                        {colProjs.length}
                      </span>
                    </div>
                    <button
                      onClick={() => openAddProj(status)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#efefef] text-[#9b9a97]"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {colProjs.map(proj => (
                      <ProjectCard
                        key={proj.id}
                        proj={proj}
                        onEdit={() => openEditProj(proj)}
                        onDelete={() => deleteProj(proj.id)}
                        onStatusChange={s => changeProjStatus(proj.id, s)}
                      />
                    ))}
                    <button
                      onClick={() => openAddProj(status)}
                      className="w-full py-2.5 border-2 border-dashed border-[#e9e9e7] rounded-xl text-[12px] text-[#9b9a97] hover:border-[#c7c6c4] hover:text-[#37352f] transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={12} /> Ekle
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── PROJECTS TAB ── */}
        {tab === 'projects' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => openAddProj()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#37352f] text-white text-[13px] font-medium rounded-lg hover:bg-[#2f2d28] transition-colors"
              >
                <Plus size={14} /> Yeni Proje
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-16 text-[#9b9a97]">
                <p className="text-[15px]">Henüz proje yok</p>
                <p className="text-[13px] mt-1">Pano sekmesinden veya yukarıdan proje ekleyebilirsin.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e9e9e7] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#f7f7f5] border-b border-[#e9e9e7]">
                      <th className="text-left px-4 py-3 font-semibold text-[#9b9a97]">Proje</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#9b9a97]">Durum</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#9b9a97]">Öncelik</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#9b9a97]">Tech Stack</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((proj, i) => {
                      const techs = proj.tech_stack ? proj.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : []
                      return (
                        <tr key={proj.id} className={`border-b border-[#f1f1ef] hover:bg-[#f7f7f5] transition-colors group ${i === projects.length - 1 ? 'border-b-0' : ''}`}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-[#37352f]">{proj.title}</p>
                              {proj.description && (
                                <p className="text-[12px] text-[#9b9a97] mt-0.5 line-clamp-1">{proj.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: STATUS_COLORS[proj.status] + '22', color: STATUS_COLORS[proj.status] }}
                            >
                              {STATUS_ICONS[proj.status]} {STATUS_LABELS[proj.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: PRIORITY_COLORS[proj.priority] + '22', color: PRIORITY_COLORS[proj.priority] }}
                            >
                              {PRIORITY_LABELS[proj.priority]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {techs.slice(0, 5).map(t => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                                  style={{ background: LANG_COLORS[t] || '#9b9a97' }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              {proj.github_url && (
                                <a
                                  href={proj.github_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#efefef] text-[#9b9a97]"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button onClick={() => openEditProj(proj)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#efefef] text-[#9b9a97]">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => deleteProj(proj.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-400">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DEVLOG TAB ── */}
        {tab === 'devlog' && (
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={openAddLog}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#37352f] text-white text-[13px] font-medium rounded-lg hover:bg-[#2f2d28] transition-colors"
              >
                <Plus size={14} /> Yeni Log
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-16 text-[#9b9a97]">
                <p className="text-[15px]">Henüz log yok</p>
                <p className="text-[13px] mt-1">Bugün ne üzerinde çalıştığını kaydet.</p>
              </div>
            ) : (
              <div className="space-y-0 max-w-[800px]">
                {logs.map((entry, i) => (
                  <div key={entry.id} className="flex gap-4 group">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2eaadc] mt-1.5 flex-shrink-0" />
                      {i < logs.length - 1 && <div className="w-px flex-1 bg-[#e9e9e7] mt-1" />}
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] text-[#9b9a97] font-medium">{fmtDate(entry.date)}</span>
                          <h3 className="text-[15px] font-semibold text-[#37352f] mt-0.5">{entry.title}</h3>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => openEditLog(entry)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f1f1ef] text-[#9b9a97]">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => deleteLog(entry.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-400">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {entry.body && (
                        <p className="text-[13px] text-[#37352f] mt-1.5 leading-relaxed whitespace-pre-wrap">{entry.body}</p>
                      )}

                      {entry.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.split(',').filter(t => t.trim()).map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-[#f1f1ef] text-[#9b9a97] rounded-full">
                              #{t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SNIPPETS TAB ── */}
        {tab === 'snippets' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              {/* Language filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {usedLangs.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLangFilter(lang)}
                    className={`text-[12px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      langFilter === lang
                        ? 'bg-[#37352f] text-white'
                        : 'bg-[#f1f1ef] text-[#9b9a97] hover:text-[#37352f]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <button
                onClick={openAddSnip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#37352f] text-white text-[13px] font-medium rounded-lg hover:bg-[#2f2d28] transition-colors flex-shrink-0"
              >
                <Plus size={14} /> Yeni Snippet
              </button>
            </div>

            {filteredSnippets.length === 0 ? (
              <div className="text-center py-16 text-[#9b9a97]">
                <p className="text-[15px]">Snippet bulunamadı</p>
                <p className="text-[13px] mt-1">Sık kullandığın kod parçacıklarını buraya ekle.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredSnippets.map(s => (
                  <SnippetCard
                    key={s.id}
                    snippet={s}
                    onEdit={() => openEditSnip(s)}
                    onDelete={() => deleteSnip(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PROJECT MODAL ── */}
      {projModal !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setProjModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-[#37352f]">
                {projModal === 'add' ? 'Yeni Proje' : 'Projeyi Düzenle'}
              </h2>
              <button onClick={() => setProjModal(false)} className="text-[#9b9a97] hover:text-[#37352f]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Proje Adı *</label>
                <input
                  autoFocus
                  placeholder="Proje adı..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                  value={projForm.title}
                  onChange={e => setProjForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveProj()}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Kısa açıklama..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc] resize-none"
                  value={projForm.description}
                  onChange={e => setProjForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Durum</label>
                  <select
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                    value={projForm.status}
                    onChange={e => setProjForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_ICONS[s]} {STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Öncelik</label>
                  <select
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                    value={projForm.priority}
                    onChange={e => setProjForm(f => ({ ...f, priority: e.target.value as ProjectPriority }))}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">
                  Tech Stack <span className="font-normal">(virgülle ayır)</span>
                </label>
                <input
                  placeholder="TypeScript, React, Electron..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                  value={projForm.tech_stack}
                  onChange={e => setProjForm(f => ({ ...f, tech_stack: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">GitHub / Repo URL</label>
                <input
                  placeholder="https://github.com/..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                  value={projForm.github_url}
                  onChange={e => setProjForm(f => ({ ...f, github_url: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={saveProj}
                disabled={!projForm.title.trim()}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white bg-[#37352f] hover:bg-[#2f2d28] transition-colors disabled:opacity-40"
              >
                {projModal === 'add' ? 'Kaydet' : 'Güncelle'}
              </button>
              <button
                onClick={() => setProjModal(false)}
                className="px-4 py-2.5 rounded-lg text-[14px] border border-[#e9e9e7] text-[#9b9a97] hover:bg-[#f1f1ef] transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOG MODAL ── */}
      {logModal !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setLogModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-[#37352f]">
                {logModal === 'add' ? 'Yeni DevLog' : 'Log Düzenle'}
              </h2>
              <button onClick={() => setLogModal(false)} className="text-[#9b9a97] hover:text-[#37352f]"><X size={16} /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Tarih</label>
                  <input
                    type="date"
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                    value={logForm.date}
                    onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Başlık *</label>
                  <input
                    autoFocus
                    placeholder="Bugün ne üzerinde çalıştın?"
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                    value={logForm.title}
                    onChange={e => setLogForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Notlar</label>
                <textarea
                  rows={5}
                  placeholder="Ne yaptın? Ne öğrendin? Hangi sorunlarla karşılaştın?"
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc] resize-none"
                  value={logForm.body}
                  onChange={e => setLogForm(f => ({ ...f, body: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Etiketler</label>
                <input
                  placeholder="react, bugfix, refactor..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                  value={logForm.tags}
                  onChange={e => setLogForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={saveLog}
                disabled={!logForm.title.trim()}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white bg-[#37352f] hover:bg-[#2f2d28] transition-colors disabled:opacity-40"
              >
                {logModal === 'add' ? 'Kaydet' : 'Güncelle'}
              </button>
              <button
                onClick={() => setLogModal(false)}
                className="px-4 py-2.5 rounded-lg text-[14px] border border-[#e9e9e7] text-[#9b9a97] hover:bg-[#f1f1ef] transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SNIPPET MODAL ── */}
      {snipModal !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 py-8 overflow-y-auto" onClick={() => setSnipModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[600px] p-6 my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-[#37352f]">
                {snipModal === 'add' ? 'Yeni Snippet' : 'Snippet Düzenle'}
              </h2>
              <button onClick={() => setSnipModal(false)} className="text-[#9b9a97] hover:text-[#37352f]"><X size={16} /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Başlık *</label>
                  <input
                    autoFocus
                    placeholder="Snippet adı..."
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                    value={snipForm.title}
                    onChange={e => setSnipForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Dil</label>
                  <select
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                    value={snipForm.language}
                    onChange={e => setSnipForm(f => ({ ...f, language: e.target.value }))}
                  >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Açıklama</label>
                <input
                  placeholder="Ne işe yarar?"
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                  value={snipForm.description}
                  onChange={e => setSnipForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Kod *</label>
                <textarea
                  rows={10}
                  placeholder="// Kodunu buraya yapıştır..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[12px] font-mono outline-none focus:border-[#2eaadc] resize-none bg-[#f7f7f5]"
                  value={snipForm.code}
                  onChange={e => setSnipForm(f => ({ ...f, code: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Etiketler</label>
                <input
                  placeholder="hook, utility, api..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                  value={snipForm.tags}
                  onChange={e => setSnipForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={saveSnip}
                disabled={!snipForm.title.trim() || !snipForm.code.trim()}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white bg-[#37352f] hover:bg-[#2f2d28] transition-colors disabled:opacity-40"
              >
                {snipModal === 'add' ? 'Kaydet' : 'Güncelle'}
              </button>
              <button
                onClick={() => setSnipModal(false)}
                className="px-4 py-2.5 rounded-lg text-[14px] border border-[#e9e9e7] text-[#9b9a97] hover:bg-[#f1f1ef] transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
