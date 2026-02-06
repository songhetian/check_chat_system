import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, MailOpen, CheckCheck, Loader2, RefreshCw, 
  CheckCircle2, X, MessageSquare, ShieldAlert,
  Search, ArrowUpRight
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  content: string
  created_at: string
  is_read: number
  type: string
}

// Lightweight Performance Modal
function MessageModal({ isOpen, onClose, data, onMarkRead, isPending }: any) {
  if (!data) return null
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative w-full max-w-md rounded-xl shadow-xl overflow-hidden bg-white z-10 p-6 text-center">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-sm", data.is_read ? "bg-slate-100 text-slate-400" : "bg-cyan-600 text-white")}>
                    {data.is_read ? <MailOpen size={20} /> : <MessageSquare size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-none">{data.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{new Date(data.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={18}/></button>
             </div>
             
             <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 mb-6 text-left">
                <p className="text-slate-700 text-sm font-medium leading-relaxed italic">"{data.content}"</p>
             </div>

             <div className="flex gap-3">
                {data.is_read ? (
                  <div className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px] uppercase flex items-center justify-center gap-2 border border-emerald-100">
                    <CheckCircle2 size={14} /> 消息已读
                  </div>
                ) : (
                  <button 
                    disabled={isPending}
                    onClick={() => onMarkRead(data.id)} 
                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} className="text-cyan-400" />} 确认消息
                  </button>
                )}
                <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-lg font-black text-[10px] uppercase hover:bg-slate-200 transition-all">关闭</button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function NotificationsPage() {
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedMsg, setSelectedMsg] = useState<Notification | null>(null)

  // React Query: Fetch Data
  const { data: notifsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['notifications', page, search],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/notifications?page=${page}&size=10&search=${search}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data
    },
    enabled: !!token
  })

  const notifs = notifsData?.data || []
  const total = notifsData?.total || 0

  // React Query: Mutation
  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      return window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/notifications/read`, 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id } 
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        if (selectedMsg) setSelectedMsg(prev => prev ? { ...prev, is_read: 1 } : null)
        toast.success('消息状态已更新')
      }
    }
  })

  const markRead = (id: string) => {
    if (!token || readMutation.isPending) return
    readMutation.mutate(id)
  }

  return (
    <div className="space-y-6 h-full flex flex-col font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">消息通知中心</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            全域战术指令存档，确保每一条风险预警均已阅知
            {isFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
             <RefreshCw size={18} className={cn(isFetching && "animate-spin")} />
           </button>
           <button onClick={() => markRead('ALL')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2">
             <CheckCheck size={16} /> 全部已读
           </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex-1 min-w-[240px]"><TacticalSearch value={search} onChange={setSearch} placeholder="检索消息标题、内容关键词..." /></div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50">
              <Loader2 className="animate-spin" size={40} />
              <span>调取中枢存档...</span>
            </div>
          ) : (
            <TacticalTable headers={['消息标题', '发生时间', '内容摘要', '阅知状态', '管理操作']}>
              {notifs.map((n: Notification) => (
                <tr key={n.id} className={cn("hover:bg-slate-50/50 transition-colors group cursor-pointer text-center", n.is_read && "opacity-60")} onClick={() => setSelectedMsg(n)}>
                  <td className="px-8 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-inner", n.is_read ? "bg-slate-50 text-slate-400" : "bg-cyan-50 text-cyan-600 border-cyan-100")}>
                        {n.is_read ? <MailOpen size={14} /> : <Bell size={14} className="animate-swing" />}
                      </div>
                      <span className="text-xs font-black text-slate-900 truncate max-w-[180px]">{n.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center text-[10px] font-bold text-slate-900 whitespace-nowrap">{new Date(n.created_at).toLocaleString()}</td>
                  <td className="px-6 py-3 text-center text-[10px] font-medium text-slate-800 italic truncate max-w-md">"{n.content}"</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center">
                      {n.is_read ? (
                        <span className="text-[9px] font-black text-slate-500 uppercase">已归档</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded-full border border-red-200">待阅知</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); setSelectedMsg(n); }} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-lg transition-all shadow-sm"><ArrowUpRight size={14} /></button>
                       {!n.is_read && (
                         <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }} className="p-2 bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white rounded-lg transition-all shadow-sm border border-cyan-100"><CheckCircle2 size={14} /></button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 10 && <div className="shrink-0 border-t border-slate-100 bg-white p-2"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      <MessageModal 
        isOpen={!!selectedMsg} 
        onClose={() => setSelectedMsg(null)} 
        data={selectedMsg} 
        onMarkRead={markRead}
        isPending={readMutation.isPending}
      />
    </div>
  )
}
