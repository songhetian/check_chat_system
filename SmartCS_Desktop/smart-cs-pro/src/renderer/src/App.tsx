import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
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
import { TacticalPagination } from './components/ui/TacticalTable'

// 1. 工业级管理后台首页 (修正：真实 MySQL 数据驱动 + 全维度搜索)
const AdminHome = () => {
  const [agents, setAgents] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [riskLevel, setRiskLevel] = useState('ALL')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

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

  useEffect(() => { fetchAgents() }, [page, dept, status, riskLevel])

  return (
    <div className="space-y-6 h-full flex flex-col font-sans">
      {/* 战术工具栏 - 多维筛选 */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">实时指挥矩阵 <span className="text-cyan-500">MATRIX</span></h2>
          <button onClick={() => window.open('#/big-screen', '_blank')} className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl active:scale-95 flex items-center gap-2 tracking-widest uppercase hover:bg-slate-800 transition-all">
            <Globe size={14} /> 激活指挥大屏
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 border-t pt-4">
          <TacticalSearch 
            value={search}
            onChange={setSearch}
            onSearch={fetchAgents}
            placeholder="搜索操作员..."
            className="w-64"
          />
          
          <div className="h-8 w-[1px] bg-slate-100 mx-2" />

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">链路状态:</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-cyan-500/20 py-1.5 px-3">
              <option value="ALL">全部</option>
              <option value="ONLINE">在线监听</option>
              <option value="OFFLINE">脱机状态</option>
            </select>
          </div>

          {/* 风险等级筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">风险等级:</span>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-red-500/20 py-1.5 px-3">
              <option value="ALL">全量</option>
              <option value="LOW">低级风险 (85+)</option>
              <option value="MEDIUM">中级风险 (60-85)</option>
              <option value="SERIOUS">严重异常 (&lt;60)</option>
            </select>
          </div>

          {/* 部门筛选 */}
          <div className="flex items-center gap-2 ml-auto">
            <Filter size={12} className="text-slate-400" />
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer">
              <option value="ALL">全域部门</option>
              <option value="销售一部">销售一部</option>
              <option value="技术中心">技术中心</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-8 py-4">操作员节点</th>
                <th className="px-6 py-4">所属部门</th>
                <th className="px-6 py-4">当前状态</th>
                <th className="px-6 py-4">战术分</th>
                <th className="px-6 py-4">最近异常类型</th>
                <th className="px-8 py-4 text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((agent) => (
                <tr key={agent.username} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                        agent.is_online ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20" : "bg-slate-100 text-slate-400"
                      )}>
                        {agent.real_name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{agent.real_name}</span>
                        <span className="text-[9px] text-slate-400 font-mono tracking-tighter">@{agent.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{agent.dept_name || '未配置'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", agent.is_online ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-300")} />
                      <span className={cn("text-[10px] font-black uppercase", agent.is_online ? "text-green-600" : "text-slate-400")}>
                        {agent.is_online ? 'CONNECTED' : 'OFFLINE'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-black italic",
                      agent.tactical_score < 60 ? "text-red-500" : agent.tactical_score < 85 ? "text-amber-500" : "text-cyan-600"
                    )}>
                      <Activity size={12} /> {agent.tactical_score}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {agent.last_violation_type ? (
                      <span className="px-2 py-1 bg-red-500/10 text-red-600 text-[10px] font-black rounded-md border border-red-500/20 flex items-center gap-1 w-fit">
                        <AlertCircle size={10} /> {agent.last_violation_type}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300 font-bold uppercase">No records</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-cyan-600 transition-all hover:bg-cyan-50 rounded-xl">
                      <ShieldCheck size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-2">
              <Users size={48} strokeWidth={1} className="opacity-20" />
              <p className="font-black text-sm uppercase tracking-[0.2em]">没有发现匹配的战术节点</p>
            </div>
          )}
        </div>

        <TacticalPagination 
          total={total} 
          pageSize={10} 
          currentPage={page} 
          onPageChange={setPage} 
        />
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
