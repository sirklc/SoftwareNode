import React, { useState, useRef, useEffect } from 'react'
import {
  FileText, Database, Calendar, ChevronRight, ChevronDown,
  Plus, Trash2, Edit2, MoreHorizontal, Search
} from 'lucide-react'
import { Page } from '../types'
import { usePageStore } from '../store/usePageStore'

const PAGE_ICONS: Record<string, React.ReactNode> = {
  note: <FileText size={14} />,
  database: <Database size={14} />,
  calendar: <Calendar size={14} />,
}

function PageItem({
  page,
  allPages,
  depth = 0,
}: {
  page: Page
  allPages: Page[]
  depth?: number
}) {
  const { selectedPageId, selectPage, loadPages } = usePageStore()
  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(page.title)
  const menuRef = useRef<HTMLDivElement>(null)

  const children = allPages.filter(p => p.parent_id === page.id)
  const hasChildren = children.length > 0
  const isSelected = selectedPageId === page.id

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    const id = await window.api.createPage('Başlıksız', page.id, type === 'note' ? '📄' : type === 'database' ? '🗃️' : '📅', type)
    await loadPages()
    setExpanded(true)
    selectPage(id, type)
    setMenuOpen(false)
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-[3px] rounded-md cursor-pointer select-none text-[14px] transition-colors ${
          isSelected ? 'bg-[#efefef]' : 'hover:bg-[#f1f1ef]'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => { selectPage(page.id, page.page_type); if (!expanded && hasChildren) setExpanded(true) }}
      >
        {/* Toggle arrow */}
        <button
          className="w-4 h-4 flex items-center justify-center text-[#9b9a97] hover:text-[#37352f] flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
        >
          {hasChildren
            ? expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            : <span className="w-3" />}
        </button>

        {/* Icon */}
        <span className="text-[#9b9a97] flex-shrink-0">{PAGE_ICONS[page.page_type]}</span>

        {/* Title */}
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
          <span className="flex-1 truncate text-[#37352f] min-w-0">
            {page.title || 'Başlıksız'}
          </span>
        )}

        {/* Actions */}
        {(hovering || menuOpen) && !renaming && (
          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#e0e0de] text-[#9b9a97]"
              onClick={() => handleAddChild('note')}
              title="Alt sayfa ekle"
            >
              <Plus size={12} />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#e0e0de] text-[#9b9a97]"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreHorizontal size={12} />
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-6 z-50 bg-white border border-[#e9e9e7] rounded-lg shadow-lg py-1 w-44 text-[13px]">
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center gap-2"
                    onClick={() => { setRenaming(true); setRenameVal(page.title); setMenuOpen(false) }}>
                    <Edit2 size={13} /> Yeniden Adlandır
                  </button>
                  <div className="border-t border-[#e9e9e7] my-1" />
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center gap-2"
                    onClick={() => handleAddChild('note')}>
                    <FileText size={13} /> Alt Not Ekle
                  </button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center gap-2"
                    onClick={() => handleAddChild('database')}>
                    <Database size={13} /> Alt Veritabanı
                  </button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-[#f1f1ef] flex items-center gap-2"
                    onClick={() => handleAddChild('calendar')}>
                    <Calendar size={13} /> Alt Takvim
                  </button>
                  <div className="border-t border-[#e9e9e7] my-1" />
                  <button className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-500 flex items-center gap-2"
                    onClick={handleDelete}>
                    <Trash2 size={13} /> Sil
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {expanded && children.map(child => (
        <PageItem key={child.id} page={child} allPages={allPages} depth={depth + 1} />
      ))}
    </div>
  )
}

export function Sidebar() {
  const { pages, loadPages, selectPage } = usePageStore()

  useEffect(() => { loadPages() }, [])

  const rootPages = pages.filter(p => p.parent_id === null)

  const addPage = async (type: string) => {
    const icon = type === 'note' ? '📄' : type === 'database' ? '🗃️' : '📅'
    const id = await window.api.createPage('Başlıksız', null, icon, type)
    await loadPages()
    selectPage(id, type)
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f7f5] border-r border-[#e9e9e7] select-none">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[#e9e9e7]">
        <div className="w-6 h-6 bg-[#37352f] rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>
        <span className="font-semibold text-[14px] text-[#37352f] flex-1">SoftwareNode</span>
      </div>

      {/* Search */}
      <button className="flex items-center gap-2 px-3 py-1.5 mx-1 mt-1 rounded hover:bg-[#efefef] text-[#9b9a97] text-[13px] transition-colors">
        <Search size={13} />
        <span>Ara</span>
      </button>

      {/* Pages section */}
      <div className="flex items-center justify-between px-3 py-1 mt-2">
        <span className="text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide">Sayfalar</span>
        <button
          className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#efefef] text-[#9b9a97]"
          onClick={() => addPage('note')}
          title="Yeni sayfa"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Page tree */}
      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {rootPages.length === 0 ? (
          <div className="px-4 py-3 text-[13px] text-[#9b9a97]">
            Henüz sayfa yok
          </div>
        ) : (
          rootPages.map(page => (
            <PageItem key={page.id} page={page} allPages={pages} />
          ))
        )}
      </div>

      {/* Bottom: new page buttons */}
      <div className="border-t border-[#e9e9e7] p-2 space-y-0.5">
        <button
          onClick={() => addPage('note')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#efefef] text-[13px] text-[#9b9a97] transition-colors"
        >
          <Plus size={13} /> Yeni sayfa
        </button>
        <button
          onClick={() => addPage('database')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#efefef] text-[13px] text-[#9b9a97] transition-colors"
        >
          <Plus size={13} /> Yeni veritabanı
        </button>
        <button
          onClick={() => addPage('calendar')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#efefef] text-[13px] text-[#9b9a97] transition-colors"
        >
          <Plus size={13} /> Yeni takvim
        </button>
      </div>
    </div>
  )
}
