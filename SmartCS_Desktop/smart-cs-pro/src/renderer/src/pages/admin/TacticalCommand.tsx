import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, ShieldAlert, Activity, Radio, MessageSquare, 
  Zap, BrainCircuit, Mic, FileText, ArrowUpRight,
  Loader2, CheckCircle2, Lock, Unlock, Send,
  X, RefreshCw, AlertTriangle, TrendingDown, BellRing,
  Search, Filter, ChevronDown, MonitorStop, Globe, ShieldCheck,
  Power, PowerOff, Cpu, Radar
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { TacticalSearch } from '../../components/ui/TacticalSearch'

// --- 核心：座舱式主题色彩映射 ---
const getAgentStatusTheme = (score: number, isOnline: boolean) => {
  if (!isOnline) return { 
    border: 'border-slate-200', 
    bg: 'bg-white', 
    text: 'text-slate-400', 
    label: '脱机', 
    accent: 'bg-slate-100',
    dot: 'bg-slate-300'
  }
  if (score < 60) return { 
    border: 'border-red-500', 
    bg: 'bg-red-50/50', 
    text: 'text-red-600', 
    label: '高危', 
    accent: 'bg-red-500', 
    dot: 'bg-red-500 animate-ping',
    glow: 'ring-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
  }
  if (score < 85) return { 
    border: 'border-amber-500', 
    bg: 'bg-amber-50/50', 
    text: 'text-amber-600', 
    label: '风险', 
    accent: 'bg-amber-500',
    dot: 'bg-amber-500'
  }
  return { 
    border: 'border-emerald-500', 
    bg: 'bg-emerald-50/50', 
    text: 'text-emerald-600', 
    label: '稳定', 
    accent: 'bg-emerald-500',
    dot: 'bg-emerald-500'
  }
}

