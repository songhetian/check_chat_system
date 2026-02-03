import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Trash2, Layers, Loader2, RefreshCw, 
  CheckCircle2, X, Edit3, Save, Info,
  ShieldCheck, ArrowRight, Tag
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'

export default function CategoriesPage() {
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const fetchCats = async () => {
    setLoading(true)
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/categories`, method: 'GET' })
      if (res.status === 200) {
        setCats(res.data.data)
        setTotal(res.data.data.length) // 暂未实现后端分页，先前端处理
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCats() }, [])

  const openAdd = () => {
    setEditItem({ name: '', type: 'SENSITIVE', description: '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!editItem.name) return
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/ai/categories`,
      method: 'POST',
      data: editItem
    })
    if (res.data.status === 'ok') {
      setModalOpen(false)
      fetchCats()
      window.dispatchEvent(new CustomEvent('trigger-toast', {
        detail: { title: '分类架构已更新', message: '战术标签已实时同步', type: 'success' }
      }))
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">策略分类中枢</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">统一管理全域敏感词库与智能话术的业务归类</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all">
          <Plus size={16} /> 录入新分类
        </button>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 gap-3 font-bold uppercase italic tracking-widest opacity-50"><Loader2 className="animate-spin" /> 同步中...</div>
          ) : (
            <TacticalTable headers={['分类名称', '业务类型', '描述说明', '创建时间', '战术调整']}>
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner", c.type === 'SENSITIVE' ? "bg-red-50 text-red-600 border-red-100" : "bg-cyan-50 text-cyan-600 border-cyan-100")}><Tag size={18} /></div>
                      <span className="text-sm font-black text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase italic tracking-widest border", c.type === 'SENSITIVE' ? "bg-red-500 text-white border-red-400" : "bg-slate-900 text-white border-slate-800")}>
                      {c.type === 'SENSITIVE' ? '风险词库' : '智能话术'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center text-xs font-medium text-slate-500 italic max-w-xs truncate">"{c.description || '无备注'}"</td>
                  <td className="px-6 py-5 text-center font-black text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setEditItem(c); setModalOpen(true) }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                      <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
      </div>

      {/* 编辑模态框 */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative z-10 bg-white p-10">
               <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900 uppercase italic">分类节点重校</h3><button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button></div>
               
               <div className="space-y-8">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">分类名称</label><input value={editItem?.name} onChange={(e)=>setEditItem({...editItem, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner" placeholder="输入业务分类名称" /></div>
                  
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">业务类型</label><select value={editItem?.type} onChange={(e)=>setEditItem({...editItem, type: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner">
                    <option value="SENSITIVE">风险词库分类</option>
                    <option value="KNOWLEDGE">智能话术分类</option>
                  </select></div>

                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">描述说明</label><textarea value={editItem?.description} onChange={(e)=>setEditItem({...editItem, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium shadow-inner resize-none" rows={3} placeholder="简述该分类的管控逻辑..." /></div>

                  <button onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Save size={18} /> 确认固化节点</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
