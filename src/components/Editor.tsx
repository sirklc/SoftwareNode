import React, { useEffect, useRef, useCallback, useState } from 'react'
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  createReactBlockSpec,
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { Page } from '../types'
import { usePageStore } from '../store/usePageStore'

// ── Custom block specs ────────────────────────────────────────────────────────

const CALLOUT_STYLES = {
  blue:   { bg: '#e8f4fd', border: '#2eaadc', emoji: '💡' },
  yellow: { bg: '#fff8e1', border: '#f5a623', emoji: '⚠️' },
  red:    { bg: '#fff0f0', border: '#e03e3e', emoji: '🚨' },
  green:  { bg: '#f0fff4', border: '#0f7b6c', emoji: '✅' },
  gray:   { bg: '#f1f1ef', border: '#9b9a97', emoji: '📝' },
} as const

const calloutSpec = createReactBlockSpec(
  {
    type: 'callout' as const,
    propSchema: {
      variant: { default: 'blue' as string },
      emoji:   { default: '💡' as string },
    },
    content: 'inline' as const,
  },
  {
    render: ({ block, contentRef }) => {
      const key = (block.props.variant || 'blue') as keyof typeof CALLOUT_STYLES
      const s = CALLOUT_STYLES[key] ?? CALLOUT_STYLES.blue
      return (
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-start',
          background: s.bg, borderLeft: `4px solid ${s.border}`,
          borderRadius: '4px', padding: '10px 14px', margin: '2px 0',
        }}>
          <span style={{ fontSize: '18px', lineHeight: '1.6', flexShrink: 0, userSelect: 'none' }}>
            {block.props.emoji || s.emoji}
          </span>
          <div ref={contentRef as React.Ref<HTMLDivElement>} style={{ flex: 1, minWidth: 0 }} />
        </div>
      )
    }
  }
)

const quoteSpec = createReactBlockSpec(
  {
    type: 'quote' as const,
    propSchema: {},
    content: 'inline' as const,
  },
  {
    render: ({ contentRef }) => (
      <div style={{ borderLeft: '4px solid #9b9a97', paddingLeft: '14px', margin: '2px 0' }}>
        <div
          ref={contentRef as React.Ref<HTMLDivElement>}
          style={{ color: '#6b6b6b', fontStyle: 'italic', minHeight: '1.5em', lineHeight: '1.6' }}
        />
      </div>
    )
  }
)

const accentSpec = createReactBlockSpec(
  {
    type: 'accent' as const,
    propSchema: { color: { default: 'blue' as string } },
    content: 'inline' as const,
  },
  {
    render: ({ block, contentRef }) => {
      const COLORS: Record<string, string> = {
        blue: '#2eaadc', purple: '#9065b0', green: '#0f7b6c',
        red: '#e03e3e', orange: '#f5a623', gray: '#37352f',
      }
      const c = COLORS[block.props.color] ?? COLORS.blue
      return (
        <div style={{ display: 'flex', gap: 0, margin: '2px 0' }}>
          <div style={{ width: '4px', background: c, borderRadius: '2px', flexShrink: 0 }} />
          <div
            ref={contentRef as React.Ref<HTMLDivElement>}
            style={{ flex: 1, paddingLeft: '14px', minHeight: '1.5em', lineHeight: '1.6' }}
          />
        </div>
      )
    }
  }
)

const dividerSpec = createReactBlockSpec(
  {
    type: 'divider' as const,
    propSchema: {},
    content: 'inline' as const,
  },
  {
    render: ({ contentRef }) => (
      <div style={{ padding: '10px 0', userSelect: 'none' }}>
        <hr style={{ border: 'none', borderTop: '2px solid #9b9a97', margin: 0 }} />
        {/* hidden contentRef so BlockNote can place cursor */}
        <div ref={contentRef as React.Ref<HTMLDivElement>} style={{ height: 0, overflow: 'hidden', fontSize: 0 }} />
      </div>
    )
  }
)

// ── Inner schema (used by column editors — no two-columns to avoid circularity) ──

const innerSchema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, callout: calloutSpec, quote: quoteSpec, divider: dividerSpec, accent: accentSpec },
})

// ── ColumnEditor — mini editor for inline column blocks ───────────────────────

