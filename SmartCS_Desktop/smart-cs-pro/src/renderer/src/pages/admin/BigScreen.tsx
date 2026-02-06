import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, Activity, Trophy, Users, Radio, 
  Cpu, ArrowRight, X, AlertCircle, Database, Zap,
  Search, ShieldCheck, UserCircle2, BarChart3,
  HeartPulse, Shield, Smartphone, Globe, Hand, CheckCircle2,
  Clock, MonitorPlay
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

// --- 战术原子组件 ---

function StatusIndicator({ score, isOnline }: { score: number, isOnline?: boolean }) {
  if (!isOnline) return (
    <div className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-slate-500 text-slate-500 bg-slate-500/10">
      Offline
    </div>
  )
  const config = score < 60 
    ? { color: 'text-red-500', bg: 'bg-red-500/10', label: 'High Risk' }
    : { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Online' }

  return (
    <div className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-current", config.color, config.bg)}>
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
        url: `${CONFIG.API_BASE}/admin/agents?page=1&size=100`,
        method: 'GET'
      })
      if (resAgents.status === 200) {
        // V3.16: 排序逻辑与监控页对齐：在线优先
        const sorted = [...resAgents.data.data].sort((a, b) => {
          if (a.is_online !== b.is_online) return a.is_online ? -1 : 1
          return 0
        })
        setAgents(sorted)
        const hasHighRisk = sorted.some((a: any) => a.is_online && a.tactical_score < 60)
        setIsSystemSafe(!hasHighRisk)
      }

      const resViolations = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/violations?status=PENDING&size=15`,
        method: 'GET'
      })
      if (resViolations.status === 200) setViolations(resViolations.data.data)

      const resResolved = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/violations?status=RESOLVED&size=10`,
        method: 'GET'
      })
      if (resResolved.status === 200) setResolved(resResolved.data.data)

    } catch (e) { console.error('Link Sync Error', e) }
  }

  useEffect(() => {
    fetchData()
    const t1 = setInterval(fetchData, 10000)
    const t2 = setInterval(() => setTime(new Date()), 1000)
    
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
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={cn(
          "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-colors duration-1000",
          isSystemSafe ? "bg-cyan-500/10" : "bg-red-500/10"
        )} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 lg:p-10 flex flex-col gap-10">
        
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 animate-float",
              isSystemSafe ? "bg-cyan-500 shadow-cyan-500/40" : "bg-red-500 shadow-red-500/40"
            )}>
              <Shield size={40} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter italic uppercase leading-none mb-2">
                Smart-CS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Command</span>
              </h1>
              <div className="flex items-center gap-4">
                <StatusIndicator score={isSystemSafe ? 100 : 50} isOnline={true} />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Strategic Control Grid</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 bg-slate-900/60 backdrop-blur-2xl p-6 rounded-2xl border border-white/5 shadow-2xl">
            <div className="flex flex-col items-end border-r border-white/10 pr-8">
              <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">System Time</span>
              <span className="text-3xl font-black text-white font-mono italic tracking-tighter">
                {time.toLocaleTimeString([], { hour12: false })}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{time.toLocaleDateString()}</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Live Link</span>
              </div>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-12 gap-10">
          
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl backdrop-blur-xl group hover:border-red-500/30 transition-all">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">全域风险事件</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic tracking-tighter text-red-500 text-tactical-glow">{violations.length}</span>
                  <span className="text-xs font-black text-slate-600 uppercase italic">Incidents</span>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl backdrop-blur-xl">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">在线活跃节点</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic tracking-tighter text-cyan-400 text-tactical-glow">{agents.filter(a=>a.is_online).length}</span>
                  <span className="text-xs font-black text-slate-600 uppercase italic">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col p-6">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                  <Users size={16} className="text-cyan-500" /> 成员实时健康状态
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-dark grid grid-cols-2 gap-4 max-h-[500px]">
                {agents.map((a) => (
                  <div key={a.username} className={cn("bg-white/[0.03] border p-5 rounded-xl transition-all", a.is_online ? "border-white/5" : "border-white/5 opacity-40")}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border transition-all",
                        !a.is_online ? "bg-slate-800 text-slate-500 border-white/5" : (a.tactical_score < 60 ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20")
                      )}>{a.real_name?.[0] || '?'}</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-white truncate">{a.real_name}</span>
                        <span className="text-[8px] text-slate-500 font-mono truncate uppercase">{a.dept_name || 'Global'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <StatusIndicator score={a.tactical_score} isOnline={!!a.is_online} />
                      <span className={cn("text-lg font-black italic", a.is_online && a.tactical_score < 60 ? "text-red-500" : "text-cyan-500")}>{a.is_online ? a.tactical_score : '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-10">
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col p-6">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-400 flex items-center gap-3">
                  <Hand size={16} className="animate-bounce" /> 实时指挥支援请求
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-dark space-y-4">
                {emergencies.map((e, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black text-white">{e.username}</span>
                        <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded uppercase tracking-widest">SOS Locked</span>
                     </div>
                     <p className="text-xs text-slate-200 italic mb-4 leading-relaxed font-medium">"{e.content || '请求远程桌面链路协助...'}"</p>
                     {e.image && <img src={e.image} className="w-full rounded-xl border border-white/10 shadow-2xl" alt="Emergency" />}
                  </div>
                ))}
                {emergencies.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-slate-500 gap-4">
                      <MonitorPlay size={48} />
                      <span className="text-[10px] font-black uppercase tracking-widest">物理链路待命中</span>
                   </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col p-6">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-3">
                  <CheckCircle2 size={16} /> 战术解决库（已归档）
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-dark space-y-4">
                {resolved.map((r) => (
                  <div key={r.id} className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all group">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Case Resolved</span>
                        <span className="text-[9px] font-mono text-slate-500 italic">{new Date(r.timestamp).toLocaleDateString()}</span>
                     </div>
                     <div className="text-sm font-black text-white mb-2 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{r.keyword}</div>
                     <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[10px] text-slate-400 italic mb-2 leading-relaxed">
                        场景: "{r.context}"
                     </div>
                     <div className="text-[11px] font-bold text-emerald-400/80 leading-relaxed bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                        方案: {r.solution}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-4 opacity-20 text-center pb-10">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Smart-CS Strategic Command Grid © 2026 Secured Layer</p>
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
