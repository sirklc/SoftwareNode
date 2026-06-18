import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { Page } from '../types'
import { usePageStore } from '../store/usePageStore'

interface EditorProps {
  page: Page
}

export function Editor({ page }: EditorProps) {
  const { loadPages } = usePageStore()
  const [title, setTitle] = useState(page.title)
  const [icon, setIcon] = useState(page.icon || '📄')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  const editor = useCreateBlockNote({
    domAttributes: {
      editor: { class: 'notion-editor' },
    },
  })

  // Load content when page changes
  useEffect(() => {
    initialized.current = false
    setTitle(page.title)
    setIcon(page.icon || '📄')

    window.api.getContent(page.id).then(async (content) => {
      if (content && content.length > 0) {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(
            typeof content === 'string' ? content : JSON.stringify(content)
          )
          editor.replaceBlocks(editor.document, blocks.length ? blocks : [{ type: 'paragraph', content: [] }] as any)
        } catch {
          editor.replaceBlocks(editor.document, [{ type: 'paragraph', content: [] }] as any)
        }
      } else {
        editor.replaceBlocks(editor.document, [{ type: 'paragraph', content: [] }] as any)
      }
      initialized.current = true
    })
  }, [page.id])

  // Auto-save content
  const scheduleSave = useCallback(() => {
    if (!initialized.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document)
      await window.api.saveContent(page.id, markdown as any)
    }, 600)
  }, [page.id, editor])

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle)
    await window.api.updatePage(page.id, { title: newTitle || 'Başlıksız' })
    loadPages()
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-[96px] py-16">
        {/* Icon */}
        <div className="mb-4">
          <button
            className="text-[64px] leading-none hover:bg-[#f1f1ef] rounded-lg p-1 transition-colors"
            title="İkon değiştir"
          >
            {icon}
          </button>
        </div>

        {/* Page title */}
        <div
          contentEditable
          suppressContentEditableWarning
          className="text-[40px] font-bold text-[#37352f] leading-[1.2] mb-8 outline-none empty:before:content-['Başlıksız'] empty:before:text-[#e0dfdd] cursor-text break-words"
          onInput={(e) => handleTitleChange(e.currentTarget.textContent || '')}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault() } }}
          dangerouslySetInnerHTML={{ __html: page.title || '' }}
          key={page.id}
        />

        {/* BlockNote editor */}
        <BlockNoteView
          editor={editor}
          onChange={scheduleSave}
          theme="light"
        />
      </div>
    </div>
  )
}
