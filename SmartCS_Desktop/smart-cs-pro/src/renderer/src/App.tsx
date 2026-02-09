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
import { ProductListPanel } from './components/agent/ProductListPanel'
import { KnowledgePanel } from './components/agent/KnowledgePanel'
import { useRiskSocket } from './hooks/useRiskSocket'
import { useSystemStatus } from './hooks/useSystemStatus'
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
import SentimentsPage from './pages/admin/Sentiments'
import DeptWordsPage from './pages/admin/DeptWords'
import ComplianceAuditPage from './pages/admin/ComplianceAudit'
import VoiceAlertsPage from './pages/admin/VoiceAlerts'
import BusinessSopsPage from './pages/admin/BusinessSops'
import BlacklistPage from './pages/admin/Blacklist'
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
    refetchInterval: 10000,
    staleTime: 5000
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
            <TacticalTable headers={['成员身份标识', '所属业务部门', '荣誉勋章', '实战培训进度', '综合战术评分', '上次活跃', '链路管理']}>
              {agents.map((agent: any) => (
                <tr key={agent.username} className="group hover:bg-slate-50/50 transition-colors text-sm font-bold text-black text-center">
                  <td className="px-10 py-4 text-left"><div className="flex items-center justify-start gap-4"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm", agent.is_online ? "bg-cyan-600 text-white shadow-cyan-200" : "bg-slate-100 text-slate-400")}>{agent.real_name[0]}</div><div className="flex flex-col text-left"><span className="text-sm font-black text-black leading-none">{agent.real_name}</span><span className="text-[10px] text-slate-500 font-mono mt-1">@{agent.username}</span></div></div></td>
                  <td className="px-6 py-4 text-center font-bold text-black text-[11px] uppercase whitespace-nowrap">{agent.dept_name || '未归类'}</td>
                  <td className="px-6 py-4 text-center"><div className="flex justify-center gap-1">{agent.reward_count > 0 ? <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 flex items-center gap-1.5"><Award size={12}/> <span className="text-[11px] font-black">{agent.reward_count}</span></div> : <span className="opacity-20 text-slate-300">-</span>}</div></td>
                  <td className="px-6 py-4 text-center"><div className="flex flex-col items-center gap-2"><div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" style={{ width: `${agent.training_progress || 0}%` }} /></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{agent.training_progress || 0}%</span></div></td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                       <div className="flex items-center gap-2 text-black italic font-black text-base"><Activity size={16} className="text-cyan-600" /> {agent.tactical_score}</div>
                       {agent.last_violation_type && <span className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-xl border border-red-100 uppercase tracking-tighter shadow-sm">高危违规: {agent.last_violation_type}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(() => {
                      const timestamp = agent.last_activity;
                      if (!timestamp) return <span className="opacity-20 font-black italic text-[10px]">从未活动</span>;
                      const diff = Math.floor(Date.now() / 1000) - timestamp;
                      if (diff < 60) return <span className="text-emerald-600 font-black animate-pulse text-[10px] uppercase">刚才</span>;
                      if (diff < 3600) return <span className="text-cyan-600 font-black text-[10px]">{Math.floor(diff / 60)} 分钟前</span>;
                      return <span className="text-slate-400 font-bold text-[10px]">{Math.floor(diff / 3600)} 小时前</span>;
                    })()}
                  </td>
                  <td className="px-10 py-4 text-center"><button className="p-3 bg-black text-white rounded-xl hover:bg-cyan-600 transition-all shadow-lg active:scale-90 flex items-center justify-center mx-auto"><ShieldCheck size={18} /></button></td>
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
  const { 
    isRedAlert, isMuted, isLocked, lockMessage,
    isCustomerHudEnabled, setCustomerHudEnabled, currentCustomer, 
    activeSideTool, setActiveSideTool, layoutMode, setLayoutMode,
    setOnline
  } = useRiskStore()

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
        // V3.72: 增强实战感知
        try {
          window.speechSynthesis.cancel();
          const text = `警告：检测到违规项，关键词为：${e.detail.keyword}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'zh-CN';
          utterance.rate = 1.1;
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('TTS 播报失败', err);
        }
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

    const handleGlobalError = (event: any) => {
      if (event.detail?.status === 401 || event.detail?.status === 403) {
        console.warn('🚨 [鉴权链路异常] 令牌已失效，正在为您物理重置');
        setOnline(false);
        // V5.48: 物理强制重置 - 清理失效令牌并强制跳转至登录页
        useAuthStore.getState().logout();
        toast.error('链路凭证已彻底失效', { 
          description: '系统已自动清理陈旧凭证，请重新登录同步最新战术授权',
          duration: 5000
        });
        setTimeout(() => { window.location.hash = '/login'; }, 1000);
      }
    };

    window.addEventListener('trigger-toast', onToast)
    window.addEventListener('trigger-violation-alert', onViolation)
    window.addEventListener('api-response-error', handleGlobalError);
    window.addEventListener('trigger-permission-toast', (e: any) => { 
      toast.info(e.detail.title, { description: e.detail.message })
    })
    
    return () => {
      window.removeEventListener('trigger-toast', onToast); 
      window.removeEventListener('trigger-violation-alert', onViolation)
      window.removeEventListener('api-response-error', handleGlobalError);
    }
  }, [isMuted, setOnline])

  return (
    <div className={cn("bg-transparent relative h-screen w-screen overflow-hidden transition-all duration-500 grain", isRedAlert && "bg-red-600/20 shadow-[inset_0_0_100px_rgba(220,38,38,0.5)] border-4 border-red-600")}>
      <TacticalIsland />

      {/* 侧边栏组件 - 实时画像 */}
      <AnimatePresence>
        {layoutMode === 'SIDE' && activeSideTool === 'CUSTOMERS' && currentCustomer && (
          <CustomerHUD data={currentCustomer} onDismiss={() => setLayoutMode('FLOAT')} />
        )}
      </AnimatePresence>

      {/* 侧边栏组件 - 资料 */}
      <AnimatePresence>
        {layoutMode === 'SIDE' && activeSideTool === 'PRODUCTS' && (
          <ProductListPanel onDismiss={() => setLayoutMode('FLOAT')} />
        )}
      </AnimatePresence>

      {/* 侧边栏组件 - 手册 */}
      <AnimatePresence>
        {layoutMode === 'SIDE' && activeSideTool === 'KNOWLEDGE' && (
          <KnowledgePanel onDismiss={() => setLayoutMode('FLOAT')} />
        )}
      </AnimatePresence>
      
      {/* V3.22: 物理锁定遮罩 - 阻止一切交互 */}
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
                <h3 className="text-5xl font-black text-white uppercase italic tracking-[0.2em] mb-4 drop-shadow-2xl">
                  {lockMessage || '已开启锁定模式'}
                </h3>
                <p className="text-red-10 text-base font-black opacity-90 uppercase tracking-[0.4em] animate-bounce">
                  {lockMessage ? 'Administrative Intervention Active' : 'Tactical Lock Protocol Active'}
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
  useSystemStatus()
  useRiskSocket()
  
  const isAgent = user?.role_code === 'AGENT' || user?.role_id === ROLE_ID.AGENT;

  return (
    <Router>
      <Toaster 
        position={isAgent ? "top-center" : "bottom-right"} 
        expand={true} 
        richColors 
        theme="dark"
        toastOptions={{
          style: isAgent ? { marginTop: '12px' } : {}
        }}
      />
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
              <Route path="/sentiments" element={<SentimentsPage />} />
              <Route path="/dept-words" element={<DeptWordsPage />} />
              <Route path="/voice-alerts" element={<VoiceAlertsPage />} />
              <Route path="/business-sops" element={<BusinessSopsPage />} />
              <Route path="/compliance-audit" element={<ComplianceAuditPage />} />
              <Route path="/blacklist" element={<BlacklistPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Routes>
          </DashboardLayout>
        ))} />
      </Routes>
    </Router>
  )
}

export default App