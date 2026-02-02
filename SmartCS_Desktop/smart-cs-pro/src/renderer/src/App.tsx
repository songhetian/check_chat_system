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
                    <div className="flex justify-between items-end">
                      <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">全链路指挥台</h1>
                        <p className="text-slate-500 text-sm">当前活跃坐席实况监控矩阵</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-xl border border-green-500/20 text-xs font-bold flex items-center gap-2">
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" /> 系统链路极度稳定
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* 模拟状态墙 */}
                      {['张三', '李四', '王五', '赵六', '陈七'].map((name, i) => (
                        <motion.div
                          key={name}
                          whileHover={{ y: -5 }}
                          className="bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group"
                        >
                          <div className="flex justify-between items-start mb-4">
                             <div className={cn(
                               "w-12 h-12 rounded-2xl flex items-center justify-center",
                               i === 1 ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                             )}>
                                <User size={24} />
                             </div>
                             <div className={cn(
                               "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                               i === 1 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                             )}>
                               {i === 1 ? 'VIOLATION' : 'ONLINE'}
                             </div>
                          </div>
                          
                          <h3 className="font-black text-slate-900">{name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4">ID: AGENT-00{i+1}</p>
                          
                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-400 uppercase">当前窗口</span>
                                <span className="text-[10px] font-black text-slate-700 truncate w-24">
                                  {i === 1 ? '微信 - 争议处理' : '钉钉 - 客户接待'}
                                </span>
                             </div>
                             <button className="p-2 bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                                <ShieldAlert size={12} />
                             </button>
                          </div>
                        </motion.div>
                      ))}
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