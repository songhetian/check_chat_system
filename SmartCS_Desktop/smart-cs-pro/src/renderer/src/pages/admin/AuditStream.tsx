import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, User, Clock, Info, Search, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'
import { TacticalPagination } from '../../components/ui/TacticalTable'

export default function AuditStreamPage() {
  const { token } = useAuthStore()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/audit-logs?page=${page}&size=15`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setLogs(res.data.data)
        setTotal(res.data.total)
      }
    } catch (e) { console.error('审计同步异常', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs() }, [page, token])

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">全局合规审计流</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">记录所有高级操作与战术变动，确保系统管理 100% 透明可追溯</p>
        </div>
        <button onClick={fetchLogs} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all flex items-center gap-2">
          <RefreshCw size={16} className={cn(loading && "animate-spin")} /> 刷新同步
        </button>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50">
              <Loader2 className="animate-spin" size={40} /><span>调取中枢审计存档...</span>
            </div>
          ) : (
            <table className="w-full text-center border-collapse">
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">操作时间</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">操作员</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">战术动作</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">目标对象</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">物理审计载荷</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                        <Clock size={12} /> {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black border border-cyan-100">
                          {log.operator?.[0] || '?'}
                        </div>
                        <span className="text-sm font-black text-slate-900">{log.operator}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-tighter shadow-sm">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-600 text-center">{log.target || '-'}</td>
                    <td className="px-8 py-5 text-xs text-slate-400 italic text-center max-w-md truncate">"{log.details}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {logs.length === 0 && !loading && (
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