import React, { useRef, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, ShieldAlert, Settings, Package, LogOut, Bell, Wrench, Contact2, Minus, X, Info, MailOpen, Square, Copy as CopyIcon, Zap, Building2, UserCog, Shield, Layers
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useRiskStore } from '../store/useRiskStore' // V3.19: 引入风险状态库
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
  { path: '/', icon: LayoutDashboard, label: '系统运行首页' },
  { path: '/command', icon: Zap, label: '成员实时监控' },
  { path: '/alerts', icon: ShieldAlert, label: '违规行为审计' },
  { path: '/notifications', icon: Bell, label: '系统消息中心' },
  { path: '/rbac', icon: Shield, label: '角色权限定义' },
  { path: '/categories', icon: Layers, label: '业务分类管理' },
  { path: '/departments', icon: Building2, label: '部门架构管理' },
  { path: '/users', icon: UserCog, label: '成员账号管理' },
  { path: '/customers', icon: Contact2, label: '客户档案管理' },
  { path: '/products', icon: Package, label: '商品资料管理' },
  { path: '/tools', icon: Wrench, label: '常用辅助工具' },
  { path: '/global-policy', icon: Settings, label: '全局策略配置' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const isScreenMaximized = useRiskStore(s => s.isScreenMaximized) // V3.19: 监听全屏观察状态
  const location = useLocation()
  const navigate = useNavigate()
  const notifRef = useRef<HTMLDivElement | null>(null)
  const bellRef = useRef<HTMLButtonElement | null>(null)
  
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
    const timer = setInterval(fetchRecentNotifs, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const checkSyncStatus = async () => {
      if (window.api?.getSyncStatus) {
        const { pendingCount } = await window.api.getSyncStatus()
        setPendingSyncCount(pendingCount)
      }
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

  const unreadCount = notifications.filter(n => n.is_read === 0).length

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

  const handleLogout = () => {
    logout()
    window.location.hash = '/login'
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden select-none font-sans text-black">
      {/* V3.19: 全屏观察时物理隐藏侧边栏 */}
      <AnimatePresence>
        {!isScreenMaximized && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-slate-900 flex flex-col border-r border-slate-800 shrink-0 relative z-20 overflow-hidden"
          >
            <div className="p-6 w-64">
              <div className="flex items-center gap-3 mb-10 px-2 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
                <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-white text-xs">
                  {CONFIG.BRANDING.logoText}
                </div>
                <span className="text-xl font-black text-white tracking-tighter italic uppercase">{CONFIG.BRANDING.name}</span>
              </div>
              <nav className="space-y-1">
                {menu.map((item) => (
                  <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold", location.pathname === item.path ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200 cursor-pointer")}>
                    <item.icon size={18} /> {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto p-6 border-t border-white/5 space-y-4 w-64">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-cyan-400 font-bold uppercase">{user?.username[0]}</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-none">{user?.real_name}</span>
                  <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">{user?.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-400 transition-colors text-xs font-bold cursor-pointer">
                <LogOut size={14} /> 退出战术链路
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* V3.19: 全屏观察时物理隐藏顶栏 */}
        <AnimatePresence>
          {!isScreenMaximized && (
            <motion.header 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 64, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 cursor-move overflow-hidden" 
              style={{ WebkitAppRegion: 'drag' } as any}
            >
              <div className="flex items-center gap-4">
                <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-black uppercase tracking-widest leading-none">指挥中心控制台</div>
                {!isServerOnline && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-tighter">系统脱机</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <div className="relative">
                  <button ref={bellRef} onClick={() => setShowNotif(!showNotif)} className={cn("relative p-2 rounded-xl transition-colors cursor-pointer", showNotif ? "bg-cyan-50 text-cyan-600" : "text-slate-400 hover:bg-slate-100")}>
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] text-white flex items-center justify-center font-black animate-bounce">{unreadCount}</span>}
                  </button>
                </div>

                <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
                  <button onClick={handleMinimize} className="text-slate-400 hover:text-black transition-colors cursor-pointer" title="最小化"><Minus size={18} /></button>
                  <button onClick={toggleFullScreen} className="text-slate-400 hover:text-black transition-colors cursor-pointer" title={isFullScreen ? "还原" : "最大化"}>
                    {isFullScreen ? <CopyIcon size={14} className="rotate-180" /> : <Square size={14} />}
                  </button>
                  <button onClick={handleClose} className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title="关闭"><X size={18} /></button>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        <section className={cn("flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 transition-all duration-500", isScreenMaximized ? "p-0 bg-black" : "p-6")}>
          {children}
        </section>

        {/* 通知气泡逻辑保持不变，但只有在非全屏时显示 */}
        <AnimatePresence>
          {showNotif && !isScreenMaximized && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-16 right-8 w-80 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden z-[500]">
               <div className="p-4 bg-slate-100/80 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-black text-black uppercase">最近消息通知</span>
                  <Link to="/notifications" onClick={() => setShowNotif(false)} className="text-[10px] text-cyan-600 font-black hover:underline uppercase cursor-pointer">查看全部</Link>
               </div>
               <div className="max-h-[320px] overflow-y-auto custom-scrollbar bg-white">
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => handleItemClick(n)} className={cn("p-4 border-b border-slate-50 cursor-pointer group transition-all", n.is_read === 1 ? "opacity-40" : "hover:bg-slate-50")}>
                       <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-inner", n.is_read === 1 ? "bg-slate-50 text-slate-400" : "bg-cyan-50 text-cyan-600 border-cyan-100")}>
                             {n.is_read === 1 ? <MailOpen size={14}/> : <Bell size={14}/>}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-xs font-black text-black truncate">{n.title}</p>
                             <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">"{n.content}"</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedMsg && !isScreenMaximized && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 text-black">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMsg(null)} className="absolute inset-0 bg-slate-900/40" />
               <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden relative z-10">
                  <div className="p-6">
                     <div className="flex justify-between items-start mb-6">
                        <div className={cn("w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center shadow-inner")}>
                           <Info size={20} />
                        </div>
                        <button onClick={() => setSelectedMsg(null)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 cursor-pointer"><X size={18}/></button>
                     </div>
                     <h3 className="text-xl font-black mb-1 leading-tight text-black">{selectedMsg.title}</h3>
                     <p className="text-sm leading-relaxed font-bold italic text-slate-600">"{selectedMsg.content}"</p>
                     <button onClick={() => setSelectedMsg(null)} className="w-full mt-6 py-3 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer">关闭指令</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}