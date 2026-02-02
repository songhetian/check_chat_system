import React from 'react'
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
  Contact2 // 引入画像图标
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const clickAudio = useRef<HTMLAudioElement | null>(null)

  const playClick = () => {
    if (clickAudio.current) {
      clickAudio.current.currentTime = 0
      clickAudio.current.volume = 0.1
      clickAudio.current.play().catch(() => {})
    }
  }

  // ... (menu 定义保持不变)

  return (
    <div className="flex h-screen bg-slate-50">
      <audio ref={clickAudio} src="https://assets.mixkit.co/active_storage/sfx/2568/2534-preview.mp3" preload="auto" />
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800">
        <div className="p-6">
          {/* ... Logo 部分 */}
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
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-400 transition-colors text-xs font-bold"
          >
            <LogOut size={14} /> 退出指挥链路
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              placeholder="搜索坐席、违规词或商品..." 
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">系统状态</div>
              <div className="text-[12px] font-bold text-green-600 flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                全链路加密运行中
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
