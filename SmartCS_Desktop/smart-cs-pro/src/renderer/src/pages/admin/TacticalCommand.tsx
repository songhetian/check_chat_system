import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, ShieldAlert, Activity, Radio, MessageSquare, 
  Zap, BrainCircuit, Mic, FileText, ArrowUpRight,
  Loader2, CheckCircle2, Lock, Unlock, Send,
  X, RefreshCw, AlertTriangle, TrendingDown, BellRing,
  Search, Filter, ChevronDown, MonitorStop
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { TacticalSearch } from '../../components/ui/TacticalSearch'

const getAgentTheme = (score: number, isOnline: boolean) => {
  if (!isOnline) return { border: 'border-slate-200', bg: 'bg-white', text: 'text-slate-400', label: '离线脱机', accent: 'bg-slate-100' }
  if (score < 60) return { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-600', label: '高危监控', accent: 'bg-red-500', glow: 'animate-pulse ring-4 ring-red-500/20' }
  if (score < 85) return { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', label: '合规警告', accent: 'bg-amber-500' }
  return { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', label: '运行正常', accent: 'bg-emerald-500' }
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
    window.dispatchEvent(new CustomEvent('trigger-toast', {
      detail: { title: '战术指令已执行', message: `针对 ${activeAgent.real_name} 的 [${description}] 指令已下发`, type: 'success' }
    }))
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans select-none bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="grid grid-cols-12 gap-6 shrink-0">
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] rotate-12"><BrainCircuit size={120} /></div>
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg relative z-10 group-hover:scale-110 transition-transform"><Zap size={36} className="text-white animate-pulse" /></div>
          <div className="relative z-10"><h2 className="text-2xl font-black tracking-tighter text-slate-900 italic uppercase leading-none">实时战术指挥台</h2><div className="flex items-center gap-2 mt-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">中枢链路已加密</p></div></div>
        </div>
        <div className="col-span-12 lg:col-span-8 bg-white p-4 rounded-[40px] border border-slate-200 shadow-sm flex items-center overflow-hidden">
           <div className="grid grid-cols-3 w-full gap-4">
              <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl py-6 border border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-[0.2em]">管控节点</span><span className="text-3xl font-black text-slate-900 italic">{agents.length}</span></div>
              <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl py-6 border border-slate-100"><span className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-[0.2em]">在线监听</span><span className="text-3xl font-black text-emerald-500 italic">{agents.filter(a => a.is_online).length}</span></div>
              <div className="flex flex-col items-center justify-center bg-red-50/50 rounded-3xl py-6 border border-red-100"><span className="text-[9px] font-black text-red-400 uppercase mb-1 tracking-[0.2em]">今日拦截</span><span className="text-3xl font-black text-red-600 italic">{violations.length}</span></div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        <div className="col-span-12 xl:col-span-7 flex flex-col gap-6 min-h-0">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
               <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center"><Users size={20} /></div><div><h3 className="text-sm font-black text-slate-900">实时节点矩阵</h3><div className="flex items-center gap-2"><span className="text-[9px] font-black text-slate-400 uppercase">按风险权重自动置顶</span>{isRefreshing && <RefreshCw size={10} className="text-cyan-500 animate-spin" />}</div></div></div>
               <div className="w-full md:w-72"><TacticalSearch value={search} onChange={setSearch} onSearch={() => fetchData()} placeholder="搜索坐席姓名、账号..." /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50/20">
              <AnimatePresence>
                {agents.map((a) => {
                  const theme = getAgentTheme(a.tactical_score, a.is_online);
                  return (
                    <motion.div 
                      key={a.username} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      whileHover={{ y: -4, scale: 1.02 }} onClick={() => setActiveAgent(a)}
                      className={cn("p-6 rounded-[32px] border transition-all cursor-pointer relative flex flex-col gap-4 shadow-sm", activeAgent?.username === a.username ? "bg-slate-900 border-slate-900 shadow-2xl ring-4 ring-cyan-500/20" : cn("bg-white border-slate-100 hover:border-cyan-200 hover:shadow-lg", theme.bg, theme.border, theme.glow))}
                    >
                      <div className="flex items-center gap-4"><div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic transition-all shadow-sm", activeAgent?.username === a.username ? "bg-cyan-500 text-slate-950" : "bg-white border border-slate-100 text-slate-400")}>{a.real_name[0]}</div><div className="flex flex-col min-w-0"><span className={cn("text-base font-black truncate", activeAgent?.username === a.username ? "text-white" : "text-slate-900")}>{a.real_name}</span><div className="flex items-center gap-2"><span className="text-[10px] text-slate-500 font-mono tracking-tighter">@{a.username}</span><span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-current", theme.text, "bg-white/50")}>{theme.label}</span></div></div></div>
                      <div className={cn("flex justify-between items-center px-4 py-3 rounded-2xl border transition-all", activeAgent?.username === a.username ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-100 shadow-inner")}><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">战术评分</span><span className={cn("text-xl font-black italic tracking-tighter", a.tactical_score < 60 ? "text-red-500" : "text-cyan-500")}>{a.tactical_score}</span></div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5 flex flex-col min-h-0">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl flex flex-col h-full relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
            <AnimatePresence mode='wait'>
              {activeAgent ? (
                <motion.div key={activeAgent.username} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                  <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white/50 shrink-0"><div className="flex items-center gap-6"><div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center font-black text-3xl italic shadow-2xl border-4 border-white relative">{activeAgent.real_name[0]}{activeAgent.is_online && <div className="absolute -right-1 -top-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full animate-pulse shadow-lg" />}</div><div className="flex flex-col gap-1"><div className="flex items-center gap-3"><h4 className="text-3xl font-black text-slate-900 tracking-tighter">{activeAgent.real_name}</h4><span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", activeAgent.is_online ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500")}>{activeAgent.is_online ? '实时监听中' : '节点已脱机'}</span></div><p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{activeAgent.dept_name} / 战略前哨节点</p></div></div><button onClick={() => setActiveAgent(null)} className="p-4 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"><X size={24}/></button></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                     <section className="space-y-4"><div className="flex justify-between items-center"><h5 className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.3em] flex items-center gap-2"><MonitorStop size={16} /> 实时对话全透视</h5><span className="text-[9px] font-black text-slate-400 uppercase italic">加密实时同步中</span></div><div className="bg-slate-950 rounded-[32px] p-6 border border-white/5 space-y-4 shadow-2xl relative overflow-hidden"><div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" /><div className="space-y-3 relative z-10"><div className="flex gap-3 text-xs"><span className="text-slate-500 font-bold shrink-0">客户:</span><span className="text-white bg-white/5 px-3 py-2 rounded-2xl rounded-tl-none border border-white/5">这个产品什么时候能发货？</span></div><div className="flex gap-3 text-xs flex-row-reverse"><span className="text-cyan-500 font-bold shrink-0 text-right">坐席:</span><span className="text-slate-900 bg-cyan-400 px-3 py-2 rounded-2xl rounded-tr-none font-medium">亲亲，48小时内顺丰发出哦。</span></div><div className={cn("flex gap-3 text-xs flex-row-reverse animate-pulse", isInputLocked && "opacity-50")}><span className="text-red-500 font-bold shrink-0 text-right">正在输入:</span><span className="text-slate-400 italic">正在录入敏感信息...</span></div></div></div></section>
                     <section className="space-y-6"><h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Mic size={16} /> 战术中枢指令模块</h5><div className="grid grid-cols-2 gap-6"><button disabled={!activeAgent.is_online} onClick={() => executeIntervention('LOCK', isInputLocked ? '解除锁定' : '一键锁定')} className={cn("flex flex-col items-center justify-center gap-4 p-8 rounded-[40px] transition-all shadow-2xl border-2", isInputLocked ? "bg-red-600 border-red-400 text-white" : "bg-slate-900 border-slate-800 text-white hover:bg-slate-800 disabled:opacity-20")}>{isInputLocked ? <Unlock size={32} /> : <Lock size={32} />}<span className="text-xs font-black uppercase tracking-widest">{isInputLocked ? '解除输入锁定' : '一键锁定输入'}</span></button><button onClick={() => executeIntervention('PUSH', '话术弹射')} className="flex flex-col items-center justify-center gap-4 p-8 bg-cyan-500 border-2 border-cyan-400 rounded-[40px] text-slate-950 hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-100 group"><Send size={32} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /><span className="text-xs font-black uppercase tracking-widest">话术弹射协助</span></button></div></section>
                     <section className="p-10 bg-slate-900 text-white rounded-[48px] relative overflow-hidden shadow-2xl"><div className="absolute top-0 right-0 p-8 opacity-10"><BrainCircuit size={100} /></div><h5 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2"><BrainCircuit size={16} /> 智脑实战研判</h5><p className="text-base font-medium text-slate-300 leading-relaxed italic relative z-10">"检测到该节点输入缓冲区存在大量情绪化词汇。建议主管立即执行<span className="text-cyan-400 font-black underline underline-offset-4 mx-1">‘一键锁定’</span>并弹射标准致歉话术。"</p></section>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-200 gap-10 uppercase font-black tracking-[0.5em] text-center p-10 italic"><div className="relative"><Activity size={120} strokeWidth={1} className="opacity-10 animate-pulse text-cyan-500" /><div className="absolute inset-0 flex items-center justify-center opacity-20"><Zap size={40} className="text-cyan-400" /></div></div><div className="space-y-3"><p className="text-slate-300 text-xl">等待指挥目标</p><p className="text-[10px] text-slate-400 font-bold opacity-50 tracking-normal leading-relaxed">请在左侧节点矩阵中点击选中目标<br/>开启深度战术干预链路</p></div></div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}