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
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  User, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Globe, 
  ShieldCheck, 
  Users,
  ArrowRight
} from 'lucide-react'
import { cn } from './lib/utils'
import { CONFIG } from './lib/config'
import { TacticalSearch } from './components/ui/TacticalSearch'
import { TacticalPagination } from './components/ui/TacticalTable'

// 1. 工业级管理后台首页 (全动态 MySQL 数据驱动 + RBAC 动态视图)
const AdminHome = () => {
  const { user } = useAuthStore() 
  const [agents, setAgents] = useState<any[]>([])
  const [depts, setDepts] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [riskLevel, setRiskLevel] = useState('ALL')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const isHQ = user?.role === 'HQ'

  const fetchDepts = async () => {
    if (!isHQ) return
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments`, method: 'GET' })
      if (res.status === 200) setDepts(res.data.data)
    } catch (e) { console.error('部门同步异常', e) }
  }

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&search=${search}&dept=${dept}&status=${status}&risk_level=${riskLevel}`,
        method: 'GET'
      })
      if (res.status === 200) {
        setAgents(res.data.data)
        setTotal(res.data.total)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDepts() }, [isHQ])
  useEffect(() => { fetchAgents() }, [page, dept, status, riskLevel])

  return (
    <div className="space-y-6 h-full flex flex-col font-sans">
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm shrink-0 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic shrink-0">指挥中心实时矩阵</h2>
          <button onClick={() => window.open('#/big-screen', '_blank')} className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl active:scale-95 flex items-center gap-2 tracking-widest uppercase hover:bg-slate-800 transition-all shrink-0">
            <Globe size={14} /> 激活指挥大屏
          </button>
        </div>
        
        <div className="flex items-center gap-4 border-t pt-4 overflow-x-auto no-scrollbar flex-nowrap">
          <TacticalSearch 
            value={search}
            onChange={setSearch}
            onSearch={fetchAgents}
            placeholder="搜索操作员..."
            className="w-64 shrink-0"
          />
          <div className="h-8 w-[1px] bg-slate-100 shrink-0 mx-1" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase">状态:</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-cyan-500/20 py-1.5 px-3 min-w-[100px]">
              <option value="ALL">全部</option>
              <option value="ONLINE">在线监听</option>
              <option value="OFFLINE">脱机</option>
            </select>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase">风险:</span>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-red-500/20 py-1.5 px-3 min-w-[100px]">
              <option value="ALL">全量</option>
              <option value="SERIOUS">严重 (9-10)</option>
              <option value="MEDIUM">中级 (5-8)</option>
              <option value="LOW">低级 (&lt;5)</option>
            </select>
          </div>

          {isHQ && (
            <div className="flex items-center gap-2 shrink-0 ml-auto bg-slate-50/50 px-3 py-1 rounded-xl border border-slate-100">
              <Filter size={12} className="text-slate-400" />
              <select value={dept} onChange={(e) => setDept(e.target.value)} className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer min-w-[120px]">
                <option value="ALL">全域部门</option>
                {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-8 py-4 text-center">操作员节点</th>
                <th className="px-6 py-4 text-center">所属战术单元</th>
                <th className="px-6 py-4 text-center">通讯状态</th>
                <th className="px-6 py-4 text-center">战术效能</th>
                <th className="px-6 py-4 text-center">风险评估 (等级)</th>
                <th className="px-8 py-4 text-center">战术管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map((agent) => (
                <tr key={agent.username} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm", agent.is_online ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20" : "bg-slate-100 text-slate-400")}>{agent.real_name[0]}</div>
                      <div className="flex flex-col text-left"><span className="text-sm font-black text-slate-900">{agent.real_name}</span><span className="text-[9px] text-slate-400 font-mono">@{agent.username}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center">
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase italic">
                        {agent.dept_name || '未归类节点'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", agent.is_online ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-300")} />
                      <span className={cn("text-[10px] font-black uppercase", agent.is_online ? "text-green-600" : "text-slate-400")}>
                        {agent.is_online ? '在线通讯' : '离线脱机'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-black text-slate-700 italic">
                      <Activity size={12} className="text-cyan-500" /> {agent.tactical_score}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center">
                      {agent.last_violation_type ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-red-500/10 text-red-600 text-[10px] font-black rounded-md border border-red-500/20 flex items-center gap-1 w-fit"><AlertCircle size={10} /> {agent.last_violation_type}</span>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", agent.last_risk_score >= 9 ? "bg-red-600 text-white" : "bg-slate-900 text-white")}>等级.{agent.last_risk_score}</span>
                        </div>
                      ) : <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">安全链路</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center items-center">
                      <button className="p-2 text-slate-400 hover:text-cyan-600 transition-all hover:bg-cyan-50 rounded-xl"><ShieldCheck size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-2">
              <Users size={48} strokeWidth={1} className="opacity-20" />
              <p className="font-black text-xs uppercase tracking-[0.2em]">中枢未发现匹配数据节点</p>
            </div>
          )}
        </div>
        {total > 10 && (
          <TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} />
        )}
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
  const [toast, setToast] = useState<any>(null)

  useEffect(() => {
    const onSuggestion = (e: any) => setActiveSuggestion(e.detail)
    const onFireworks = () => setShowFireworks(true)
    const onSop = (e: any) => setSopSteps(e.detail)
    const onCustomer = (e: any) => setActiveCustomer(e.detail)
    const onToast = (e: any) => { setToast(e.detail); setTimeout(() => setToast(null), 3000) }

    window.addEventListener('trigger-suggestion', onSuggestion); window.addEventListener('trigger-fireworks', onFireworks)
    window.addEventListener('trigger-sop', onSop); window.addEventListener('trigger-customer', onCustomer)
    window.addEventListener('trigger-toast', onToast)
    window.addEventListener('trigger-permission-toast', (e: any) => {
      setToast({
        title: e.detail.title,
        message: e.detail.message,
        details: e.detail.details,
        type: 'info',
        duration: 10000 // 权限变更显示久一点
      })
    })
    window.addEventListener('trigger-violation-alert', (e: any) => {
      setToast({
        title: '战术拦截：高危预警',
        message: `坐席 ${e.detail.agent} 命中关键词 [${e.detail.keyword}]，请立即介入！`,
        type: 'error',
        action: () => { window.location.hash = `/alerts?id=${e.detail.id}` }
      })
      setTimeout(() => setToast(null), 8000)
    })

    return () => {
      window.removeEventListener('trigger-suggestion', onSuggestion); window.removeEventListener('trigger-fireworks', onFireworks)
      window.removeEventListener('trigger-sop', onSop); window.removeEventListener('trigger-customer', onCustomer)
      window.removeEventListener('trigger-toast', onToast)
    }
  }, [])

  return (
    <div className={cn("bg-transparent relative h-screen w-screen overflow-hidden transition-all duration-500 grain", isRedAlert && "bg-red-600/20 shadow-[inset_0_0_100px_rgba(220,38,38,0.5)] border-4 border-red-600")}>
      <TacticalIsland />
      <AnimatePresence>
        {activeSuggestion && <SuggestionPopup products={activeSuggestion} onDismiss={() => setActiveSuggestion(null)} />}
        {showFireworks && <Fireworks onComplete={() => setShowFireworks(false)} />}
        {sopSteps && <SOPOverlay steps={sopSteps} onDismiss={() => setSopSteps(null)} />}
        {activeCustomer && <CustomerHUD data={activeCustomer} onDismiss={() => setActiveCustomer(null)} />}
        {toast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-[300]">
            <div 
              onClick={() => toast.action?.()}
              className={cn(
                "px-6 py-4 rounded-[24px] shadow-2xl border flex items-center gap-4 backdrop-blur-md cursor-pointer group transition-all hover:scale-105", 
                toast.type === 'error' ? "bg-red-600/90 border-red-400 text-white" : "bg-slate-900/90 border-cyan-500/50 text-cyan-400"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                {toast.type === 'error' ? <ShieldAlert size={20} className="animate-pulse" /> : <CheckCircle2 size={20} />}
              </div>
              <div className="flex flex-col pr-4 border-r border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{toast.title}</span>
                <span className="text-sm font-bold leading-tight">{toast.message}</span>
                {toast.details && (
                  <p className="text-[9px] text-white/60 mt-1 font-medium italic">{toast.details}</p>
                )}
              </div>
              {toast.action && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase italic whitespace-nowrap text-white/80 group-hover:text-white">
                  立即取证 <ArrowRight size={12} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  const { user } = useAuthStore()
  useRiskSocket()

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/big-screen" element={<BigScreen />} />
        <Route path="/*" element={ !user ? <Navigate to="/login" /> : ( user.role === 'AGENT' ? <AgentView /> : (
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
              <Route path="/users" element={<UsersPage />} />
              <Route path="/rbac" element={<RbacPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
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