export default function TacticalCommand() {
  const { token } = useAuthStore()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeAgent, setActiveAgent] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInputLocked, setIsInputLocked] = useState(false)
  const [search, setSearch] = useState('')
  
  const violations = useRiskStore(s => s.violations)

  const fetchData = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    else setIsRefreshing(true)
    try {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/agents?page=1&size=100&search=${search}`, 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setAgents(res.data.data)
        if (activeAgent) {
          const updated = res.data.data.find((a: any) => a.username === activeAgent.username)
          if (updated) setActiveAgent(updated)
        }
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setIsRefreshing(false); }
  }

  useEffect(() => { fetchData() }, [search])
  useEffect(() => {
    const timer = setInterval(() => fetchData(true), 10000)
    return () => clearInterval(timer)
  }, [search, token])

  const executeIntervention = async (type: string, description: string) => {
    if (!activeAgent || !token) return
    if (type === 'LOCK') setIsInputLocked(!isInputLocked)
    
    // 工业级视觉反馈触发
    window.dispatchEvent(new CustomEvent('trigger-toast', {
      detail: { 
        title: '战术指令已固化', 
        message: `已对节点 [${activeAgent.real_name}] 下发 [${description}]`, 
        type: 'success' 
      }
    }))
  }

  return (
    <div className="flex flex-col h-full font-sans bg-slate-50/50 p-4 lg:p-6 gap-6 overflow-hidden select-none">
      
      {/* 1. 战术顶部看板 */}
      <header className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl">
            <Radar size={24} className="text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">战术监控指挥中枢</h2>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <span className="flex items-center gap-1"><Cpu size={10}/> 系统引擎已挂载</span>
               <span className="mx-2 opacity-20">|</span>
               <span className="flex items-center gap-1 text-emerald-500"><Globe size={10}/> 实时链路 100%</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
           <StatBox label="在线节点" value={agents.filter(a => a.is_online).length} color="text-cyan-500" />
           <StatBox label="风险预警" value={violations.length} color="text-red-500" />
           <button onClick={() => fetchData()} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all border border-slate-100">
              <RefreshCw size={20} className={cn(isRefreshing && "animate-spin")} />
           </button>
        </div>
      </header>

      {/* 2. 指挥部主战区 */}
      <main className="flex-1 flex gap-6 min-h-0">
        
        {/* 2.1 左侧：高密度态势监控墙 (占据 1/3) */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden shrink-0">
           <div className="p-6 border-b border-slate-100 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Radio size={14} className="text-cyan-500" /> 节点实时矩阵
              </h3>
              <TacticalSearch value={search} onChange={setSearch} placeholder="检索操作员..." />
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-slate-50/30">
              {agents.map(a => {
                const theme = getAgentStatusTheme(a.tactical_score, a.is_online)
                const isActive = activeAgent?.username === a.username
                return (
                  <motion.div 
                    key={a.username}
                    onClick={() => setActiveAgent(a)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "p-4 rounded-[28px] border transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden",
                      isActive ? "bg-slate-900 border-slate-900 shadow-2xl" : cn("bg-white border-slate-100 hover:border-cyan-200", theme.glow)
                    )}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic shrink-0",
                      isActive ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "bg-slate-50 text-slate-400 border border-slate-100"
                    )}>{a.real_name[0]}</div>
                    
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                          <span className={cn("text-sm font-black truncate", isActive ? "text-white" : "text-slate-900")}>{a.real_name}</span>
                          <div className={cn("w-2 h-2 rounded-full", theme.dot)} />
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-slate-400 tracking-tighter">@{a.username}</span>
                          <span className={cn("text-[9px] font-black uppercase tracking-widest italic", a.tactical_score < 60 ? "text-red-500" : "text-cyan-500")}>{a.tactical_score} PT</span>
                       </div>
                    </div>
                  </motion.div>
                )
              })}
           </div>
        </div>

        {/* 2.2 右侧：实战干预座舱 (占据 2/3) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[40px] border border-slate-200 shadow-2xl relative overflow-hidden">
           <AnimatePresence mode='wait'>
              {activeAgent ? (
                <motion.div 
                  key={activeAgent.username}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col h-full"
                >
                  {/* 座舱头：节点身份 */}
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                     <div className="flex items-center gap-6">
                        <div className="relative">
                           <div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center text-3xl font-black italic border-4 border-white shadow-2xl">
                              {activeAgent.real_name[0]}
                           </div>
                           {activeAgent.is_online && <div className="absolute -right-1 -top-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full animate-pulse shadow-xl" />}
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{activeAgent.real_name}</h4>
                              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border", activeAgent.is_online ? "bg-emerald-500 text-white border-emerald-400 shadow-lg" : "bg-slate-100 text-slate-400 border-slate-200")}>
                                 {activeAgent.is_online ? '在线通讯中' : '节点离线'}
                              </span>
                           </div>
                           <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.3em] italic">{activeAgent.dept_name || '中枢待分派'} / 前哨监控站</p>
                        </div>
                     </div>
                     <button onClick={() => setActiveAgent(null)} className="p-4 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"><X size={24}/></button>
                  </div>

                  {/* 座舱中部：实时传输与智脑建议 */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                     
                     <div className="grid grid-cols-12 gap-8">
                        {/* 2.2.1 实时对话全透视 */}
                        <section className="col-span-12 xl:col-span-7 space-y-4">
                           <div className="flex justify-between items-center ml-2">
                              <h5 className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.4em] flex items-center gap-2"><MonitorStop size={16} /> 实时对话全透视</h5>
                              <span className="text-[9px] font-black text-slate-300 uppercase italic animate-pulse">Live Transmission...</span>
                           </div>
                           <div className="bg-slate-950 rounded-[40px] p-8 border border-white/5 space-y-6 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
                              <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                              <div className="space-y-4 relative z-10 font-sans">
                                 <div className="flex gap-4 text-xs"><span className="text-slate-500 font-bold shrink-0 mt-2 uppercase">USR:</span><span className="text-white/90 bg-white/5 px-4 py-3 rounded-3xl rounded-tl-none border border-white/5 backdrop-blur-md">这件衣服起球吗？质量怎么样？</span></div>
                                 <div className="flex gap-4 text-xs flex-row-reverse"><span className="text-cyan-500 font-bold shrink-0 mt-2 uppercase text-right">AGT:</span><span className="text-slate-950 bg-cyan-400 px-4 py-3 rounded-3xl rounded-tr-none font-bold shadow-lg shadow-cyan-500/20">亲亲，这款是新疆长绒棉材质，不易起球哦。</span></div>
                                 <div className="flex gap-4 text-xs"><span className="text-slate-500 font-bold shrink-0 mt-2 uppercase">USR:</span><span className="text-white/90 bg-white/5 px-4 py-3 rounded-3xl rounded-tl-none border border-white/5 backdrop-blur-md">能不能加你微信，发一下实拍？</span></div>
                                 <div className={cn("flex gap-4 text-xs flex-row-reverse animate-pulse transition-all", isInputLocked && "opacity-20 grayscale")}>
                                    <span className="text-red-500 font-bold shrink-0 mt-2 uppercase text-right">INP:</span>
                                    <span className="text-slate-400 italic py-3">节点正在输入敏感战术负载...</span>
                                 </div>
                              </div>
                           </div>
                        </section>

                        {/* 2.2.2 智脑战术研判 */}
                        <section className="col-span-12 xl:col-span-5 space-y-4">
                           <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-2"><BrainCircuit size={16} /> 智脑实时研判</h5>
                           <div className="p-8 bg-slate-900 rounded-[40px] border border-white/5 h-[340px] relative overflow-hidden flex flex-col justify-center">
                              <div className="absolute top-0 right-0 p-6 opacity-5"><BrainCircuit size={120} className="text-cyan-400" /></div>
                              <p className="text-base font-medium text-slate-300 leading-relaxed italic relative z-10">
                                 "检测到该操作员处于 <span className="text-red-400 font-black underline underline-offset-4">高危诱导区</span>。监测到其输入缓冲区存在大量社交平台引流关键词。建议指挥官立即执行 <span className="text-cyan-400 font-black italic">‘强制锁定’</span> 指令并弹射标准致歉话术。"
                              </p>
                              <div className="mt-8 flex items-center gap-3 relative z-10">
                                 <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: '85%' }} /></div>
                                 <span className="text-[10px] font-black text-red-400 uppercase">风险阈值 85%</span>
                              </div>
                           </div>
                        </section>
                     </div>

                     {/* 座舱底部：指令干预矩阵 */}
                     <section className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 ml-2"><div className="w-1 h-4 bg-slate-900 rounded-full" /><h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">指挥官干预指令矩阵</h5></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                           <TacticalButton 
                             disabled={!activeAgent.is_online}
                             active={isInputLocked}
                             onClick={() => executeIntervention('LOCK', isInputLocked ? '解锁输入' : '锁定输入')}
                             icon={isInputLocked ? Unlock : Lock}
                             label={isInputLocked ? '解除锁定' : '强制锁定'}
                             sub="Input Freeze"
                             color={isInputLocked ? 'bg-red-600' : 'bg-slate-900'}
                           />
                           <TacticalButton 
                             onClick={() => executeIntervention('PUSH', '话术弹射')}
                             icon={Send}
                             label="话术弹射"
                             sub="Push Script"
                             color="bg-cyan-500"
                             textColor="text-slate-950"
                           />
                           <TacticalButton 
                             onClick={() => executeIntervention('VOICE', '语音警告')}
                             icon={Mic}
                             label="语音告警"
                             sub="Voice Alert"
                             color="bg-white"
                             textColor="text-red-600"
                             border="border-2 border-red-100 shadow-lg shadow-red-500/5"
                           />
                           <TacticalButton 
                             onClick={() => executeIntervention('SOP', 'SOP下发')}
                             icon={FileText}
                             label="推送 SOP"
                             sub="SOP Push"
                             color="bg-white"
                             textColor="text-slate-900"
                             border="border-2 border-slate-100"
                           />
                        </div>
                     </section>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-200 gap-12 p-20 text-center italic uppercase font-black">
                   <div className="relative">
                      <Radar size={160} strokeWidth={0.5} className="opacity-10 animate-spin-slow text-cyan-500" />
                      <div className="absolute inset-0 flex items-center justify-center"><Activity size={48} className="text-cyan-400 opacity-20 animate-pulse" /></div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-2xl tracking-[0.5em] text-slate-300">等待拦截目标</p>
                      <p className="text-[10px] tracking-normal font-bold text-slate-400 leading-relaxed max-w-sm mx-auto">请在左侧态势矩阵中点击选中实战节点<br/>以激活深度战术指挥链路</p>
                   </div>
                </div>
              )}
           </AnimatePresence>
        </div>
      </main>

      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .bg-grid-white\/\[0.02\] { background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 30px 30px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  )
}

function StatBox({ label, value, color }: any) {
  return (
    <div className="bg-slate-50/50 px-6 py-3 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[100px]">
       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
       <span className={cn("text-xl font-black italic", color)}>{value}</span>
    </div>
  )
}

function TacticalButton({ onClick, icon: Icon, label, sub, color, textColor = 'text-white', border, active, disabled }: any) {
  return (
    <motion.button 
      disabled={disabled}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 rounded-[32px] transition-all shadow-xl group disabled:opacity-20",
        color, border, textColor
      )}
    >
       <div className={cn("transition-transform group-hover:scale-110", active && "animate-bounce")}><Icon size={28} strokeWidth={2.5} /></div>
       <div className="text-center">
          <p className="text-xs font-black uppercase tracking-tighter leading-none mb-1">{label}</p>
          <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest font-mono">{sub}</p>
       </div>
    </motion.button>
  )
}
