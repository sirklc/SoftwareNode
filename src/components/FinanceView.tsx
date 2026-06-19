import React, { useEffect, useState } from 'react'
import { Plus, Trash2, X, TrendingUp, TrendingDown, Wallet, Edit2 } from 'lucide-react'
import { Page, FinanceEntry } from '../types'

const GELIR_CATS = ['Maaş', 'Serbest İş', 'Yatırım', 'Kira Geliri', 'Hediye', 'Diğer']
const GIDER_CATS = ['Kira', 'Market', 'Fatura', 'Ulaşım', 'Sağlık', 'Eğlence', 'Giyim', 'Eğitim', 'Restoran', 'Diğer']
const RECURRING = ['yok', 'haftalık', 'aylık', 'yıllık']

const TL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n)

const fmtDate = (s: string) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d} ${months[parseInt(m) - 1]} ${y}`
}

interface FormState {
  title: string
  amount: string
  type: 'gelir' | 'gider'
  category: string
  date: string
  note: string
  recurring: string
}

const defaultForm = (): FormState => ({
  title: '', amount: '', type: 'gelir', category: 'Maaş', date: '', note: '', recurring: 'yok'
})

interface Props { page: Page }

export function FinanceView({ page }: Props) {
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [filter, setFilter] = useState<'tümü' | 'gelir' | 'gider'>('tümü')
  const [modal, setModal] = useState<false | 'add' | number>(false)
  const [form, setForm] = useState<FormState>(defaultForm())

  const load = () => window.api.getFinanceEntries(page.id).then(setEntries)
  useEffect(() => { load() }, [page.id])

  const openAdd = () => { setForm(defaultForm()); setModal('add') }

  const openEdit = (e: FinanceEntry) => {
    setForm({
      title: e.title, amount: String(e.amount), type: e.type,
      category: e.category, date: e.date, note: e.note, recurring: e.recurring,
    })
    setModal(e.id)
  }

  const save = async () => {
    if (!form.title.trim() || !form.amount) return
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) return
    if (modal === 'add') {
      await window.api.addFinanceEntry(
        page.id, form.title.trim(), amt, form.type,
        form.category, form.date, form.note, form.recurring
      )
    } else if (typeof modal === 'number') {
      await window.api.updateFinanceEntry(modal, {
        title: form.title.trim(), amount: amt, type: form.type,
        category: form.category, date: form.date, note: form.note,
        recurring: form.recurring as FinanceEntry['recurring'],
      })
    }
    setModal(false)
    load()
  }

  const remove = async (id: number) => {
    await window.api.deleteFinanceEntry(id)
    load()
  }

  const cats = form.type === 'gelir' ? GELIR_CATS : GIDER_CATS

  const visible = entries.filter(e => filter === 'tümü' || e.type === filter)
  const totalGelir = entries.filter(e => e.type === 'gelir').reduce((s, e) => s + e.amount, 0)
  const totalGider = entries.filter(e => e.type === 'gider').reduce((s, e) => s + e.amount, 0)
  const bakiye = totalGelir - totalGider

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[960px] mx-auto px-12 py-10">
        <h1 className="text-[40px] font-bold text-[#37352f] mb-8">{page.title}</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className={`rounded-xl p-5 ${bakiye >= 0 ? 'bg-[#e8f5e9]' : 'bg-[#fce4ec]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className={bakiye >= 0 ? 'text-[#0f7b6c]' : 'text-[#e03e3e]'} />
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#9b9a97]">Bakiye</span>
            </div>
            <div className={`text-[26px] font-bold ${bakiye >= 0 ? 'text-[#0f7b6c]' : 'text-[#e03e3e]'}`}>
              {TL(bakiye)}
            </div>
          </div>
          <div className="rounded-xl p-5 bg-[#e8f5e9]">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-[#0f7b6c]" />
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#9b9a97]">Toplam Gelir</span>
            </div>
            <div className="text-[26px] font-bold text-[#0f7b6c]">{TL(totalGelir)}</div>
          </div>
          <div className="rounded-xl p-5 bg-[#fce4ec]">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-[#e03e3e]" />
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#9b9a97]">Toplam Gider</span>
            </div>
            <div className="text-[26px] font-bold text-[#e03e3e]">{TL(totalGider)}</div>
          </div>
        </div>

        {/* Filter + Add */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-1 bg-[#f1f1ef] rounded-lg">
            {(['tümü', 'gelir', 'gider'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors capitalize ${
                  filter === f ? 'bg-white text-[#37352f] shadow-sm' : 'text-[#9b9a97] hover:text-[#37352f]'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#37352f] text-white rounded-lg text-[13px] hover:bg-[#2f2d28] transition-colors"
          >
            <Plus size={14} /> Yeni Ekle
          </button>
        </div>

        {/* Table */}
        <div className="border border-[#e9e9e7] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f7f7f5] border-b border-[#e9e9e7]">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide">Tarih</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide">Başlık</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide">Kategori</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide">Tekrar</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wide">Tutar</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {visible.map(entry => (
                <tr key={entry.id} className="border-t border-[#e9e9e7] hover:bg-[#f7f7f5] group">
                  <td className="px-4 py-3 text-[13px] text-[#9b9a97] whitespace-nowrap">{fmtDate(entry.date)}</td>
                  <td className="px-4 py-3 text-[14px] text-[#37352f] font-medium">{entry.title}</td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#f1f1ef] text-[#9b9a97]">
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#9b9a97]">
                    {entry.recurring !== 'yok' ? entry.recurring : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right text-[15px] font-semibold whitespace-nowrap ${
                    entry.type === 'gelir' ? 'text-[#0f7b6c]' : 'text-[#e03e3e]'
                  }`}>
                    {entry.type === 'gelir' ? '+' : '−'}{TL(entry.amount)}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(entry)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#e0e0de] text-[#9b9a97]"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => remove(entry.id)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visible.length === 0 && (
            <div className="py-16 text-center text-[#9b9a97] text-[14px]">
              Henüz kayıt yok. "Yeni Ekle" ile başlayın.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-[#37352f]">
                {modal === 'add' ? 'Yeni Kayıt' : 'Kaydı Düzenle'}
              </h2>
              <button onClick={() => setModal(false)} className="text-[#9b9a97] hover:text-[#37352f]">
                <X size={16} />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              {(['gelir', 'gider'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t, category: t === 'gelir' ? 'Maaş' : 'Kira' }))}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                    form.type === t
                      ? t === 'gelir' ? 'bg-[#0f7b6c] text-white' : 'bg-[#e03e3e] text-white'
                      : 'bg-[#f1f1ef] text-[#9b9a97]'
                  }`}
                >
                  {t === 'gelir' ? '💰 Gelir' : '💸 Gider'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Başlık *</label>
                <input
                  autoFocus
                  placeholder="örn. Maaş, Kira Ödemesi..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && save()}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Tutar (₺) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Kategori</label>
                  <select
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Tekrar</label>
                  <select
                    className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                    value={form.recurring}
                    onChange={e => setForm(f => ({ ...f, recurring: e.target.value }))}
                  >
                    {RECURRING.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">
                  Tarih <span className="font-normal text-[#9b9a97]">(takvime otomatik eklenir)</span>
                </label>
                <input
                  type="date"
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc]"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#9b9a97] mb-1">Not</label>
                <textarea
                  rows={2}
                  placeholder="İsteğe bağlı not..."
                  className="w-full border border-[#e9e9e7] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#2eaadc] resize-none"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={save}
                disabled={!form.title.trim() || !form.amount}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-colors disabled:opacity-40 ${
                  form.type === 'gelir' ? 'bg-[#0f7b6c] hover:bg-[#0a6b5e]' : 'bg-[#e03e3e] hover:bg-[#c93535]'
                }`}
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
