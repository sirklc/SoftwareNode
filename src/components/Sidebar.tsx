import React, { useState, useRef, useEffect, createContext, useContext } from 'react'
import ReactDOM from 'react-dom'
import {
  FileText, Database, Calendar, ChevronRight, ChevronDown,
  Plus, Trash2, Edit2, MoreHorizontal, Search, DollarSign, Film, Folder, GripVertical, Home,
  BookOpen, CheckSquare, X,
} from 'lucide-react'
import { Page, SidebarCategory } from '../types'
import { usePageStore } from '../store/usePageStore'

// ── Search Modal ───────────────────────────────────────────────────────────────

function SearchModal({ onClose }: { onClose: () => void }) {
  const { pages, selectPage } = usePageStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = query.trim()
    ? pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
    : pages.slice(0, 8)

  const PAGE_TYPE_ICON: Record<string, React.ReactNode> = {
    note:     <FileText size={14} className="text-[#9b9a97]" />,
    database: <Database size={14} className="text-[#9b9a97]" />,
    finance:  <DollarSign size={14} className="text-[#9b9a97]" />,
    content:  <Film size={14} className="text-[#9b9a97]" />,
    group:    <Folder size={14} className="text-[#9b9a97]" />,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e9e9e7]">
          <Search size={16} className="text-[#9b9a97] flex-shrink-0" />
          <input
            ref={inputRef}
            placeholder="Sayfa ara..."
            className="flex-1 text-[14px] text-[#37352f] outline-none placeholder:text-[#9b9a97]"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          <button onClick={onClose} className="text-[#9b9a97] hover:text-[#37352f]"><X size={14} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="text-[13px] text-[#9b9a97] text-center py-6">Sonuç bulunamadı</p>
          ) : results.map(p => (
            <button
              key={p.id}
              onClick={() => { selectPage(p.id, p.page_type); onClose() }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#f7f7f5] text-left transition-colors"
            >
              <span className="flex-shrink-0">{p.icon || PAGE_TYPE_ICON[p.page_type]}</span>
              <span className="text-[13.5px] text-[#37352f] flex-1 truncate">{p.title || 'Başlıksız'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function reorderArray<T>(arr: T[], fromIdx: number, toIdx: number): T[] {
  const result = [...arr]
  const [removed] = result.splice(fromIdx, 1)
  result.splice(toIdx, 0, removed)
  return result
}

// ── Drag context ──────────────────────────────────────────────────────────────

interface DragCtx {
  dropTargetId: number | null
  dropTargetType: 'cat' | 'page' | null
  onDragOver: (type: 'cat' | 'page', id: number) => void
  onDragLeave: () => void
  onDrop: (dragType: 'cat' | 'page', dragId: number, targetType: 'cat' | 'page', targetId: number) => void
}

const DragContext = createContext<DragCtx | null>(null)
const useDrag = () => useContext(DragContext)!

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_ICONS: Record<string, React.ReactNode> = {
  note:     <FileText size={14} />,
  database: <Database size={14} />,
  finance:  <DollarSign size={14} />,
  content:  <Film size={14} />,
  group:    <Folder size={14} />,
}

const PAGE_TYPE_ICON_STR: Record<string, string> = {
  note: '📄', database: '🗃️', finance: '💰', content: '🎬', group: '📁'
}

const ADD_MENU_ITEMS = [
  { type: 'note',     icon: <FileText size={13} />,   label: 'Yeni Not' },
  { type: 'database', icon: <Database size={13} />,   label: 'Yeni Veritabanı' },
  { type: 'finance',  icon: <DollarSign size={13} />, label: 'Yeni Finans Takibi' },
  { type: 'content',  icon: <Film size={13} />,       label: 'Yeni İçerik Planı' },
  { type: 'group',    icon: <Folder size={13} />,     label: 'Yeni Grup' },
]

// ── PortalMenu ────────────────────────────────────────────────────────────────
// Renders menu into document.body to escape overflow-y:auto clipping in sidebar

function PortalMenu({
  anchorRef,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | HTMLButtonElement | HTMLDivElement>
  onClose: () => void
  children: React.ReactNode
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    const h = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return ReactDOM.createPortal(
    <div
      className="fixed z-[9999] bg-white border border-[#e9e9e7] rounded-xl shadow-lg py-1 w-52 text-[13px]"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={e => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  )
}

// ── AddDropdown ───────────────────────────────────────────────────────────────

function AddDropdown({ onSelect, onClose }: { onSelect: (type: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-5 z-50 bg-white border border-[#e9e9e7] rounded-xl shadow-lg py-1 w-48 text-[13px]">
      {ADD_MENU_ITEMS.map(item => (
        <button
          key={item.type}
          className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center gap-2 text-[#37352f]"
          onClick={() => { onSelect(item.type); onClose() }}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </div>
  )
}

// ── PageItem ──────────────────────────────────────────────────────────────────

function PageItem({
  page, allPages, depth = 0, categories, onCategoryChange
}: {
  page: Page
  allPages: Page[]
  depth?: number
  categories: SidebarCategory[]
  onCategoryChange?: () => void
}) {
  const { selectedPageId, selectPage, loadPages } = usePageStore()
  const drag = useDrag()
  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(page.title)
  const [movingOpen, setMovingOpen] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  const children = allPages.filter(p => p.parent_id === page.id)
  const hasChildren = children.length > 0
  const isSelected = selectedPageId === page.id
  const isDraggable = depth === 0
  const isDropTarget = drag.dropTargetId === page.id && drag.dropTargetType === 'page'

  const handleRename = async () => {
    if (renameVal.trim()) {
      await window.api.updatePage(page.id, { title: renameVal.trim() })
      await loadPages()
    }
    setRenaming(false)
  }

  const handleDelete = async () => {
    if (confirm(`"${page.title}" sayfasını silmek istediğinize emin misiniz?`)) {
      await window.api.deletePage(page.id)
      await loadPages()
      if (selectedPageId === page.id) {
        usePageStore.setState({ selectedPageId: null, selectedPageType: null })
      }
    }
    setMenuOpen(false)
  }

  const handleAddChild = async (type: string) => {
    const id = await window.api.createPage('Başlıksız', page.id, PAGE_TYPE_ICON_STR[type] || '📄', type)
    await loadPages()
    setExpanded(true)
    selectPage(id, type)
    setMenuOpen(false)
  }

  const handleMoveToCategory = async (catId: number | null) => {
    await window.api.updatePage(page.id, { category_id: catId } as Partial<Page>)
    await loadPages()
    setMenuOpen(false); setMovingOpen(false)
    onCategoryChange?.()
  }

  const isRootPage = page.parent_id === null

  return (
    <div>
      <div
        draggable={isDraggable}
        onDragStart={isDraggable ? e => {
          e.dataTransfer.setData('drag-type', 'page')
          e.dataTransfer.setData('drag-id', String(page.id))
          e.dataTransfer.effectAllowed = 'move'
        } : undefined}
        onDragOver={isDraggable ? e => {
          e.preventDefault()
          e.stopPropagation()
          drag.onDragOver('page', page.id)
        } : undefined}
        onDragLeave={isDraggable ? e => {
          e.stopPropagation()
          drag.onDragLeave()
        } : undefined}
        onDrop={isDraggable ? e => {
          e.preventDefault()
          e.stopPropagation()
          const dragType = e.dataTransfer.getData('drag-type') as 'cat' | 'page'
          const dragId = Number(e.dataTransfer.getData('drag-id'))
          drag.onDrop(dragType, dragId, 'page', page.id)
        } : undefined}
        className={`group flex items-center gap-1 rounded-md cursor-pointer select-none text-[14px] transition-colors ${
          isSelected ? 'bg-[#efefef]' : 'hover:bg-[#f1f1ef]'
        } ${isDropTarget ? 'border-t-2 border-blue-400' : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '4px', paddingTop: '3px', paddingBottom: '3px' }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => { selectPage(page.id, page.page_type); if (!expanded && hasChildren) setExpanded(true) }}
      >
        {/* Drag handle */}
        {isDraggable && (hovering || menuOpen) && (
          <span className="text-[#c7c6c4] flex-shrink-0 cursor-grab active:cursor-grabbing" onClick={e => e.stopPropagation()}>
            <GripVertical size={12} />
          </span>
        )}
        {isDraggable && !(hovering || menuOpen) && <span className="w-3 flex-shrink-0" />}

        {/* Expand toggle */}
        <button
          className="w-4 h-4 flex items-center justify-center text-[#9b9a97] hover:text-[#37352f] flex-shrink-0"
          onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
        >
          {hasChildren
            ? expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            : <span className="w-3" />}
        </button>

        <span className="text-[#9b9a97] flex-shrink-0">{PAGE_ICONS[page.page_type] || <FileText size={14} />}</span>

        {renaming ? (
          <input
            autoFocus
            className="flex-1 bg-white border border-blue-400 rounded px-1 text-[14px] outline-none min-w-0"
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-[#37352f] min-w-0">{page.title || 'Başlıksız'}</span>
        )}

        {(hovering || menuOpen) && !renaming && (
          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#e0e0de] text-[#9b9a97]"
              title="Alt sayfa ekle"
              onClick={() => handleAddChild('note')}
            >
              <Plus size={12} />
            </button>
            <div>
              <button
                ref={menuRef}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#e0e0de] text-[#9b9a97]"
                onClick={() => { setMenuOpen(!menuOpen); setMovingOpen(false) }}
              >
                <MoreHorizontal size={12} />
              </button>
              {menuOpen && (
                <PortalMenu anchorRef={menuRef} onClose={() => { setMenuOpen(false); setMovingOpen(false) }}>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center gap-2 text-[#37352f]"
                    onClick={() => { setRenaming(true); setRenameVal(page.title); setMenuOpen(false) }}>
                    <Edit2 size={13} /> Yeniden Adlandır
                  </button>
                  {isRootPage && categories.length > 0 && (
                    <>
                      <div className="border-t border-[#e9e9e7] my-1" />
                      <button
                        className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center justify-between gap-2 text-[#37352f]"
                        onClick={() => setMovingOpen(v => !v)}
                      >
                        <span className="flex items-center gap-2"><Folder size={13} /> Kategoriye Taşı</span>
                        <ChevronRight size={11} className="text-[#9b9a97]" />
                      </button>
                      {movingOpen && (
                        <div className="border-t border-[#e9e9e7] my-1 mx-2 pb-1">
                          <button
                            className={`w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] rounded text-[#37352f] ${page.category_id === null ? 'font-semibold' : ''}`}
                            onClick={() => handleMoveToCategory(null)}
                          >
                            Kategorisiz
                          </button>
                          <div className="border-t border-[#e9e9e7] my-1" />
                          {categories.map(cat => (
                            <button
                              key={cat.id}
                              className={`w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] rounded text-[#37352f] ${page.category_id === cat.id ? 'font-semibold' : ''}`}
                              onClick={() => handleMoveToCategory(cat.id)}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <div className="border-t border-[#e9e9e7] my-1" />
                  <p className="px-3 py-1 text-[11px] text-[#9b9a97] font-semibold uppercase tracking-wide">Alt Sayfa Ekle</p>
                  {ADD_MENU_ITEMS.map(item => (
                    <button key={item.type} className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center gap-2 text-[#37352f]"
                      onClick={() => handleAddChild(item.type)}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                  <div className="border-t border-[#e9e9e7] my-1" />
                  <button className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-500 flex items-center gap-2"
                    onClick={handleDelete}>
                    <Trash2 size={13} /> Sil
                  </button>
                </PortalMenu>
              )}
            </div>
          </div>
        )}
      </div>

      {expanded && children.map(child => (
        <PageItem key={child.id} page={child} allPages={allPages} depth={depth + 1} categories={categories} onCategoryChange={onCategoryChange} />
      ))}
    </div>
  )
}

// ── CategorySection ───────────────────────────────────────────────────────────

function CategorySection({
  category, pages, allPages, categories, onRefresh
}: {
  category: SidebarCategory
  pages: Page[]
  allPages: Page[]
  categories: SidebarCategory[]
  onRefresh: () => void
}) {
  const { selectPage } = usePageStore()
  const drag = useDrag()
  const [collapsed, setCollapsed] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(category.name)
  const menuRef = useRef<HTMLDivElement>(null)

  const isDropTarget = drag.dropTargetId === category.id && drag.dropTargetType === 'cat'

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleRename = async () => {
    if (renameVal.trim()) {
      await window.api.updateCategory(category.id, { name: renameVal.trim() })
      onRefresh()
    }
    setRenaming(false)
  }

  const handleDelete = async () => {
    if (confirm(`"${category.name}" kategorisi silinecek. İçindeki sayfalar "Sayfalar" bölümüne taşınacak.`)) {
      await window.api.deleteCategory(category.id)
      onRefresh()
    }
    setMenuOpen(false)
  }

  const addPage = async (type: string) => {
    const id = await window.api.createPage('Başlıksız', null, PAGE_TYPE_ICON_STR[type] || '📄', type, category.id)
    onRefresh()
    selectPage(id, type)
  }

  return (
    <div className="mt-1">
      <div
        draggable={!renaming}
        onDragStart={e => {
          e.dataTransfer.setData('drag-type', 'cat')
          e.dataTransfer.setData('drag-id', String(category.id))
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragOver={e => {
          e.preventDefault()
          drag.onDragOver('cat', category.id)
        }}
        onDragLeave={drag.onDragLeave}
        onDrop={e => {
          e.preventDefault()
          const dragType = e.dataTransfer.getData('drag-type') as 'cat' | 'page'
          const dragId = Number(e.dataTransfer.getData('drag-id'))
          drag.onDrop(dragType, dragId, 'cat', category.id)
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-[#efefef] group cursor-pointer ${
          isDropTarget ? 'border-t-2 border-blue-400' : ''
        }`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => !renaming && setCollapsed(c => !c)}
      >
        {/* Drag handle */}
        <span className={`text-[#c7c6c4] flex-shrink-0 cursor-grab active:cursor-grabbing transition-opacity ${hovering && !renaming ? 'opacity-100' : 'opacity-0'}`}
              onClick={e => e.stopPropagation()}>
          <GripVertical size={11} />
        </span>

        <span className="text-[#9b9a97] flex-shrink-0 w-3">
          {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
        </span>

        {renaming ? (
          <input
            autoFocus
            className="flex-1 bg-white border border-blue-400 rounded px-1 text-[11px] font-semibold uppercase tracking-wide outline-none min-w-0"
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setRenaming(false); setRenameVal(category.name) } }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide truncate">
            {category.name}
          </span>
        )}

        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative">
            <button
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#e0e0de] text-[#9b9a97]"
              onClick={() => setAddOpen(v => !v)}
              title="Sayfa ekle"
            >
              <Plus size={11} />
            </button>
            {addOpen && <AddDropdown onSelect={addPage} onClose={() => setAddOpen(false)} />}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#e0e0de] text-[#9b9a97]"
              onClick={() => setMenuOpen(v => !v)}
            >
              <MoreHorizontal size={11} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-5 z-50 bg-white border border-[#e9e9e7] rounded-xl shadow-lg py-1 w-44 text-[13px]">
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center gap-2"
                  onClick={() => { setRenaming(true); setRenameVal(category.name); setMenuOpen(false) }}
                >
                  <Edit2 size={12} /> Yeniden Adlandır
                </button>
                <div className="border-t border-[#e9e9e7] my-1" />
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-500 flex items-center gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 size={12} /> Sil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!collapsed && (
        <div>
          {pages.length === 0 && (
            <p className="px-7 py-1 text-[12px] text-[#9b9a97] italic">Boş</p>
          )}
          {pages.map(page => (
            <PageItem key={page.id} page={page} allPages={allPages} categories={categories} onCategoryChange={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── DefaultSection ────────────────────────────────────────────────────────────

function DefaultSection({
  pages, allPages, categories, onRefresh
}: {
  pages: Page[]
  allPages: Page[]
  categories: SidebarCategory[]
  onRefresh: () => void
}) {
  const { selectPage } = usePageStore()
  const [collapsed, setCollapsed] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const addPage = async (type: string) => {
    const id = await window.api.createPage('Başlıksız', null, PAGE_TYPE_ICON_STR[type] || '📄', type, null)
    onRefresh()
    selectPage(id, type)
  }

  return (
    <div className="mt-1">
      <div
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#efefef] group cursor-pointer"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="w-3 flex-shrink-0" /> {/* spacer for grip alignment */}
        <span className="text-[#9b9a97] flex-shrink-0 w-3">
          {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
        </span>
        <span className="flex-1 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide">
          Sayfalar
        </span>
        <div
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 relative"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#e0e0de] text-[#9b9a97]"
            onClick={() => setAddOpen(v => !v)}
          >
            <Plus size={11} />
          </button>
          {addOpen && <AddDropdown onSelect={addPage} onClose={() => setAddOpen(false)} />}
        </div>
      </div>

      {!collapsed && (
        <div>
          {pages.length === 0 && (
            <p className="px-7 py-1 text-[12px] text-[#9b9a97] italic">
              {categories.length === 0 ? '+ butonuna tıklayarak başlayın' : 'Boş'}
            </p>
          )}
          {pages.map(page => (
            <PageItem key={page.id} page={page} allPages={allPages} categories={categories} onCategoryChange={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { pages, loadPages, selectGlobalCalendar, selectHome, selectLibrary, selectTasks, selectedPageId, selectedPageType } = usePageStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [categories, setCategories] = useState<SidebarCategory[]>([])
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const newCatRef = useRef<HTMLInputElement>(null)
  const [dropTargetId, setDropTargetId] = useState<number | null>(null)
  const [dropTargetType, setDropTargetType] = useState<'cat' | 'page' | null>(null)
  const isCalendarActive = selectedPageId === null && selectedPageType === 'calendar'
  const isHomeActive     = selectedPageId === null && selectedPageType === 'home'
  const isLibraryActive  = selectedPageId === null && selectedPageType === 'library'
  const isTasksActive    = selectedPageId === null && selectedPageType === 'tasks'

  const loadCategories = async () => {
    const cats = await window.api.getCategories()
    setCategories(cats)
  }

  const refresh = async () => {
    await loadPages()
    await loadCategories()
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    if (addingCategory) newCatRef.current?.focus()
  }, [addingCategory])

  const confirmAddCategory = async () => {
    if (newCatName.trim()) {
      await window.api.createCategory(newCatName.trim())
      await loadCategories()
    }
    setNewCatName('')
    setAddingCategory(false)
  }

  // ── Drag/drop handlers ──────────────────────────────────────────────────────

  const handleDragOver = (type: 'cat' | 'page', id: number) => {
    setDropTargetId(id)
    setDropTargetType(type)
  }

  const handleDragLeave = () => {
    setDropTargetId(null)
    setDropTargetType(null)
  }

  const handleDrop = async (
    dragType: 'cat' | 'page',
    dragId: number,
    targetType: 'cat' | 'page',
    targetId: number
  ) => {
    setDropTargetId(null)
    setDropTargetType(null)

    if (dragType === 'cat' && targetType === 'cat' && dragId !== targetId) {
      const fromIdx = categories.findIndex(c => c.id === dragId)
      const toIdx = categories.findIndex(c => c.id === targetId)
      if (fromIdx !== -1 && toIdx !== -1) {
        const reordered = reorderArray(categories, fromIdx, toIdx)
        setCategories(reordered) // optimistic
        await window.api.reorderCategories(reordered.map(c => c.id))
        await loadCategories()
      }
    } else if (dragType === 'page' && targetType === 'page' && dragId !== targetId) {
      const draggedPage = pages.find(p => p.id === dragId)
      const targetPage = pages.find(p => p.id === targetId)
      if (!draggedPage || !targetPage || draggedPage.parent_id !== null) return

      if (draggedPage.category_id === targetPage.category_id) {
        // Same section: reorder
        const sectionPages = pages.filter(p => p.parent_id === null && p.category_id === targetPage.category_id)
        const fromIdx = sectionPages.findIndex(p => p.id === dragId)
        const toIdx = sectionPages.findIndex(p => p.id === targetId)
        if (fromIdx !== -1 && toIdx !== -1) {
          const reordered = reorderArray(sectionPages, fromIdx, toIdx)
          await window.api.reorderPages(reordered.map(p => p.id))
          await loadPages()
        }
      } else {
        // Different section: move page to target's category and insert before target
        await window.api.updatePage(dragId, { category_id: targetPage.category_id } as Partial<Page>)
        const targetSectionPages = pages.filter(p => p.parent_id === null && p.category_id === targetPage.category_id)
        const toIdx = targetSectionPages.findIndex(p => p.id === targetId)
        if (toIdx !== -1) {
          const withDragged = [...targetSectionPages]
          withDragged.splice(toIdx, 0, draggedPage)
          await window.api.reorderPages(withDragged.map(p => p.id))
        }
        await refresh()
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────

  const rootPages = pages.filter(p => p.parent_id === null)
  const uncategorized = rootPages.filter(p => p.category_id === null || !categories.find(c => c.id === p.category_id))

  const dragCtx: DragCtx = {
    dropTargetId,
    dropTargetType,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }

  return (
    <>
    <DragContext.Provider value={dragCtx}>
      <div className="flex flex-col h-full bg-[#f7f7f5] border-r border-[#e9e9e7] select-none">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-[#e9e9e7]">
          <div className="w-6 h-6 bg-[#37352f] rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="font-semibold text-[14px] text-[#37352f] flex-1 truncate">SoftwareNode</span>
        </div>

        {/* Home */}
        <button
          onClick={selectHome}
          className={`flex items-center gap-2 px-3 py-1.5 mx-1 mt-1 rounded text-[13px] transition-colors ${
            isHomeActive ? 'bg-[#efefef] text-[#37352f] font-medium' : 'hover:bg-[#efefef] text-[#9b9a97]'
          }`}
        >
          <Home size={13} />
          <span>Ana Sayfa</span>
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 mx-1 rounded hover:bg-[#efefef] text-[#9b9a97] text-[13px] transition-colors"
        >
          <Search size={13} />
          <span>Ara</span>
        </button>

        {/* Global Calendar */}
        <button
          onClick={selectGlobalCalendar}
          className={`flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-[13px] transition-colors ${
            isCalendarActive ? 'bg-[#efefef] text-[#37352f] font-medium' : 'hover:bg-[#efefef] text-[#9b9a97]'
          }`}
        >
          <Calendar size={13} />
          <span>Takvim</span>
        </button>

        {/* Library */}
        <button
          onClick={selectLibrary}
          className={`flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-[13px] transition-colors ${
            isLibraryActive ? 'bg-[#efefef] text-[#37352f] font-medium' : 'hover:bg-[#efefef] text-[#9b9a97]'
          }`}
        >
          <BookOpen size={13} />
          <span>Kütüphane</span>
        </button>

        {/* Tasks */}
        <button
          onClick={selectTasks}
          className={`flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-[13px] transition-colors ${
            isTasksActive ? 'bg-[#efefef] text-[#37352f] font-medium' : 'hover:bg-[#efefef] text-[#9b9a97]'
          }`}
        >
          <CheckSquare size={13} />
          <span>Görevler</span>
        </button>

        {/* Page sections */}
        <div
          className="flex-1 overflow-y-auto px-1 pb-2 mt-1"
          onDragEnd={handleDragLeave}
        >
          {categories.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              pages={rootPages.filter(p => p.category_id === cat.id)}
              allPages={pages}
              categories={categories}
              onRefresh={refresh}
            />
          ))}

          <DefaultSection
            pages={uncategorized}
            allPages={pages}
            categories={categories}
            onRefresh={refresh}
          />

          {/* Add category */}
          {addingCategory ? (
            <div className="px-2 mt-2">
              <input
                ref={newCatRef}
                className="w-full bg-white border border-blue-400 rounded px-2 py-1 text-[12px] font-semibold uppercase tracking-wide outline-none"
                placeholder="Kategori adı..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onBlur={confirmAddCategory}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmAddCategory()
                  if (e.key === 'Escape') { setNewCatName(''); setAddingCategory(false) }
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 mt-2 w-full text-left rounded hover:bg-[#efefef] text-[#9b9a97] text-[12px] transition-colors"
            >
              <Plus size={11} />
              <span>Kategori ekle</span>
            </button>
          )}
        </div>
      </div>
    </DragContext.Provider>
    {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  )
}
