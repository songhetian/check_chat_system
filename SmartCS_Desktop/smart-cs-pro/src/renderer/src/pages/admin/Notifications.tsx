import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Filter, MailOpen, Trash2, ChevronLeft, ChevronRight, CheckCheck, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/card'
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
        url: `${CONFIG.API_BASE}/admin/notifications?page=${page}&size=15`,
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
    <div className="space-y-6 h-full flex flex-col font-sans">
      <div className="flex justify-between items-end text-slate-900 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase italic">
            通知中枢 <span className="text-cyan-500">MESSAGES</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">全域战术指令与系统广播存档</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => markRead('ALL')} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all flex items-center gap-2">
             <CheckCheck size={16} /> 全部标记已读
           </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" />
              <span className="text-sm font-bold tracking-widest uppercase">正在同步中枢存档...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {notifs.map((n) => (
                <div key={n.id} className={cn("p-6 rounded-[24px] border transition-all flex items-center gap-6 group", n.is_read ? "bg-slate-50/50 border-slate-100 opacity-60" : "bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-cyan-200")}>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", n.is_read ? "bg-slate-200 text-slate-400" : "bg-cyan-500/10 text-cyan-600")}>
                    {n.is_read ? <MailOpen size={20}/> : <Bell size={20} className="animate-swing" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-sm font-black text-slate-900">{n.title}</h4>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-1 font-medium">{n.content}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="p-2 bg-white border border-slate-200 rounded-xl text-cyan-600 hover:border-cyan-500 shadow-sm transition-all" title="标为已读">
                        <CheckCheck size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-6 bg-slate-50/50 border-t flex justify-between items-center shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">显示第 {notifs.length} 条，共 {total} 条战术存档</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} className="p-2 bg-white border rounded-xl hover:bg-slate-50 disabled:opacity-30" disabled={page === 1}><ChevronLeft size={16} /></button>
            <button onClick={() => setPage(p => p + 1)} className="p-2 bg-white border rounded-xl hover:bg-slate-50 shadow-sm" disabled={notifs.length < 15}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
