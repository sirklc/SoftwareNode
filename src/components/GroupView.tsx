import React from 'react'
import { FileText, Database, Calendar, DollarSign, Film, Folder, Plus } from 'lucide-react'
import { Page } from '../types'
import { usePageStore } from '../store/usePageStore'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  note: <FileText size={20} />,
  database: <Database size={20} />,
  calendar: <Calendar size={20} />,
  finance: <DollarSign size={20} />,
  content: <Film size={20} />,
  group: <Folder size={20} />,
}

const TYPE_BG: Record<string, string> = {
  note: 'bg-[#f1f1ef]',
  database: 'bg-blue-50',
  calendar: 'bg-purple-50',
  finance: 'bg-green-50',
  content: 'bg-pink-50',
  group: 'bg-yellow-50',
}

const TYPE_LABELS: Record<string, string> = {
  note: 'Not', database: 'Veritabanı', calendar: 'Takvim',
  finance: 'Finans', content: 'İçerik', group: 'Grup',
}

interface Props { page: Page }

export function GroupView({ page }: Props) {
  const { pages, loadPages, selectPage } = usePageStore()
  const children = pages.filter(p => p.parent_id === page.id)

  const addChild = async (type: string) => {
    const iconMap: Record<string, string> = {
      note: '📄', database: '🗃️', calendar: '📅', finance: '💰', content: '🎬', group: '📁'
    }
    const id = await window.api.createPage('Başlıksız', page.id, iconMap[type] || '📄', type)
    await loadPages()
    selectPage(id, type)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[900px] mx-auto px-12 py-10">
        <h1 className="text-[40px] font-bold text-[#37352f] mb-2">{page.title}</h1>
        <p className="text-[#9b9a97] text-[14px] mb-8">{children.length} sayfa</p>

        {children.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => selectPage(child.id, child.page_type)}
                className={`flex items-center gap-3 p-4 rounded-xl border border-[#e9e9e7] hover:border-[#c7c6c4] hover:shadow-sm transition-all text-left ${TYPE_BG[child.page_type] || 'bg-[#f1f1ef]'}`}
              >
                <div className="text-[#37352f] opacity-60">
                  {TYPE_ICONS[child.page_type] || <FileText size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-[#37352f] truncate">{child.title || 'Başlıksız'}</div>
                  <div className="text-[11px] text-[#9b9a97]">{TYPE_LABELS[child.page_type]}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Add new page inside group */}
        <div className="border-t border-[#e9e9e7] pt-6">
          <p className="text-[12px] font-semibold text-[#9b9a97] uppercase tracking-wide mb-3">Gruba Ekle</p>
          <div className="flex flex-wrap gap-2">
            {[
              { type: 'note', label: '📄 Not' },
              { type: 'database', label: '🗃️ Veritabanı' },
              { type: 'finance', label: '💰 Finans' },
              { type: 'content', label: '🎬 İçerik' },
              { type: 'group', label: '📁 Alt Grup' },
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => addChild(type)}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#e9e9e7] rounded-lg text-[13px] text-[#37352f] hover:bg-[#f1f1ef] transition-colors"
              >
                <Plus size={12} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
