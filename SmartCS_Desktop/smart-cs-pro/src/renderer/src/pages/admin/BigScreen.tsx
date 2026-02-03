import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, Activity, Trophy, Users, Radio, 
  Cpu, ArrowRight, X, AlertCircle, Database, Zap,
  Search, ShieldCheck, UserCircle2, BarChart3,
  HeartPulse, Shield, Smartphone, Globe
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
            className="relative w-full max-w-5xl max-h-[85vh] bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
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
  const [time, setTime] = useState(new Date())
  const [activeModal, setActiveModal] = useState<string | null>(null)
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

      const resViolations = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/violations?token=CORE_LINK`,
        method: 'GET'
      })
      if (resViolations.status === 200) setViolations(resViolations.data.data)
    } catch (e) { console.error('Link Sync Error', e) }
  }

  useEffect(() => {
    fetchData()
    const t1 = setInterval(fetchData, 5000)
    const t2 = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(t1); clearInterval(t2); }
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

      {/* 弹窗库 */}
      <TacticalModal isOpen={activeModal === 'VIOLATION'} onClose={() => setActiveModal(null)} title="全域拦截实时清单">
        <div className="grid grid-cols-1 gap-4">
          {violations.map((v) => (
            <div key={v.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex justify-between items-center group hover:bg-white/[0.05] transition-all">
              <div className="flex gap-6 items-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20"><ShieldAlert size={20}/></div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-black text-white">{v.real_name} <span className="text-slate-500 font-mono text-xs">@{v.username}</span></span>
                  <p className="text-xs text-slate-400 font-medium italic">命中关键词 [{v.keyword}]: "{v.context}"</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-slate-500 font-mono">{new Date(v.timestamp).toLocaleString()}</span>
                <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase italic tracking-tighter">Immediate Action Required</span>
              </div>
            </div>
          ))}
        </div>
      </TacticalModal>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 lg:p-10 flex flex-col gap-10">
        
        {/* HEADER: 指挥官中枢 */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className={cn(
              "w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl transition-all duration-500 animate-float",
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

          <div className="flex items-center gap-8 bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[32px] border border-white/5 shadow-2xl">
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
              <div onClick={() => setActiveModal('VIOLATION')} className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl group cursor-pointer hover:border-red-500/30 transition-all">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">今日风险事件</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic tracking-tighter text-red-500 text-tactical-glow">{violations.length}</span>
                  <span className="text-xs font-black text-slate-600 uppercase italic">Events</span>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">当前在线节点</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic tracking-tighter text-cyan-400 text-tactical-glow">{agents.length}</span>
                  <span className="text-xs font-black text-slate-600 uppercase italic">Nodes</span>
                </div>
              </div>
            </div>

            {/* 坐席列表 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[48px] p-10 backdrop-blur-xl flex-1 min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                  <Users size={16} className="text-cyan-500" /> 实时节点健康矩阵
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-dark grid grid-cols-2 gap-4">
                {agents.map((a) => (
                  <div key={a.username} className="bg-white/[0.03] border border-white/5 p-5 rounded-[32px] group hover:bg-white/[0.08] transition-all">
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

          {/* 右侧：拦截日志与战术动作 */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">
            
            {/* 实时日志：横向扩展，增强直观性 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[48px] p-10 backdrop-blur-xl h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                  <Radio size={16} className="text-red-500 animate-pulse" /> 拦截取证加密链路
                </h3>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Encrypted Stream Layer-7</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-dark space-y-4">
                {violations.slice(0, 15).map((v) => (
                  <motion.div
                    key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-[32px] bg-slate-950/50 border border-white/5 flex items-center gap-8 hover:border-cyan-500/20 transition-all group"
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0 min-w-[80px]">
                      <span className="text-xs font-black text-slate-300 font-mono italic">{v.timestamp.split('T')[1].split('.')[0]}</span>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{v.timestamp.split('T')[0]}</span>
                    </div>
                    <div className="w-[1px] h-10 bg-white/5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">{v.real_name}</span>
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black rounded-full border border-red-500/20 uppercase italic">Intercepted</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-1 group-hover:text-slate-200 transition-colors">
                        "{v.context}"
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-500/5 px-3 py-1 rounded-full border border-red-500/10">{v.keyword}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 底部功能区 */}
            <div className="grid grid-cols-3 gap-10">
              <div className="col-span-2 bg-slate-900/40 border border-white/5 rounded-[48px] p-10 backdrop-blur-xl flex flex-col justify-between group">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">全域系统自检</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-8 italic">Diagnostic System Health-Check 100%</p>
                </div>
                <div className="flex gap-10">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase">AI Processor</span>
                    <span className="text-xl font-black text-emerald-500 italic">98.2% <span className="text-[10px] opacity-50">EFF</span></span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase">DB Latency</span>
                    <span className="text-xl font-black text-cyan-400 italic">14ms <span className="text-[10px] opacity-50">STABLE</span></span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase">System Rank</span>
                    <span className="text-xl font-black text-amber-400 italic">ALPHA <span className="text-[10px] opacity-50">READY</span></span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-white/5 rounded-[48px] p-10 backdrop-blur-xl flex flex-col gap-4">
                <button 
                  onClick={() => window.location.hash = '/alerts'}
                  className="flex-1 flex justify-between items-center px-6 bg-cyan-500 text-slate-950 rounded-[24px] font-black text-xs hover:bg-cyan-400 transition-all active:scale-95 shadow-xl shadow-cyan-500/20"
                >
                  取证管理 <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => window.location.hash = '/'}
                  className="flex-1 flex justify-between items-center px-6 bg-white/5 border border-white/10 text-white rounded-[24px] font-black text-xs hover:bg-white/10 transition-all active:scale-95"
                >
                  返回主阵 <ArrowRight size={16} />
                </button>
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