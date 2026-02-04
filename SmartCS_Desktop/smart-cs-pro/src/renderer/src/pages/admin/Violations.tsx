import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, Eye, Clock, User, 
  BrainCircuit, VideoOff, Loader2, Filter, Search,
  ShieldAlert, X, Play, Image as ImageIcon, Download,
  ChevronRight, ArrowUpRight, ShieldCheck, RefreshCw
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'

// --- 证据详单弹窗 ---
function EvidenceModal({ isOpen, onClose, data }: any) {
  if (!data) return null
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20"><ShieldAlert size={24} /></div>
                <div><h3 className="text-xl font-black text-slate-900">违规取证数字化详单</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">ID: {data.id}</p></div>
              </div>
              <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-500"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8 custom-scrollbar">
              <div className="col-span-12 lg:col-span-7 space-y-6">
                <div className="aspect-video rounded-[32px] bg-slate-900 flex items-center justify-center relative overflow-hidden border-4 border-slate-100 shadow-inner">
                  <div className="flex flex-col items-center gap-4 text-slate-600"><VideoOff size={64} strokeWidth={1} /><span className="text-xs font-black uppercase tracking-[0.2em]">无实时视频链路记录</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2"><span className="text-[10px] font-black text-slate-400 uppercase">命中关键词</span><span className="text-lg font-black text-red-600 italic">#{data.keyword}</span></div>
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2"><span className="text-[10px] font-black text-slate-400 uppercase">风险权重</span><span className="text-lg font-black text-slate-900 italic">LV.{data.risk_score}</span></div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 space-y-6">
                <div className="p-6 rounded-[32px] bg-cyan-50 border border-cyan-100 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><BrainCircuit size={80}/></div>
                   <h4 className="text-xs font-black text-cyan-700 uppercase mb-4 flex items-center gap-2"><BrainCircuit size={14}/> 智脑战术综述</h4>
                   <p className="text-sm font-medium text-cyan-900 leading-relaxed italic">"该行为表现出明显的违规倾向，建议立即按照 SOP 执行指令干预。"</p>
                </div>
                <div className="space-y-4">
                   <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase block mb-3">违规对话原文</span><div className="text-sm font-medium text-slate-700 bg-white p-4 rounded-2xl border border-slate-100">"{data.context}"</div></div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-4 shrink-0">
               <button className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95"><Download size={16} /> 导出证据包</button>
               <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl">完成审计</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function ViolationsPage() {
  const { token } = useAuthStore()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptId, setDeptId] = useState('')
  const [riskLevel, setRiskLevel] = useState('ALL')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [depts, setDepts] = useState<any[]>([])

  const violationsCount = useRiskStore(s => s.violations.length)

  const fetchDepts = async () => {
    if (!token) return
    try {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/departments`, 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) setDepts(res.data.data)
    } catch (e) { console.error(e) }
  }

  const fetchViolations = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/violations?page=${page}&username=${search}&dept_id=${deptId}&risk_level=${riskLevel}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setData(res.data.data)
        setTotal(res.data.total)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDepts() }, [])
  useEffect(() => { fetchViolations() }, [page, deptId, riskLevel])
  useEffect(() => { if (violationsCount > 0) fetchViolations(true) }, [violationsCount])

  const openEvidence = (item: any) => { setSelectedItem(item); setIsModalOpen(true) }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic">风险拦截取证中枢</h2><p className="text-slate-500 text-sm mt-1 font-medium">全域违规捕获、多媒体证据链固化与 AI 复盘系统</p></div>
        <div className="flex-1 sm:flex-none px-6 py-3 bg-slate-50 border rounded-2xl flex items-center gap-3"><div className="w-2 h-2 bg-green-500 rounded-full animate-ping" /><span className="text-sm font-black text-slate-700 uppercase tracking-widest">实时链路已激活</span></div>
      </header>

      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm shrink-0 flex items-center gap-4">
        <TacticalSearch value={search} onChange={setSearch} onSearch={() => fetchViolations()} placeholder="搜索坐席姓名或账号..." className="flex-1" />
        <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-cyan-500/20 py-2 px-4 min-w-[140px] shrink-0">
          <option value="">全域部门</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={() => fetchViolations()} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 flex items-center gap-2 shrink-0 transition-all active:scale-95 shadow-lg"><RefreshCw size={14} className={cn(loading && "animate-spin")} /> 立即同步</button>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="h-64 flex items-center justify-center text-slate-400 gap-3 italic font-bold uppercase tracking-widest"><Loader2 className="animate-spin" /> 正在调取中枢取证库...</div> : (
            <TacticalTable headers={['发生时间', '坐席信息', '所属部门', '拦截关键词', '风险等级', '管理操作']}>
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openEvidence(item)}>
                  <td className="px-8 py-5 text-center text-xs font-bold text-slate-500 whitespace-nowrap">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-5"><div className="flex items-center justify-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 shrink-0">{item.user__real_name?.[0] || '?'}</div><div className="flex flex-col text-left"><span className="text-sm font-black text-slate-900 truncate">{item.user__real_name}</span><span className="text-[9px] text-slate-400 font-mono italic truncate">@{item.user__username}</span></div></div></td>
                  <td className="px-6 py-5 text-center"><span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-tighter">{item.user__department__name || '未归类'}</span></td>
                  <td className="px-6 py-5 text-center"><span className="text-xs font-black text-red-600 bg-red-500/5 px-3 py-1 rounded-lg border border-red-500/10 italic">{item.keyword}</span></td>
                  <td className="px-6 py-5 text-center"><span className={cn("text-[10px] font-black px-2 py-0.5 rounded italic", item.risk_score >= 8 ? "bg-red-600 text-white" : "bg-slate-900 text-white")}>LV.{item.risk_score}</span></td>
                  <td className="px-8 py-5 text-center"><button onClick={(e) => { e.stopPropagation(); openEvidence(item); }} className="p-2 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shrink-0"><ArrowUpRight size={18} /></button></td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 20 && <div className="shrink-0 border-t border-slate-100 bg-white p-2"><TacticalPagination total={total} pageSize={20} currentPage={page} onPageChange={setPage} /></div>}
      </div>
      <EvidenceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} data={selectedItem} />
    </div>
  )
}