function ColumnEditor({ contentKey, placeholder }: { contentKey: string; placeholder?: string }) {
  const editor = useCreateBlockNote({ schema: innerSchema })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    initialized.current = false
    window.api.getContentByKey(contentKey).then((raw: unknown) => {
      try {
        if (typeof raw === 'string') {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            editor.replaceBlocks(editor.document, parsed as never)
          }
        } else if (Array.isArray(raw) && (raw as unknown[]).length > 0) {
          editor.replaceBlocks(editor.document, raw as never)
        }
      } catch {}
      initialized.current = true
    })
  }, [contentKey])

  const scheduleSave = useCallback(() => {
    if (!initialized.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await window.api.saveContentByKey(contentKey, JSON.stringify(editor.document))
    }, 600)
  }, [contentKey])

  return (
    <BlockNoteView
      editor={editor}
      onChange={scheduleSave}
      theme="light"
      slashMenu={false}
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) => {
          const defaults = getDefaultReactSlashMenuItems(editor)
          return query.trim()
            ? defaults.filter(i => i.title.toLowerCase().includes(query.toLowerCase()))
            : defaults
        }}
      />
    </BlockNoteView>
  )
}

// ── Two-columns block spec ────────────────────────────────────────────────────

const twoColumnsSpec = createReactBlockSpec(
  {
    type: 'two-columns' as const,
    propSchema: {},
    content: 'none' as const,
  },
  {
    render: ({ block }) => (
      <div style={{
        display: 'flex', gap: 0, width: '100%',
        border: '1px solid #e9e9e7', borderRadius: '6px',
        overflow: 'hidden', margin: '4px 0',
      }}>
        <div style={{ flex: 1, padding: '4px 8px', minWidth: 0 }}>
          <ColumnEditor contentKey={`col_${block.id}_1`} placeholder="Sol sütun..." />
        </div>
        <div style={{ width: '1px', background: '#e9e9e7', flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '4px 8px', minWidth: 0 }}>
          <ColumnEditor contentKey={`col_${block.id}_2`} placeholder="Sağ sütun..." />
        </div>
      </div>
    )
  }
)

// ── Outer schema (includes two-columns) ──────────────────────────────────────

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    callout: calloutSpec,
    quote:   quoteSpec,
    divider: dividerSpec,
    accent:  accentSpec,
    'two-columns': twoColumnsSpec,
  },
})

// ── Cover presets ─────────────────────────────────────────────────────────────

const COVER_COLORS = [
  { key: 'none',   bg: '' },
  { key: 'blue',   bg: 'linear-gradient(135deg,#2eaadc,#1a6fa0)' },
  { key: 'purple', bg: 'linear-gradient(135deg,#9065b0,#5c3a8a)' },
  { key: 'green',  bg: 'linear-gradient(135deg,#0f7b6c,#085e52)' },
  { key: 'red',    bg: 'linear-gradient(135deg,#e03e3e,#b22222)' },
  { key: 'orange', bg: 'linear-gradient(135deg,#f5a623,#c87600)' },
  { key: 'dark',   bg: 'linear-gradient(135deg,#37352f,#1a1915)' },
]

const EMOJI_LIST = ['📄','📝','🔖','⭐','💡','🎯','🚀','💼','🏠','🌟','📚','🎨','🔥','✅','🌍','🔬','💎','🎵','🍀','🏆']

// ── Content helpers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadContent(pageId: number, editor: any) {
  const raw = await window.api.getContent(pageId) as unknown
  if (!raw) return
  try {
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        editor.replaceBlocks(editor.document, parsed as never)
        return
      }
    }
    if (Array.isArray(raw) && (raw as unknown[]).length > 0) {
      editor.replaceBlocks(editor.document, raw as never)
      return
    }
  } catch {
    if (typeof raw === 'string') {
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(raw)
        if (blocks.length) editor.replaceBlocks(editor.document, blocks as never)
      } catch {}
    }
  }
}

// ── EditorPanel ───────────────────────────────────────────────────────────────

