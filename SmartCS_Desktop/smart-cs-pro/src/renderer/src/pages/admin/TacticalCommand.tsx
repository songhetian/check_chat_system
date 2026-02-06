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
import { ROLE_ID } from '../../lib/constants'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { TacticalTable } from '../../components/ui/TacticalTable'
import { toast } from 'sonner'

const getAgentStatusTheme = (score: number, isOnline: boolean) => {
  if (!isOnline) return { border: 'border-slate-200', bg: 'bg-white', text: 'text-slate-400', label: '脱机', dot: 'bg-slate-300' }
  if (score < 60) return { border: 'border-red-500', bg: 'bg-red-50/50', text: 'text-red-600', label: '风险', dot: 'bg-red-500 animate-ping' }
  return { border: 'border-emerald-500', bg: 'bg-emerald-50/50', text: 'text-emerald-600', label: '稳定', dot: 'bg-emerald-500' }
}

export default function TacticalCommand() {
  const { token, user } = useAuthStore()
  const [agents, setAgents] = useState<any[]>([])
  const [depts, setDepts] = useState<any[]>([])
  const [deptId, setDeptId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeAgent, setActiveAgent] = useState<any>(null)
  const [isInputLocked, setIsInputLocked] = useState(false)
  const [search, setSearch] = useState('')
  const [liveChat, setLiveChat] = useState<any[]>([])
  const [screenShot, setScreenShot] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  
  const isHQ = user?.role_id === ROLE_ID.HQ || user?.role_code === 'HQ'

  const fetchDepts = async () => {
    if (!isHQ || !token) return
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/departments?size=100`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) setDepts(res.data.data)
    } catch (e) { console.error(e) }
  }

  const fetchData = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/agents?role_only=AGENT&search=${search}&dept_id=${deptId}&_t=${Date.now()}`, 
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
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDepts() }, [token])
  useEffect(() => { fetchData() }, [search, deptId, token])

  useEffect(() => {
    const onLiveChat = (e: any) => {
      const msg = e.detail
      if (activeAgent && msg.username === activeAgent.username) {
        setLiveChat(prev => [...prev.slice(-15), { sender: 'USR', text: msg.content, time: new Date().toLocaleTimeString() }])
      }
    }
    const onNodeSync = () => fetchData(true)
    const onScreenSync = (e: any) => {
      const data = e.detail;
      if (activeAgent && data.username === activeAgent.username) setScreenShot(data.payload)
    }
    window.addEventListener('ws-live-chat', onLiveChat)
    window.addEventListener('ws-tactical-node-sync', onNodeSync)
    window.addEventListener('ws-screen-sync', onScreenSync)
    return () => {
      window.removeEventListener('ws-live-chat', onLiveChat)
      window.removeEventListener('ws-tactical-node-sync', onNodeSync)
      window.removeEventListener('ws-screen-sync', onScreenSync)
    }
  }, [activeAgent])

  const executeIntervention = async (type: string, description: string, payload: any = {}) => {
    if (!activeAgent || !token || processing) return
    setProcessing(type)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/command`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { username: activeAgent.username, type, payload }
      })
      if (res.status === 200 || res.data?.status === 'ok') {
        if (type === 'LOCK') setIsInputLocked(!isInputLocked)
        toast.success('指令已送达', { description: `对 ${activeAgent.real_name} 的 [${description}] 已生效` })
      }
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="flex flex-col h-full font-sans bg-slate-50/50 p-4 lg:p-6 gap-6 overflow-hidden text-black">
      <header className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg"><Radar size={20} className="text-cyan-400" /></div>
          <div><h2 className="text-2xl font-black text-black italic tracking-tighter uppercase leading-none">实时监控指挥中心</h2><div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span className="flex items-center gap-1 text-emerald-600 font-black"><Globe size={10}/> 实时链路已激活</span></div></div>
        </div>
        <div className="flex items-center gap-4">
           {isHQ && (
             <div className="w-56">
               <TacticalSelect options={[{id: '', name: '所有部门'}, ...depts]} value={deptId} onChange={(val: string | number) => setDeptId(String(val))} placeholder="选择部门" />
             </div>
           )}
           <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex flex-col items-center min-w-[80px]">
              <span className="text-[9px] font-black text-slate-400 uppercase">在线成员</span>
              <span className="text-lg font-black text-black">{agents.filter(a => a.is_online).length}</span>
           </div>
        </div>
      </header>

      <main className="flex-1 flex gap-6 min-h-0">
        <div className="w-full lg:w-[320px] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
           <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Radio size={12} className="text-cyan-600" /> 成员实时列表</h3>
                 <button onClick={() => fetchData()} className="p-2 bg-slate-50 text-black rounded-xl hover:bg-slate-100 transition-all border border-slate-200 group">
                    <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                 </button>
              </div>
              <TacticalSearch value={search} onChange={setSearch} placeholder="搜索姓名..." />
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <TacticalTable headers={['成员', '状态', '评分', '详情']}>
                {agents.map(a => {
                  const theme = getAgentStatusTheme(a.tactical_score, a.is_online);
                  const isActive = activeAgent?.username === a.username;
                  return (
                    <tr key={a.username} onClick={() => { setActiveAgent(a); setLiveChat([]); }} className={cn("cursor-pointer transition-colors", isActive ? "bg-black text-white" : "hover:bg-slate-50 text-black")}>
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0", isActive ? "bg-cyan-500 text-black" : "bg-slate-100 text-slate-500")}>{a.real_name[0]}</div>
                          <span className="text-[11px] font-black truncate">{a.real_name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <div className="flex justify-center items-center gap-1.5"><div className={cn("w-1.5 h-1.5 rounded-full", theme.dot)} /><span className={cn("text-[9px] font-black uppercase", isActive ? "text-slate-300" : "text-slate-500")}>{theme.label}</span></div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={cn("text-[10px] font-black", a.tactical_score < 60 ? "text-red-500" : (isActive ? "text-cyan-400" : "text-cyan-600"))}>{a.tactical_score}</span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <ArrowUpRight size={12} className={cn(isActive ? "text-cyan-400" : "text-slate-300")} />
                      </td>
                    </tr>
                  )
                })}
              </TacticalTable>
           </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
           <AnimatePresence mode='wait'>
              {activeAgent ? (
                <motion.div key={activeAgent.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
                  <section className="p-6 border-b border-slate-100 bg-slate-50/30 shrink-0">
                     <div className="flex items-center justify-between mb-4"><h5 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Cpu size={14}/> 实时干预矩阵</h5><span className="text-[9px] font-bold text-slate-400 italic">目标: {activeAgent.real_name}</span></div>
                     <div className="grid grid-cols-4 gap-4">
                        <CommandBtn active={isInputLocked} loading={processing === 'LOCK'} onClick={() => executeIntervention('LOCK', isInputLocked ? '解锁' : '锁定')} icon={isInputLocked ? Unlock : Lock} label={isInputLocked ? '解除锁定' : '强制锁定'} color={isInputLocked ? 'bg-red-600 text-white' : 'bg-black text-white'} />
                        <CommandBtn loading={processing === 'PUSH'} onClick={() => executeIntervention('PUSH', '话术提示')} icon={Send} label="话术提示" color="bg-cyan-500 text-black" />
                        <CommandBtn loading={processing === 'VOICE'} onClick={() => executeIntervention('VOICE', '语音警报')} icon={Mic} label="语音警报" color="bg-white text-red-600 border border-red-100" />
                        <CommandBtn loading={processing === 'SOP'} onClick={() => executeIntervention('SOP', '推送规范')} icon={FileText} label="业务规范" color="bg-white text-black border border-slate-200" />
                     </div>
                  </section>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                     <section className="space-y-3">
                        <h5 className="text-[10px] font-black text-cyan-700 uppercase tracking-widest flex items-center gap-2"><MonitorStop size={14} /> 实时屏幕监听 (只读)</h5>
                        <div className="bg-black rounded-xl p-1.5 min-h-[300px] flex items-center justify-center relative overflow-hidden">
                           {screenShot ? (
                              <img src={screenShot} className="max-w-full max-h-full rounded-xl object-contain relative z-10" alt="Screen" />
                           ) : (
                              <div className="space-y-4 relative z-10 text-center">
                                 {liveChat.length === 0 ? (<p className="text-slate-700 text-xs font-bold">等待数据流同步...</p>) : liveChat.map((chat, idx) => (
                                   <div key={idx} className="flex gap-2 text-[11px]"><span className="text-slate-500 font-black">RAW:</span><span className="text-white/90 bg-white/5 px-3 py-1.5 rounded-xl italic">"{chat.text}"</span></div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </section>
                     <section className="p-6 bg-black text-white rounded-xl relative overflow-hidden shadow-lg"><div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit size={60} /></div><h5 className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-3">智脑辅助决策</h5><p className="text-xs font-bold text-slate-300 leading-relaxed italic relative z-10">"系统研判该成员目前对话风险较低。若触发违规词，请使用上方干预按钮。"</p></section>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-200 gap-8 p-10 text-center uppercase font-black italic">
                  <Radar size={100} className="opacity-10" />
                  <div className="space-y-2"><p className="text-xl tracking-widest">请选择监控目标</p><p className="text-[9px] font-bold text-slate-400">开启实时通讯链路以获取详情</p></div>
                </div>
              )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function CommandBtn({ onClick, icon: Icon, label, color, active, loading }: any) {
  return (
    <button onClick={onClick} disabled={loading} className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all shadow active:scale-95 disabled:opacity-30 group", color)}>
       {loading ? <Loader2 size={20} className="animate-spin" /> : <Icon size={20} className={cn("group-hover:scale-110 transition-transform", active && "animate-bounce")} />}
       <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
    </button>
  )
}