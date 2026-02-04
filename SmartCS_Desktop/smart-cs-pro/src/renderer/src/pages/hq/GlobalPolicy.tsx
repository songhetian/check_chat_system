import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, Zap, Brain, 
  Loader2, RefreshCw, X, Plus, Search, 
  Save, Trash2, Edit3, CheckCircle2, Sliders,
  MessageSquare, FileText, Download, Upload,
  FileSpreadsheet, AlertCircle, Tag, ShieldAlert
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

export default function GlobalPolicyPage() {
  const { token, hasPermission } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'WORDS' | 'KNOWLEDGE'>('WORDS')
  const [words, setWords] = useState<any[]>([])
  const [kb, setKb] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [editItem, setEditItem] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const fetchData = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words' : 'ai/knowledge-base'
      const [resData, resCats] = await Promise.all([
        window.api.callApi({ url: `${CONFIG.API_BASE}/${endpoint}?page=${page}&size=10`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }),
        window.api.callApi({ url: `${CONFIG.API_BASE}/ai/categories?type=${activeTab}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (resData.status === 200) {
        if (activeTab === 'WORDS') setWords(resData.data.data)
        else setKb(resData.data.data)
        setTotal(resData.data.total)
        if (silent) toast.success('策略已同步')
      }
      if (resCats.status === 200) setCats(resCats.data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1) }, [activeTab])
  useEffect(() => { fetchData() }, [activeTab, page, token])

  const handleSave = async () => {
    if (!token || !editItem || processing) return
    const isEdit = !!editItem.id
    // 增/改原子熔断
    const perm = isEdit ? 'admin:ai:update' : 'admin:ai:create'
    if (!hasPermission(perm)) return

    setProcessing(true)
    try {
      const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words' : 'ai/knowledge-base'
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/${endpoint}`, 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        data: editItem 
      })
      if (res.data.status === 'ok') { 
        setModalType('NONE'); 
        fetchData(false); // Visible refresh
        toast.success(isEdit ? '策略已优化' : '新策略已就绪', { description: '战术规则矩阵已同步至全域' })
      }
    } finally {
      setProcessing(false)
    }
  }

  const executeDelete = async () => {
    if (!editItem || !token || !hasPermission('admin:ai:delete') || processing) return
    setProcessing(true)
    try {
      const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words/delete' : 'ai/knowledge-base/delete'
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/${endpoint}`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id: editItem.id }
      })
      if (res.data.status === 'ok') {
        setModalType('NONE'); 
        fetchData(false); // Visible refresh
        toast.success('策略节点已清除', { description: '战术规则已实时重载' })
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic">全域 AI 决策中心</h2><p className="text-slate-500 text-sm mt-1 font-medium">配置全局对话拦截权重与智能纠偏话术矩阵</p></div>
        <div className="flex flex-wrap gap-3">
           <button onClick={() => fetchData(false)} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
             <RefreshCw size={18} className={cn(loading && "animate-spin")} />
           </button>
           <button className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg hover:bg-emerald-700 transition-all"><Download size={14} /> 模板</button>
           {/* 增：admin:ai:create */}
           {hasPermission('admin:ai:create') && (
             <button onClick={() => { setEditItem(activeTab === 'WORDS' ? { word: '', category_id: cats[0]?.id || '', risk_level: 5, is_active: 1 } : { keyword: '', answer: '', category_id: cats[0]?.id || '', is_active: 1 }); setModalType('EDIT'); }} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl active:scale-95"><Plus size={14} /> 录入新策略</button>
           )}
        </div>
      </header>

      <div className="flex gap-4 p-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 self-start">
         <TabButton active={activeTab === 'WORDS'} icon={Sliders} label="风险敏感词库" onClick={() => setActiveTab('WORDS')} />
         <TabButton active={activeTab === 'KNOWLEDGE'} icon={Brain} label="智能话术矩阵" onClick={() => setActiveTab('KNOWLEDGE')} />
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>调取策略中...</span></div> : (
              activeTab === 'WORDS' ? (
                <TacticalTable headers={['敏感词', '所属分类', '风险权重', '状态', '战术调整']}>
                  {words.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group text-center text-sm font-bold text-slate-600">
                      <td className="px-8 py-5 font-black text-slate-900">{w.word}</td>
                      <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black inline-flex items-center gap-1.5 border border-slate-200"><Tag size={10}/>{w.category__name}</span></td>
                      <td className="px-6 py-5"><div className="flex justify-center items-center gap-2"><div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className={cn("h-full transition-all", w.risk_level >= 8 ? "bg-red-500" : w.risk_level >= 5 ? "bg-amber-500" : "bg-cyan-500")} style={{ width: `${w.risk_level * 10}%` }} /></div><span className="text-xs font-black italic">LV.{w.risk_level}</span></div></td>
                      <td className="px-6 py-5 text-center">{w.is_active ? <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">激活</span> : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">挂起</span>}</td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex justify-center gap-2">
                          {/* 改：admin:ai:update */}
                          {hasPermission('admin:ai:update') && (
                            <button onClick={() => { setEditItem(w); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                          )}
                          {/* 删：admin:ai:delete */}
                          {hasPermission('admin:ai:delete') && (
                            <button onClick={() => { setEditItem(w); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                          )}
                          {!hasPermission('admin:ai:update') && !hasPermission('admin:ai:delete') && <span className="text-[10px] text-slate-300 italic uppercase">Locked</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </TacticalTable>
              ) : (
                <TacticalTable headers={['触发关键词', '建议内容', '业务分类', '状态', '战术调整']}>
                  {kb.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center">
                      <td className="px-8 py-5 font-black text-slate-900">{k.keyword}</td>
                      <td className="px-6 py-5 max-w-md"><p className="text-xs font-medium text-slate-600 line-clamp-2 italic">"{k.answer}"</p></td>
                      <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-lg text-[10px] font-black inline-flex items-center gap-1.5 border border-cyan-100"><Tag size={10}/>{k.category__name}</span></td>
                      <td className="px-6 py-5 text-center">{k.is_active ? <span className="text-[10px] font-black text-emerald-600 uppercase">已挂载</span> : <span className="text-[10px] font-black text-slate-300 uppercase">脱机</span>}</td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex justify-center gap-2">
                          {hasPermission('admin:ai:update') && (<button onClick={() => { setEditItem(k); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>)}
                          {hasPermission('admin:ai:delete') && (<button onClick={() => { setEditItem(k); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </TacticalTable>
              )
            )}
         </div>
         {total > 10 && (
           <div className="shrink-0 border-t border-slate-100 bg-white p-2">
             <TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} />
           </div>
         )}
      </div>

      <AnimatePresence>
        {modalType === 'EDIT' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative z-10 p-10">
               <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900 uppercase italic">策略参数重校</h3><button onClick={() => setModalType('NONE')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button></div>
               <div className="space-y-8">
                  {activeTab === 'WORDS' ? (
                    <>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">敏感词内容</label><input value={editItem?.word} onChange={(e)=>setEditItem({...editItem, word: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 shadow-inner" /></div>
                      <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">风险权重</label><input type="number" value={editItem?.risk_level} onChange={(e)=>setEditItem({...editItem, risk_level: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-black text-slate-900 shadow-inner" /></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">业务分类</label><TacticalSelect options={cats} value={editItem?.category_id} onChange={(val) => setEditItem({...editItem, category_id: val})} placeholder="指派词库分类" /></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">触发关键词</label><input value={editItem?.keyword} onChange={(e)=>setEditItem({...editItem, keyword: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 shadow-inner" /></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">策略分类</label><TacticalSelect options={cats} value={editItem?.category_id} onChange={(val) => setEditItem({...editItem, category_id: val})} placeholder="指派话术分类" /></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">纠偏建议内容</label><textarea value={editItem?.answer} onChange={(e)=>setEditItem({...editItem, answer: e.target.value})} rows={4} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 shadow-inner resize-none leading-relaxed" /></div>
                    </>
                  )}
                  <button disabled={processing} onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {processing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 确认并固化
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalType === 'DELETE' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processing && setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
               <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner"><ShieldAlert size={40} className="animate-pulse" /></div>
               <h3 className="text-xl font-black text-slate-900 mb-2 italic">注销该策略节点？</h3>
               <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed px-4">注销策略 <span className="text-red-600 font-black">[{editItem?.word || editItem?.keyword}]</span> 将导致 AI 引擎失去对应的实战识别能力。此操作受到动作级权限 <span className="text-slate-900 font-black">[admin:ai:delete]</span> 的严密监管。</p>
               <div className="grid grid-cols-2 gap-4">
                  <button disabled={processing} onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all disabled:opacity-50">放弃动作</button>
                  <button disabled={processing} onClick={executeDelete} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {processing && <Loader2 className="animate-spin" size={16} />} 确认物理清除
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabButton({ active, icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("px-6 py-3 rounded-xl flex items-center gap-3 transition-all", active ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}>
      <Icon size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  )
}
