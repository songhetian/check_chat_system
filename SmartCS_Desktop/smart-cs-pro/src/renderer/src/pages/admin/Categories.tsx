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
import { toast } from 'sonner'

export default function CategoriesPage() {
  const { token, hasPermission } = useAuthStore()
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [processing, setProcessing] = useState(false)
  
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [editItem, setEditItem] = useState<any>(null)

  const typeOptions = [
    { id: 'SENSITIVE', name: '风险词库分类' },
    { id: 'KNOWLEDGE', name: '智能话术分类' }
  ]

  const fetchCats = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/ai/categories?page=${page}&size=10`, 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setCats(res.data.data)
        setTotal(res.data.total)
        if (silent) toast.success('策略架构已对齐', { description: '分类矩阵已同步至最新物理刻度' })
      }
    } catch (e) { console.error('分类同步异常', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCats() }, [page, token])

  const handleSave = async () => {
    if (!editItem?.name || !token || processing) return
    const isEdit = !!editItem.id
    // 逻辑熔断：根据增/改动作校验不同权限
    const perm = isEdit ? 'admin:cat:update' : 'admin:cat:create'
    if (!hasPermission(perm)) return

    setProcessing(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/ai/categories`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: editItem
      })
      if (res.data.status === 'ok') {
        setModalType('NONE'); 
        fetchCats(false); // Visible refresh
        toast.success('指令已固化', { description: '分类架构已实时更新' })
      }
    } finally {
      setProcessing(false)
    }
  }

  const executeDelete = async () => {
    if (!editItem || !token || processing) return
    setProcessing(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/ai/categories/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id: editItem.id }
      })
      if (res.data.status === 'ok') {
        setModalType('NONE'); 
        fetchCats(false); // Visible refresh
        toast.success('节点移除成功', { description: '物理规则已重载' })
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">策略分类中枢</h2><p className="text-slate-500 text-sm mt-1 font-medium">配置全域策略分类，实现原子级动作权限管控</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchCats(false)} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
          {/* 增：admin:cat:create */}
          {hasPermission('admin:cat:create') && (
            <button onClick={() => { setEditItem({ name: '', type: 'SENSITIVE', description: '' }); setModalType('EDIT'); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all"><Plus size={16} /> 录入新分类</button>
          )}
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="h-64 flex items-center justify-center text-slate-400 gap-3 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" /> 同步中...</div> : (
            <TacticalTable headers={['分类名称', '业务属性', '描述说明', '创建时间', '战术调整']}>
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5"><div className="flex items-center justify-center gap-3"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner", c.type === 'SENSITIVE' ? "bg-red-50 text-red-600 border-red-100" : "bg-cyan-50 text-cyan-600 border-cyan-100")}><Tag size={18} /></div><span className="text-sm font-black text-slate-900">{c.name}</span></div></td>
                  <td className="px-6 py-5 text-center"><span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase italic border", c.type === 'SENSITIVE' ? "bg-red-500 text-white border-red-400" : "bg-slate-900 text-white border-slate-800")}>{c.type === 'SENSITIVE' ? '风险词库' : '智能话术'}</span></td>
                  <td className="px-6 py-5 text-center text-xs font-medium text-slate-500 italic truncate max-w-xs">"{c.description || '无备注'}"</td>
                  <td className="px-6 py-5 text-center font-black text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* 改：admin:cat:update */}
                      {hasPermission('admin:cat:update') && (
                        <button onClick={() => { setEditItem(c); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                      )}
                      {/* 删：admin:cat:delete */}
                      {hasPermission('admin:cat:delete') && (
                        <button onClick={() => { setEditItem(c); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                      )}
                      {!hasPermission('admin:cat:update') && !hasPermission('admin:cat:delete') && <span className="text-[10px] text-slate-300 italic uppercase">Locked</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 10 && <div className="shrink-0 border-t border-slate-100 bg-white p-2"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      <AnimatePresence>
        {modalType === 'EDIT' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processing && setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden z-10 bg-white p-10">
               <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900 uppercase italic">分类参数重校</h3><button onClick={() => setModalType('NONE')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button></div>
               <div className="space-y-8">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1">名称</label><input disabled={processing} value={editItem?.name} onChange={(e)=>setEditItem({...editItem, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 shadow-inner disabled:opacity-50" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1">属性</label><TacticalSelect disabled={processing} options={typeOptions} value={editItem?.type} onChange={(val) => setEditItem({...editItem, type: val})} /></div>
                  <button disabled={processing} onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100">
                    {processing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 确认并固化
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalType === 'DELETE' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processing && setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 text-center text-slate-900">
               <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner"><ShieldAlert size={40} className="animate-pulse" /></div>
               <h3 className="text-xl font-black mb-2 italic">注销该分类节点？</h3>
               <p className="text-xs text-slate-400 font-medium mb-8">此操作受到原子级权限 <span className="text-red-600 font-black">[admin:cat:delete]</span> 的物理熔断保护。</p>
               <div className="grid grid-cols-2 gap-4">
                  <button disabled={processing} onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all disabled:opacity-50">放弃动作</button>
                  <button disabled={processing} onClick={executeDelete} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100">
                     {processing && <Loader2 className="animate-spin" size={16} />} 确认物理移除
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
