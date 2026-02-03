import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
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
import ProductsPage from './pages/admin/Products'
import ToolsPage from './pages/admin/Tools'
import CustomersPage from './pages/admin/Customers'
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
  Users 
} from 'lucide-react'
import { cn } from './lib/utils'
import { CONFIG } from './lib/config'
import { TacticalSearch } from './components/ui/TacticalSearch'

// 1. 工业级管理后台首页
const AdminHome = () => {
  const [agents, setAgents] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('ALL')
  const [loading, setLoading] = useState(false)

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&search=${search}&dept=${dept}`,
        method: 'GET'
      })
      if (res.status === 200) setAgents(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAgents() }, [page, dept])

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* 战术工具栏 */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 flex-1">
          <TacticalSearch 
            value={search}
            onChange={setSearch}
            onSearch={fetchAgents}
            placeholder="搜索操作员姓名或编号..."
            className="w-80"
          />
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select 
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-600 focus:ring-0 cursor-pointer"
            >
              <option value="ALL">全域部门</option>
              <option value="销售一部">销售一部</option>
              <option value="技术中心">技术中心</option>
            </select>
          </div>
        </div>
        <button onClick={() => window.open('#/big-screen', '_blank')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 flex items-center gap-2 tracking-widest uppercase">
          <Globe size={14} /> 激活实时大屏
        </button>
      </div>

      {/* 高密度监控列表 */}
      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-8 py-4">操作员节点</th>
                <th className="px-6 py-4">所属部门</th>
                <th className="px-6 py-4">当前状态</th>
                <th className="px-6 py-4">战术评分</th>
                <th className="px-6 py-4">异常记录</th>
                <th className="px-8 py-4 text-right">链路操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((agent) => (
                <tr key={agent.username} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                        agent.is_online ? "bg-cyan-500/10 text-cyan-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {agent.real_name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{agent.real_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {agent.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{agent.dept_name || '未归类'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", agent.is_online ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                      <span className={cn("text-xs font-bold", agent.is_online ? "text-green-600" : "text-slate-400")}>
                        {agent.is_online ? '在线监听中' : '脱机'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 text-sm font-black text-slate-700 italic">
                      <Activity size={14} className="text-cyan-500" /> {agent.tactical_score}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {agent.has_violation ? (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded flex items-center gap-1 w-fit">
                        <AlertCircle size={10} /> 发现高危行为
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">无异常</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors hover:bg-cyan-50 rounded-lg">
                      <ShieldCheck size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-2">
              <Users size={48} strokeWidth={1} />
              <p className="text-sm font-medium">未发现匹配的操作员节点</p>
            </div>
          )}
        </div>

        {/* 分页控制器 */}
        <div className="p-6 bg-slate-50/50 border-t flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-slate-400">显示第 1-10 条，共 100 条记录</span>
          <div className="flex gap-2">
            <button className="p-2 bg-white border rounded-xl hover:bg-slate-50 disabled:opacity-30" disabled><ChevronLeft size={16} /></button>
            <button className="p-2 bg-white border rounded-xl hover:bg-slate-50 shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. 坐席悬浮窗模式容器
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
            <div className={cn("px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md", toast.type === 'error' ? "bg-red-600/90 border-red-400 text-white" : "bg-slate-900/90 border-cyan-500/50 text-cyan-400")}>
              {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest opacity-50">{toast.title}</span><span className="text-sm font-bold">{toast.message}</span></div>
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
        
        {/* 核心路由逻辑：根据角色进入完全不同的视图 */}
        <Route path="/*" element={
          !user ? <Navigate to="/login" /> : (
            user.role === 'AGENT' ? <AgentView /> : (
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<AdminHome />} />
                  <Route path="/alerts" element={<ViolationsPage />} />
                  <Route path="/platforms" element={<PlatformsPage />} />
                  <Route path="/audit" element={<AuditStreamPage />} />
                  <Route path="/hq/ai-performance" element={<AiPerformancePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/tools" element={<ToolsPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/global-policy" element={<GlobalPolicyPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                </Routes>
              </DashboardLayout>
            )
          )
        } />
      </Routes>
    </Router>
  )
}

export default App