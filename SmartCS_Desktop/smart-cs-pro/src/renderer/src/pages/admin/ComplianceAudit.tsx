import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileSearch, Loader2, RefreshCw, User, Calendar, ShieldCheck, Filter
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { useAuthStore } from '../../store/useAuthStore'

export default function ComplianceAuditPage() {
  const { token } = useAuthStore()
  const [page, setPage] = useState(1)

  // 1. 数据采集：React Query 极速缓存版
  const { data: auditData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['compliance_logs', page],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/compliance-logs?page=${page}&size=15`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data
    },
    enabled: !!token,
    staleTime: 10000 // 合规日志变动频繁，缓存 10 秒
  })

  const data = auditData?.data || []
  const total = auditData?.total || 0

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
             <FileSearch size={32} className="text-amber-500" /> 部门合规审计
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">查看坐席触发部门规避词的静默拦截记录 · 助力业务用语规范化</p>
        </div>
        <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"><RefreshCw size={18} className={cn((isLoading || isFetching) && "animate-spin")} /></button>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? <div className="h-64 flex flex-col items-center justify-center opacity-30"><Loader2 className="animate-spin mb-4" size={40} /></div> : (
              <TacticalTable headers={['操作员', '所属部门', '触发词', '完整上下文', '触发时间']}>
                {data.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 justify-center">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">{item.user__real_name[0]}</div>
                          <span className="font-black text-slate-900">{item.user__real_name}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center font-black uppercase text-[10px] text-slate-400">{item.department__name || '未分配'}</td>
                    <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black border border-amber-100 uppercase">{item.word}</span></td>
                    <td className="px-6 py-5 text-left max-w-md"><p className="truncate italic opacity-70" title={item.context}>"{item.context}"</p></td>
                    <td className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center justify-center gap-1.5"><Calendar size={12}/>{new Date(item.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </TacticalTable>
            )}
            {data.length === 0 && !isLoading && (
               <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 gap-4">
                  <ShieldCheck size={80} />
                  <p className="text-xl font-black uppercase tracking-[0.3em]">全域合规 · 暂无拦截记录</p>
               </div>
            )}
         </div>
         {total > 15 && <div className="p-2 border-t border-slate-100"><TacticalPagination total={total} pageSize={15} currentPage={page} onPageChange={setPage} /></div>}
      </div>
    </div>
  )
}