function EditorPanel({ pageId }: { pageId: number }) {
  const editor = useCreateBlockNote({ schema })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    initialized.current = false
    loadContent(pageId, editor).then(() => { initialized.current = true })
  }, [pageId])

  const scheduleSave = useCallback(() => {
    if (!initialized.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await window.api.saveContent(pageId, JSON.stringify(editor.document) as never)
    }, 600)
  }, [pageId])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function insertBlock(block: any) {
    try {
      const pos = editor.getTextCursorPosition()
      const target = pos?.block ?? editor.document[editor.document.length - 1]
      if (target) editor.insertBlocks([block], target, 'after')
    } catch (e) {
      console.error('insertBlock failed:', e)
    }
  }

  const getSlashItems = useCallback(async (query: string) => {
    const defaults = getDefaultReactSlashMenuItems(editor)
    const custom = [
      {
        title: 'İki Sütun',
        subtext: 'Yan yana iki metin alanı',
        group: 'Düzen',
        icon: <span>⬛⬛</span>,
        onItemClick: () => insertBlock({ type: 'two-columns' }),
      },
      {
        title: 'Callout — Bilgi',
        subtext: 'Mavi bilgi kutusu',
        group: 'Özel Bloklar',
        icon: <span>💡</span>,
        onItemClick: () => insertBlock({ type: 'callout', props: { variant: 'blue', emoji: '💡' } }),
      },
      {
        title: 'Callout — Uyarı',
        subtext: 'Sarı uyarı kutusu',
        group: 'Özel Bloklar',
        icon: <span>⚠️</span>,
        onItemClick: () => insertBlock({ type: 'callout', props: { variant: 'yellow', emoji: '⚠️' } }),
      },
      {
        title: 'Callout — Hata',
        subtext: 'Kırmızı hata kutusu',
        group: 'Özel Bloklar',
        icon: <span>🚨</span>,
        onItemClick: () => insertBlock({ type: 'callout', props: { variant: 'red', emoji: '🚨' } }),
      },
      {
        title: 'Callout — Başarı',
        subtext: 'Yeşil başarı kutusu',
        group: 'Özel Bloklar',
        icon: <span>✅</span>,
        onItemClick: () => insertBlock({ type: 'callout', props: { variant: 'green', emoji: '✅' } }),
      },
      {
        title: 'Callout — Not',
        subtext: 'Gri not kutusu',
        group: 'Özel Bloklar',
        icon: <span>📝</span>,
        onItemClick: () => insertBlock({ type: 'callout', props: { variant: 'gray', emoji: '📝' } }),
      },
      {
        title: 'Alıntı',
        subtext: 'İtalik alıntı kutusu',
        group: 'Özel Bloklar',
        icon: <span style={{ fontSize: '18px' }}>❝</span>,
        onItemClick: () => insertBlock({ type: 'quote', content: [{ type: 'text', text: '', styles: {} }] }),
      },
      {
        title: 'Yatay Çizgi',
        subtext: 'Bölüm ayırıcı',
        group: 'Özel Bloklar',
        icon: <span>──</span>,
        onItemClick: () => insertBlock({ type: 'divider' }),
      },
      {
        title: 'Dikey Çizgi — Mavi',
        subtext: 'Sol kenar vurgu çizgisi',
        group: 'Özel Bloklar',
        icon: <span style={{ color: '#2eaadc', fontWeight: 'bold' }}>│</span>,
        onItemClick: () => insertBlock({ type: 'accent', props: { color: 'blue' }, content: [{ type: 'text', text: '', styles: {} }] }),
      },
      {
        title: 'Dikey Çizgi — Yeşil',
        subtext: 'Sol kenar vurgu çizgisi',
        group: 'Özel Bloklar',
        icon: <span style={{ color: '#0f7b6c', fontWeight: 'bold' }}>│</span>,
        onItemClick: () => insertBlock({ type: 'accent', props: { color: 'green' }, content: [{ type: 'text', text: '', styles: {} }] }),
      },
      {
        title: 'Dikey Çizgi — Mor',
        subtext: 'Sol kenar vurgu çizgisi',
        group: 'Özel Bloklar',
        icon: <span style={{ color: '#9065b0', fontWeight: 'bold' }}>│</span>,
        onItemClick: () => insertBlock({ type: 'accent', props: { color: 'purple' }, content: [{ type: 'text', text: '', styles: {} }] }),
      },
    ]
    const all = [...defaults, ...custom]
    return query.trim()
      ? all.filter(i => i.title.toLowerCase().includes(query.toLowerCase()) || (i.subtext || '').toLowerCase().includes(query.toLowerCase()))
      : all
  }, [editor])

  return (
    <BlockNoteView editor={editor} onChange={scheduleSave} theme="light" slashMenu={false}>
      <SuggestionMenuController triggerCharacter="/" getItems={getSlashItems} />
    </BlockNoteView>
  )
}

// ── Editor ────────────────────────────────────────────────────────────────────

