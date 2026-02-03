import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, Zap, Brain, 
  Loader2, RefreshCw, X, Plus, Search, 
  Save, Trash2, Edit3, CheckCircle2, Sliders,
  MessageSquare, FileText, Download, Upload,
  FileSpreadsheet, AlertCircle, Tag
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'

export default function GlobalPolicyPage() {
  const [activeTab, setActiveTab] = useState<'WORDS' | 'KNOWLEDGE'>('WORDS')
  const [words, setWords] = useState<any[]>([])
  const [kb, setKb] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const [showImport, setShowImport] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words' : 'ai/knowledge-base'
      const [resData, resCats] = await Promise.all([
        window.api.callApi({ url: `${CONFIG.API_BASE}/${endpoint}`, method: 'GET' }),
        window.api.callApi({ url: `${CONFIG.API_BASE}/ai/categories?type=${activeTab}`, method: 'GET' })
      ])
      if (resData.status === 200) activeTab === 'WORDS' ? setWords(resData.data.data) : setKb(resData.data.data)
      if (resCats.status === 200) setCats(resCats.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [activeTab])

  const handleDownloadTemplate = () => {
    let headers = activeTab === 'WORDS' ? "敏感词,分类ID,风险权重(1-10)\n" : "触发关键词,智能纠偏建议,分类ID\n"
    const blob = new Blob(["\ufeff" + headers], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob); link.setAttribute("download", `SmartCS_${activeTab === 'WORDS'?'词库':'话术'}导入模板.csv`); link.click()
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => { setIsDragging(false) }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) setUploadFile(file)
  }

  const handleStartImport = async () => {
    if (!uploadFile) return
    alert(`正在同步战术数据包：${uploadFile.name}`)
    setUploadFile(null); setShowImport(false); fetchData()
  }

  const openAdd = () => {
    setEditItem(activeTab === 'WORDS' ? { word: '', category_id: cats[0]?.id || '', risk_level: 5, is_active: 1 } : { keyword: '', answer: '', category_id: cats[0]?.id || '', is_active: 1 })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const endpoint = activeTab === 'WORDS' ? 'ai/sensitive-words' : 'ai/knowledge-base'
    const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/${endpoint}`, method: 'POST', data: editItem })
    if (res.data.status === 'ok') { setModalOpen(false); fetchData(); }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic">全域 AI 决策中心</h2><p className="text-slate-500 text-sm mt-1 font-medium">配置全局对话拦截权重与智能纠偏话术矩阵</p></div>
        <div className="flex flex-wrap gap-3">
           <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"><Download size={14} /> 下载模板</button>
           <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl hover:bg-slate-800 active:scale-95 transition-all"><Upload size={14} /> 批量导入</button>
           <button onClick={openAdd} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl hover:bg-slate-800 active:scale-95 transition-all"><Plus size={14} /> 新增策略点</button>
        </div>
      </header>

      <div className="flex gap-4 p-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 self-start">
         <TabButton active={activeTab === 'WORDS'} icon={Sliders} label="风险敏感词库" onClick={() => setActiveTab('WORDS')} />
         <TabButton active={activeTab === 'KNOWLEDGE'} icon={Brain} label="智能话术矩阵" onClick={() => setActiveTab('KNOWLEDGE')} />
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>正在对齐战术策略...</span></div> : (
              activeTab === 'WORDS' ? (
                <TacticalTable headers={['敏感词', '所属分类', '风险权重', '状态', '战术调整']}>
                  {words.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group text-center text-sm font-bold text-slate-600 font-sans">
                      <td className="px-8 py-5 font-black text-slate-900">{w.word}</td>
                      <td className="px-6 py-5"><span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 w-fit mx-auto border border-slate-200"><Tag size={10}/>{w.category__name}</span></td>
                      <td className="px-6 py-5"><div className="flex justify-center items-center gap-2"><div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className={cn("h-full transition-all", w.risk_level >= 8 ? "bg-red-500" : w.risk_level >= 5 ? "bg-amber-500" : "bg-cyan-500")} style={{ width: `${w.risk_level * 10}%` }} /></div><span className="text-xs font-black italic">LV.{w.risk_level}</span></div></td>
                      <td className="px-6 py-5 text-center">{w.is_active ? <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">监听中</span> : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">已挂起</span>}</td>
                      <td className="px-8 py-5"><div className="flex justify-center gap-2"><button onClick={() => { setEditItem(w); setModalOpen(true) }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button><button className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </TacticalTable>
              ) : (
                <TacticalTable headers={['触发关键词', '智能纠偏建议', '业务分类', '状态', '战术调整']}>
                  {kb.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 font-sans">
                      <td className="px-8 py-5 font-black text-slate-900 text-center">{k.keyword}</td>
                      <td className="px-6 py-5 max-w-md"><p className="text-xs font-medium text-slate-600 line-clamp-2 italic leading-relaxed">"{k.answer}"</p></td>
                      <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 w-fit mx-auto border border-cyan-100"><Tag size={10}/>{k.category__name}</span></td>
                      <td className="px-6 py-5 text-center">{k.is_active ? <span className="text-[10px] font-black text-emerald-600 uppercase italic">已挂载</span> : <span className="text-[10px] font-black text-slate-300 uppercase italic">脱机</span>}</td>
                      <td className="px-8 py-5"><div className="flex justify-center gap-2 text-center"><button onClick={() => { setEditItem(k); setModalOpen(true) }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button><button className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </TacticalTable>
              )
            )}
         </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="策略参数重校">
         <div className="space-y-8">
            {activeTab === 'WORDS' ? (
              <>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">敏感词内容</label><input value={editItem?.word} onChange={(e)=>setEditItem({...editItem, word: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold shadow-inner border-none" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">风险权重 (1-10)</label><input type="number" value={editItem?.risk_level} onChange={(e)=>setEditItem({...editItem, risk_level: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-black shadow-inner border-none" /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">业务分类</label>
                    <TacticalSelect 
                      options={cats} 
                      value={editItem?.category_id} 
                      onChange={(val) => setEditItem({...editItem, category_id: val})} 
                      placeholder="指派策略分类" 
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">触发关键词</label><input value={editItem?.keyword} onChange={(e)=>setEditItem({...editItem, keyword: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold shadow-inner border-none" /></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">所属分类</label>
                  <TacticalSelect 
                    options={cats} 
                    value={editItem?.category_id} 
                    onChange={(val) => setEditItem({...editItem, category_id: val})} 
                    placeholder="指派话术分类" 
                  />
                </div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-1 tracking-widest">纠偏话术内容</label><textarea value={editItem?.answer} onChange={(e)=>setEditItem({...editItem, answer: e.target.value})} rows={4} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium shadow-inner border-none resize-none leading-relaxed" /></div>
              </>
            )}
            <button onClick={handleSave} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Save size={18} /> 固化策略变更</button>
         </div>
      </Modal>

      <AnimatePresence>{showImport && <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImport(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" /><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 p-10 text-center"><div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-slate-900 uppercase italic">导入战术数据</h3><button onClick={() => setShowImport(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button></div><div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={cn("w-full h-64 rounded-[32px] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4", isDragging ? "bg-cyan-50 border-cyan-500 scale-[1.02]" : "bg-slate-50 border-slate-200", uploadFile && "border-emerald-500 bg-emerald-50")}>{uploadFile ? <div className="flex flex-col items-center gap-3"><div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><FileSpreadsheet size={32} /></div><span className="text-sm font-black text-emerald-900">{uploadFile.name}</span></div> : <div className="flex flex-col items-center gap-3 opacity-40"><Upload size={48} /><span className="text-xs font-black">拖拽战术清单至此</span></div>}</div><button onClick={handleStartImport} disabled={!uploadFile} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl disabled:opacity-20 active:scale-95 transition-all">开始同步策略</button></motion.div></div>}</AnimatePresence>
    </div>
  )
}

function Modal({ isOpen, onClose, title, children }: any) {
  return (
    <AnimatePresence>{isOpen && <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" /><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl rounded-[40px] shadow-2xl relative z-10 bg-white p-10"><div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{title}</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button></div>{children}</motion.div></div>}</AnimatePresence>
  )
}

function TabButton({ active, icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("px-6 py-3 rounded-xl flex items-center gap-3 transition-all", active ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}>
      <Icon size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  )
}