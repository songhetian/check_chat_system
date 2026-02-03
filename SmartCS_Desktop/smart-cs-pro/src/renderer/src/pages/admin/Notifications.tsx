import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MailOpen, CheckCheck, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { TacticalPagination } from '../../components/ui/TacticalTable'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

interface Notification {
  id: string
  title: string
  content: string
  created_at: string
  is_read: number
  type: string
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchNotifs = async () => {
    setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/notifications?page=${page}&size=10`,
        method: 'GET'
      })
      if (res.status === 200) {
        setNotifs(res.data.data)
        setTotal(res.data.total)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifs() }, [page])

  const markRead = async (id: string) => {
    await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/notifications/read`, method: 'POST', data: { id } })
    fetchNotifs()
  }

  return (
    <div className="space-y-6 h-full flex flex-col font-sans bg-slate-50/50 p-4 lg:p-6">
      <div className="flex justify-between items-end text-slate-900 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase italic text-tactical-glow">
            通知消息中枢
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">全域战术指令与系统广播存档</p>
        </div>
        <div className="flex gap-3">
           {/* 色标红线：同步刷新使用轻量级风格 */}
           <button onClick={fetchNotifs} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-100 shadow-sm">
             <RefreshCw size={16} className={cn(loading && "animate-spin")} /> 刷新同步
           </button>
           {/* 色标红线：主操作使用深色 */}
           <button onClick={() => markRead('ALL')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl active:scale-95">
             <CheckCheck size={16} /> 全部标记已读
           </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white/50">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" />
              <span className="text-sm font-bold tracking-widest uppercase italic">正在同步中枢存档...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {notifs.map((n) => (
                <div key={n.id} className={cn("p-6 rounded-[28px] border transition-all flex items-center gap-6 group", n.is_read ? "bg-slate-50/50 border-slate-100 opacity-60" : "bg-white border-slate-200 shadow-md hover:shadow-2xl hover:border-cyan-200")}>
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", n.is_read ? "bg-slate-200 text-slate-400" : "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20")}>
                    {n.is_read ? <MailOpen size={24}/> : <Bell size={24} className="animate-swing" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={cn("text-base font-black transition-colors", n.is_read ? "text-slate-500" : "text-slate-900")}>{n.title}</h4>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-1 font-medium italic">"{n.content}"</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="p-3 bg-cyan-500 text-slate-950 rounded-xl hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all" title="标为已读">
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && notifs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black tracking-widest">
               <CheckCircle2 size={64} strokeWidth={1} className="opacity-20" />
               <p className="text-sm">指挥中心目前没有新指令</p>
            </div>
          )}
        </div>

        {/* 智能分页红线：仅在数据超过单页上限时展示 */}
        {total > 10 && (
          <TacticalPagination 
            total={total} 
            pageSize={10} 
            currentPage={page} 
            onPageChange={setPage} 
          />
        )}
      </div>
    </div>
  )
}
