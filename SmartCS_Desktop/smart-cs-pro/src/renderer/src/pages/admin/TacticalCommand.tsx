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
  if (score < 60) return { border: 'border-red-500', bg: 'bg-red-50/50', text: 'text-red-600', label: '高危', dot: 'bg-red-500 animate-ping', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]' }
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
  const [emergency, setEmergency] = useState<{username: string, msg: string} | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  
  const violations = useRiskStore(s => s.violations)
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

  // 核心加固：强制刷新逻辑，注入时间戳
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
        // 自动对齐当前选中的 Agent 数据
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
    const onNodeSync = () => {
      fetchData(true) // 静默刷新坐席矩阵状态
    }
    const onScreenSync = (e: any) => {
      const data = e.detail;
      if (activeAgent && data.username === activeAgent.username) {
        setScreenShot(data.payload);
      }
    }
    const onEmergencyHelp = (e: any) => {
      const data = e.detail;
      if (data.type === 'EMERGENCY_HELP') {
        const agentName = agents.find(a => a.username === data.username)?.real_name || data.username;
        toast.error('🚨 [高危求助]', { 
          description: `坐席 ${agentName} 发起紧急战术求援！`,
          duration: 10000,
          action: {
            label: '立即切入',
            onClick: () => {
              const target = agents.find(a => a.username === data.username);
              if (target) {
                setActiveAgent(target);
                setScreenShot(data.image || null);
              }
            }
          }
        });
        setEmergency({ username: data.username, msg: data.content });
      }
    }
    window.addEventListener('ws-live-chat', onLiveChat)
    window.addEventListener('ws-tactical-node-sync', onNodeSync)
    window.addEventListener('ws-screen-sync', onScreenSync)
    window.addEventListener('ws-emergency-help', onEmergencyHelp)
    return () => {
      window.removeEventListener('ws-live-chat', onLiveChat)
      window.removeEventListener('ws-tactical-node-sync', onNodeSync)
      window.removeEventListener('ws-screen-sync', onScreenSync)
      window.removeEventListener('ws-emergency-help', onEmergencyHelp)
    }
  }, [activeAgent, agents])

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
      if (res.data.status === 'ok') {
        if (type === 'LOCK') setIsInputLocked(!isInputLocked)
        toast.success('指令生效', { description: `针对 ${activeAgent.real_name} 的 [${description}] 已下发` })
      }
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="flex flex-col h-full font-sans bg-slate-50/50 p-4 lg:p-6 gap-6 overflow-hidden select-none text-slate-900">
      <header className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl"><Radar size={24} className="text-cyan-400 animate-pulse" /></div>
          <div><h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">实时监控指挥中心</h2><div className="flex items-center gap-2 mt-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center gap-1 text-emerald-500"><Globe size={10}/> 实时链路已激活</span></div></div>
        </div>
        <div className="flex items-center gap-4">
           {isHQ && (
             <div className="w-56">
               <TacticalSelect options={[{id: '', name: '所有部门'}, ...depts]} value={deptId} onChange={(val: string | number) => setDeptId(String(val))} placeholder="选择部门进行过滤" />
             </div>
           )}
           <StatBox label="监控成员" value={agents.length} color="text-cyan-500" />
           <StatBox label="在线状态" value={agents.filter(a => a.is_online).length} color="text-emerald-500" />
        </div>
      </header>

      <main className="flex-1 flex gap-6 min-h-0">
        <div className="w-full lg:w-[380px] flex flex-col bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden shrink-0">
           <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2"><Radio size={14} className="text-cyan-500" /> 成员实时列表</h3>
                 {/* 优化：刷新按钮移至矩阵头部 */}
                 <button onClick={() => fetchData()} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 shadow-sm group">
                    <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                 </button>
              </div>
              <TacticalSearch value={search} onChange={setSearch} placeholder="搜索成员姓名..." />
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <TacticalTable headers={['成员', '状态', '分值', '详情']}>
                {agents.map(a => {
                  const theme = getAgentStatusTheme(a.tactical_score, a.is_online);
                  const isActive = activeAgent?.username === a.username;
                  return (
                    <tr 
                      key={a.username} 
                      onClick={() => { setActiveAgent(a); setLiveChat([]); }} 
                      className={cn("cursor-pointer transition-colors", isActive ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-900")}
                    >
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs italic shrink-0", isActive ? "bg-cyan-500 text-slate-950" : "bg-slate-100 text-slate-500")}>
                            {a.real_name[0]}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black truncate">{a.real_name}</span>
                            <span className={cn("text-[8px] font-mono", isActive ? "text-slate-400" : "text-slate-400")}>@{a.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", theme.dot)} />
                          <span className={cn("text-[9px] font-black uppercase", isActive ? "text-slate-300" : "text-slate-500")}>{theme.label}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={cn("text-[10px] font-black italic", a.tactical_score < 60 ? "text-red-500" : (isActive ? "text-cyan-400" : "text-cyan-600"))}>
                          {a.tactical_score}
                        </span>
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

        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[40px] border border-slate-200 shadow-2xl relative overflow-hidden">
           <AnimatePresence mode='wait'>
              {activeAgent ? (
                <motion.div key={activeAgent.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
                  <section className="p-8 border-b border-slate-100 bg-slate-50/30 shrink-0">
                     <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="w-1.5 h-4 bg-cyan-500 rounded-full" /><h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">管理员干预中心</h5></div><div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm"><span className="text-[9px] font-black text-slate-400">当前操作对象: {activeAgent.real_name}</span></div></div>
                     <div className="grid grid-cols-4 gap-6">
                        <TacticalButton disabled={!activeAgent.is_online || (processing && processing !== 'LOCK')} active={isInputLocked} loading={processing === 'LOCK'} onClick={() => executeIntervention('LOCK', isInputLocked ? '解锁' : '锁定')} icon={isInputLocked ? Unlock : Lock} label={isInputLocked ? '解除锁定' : '强制锁定输入'} sub="INPUT LOCK" color={isInputLocked ? 'bg-red-600' : 'bg-slate-900'} />
                        <TacticalButton disabled={processing && processing !== 'PUSH'} loading={processing === 'PUSH'} onClick={() => executeIntervention('PUSH', '话术提示', { text: '请注意服务态度...' })} icon={Send} label="发送话术提示" sub="MSG PUSH" color="bg-cyan-500" textColor="text-slate-950" />
                        <TacticalButton disabled={processing && processing !== 'VOICE'} loading={processing === 'VOICE'} onClick={() => executeIntervention('VOICE', '语音警报')} icon={Mic} label="语音警报" sub="AUDIO ALERT" color="bg-white" textColor="text-red-600" border="border-2 border-red-100" />
                        <TacticalButton disabled={processing && processing !== 'SOP'} loading={processing === 'SOP'} onClick={() => executeIntervention('SOP', '推送规范')} icon={FileText} label="推送业务规范" sub="SOP PUSH" color="bg-white" textColor="text-slate-900" border="border-2 border-slate-100" />
                     </div>
                  </section>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                     <section className="space-y-4">
                        <div className="flex justify-between items-center ml-2"><h5 className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.4em] flex items-center gap-2"><MonitorStop size={16} /> 实时屏幕监听 (只读)</h5><span className={cn("text-[9px] font-black uppercase italic", activeAgent.is_online ? "text-emerald-500 animate-pulse" : "text-slate-300")}>{activeAgent.is_online ? '监听传输中' : '脱机'}</span></div>
                        <div className="bg-slate-950 rounded-[32px] p-2 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden min-h-[340px] flex items-center justify-center">
                           <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                           {screenShot ? (
                              <img src={screenShot} className="max-w-full max-h-full rounded-2xl object-contain relative z-10 shadow-2xl border border-white/10" alt="Screen" />
                           ) : (
                              <div className="space-y-4 relative z-10 font-sans">
                                 {liveChat.length === 0 ? (<div className="h-40 flex items-center justify-center text-slate-700 italic text-sm font-bold">暂无实时对话流载荷</div>) : liveChat.map((chat, idx) => (
                                   <div key={idx} className="flex gap-4 text-xs"><span className="text-slate-500 font-bold shrink-0 mt-2 uppercase">RAW:</span><span className="text-white/90 bg-white/5 px-4 py-2 rounded-xl rounded-tl-none border border-white/5 backdrop-blur-md italic">"{chat.text}"</span></div>
                                 ))}
                                 {activeAgent.is_online && <div className="flex items-center gap-2 text-[10px] text-slate-500 italic"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> 通讯链路正常</div>}
                              </div>
                           )}
                        </div>
                     </section>
                     <section className="p-8 bg-slate-900 text-white rounded-[32px] relative overflow-hidden shadow-2xl"><div className="absolute top-0 right-0 p-8 opacity-10"><BrainCircuit size={100} /></div><h5 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><BrainCircuit size={16} /> 智脑辅助决策</h5><p className="text-sm font-medium text-slate-300 leading-relaxed italic relative z-10">"系统研判该成员目前对话风险较低。若触发违规词，请使用右侧<span className="text-cyan-400 font-black underline underline-offset-4 mx-1">‘强制锁定’</span>阻断沟通。"</p></section>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-200 gap-12 p-20 text-center italic uppercase font-black"><div className="relative"><Radar size={160} strokeWidth={0.5} className="opacity-10 animate-spin-slow text-cyan-500" /><div className="absolute inset-0 flex items-center justify-center"><Activity size={48} className="text-cyan-400 opacity-20 animate-pulse" /></div></div><div className="space-y-4"><p className="text-2xl tracking-[0.5em] text-slate-300">等待选择成员</p><p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-sm mx-auto">请在左侧列表中选中监控对象<br/>开启实时指挥链路</p></div></div>
              )}
           </AnimatePresence>
        </div>
      </main>
      <style>{`.animate-spin-slow { animation: spin 10s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .bg-grid-white\/\[0.02\] { background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 30px 30px; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }`}</style>
    </div>
  )
}

function StatBox({ label, value, color }: any) {
  return (
    <div className="bg-slate-50/50 px-6 py-3 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[100px] shadow-inner">
       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
       <span className={cn("text-xl font-black italic", color)}>{value}</span>
    </div>
  )
}

function TacticalButton({ onClick, icon: Icon, label, sub, color, textColor = 'text-white', border, active, disabled, loading }: any) {

  return (

    <motion.button disabled={disabled || loading} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={onClick} className={cn("flex flex-col items-center justify-center gap-3 p-6 rounded-[32px] transition-all shadow-xl group disabled:opacity-20 relative overflow-hidden", color, border, textColor)}>

       {loading ? <Loader2 size={28} className="animate-spin" /> : <Icon size={28} strokeWidth={2.5} className={cn("transition-transform group-hover:scale-110", active && "animate-bounce")} />}

       <div className="text-center"><p className="text-xs font-black uppercase tracking-tighter leading-none mb-1">{label}</p><p className="text-[8px] font-bold opacity-40 uppercase tracking-widest font-mono">{sub}</p></div>

    </motion.button>

  )

}
