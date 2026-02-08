import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, ShieldAlert, Activity, Radio, MessageSquare, 
  Zap, BrainCircuit, Mic, FileText, ArrowUpRight,
  Loader2, CheckCircle2, Lock, Unlock, Send,
  X, RefreshCw, AlertTriangle, TrendingDown, BellRing,
  Search, Filter, ChevronDown, MonitorStop, Globe, ShieldCheck,
  Power, PowerOff, Cpu, Radar, Shield, Maximize2, MonitorPlay, MonitorX,
  Wifi, WifiOff, Clock, Camera, Download, Trash2, Tag, FileType, ExternalLink
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

// 1. 状态样式标准 (V3.19: 沉浸式监听版)
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
  const { isScreenMaximized, setIsScreenMaximized } = useRiskStore() 
  const [agents, setAgents] = useState<any[]>([])
  const [depts, setDepts] = useState<any[]>([])
  const [deptId, setDeptId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeAgent, setActiveAgent] = useState<any>(null)
  const [isInputLocked, setIsInputLocked] = useState(false)
  const [search, setSearch] = useState('')
  const [liveChat, setLiveChat] = useState<any[]>([])
  const [screenShot, setScreenShot] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  
  // V3.70: 全极速弹窗逻辑组件
  const [showScriptModal, setShowScriptModal] = useState(false)
  const [scriptSearch, setScriptSearch] = useState('')
  const [customMsg, setCustomMsg] = useState('')
  const [kbList, setKbList] = useState<any[]>([])
  const [kbLoading, setKbListLoading] = useState(false)

  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [voiceSearch, setVoiceSearch] = useState('')
  const [voiceList, setVoiceList] = useState<any[]>([])
  const [voiceLoading, setVoiceLoading] = useState(false)

  const [showSopModal, setShowSopModal] = useState(false)
  const [sopSearch, setSopSearch] = useState('')
  const [sopList, setSopList] = useState<any[]>([])
  const [sopLoading, setSopLoading] = useState(false)

  const isHQ = user?.role_id === ROLE_ID.HQ || user?.role_code === 'HQ'

  // 数据预取与加速 (V3.70)
  const fetchKb = useCallback(async () => {
    if (!token) return
    setKbListLoading(true)
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/knowledge-base?size=100&search=${encodeURIComponent(scriptSearch)}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      if (res.status === 200) setKbList(res.data.data)
    } finally { setKbListLoading(false) }
  }, [token, scriptSearch])

  const fetchVoice = useCallback(async () => {
    if (!token) return
    setVoiceLoading(true)
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/voice-alerts?search=${encodeURIComponent(voiceSearch)}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      if (res.status === 200) setVoiceList(res.data.data)
    } finally { setVoiceLoading(false) }
  }, [token, voiceSearch])

  const fetchSop = useCallback(async () => {
    if (!token) return
    setSopLoading(true)
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sops?search=${encodeURIComponent(sopSearch)}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      if (res.status === 200) setSopList(res.data.data)
    } finally { setSopLoading(false) }
  }, [token, sopSearch])

  useEffect(() => {
    if (showScriptModal) { const t = setTimeout(() => fetchKb(), 150); return () => clearTimeout(t); }
  }, [scriptSearch, showScriptModal, fetchKb])

  useEffect(() => {
    if (showVoiceModal) { const t = setTimeout(() => fetchVoice(), 150); return () => clearTimeout(t); }
  }, [voiceSearch, showVoiceModal, fetchVoice])

  useEffect(() => {
    if (showSopModal) { const t = setTimeout(() => fetchSop(), 150); return () => clearTimeout(t); }
  }, [sopSearch, showSopModal, fetchSop])

  const sendScript = async (answer: string) => {
    await executeIntervention('PUSH', '战术话术推送', { content: answer })
    setShowScriptModal(false); setCustomMsg('')
  }

  const sendVoice = async (content: string) => {
    await executeIntervention('VOICE', '语音战术警报', { content })
    window.api.callApi({ url: `${CONFIG.API_BASE}/ai/voice-alerts`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: { content } })
    setShowVoiceModal(false); setCustomMsg('')
  }

  const sendSop = async (sop: any) => {
    await executeIntervention('SOP', '业务规范推送', { ...sop })
    setShowSopModal(false)
  }

  // 极速渲染组件 (V3.70)
  const ScriptItem = useMemo(() => kbList.map(item => (
    <div key={item.id} onClick={() => sendScript(item.answer)} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-cyan-600 hover:text-white cursor-pointer transition-colors group active:scale-[0.98]">
       <div className="flex justify-between items-start mb-1">
          <span className="text-[11px] font-black group-hover:text-white flex items-center gap-2"><Tag size={10}/> {item.keyword}</span>
          <span className="px-1.5 py-0.5 bg-white/10 text-[8px] font-black rounded border border-current opacity-50 uppercase">{item.category__name}</span>
       </div>
       <p className="text-[11px] font-medium opacity-70 group-hover:opacity-100 line-clamp-1 italic">"{item.answer}"</p>
    </div>
  )), [kbList])

  const VoiceItem = useMemo(() => voiceList.map(item => (
    <button key={item.id} onClick={() => sendVoice(item.content)} className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-red-600 hover:text-white transition-all group active:scale-[0.98]">
       <div className="flex items-center gap-3 font-black text-xs uppercase tracking-tighter">
          <Mic size={14} className="opacity-50 group-hover:opacity-100" /> {item.content}
       </div>
    </button>
  )), [voiceList])

  const SopItem = useMemo(() => sopList.map(item => (
    <button key={item.id} onClick={() => sendSop(item)} className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-emerald-600 hover:text-white transition-all group active:scale-[0.98]">
       <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 font-black text-xs uppercase tracking-tighter">
             <FileText size={14} className="opacity-50 group-hover:opacity-100" /> {item.title}
          </div>
          <span className="px-2 py-0.5 bg-white/10 rounded text-[8px] uppercase">{item.sop_type}</span>
       </div>
    </button>
  )), [sopList])

  const handleCapture = () => {
    if (!screenShot || !activeAgent) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const padding = 40; const fontSize = Math.max(20, Math.floor(canvas.width / 40));
      ctx.font = `black ${fontSize}px sans-serif`;
      const timeStr = new Date().toLocaleString();
      const watermarkText = `取证人: ${user?.real_name} | 目标: ${activeAgent.real_name} | ${timeStr}`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; const metrics = ctx.measureText(watermarkText);
      const bgWidth = metrics.width + padding * 2; const bgHeight = fontSize + padding;
      ctx.fillRect(canvas.width - bgWidth, canvas.height - bgHeight, bgWidth, bgHeight);
      ctx.fillStyle = 'white'; ctx.textBaseline = 'middle';
      ctx.fillText(watermarkText, canvas.width - bgWidth + padding, canvas.height - bgHeight / 2);
      setCapturedImage(canvas.toDataURL('image/png')); setIsScreenMaximized(true);
      toast.success('证据快照已生成');
    };
    img.src = screenShot;
  }

  const closeCapturePreview = () => { setCapturedImage(null); setIsScreenMaximized(false); }
  const downloadCapture = () => { if (!capturedImage) return; const link = document.createElement('a'); link.href = capturedImage; link.download = `Evidence_${activeAgent?.real_name}.png`; link.click(); }
  
  const [isLinkEnabled, setIsLinkEnabled] = useState(true)
  const [lastFrameTime, setLastFrameTime] = useState<number>(0)
  
  const fetchDepts = async () => { if (!isHQ || !token) return; try { const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?size=100`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }); if (res.status === 200) setDepts(res.data.data); } catch (e) { console.error(e) } }
  const fetchData = async (silent = false) => { if (!token) return; if (!silent) setLoading(true); try { const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/agents?search=${search}&dept_id=${deptId}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }); if (res.status === 200) { const sorted = [...res.data.data].sort((a, b) => { if (a.is_online !== b.is_online) return a.is_online ? -1 : 1; return 0; }); setAgents(sorted); if (activeAgent) { const updated = sorted.find((a: any) => a.username === activeAgent.username); if (updated) setActiveAgent(updated); } } } catch (e) { console.error(e) } finally { setLoading(false) } }

  // V3.76: 格式化最后活动时间
  const formatLastActivity = (timestamp: number | null) => {
    if (!timestamp) return <span className="opacity-20 font-black italic">从未活动</span>;
    const diff = Math.floor(Date.now() / 1000) - timestamp;
    if (diff < 60) return <span className="text-emerald-600 font-black animate-pulse flex items-center justify-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase text-[9px]"><Activity size={10}/> 刚才</span>;
    if (diff < 300) return <span className="text-cyan-600 font-black uppercase text-[10px]">{Math.floor(diff / 60)} 分钟前</span>;
    if (diff < 3600) return <span className="text-slate-500 font-bold uppercase text-[10px]">{Math.floor(diff / 60)} 分钟前</span>;
    if (diff < 86400) return <span className="text-red-400 font-bold italic uppercase text-[10px]">{Math.floor(diff / 3600)} 小时前</span>;
    return <span className="text-red-600 font-black italic tracking-tighter uppercase text-[9px]">超过1天</span>;
  };

  // V3.70: 极速渲染协议 - 成员矩阵缓存
  const AgentItems = useMemo(() => {
    return agents.map(a => {
      const theme = getAgentStatusTheme(a.tactical_score, a.is_online, a.role_id);
      const isActive = activeAgent?.username === a.username;
      return (
        <tr key={a.username} onClick={() => { setActiveAgent(a); setLiveChat([]); setScreenShot(null); setLastFrameTime(0); }} className={cn("cursor-pointer transition-all duration-300", isActive ? "bg-cyan-600/10 text-cyan-900" : "hover:bg-cyan-50/50 text-black")}>
          <td className="px-4 py-3 text-left"><div className="flex items-center gap-2"><div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all", a.is_online ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-400")}>{a.real_name[0]}</div><span className="text-[11px] font-black truncate">{a.real_name}</span></div></td>
          <td className="px-2 py-3 text-center"><span className="text-[10px] font-bold text-slate-500 uppercase">{a.dept_name || '未分配'}</span></td>
          <td className="px-2 py-3 text-center"><div className="flex justify-center items-center gap-1.5"><div className={cn("w-1.5 h-1.5 rounded-full transition-all", theme.dot)} /><span className={cn("text-[9px] font-black uppercase", isActive ? "text-cyan-700" : "text-slate-500")}>{theme.label}</span></div></td>
          <td className="px-2 py-3 text-center"><span className={cn("text-[10px] font-black", isActive ? "text-cyan-700" : "text-slate-600")}>{formatLastActivity(a.last_activity)}</span></td>
          <td className="px-4 py-3 text-center"><RoleBadge roleId={a.role_id} roleName={a.role_name} /></td>
        </tr>
      );
    });
  }, [agents, activeAgent?.username]);

  useEffect(() => { fetchDepts() }, [token])
  useEffect(() => { fetchData() }, [search, deptId, token])

  useEffect(() => {
    const onNodeSync = () => fetchData(true)
    const onScreenSync = (e: any) => { if (!isLinkEnabled) return; const data = e.detail; if (activeAgent && data.username === activeAgent.username && data.payload) { setScreenShot(data.payload); setLastFrameTime(Date.now()); } }
    window.addEventListener('ws-tactical-node-sync', onNodeSync)
    window.addEventListener('ws-screen-sync', onScreenSync)
    return () => { window.removeEventListener('ws-tactical-node-sync', onNodeSync); window.removeEventListener('ws-screen-sync', onScreenSync); }
  }, [activeAgent, isLinkEnabled])

  const toggleLink = () => { const nextState = !isLinkEnabled; setIsLinkEnabled(nextState); if (!nextState) { setScreenShot(null); setLastFrameTime(0); setIsScreenMaximized(false); } }

  const executeIntervention = async (type: string, description: string, payload: any = {}) => {
    if (!activeAgent || !token || processing) return
    setProcessing(type)
    try {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/command`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: { username: activeAgent.username, type, payload } })
      if (res.status === 200 || res.data?.status === 'ok') { if (type === 'LOCK') setIsInputLocked(!isInputLocked); toast.success('指令已送达'); }
    } finally { setProcessing(null) }
  }

  return (
    <div className="flex flex-col h-full font-sans bg-slate-50/50 p-4 lg:p-6 gap-6 overflow-hidden text-black">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-600/20"><Radar size={20} className="text-white" /></div>
          <div><h2 className="text-2xl font-black text-black italic tracking-tighter uppercase leading-none">成员实时监控</h2><div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span className="flex items-center gap-1 text-emerald-600 font-black"><Globe size={10}/> 链路控制台已激活</span></div></div>
        </div>
        <div className="flex items-center gap-4">
           {isHQ && (
             <div className="w-56">
               <TacticalSelect options={[{id: '', name: '所有部门'}, ...depts]} value={deptId} onChange={(val: string | number) => setDeptId(String(val))} placeholder="按部门筛选" />
             </div>
           )}
           <div className="flex gap-2">
              <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex flex-col items-center min-w-[80px]">
                 <span className="text-[9px] font-black text-emerald-600 uppercase">在线</span>
                 <span className="text-lg font-black text-emerald-700">{agents.filter(a => a.is_online).length}</span>
              </div>
              <div className="bg-cyan-50 px-4 py-2 rounded-xl border border-cyan-100 flex flex-col items-center min-w-[80px]">
                 <span className="text-[9px] font-black text-cyan-600 uppercase">离线</span>
                 <span className="text-lg font-black text-cyan-700">{agents.length - agents.filter(a => a.is_online).length}</span>
              </div>
           </div>
        </div>
      </header>

      <main className="flex-1 flex gap-6 min-h-0">
        <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden shrink-0">
           <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-cyan-700 uppercase tracking-widest flex items-center gap-2"><Radio size={12} className="text-cyan-600 animate-pulse" /> 成员监控矩阵</h3>
                 <button onClick={() => fetchData()} className="p-2 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100 group cursor-pointer hover:bg-cyan-100 transition-all active:scale-95"><RefreshCw size={14} className={cn(loading && "animate-spin")} /></button>
              </div>
              <TacticalSearch value={search} onChange={setSearch} placeholder="搜索成员姓名..." />
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <TacticalTable headers={['成员', '部门', '状态', '最后活动', '身份']}>
                {AgentItems}
              </TacticalTable>
           </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white/80 backdrop-blur-sm rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden text-black">
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
                        <CommandBtn active={isInputLocked} loading={processing === 'LOCK'} onClick={() => executeIntervention('LOCK', isInputLocked ? '解锁' : '锁定')} icon={isInputLocked ? Lock : Unlock} label={isInputLocked ? '锁定中' : '强制锁定'} color={isInputLocked ? 'bg-red-600 text-white shadow-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'} />
                        <CommandBtn loading={processing === 'PUSH'} onClick={() => setShowScriptModal(true)} onMouseEnter={() => !kbList.length && fetchKb()} icon={Send} label="话术提示" color="bg-emerald-600/10 text-emerald-700 border border-emerald-100" />
                        <CommandBtn loading={processing === 'VOICE'} onClick={() => setShowVoiceModal(true)} onMouseEnter={() => !voiceList.length && fetchVoice()} icon={Mic} label="语音警报" color="bg-red-50/80 text-red-600 border border-red-100" />
                        <CommandBtn loading={processing === 'SOP'} onClick={() => setShowSopModal(true)} onMouseEnter={() => !sopList.length && fetchSop()} icon={FileText} label="业务规范" color="bg-white text-cyan-700 border border-cyan-100" />
                     </div>
                  </section>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                     <section className="space-y-3">
                        <div className="flex items-center justify-between">
                           <h5 className="text-[10px] font-black text-cyan-700 uppercase tracking-widest flex items-center gap-2"><MonitorStop size={14} /> 实时桌面链路 (只读)</h5>
                           <div className="flex items-center gap-2">
                              {isLinkEnabled && lastFrameTime > 0 && ( <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-bold text-slate-500 border border-slate-200"><Clock size={10} /> 延时: {Math.max(0, Date.now() - lastFrameTime)}ms</div> )}
                              <button onClick={toggleLink} className={cn("px-3 py-1 rounded-lg text-[9px] font-black flex items-center gap-1.5 transition-all shadow-sm border cursor-pointer", isLinkEnabled ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100")}>{isLinkEnabled ? <><MonitorPlay size={12}/> 链路已激活</> : <><MonitorX size={12}/> 链路已挂断</>}</button>
                              <button onClick={handleCapture} disabled={!isLinkEnabled || !screenShot} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-cyan-50 hover:text-cyan-600 transition-all border border-slate-200 disabled:opacity-30 cursor-pointer" title="一键取证快照"><Camera size={14} /></button>
                              <button onClick={() => setIsScreenMaximized(true)} disabled={!isLinkEnabled || !screenShot} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-cyan-50 hover:text-cyan-600 transition-all border border-slate-200 disabled:opacity-30 cursor-pointer"><Maximize2 size={14} /></button>
                           </div>
                        </div>
                        <div className="bg-slate-950 rounded-2xl p-1.5 min-h-[300px] flex items-center justify-center relative overflow-hidden border border-slate-200 shadow-inner group">
                           {!isLinkEnabled ? ( <div className="flex flex-col items-center gap-3 opacity-40"><MonitorX size={40} className="text-slate-500" /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">链路已手动断开</p></div>
                           ) : activeAgent.is_online === 0 ? ( <div className="flex flex-col items-center gap-3 opacity-40"><WifiOff size={40} className="text-slate-500" /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">成员离线，无法建立桌面链路</p></div>
                           ) : screenShot ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                 <img src={screenShot} className="max-w-full max-h-full rounded-xl object-contain relative z-10" style={{ imageRendering: 'pixelated' } as any} alt="Screen" />
                                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none"><span className="bg-black/60 text-white px-4 py-2 rounded-full text-xs font-black border border-white/10 uppercase tracking-widest flex items-center gap-2"><Globe size={12} className="animate-pulse" /> 实时注入中</span></div>
                              </div>
                           ) : ( <div className="flex flex-col items-center gap-4"><div className="relative"><div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" /><Wifi size={20} className="absolute inset-0 m-auto text-cyan-500 animate-pulse" /></div><div className="text-center space-y-1"><p className="text-cyan-500 text-xs font-black uppercase tracking-widest">物理链路正在建立</p><p className="text-slate-500 text-[9px] font-bold uppercase">正在等待远程节点推送数据流...</p></div></div> )}
                        </div>
                     </section>
                     <section className="p-6 bg-cyan-600 text-white rounded-2xl relative overflow-hidden shadow-lg shadow-cyan-600/20"><div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit size={60} /></div><h5 className="text-[9px] font-black text-cyan-100 uppercase tracking-widest mb-3">智脑辅助决策系统</h5><p className="text-xs font-bold text-white leading-relaxed italic relative z-10">"系统正在实时评估对话逻辑。该链路已锚定，数据流表现正常。"</p></section>
                  </div>
                </motion.div>
              ) : ( <div className="flex-1 flex flex-col items-center justify-center text-cyan-100 gap-8 p-10 text-center uppercase font-black italic"><div className="w-32 h-32 bg-cyan-50 rounded-full flex items-center justify-center shadow-inner"><Radar size={100} className="text-cyan-200 animate-pulse" /></div><div className="space-y-2"><p className="text-xl tracking-widest text-cyan-600">等待选择监控目标</p><p className="text-[9px] font-bold text-cyan-400 tracking-[0.3em]">Smart-CS Pro Command Center</p></div></div> )}
           </AnimatePresence>
        </div>
      </main>

      {/* 真全屏、截图预览、话术、语音、SOP 模态框 */}
      <AnimatePresence>
         {isScreenMaximized && screenShot && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-2xl flex flex-col overflow-hidden">
               <div className="absolute top-0 left-0 right-0 z-[10000] flex justify-between items-center p-8 pointer-events-none"><div className="flex items-center gap-4 bg-slate-900/90 px-6 py-3 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl"><div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg"><MonitorPlay size={24} className="text-white" /></div><div><h4 className="text-white font-black text-base uppercase leading-none">实战全屏观察链路</h4><p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest mt-1">成员: {activeAgent.real_name} · 1:1 物理采样</p></div></div><div className="flex items-center gap-4 pointer-events-auto"><div className="bg-emerald-500/20 px-4 py-3 rounded-2xl border border-emerald-500/30 flex items-center gap-2 text-[10px] font-black text-emerald-500 animate-pulse uppercase"><Activity size={14} /> LIVE</div><button onClick={() => setIsScreenMaximized(false)} className="p-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all shadow-2xl active:scale-95 cursor-pointer flex items-center justify-center border border-red-400 group"><X size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" /></button></div></div>
               <div className="flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden relative"><img src={screenShot} className="max-w-none w-screen h-screen object-contain pointer-events-none select-none" style={{ imageRendering: 'pixelated' } as any} alt="Full View" /></div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* 话术弹射 */}
      <AnimatePresence>
         {showScriptModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 text-black">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowScriptModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><div><h4 className="text-xl font-black text-black uppercase italic tracking-tighter">战术话术弹射</h4><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">推射至：{activeAgent?.real_name}</p></div><button onClick={() => setShowScriptModal(false)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 border border-transparent hover:border-slate-200"><X size={20}/></button></div>
                  <div className="p-6 bg-white shrink-0 space-y-4">
                     <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner"><input value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} placeholder="输入即兴战术指令..." className="flex-1 bg-transparent px-4 py-2 text-sm font-bold text-black outline-none" onKeyDown={(e) => e.key === 'Enter' && customMsg && sendScript(customMsg)} /><button onClick={() => customMsg && sendScript(customMsg)} disabled={!customMsg} className="px-6 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 disabled:opacity-20 transition-all flex items-center gap-2"><Send size={14}/> 瞬间弹射</button></div>
                     <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={scriptSearch} onChange={(e) => setScriptSearch(e.target.value)} placeholder="或搜索库中已有话术..." className="w-full pl-12 pr-6 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-cyan-600 transition-all outline-none" /></div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2 bg-white">{kbLoading ? <div className="flex flex-col items-center justify-center py-10 opacity-20"><Loader2 className="animate-spin mb-4" size={32} /><span className="text-[10px] font-black uppercase">同步中...</span></div> : kbList.length === 0 ? <div className="flex flex-col items-center justify-center py-10 opacity-20"><Zap size={32} className="mb-4" /><span className="text-[10px] font-black uppercase">未发现匹配</span></div> : ScriptItem}</div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* V3.70: 语音警报弹窗 */}
      <AnimatePresence>
         {showVoiceModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 text-black">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVoiceModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-8 border-b border-red-100 flex justify-between items-center bg-red-50/30"><div><h4 className="text-xl font-black text-red-600 uppercase italic tracking-tighter">语音战术警报</h4><p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">目标节点：{activeAgent?.real_name} · 实时合成播放</p></div><button onClick={() => setShowVoiceModal(false)} className="p-2 hover:bg-white rounded-xl transition-all text-red-300 border border-transparent hover:border-red-100"><X size={20}/></button></div>
                  <div className="p-6 bg-white shrink-0 space-y-4">
                     <div className="flex gap-2 p-1.5 bg-red-50 border border-red-100 rounded-2xl shadow-inner"><input autoFocus value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} placeholder="输入自定义语音警报文本..." className="flex-1 bg-transparent px-4 py-2 text-sm font-bold text-red-900 outline-none placeholder:text-red-300" onKeyDown={(e) => e.key === 'Enter' && customMsg && sendVoice(customMsg)} /><button onClick={() => customMsg && sendVoice(customMsg)} disabled={!customMsg} className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 disabled:opacity-20 transition-all flex items-center gap-2"><Mic size={14}/> 强制播放</button></div>
                     <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={voiceSearch} onChange={(e) => setVoiceSearch(e.target.value)} placeholder="从部门语音库选择..." className="w-full pl-12 pr-6 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-red-600 transition-all outline-none" /></div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2 bg-white">{voiceLoading ? <div className="flex flex-col items-center justify-center py-10 opacity-20"><Loader2 className="animate-spin mb-4" size={32} /></div> : voiceList.length === 0 ? <div className="flex flex-col items-center justify-center py-10 opacity-20 font-black uppercase text-[10px]">无预设语音</div> : VoiceItem}</div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* V3.70: 业务规范 (SOP) 弹窗 */}
      <AnimatePresence>
         {showSopModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 text-black">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSopModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-8 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/30"><div><h4 className="text-xl font-black text-emerald-700 uppercase italic tracking-tighter">业务规范推送</h4><p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">强制对齐：{activeAgent?.real_name} · 支持 MD/图片/文件</p></div><button onClick={() => setShowSopModal(false)} className="p-2 hover:bg-white rounded-xl transition-all text-emerald-300 border border-transparent hover:border-emerald-100"><X size={20}/></button></div>
                  <div className="p-6 bg-white shrink-0"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={sopSearch} onChange={(e) => setSopSearch(e.target.value)} placeholder="检索 SOP 指南名称..." className="w-full pl-12 pr-6 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-emerald-600 transition-all outline-none" /></div></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2 bg-white">{sopLoading ? <div className="flex flex-col items-center justify-center py-10 opacity-20"><Loader2 className="animate-spin mb-4" size={32} /></div> : sopList.length === 0 ? <div className="flex flex-col items-center justify-center py-10 opacity-20 font-black uppercase text-[10px]">无规范文档</div> : SopItem}</div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* 证据快照预览 */}
      <AnimatePresence>
         {capturedImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-10">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><div><h4 className="text-lg font-black text-black uppercase italic">证据快照预览</h4><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">已自动注入：{activeAgent?.real_name}</p></div><div className="flex gap-3"><button onClick={downloadCapture} className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-cyan-700 transition-all flex items-center gap-2 active:scale-95"><Download size={16} /> 下载</button><button onClick={closeCapturePreview} className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all active:scale-95"><X size={20} /></button></div></div>
                  <div className="flex-1 bg-slate-900 p-4 flex items-center justify-center overflow-hidden"><img src={capturedImage} className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" alt="Captured Evidence" /></div>
                  <div className="p-4 bg-white border-t border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Smart-CS Pro 数字化取证系统</p></div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  )
}

function CommandBtn({ onClick, onMouseEnter, icon: Icon, label, color, active, loading }: any) {
  return (
    <button onClick={onClick} onMouseEnter={onMouseEnter} disabled={loading} className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-30 group cursor-pointer", color)}>
       {loading ? <Loader2 size={20} className="animate-spin" /> : <Icon size={20} className={cn("group-hover:scale-110 transition-transform", active && "animate-bounce")} />}
       <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
    </button>
  )
}