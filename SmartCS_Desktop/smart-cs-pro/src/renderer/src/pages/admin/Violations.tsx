import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BrainCircuit, VideoOff, Loader2, RefreshCw,
  ShieldAlert, X, Download, ArrowUpRight
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

// --- 证据详单弹窗 (V3.8 Compact) ---
function EvidenceModal({ isOpen, onClose, data }: any) {
  if (!data) return null
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-black">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] z-10">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20"><ShieldAlert size={20} /></div>
                <div><h3 className="text-lg font-black text-black">违规证据数字化详单</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 font-mono">ID: {data.id}</p></div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={18} className="text-slate-500"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-12 gap-6 custom-scrollbar">
              <div className="col-span-12 lg:col-span-7 space-y-4">
                <div className="aspect-video rounded-xl bg-black flex items-center justify-center relative overflow-hidden border border-slate-100 shadow-inner">
                  <div className="flex flex-col items-center gap-3 text-slate-600"><VideoOff size={48} strokeWidth={1} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">无实时视频链路记录</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5"><span className="text-[9px] font-black text-slate-500 uppercase">命中关键词</span><span className="text-base font-black text-red-600 italic">#{data.keyword}</span></div>
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5"><span className="text-[9px] font-black text-slate-500 uppercase">风险权重</span><span className="text-base font-black text-black italic">LV.{data.risk_score}</span></div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 space-y-4">
                <div className="p-5 rounded-xl bg-cyan-50 border border-cyan-100 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><BrainCircuit size={60}/></div>
                   <h4 className="text-[10px] font-black text-cyan-700 uppercase mb-3 flex items-center gap-2"><BrainCircuit size={12}/> 智脑战术综述</h4>
                   <p className="text-xs font-bold text-cyan-900 leading-relaxed italic">"该行为表现出明显的违规倾向，建议立即按照 SOP 执行指令干预。"</p>
                </div>
                <div className="space-y-4">
                   <div className="p-5 rounded-xl bg-slate-50 border border-slate-100"><span className="text-[10px] font-black text-slate-500 uppercase block mb-2">违规对话原文</span><div className="text-xs font-bold text-black bg-white p-3.5 rounded-lg border border-slate-100 leading-relaxed">"{data.context}"</div></div>
                </div>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
               <button className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"><Download size={14} /> 导出证据包</button>
               <button onClick={onClose} className="px-7 py-2 bg-black text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-all shadow-md active:scale-95">确认完成审计</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function ViolationsPage() {
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deptId, setDeptId] = useState<string | number>('')
  const [riskLevel, setRiskLevel] = useState<string | number>('ALL')
  const [page, setPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const violationsCount = useRiskStore(s => s.violations.length)

  const deptsQuery = useQuery({
    queryKey: ['departments_all'],
    queryFn: async () => {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/departments?size=100`, 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data.data
    },
    enabled: !!token
  })

  const violationsQuery = useQuery({
    queryKey: ['violations', page, search, deptId, riskLevel, violationsCount],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/violations?page=${page}&username=${search}&dept_id=${deptId}&risk_level=${riskLevel}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data
    },
    enabled: !!token
  })

  const depts = deptsQuery.data || []
  const data = violationsQuery.data?.data || []
  const total = violationsQuery.data?.total || 0

  const openEvidence = (item: any) => { setSelectedItem(item); setIsModalOpen(true) }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-black">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black text-black uppercase italic text-tactical-glow leading-none">违规审计流</h2>
          <p className="text-slate-500 text-sm mt-2 font-bold flex items-center gap-2">
            记录成员所有风险触发行为与人工审计足迹
            {violationsQuery.isFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        <div className="flex-1 sm:flex-none px-6 py-3 bg-slate-50 border rounded-xl flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /><span className="text-xs font-black text-slate-700 uppercase tracking-widest">实时监听已激活</span></div>
      </header>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 flex items-center gap-4">
        <TacticalSearch value={search} onChange={setSearch} placeholder="搜索成员姓名..." className="flex-1" />
        <div className="w-56"><TacticalSelect options={[{id: '', name: '所有部门'}, ...depts]} value={deptId} onChange={(val) => { setDeptId(val); setPage(1); }} /></div>
        <div className="w-48"><TacticalSelect options={[{id: 'ALL', name: '全部等级'}, {id: 'SERIOUS', name: '严重'}, {id: 'MEDIUM', name: '中级'}, {id: 'LOW', name: '低级'}]} value={riskLevel} onChange={(val) => { setRiskLevel(val); setPage(1); }} /></div>
        <button onClick={() => violationsQuery.refetch()} className="p-3 bg-slate-50 text-black rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 group">
          <RefreshCw size={18} className={cn(violationsQuery.isFetching && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {violationsQuery.isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>载入审计数据...</span></div>
          ) : (
            <TacticalTable headers={['捕获时间', '成员姓名', '所属部门', '关键词', '风险等级', '操作']}>
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer text-center" onClick={() => openEvidence(item)}>
                  <td className="px-8 py-3 text-center text-[10px] font-bold text-slate-500 whitespace-nowrap">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-3 text-center"><div className="flex items-center justify-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600">{item.user__real_name?.[0] || '?'}</div><span className="text-xs font-black text-black">{item.user__real_name}</span></div></td>
                  <td className="px-6 py-3 text-center"><span className="text-[10px] font-bold text-black uppercase tracking-tighter">{item.user__department__name || '未归类'}</span></td>
                  <td className="px-6 py-3 text-center"><span className="text-[11px] font-black text-red-600 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 italic">{item.keyword}</span></td>
                  <td className="px-6 py-3 text-center"><span className={cn("text-[10px] font-black px-2 py-0.5 rounded italic", item.risk_score >= 8 ? "bg-red-600 text-white" : "bg-black text-white")}>LV.{item.risk_score}</span></td>
                  <td className="px-8 py-3 text-center"><button onClick={(e) => { e.stopPropagation(); openEvidence(item); }} className="p-2 bg-slate-100 text-black hover:bg-black hover:text-white rounded-lg transition-all"><ArrowUpRight size={14} /></button></td>
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