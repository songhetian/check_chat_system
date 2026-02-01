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

  const adminMenu = [
    { icon: LayoutDashboard, label: '部门概览', path: '/' },
    { icon: ShieldAlert, label: '紧急响应队列', path: '/alerts' },
    { icon: Users, label: '坐席管理', path: '/staff' },
    { icon: Contact2, label: '全景客户画像', path: '/customers' }, // 新增画像入口
    { icon: Package, label: '商品战术库', path: '/products' },
    { icon: Wrench, label: '战术工具包', path: '/tools' },
    { icon: Settings, label: '本部门配置', path: '/settings' },
  ]
  const hqMenu = [
    { icon: BarChart3, label: '全集团看板', path: '/' },
    { icon: ShieldAlert, label: '全局审计流', path: '/audit' },
    { icon: Users, label: '部门经理管理', path: '/managers' },
    { icon: ShieldCheck, label: '全局 AI 策略', path: '/global-policy' }, // 这里的图标改为 ShieldCheck
  ]

  const menu = user?.role === 'HQ' ? hqMenu : adminMenu

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 text-cyan-400 mb-8">
            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
              <ShieldAlert size={18} />
            </div>
            <span className="font-black tracking-tighter text-lg text-white italic">SMART-CS</span>
          </div>

          <nav className="space-y-1">
            {menu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
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
