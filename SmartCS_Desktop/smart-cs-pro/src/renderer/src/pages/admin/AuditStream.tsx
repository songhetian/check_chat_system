import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Clock, Loader2, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'

export default function AuditStreamPage() {
  const { token } = useAuthStore()
  const [page, setPage] = useState(1)

  // React Query: Fetch Logs
  const { data: logsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/audit-logs?page=${page}&size=15`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data
    },
    enabled: !!token
  })

  const logs = logsData?.data || []
  const total = logsData?.total || 0

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">系统操作审计</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            记录所有高级管理操作与系统配置变动，确保全流程透明可追溯
            {isFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
          <RefreshCw size={18} className={cn(isFetching && "animate-spin")} />
        </button>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50">
              <Loader2 className="animate-spin" size={40} />
              <span>加载审计流水...</span>
            </div>
          ) : (
            <TacticalTable headers={['操作时间', '操作员', '动作类型', '操作目标', '详细审计载荷']}>
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                      <Clock size={10} /> {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-black text-[10px] border border-cyan-200 shadow-inner">
                        {log.operator?.[0] || '?'}
                      </div>
                      <span className="text-xs font-black text-slate-900">{log.operator}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center">
                      <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-tighter shadow-sm">
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-[10px] font-black text-slate-900 text-center uppercase tracking-tighter">{log.target || '-'}</td>
                  <td className="px-8 py-3 text-[10px] text-slate-600 italic text-center max-w-md truncate font-medium">"{log.details}"</td>
                </tr>
              ))}
            </TacticalTable>
          )}
          {logs.length === 0 && !isLoading && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-200 gap-4 uppercase font-black italic opacity-20">
               <ShieldCheck size={64} strokeWidth={1} />
               <p>暂无合规操作记录</p>
            </div>
          )}
        </div>
        
        {total > 15 && (
          <div className="shrink-0 border-t border-slate-100 bg-white p-2">
            <TacticalPagination total={total} pageSize={15} currentPage={page} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}