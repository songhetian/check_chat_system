import React, { useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Settings,
  Package,
  BarChart3,
  LogOut,
  Bell,
  Search,
  Wrench,
  Contact2, // 引入画像图标
  Minus,
  X
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/utils'

const menu = [
  { path: '/', icon: LayoutDashboard, label: '指挥概览' },
  { path: '/alerts', icon: ShieldAlert, label: '紧急响应' },
  { path: '/customers', icon: Contact2, label: '客户画像' },
  { path: '/products', icon: Package, label: '商品战术' },
  { path: '/tools', icon: Wrench, label: '提效工具' },
  { path: '/global-policy', icon: Settings, label: '全局策略' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const clickAudio = useRef<HTMLAudioElement | null>(null)

  const handleMinimize = () => window.electron.ipcRenderer.send('minimize-window')
  const handleClose = () => window.electron.ipcRenderer.send('close-window')

  useEffect(() => {
    // 确保进入仪表盘时窗口足够大并居中
    window.electron.ipcRenderer.send('resize-window', { width: 1280, height: 850, center: true })
    // 管理模式不需要置顶
    window.electron.ipcRenderer.send('set-always-on-top', false)
  }, [])

  const handleLogout = () => {
    logout();
    window.location.hash = '/login';
  }

  const playClick = () => {
    if (clickAudio.current) {
      clickAudio.current.currentTime = 0
      clickAudio.current.volume = 0.1
      clickAudio.current.play().catch(() => {})
    }
  }

  // ... (menu 定义保持不变)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden select-none">
      <audio ref={clickAudio} src="https://assets.mixkit.co/active_storage/sfx/2568/2534-preview.mp3" preload="auto" />
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="text-white" size={24} />
            </div>
            <span className="text-xl font-black text-white tracking-tighter italic">SMART-CS</span>
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
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
              {user?.username[0].toUpperCase()}
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
            <LogOut size={14} /> 退出指挥链路
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="relative w-96" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              placeholder="搜索坐席、违规词或商品..." 
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">系统状态</div>
                <div className="text-[12px] font-bold text-green-600 flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  全链路加密运行中
                </div>
              </div>

              {/* 窗口控制按钮 */}
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

        {/* Dynamic Viewport */}
        <section className="flex-1 overflow-y-auto p-8">
          {children}
        </section>
      </main>
    </div>
  )
}
