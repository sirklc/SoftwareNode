import React, { useEffect, useState, useRef } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { DatabaseView } from './components/DatabaseView'
import { CalendarView } from './components/CalendarView'
import { FinanceView } from './components/FinanceView'
import { ContentView } from './components/ContentView'
import { GroupView } from './components/GroupView'
import { Home } from './components/Home'
import { Library } from './components/Library'
import { TasksView } from './components/TasksView'
import { DevView } from './components/DevView'
import { usePageStore } from './store/usePageStore'
import { Page } from './types'

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
    if (selectedPageType === 'home' && !selectedPageId) return <Home />
    if (selectedPageType === 'calendar' && !selectedPageId) return <CalendarView />
    if (selectedPageType === 'library' && !selectedPageId) return <Library />
    if (selectedPageType === 'tasks' && !selectedPageId) return <TasksView />
    if (!currentPage) return <Home />
    switch (selectedPageType) {
      case 'database': return <DatabaseView key={currentPage.id} page={currentPage} />
      case 'finance':  return <FinanceView  key={currentPage.id} page={currentPage} />
      case 'content':  return <ContentView  key={currentPage.id} page={currentPage} />
      case 'group':    return <GroupView    key={currentPage.id} page={currentPage} />
      case 'dev':      return <DevView      key={currentPage.id} page={currentPage} />
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
