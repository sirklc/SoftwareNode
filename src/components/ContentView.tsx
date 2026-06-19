import React, { useEffect, useState, useRef } from 'react'
import { Plus, X, Edit2, Trash2, Calendar, Tag } from 'lucide-react'
import { Page, ContentItem } from '../types'

const PLATFORMS = ['YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'LinkedIn', 'Pinterest', 'Diğer']
const CONTENT_TYPES = ['video', 'fotoğraf', 'reel', 'hikaye', 'yazı', 'podcast', 'canlı yayın']
const STATUSES: ContentItem['status'][] = ['fikir', 'planlandı', 'çekimde', 'kurgu', 'yayında']

const STATUS_LABELS: Record<string, string> = {
  fikir: 'Fikir', planlandı: 'Planlandı', çekimde: 'Çekimde', kurgu: 'Kurgu', yayında: 'Yayında'
}
const STATUS_COLORS: Record<string, string> = {
  fikir: '#9b9a97', planlandı: '#2eaadc', çekimde: '#cb912f', kurgu: '#9065b0', yayında: '#0f7b6c'
}
const PLATFORM_COLORS: Record<string, string> = {
  YouTube: '#e03e3e', Instagram: '#c14b8a', TikTok: '#37352f',
  'Twitter/X': '#2eaadc', Facebook: '#2eaadc', LinkedIn: '#2eaadc',
  Pinterest: '#e03e3e', Diğer: '#9b9a97',
}
const TYPE_EMOJI: Record<string, string> = {
  video: '🎬', fotoğraf: '📸', reel: '🎞️', hikaye: '📖', yazı: '✍️', podcast: '🎙️', 'canlı yayın': '📡'
}

const fmtDate = (s: string) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d} ${months[parseInt(m) - 1]}`
}

interface FormState {
  title: string
  platform: string
  content_type: string
  status: ContentItem['status']
  scheduled_date: string
  description: string
  thumbnail_path: string
  tags: string
}

const defaultForm = (status: ContentItem['status'] = 'fikir'): FormState => ({
  title: '', platform: 'Instagram', content_type: 'fotoğraf',
  status, scheduled_date: '', description: '', thumbnail_path: '', tags: '',
})

interface Props { page: Page }

function ContentCard({ item, onEdit, onDelete, onStatusChange }: {
  item: ContentItem
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (s: ContentItem['status']) => void
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

  const imgSrc = item.thumbnail_path
    ? item.thumbnail_path.startsWith('http') ? item.thumbnail_path : `file://${item.thumbnail_path}`
    : null

  return (
    <div className="bg-white rounded-xl border border-[#e9e9e7] shadow-sm hover:shadow-md transition-shadow group">
      {/* Thumbnail */}
      {imgSrc ? (
        <div className="w-full h-32 rounded-t-xl overflow-hidden bg-[#f1f1ef]">
          <img src={imgSrc} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
      ) : (
        <div className="w-full h-20 rounded-t-xl bg-gradient-to-br from-[#f1f1ef] to-[#e9e9e7] flex items-center justify-center text-3xl">
          {TYPE_EMOJI[item.content_type] || '📄'}
        </div>
      )}

      <div className="p-3">
        {/* Platform + type */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ background: PLATFORM_COLORS[item.platform] || '#9b9a97' }}
          >
            {item.platform}
          </span>
          <span className="text-[11px] text-[#9b9a97]">{TYPE_EMOJI[item.content_type]} {item.content_type}</span>
        </div>

        {/* Title */}
        <p className="text-[14px] font-semibold text-[#37352f] leading-tight mb-2 line-clamp-2">{item.title}</p>

        {/* Date */}
        {item.scheduled_date && (
          <div className="flex items-center gap-1 text-[12px] text-[#9b9a97] mb-2">
            <Calendar size={11} />
            {fmtDate(item.scheduled_date)}
          </div>
        )}

        {/* Tags */}
        {item.tags && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {item.tags.split(',').filter(t => t.trim()).slice(0, 3).map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 bg-[#f1f1ef] text-[#9b9a97] rounded-full">
                #{t.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f1f1ef]">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-[11px] px-2 py-1 rounded-md hover:bg-[#f1f1ef] font-medium transition-colors"
              style={{ color: STATUS_COLORS[item.status] }}
            >
              ● {STATUS_LABELS[item.status]}
            </button>
            {menuOpen && (
              <div className="absolute bottom-7 left-0 z-50 bg-white border border-[#e9e9e7] rounded-xl shadow-lg py-1 w-36">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(s); setMenuOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#f1f1ef] transition-colors ${item.status === s ? 'font-semibold' : ''}`}
                    style={{ color: STATUS_COLORS[s] }}
                  >
                    ● {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f1f1ef] text-[#9b9a97]">
              <Edit2 size={12} />
            </button>
            <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ContentView({ page }: Props) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [modal, setModal] = useState<false | 'add' | number>(false)
  const [form, setForm] = useState<FormState>(defaultForm())
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => window.api.getContentItems(page.id).then(setItems)
  useEffect(() => { load() }, [page.id])

  const openAdd = (status: ContentItem['status'] = 'fikir') => {
    setForm(defaultForm(status))
    setModal('add')
  }

  const openEdit = (item: ContentItem) => {
    setForm({
      title: item.title, platform: item.platform, content_type: item.content_type,
      status: item.status, scheduled_date: item.scheduled_date, description: item.description,
      thumbnail_path: item.thumbnail_path, tags: item.tags,
    })
    setModal(item.id)
  }

  const save = async () => {
    if (!form.title.trim()) return
    if (modal === 'add') {
      await window.api.addContentItem(
        page.id, form.title.trim(), form.platform, form.content_type,
        form.status, form.scheduled_date, form.description, form.thumbnail_path, form.tags
      )
    } else if (typeof modal === 'number') {
      await window.api.updateContentItem(modal, {
        title: form.title.trim(), platform: form.platform, content_type: form.content_type,
        status: form.status, scheduled_date: form.scheduled_date, description: form.description,
        thumbnail_path: form.thumbnail_path, tags: form.tags,
      })
    }
    setModal(false)
    load()
  }

  const remove = async (id: number) => {
    await window.api.deleteContentItem(id)
    load()
  }

  const changeStatus = async (id: number, status: ContentItem['status']) => {
    await window.api.updateContentItem(id, { status })
    load()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In Electron, file.path gives the local filesystem path
      const p = (file as File & { path?: string }).path || URL.createObjectURL(file)
      setForm(f => ({ ...f, thumbnail_path: p }))
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[1300px] mx-auto px-10 py-10">
        <h1 className="text-[40px] font-bold text-[#37352f] mb-8">{page.title}</h1>

        {/* Kanban board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map(status => {
            const colItems = items.filter(i => i.status === status)
            return (
              <div key={status} className="flex-shrink-0 w-[240px]">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                    <span className="text-[13px] font-semibold text-[#37352f]">{STATUS_LABELS[status]}</span>
                    <span className="text-[11px] px-1.5 py-0.5 bg-[#f1f1ef] text-[#9b9a97] rounded-full">
                      {colItems.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openAdd(status)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#efefef] text-[#9b9a97]"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {colItems.map(item => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      onEdit={() => openEdit(item)}
                      onDelete={() => remove(item.id)}
                      onStatusChange={s => changeStatus(item.id, s)}
                    />
                  ))}

                  {/* Add card button */}
                  <button
                    onClick={() => openAdd(status)}
                    className="w-full py-2.5 border-2 border-dashed border-[#e9e9e7] rounded-xl text-[12px] text-[#9b9a97] hover:border-[#c7c6c4] hover:text-[#37352f] transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Ekle
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-y-auto py-8" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-6 my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-[#37352f]">
                {modal === 'add' ? 'Yeni İçerik' : 'İçeriği Düzenle'}
              </h2>
              <button onClick={() => setModal(false)} className="text-[#9b9a97] hover:text-[#37352f]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Başlık *</label>
                <input
                  autoFocus
                  placeholder="İçerik başlığı..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Platform</label>
                  <select
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                    value={form.platform}
                    onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">İçerik Türü</label>
                  <select
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                    value={form.content_type}
                    onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}
                  >
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Durum</label>
                  <select
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as ContentItem['status'] }))}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">
                    Planlanan Tarih <span className="font-normal">(takvime eklenir)</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                    value={form.scheduled_date}
                    onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Açıklama</label>
                <textarea
                  rows={3}
                  placeholder="İçerik hakkında notlar, senaryo fikirleri..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc] resize-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Görsel / Thumbnail</label>
                <div className="flex gap-2">
                  <input
                    placeholder="Dosya yolu veya URL..."
                    className="flex-1 border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                    value={form.thumbnail_path}
                    onChange={e => setForm(f => ({ ...f, thumbnail_path: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-2 border border-[#e9e9e7] rounded-lg text-[12px] text-[#9b9a97] hover:bg-[#f1f1ef] transition-colors whitespace-nowrap"
                  >
                    Dosya Seç
                  </button>
                  <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
                </div>
                {form.thumbnail_path && (
                  <div className="mt-2 rounded-lg overflow-hidden h-24 bg-[#f1f1ef]">
                    <img
                      src={form.thumbnail_path.startsWith('http') ? form.thumbnail_path : `file://${form.thumbnail_path}`}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">
                  Etiketler <span className="font-normal">(virgülle ayır: vlog, yemek, seyahat)</span>
                </label>
                <div className="flex items-center gap-2 border border-[#e9e9e7] rounded-lg px-3 py-2 focus-within:border-[#2eaadc]">
                  <Tag size={12} className="text-[#9b9a97] flex-shrink-0" />
                  <input
                    placeholder="vlog, günlük, eğlence..."
                    className="flex-1 text-[13px] outline-none"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={save}
                disabled={!form.title.trim()}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white bg-[#37352f] hover:bg-[#2f2d28] transition-colors disabled:opacity-40"
              >
                {modal === 'add' ? 'Kaydet' : 'Güncelle'}
              </button>
              <button
                onClick={() => setModal(false)}
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
