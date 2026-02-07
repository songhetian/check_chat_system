import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import PersonalScreen from './pages/agent/PersonalScreen'
import NotificationsPage from './pages/admin/Notifications'
import GlobalPolicyPage from './pages/hq/GlobalPolicy'
import AiPerformancePage from './pages/hq/AiPerformance'
import { 
  CheckCircle2, AlertCircle, ShieldAlert, User, Search, Filter, Activity, 
  Globe, ShieldCheck, Users, ArrowRight, Award, GraduationCap, Volume2, VolumeX, RefreshCw,
  Loader2, Lock as LockIcon, Unlock as UnlockIcon
} from 'lucide-react'
import { cn } from './lib/utils'
import { CONFIG } from './lib/config'
import { ROLE_ID } from './lib/constants'
import { TacticalSearch } from './components/ui/TacticalSearch'
import { TacticalPagination, TacticalTable } from './components/ui/TacticalTable'
import { TacticalSelect } from './components/ui/TacticalSelect'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'

// 1. 系统首页：V3.9 专业版
const AdminHome = () => {
  const { user, token } = useAuthStore() 
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deptId, setDeptId] = useState<string>('')

  const isHQ = user?.role_id === ROLE_ID.HQ || user?.role_code === 'HQ'

  const deptsQuery = useQuery({
    queryKey: ['departments_all'],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/departments?size=100`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data.data
    },
    enabled: !!token && isHQ
  })

  const agentsQuery = useQuery({
    queryKey: ['agents_overview', page, search, deptId],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&size=10&search=${search}&dept_id=${deptId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data
    },
    enabled: !!token,
    refetchInterval: 10000
  })

  const depts = deptsQuery.data || []
  const agents = agentsQuery.data?.data || []
  const total = agentsQuery.data?.total || 0
  const isFetching = agentsQuery.isFetching
  const errorMsg = agentsQuery.isError ? "服务器连接异常，请检查后端运行状态" : null

  return (
    <div className="space-y-6 h-full flex flex-col font-sans bg-slate-50/50 p-4 lg:p-6 text-black">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-black uppercase italic leading-none">系统运行概览</h2>
          <p className="text-slate-500 text-sm mt-2 font-bold flex items-center gap-2">
            实时查看成员在线状态、业务评分及工作进度
            {isFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 数据同步中</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
           {isHQ && (
             <div className="w-64">
               <TacticalSelect 
                 options={[{id: '', name: '所有部门'}, ...depts]}
                 value={deptId}
                 onChange={(val: string | number) => { setDeptId(String(val)); setPage(1); }}
                 placeholder="按部门筛选"
               />
             </div>
           )}
           <button onClick={() => agentsQuery.refetch()} className="p-2.5 bg-slate-50 text-black rounded-xl hover:bg-slate-100 transition-all shadow-sm border border-slate-200 group">
             <RefreshCw size={18} className={cn(isFetching && "animate-spin")} />
           </button>
           <button onClick={() => window.open('#/big-screen', '_blank')} className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-black shadow-lg active:scale-95 flex items-center gap-3 hover:bg-slate-800 transition-all uppercase tracking-widest"><Globe size={18} /> 可视化看板</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0 relative">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {errorMsg ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
               <div className="w-20 h-20 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-6 border border-red-100 shadow-inner">
                  <ShieldAlert size={40} className="animate-pulse" />
               </div>
               <h3 className="text-xl font-black text-black mb-2 italic uppercase">服务连接异常</h3>
               <button onClick={() => agentsQuery.refetch()} className="px-8 py-3 bg-slate-100 text-black rounded-xl text-xs font-black shadow-sm border border-slate-200 hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-3 uppercase">
                  <RefreshCw size={16} /> 尝试重新连接
               </button>
            </div>
          ) : (
            <TacticalTable headers={['成员姓名', '所属部门', '获得奖项', '工作进度', '综合评分', '管理操作']}>
              {agents.map((agent: any) => (
                <tr key={agent.username} className="group hover:bg-slate-50/50 transition-colors text-sm font-bold text-black text-center">
                  <td className="px-8 py-3 text-left"><div className="flex items-center justify-center gap-3"><div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs", agent.is_online ? "bg-cyan-600 text-white shadow-md" : "bg-slate-100 text-slate-400")}>{agent.real_name[0]}</div><div className="flex flex-col text-left"><span className="text-xs font-black text-black">{agent.real_name}</span><span className="text-[9px] text-slate-500 font-mono">@{agent.username}</span></div></div></td>
                  <td className="px-6 py-3 text-center font-bold text-black text-[10px] uppercase">{agent.dept_name || '未归类'}</td>
                  <td className="px-6 py-3 text-center"><div className="flex justify-center gap-1">{agent.reward_count > 0 ? <div className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 flex items-center gap-1"><Award size={10}/> <span className="text-[10px] font-black">{agent.reward_count}</span></div> : <span className="opacity-20 text-slate-300">-</span>}</div></td>
                  <td className="px-6 py-3 text-center"><div className="flex flex-col items-center gap-1"><div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${agent.training_progress || 0}%` }} /></div><span className="text-[8px] font-black text-slate-500">{agent.training_progress || 0}%</span></div></td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                       <div className="flex items-center gap-1 text-black italic font-black text-[11px]"><Activity size={12} className="text-cyan-600" /> {agent.tactical_score}</div>
                       {agent.last_violation_type && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[8px] font-black rounded-xl border border-red-100 uppercase tracking-tighter">违规: {agent.last_violation_type}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-3 text-center"><button className="p-2 bg-black text-white rounded-xl hover:bg-cyan-600 transition-all shadow-md active:scale-90"><ShieldCheck size={14} /></button></td>
                </tr>
              ))}
            </TacticalTable>
          )}
          {agents.length === 0 && !agentsQuery.isLoading && !errorMsg && <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black tracking-widest italic opacity-30"><Users size={64} strokeWidth={1} /><p>暂无活跃成员</p></div>}
        </div>
        {total > 10 && !errorMsg && <div className="shrink-0 border-t border-slate-100 p-2"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>
    </div>
  )
}

