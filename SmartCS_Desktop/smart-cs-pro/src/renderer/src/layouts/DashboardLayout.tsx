import React, { useRef, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, ShieldAlert, Settings, Package, LogOut, Bell, Wrench, Contact2, Minus, X, Info, MailOpen, Square, Copy as CopyIcon, Zap, Building2, UserCog, Shield, Layers, Smile, ShieldCheck, FileSearch, RefreshCw, ChevronDown, Radar, Mic, FileText
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useRiskStore } from '../store/useRiskStore' 
import { useSystemStatus } from '../hooks/useSystemStatus'
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

// V3.50: 战术分类菜单结构
const menuGroups = [
  {
    id: 'REALTIME',
    label: '实时指挥中心',
    icon: Radar,
    items: [
      { path: '/', icon: LayoutDashboard, label: '系统运行首页' },
      { path: '/command', icon: Zap, label: '成员实时监控' },
      { path: '/alerts', icon: ShieldAlert, label: '高危违规审计' },
    ]
  },
  {
    id: 'COMPLIANCE',
    label: '合规策略中枢',
    icon: ShieldCheck,
    items: [
      { path: '/compliance-audit', icon: FileSearch, label: '部门合规审计' },
      { path: '/dept-words', icon: ShieldCheck, label: '规避词库管理' },
      { path: '/sentiments', icon: Smile, label: '情绪维度定义' },
    ]
  },
  {
    id: 'RESOURCES',
    label: '组织与权限',
    icon: Building2,
    items: [
      { path: '/departments', icon: Building2, label: '部门架构管理' },
      { path: '/users', icon: UserCog, label: '成员账号管理' },
      { path: '/rbac', icon: Shield, label: '角色权限定义' },
      { path: '/categories', icon: Layers, label: '业务分类管理' },
      { path: '/voice-alerts', icon: Mic, label: '语音库管理' },
      { path: '/business-sops', icon: FileText, label: 'SOP规范管理' },
    ]
  },
  {
    id: 'ARCHIVES',
    label: '基础战术档案',
    icon: Package,
    items: [
      { path: '/customers', icon: Contact2, label: '客户档案管理' },
      { path: '/products', icon: Package, label: '商品资料管理' },
      { path: '/tools', icon: Wrench, label: '常用辅助工具' },
    ]
  },
  {
    id: 'SYSTEM',
    label: '系统全局配置',
    icon: Settings,
    items: [
      { path: '/global-policy', icon: Settings, label: '全局策略配置' },
      { path: '/notifications', icon: Bell, label: '系统消息中心' },
    ]
  }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, token } = useAuthStore()
  const { isOnline, setOnline, isScreenMaximized } = useRiskStore() 
  const location = useLocation()
  const queryClient = useQueryClient()
  
  // V3.50: 手风琴状态管理 (记录当前展开的分组 ID)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [showNotif, setShowNotif] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [selectedMsg, setSelectedMsg] = useState<Notification | null>(null)
  const bellRef = useRef<HTMLButtonElement | null>(null)

  // 初始定位：根据当前路径自动展开对应分组
  useEffect(() => {
    const group = menuGroups.find(g => g.items.some(i => i.path === location.pathname))
    if (group) setActiveGroup(group.id)
  }, [location.pathname])

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications_recent'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/notifications?size=5`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data as Notification[]
    },
    enabled: !!token,
    refetchInterval: 30000 
  })

  // V3.75: 指挥中心状态同步引擎
  const { data: sysStatus } = useSystemStatus()

  const pendingSyncCount = sysStatus?.pendingSyncCount ?? 0
  const unreadCount = notifications.filter(n => n.is_read === 0).length

  // V3.71: 401 自动熔断逻辑 (已降级：仅提示不强制跳转，以支持离线模式)
  useEffect(() => {
    const handleGlobalError = (event: any) => {
      if (event.detail?.status === 401 || event.detail?.status === 403) {
        console.warn('🚨 [鉴权链路异常] 令牌已失效，当前已自动切入受限离线模式');
        setOnline(false); // 强制 UI 进入离线态
        toast.error('链路凭证失效', { description: '中枢连接已转为受限访问，建议重新登录以恢复全功能' });
      }
    };
    window.addEventListener('api-response-error', handleGlobalError);
    return () => window.removeEventListener('api-response-error', handleGlobalError);
  }, [setOnline]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden select-none font-sans text-black">
      <AnimatePresence mode="wait">
        {!isScreenMaximized && (
          <motion.aside 
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={cn(
              "bg-slate-900 flex flex-col border-r shrink-0 relative z-[100] overflow-hidden transition-all duration-1000",
              !isOnline ? "border-slate-800" : "border-slate-800"
            )}
          >
            {/* Logo 区 */}
            <div className="p-6 shrink-0">
              <div className="flex items-center gap-3 mb-8 px-2 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
                <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-white text-xs">
                  {CONFIG.BRANDING.logoText}
                </div>
                <span className="text-xl font-black text-white tracking-tighter italic uppercase">{CONFIG.BRANDING.name}</span>
              </div>
            </div>

            {/* 战术手风琴导航区 */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-2">
              {menuGroups.map((group) => {
                const isOpen = activeGroup === group.id
                const hasActiveChild = group.items.some(i => i.path === location.pathname)
                
                return (
                  <div key={group.id} className="space-y-1">
                    <button 
                      onClick={() => setActiveGroup(isOpen ? null : group.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                        (isOpen || hasActiveChild) ? "bg-white/5 text-cyan-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <group.icon size={18} className={cn("transition-colors", (isOpen || hasActiveChild) ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-400")} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{group.label}</span>
                      </div>
                      <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-4"
                        >
                          <div className="py-1 space-y-1 border-l border-white/5 ml-2 pl-2">
                            {group.items.map((item) => (
                              <Link 
                                key={item.path} 
                                to={item.path} 
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-xs font-bold",
                                  location.pathname === item.path 
                                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20" 
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                              >
                                <item.icon size={14} /> {item.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </nav>

            {/* 用户区 */}
            <div className="mt-auto p-6 border-t border-white/5 space-y-4 shrink-0">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-cyan-400 font-bold uppercase">{user?.username[0]}</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-none">{user?.real_name}</span>
                  <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">{user?.role}</span>
                </div>
              </div>
              <button onClick={logout} className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-400 transition-colors text-xs font-bold cursor-pointer">
                <LogOut size={14} /> 退出战术链路
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className={cn("flex-1 flex flex-col overflow-hidden relative", isScreenMaximized ? "z-[1000]" : "z-[101]")}>
        <AnimatePresence mode="wait">
          {!isScreenMaximized && (
            <motion.header 
              key="header"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 64, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "border-b flex items-center justify-between px-8 shrink-0 cursor-move overflow-hidden transition-all duration-500",
                !isOnline ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
              )}
              style={{ WebkitAppRegion: 'drag' } as any}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none transition-colors flex items-center gap-2",
                  !isOnline ? "bg-red-600 text-white" : "bg-slate-100 text-black"
                )}>
                  {!isOnline && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                  指挥中心 {isOnline ? '控制台' : '脱机模式'}
                </div>
                {pendingSyncCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-cyan-50 border border-cyan-100 rounded-xl shadow-sm animate-pulse">
                    <RefreshCw size={10} className="animate-spin text-cyan-600" />
                    <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-tighter">数据待同步: {pendingSyncCount}</span>
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
                  <button onClick={() => window.electron.ipcRenderer.send('minimize-window')} className="text-slate-400 hover:text-black transition-colors cursor-pointer" title="最小化"><Minus size={18} /></button>
                  <button onClick={() => window.electron.ipcRenderer.send('set-fullscreen', !isFullScreen)} className="text-slate-400 hover:text-black transition-colors cursor-pointer" title="全屏切换">
                    <Square size={14} />
                  </button>
                  <button onClick={() => window.electron.ipcRenderer.send('close-window')} className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title="关闭"><X size={18} /></button>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        <section className={cn("flex-1 overflow-y-auto custom-scrollbar transition-all duration-500 relative", isScreenMaximized ? "p-0 bg-transparent" : "p-6 bg-slate-50/50")}>
          {children}
        </section>

        <AnimatePresence>
          {showNotif && !isScreenMaximized && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-16 right-8 w-80 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden z-[500]">
               <div className="p-4 bg-slate-100/80 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-black text-black uppercase">最近消息通知</span>
                  <Link to="/notifications" onClick={() => setShowNotif(false)} className="text-[10px] text-cyan-600 font-black hover:underline uppercase cursor-pointer">查看全部</Link>
               </div>
               <div className="max-h-[320px] overflow-y-auto custom-scrollbar bg-white">
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => { setSelectedMsg(n); if(n.is_read===0) window.api.callApi({ url: `${CONFIG.API_BASE}/admin/notifications/read`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: { id: n.id } }).then(() => queryClient.invalidateQueries({ queryKey: ['notifications_recent'] })) }} className={cn("p-4 border-b border-slate-50 cursor-pointer group transition-all", n.is_read === 1 ? "opacity-40" : "hover:bg-slate-50")}>
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