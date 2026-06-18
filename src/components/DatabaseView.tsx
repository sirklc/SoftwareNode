import React, { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { Page, DbColumn, DbRow } from '../types'

const COL_TYPE_LABELS: Record<string, string> = {
  text: 'Metin',
  number: 'Sayı',
  checkbox: 'Onay Kutusu',
  date: 'Tarih',
  select: 'Seçim',
}

interface Props { page: Page }

export function DatabaseView({ page }: Props) {
  const [columns, setColumns] = useState<DbColumn[]>([])
  const [rows, setRows] = useState<DbRow[]>([])
  const [addingCol, setAddingCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColType, setNewColType] = useState('text')
  const [editingCell, setEditingCell] = useState<{ rowId: number; colId: number } | null>(null)
  const [editVal, setEditVal] = useState('')

  const load = async () => {
    const [cols, rws] = await Promise.all([
      window.api.getDbColumns(page.id),
      window.api.getDbRows(page.id),
    ])
    setColumns(cols)
    setRows(rws)
  }

  useEffect(() => { load() }, [page.id])

  const addColumn = async () => {
    if (!newColName.trim()) return
    await window.api.addDbColumn(page.id, newColName.trim(), newColType)
    setNewColName('')
    setNewColType('text')
    setAddingCol(false)
    load()
  }

  const addRow = async () => {
    await window.api.addDbRow(page.id)
    load()
  }

  const deleteColumn = async (id: number) => {
    if (!confirm('Bu sütunu silmek istediğinize emin misiniz?')) return
    await window.api.deleteDbColumn(id)
    load()
  }

  const deleteRow = async (id: number) => {
    await window.api.deleteDbRow(id)
    load()
  }

  const startEdit = (rowId: number, colId: number, val: string) => {
    setEditingCell({ rowId, colId })
    setEditVal(val)
  }

  const commitEdit = async () => {
    if (!editingCell) return
    const row = rows.find(r => r.id === editingCell.rowId)
    if (row) {
      const updated = { ...row.row_data, [editingCell.colId]: editVal }
      await window.api.updateDbRow(editingCell.rowId, updated)
    }
    setEditingCell(null)
    load()
  }

  const toggleCheckbox = async (rowId: number, colId: number, current: boolean) => {
    const row = rows.find(r => r.id === rowId)
    if (row) {
      const updated = { ...row.row_data, [colId]: !current }
      await window.api.updateDbRow(rowId, updated)
      load()
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[1200px] mx-auto px-16 py-12">
        {/* Title */}
        <h1 className="text-[40px] font-bold text-[#37352f] mb-8">{page.title}</h1>

        {/* Table */}
        <div className="border border-[#e9e9e7] rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f7f7f5]">
                <th className="w-8 border-r border-[#e9e9e7]" />
                {columns.map(col => (
                  <th key={col.id} className="border-r border-[#e9e9e7] text-left">
                    <div className="flex items-center justify-between px-3 py-2 group">
                      <span className="text-[12px] font-medium text-[#9b9a97] uppercase tracking-wide">
                        {col.name}
                        <span className="ml-1 text-[10px] opacity-60">({COL_TYPE_LABELS[col.col_type]})</span>
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                        onClick={() => deleteColumn(col.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </th>
                ))}
                {/* Add column */}
                <th className="w-10">
                  {!addingCol ? (
                    <button
                      className="w-full h-full flex items-center justify-center py-2 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#efefef] transition-colors"
                      onClick={() => setAddingCol(true)}
                    >
                      <Plus size={14} />
                    </button>
                  ) : (
                    <div className="p-2 space-y-1 min-w-[160px]">
                      <input
                        autoFocus
                        placeholder="Sütun adı"
                        className="w-full text-[12px] border border-[#e9e9e7] rounded px-2 py-1 outline-none focus:border-blue-400"
                        value={newColName}
                        onChange={e => setNewColName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') setAddingCol(false) }}
                      />
                      <select
                        className="w-full text-[12px] border border-[#e9e9e7] rounded px-2 py-1 outline-none"
                        value={newColType}
                        onChange={e => setNewColType(e.target.value)}
                      >
                        {Object.entries(COL_TYPE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button className="flex-1 text-[11px] bg-[#37352f] text-white rounded py-1" onClick={addColumn}>Ekle</button>
                        <button className="flex-1 text-[11px] border border-[#e9e9e7] rounded py-1" onClick={() => setAddingCol(false)}>İptal</button>
                      </div>
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.id} className="border-t border-[#e9e9e7] hover:bg-[#f7f7f5] group">
                  <td className="w-8 border-r border-[#e9e9e7] text-center">
                    <button
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 px-2 py-2 transition-opacity"
                      onClick={() => deleteRow(row.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                  {columns.map(col => {
                    const val = row.row_data[col.id] ?? ''
                    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id
                    return (
                      <td key={col.id} className="border-r border-[#e9e9e7] px-3 py-2 text-[14px]">
                        {col.col_type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={!!val}
                            onChange={() => toggleCheckbox(row.id, col.id, !!val)}
                            className="w-4 h-4 rounded cursor-pointer accent-[#2eaadc]"
                          />
                        ) : isEditing ? (
                          <input
                            autoFocus
                            className="w-full outline-none bg-transparent text-[14px]"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null) }}
                            type={col.col_type === 'number' ? 'number' : col.col_type === 'date' ? 'date' : 'text'}
                          />
                        ) : (
                          <div
                            className="min-h-[20px] cursor-text text-[#37352f]"
                            onDoubleClick={() => startEdit(row.id, col.id, String(val))}
                          >
                            {String(val || '')}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td />
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add row */}
          <button
            className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-[#9b9a97] hover:bg-[#f1f1ef] border-t border-[#e9e9e7] transition-colors"
            onClick={addRow}
          >
            <Plus size={13} /> Yeni satır ekle
          </button>
        </div>

        {rows.length === 0 && columns.length === 0 && (
          <div className="text-center py-12 text-[#9b9a97]">
            <Database size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-[14px]">+ Sütun ekle butonuna tıklayarak başlayın</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Database({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  )
}
