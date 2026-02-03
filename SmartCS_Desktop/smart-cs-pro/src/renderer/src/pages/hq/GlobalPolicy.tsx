import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, Zap, Brain, 
  Loader2, RefreshCw, X, Plus, Search, 
  Save, Trash2, Edit3, CheckCircle2, Sliders,
  MessageSquare, FileText
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable } from '../../components/ui/TacticalTable'

export default function GlobalPolicyPage() {
  const [activeTab, setActiveRole] = useState<'WORDS' | 'KNOWLEDGE'>('WORDS')
  const [words, setWords] = useState<any[]>([])
  const [kb, setKb] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words' : 'api/ai/knowledge-base'
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/${endpoint}`, method: 'GET' })
      if (res.status === 200) {
        if (activeTab === 'WORDS') setWords(res.data.data)
        else setKb(res.data.data)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [activeTab])

  const openAdd = () => {
    setEditItem(activeTab === 'WORDS' ? { word: '', category: '业务风险', risk_level: 5, is_active: 1 } : { keyword: '', answer: '', category: '标准话术', is_active: 1 })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words' : 'ai/knowledge-base'
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/${endpoint}`,
      method: 'POST',
      data: editItem
    })
    if (res.data.status === 'ok') {
      setModalOpen(false)
      fetchData()
      window.dispatchEvent(new CustomEvent('trigger-toast', {
        detail: { title: '战术策略已热更新', message: '全域 AI 引擎已同步最新规则集', type: 'success' }
      }))
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6">
      
      {/* 战术头部 */}
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
            全域 AI 决策中心
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">配置全局对话拦截权重与智能纠偏话术集</p>
        </div>
        <div className="flex gap-3">
           <button onClick={fetchData} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-100 transition-all border border-slate-100"><RefreshCw size={16} className={cn(loading && "animate-spin")} /> 同步引擎</button>
           <button onClick={openAdd} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all">
             <Plus size={16} /> 新增策略点
           </button>
        </div>
      </header>

      {/* 选项卡切换 */}
      <div className="flex gap-4 p-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 self-start">
         <TabButton active={activeTab === 'WORDS'} icon={Sliders} label="风险敏感词库" onClick={() => setActiveRole('WORDS')} />
         <TabButton active={activeTab === 'KNOWLEDGE'} icon={Brain} label="智能话术矩阵" onClick={() => setActiveRole('KNOWLEDGE')} />
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic tracking-widest opacity-50"><Loader2 className="animate-spin" size={40} /><span>正在对齐战术策略...</span></div>
            ) : (
              activeTab === 'WORDS' ? (
                <TacticalTable headers={['敏感词', '所属范畴', '风险权重', '状态', '战术调整']}>
                  {words.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group text-center">
                      <td className="px-8 py-5 font-black text-slate-900">{w.word}</td>
                      <td className="px-6 py-5"><span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">{w.category}</span></td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center items-center gap-2">
                           <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={cn("h-full transition-all", w.risk_level >= 8 ? "bg-red-500" : w.risk_level >= 5 ? "bg-amber-500" : "bg-cyan-500")} style={{ width: `${w.risk_level * 10}%` }} />
                           </div>
                           <span className="text-xs font-black italic">LV.{w.risk_level}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">{w.is_active ? <span className="text-[10px] font-black text-emerald-600 uppercase">监听中</span> : <span className="text-[10px] font-black text-slate-300 uppercase">已挂起</span>}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => { setEditItem(w); setModalOpen(true) }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                          <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </TacticalTable>
              ) : (
                <TacticalTable headers={['触发关键词', '智能纠偏建议 (Answer)', '所属范畴', '状态', '战术调整']}>
                  {kb.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 font-black text-slate-900 text-center">{k.keyword}</td>
                      <td className="px-6 py-5 max-w-md"><p className="text-xs font-medium text-slate-600 line-clamp-2 italic leading-relaxed">"{k.answer}"</p></td>
                      <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-lg text-[10px] font-black uppercase">{k.category}</span></td>
                      <td className="px-6 py-5 text-center">{k.is_active ? <span className="text-[10px] font-black text-emerald-600 uppercase italic">已挂载</span> : <span className="text-[10px] font-black text-slate-300 uppercase italic">脱机</span>}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => { setEditItem(k); setModalOpen(true) }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                          <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </TacticalTable>
              )
            )}
         </div>
      </div>

      {/* 编辑模态框 */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden relative z-10 p-10">
               <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">策略参数重校</h3><button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button></div>
               
               <div className="space-y-8">
                  {activeTab === 'WORDS' ? (
                    <>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">敏感词内容</label><input value={editItem?.word} onChange={(e)=>setEditItem({...editItem, word: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold shadow-inner border-none focus:ring-2 focus:ring-cyan-500/20 transition-all" placeholder="请输入拦截关键词" /></div>
                      <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">风险权重 (1-10)</label><input type="number" min="1" max="10" value={editItem?.risk_level} onChange={(e)=>setEditItem({...editItem, risk_level: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-black shadow-inner border-none" /></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">策略分类</label><input value={editItem?.category} onChange={(e)=>setEditItem({...editItem, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold shadow-inner border-none" /></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">触发关键词</label><input value={editItem?.keyword} onChange={(e)=>setEditItem({...editItem, keyword: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold shadow-inner border-none" placeholder="坐席说到什么时触发" /></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">AI 纠偏建议内容</label><textarea value={editItem?.answer} onChange={(e)=>setEditItem({...editItem, answer: e.target.value})} rows={4} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium shadow-inner border-none resize-none leading-relaxed" placeholder="请输入推荐的标准话术..." /></div>
                    </>
                  )}
                  
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                     <input type="checkbox" checked={editItem?.is_active === 1} onChange={(e)=>setEditItem({...editItem, is_active: e.target.checked ? 1 : 0})} className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                     <span className="text-[10px] font-black text-slate-600 uppercase italic">激活此战术策略点</span>
                  </div>

                  <button onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Save size={18} /> 固化策略变更</button>
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