import React, { useEffect, useState, useRef } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { DatabaseView } from './components/DatabaseView'
import { CalendarView } from './components/CalendarView'
import { FinanceView } from './components/FinanceView'
import { ContentView } from './components/ContentView'
import { GroupView } from './components/GroupView'
import { usePageStore } from './store/usePageStore'
import { Page } from './types'

function WelcomeScreen() {
  const { loadPages } = usePageStore()
  const addPage = async (type: string) => {
    const iconMap: Record<string, string> = {
      note: '📄', database: '🗃️', calendar: '📅', finance: '💰', content: '🎬', group: '📁'
    }
    const id = await window.api.createPage('Başlıksız', null, iconMap[type] || '📄', type)
    await loadPages()
    usePageStore.setState({ selectedPageId: id, selectedPageType: type })
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
      <div className="w-16 h-16 bg-[#37352f] rounded-2xl flex items-center justify-center">
        <span className="text-white text-3xl font-bold">S</span>
      </div>
      <h1 className="text-[32px] font-bold text-[#37352f]">SoftwareNode'a Hoş Geldiniz</h1>
      <p className="text-[#9b9a97] text-[15px] max-w-sm">
        Sol paneldeki <strong>+</strong> butonuna tıklayarak yeni bir sayfa oluşturun.
      </p>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {[
          { type: 'note',     label: '📄 Not' },
          { type: 'database', label: '🗃️ Veritabanı' },
          { type: 'finance',  label: '💰 Finans' },
          { type: 'content',  label: '🎬 İçerik' },
          { type: 'group',    label: '📁 Grup' },
        ].map(({ type, label }) => (
          <button
            key={type}
            onClick={() => addPage(type)}
            className="px-4 py-2 border border-[#e9e9e7] text-[#37352f] rounded-lg text-[14px] hover:bg-[#f1f1ef] transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { selectedPageId, selectedPageType, sidebarWidth, setSidebarWidth } = usePageStore()
  const [currentPage, setCurrentPage] = useState<Page | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  useEffect(() => {
    if (!selectedPageId) { setCurrentPage(null); return }
    window.api.getPage(selectedPageId).then(setCurrentPage)
  }, [selectedPageId])

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = sidebarWidth
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return
    const newW = Math.max(180, Math.min(480, startW.current + e.clientX - startX.current))
    setSidebarWidth(newW)
  }
  const onMouseUp = () => {
    dragging.current = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  const renderContent = () => {
    // Global calendar (no page needed)
    if (selectedPageType === 'calendar' && !selectedPageId) return <CalendarView />
    if (!currentPage) return <WelcomeScreen />
    switch (selectedPageType) {
      case 'database': return <DatabaseView key={currentPage.id} page={currentPage} />
      case 'finance':  return <FinanceView  key={currentPage.id} page={currentPage} />
      case 'content':  return <ContentView  key={currentPage.id} page={currentPage} />
      case 'group':    return <GroupView    key={currentPage.id} page={currentPage} />
      default:         return <Editor       key={currentPage.id} page={currentPage} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {sidebarVisible && (
        <div style={{ width: sidebarWidth, flexShrink: 0 }} className="flex flex-col h-full">
          <Sidebar />
        </div>
      )}

      {sidebarVisible && (
        <div
          className="w-1 cursor-col-resize bg-transparent hover:bg-[#2eaadc] transition-colors flex-shrink-0"
          onMouseDown={onMouseDown}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-10 flex items-center px-4 border-b border-[#e9e9e7] flex-shrink-0">
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#efefef] text-[#9b9a97] mr-2"
            onClick={() => setSidebarVisible(v => !v)}
            title="Kenar çubuğunu gizle/göster"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
          {currentPage && (
            <span className="text-[13px] text-[#9b9a97] truncate">
              {currentPage.icon} {currentPage.title}
            </span>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
