import React, { useEffect, useState } from 'react'
import { Plus, X, Star, BookOpen, Trash2, Edit2, Check, Save } from 'lucide-react'
import { Book } from '../types'

const COVER_COLORS = [
  '#2eaadc','#e03e3e','#0f7b6c','#9065b0','#cb912f','#c14b8a',
  '#37352f','#448361','#2383e2','#e67e22',
]

const STATUS_LABELS = {
  okunacak: 'Okunacak',
  okunuyor: 'Okunuyor',
  okundu:   'Okundu',
} as const

type Status = keyof typeof STATUS_LABELS

// ── Stars ─────────────────────────────────────────────────────────────────────

function Stars({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onChange?.(n === rating ? 0 : n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={12}
            className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}

// ── Book Card ─────────────────────────────────────────────────────────────────

function BookCard({ book, onUpdate, onDelete, onEdit }: {
  book: Book
  onUpdate: (fields: Partial<Book>) => void
  onDelete: () => void
  onEdit: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editPage, setEditPage] = useState(String(book.current_page))

  const progress = book.total_pages > 0
    ? Math.round((book.current_page / book.total_pages) * 100)
    : 0

  const statusColors: Record<Status, string> = {
    okunacak: 'bg-gray-100 text-gray-600',
    okunuyor: 'bg-blue-100 text-blue-700',
    okundu:   'bg-green-100 text-green-700',
  }

  const cycleStatus = () => {
    const order: Status[] = ['okunacak', 'okunuyor', 'okundu']
    const idx = order.indexOf(book.status as Status)
    onUpdate({ status: order[(idx + 1) % order.length] })
  }

  const saveProgress = () => {
    const p = parseInt(editPage) || 0
    onUpdate({ current_page: Math.min(p, book.total_pages || p) })
    setEditing(false)
  }

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden shadow-sm border border-[#e9e9e7] hover:shadow-md transition-shadow bg-white">
      {/* Book spine / cover */}
      <div
        className="h-40 flex flex-col justify-end p-4 relative"
        style={{ background: `linear-gradient(160deg, ${book.cover_color}dd, ${book.cover_color})` }}
      >
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-6 h-6 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
          >
            <Edit2 size={10} />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
          >
            <Trash2 size={11} />
          </button>
        </div>

        {/* Pages decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-black/10 flex flex-col justify-center gap-0.5 px-0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-px bg-white/30" />
          ))}
        </div>

        <h3 className="text-white font-bold text-[14px] leading-tight line-clamp-2 pr-4 drop-shadow">
          {book.title}
        </h3>
        <p className="text-white/80 text-[11px] mt-1 truncate pr-4">{book.author}</p>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <button
            onClick={cycleStatus}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${statusColors[book.status as Status]}`}
          >
            {STATUS_LABELS[book.status as Status]}
          </button>
          {book.status === 'okundu' && (
            <Stars rating={book.rating} onChange={r => onUpdate({ rating: r })} />
          )}
        </div>

        {/* Progress (for reading) */}
        {book.status === 'okunuyor' && book.total_pages > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-[#9b9a97] mb-1">
              {editing ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    type="number"
                    value={editPage}
                    onChange={e => setEditPage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveProgress(); if (e.key === 'Escape') setEditing(false) }}
                    className="w-14 border border-[#2eaadc] rounded px-1 text-[11px] outline-none"
                  />
                  <span>/ {book.total_pages}</span>
                  <button onClick={saveProgress} className="text-green-500"><Check size={11} /></button>
                </div>
              ) : (
                <button onClick={() => { setEditPage(String(book.current_page)); setEditing(true) }} className="hover:text-[#37352f]">
                  {book.current_page} / {book.total_pages} sayfa
                </button>
              )}
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#f1f1ef] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: book.cover_color }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add Book Form ─────────────────────────────────────────────────────────────

function AddBookModal({ onAdd, onClose }: { onAdd: (b: Omit<Book, 'id' | 'current_page' | 'rating' | 'created_at'>) => void; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<Status>('okunacak')
  const [totalPages, setTotalPages] = useState('')
  const [color, setColor] = useState(COVER_COLORS[0])

  const submit = () => {
    if (!title.trim()) return
    onAdd({ title: title.trim(), author: author.trim(), status, total_pages: parseInt(totalPages) || 0, cover_color: color })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-semibold text-[#37352f]">Kitap Ekle</span>
          <button onClick={onClose} className="text-[#9b9a97] hover:text-[#37352f]"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            placeholder="Kitap adı *"
            className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            placeholder="Yazar"
            className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
            value={author}
            onChange={e => setAuthor(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Status)}
              className="flex-1 border border-[#e9e9e7] rounded-lg px-2 py-2 text-[13px] outline-none"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input
              type="number"
              placeholder="Sayfa sayısı"
              className="flex-1 border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
              value={totalPages}
              onChange={e => setTotalPages(e.target.value)}
            />
          </div>

          {/* Cover color */}
          <div>
            <p className="text-[11px] text-[#9b9a97] mb-2">Kapak rengi</p>
            <div className="flex gap-2 flex-wrap">
              {COVER_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: color + '22' }}>
            <div className="w-8 h-12 rounded flex-shrink-0 shadow-sm" style={{ background: color }} />
            <div>
              <p className="text-[13px] font-semibold text-[#37352f]">{title || 'Kitap Adı'}</p>
              <p className="text-[11px] text-[#9b9a97]">{author || 'Yazar'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            disabled={!title.trim()}
            onClick={submit}
            className="flex-1 py-2 bg-[#37352f] text-white rounded-lg text-[13px] font-medium disabled:opacity-40 hover:bg-[#2f2d28] transition-colors"
          >
            Ekle
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-[#e9e9e7] text-[#9b9a97] rounded-lg text-[13px] hover:bg-[#f1f1ef]">
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Book Modal ───────────────────────────────────────────────────────────

function EditBookModal({ book, onSave, onClose }: {
  book: Book
  onSave: (fields: Partial<Book>) => void
  onClose: () => void
}) {
  const [title, setTitle]       = useState(book.title)
  const [author, setAuthor]     = useState(book.author)
  const [status, setStatus]     = useState<Status>(book.status as Status)
  const [totalPages, setTotalPages] = useState(String(book.total_pages || ''))
  const [currentPage, setCurrentPage] = useState(String(book.current_page || ''))
  const [color, setColor]       = useState(book.cover_color)
  const [rating, setRating]     = useState(book.rating)

  const submit = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      author: author.trim(),
      status,
      total_pages: parseInt(totalPages) || 0,
      current_page: Math.min(parseInt(currentPage) || 0, parseInt(totalPages) || 0),
      cover_color: color,
      rating,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-semibold text-[#37352f]">Kitabı Düzenle</span>
          <button onClick={onClose} className="text-[#9b9a97] hover:text-[#37352f]"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            placeholder="Kitap adı *"
            className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            placeholder="Yazar"
            className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
            value={author}
            onChange={e => setAuthor(e.target.value)}
          />

          <div className="flex gap-2">
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Status)}
              className="flex-1 border border-[#e9e9e7] rounded-lg px-2 py-2 text-[13px] outline-none"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input
              type="number"
              placeholder="Toplam sayfa"
              className="flex-1 border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
              value={totalPages}
              onChange={e => setTotalPages(e.target.value)}
            />
          </div>

          {status === 'okunuyor' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mevcut sayfa"
                className="flex-1 border border-[#e9e9e7] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2eaadc]"
                value={currentPage}
                onChange={e => setCurrentPage(e.target.value)}
              />
              <span className="text-[13px] text-[#9b9a97]">/ {totalPages || '?'} sayfa</span>
            </div>
          )}

          {status === 'okundu' && (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#9b9a97]">Puan:</span>
              <Stars rating={rating} onChange={setRating} />
            </div>
          )}

          {/* Cover color */}
          <div>
            <p className="text-[11px] text-[#9b9a97] mb-2">Kapak rengi</p>
            <div className="flex gap-2 flex-wrap">
              {COVER_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: color + '22' }}>
            <div className="w-8 h-12 rounded flex-shrink-0 shadow-sm" style={{ background: color }} />
            <div>
              <p className="text-[13px] font-semibold text-[#37352f]">{title || 'Kitap Adı'}</p>
              <p className="text-[11px] text-[#9b9a97]">{author || 'Yazar'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            disabled={!title.trim()}
            onClick={submit}
            className="flex-1 py-2 bg-[#37352f] text-white rounded-lg text-[13px] font-medium disabled:opacity-40 hover:bg-[#2f2d28] transition-colors flex items-center justify-center gap-2"
          >
            <Save size={13} /> Kaydet
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-[#e9e9e7] text-[#9b9a97] rounded-lg text-[13px] hover:bg-[#f1f1ef]">
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Library ───────────────────────────────────────────────────────────────────

export function Library() {
  const [books, setBooks] = useState<Book[]>([])
  const [filter, setFilter] = useState<Status | 'tümü'>('tümü')
  const [showAdd, setShowAdd] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  const load = () => window.api.getBooks().then(setBooks).catch(console.error)
  useEffect(() => { load() }, [])

  const addBook = async (b: Omit<Book, 'id' | 'current_page' | 'rating' | 'created_at'>) => {
    await window.api.createBook(b.title, b.author, b.status, b.total_pages, b.cover_color)
    load()
  }

  const updateBook = async (id: number, fields: Partial<Book>) => {
    await window.api.updateBook(id, fields)
    load()
  }

  const deleteBook = async (id: number) => {
    await window.api.deleteBook(id)
    load()
  }

  const filtered = filter === 'tümü' ? books : books.filter(b => b.status === filter)

  const counts: Record<string, number> = {
    tümü: books.length,
    okunacak: books.filter(b => b.status === 'okunacak').length,
    okunuyor: books.filter(b => b.status === 'okunuyor').length,
    okundu:   books.filter(b => b.status === 'okundu').length,
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-[1000px] mx-auto px-10 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-[#37352f]" />
            <div>
              <h1 className="text-[28px] font-bold text-[#37352f]">Kütüphanem</h1>
              <p className="text-[13px] text-[#9b9a97]">{books.length} kitap</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#37352f] text-white rounded-xl text-[13px] font-medium hover:bg-[#2f2d28] transition-colors"
          >
            <Plus size={14} /> Kitap Ekle
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-[#f1f1ef] rounded-xl mb-8 w-fit">
          {(['tümü', 'okunuyor', 'okunacak', 'okundu'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                filter === s ? 'bg-white text-[#37352f] shadow-sm' : 'text-[#9b9a97] hover:text-[#37352f]'
              }`}
            >
              {s === 'tümü' ? 'Tümü' : STATUS_LABELS[s]}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === s ? 'bg-[#f1f1ef] text-[#9b9a97]' : 'bg-[#e9e9e7] text-[#9b9a97]'}`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Books grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen size={48} className="text-[#e9e9e7] mb-4" />
            <p className="text-[15px] text-[#9b9a97] mb-2">Henüz kitap eklenmemiş</p>
            <button onClick={() => setShowAdd(true)} className="text-[13px] text-[#2eaadc] hover:underline">
              İlk kitabı ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onUpdate={fields => updateBook(book.id, fields)}
                onDelete={() => deleteBook(book.id)}
                onEdit={() => setEditingBook(book)}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddBookModal onAdd={addBook} onClose={() => setShowAdd(false)} />}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          onSave={fields => updateBook(editingBook.id, fields)}
          onClose={() => setEditingBook(null)}
        />
      )}
    </div>
  )
}
