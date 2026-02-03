import React, { useRef, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ShieldAlert,
  Settings,
  Package,
  LogOut,
  Bell,
  Wrench,
  Contact2,
  Minus,
  X,
  Info,
  Activity
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/utils'
import { CONFIG } from '../lib/config'

const menu = [
  { path: '/', icon: LayoutDashboard, label: '指挥中心概览' },
  { path: '/alerts', icon: ShieldAlert, label: '风险拦截审计' },
  { path: '/customers', icon: Contact2, label: '客户画像分析' },
  { path: '/products', icon: Package, label: '商品战术话术' },
  { path: '/tools', icon: Wrench, label: '全域提效工具' },
  { path: '/global-policy', icon: Settings, label: '全局 AI 策略' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const clickAudio = useRef<HTMLAudioElement | null>(null)
  const [showNotif, setShowNotif] = useState(false)

  const handleMinimize = () => window.electron.ipcRenderer.send('minimize-window')
  const handleClose = () => window.electron.ipcRenderer.send('close-window')

  useEffect(() => {
    window.electron.ipcRenderer.send('resize-window', { width: 1280, height: 850, center: true })
    window.electron.ipcRenderer.send('set-always-on-top', false)
  }, [])

  const handleLogout = () => {
    logout()
    window.location.hash = '/login'
  }

  const playClick = () => {
    if (clickAudio.current) {
      clickAudio.current.currentTime = 0
      clickAudio.current.volume = 0.1
      clickAudio.current.play().catch(() => {})
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden select-none font-sans">
      <audio ref={clickAudio} src="https://assets.mixkit.co/active_storage/sfx/2568/2534-preview.mp3" preload="auto" />
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-white">
              {CONFIG.BRANDING.logoText}
            </div>
            <span className="text-xl font-black text-white tracking-tighter italic uppercase">{CONFIG.BRANDING.name}</span>
          </div>
          <nav className="space-y-1">
            {menu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={playClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                  location.pathname === item.path 
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-cyan-400 font-bold uppercase">
              {user?.username[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-none">{user?.real_name}</span>
              <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">{user?.role} · {user?.department}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-400 transition-colors text-xs font-bold"
          >
            <LogOut size={14} /> 退出战术链路
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
               指挥中心控制台
             </div>
          </div>
          
          <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="relative">
              <button 
                onClick={() => setShowNotif(!showNotif)}
                className={cn(
                  "relative p-2 rounded-full transition-colors",
                  showNotif ? "bg-cyan-50 text-cyan-600" : "text-slate-400 hover:bg-slate-100"
                )}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>

              <AnimatePresence>
                {showNotif && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden z-[500]"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                       <span className="text-xs font-black text-slate-900 uppercase">战术通知</span>
                       <span className="text-[10px] text-cyan-600 font-bold">全部已读</span>
                    </div>
                    <div className="p-2 max-h-96 overflow-y-auto">
                       <div className="p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 cursor-pointer group">
                          <div className="flex items-start gap-3">
                             <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                                <Info size={14} />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-900 mb-1">中枢链路已建立</p>
                                <p className="text-[10px] text-slate-500 leading-relaxed">系统已通过安全网关成功同步 MySQL 指令枢纽。</p>
                                <p className="text-[8px] text-slate-400 mt-2">刚刚</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">{CONFIG.BRANDING.company}</div>
                <div className="text-[12px] font-bold text-green-600 flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  链路加密运行中
                </div>
              </div>

              <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
                <button onClick={handleMinimize} className="text-slate-400 hover:text-slate-600 transition-colors" title="最小化">
                  <Minus size={18} />
                </button>
                <button onClick={handleClose} className="text-slate-400 hover:text-red-500 transition-colors" title="关闭">
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
          {children}
        </section>
      </main>
    </div>
  )
}