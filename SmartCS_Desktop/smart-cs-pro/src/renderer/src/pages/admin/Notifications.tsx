import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, MailOpen, CheckCheck, Loader2, RefreshCw, 
  CheckCircle2, X, MessageSquare, ShieldAlert,
  ArrowUpRight, Inbox
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TacticalPagination, TacticalTable } from '../../components/ui/TacticalTable'
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

// 消息专用弹窗：收紧圆角与内边距
function MessageModal({ isOpen, onClose, data, onMarkRead, isPending }: any) {
  if (!data) return null
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-black">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative w-full max-w-md rounded-xl shadow-xl overflow-hidden bg-white z-10 p-6">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", data.is_read ? "bg-slate-100 text-slate-400" : "bg-cyan-600 text-white")}>
                    {data.is_read ? <MailOpen size={20} /> : <MessageSquare size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-black leading-none">{data.title}</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{new Date(data.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400"><X size={18}/></button>
             </div>
             
             <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 mb-6 text-left">
                <p className="text-black text-sm font-bold leading-relaxed italic">"{data.content}"</p>
             </div>

             <div className="flex gap-3">
                {data.is_read ? (
                  <div className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 border border-emerald-100">
                    <CheckCircle2 size={14} /> 指令已存档
                  </div>
                ) : (
                  <button 
                    disabled={isPending}
                    onClick={() => onMarkRead(data.id)} 
                    className="flex-1 py-2 bg-black text-white rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} className="text-cyan-400" />} 确认阅知
                  </button>
                )}
                <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-black rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all border border-slate-200">关闭</button>
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
        if (selectedMsg && selectedMsg.id !== 'ALL') setSelectedMsg(prev => prev ? { ...prev, is_read: 1 } : null)
        else setSelectedMsg(null)
        toast.success('同步成功')
      }
    }
  })

  const markRead = (id: string) => {
    if (!token || readMutation.isPending) return
    readMutation.mutate(id)
  }

  return (
    <div className="space-y-6 h-full flex flex-col font-sans bg-slate-50/50 p-4 lg:p-6 text-black">
      <div className="flex justify-between items-end bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-black uppercase italic leading-none">消息通知中枢</h2>
          <p className="text-slate-500 text-sm mt-2 font-bold flex items-center gap-2">
            中枢战术指令归档
            {isFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => refetch()} className="p-2.5 bg-slate-50 text-black rounded-xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
             <RefreshCw size={18} className={cn(isFetching && "animate-spin")} />
           </button>
           <button onClick={() => markRead('ALL')} className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-black active:scale-95 transition-all flex items-center gap-2 shadow-lg">
             <CheckCheck size={16} /> 全部已读
           </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 shrink-0">
        <div className="flex-1 max-w-md"><TacticalSearch value={search} onChange={setSearch} placeholder="按标题或关键词过滤..." /></div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50">
              <Loader2 className="animate-spin" size={40} />
              <span>载入消息存档...</span>
            </div>
          ) : (
            <TacticalTable headers={['消息主题', '时间', '状态', '操作']}>
              {notifs.map((n: Notification) => (
                <tr 
                  key={n.id} 
                  className={cn(
                    "group transition-all cursor-pointer", 
                    n.is_read ? "bg-slate-50/80" : "bg-white hover:bg-cyan-50/20"
                  )}
                  onClick={() => setSelectedMsg(n)}
                >
                  <td className="px-8 py-3 text-left">
                    <div className="flex items-center gap-4">
                      {/* 仅保留彩色指示条，移除图标 */}
                      <div className={cn(
                        "w-1.5 h-10 rounded-full shrink-0 transition-all",
                        n.is_read ? "bg-slate-300" : "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)] animate-pulse"
                      )} />
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-xs truncate max-w-xs", 
                          n.is_read ? "text-slate-500 font-medium" : "text-black font-black"
                        )}>
                          {n.title}
                        </span>
                        <span className={cn(
                          "text-[10px] italic truncate max-w-md",
                          n.is_read ? "text-slate-400" : "text-slate-600"
                        )}>
                          "{n.content}"
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={cn(
                      "text-[10px] tabular-nums",
                      n.is_read ? "text-slate-400 font-medium" : "text-black font-black"
                    )}>
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center text-xs">
                    <div className="flex justify-center">
                      {n.is_read ? (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black rounded uppercase tracking-tighter border border-slate-300">已存档</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded shadow-md animate-pulse uppercase tracking-tighter">待处理</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSelectedMsg(n); }} 
                         className="p-2 bg-slate-100 text-black hover:bg-black hover:text-white rounded-xl transition-all border border-slate-200"
                       >
                         <ArrowUpRight size={14} />
                       </button>
                       {!n.is_read && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); markRead(n.id); }} 
                           className="p-2 bg-cyan-100 text-cyan-700 hover:bg-cyan-600 hover:text-white rounded-xl transition-all border border-cyan-200"
                         >
                           <CheckCircle2 size={14} />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
          {notifs.length === 0 && !isLoading && (
            <div className="p-20 text-center flex flex-col items-center gap-4 opacity-20">
              <Inbox size={64} className="text-black" />
              <p className="text-xs font-black text-black uppercase tracking-widest">消息库为空</p>
            </div>
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
