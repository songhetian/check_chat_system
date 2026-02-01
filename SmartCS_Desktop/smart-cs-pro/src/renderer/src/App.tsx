import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import GlobalPolicyPage from './pages/hq/GlobalPolicy'
import { CheckCircle2 } from 'lucide-react'
import { cn } from './lib/utils'

function App() {
  const { user } = useAuthStore()
  const setRedAlert = useRiskStore(s => s.setRedAlert)
  const isRedAlert = useRiskStore(s => s.isRedAlert)
  
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null)
  const [showFireworks, setShowFireworks] = useState(false)
  const [sopSteps, setSopSteps] = useState<string[] | null>(null)
  const [activeCustomer, setActiveCustomer] = useState<any>(null)

  // 启用实时监听链路
  useRiskSocket()

  useEffect(() => {
    const onSuggestion = (e: any) => setActiveSuggestion(e.detail)
    const onFireworks = () => setShowFireworks(true)
    const onSop = (e: any) => setSopSteps(e.detail)
    const onCustomer = (e: any) => setActiveCustomer(e.detail)
    const onRedAlert = () => {
      setRedAlert(true)
      setTimeout(() => setRedAlert(false), 8000)
    }

    window.addEventListener('trigger-suggestion', onSuggestion)
    window.addEventListener('trigger-fireworks', onFireworks)
    window.addEventListener('trigger-sop', onSop)
    window.addEventListener('trigger-customer', onCustomer)
    window.addEventListener('trigger-red-alert', onRedAlert)

    return () => {
      window.removeEventListener('trigger-suggestion', onSuggestion)
      window.removeEventListener('trigger-fireworks', onFireworks)
      window.removeEventListener('trigger-sop', onSop)
      window.removeEventListener('trigger-customer', onCustomer)
      window.removeEventListener('trigger-red-alert', onRedAlert)
    }
  }, [])

  // 坐席视图入口
  if (user?.role === 'AGENT') {
    return (
      <Router>
        <div className={cn(
          "bg-transparent relative h-screen w-screen overflow-hidden transition-colors duration-500",
          isRedAlert && "bg-red-600/20 shadow-[inset_0_0_100px_rgba(220,38,38,0.5)] border-4 border-red-600"
        )}>
          <TacticalIsland />
          
          <AnimatePresence>
            {activeSuggestion && (
              <SuggestionPopup products={activeSuggestion} onDismiss={() => setActiveSuggestion(null)} />
            )}
            {showFireworks && (
              <Fireworks onComplete={() => setShowFireworks(false)} />
            )}
            {sopSteps && (
              <SOPOverlay steps={sopSteps} onDismiss={() => setSopSteps(null)} />
            )}
            {activeCustomer && (
              <CustomerHUD data={activeCustomer} onDismiss={() => setActiveCustomer(null)} />
            )}
          </AnimatePresence>

          <Routes>
            <Route path="*" element={<div />} />
          </Routes>
        </div>
      </Router>
    )
  }

  // 管理端/总部端视图入口
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          user ? (
            <DashboardLayout>
              <Routes>
                <Route path="/" element={
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-slate-900">欢迎进入指挥系统</h1>
                    <p className="text-slate-500 text-sm">请从左侧菜单选择功能模块进行操作。</p>
                    <div className="grid grid-cols-3 gap-6">
                       <div className="h-32 rounded-[24px] bg-white border border-slate-200 shadow-sm flex items-center justify-center p-6 gap-4">
                          <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                             <CheckCircle2 />
                          </div>
                          <div>
                             <div className="text-xs text-slate-400 font-bold uppercase">系统运行状态</div>
                             <div className="text-xl font-black text-slate-900">良好 (SAFE)</div>
                          </div>
                       </div>
                    </div>
                  </div>
                } />
                <Route path="/alerts" element={<ViolationsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/global-policy" element={<GlobalPolicyPage />} />
              </Routes>
            </DashboardLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App