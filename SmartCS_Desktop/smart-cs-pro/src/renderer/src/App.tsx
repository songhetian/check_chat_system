import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/useAuthStore'
import { TacticalIsland } from './components/agent/TacticalIsland'
// ... (保持现有导入)
import { AlertCircle, ZapOff, ShieldAlert } from 'lucide-react'

function App() {
  const { user } = useAuthStore()
  const [activeCommand, setActiveCommand] = useState<any>(null)

  useEffect(() => {
    // ... (现有监听逻辑)
    const onCommand = (e: any) => {
      setActiveCommand(e.detail)
      if (e.detail.type === 'FORCE_MUTE') {
        // 执行实际的静音逻辑（可以通过调用之前的 handleMute）
      }
      setTimeout(() => setActiveCommand(null), 10000) // 10秒后自动消失
    }

    window.addEventListener('trigger-command', onCommand)
    return () => {
      window.removeEventListener('trigger-command', onCommand)
    }
  }, [])

  if (user?.role === 'AGENT') {
    return (
      <Router>
        <div className={cn(
          "bg-transparent relative h-screen w-screen overflow-hidden",
          activeCommand && "bg-slate-950/80 backdrop-blur-md"
        )}>
          {/* 指挥官指令全屏覆盖 (新增) */}
          <AnimatePresence>
            {activeCommand && (
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-12"
              >
                <div className="w-full max-w-2xl bg-slate-900 border-4 border-cyan-500 rounded-[40px] p-10 shadow-[0_0_100px_rgba(6,182,212,0.5)] flex flex-col items-center text-center space-y-6">
                   <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400 border-2 border-cyan-500/20 animate-pulse">
                      <ShieldAlert size={48} />
                   </div>
                   <div className="space-y-2">
                     <h2 className="text-[12px] font-black text-cyan-500 uppercase tracking-[0.3em]">收到指挥官远程指令</h2>
                     <h1 className="text-4xl font-black text-white tracking-tighter">{activeCommand.title}</h1>
                   </div>
                   <p className="text-slate-400 text-lg leading-relaxed max-w-md">"{activeCommand.message}"</p>
                   <div className="flex gap-4">
                      <button onClick={() => setActiveCommand(null)} className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase">确认并执行</button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <TacticalIsland />
          {/* ... */}

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