export function Editor({ page }: { page: Page }) {
  const { loadPages } = usePageStore()
  const [title, setTitle] = useState(page.title)
  const [icon, setIcon] = useState(page.icon || '📄')
  const [cover, setCover] = useState(page.cover || '')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [coverOpen, setCoverOpen] = useState(false)

  useEffect(() => {
    setTitle(page.title)
    setIcon(page.icon || '📄')
    setCover(page.cover || '')
    setEmojiOpen(false)
    setCoverOpen(false)
  }, [page.id])

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle)
    await window.api.updatePage(page.id, { title: newTitle || 'Başlıksız' })
    loadPages()
  }

  const handleIconChange = async (newIcon: string) => {
    setIcon(newIcon)
    setEmojiOpen(false)
    await window.api.updatePage(page.id, { icon: newIcon })
    loadPages()
  }

  const handleCoverChange = async (key: string) => {
    const bg = COVER_COLORS.find(c => c.key === key)?.bg ?? ''
    setCover(bg)
    setCoverOpen(false)
    await window.api.updatePage(page.id, { cover: bg })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 px-6 py-2 border-b border-[#e9e9e7] bg-white flex-shrink-0 relative z-20">
        <button
          onClick={() => { setCoverOpen(v => !v); setEmojiOpen(false) }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-[12px] transition-colors ${
            coverOpen ? 'bg-[#efefef] font-medium text-[#37352f]' : 'text-[#9b9a97] hover:bg-[#efefef]'
          }`}
        >
          🖼 Kapak
        </button>
      </div>

      {/* Cover picker — z-40 so it sits above overlay */}
      {coverOpen && (
        <div className="flex items-center gap-2 px-6 py-2 bg-white border-b border-[#e9e9e7] flex-shrink-0 relative z-40">
          <span className="text-[12px] text-[#9b9a97]">Renk:</span>
          {COVER_COLORS.map(c => (
            <button
              key={c.key}
              title={c.key === 'none' ? 'Kaldır' : c.key}
              onClick={() => handleCoverChange(c.key)}
              className={`w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 ${
                cover === c.bg ? 'border-blue-400 scale-125' : 'border-transparent hover:scale-110'
              }`}
              style={c.bg ? { background: c.bg } : { background: '#e9e9e7', borderStyle: 'dashed' }}
            />
          ))}
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover banner — inside scroll so icon can overlap it */}
        {cover && (
          <div className="h-36 w-full flex-shrink-0" style={{ background: cover }} />
        )}

        <div className="max-w-[900px] mx-auto px-[96px] pb-16">

          {/* Icon */}
          <div className={`${cover ? '-mt-8' : 'mt-10'} mb-2 relative`}>
            <button
              className="text-[56px] leading-none hover:bg-[#f1f1ef] rounded-lg p-1 transition-colors relative z-10"
              onClick={e => { e.stopPropagation(); setEmojiOpen(v => !v); setCoverOpen(false) }}
            >
              {icon}
            </button>
            {emojiOpen && (
              <div
                className="absolute top-16 left-0 z-50 bg-white border border-[#e9e9e7] rounded-xl shadow-xl p-3 w-64"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex flex-wrap gap-1 mb-2">
                  {EMOJI_LIST.map(e => (
                    <button
                      key={e}
                      className="text-2xl hover:bg-[#f1f1ef] rounded p-1 w-9 h-9 flex items-center justify-center"
                      onClick={() => handleIconChange(e)}
                    >{e}</button>
                  ))}
                </div>
                <input
                  placeholder="Emoji veya metin..."
                  className="w-full border border-[#e9e9e7] rounded px-2 py-1 text-[13px] outline-none focus:border-blue-400"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val) handleIconChange(val)
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div
            contentEditable
            suppressContentEditableWarning
            className="text-[40px] font-bold text-[#37352f] leading-[1.2] mb-6 outline-none empty:before:content-['Başlıksız'] empty:before:text-[#e0dfdd] cursor-text break-words"
            onInput={e => handleTitleChange(e.currentTarget.textContent || '')}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
            dangerouslySetInnerHTML={{ __html: page.title || '' }}
            key={page.id}
          />

          {/* BlockNote editor */}
          <EditorPanel key={page.id} pageId={page.id} />
        </div>
      </div>

      {/* Overlay to close popups */}
      {(emojiOpen || coverOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setEmojiOpen(false); setCoverOpen(false) }} />
      )}
    </div>
  )
}
