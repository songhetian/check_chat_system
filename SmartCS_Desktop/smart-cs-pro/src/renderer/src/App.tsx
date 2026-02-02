import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
import GlobalPolicyPage from './pages/hq/GlobalPolicy'
import AiPerformancePage from './pages/hq/AiPerformance'
import { CheckCircle2, AlertCircle, ShieldAlert, User } from 'lucide-react'
import { cn } from './lib/utils'

function App() {
  const { user } = useAuthStore()
  const setRedAlert = useRiskStore(s => s.setRedAlert)
  const isRedAlert = useRiskStore(s => s.isRedAlert)
  
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null)
  const [showFireworks, setShowFireworks] = useState(false)
  const [sopSteps, setSopSteps] = useState<string[] | null>(null)
  const [activeCustomer, setActiveCustomer] = useState<any>(null)
  const [activeCommand, setActiveCommand] = useState<any>(null)
  const [toast, setToast] = useState<any>(null)

  useRiskSocket()

  useEffect(() => {
    const onSuggestion = (e: any) => setActiveSuggestion(e.detail)
    const onFireworks = () => setShowFireworks(true)
    const onSop = (e: any) => setSopSteps(e.detail)
    const onCustomer = (e: any) => setActiveCustomer(e.detail)
    const onCommand = (e: any) => { setActiveCommand(e.detail); setTimeout(() => setActiveCommand(null), 10000) }
    const onToast = (e: any) => { setToast(e.detail); setTimeout(() => setToast(null), 3000) }
    const onRedAlert = () => { setRedAlert(true); setTimeout(() => setRedAlert(false), 8000) }

    window.addEventListener('trigger-suggestion', onSuggestion); window.addEventListener('trigger-fireworks', onFireworks)
    window.addEventListener('trigger-sop', onSop); window.addEventListener('trigger-customer', onCustomer)
    window.addEventListener('trigger-command', onCommand); window.addEventListener('trigger-toast', onToast)
    window.addEventListener('trigger-red-alert', onRedAlert)

    return () => {
      window.removeEventListener('trigger-suggestion', onSuggestion); window.removeEventListener('trigger-fireworks', onFireworks)
      window.removeEventListener('trigger-sop', onSop); window.removeEventListener('trigger-customer', onCustomer)
      window.removeEventListener('trigger-command', onCommand); window.removeEventListener('trigger-toast', onToast)
      window.removeEventListener('trigger-red-alert', onRedAlert)
    }
  }, [])

  if (user?.role === 'AGENT') {
    return (
      <Router>
        <div className={cn("bg-transparent relative h-screen w-screen overflow-hidden transition-all duration-500", isRedAlert && "bg-red-600/20 shadow-[inset_0_0_100px_rgba(220,38,38,0.5)] border-4 border-red-600", activeCommand && "bg-slate-950/80 backdrop-blur-md")}>
          <AnimatePresence>
            {toast && (
              <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-[300]">
                <div className={cn("px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md", toast.type === 'error' ? "bg-red-600/90 border-red-400 text-white" : "bg-slate-900/90 border-cyan-500/50 text-cyan-400")}>
                  {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest opacity-50">{toast.title}</span><span className="text-sm font-bold">{toast.message}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <TacticalIsland />
          <AnimatePresence>
            {activeSuggestion && <SuggestionPopup products={activeSuggestion} onDismiss={() => setActiveSuggestion(null)} />}
            {showFireworks && <Fireworks onComplete={() => setShowFireworks(false)} />}
            {sopSteps && <SOPOverlay steps={sopSteps} onDismiss={() => setSopSteps(null)} />}
            {activeCustomer && <CustomerHUD data={activeCustomer} onDismiss={() => setActiveCustomer(null)} />}
          </AnimatePresence>
          <Routes><Route path="*" element={<div />} /></Routes>
        </div>
      </Router>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/big-screen" element={<BigScreen />} />
        <Route path="/" element={
          user ? (
            <DashboardLayout>
              <Routes>
                <Route path="/" element={
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">全链路指挥台</h1><p className="text-slate-500 text-sm">当前活跃坐席实况监控矩阵</p></div>
                      <button onClick={() => window.open('#/big-screen', '_blank')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 flex items-center gap-2 tracking-widest uppercase">激活指挥大屏</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {['张三', '李四', '王五', '赵六'].map((name, i) => (
                        <motion.div key={name} whileHover={{ y: -5 }} className="bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                          {/* 自驱动优化：增加背景扫描脉冲 (与坐席端同步) */}
                          {i !== 1 && (
                            <motion.div 
                              className="absolute inset-0 bg-cyan-500/5"
                              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                          
                          <div className="flex justify-between items-start mb-4 relative z-10">
                             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", i === 1 ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-400")}><User size={24} /></div>
                             <div className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", i === 1 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>{i === 1 ? 'VIOLATION' : 'ONLINE'}</div>
                          </div>
                          <h3 className="font-black text-slate-900 relative z-10">{name}</h3>
                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                             <span className="text-[10px] font-black text-slate-700 truncate w-24">{i === 1 ? '微信 - 争议' : '钉钉 - 接待'}</span>
                             <button className="p-2 bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90"><ShieldAlert size={12} /></button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                } />
                <Route path="/alerts" element={<ViolationsPage />} />
                <Route path="/platforms" element={<PlatformsPage />} />
                <Route path="/audit" element={<AuditStreamPage />} />
                <Route path="/hq/ai-performance" element={<AiPerformancePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/global-policy" element={<GlobalPolicyPage />} />
              </Routes>
            </DashboardLayout>
          ) : ( <Navigate to="/login" /> )
        } />
      </Routes>
    </Router>
  )
}

export default App