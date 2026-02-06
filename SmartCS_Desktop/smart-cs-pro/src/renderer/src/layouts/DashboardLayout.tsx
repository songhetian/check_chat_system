import React, { useRef, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ShieldAlert, Settings, Package, LogOut, Bell, Wrench, Contact2, Minus, X, Info, MailOpen, Square, Copy as CopyIcon, Zap, Building2, UserCog, Shield, Layers
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/utils'
import { CONFIG } from '../lib/config'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  content: string
  created_at: string
  is_read: number
  type: string
}

const menu = [
  { path: '/', icon: LayoutDashboard, label: '指挥中心概览' },
  { path: '/command', icon: Zap, label: '实时战术指挥' },
  { path: '/alerts', icon: ShieldAlert, label: '风险拦截审计' },
  { path: '/notifications', icon: Bell, label: '通知消息中枢' },
  { path: '/rbac', icon: Shield, label: '权责矩阵定义' },
  { path: '/categories', icon: Layers, label: '策略分类管理' },
  { path: '/departments', icon: Building2, label: '部门架构管理' },
  { path: '/users', icon: UserCog, label: '成员权限矩阵' },
  { path: '/customers', icon: Contact2, label: '客户画像分析' },
  { path: '/products', icon: Package, label: '商品战术话术' },
  { path: '/tools', icon: Wrench, label: '全域提效工具' },
  { path: '/global-policy', icon: Settings, label: '全局 AI 策略' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const notifRef = useRef<HTMLDivElement | null>(null)
  const bellRef = useRef<HTMLButtonElement | null>(null)
  const clickAudio = useRef<HTMLAudioElement | null>(null)
  
  const [showNotif, setShowNotif] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [selectedMsg, setSelectedMsg] = useState<Notification | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isServerOnline, setIsServerOnline] = useState(true)

  const handleMinimize = () => window.electron.ipcRenderer.send('minimize-window')
  const handleClose = () => window.electron.ipcRenderer.send('close-window')
  const toggleFullScreen = () => {
    const next = !isFullScreen
    setIsFullScreen(next)
    window.electron.ipcRenderer.send('set-fullscreen', next)
  }

  const fetchRecentNotifs = async () => {
    const token = useAuthStore.getState().token
    if (!token) return
    try {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/notifications?size=5`, 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) setNotifications(res.data.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { 
    fetchRecentNotifs() 
    // 每 30 秒自动同步一次未读消息，实现无感更新
    const timer = setInterval(fetchRecentNotifs, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const checkSyncStatus = async () => {
      if (window.api?.getSyncStatus) {
        const { pendingCount } = await window.api.getSyncStatus()
        setPendingSyncCount(pendingCount)
      }
      
      // 增加心跳检测：检测 /health 接口
      try {
        const res = await window.api.callApi({ url: '/health', method: 'GET' })
        setIsServerOnline(res.status === 200)
      } catch {
        setIsServerOnline(false)
      }
    }
    checkSyncStatus()
    const timer = setInterval(checkSyncStatus, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // 当弹窗打开时也立即刷新一次，确保看到的是最新的
    if (showNotif) fetchRecentNotifs()
  }, [showNotif])

  const unreadCount = notifications.filter(n => n.is_read === 0).length

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showNotif && 
          notifRef.current && !notifRef.current.contains(e.target as Node) &&
          bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [showNotif])

  const handleItemClick = async (n: Notification) => {
    const token = useAuthStore.getState().token
    setSelectedMsg(n)
    if (n.is_read === 0 && token) {
      await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/notifications/read`, 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        data: { id: n.id } 
      })
      fetchRecentNotifs()
    }
  }

  useEffect(() => {
    const onToast = (e: any) => { 
      const { title, message, type, details } = e.detail
      if (type === 'error') {
        toast.error(title, { description: message || details })
      } else if (type === 'success') {
        toast.success(title, { description: message || details })
      } else {
        toast(title, { description: message || details })
      }
    }
    window.addEventListener('trigger-toast', onToast)
    return () => window.removeEventListener('trigger-toast', onToast)
  }, [])

  const handleLogout = () => {
    logout()
    window.location.hash = '/login'
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden select-none font-sans">
      <audio ref={clickAudio} src="https://assets.mixkit.co/active_storage/sfx/2568/2534-preview.mp3" preload="auto" />
      
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0 relative z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-white text-xs">
              {CONFIG.BRANDING.logoText}
            </div>
            <span className="text-xl font-black text-white tracking-tighter italic uppercase">{CONFIG.BRANDING.name}</span>
          </div>
          <nav className="space-y-1">
            {menu.map((item) => (
              <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium", location.pathname === item.path ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>
                <item.icon size={18} /> {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-cyan-400 font-bold uppercase">{user?.username[0]}</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-none">{user?.real_name}</span>
              <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-400 transition-colors text-xs font-bold">
            <LogOut size={14} /> 退出战术链路
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">指挥中心控制台</div>
            
            {!isServerOnline && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-tighter">
                  指挥中心脱机
                </span>
              </motion.div>
            )}

            {pendingSyncCount > 0 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tighter">
                  离线缓存: {pendingSyncCount} 条待同步
                </span>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="relative">
              <button ref={bellRef} onClick={() => setShowNotif(!showNotif)} className={cn("relative p-2 rounded-full transition-colors", showNotif ? "bg-cyan-50 text-cyan-600" : "text-slate-400 hover:bg-slate-100")}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] text-white flex items-center justify-center font-black animate-bounce">{unreadCount}</span>}
              </button>

              <AnimatePresence>
                {showNotif && (
                  <motion.div ref={notifRef} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-80 bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden z-[500]">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                       <span className="text-xs font-black text-slate-900">最近战术通知</span>
                       <Link to="/notifications" onClick={() => setShowNotif(false)} className="text-[10px] text-cyan-600 font-bold hover:underline">全部</Link>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                       {notifications.map(n => (
                         <div key={n.id} onClick={() => handleItemClick(n)} className={cn("p-4 border-b border-slate-50 cursor-pointer group transition-all", n.is_read === 1 ? "opacity-40" : "hover:bg-slate-50")}>
                            <div className="flex items-start gap-3">
                               <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", n.is_read === 1 ? "bg-slate-100" : "bg-cyan-100 text-cyan-600")}>
                                  {n.is_read === 1 ? <MailOpen size={14}/> : <Bell size={14}/>}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                                  <p className="text-[10px] text-slate-500 truncate">{n.content}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
              <button onClick={handleMinimize} className="text-slate-400 hover:text-slate-600 transition-colors" title="最小化"><Minus size={18} /></button>
              <button onClick={toggleFullScreen} className="text-slate-400 hover:text-slate-600 transition-colors" title={isFullScreen ? "向下还原" : "最大化"}>
                {isFullScreen ? <CopyIcon size={14} className="rotate-180" /> : <Square size={14} />}
              </button>
              <button onClick={handleClose} className="text-slate-400 hover:text-red-500 transition-colors" title="关闭"><X size={18} /></button>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
          {children}
        </section>

        {/* 详情弹窗 */}
        <AnimatePresence>
          {selectedMsg && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMsg(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative z-10">
                  <div className="p-8 text-slate-900">
                     <div className="flex justify-between items-start mb-6">
                        <div className={cn("w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center")}>
                           <Info size={24} />
                        </div>
                        <button onClick={() => setSelectedMsg(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={20}/></button>
                     </div>
                     <h3 className="text-2xl font-black mb-2">{selectedMsg.title}</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">{new Date(selectedMsg.created_at).toLocaleString()}</p>
                     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-h-[100px]">
                        <p className="text-sm leading-relaxed font-medium">{selectedMsg.content}</p>
                     </div>
                     <button onClick={() => setSelectedMsg(null)} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">确认指令</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}