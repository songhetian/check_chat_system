import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, Zap, Brain, 
  Loader2, RefreshCw, X, Plus, Search, 
  Save, Trash2, Edit3, CheckCircle2, Sliders,
  MessageSquare, FileText, Download, Upload,
  FileSpreadsheet, AlertCircle
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable } from '../../components/ui/TacticalTable'

export default function GlobalPolicyPage() {
  const [activeTab, setActiveRole] = useState<'WORDS' | 'KNOWLEDGE'>('WORDS')
  const [words, setWords] = useState<any[]>([])
  const [kb, setKb] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  // 导入状态
  const [showImport, setShowImport] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words' : 'ai/knowledge-base'
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/${endpoint}`, method: 'GET' })
      if (res.status === 200) {
        if (activeTab === 'WORDS') setWords(res.data.data)
        else setKb(res.data.data)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [activeTab])

  // --- 模板下载逻辑 ---
  const handleDownloadTemplate = () => {
    let headers = ""
    let filename = ""
    if (activeTab === 'WORDS') {
      headers = "敏感词,所属范畴,风险权重(1-10)\n"
      filename = "SmartCS_敏感词导入模板.csv"
    } else {
      headers = "触发关键词,智能纠偏建议(Answer),所属范畴\n"
      filename = "SmartCS_智能话术导入模板.csv"
    }
    const blob = new Blob(["\ufeff" + headers], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", filename)
    link.click()
  }

  // --- 导入逻辑 ---
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) setUploadFile(file)
  }, [])

  const handleStartImport = async () => {
    if (!uploadFile) return
    // 模拟解析过程
    alert(`正在同步战术数据包：${uploadFile.name}`)
    setUploadFile(null); setShowImport(false); fetchData()
  }

  const openAdd = () => {
    setEditItem(activeTab === 'WORDS' ? { word: '', category: '业务风险', risk_level: 5, is_active: 1 } : { keyword: '', answer: '', category: '标准话术', is_active: 1 })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words' : 'ai/knowledge-base'
    const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/${endpoint}`, method: 'POST', data: editItem })
    if (res.data.status === 'ok') {
      setModalOpen(false); fetchData()
      window.dispatchEvent(new CustomEvent('trigger-toast', { detail: { title: '战术策略已固化', message: 'AI 引擎已同步最新规则集', type: 'success' } }))
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6">
      
      {/* 战术头部 */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic text-tactical-glow">
            全域 AI 决策中心
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">配置全局对话拦截权重与智能纠偏话术集</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg active:scale-95 hover:bg-emerald-700 transition-all">
             <Download size={14} /> 下载{activeTab === 'WORDS' ? '词库' : '话术'}模板
           </button>
           <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all">
             <Upload size={14} /> 批量导入策略
           </button>
           <button onClick={openAdd} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all">
             <Plus size={14} /> 新增策略点
           </button>
        </div>
      </header>

      {/* 选项卡 */}
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
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group text-center text-sm font-bold text-slate-600">
                      <td className="px-8 py-5 font-black text-slate-900">{w.word}</td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">{w.category}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center items-center gap-2">
                           <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={cn("h-full transition-all", w.risk_level >= 8 ? "bg-red-500" : w.risk_level >= 5 ? "bg-amber-500" : "bg-cyan-500")} style={{ width: `${w.risk_level * 10}%` }} />
                           </div>
                           <span className="text-xs font-black italic">LV.{w.risk_level}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">{w.is_active ? <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">监听中</span> : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">已挂起</span>}</td>
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
                <TacticalTable headers={['触发关键词', '智能纠偏建议', '所属范畴', '状态', '战术调整']}>
                  {kb.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600">
                      <td className="px-8 py-5 font-black text-slate-900 text-center">{k.keyword}</td>
                      <td className="px-6 py-5 max-w-md"><p className="text-xs font-medium text-slate-600 line-clamp-2 italic leading-relaxed">"{k.answer}"</p></td>
                      <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-lg text-[10px] font-black uppercase">{k.category}</span></td>
                      <td className="px-6 py-5 text-center">{k.is_active ? <span className="text-[10px] font-black text-emerald-600 uppercase italic">已挂载</span> : <span className="text-[10px] font-black text-slate-300 uppercase italic">脱机</span>}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2 text-center">
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="策略参数重校">
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
      </Modal>

      {/* 导入模态框 */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImport(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative z-10 p-10 text-center">
               <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-slate-900 uppercase italic">导入{activeTab === 'WORDS' ? '风险词库' : '话术矩阵'}</h3><button onClick={() => setShowImport(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={20}/></button></div>
               <div onDragOver={(e)=> {e.preventDefault(); setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)} onDrop={onDrop} className={cn("w-full h-64 rounded-[32px] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 relative", isDragging ? "bg-cyan-50 border-cyan-500 scale-[1.02]" : "bg-slate-50 border-slate-200", uploadFile && "border-emerald-500 bg-emerald-50")}>
                  {uploadFile ? <div className="flex flex-col items-center gap-3"><div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><FileSpreadsheet size={32} /></div><span className="text-sm font-black text-emerald-900">{uploadFile.name}</span><button onClick={() => setUploadFile(null)} className="text-[10px] font-black text-red-500 uppercase">重新选择</button></div> : <div className="flex flex-col items-center gap-3 opacity-40"><Upload size={48} /><span className="text-xs font-black">拖拽 战术清单至此</span></div>}
               </div>
               <button onClick={handleStartImport} disabled={!uploadFile} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all active:scale-95 flex items-center justify-center gap-3"><Save size={18} /> 开始同步策略</button>
               <p className="text-[9px] text-slate-400 font-bold flex items-center justify-center gap-1.5 mt-4 italic"><AlertCircle size={10}/> 导入操作将根据关键词自动合并现有策略</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

function Modal({ isOpen, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative z-10 bg-white">
             <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{title}</h3>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button>
                </div>
                {children}
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function TabButton({ active, icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("px-6 py-3 rounded-xl flex items-center gap-3 transition-all", active ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}>
      <Icon size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  )
}