// 2. 坐席视图容器
const AgentView = () => {
  const isRedAlert = useRiskStore(s => s.isRedAlert)
  const isMuted = useRiskStore(s => s.isMuted)
  const isLocked = useRiskStore(s => s.isLocked)

  useEffect(() => {
    const onToast = (e: any) => { 
      const { title, message, type, details, action } = e.detail
      if (type === 'error') {
        toast.error(title, { description: message || details, action: action ? { label: '查看', onClick: action } : undefined })
      } else if (type === 'success') {
        toast.success(title, { description: message || details })
      } else {
        toast(title, { description: message || details })
      }
    }
    
    const onViolation = (e: any) => {
      if (!isMuted) {
        const audioPath = e.detail.audio_path || (e.detail.risk_score >= 8 ? '/assets/audio/red_alert.mp3' : '/assets/audio/warn.wav')
        const audio = new Audio(audioPath); audio.play().catch(() => console.warn('音频播放失败'))
      }
      toast.error('违规提示', {
        description: `检测到关键词：[${e.detail.keyword}]`,
        duration: 10000,
        action: {
          label: '查看',
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
      <TacticalIsland />
      
      {/* V3.22: 物理锁定遮罩 - 阻止一切交互，且覆盖悬浮框 */}
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-red-600/40 backdrop-blur-md flex flex-col items-center justify-center cursor-not-allowed select-none"
            onContextMenu={(e) => e.preventDefault()}
          >
             <motion.div 
               initial={{ scale: 0.9 }}
               animate={{ scale: 1 }}
               className="flex flex-col items-center text-center p-12 bg-black/20 rounded-[40px] border border-white/10"
             >
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-8 animate-pulse">
                   <LockIcon size={48} className="text-red-600" strokeWidth={3} />
                </div>
                <h3 className="text-5xl font-black text-white uppercase italic tracking-[0.2em] mb-4 drop-shadow-2xl">已开启锁定模式</h3>
                <p className="text-red-10 text-base font-black opacity-90 uppercase tracking-[0.4em] animate-bounce">
                  Tactical Lock Protocol Active
                </p>
             </motion.div>
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
      <Toaster position="bottom-right" expand={true} richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/big-screen" element={<BigScreen />} />
        <Route path="/personal-screen" element={ !user ? <Navigate to="/login" /> : <PersonalScreen />} />
        <Route path="/*" element={ !user ? <Navigate to="/login" /> : ( (user.role_id === ROLE_ID.AGENT || user.role_code === 'AGENT') ? <AgentView /> : (
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