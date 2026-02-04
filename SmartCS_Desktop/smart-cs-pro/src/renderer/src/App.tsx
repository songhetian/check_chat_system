import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/useAuthStore'
import { TacticalIsland } from './components/agent/TacticalIsland'
import { SuggestionPopup } from './components/agent/SuggestionPopup'
import { Fireworks } from './components/agent/Fireworks'
import { SOPOverlay } from './components/agent/SOPOverlay'
import { CustomerHUD } from './components/agent/CustomerHUD'
import { useRiskSocket } from './hooks/useRiskSocket'
import { useRiskStore } from './store/useRiskStore'
import Login from './pages/Login'
import DashboardLayout from './layouts/DashboardLayout'
import ViolationsPage from './pages/admin/Violations'
import TacticalCommand from './pages/admin/TacticalCommand'
import ProductsPage from './pages/admin/Products'
import ToolsPage from './pages/admin/Tools'
import CustomersPage from './pages/admin/Customers'
import DepartmentsPage from './pages/admin/Departments'
import UsersPage from './pages/admin/Users'
import RbacPage from './pages/admin/Rbac'
import CategoriesPage from './pages/admin/Categories'
import AuditStreamPage from './pages/admin/AuditStream'
import PlatformsPage from './pages/admin/Platforms'
import BigScreen from './pages/admin/BigScreen'
import NotificationsPage from './pages/admin/Notifications'
import GlobalPolicyPage from './pages/hq/GlobalPolicy'
import AiPerformancePage from './pages/hq/AiPerformance'
import { 
  CheckCircle2, AlertCircle, ShieldAlert, User, Search, Filter, Activity, 
  Globe, ShieldCheck, Users, ArrowRight, Award, GraduationCap, Volume2, VolumeX, RefreshCw
} from 'lucide-react'
import { cn } from './lib/utils'
import { CONFIG } from './lib/config'
import { TacticalSearch } from './components/ui/TacticalSearch'
import { TacticalPagination } from './components/ui/TacticalTable'
import { TacticalSelect } from './components/ui/TacticalSelect'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'

// 1. 管理首页：集成链路异常感知 UI
const AdminHome = () => {
  const { user, token } = useAuthStore() 
  const [agents, setAgents] = useState<any[]>([])
  const [depts, setDepts] = useState<any[]>([])
  const [deptId, setDeptId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isHQ = user?.role_code === 'HQ'

  const fetchDepts = async () => {
    if (!isHQ || !token) return
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/departments?size=100`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) setDepts(res.data.data)
    } catch (e) { console.error(e) }
  }

  const fetchAgents = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    setErrorMsg(null)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&size=10&search=${search}&dept_id=${deptId}&_t=${Date.now()}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setAgents(res.data.data)
        setTotal(res.data.total)
      } else if (res.status === 401) {
        setErrorMsg("身份认证失效，请重新登录")
      } else {
        setErrorMsg(res.error || "中枢系统响应异常")
      }
    } catch (e) {
      setErrorMsg(`物理链路握手失败，请确认后端引擎 (${CONFIG.API_BASE}) 是否处于活跃状态`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDepts() }, [token])
  useEffect(() => { 
    fetchAgents()
    const timer = setInterval(() => fetchAgents(true), 5000)
    return () => clearInterval(timer)
  }, [page, search, deptId, token])

  return (
    <div className="space-y-6 h-full flex flex-col font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow leading-none">全域态势矩阵</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">实时监听操作员实战状态，包括战术评分、违规拦截及新兵结业进度</p>
        </div>
        <div className="flex items-center gap-4">
           {isHQ && (
             <div className="w-64">
               <TacticalSelect 
                 options={[{id: '', name: '全域战术单元'}, ...depts]}
                 value={deptId}
                 onChange={(val: string | number) => { setDeptId(String(val)); setPage(1); }}
                 placeholder="全域战术单元"
               />
             </div>
           )}
           <button 
             onClick={() => fetchAgents()} 
             className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all shadow-sm border border-slate-200 active:scale-95 flex items-center justify-center gap-2 group"
             title="物理同步态势"
           >
             <RefreshCw size={20} className={cn(loading && "animate-spin", "group-hover:rotate-180 transition-transform duration-500")} />
           </button>
           <button onClick={() => window.open('#/big-screen', '_blank')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-2xl active:scale-95 flex items-center gap-3 hover:bg-slate-800 transition-all uppercase tracking-widest"><Globe size={18} /> 激活态势投影</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0 relative">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {errorMsg ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
               <div className="w-24 h-24 rounded-[40px] bg-red-50 text-red-500 flex items-center justify-center mb-6 border border-red-100 shadow-inner">
                  <ShieldAlert size={48} className="animate-pulse" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2 italic uppercase">战术链路中断</h3>
               <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed mb-8 italic">"{errorMsg}"</p>
               <button onClick={() => fetchAgents()} className="px-10 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-3 italic tracking-widest uppercase">
                  <RefreshCw size={16} /> 重新建立连接
               </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <th className="px-8 py-5 text-center">节点名称</th>
                  <th className="px-6 py-5 text-center">战术单元</th>
                  <th className="px-6 py-5 text-center">奖励/荣誉</th>
                  <th className="px-6 py-5 text-center">实战结业</th>
                  <th className="px-6 py-5 text-center">评分/风险</th>
                  <th className="px-8 py-5 text-center">战术指挥</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agents.map((agent) => (
                  <tr key={agent.username} className="group hover:bg-slate-50/50 transition-colors text-sm font-bold text-slate-600">
                    <td className="px-8 py-5"><div className="flex items-center justify-center gap-3"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black", agent.is_online ? "bg-cyan-500 text-white shadow-lg" : "bg-slate-100 text-slate-400")}>{agent.real_name[0]}</div><div className="flex flex-col text-left"><span className="text-sm font-black text-slate-900">{agent.real_name}</span><span className="text-[9px] text-slate-400 font-mono italic">@{agent.username}</span></div></div></td>
                    <td className="px-6 py-5 text-center"><span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{agent.dept_name || '未分派'}</span></td>
                    <td className="px-6 py-5 text-center"><div className="flex justify-center gap-1">{agent.reward_count > 0 ? <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 flex items-center gap-1"><Award size={12}/> <span className="text-[10px] font-black">{agent.reward_count}</span></div> : <span className="opacity-20">-</span>}</div></td>
                    <td className="px-6 py-5 text-center"><div className="flex flex-col items-center gap-1"><div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${agent.training_progress || 0}%` }} /></div><span className="text-[8px] font-black text-slate-400">{agent.training_progress || 0}%</span></div></td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                         <div className="flex items-center gap-1 text-slate-900 italic font-black"><Activity size={14} className="text-cyan-500" /> {agent.tactical_score}</div>
                         {agent.last_violation_type && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[8px] font-black rounded-md border border-red-100 uppercase tracking-tighter">拦截: {agent.last_violation_type}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center"><button className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-cyan-500 hover:text-white transition-all shadow-lg active:scale-90"><ShieldCheck size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {agents.length === 0 && !loading && !errorMsg && <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black tracking-widest italic opacity-30"><Users size={64} strokeWidth={1} /><p>中枢未发现活跃实战节点</p></div>}
        </div>
        {total > 10 && !errorMsg && <div className="shrink-0 border-t border-slate-100 p-2"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>
    </div>
  )
}

