import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, Activity, Trophy, Users, Radio, 
  Cpu, ArrowRight, X, AlertCircle, Database, Zap,
  Search, ShieldCheck, UserCircle2, BarChart3,
  HeartPulse, Shield, Smartphone, Globe, Hand, CheckCircle2
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

// --- 战术原子组件 ---

function TacticalModal({ isOpen, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-5xl max-h-[85vh] bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                <div className="w-2 h-8 bg-cyan-500 rounded-full" /> {title}
              </h3>
              <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-dark bg-slate-950/20">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function StatusIndicator({ score }: { score: number }) {
  const config = score < 60 
    ? { color: 'text-red-500', bg: 'bg-red-500/10', label: 'High Risk' }
    : score < 85 
    ? { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Warning' }
    : { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Healthy' }

  return (
    <div className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border border-current", config.color, config.bg)}>
      {config.label}
    </div>
  )
}

export default function BigScreen() {
  const [agents, setAgents] = useState<any[]>([])
  const [violations, setViolations] = useState<any[]>([])
  const [resolved, setResolved] = useState<any[]>([])
  const [emergencies, setEmergencies] = useState<any[]>([])
  const [time, setTime] = useState(new Date())
  const [isSystemSafe, setIsSystemSafe] = useState(true)

  const fetchData = async () => {
    try {
      const resAgents = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=1&size=100&status=ONLINE`,
        method: 'GET'
      })
      if (resAgents.status === 200) {
        setAgents(resAgents.data.data)
        const hasHighRisk = resAgents.data.data.some((a: any) => a.tactical_score < 60)
        setIsSystemSafe(!hasHighRisk)
      }

      // 获取未解决违规 (待处理)
      const resViolations = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/violations?status=PENDING&size=15`,
        method: 'GET'
      })
      if (resViolations.status === 200) setViolations(resViolations.data.data)

      // 获取已解决库
      const resResolved = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/violations?status=RESOLVED&size=10`,
        method: 'GET'
      })
      if (resResolved.status === 200) setResolved(resResolved.data.data)

    } catch (e) { console.error('Link Sync Error', e) }
  }

  useEffect(() => {
    fetchData()
    const t1 = setInterval(fetchData, 5000)
    const t2 = setInterval(() => setTime(new Date()), 1000)
    
    // 监听实时求助信号
    const onEmergency = (e: any) => {
      setEmergencies(prev => [e.detail, ...prev].slice(0, 5))
    }
    window.addEventListener('ws-emergency-help', onEmergency)

    return () => { 
      clearInterval(t1); 
      clearInterval(t2); 
      window.removeEventListener('ws-emergency-help', onEmergency)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-slate-900 custom-scrollbar-dark">
      
      {/* 全局锁定背景层 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={cn(
          "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-colors duration-1000",
          isSystemSafe ? "bg-cyan-500/10" : "bg-red-500/10"
        )} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 lg:p-10 flex flex-col gap-10">
        
        {/* HEADER: 指挥官中枢 */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className={cn(
              "w-20 h-20 rounded-xl flex items-center justify-center shadow-2xl transition-all duration-500 animate-float",
              isSystemSafe ? "bg-cyan-500 shadow-cyan-500/40" : "bg-red-500 shadow-red-500/40"
            )}>
              <Shield size={40} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter italic uppercase leading-none mb-2">
                Smart-CS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">Strategic</span>
              </h1>
              <div className="flex items-center gap-4">
                <StatusIndicator score={isSystemSafe ? 100 : 50} />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Integrated Defense Network</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 bg-slate-900/60 backdrop-blur-2xl p-6 rounded-xl border border-white/5 shadow-2xl">
            <div className="flex flex-col items-end border-r border-white/10 pr-8">
              <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">Network Time</span>
              <span className="text-3xl font-black text-white font-mono italic tracking-tighter">
                {time.toLocaleTimeString([], { hour12: false })}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{time.toLocaleDateString()}</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Live-Feed</span>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN HUD: 态势感知 */}
        <main className="grid grid-cols-12 gap-10">
          
          {/* 左侧：核心指标 & 监控节点 */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
            {/* KPI 行 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-xl backdrop-blur-xl group hover:border-red-500/30 transition-all">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">今日风险事件</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic tracking-tighter text-red-500 text-tactical-glow">{violations.length}</span>
                  <span className="text-xs font-black text-slate-600 uppercase italic">Events</span>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-xl backdrop-blur-xl">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">当前在线节点</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic tracking-tighter text-cyan-400 text-tactical-glow">{agents.length}</span>
                  <span className="text-xs font-black text-slate-600 uppercase italic">Nodes</span>
                </div>
              </div>
            </div>

            {/* 坐席列表 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-xl flex flex-col">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                  <Users size={16} className="text-cyan-500" /> 实时节点健康矩阵
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-dark grid grid-cols-2 gap-4">
                {agents.map((a) => (
                  <div key={a.username} className="bg-white/[0.03] border border-white/5 p-5 rounded-xl transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border transition-all",
                        a.tactical_score < 60 ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      )}>{a.real_name?.[0] || '?'}</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-white truncate">{a.real_name}</span>
                        <span className="text-[8px] text-slate-500 font-mono truncate">@{a.username}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <StatusIndicator score={a.tactical_score} />
                      <span className={cn("text-lg font-black italic", a.tactical_score < 60 ? "text-red-500" : "text-cyan-500")}>{a.tactical_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：解决库与战术动作 */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-10">
            
            {/* 1. 实时求助响应流 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-xl flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-400 flex items-center gap-3">
                  <Hand size={16} className="animate-bounce" /> 紧急战术求援流
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-dark space-y-4">
                {emergencies.map((e, idx) => (
                  <div key={idx} className="p-5 rounded-xl">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black text-white">{e.username}</span>
                        <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded">SOS ACTIVE</span>
                     </div>
                     <p className="text-xs text-slate-200 italic mb-4 leading-relaxed font-medium">"{e.content || '请求画面协助...'}"</p>
                     {e.image && <img src={e.image} className="w-full rounded-xl border border-white/10" />}
                  </div>
                ))}
                {emergencies.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-slate-500">
                      <Hand size={48} className="mb-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">无待处理求援信号</span>
                   </div>
                )}
              </div>
            </div>

            {/* 2. 战术解决库归档 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-xl flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-3">
                  <CheckCircle2 size={16} /> 战术解决库归档
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-dark space-y-4">
                {resolved.map((r) => (
                  <div key={r.id} className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all group">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Resolved CASE</span>
                        <span className="text-[9px] font-mono text-slate-500 italic">{new Date(r.timestamp).toLocaleDateString()}</span>
                     </div>
                     <div className="text-sm font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">{r.keyword}</div>
                     <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[10px] text-slate-400 italic mb-2">
                        触发场景: "{r.context}"
                     </div>
                     <div className="text-[11px] font-bold text-emerald-400/80 leading-relaxed">
                        对策: {r.solution}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="mt-4 opacity-20 text-center pb-10">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Command-And-Control Systems Group © 2024 Secure-Link-Protocol</p>
        </footer>
      </div>

      <style>{`
        .text-tactical-glow { text-shadow: 0 0 30px rgba(6, 182, 212, 0.3); }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
      `}</style>
    </div>
  )
}