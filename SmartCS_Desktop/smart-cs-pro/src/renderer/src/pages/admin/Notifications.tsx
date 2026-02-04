import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, MailOpen, CheckCheck, Loader2, RefreshCw, 
  CheckCircle2, X, Info, MessageSquare, ShieldAlert 
} from 'lucide-react'
import { TacticalPagination } from '../../components/ui/TacticalTable'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'

interface Notification {
  id: string
  title: string
  content: string
  created_at: string
  is_read: number
  type: string
}

export default function NotificationsPage() {
  const { token } = useAuthStore()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedMsg, setSelectedMsg] = useState<Notification | null>(null)

  const fetchNotifs = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/notifications?page=${page}&size=10`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setNotifs(res.data.data)
        setTotal(res.data.total)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifs() }, [page])

  const markRead = async (id: string) => {
    if (!token) return
    const res = await window.api.callApi({ 
      url: `${CONFIG.API_BASE}/admin/notifications/read`, 
      method: 'POST', 
      headers: { 'Authorization': `Bearer ${token}` },
      data: { id } 
    })
    if (res.data.status === 'ok') {
      setNotifs(prev => prev.map(n => n.id === id || id === 'ALL' ? { ...n, is_read: 1 } : n))
      if (selectedMsg?.id === id || id === 'ALL') {
        setSelectedMsg(id === 'ALL' ? null : prev => prev ? { ...prev, is_read: 1 } : null)
      }
      window.dispatchEvent(new CustomEvent('trigger-toast', { detail: { title: '指令已归档', message: '通知状态已同步至 MySQL', type: 'success' } }))
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div><h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">消息通知中心</h2><p className="text-slate-500 text-sm mt-1 font-medium">全域战术指令存档，确保每一条风险预警均已阅知</p></div>
        <div className="flex gap-3">
           <button onClick={fetchNotifs} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-100 transition-all border border-slate-100"><RefreshCw size={16} className={cn(loading && "animate-spin")} /> 刷新同步</button>
           <button onClick={() => markRead('ALL')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 active:scale-95 transition-all"><CheckCheck size={16} /> 全部已读</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {loading ? <div className="h-full flex items-center justify-center text-slate-400 gap-3"><Loader2 className="animate-spin" /><span>调取中枢存档...</span></div> : (
            <div className="grid grid-cols-1 gap-4">
              {notifs.map(n => (
                <div key={n.id} onClick={() => setSelectedMsg(n)} className={cn("p-6 rounded-[28px] border transition-all flex items-center gap-6 cursor-pointer", n.is_read ? "bg-slate-50 opacity-60" : "bg-white border-slate-200 shadow-md hover:border-cyan-300 hover:shadow-2xl")}>
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border", n.is_read ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-cyan-50 text-cyan-600 border-cyan-100")}>{n.is_read ? <MailOpen size={24} /> : <Bell size={24} className="animate-swing" />}</div>
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-3 mb-1"><h4 className={cn("text-base font-black uppercase tracking-tight", n.is_read ? "text-slate-500" : "text-slate-900")}>{n.title}</h4><span className="text-[10px] font-black text-slate-400 italic">{new Date(n.created_at).toLocaleString()}</span></div><p className="text-sm text-slate-500 italic line-clamp-1">"{n.content}"</p></div>
                  {!n.is_read && <button onClick={(e) => {e.stopPropagation(); markRead(n.id)}} className="p-3 bg-cyan-500 text-slate-900 rounded-xl hover:bg-cyan-400"><CheckCircle2 size={18} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>
        {total > 10 && <div className="shrink-0 border-t border-slate-100 bg-white p-2"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      <AnimatePresence>
        {selectedMsg && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMsg(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden bg-white z-10 p-10">
               <div className="flex justify-between items-start mb-10"><div className="flex items-center gap-4"><div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", selectedMsg.is_read ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-cyan-400")}>{selectedMsg.is_read ? <MailOpen size={28} /> : <MessageSquare size={28} />}</div><div className="flex flex-col"><h3 className="text-2xl font-black text-slate-900 italic leading-none">{selectedMsg.title}</h3><span className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">时间: {new Date(selectedMsg.created_at).toLocaleString()}</span></div></div><button onClick={() => setSelectedMsg(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button></div>
               <div className="p-10 bg-slate-50 rounded-[32px] border border-slate-100 mb-10"><p className="text-slate-700 text-lg font-medium leading-relaxed italic">"{selectedMsg.content}"</p></div>
               <div className="flex gap-4">
                  {selectedMsg.is_read ? (<div className="flex-1 py-5 bg-emerald-50 text-emerald-600 rounded-[24px] font-black text-xs uppercase flex items-center justify-center gap-3 border border-emerald-100"><CheckCircle2 size={20} /> 指令已阅存档</div>) : (<button onClick={() => markRead(selectedMsg.id)} className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><ShieldAlert size={20} className="text-cyan-400" /> 确认指令并标记已阅</button>)}
                  <button onClick={() => setSelectedMsg(null)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-xs uppercase hover:bg-slate-200 transition-all">关闭</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