// 2. 坐席视图容器
const AgentView = () => {
  const isRedAlert = useRiskStore(s => s.isRedAlert)
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null)
  const [showFireworks, setShowFireworks] = useState(false)
  const [sopSteps, setSopSteps] = useState<string[] | null>(null)
  const [activeCustomer, setActiveCustomer] = useState<any>(null)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // 监听全局 Toast 事件 (兼容旧逻辑，转发给 sonner)
    const onToast = (e: any) => { 
      const { title, message, type, details, action } = e.detail
      if (type === 'error') {
        toast.error(title, { description: message || details, action: action ? { label: '立即取证', onClick: action } : undefined })
      } else if (type === 'success') {
        toast.success(title, { description: message || details })
      } else {
        toast(title, { description: message || details })
      }
    }
    
    const onViolation = (e: any) => {
      if (!isMuted) {
        const audioPath = e.detail.audio_path || (e.detail.risk_score >= 8 ? '/assets/audio/red_alert.mp3' : '/assets/audio/warn.wav')
        const audio = new Audio(audioPath); audio.play().catch(() => console.warn('音频拦截: 物理路径脱机'))
      }
      // 使用 sonner 显示拦截警告
      toast.error('战术拦截', {
        description: `检测到违规行为：[${e.detail.keyword}]`,
        duration: 10000,
        action: {
          label: '查看详情',
          onClick: () => { window.location.hash = `/alerts?id=${e.detail.id}` }
        }
      })
    }

    window.addEventListener('trigger-toast', onToast)
    window.addEventListener('trigger-violation-alert', onViolation)
    window.addEventListener('trigger-permission-toast', (e: any) => { 
      toast.info(e.detail.title, { description: e.detail.message })
    })
    
    return () => {
      window.removeEventListener('trigger-toast', onToast); 
      window.removeEventListener('trigger-violation-alert', onViolation)
    }
  }, [isMuted])

  return (
    <div className={cn("bg-transparent relative h-screen w-screen overflow-hidden transition-all duration-500 grain", isRedAlert && "bg-red-600/20 shadow-[inset_0_0_100px_rgba(220,38,38,0.5)] border-4 border-red-600")}>
      <button onClick={() => setIsMuted(!isMuted)} className="fixed top-24 right-10 z-[400] w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-white/10 shadow-2xl">
        {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-cyan-400" />}
      </button>
      <TacticalIsland />
    </div>
  )
}

function App() {
  const { user } = useAuthStore()
  useRiskSocket()
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/big-screen" element={<BigScreen />} />
        <Route path="/*" element={ !user ? <Navigate to="/login" /> : ( user.role_code === 'AGENT' ? <AgentView /> : (
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<AdminHome />} />
              <Route path="/command" element={<TacticalCommand />} />
              <Route path="/alerts" element={<ViolationsPage />} />
              <Route path="/platforms" element={<PlatformsPage />} />
              <Route path="/audit" element={<AuditStreamPage />} />
              <Route path="/hq/ai-performance" element={<AiPerformancePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/rbac" element={<RbacPage />} />
              <Route path="/global-policy" element={<GlobalPolicyPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Routes>
          </DashboardLayout>
        ))} />
      </Routes>
    </Router>
  )
}


export default App
