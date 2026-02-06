import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, ShieldAlert, Activity, Radio, MessageSquare, 
  Zap, BrainCircuit, Mic, FileText, ArrowUpRight,
  Loader2, CheckCircle2, Lock, Unlock, Send,
  X, RefreshCw, AlertTriangle, TrendingDown, BellRing,
  Search, Filter, ChevronDown, MonitorStop, Globe, ShieldCheck,
  Power, PowerOff, Cpu, Radar, Shield, Maximize2, MonitorPlay, MonitorX,
  Wifi, WifiOff, Clock
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

// 1. 状态样式标准 (V3.18: 极致全屏与交互加固版)
const getAgentStatusTheme = (score: number, isOnline: boolean, roleId: number) => {
  if (!isOnline) return { border: 'border-slate-200', bg: 'bg-slate-100', text: 'text-slate-400', label: '离线', dot: 'bg-slate-300' }
  const isManagement = roleId === ROLE_ID.HQ || roleId === ROLE_ID.ADMIN;
  if (!isManagement && score < 60) return { border: 'border-red-500', bg: 'bg-red-50/50', text: 'text-red-600', label: '风险', dot: 'bg-red-500 animate-ping' }
  return { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: '在线', dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]' }
}

const RoleBadge = ({ roleId, roleName }: { roleId: number, roleName: string }) => {
  const themes: Record<number, string> = {
    [ROLE_ID.HQ]: "bg-amber-500/10 text-amber-600 border-amber-200/50",
    [ROLE_ID.ADMIN]: "bg-cyan-600/10 text-cyan-700 border-cyan-200/50",
    [ROLE_ID.AGENT]: "bg-slate-100 text-slate-600 border-slate-200"
  }
  return (
    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-tighter", themes[roleId] || themes[ROLE_ID.AGENT])}>
      {roleName || (roleId === ROLE_ID.HQ ? '总部' : (roleId === ROLE_ID.ADMIN ? '主管' : '坐席'))}
    </span>
  )
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
  
  // 链路控制
  const [isLinkEnabled, setIsLinkEnabled] = useState(true)
  const [isMaximized, setIsMaximized] = useState(false)
  const [lastFrameTime, setLastFrameTime] = useState<number>(0)
  
  const isHQ = user?.role_id === ROLE_ID.HQ || user?.role_code === 'HQ'

  const fetchDepts = async () => {
    if (!isHQ || !token) return
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?size=100`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      if (res.status === 200) setDepts(res.data.data)
    } catch (e) { console.error(e) }
  }

  const fetchData = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/agents?search=${search}&dept_id=${deptId}&_t=${Date.now()}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      if (res.status === 200) {
        const sorted = [...res.data.data].sort((a, b) => {
          if (a.is_online !== b.is_online) return a.is_online ? -1 : 1
          if (a.role_id !== b.role_id) return b.role_id - a.role_id
          return 0
        })
        setAgents(sorted)
        if (activeAgent) {
          const updated = sorted.find((a: any) => a.username === activeAgent.username)
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
      if (!isLinkEnabled) return;
      const msg = e.detail
      if (activeAgent && msg.username === activeAgent.username) {
        setLiveChat(prev => [...prev.slice(-15), { sender: 'USR', text: msg.content, time: new Date().toLocaleTimeString() }])
      }
    }
    const onNodeSync = () => fetchData(true)
    const onScreenSync = (e: any) => {
      if (!isLinkEnabled) return;
      const data = e.detail;
      if (activeAgent && data.username === activeAgent.username && data.payload) {
        setScreenShot(data.payload)
        setLastFrameTime(Date.now())
      }
    }
    window.addEventListener('ws-live-chat', onLiveChat)
    window.addEventListener('ws-tactical-node-sync', onNodeSync)
    window.addEventListener('ws-screen-sync', onScreenSync)
    return () => {
      window.removeEventListener('ws-live-chat', onLiveChat)
      window.removeEventListener('ws-tactical-node-sync', onNodeSync)
      window.removeEventListener('ws-screen-sync', onScreenSync)
    }
  }, [activeAgent, isLinkEnabled])

  const toggleLink = () => {
    const nextState = !isLinkEnabled;
    setIsLinkEnabled(nextState);
    if (!nextState) {
      setScreenShot(null); 
      setLastFrameTime(0);
    }
  }

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
    } finally { setProcessing(null) }
  }

  const onlineCount = agents.filter(a => a.is_online).length
  const offlineCount = agents.length - onlineCount

  return (
    <div className="flex flex-col h-full font-sans bg-slate-50/50 p-4 lg:p-6 gap-6 overflow-hidden text-black">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-600/20"><Radar size={20} className="text-white" /></div>
          <div><h2 className="text-2xl font-black text-black italic tracking-tighter uppercase leading-none">成员实时监控</h2><div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span className="flex items-center gap-1 text-emerald-600 font-black"><Globe size={10}/> 实时链路已挂载</span></div></div>
        </div>
        <div className="flex items-center gap-4">
           {isHQ && (
             <div className="w-56">
               <TacticalSelect options={[{id: '', name: '所有部门'}, ...depts]} value={deptId} onChange={(val: string | number) => setDeptId(String(val))} placeholder="按部门筛选" />
             </div>
           )}
           <div className="flex gap-2">
              <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex flex-col items-center min-w-[80px]">
                 <span className="text-[9px] font-black text-emerald-600 uppercase">在线人数</span>
                 <span className="text-lg font-black text-emerald-700">{onlineCount}</span>
              </div>
              <div className="bg-cyan-50 px-4 py-2 rounded-xl border border-cyan-100 flex flex-col items-center min-w-[80px]">
                 <span className="text-[9px] font-black text-cyan-600 uppercase">离线人数</span>
                 <span className="text-lg font-black text-cyan-700">{offlineCount}</span>
              </div>
           </div>
        </div>
      </header>

      <main className="flex-1 flex gap-6 min-h-0">
        <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
           <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-cyan-700 uppercase tracking-widest flex items-center gap-2"><Radio size={12} className="text-cyan-600 animate-pulse" /> 成员监控矩阵</h3>
                 <button onClick={() => fetchData()} className="p-2 bg-cyan-50 text-cyan-600 rounded-xl hover:bg-cyan-100 transition-all border border-cyan-100 group">
                    <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                 </button>
              </div>
              <TacticalSearch value={search} onChange={setSearch} placeholder="搜索成员姓名..." />
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <TacticalTable headers={['成员', '部门', '状态', '评分', '身份']}>
                {agents.map(a => {
                  const theme = getAgentStatusTheme(a.tactical_score, a.is_online, a.role_id);
                  const isActive = activeAgent?.username === a.username;
                  return (
                    <tr key={a.username} onClick={() => { setActiveAgent(a); setLiveChat([]); setScreenShot(null); setLastFrameTime(0); }} className={cn("cursor-pointer transition-all duration-300", isActive ? "bg-cyan-600/10 text-cyan-900" : "hover:bg-cyan-50/50 text-black")}>
                      <td className="px-4 py-3 text-left"><div className="flex items-center gap-2"><div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all", a.is_online ? "bg-emerald-500/10 text-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "bg-slate-100 text-slate-400")}>{a.real_name[0]}</div><span className="text-[11px] font-black truncate">{a.real_name}</span></div></td>
                      <td className="px-2 py-3 text-center"><span className="text-[10px] font-bold text-slate-500 uppercase">{a.dept_name || '未分配'}</span></td>
                      <td className="px-2 py-3 text-center"><div className="flex justify-center items-center gap-1.5"><div className={cn("w-1.5 h-1.5 rounded-full transition-all", theme.dot)} /><span className={cn("text-[9px] font-black uppercase", isActive ? "text-cyan-700" : "text-slate-500")}>{theme.label}</span></div></td>
                      <td className="px-2 py-3 text-center"><span className={cn("text-[10px] font-black", a.tactical_score < 60 && a.role_id === ROLE_ID.AGENT ? "text-red-500" : (isActive ? "text-cyan-700" : "text-cyan-600"))}>{a.role_id === ROLE_ID.AGENT ? a.tactical_score : '-'}</span></td>
                      <td className="px-4 py-3 text-center"><RoleBadge roleId={a.role_id} roleName={a.role_name} /></td>
                    </tr>
                  )
                })}
              </TacticalTable>
           </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden text-black">
           <AnimatePresence mode='wait'>
              {activeAgent ? (
                <motion.div key={activeAgent.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
                  <section className="p-6 border-b border-slate-100 bg-cyan-50/20 shrink-0">
                     <div className="flex items-center justify-between mb-4">
                        <h5 className="text-[10px] font-black text-cyan-800 uppercase tracking-widest flex items-center gap-2"><Cpu size={14}/> 实时干预矩阵</h5>
                        <div className="flex items-center gap-2">
                           <RoleBadge roleId={activeAgent.role_id} roleName={activeAgent.role_name} />
                           <span className="text-[9px] font-bold text-cyan-600 italic font-mono uppercase">Node: {activeAgent.real_name}</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-4 gap-4">
                        <CommandBtn active={isInputLocked} loading={processing === 'LOCK'} onClick={() => executeIntervention('LOCK', isInputLocked ? '解锁' : '锁定')} icon={isInputLocked ? Unlock : Lock} label={isInputLocked ? '解除锁定' : '强制锁定'} color={isInputLocked ? 'bg-red-600/90 text-white' : 'bg-cyan-700/90 text-white'} />
                        <CommandBtn loading={processing === 'PUSH'} onClick={() => executeIntervention('PUSH', '话术提示')} icon={Send} label="话术提示" color="bg-emerald-600/10 text-emerald-700 border border-emerald-100" />
                        <CommandBtn loading={processing === 'VOICE'} onClick={() => executeIntervention('VOICE', '语音警报')} icon={Mic} label="语音警报" color="bg-red-50/80 text-red-600 border border-red-100" />
                        <CommandBtn loading={processing === 'SOP'} onClick={() => executeIntervention('SOP', '推送规范')} icon={FileText} label="业务规范" color="bg-white text-cyan-700 border border-cyan-100" />
                     </div>
                  </section>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                     <section className="space-y-3">
                        <div className="flex items-center justify-between">
                           <h5 className="text-[10px] font-black text-cyan-700 uppercase tracking-widest flex items-center gap-2"><MonitorStop size={14} /> 实时桌面链路 (只读)</h5>
                           <div className="flex items-center gap-2">
                              {isLinkEnabled && lastFrameTime > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-bold text-slate-500 border border-slate-200">
                                   <Clock size={10} /> 延时: {Math.max(0, Date.now() - lastFrameTime)}ms
                                </div>
                              )}
                              <button onClick={toggleLink} className={cn("px-3 py-1 rounded-lg text-[9px] font-black flex items-center gap-1.5 transition-all shadow-sm border", isLinkEnabled ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100")}>
                                 {isLinkEnabled ? <><MonitorPlay size={12}/> 链路已激活</> : <><MonitorX size={12}/> 链路已挂断</>}
                              </button>
                              <button onClick={() => setIsMaximized(true)} disabled={!isLinkEnabled || !screenShot} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-cyan-50 hover:text-cyan-600 transition-all border border-slate-200 disabled:opacity-30 cursor-pointer"><Maximize2 size={14} /></button>
                           </div>
                        </div>
                        <div className="bg-slate-950 rounded-2xl p-1.5 min-h-[300px] flex items-center justify-center relative overflow-hidden border border-slate-200 shadow-inner group">
                           {!isLinkEnabled ? (
                              <div className="flex flex-col items-center gap-3 opacity-40"><MonitorX size={40} className="text-slate-500" /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">链路已手动断开</p></div>
                           ) : activeAgent.is_online === 0 ? (
                              <div className="flex flex-col items-center gap-3 opacity-40"><WifiOff size={40} className="text-slate-500" /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">成员离线，无法建立桌面链路</p></div>
                           ) : screenShot ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                 <img src={screenShot} className="max-w-full max-h-full rounded-xl object-contain relative z-10" alt="Screen" />
                                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none"><span className="bg-black/60 text-white px-4 py-2 rounded-full text-xs font-black border border-white/10 uppercase tracking-widest flex items-center gap-2"><Globe size={12} className="animate-pulse" /> 实时注入中</span></div>
                              </div>
                           ) : (
                              <div className="flex flex-col items-center gap-4">
                                 <div className="relative"><div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" /><Wifi size={20} className="absolute inset-0 m-auto text-cyan-500 animate-pulse" /></div>
                                 <div className="text-center space-y-1"><p className="text-cyan-500 text-xs font-black uppercase tracking-widest">物理链路正在建立</p><p className="text-slate-500 text-[9px] font-bold uppercase">正在等待远程节点推送数据流...</p></div>
                              </div>
                           )}
                        </div>
                     </section>
                     <section className="p-6 bg-cyan-600 text-white rounded-2xl relative overflow-hidden shadow-lg shadow-cyan-600/20"><div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit size={60} /></div><h5 className="text-[9px] font-black text-cyan-100 uppercase tracking-widest mb-3">智脑辅助决策系统</h5><p className="text-xs font-bold text-white leading-relaxed italic relative z-10">"系统正在实时评估对话逻辑。该链路已锚定，数据流表现正常。"</p></section>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-cyan-100 gap-8 p-10 text-center uppercase font-black italic">
                  <div className="w-32 h-32 bg-cyan-50 rounded-full flex items-center justify-center shadow-inner"><Radar size={100} className="text-cyan-200 animate-pulse" /></div>
                  <div className="space-y-2"><p className="text-xl tracking-widest text-cyan-600">等待选择监控目标</p><p className="text-[9px] font-bold text-cyan-400 tracking-[0.3em]">Smart-CS Pro Command Center</p></div>
                </div>
              )}
           </AnimatePresence>
        </div>
      </main>

      {/* V3.18: 真全屏遮罩层 - 强制最高 z-index 覆盖侧边栏 */}
      <AnimatePresence>
         {isMaximized && screenShot && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col"
            >
               {/* 顶部悬浮控制条 - 增加 z-index 与 pointer-events */}
               <div className="absolute top-0 left-0 right-0 z-[10000] flex justify-between items-center p-8 pointer-events-none">
                  <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
                     <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg"><MonitorPlay size={24} className="text-white" /></div>
                     <div><h4 className="text-white font-black text-base uppercase leading-none">实战全屏监听链路</h4><p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest mt-1">目标: {activeAgent.real_name} · 1:1 物理采样</p></div>
                  </div>
                  <div className="flex items-center gap-4 pointer-events-auto">
                     <div className="bg-emerald-500/20 px-4 py-3 rounded-2xl border border-emerald-500/30 flex items-center gap-2 text-[10px] font-black text-emerald-500 animate-pulse uppercase"><Activity size={14} /> LIVE</div>
                     <button 
                        onClick={() => setIsMaximized(false)} 
                        className="p-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all shadow-2xl active:scale-95 cursor-pointer flex items-center justify-center border border-red-400"
                     >
                        <X size={28} strokeWidth={3} />
                     </button>
                  </div>
               </div>
               
               {/* 彻底拉满空间，移除一切边距干扰 */}
               <div className="flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
                  <img 
                    src={screenShot} 
                    className="w-full h-full object-contain pointer-events-none select-none" 
                    style={{ imageRendering: 'auto' } as any}
                    alt="Full View" 
                  />
                  {/* 底层水印防止录屏 */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap gap-20 p-20 overflow-hidden text-white font-black text-2xl uppercase italic">
                     {Array(20).fill(`SmartCS PRO - ${activeAgent.username}`).map((t, i) => <span key={i} className="rotate-[-25deg] whitespace-nowrap">{t}</span>)}
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  )
}

function CommandBtn({ onClick, icon: Icon, label, color, active, loading }: any) {
  return (
    <button onClick={onClick} disabled={loading} className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-30 group", color)}>
       {loading ? <Loader2 size={20} className="animate-spin" /> : <Icon size={20} className={cn("group-hover:scale-110 transition-transform", active && "animate-bounce")} />}
       <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
    </button>
  )
}