import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BrainCircuit, VideoOff, Loader2, RefreshCw,
  ShieldAlert, X, Download, ArrowUpRight, ShieldCheck
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
function EvidenceModal({ onClose, data }: any) {
  if (!data) return null
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-black"
    >
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: 20, scale: 0.95 }} 
        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-white/20"
      >
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20"><ShieldAlert size={20} /></div>
            <div><h3 className="text-lg font-black text-black">违规证据数字化详单</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 font-mono">ID: {data.id}</p></div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={18} className="text-slate-500"/></button>
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
               <div className="p-5 rounded-xl bg-slate-50 border border-slate-100"><span className="text-[10px] font-black text-slate-500 uppercase block mb-2">违规对话原文</span><div className="text-xs font-bold text-black bg-white p-3.5 rounded-xl border border-slate-100 leading-relaxed">"{data.context}"</div></div>
            </div>
          </div>
        </div>
        <div className="p-5 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
           <button className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"><Download size={14} /> 导出证据包</button>
           <button onClick={onClose} className="px-7 py-2 bg-black text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all shadow-md active:scale-95">确认完成审计</button>
        </div>
      </motion.div>
    </motion.div>
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

  // 1. 获取部门列表
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

  // 2. 获取违规列表
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

  // 3. 获取统计数据 (安全过滤版)
  const stats = {
    serious: (violationsQuery.data?.data?.filter((v: any) => v.risk_score >= 8) || []).length,
    totalToday: violationsQuery.data?.total || 0,
    pending: (violationsQuery.data?.data?.filter((v: any) => v.status === 'PENDING') || []).length
  }

  const depts = deptsQuery.data || []
  const data = violationsQuery.data?.data || []
  const total = violationsQuery.data?.total || 0

  const openEvidence = (item: any) => { setSelectedItem(item); setIsModalOpen(true) }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-black">
      {/* 顶部战术仪表盘 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
         <div className="bg-red-600 p-6 rounded-[32px] shadow-lg shadow-red-200 border border-red-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ShieldAlert size={80} /></div>
            <span className="text-[10px] font-black text-red-100 uppercase tracking-widest block mb-2">全域高危拦截 (24H)</span>
            <div className="flex items-baseline gap-2 text-white">
               <span className="text-5xl font-black italic tracking-tighter leading-none">{stats.serious}</span>
               <span className="text-xs font-black opacity-60 uppercase">Critical</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 relative overflow-hidden group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">待审计违规事项</span>
            <div className="flex items-baseline gap-2 text-black">
               <span className="text-5xl font-black italic tracking-tighter leading-none">{stats.pending}</span>
               <span className="text-xs font-black opacity-30 uppercase">Actions</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 w-fit">
               <RefreshCw size={10} className="animate-spin" /> 智脑实时重校中
            </div>
         </div>
         <div className="bg-slate-900 p-6 rounded-[32px] shadow-lg border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><BrainCircuit size={80} className="text-cyan-400" /></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">策略重命中率</span>
            <div className="flex items-baseline gap-2 text-white">
               <span className="text-5xl font-black italic tracking-tighter leading-none text-cyan-400">98.2</span>
               <span className="text-xs font-black opacity-40 uppercase">% ACC</span>
            </div>
         </div>
      </div>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
             <ShieldAlert size={32} className="text-red-600" /> 违规审计流
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">捕获物理链路中的所有高危动作 · 自动存证审计</p>
        </div>
        <div className="flex items-center gap-4">
           <TacticalSearch value={search} onChange={setSearch} placeholder="搜索成员..." className="w-64" />
           <div className="w-48"><TacticalSelect options={[{id: '', name: '全域部门'}, ...depts]} value={deptId} onChange={(val) => { setDeptId(val); setPage(1); }} /></div>
           <div className="w-40"><TacticalSelect options={[{id: 'ALL', name: '全等级'}, {id: 'SERIOUS', name: '严重 (LV.8+)'}, {id: 'MEDIUM', name: '中级'}, {id: 'LOW', name: '低级'}]} value={riskLevel} onChange={(val) => { setRiskLevel(val); setPage(1); }} /></div>
           <button onClick={() => violationsQuery.refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 transition-all active:scale-95 group"><RefreshCw size={18} className={cn(violationsQuery.isFetching && "animate-spin")} /></button>
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {violationsQuery.isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center opacity-30"><Loader2 className="animate-spin mb-4" size={40} /></div>
          ) : (
            <TacticalTable headers={['捕获时间', '成员节点', '所属部门', '风险词', '威胁评分', '链路取证']}>
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer text-center text-sm font-bold text-slate-600" onClick={() => openEvidence(item)}>
                  <td className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-3">
                       <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all border shadow-sm", item.risk_score >= 8 ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-600 border-slate-100")}>{item.user__real_name?.[0] || '?'}</div>
                       <span className="font-black text-slate-900">{item.user__real_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center text-[10px] font-black uppercase text-slate-400">{item.user__department__name || '全域节点'}</td>
                  <td className="px-6 py-5 text-center"><span className={cn("px-3 py-1 rounded-xl text-[10px] font-black border uppercase italic", item.risk_score >= 8 ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100")}>{item.keyword}</span></td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black italic tracking-widest shadow-sm",
                      item.risk_score >= 8 ? "bg-red-600 text-white animate-pulse" : "bg-slate-900 text-white"
                    )}>
                      LV.{item.risk_score}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center"><button onClick={(e) => { e.stopPropagation(); openEvidence(item); }} className="p-2.5 bg-slate-50 text-slate-600 hover:bg-black hover:text-white rounded-xl transition-all border border-slate-200 group-hover:border-black"><ArrowUpRight size={16} /></button></td>
                </tr>
              ))}
            </TacticalTable>
          )}
          {data.length === 0 && !violationsQuery.isLoading && (
             <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 gap-4">
                <ShieldCheck size={80} className="text-emerald-500" />
                <p className="text-xl font-black uppercase tracking-[0.3em]">全域清朗 · 暂无威胁信号</p>
             </div>
          )}
        </div>
        {total > 15 && <div className="p-2 border-t border-slate-100"><TacticalPagination total={total} pageSize={15} currentPage={page} onPageChange={setPage} /></div>}
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <EvidenceModal onClose={() => setIsModalOpen(false)} data={selectedItem} />
        )}
      </AnimatePresence>
    </div>
  )
}
