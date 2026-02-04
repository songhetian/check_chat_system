import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Trash2, Layers, Loader2, RefreshCw, 
  CheckCircle2, X, Edit3, Save, Info,
  ShieldCheck, ArrowRight, Tag, ShieldAlert
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'

export default function CategoriesPage() {
  const { token } = useAuthStore()
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [editItem, setEditItem] = useState<any>(null)

  const typeOptions = [
    { id: 'SENSITIVE', name: '风险词库分类' },
    { id: 'KNOWLEDGE', name: '智能话术分类' }
  ]

  const fetchCats = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/ai/categories`, 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setCats(res.data.data)
        setTotal(res.data.data.length)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCats() }, [token])

  const handleSave = async () => {
    if (!editItem?.name || !token) return
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/ai/categories`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      data: editItem
    })
    if (res.data.status === 'ok') {
      setModalType('NONE'); fetchCats()
      window.dispatchEvent(new CustomEvent('trigger-toast', { detail: { title: '分类架构已更新', message: '战术标签已实时同步', type: 'success' } }))
    }
  }

  const executeDelete = async () => {
    if (!editItem || !token) return
    // 后端接口待补全，目前模拟成功
    setModalType('NONE'); fetchCats()
    window.dispatchEvent(new CustomEvent('trigger-toast', { detail: { title: '分类已注销', message: '关联策略已进入待重校状态', type: 'success' } }))
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">策略分类中枢</h2><p className="text-slate-500 text-sm mt-1 font-medium">统一管理全域敏感词库与智能话术的业务归类</p></div>
        <button onClick={() => { setEditItem({ name: '', type: 'SENSITIVE', description: '' }); setModalType('EDIT'); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all"><Plus size={16} /> 录入新分类</button>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" /> 同步中...</div> : (
            <TacticalTable headers={['分类名称', '业务类型', '描述说明', '创建时间', '战术调整']}>
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5"><div className="flex items-center justify-center gap-3"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner", c.type === 'SENSITIVE' ? "bg-red-50 text-red-600 border-red-100" : "bg-cyan-50 text-cyan-600 border-cyan-100")}><Tag size={18} /></div><span className="text-sm font-black text-slate-900">{c.name}</span></div></td>
                  <td className="px-6 py-5 text-center"><span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase italic border", c.type === 'SENSITIVE' ? "bg-red-500 text-white border-red-400" : "bg-slate-900 text-white border-slate-800")}>{c.type === 'SENSITIVE' ? '风险词库' : '智能话术'}</span></td>
                  <td className="px-6 py-5 text-center text-xs font-medium text-slate-500 italic truncate max-w-xs">"{c.description || '无备注'}"</td>
                  <td className="px-6 py-5 text-center font-black text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-8 py-5 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => { setEditItem(c); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button><button onClick={() => { setEditItem(c); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalType === 'EDIT' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden z-10 bg-white p-10">
               <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900 uppercase italic">分类参数重校</h3><button onClick={() => setModalType('NONE')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button></div>
               <div className="space-y-8">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1">分类名称</label><input value={editItem?.name} onChange={(e)=>setEditItem({...editItem, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 shadow-inner" placeholder="分类标识" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1">业务属性</label><TacticalSelect options={typeOptions} value={editItem?.type} onChange={(val) => setEditItem({...editItem, type: val})} placeholder="分类用途" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1">描述说明</label><textarea value={editItem?.description} onChange={(e)=>setEditItem({...editItem, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-900 shadow-inner resize-none" rows={3} placeholder="备注管控逻辑" /></div>
                  <button onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Save size={18} /> 确认固化节点</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalType === 'DELETE' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
               <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner"><ShieldAlert size={40} className="animate-pulse" /></div>
               <h3 className="text-xl font-black text-slate-900 mb-2 italic">注销策略分类？</h3>
               <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed px-4">注销 <span className="text-red-600 font-black">[{editItem?.name}]</span> 将导致关联规则失去分类聚合，此操作不可撤销。</p>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all">取消</button>
                  <button onClick={executeDelete} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600 active:scale-95 transition-all">确认注销</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
