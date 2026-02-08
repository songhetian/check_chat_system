import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban, Undo2,
  UserSearch, Layers, Star, Info, Link2, ScanEye, Crosshair, HelpCircle, ChevronsLeft, ChevronsRight, Loader2, Brain, PenTool, Send,
  AlertTriangle, ChevronDown, Check, RefreshCw, FileText, Download, ExternalLink, Mic, Clock, ShieldAlert
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { toast } from 'sonner'

export const TacticalIsland = () => {
  const { 
    isOnline, isGlassMode, setGlassMode,
    layoutMode, setLayoutMode, activeSideTool, setActiveSideTool,
    isCustomerHudEnabled, setCustomerHudEnabled,
    isOnboardingMode, setOnboardingMode, isMuted, setMuted, isLocked,
    sopHistory
  } = useRiskStore()
  
  const { user, logout, token } = useAuthStore()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFolded, setIsFolded] = useState(false) 
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)

  // 核心：战术实战状态 (V3.70: 全能战术版)
  const [content, setContent] = useState('') 
  const [isPushMode, setIsPushMode] = useState(false)
  const [isScratchpad, setIsScratchpad] = useState(false)
  const [isEvasionMode, setIsEvasionMode] = useState(false)
  const [isSopMode, setIsSopMode] = useState(false) // V3.70: SOP 模式
  const [isHistoryMode, setIsHistoryMode] = useState(false) // V3.88: 历史记录模式
  
  const [evasionInfo, setEvasionInfo] = useState<any>(null)
  const [sopInfo, setSopInfo] = useState<any>(null)
  const [selectedSentiment, setSelectedSentiment] = useState<any>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [hasOptimized, setHasOptimized] = useState(false)
  const [sentimentSearch, setSentimentSearch] = useState('')
  const [showSentimentDropdown, setShowSentimentDropdown] = useState(false)
  const [voicePulse, setVoicePulse] = useState(false) // 语音视觉脉冲
  const [voiceAlertText, setVoiceAlertText] = useState('') // V3.86: 语音视觉提示文案
  const [showVoiceAlertOverlay, setShowVoiceAlertOverlay] = useState(false) // 是否显示视觉提示

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: sentiments = [], refetch } = useQuery({
    queryKey: ['ai_sentiments_island_v3.61'],
    queryFn: async () => {
      const endpoints = [`http://localhost:8000/api/ai/sentiments`, `${CONFIG.API_BASE}/ai/sentiments`];
      for (const url of endpoints) {
        try {
          const res = await window.api.callApi({ url, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
          if (res.status === 200 && res.data?.data) return res.data.data
        } catch (e) {}
      }
      return []
    },
    enabled: !!token
  })

  // V3.88: 物理回溯 - 初始化拉取 Redis 指令历史
  useQuery({
    queryKey: ['sop_history_init'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/sop-history`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 200) {
        useRiskStore.getState().setSopHistory(res.data.data);
      }
      return res.data.data;
    },
    enabled: !!token,
    staleTime: Infinity // 仅初次加载
  })

  useEffect(() => { if (token) refetch(); }, [token])

  useEffect(() => {
    if (sentiments.length > 0 && !selectedSentiment) {
      const neutral = sentiments.find((s: any) => s.name.includes('中性') || s.id === 4) || sentiments[0]
      setSelectedSentiment(neutral)
    }
  }, [sentiments, selectedSentiment])

  const resetSpecialModes = () => {
    setIsPushMode(false); setIsScratchpad(false); setIsEvasionMode(false); setIsSopMode(false); setIsHistoryMode(false);
    setEvasionInfo(null); setSopInfo(null); setHasOptimized(false); setOptimizing(false); setVoicePulse(false);
  }

  // V3.70: 指令处理中心升级
  useEffect(() => {
    const onCommand = (e: any) => {
      const data = e.detail;
      
      if (data.type === 'TACTICAL_PUSH') {
        setContent(data.payload.content || '')
        setIsPushMode(true); setIsScratchpad(false); setIsEvasionMode(false); setIsSopMode(false);
      }
      
      if (data.type === 'TACTICAL_DEPT_VIOLATION') {
        setEvasionInfo(data)
        setIsEvasionMode(true); setIsPushMode(false); setIsScratchpad(false); setIsSopMode(false);
        window.api.callApi({ url: `http://localhost:8000/api/system/clear-input`, method: 'POST' })
      }

      if (data.type === 'TACTICAL_VOICE') {
        setVoicePulse(true)
        setVoiceAlertText(data.payload?.content || '收到指令推送')
        setShowVoiceAlertOverlay(true)
        
        // 5秒后自动关闭视觉提示
        setTimeout(() => {
          setVoicePulse(false)
          setShowVoiceAlertOverlay(false)
        }, 5000)
        
        // V3.71: 补全语音合成播放逻辑 (Web Speech API)
        if (!isMuted && data.payload?.content) {
          try {
            // 立即停止之前的播放，确保新指令优先
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(data.payload.content);
            utterance.lang = 'zh-CN';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.error('语音播报失败:', e);
          }
        }
      }

      if (data.type === 'TACTICAL_SOP') {
        const sopData = data.payload;
        if (!sopData || !sopData.content) {
          console.warn('⚠️ [指令中心] 接收到空负载 SOP');
          return;
        }
        
        setSopInfo(sopData)
        useRiskStore.getState().addSopHistory(sopData)
        setIsSopMode(true); setIsPushMode(false); setIsScratchpad(false); setIsEvasionMode(false);
      }
      
      window.electron.ipcRenderer.send('set-always-on-top', true)
    }
    window.addEventListener('ws-tactical-command', onCommand)
    return () => window.removeEventListener('ws-tactical-command', onCommand)
  }, [])

  const filteredSentiments = useMemo(() => sentiments.filter((s: any) => s.name.toLowerCase().includes(sentimentSearch.toLowerCase())), [sentiments, sentimentSearch])

  const optimizeScript = async () => {
    if (!content || !selectedSentiment || optimizing) return
    setOptimizing(true); setHasOptimized(false);
    const originalText = content;
    try {
      const serverConfig = await window.api.getServerConfig()
      const prompt = `请直接重写这段话术，使其语气更加${selectedSentiment.name}。规则：只输出重写后的一句话,不要有任何多余的解释。原文：${originalText}`;
      const response = await fetch(serverConfig.ai_engine.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: serverConfig.ai_engine.model, prompt, stream: true, options: { temperature: 0.1, num_predict: 128 } }) })
      if (!response.body) throw new Error('Stream missing')
      const reader = response.body.getReader(); const decoder = new TextDecoder();
      let fullText = ''; setContent(''); 
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.trim())
        for (const line of lines) {
          try {
            const json = JSON.parse(line); const token = json.response || json.message?.content
            if (token) {
              fullText += token
              setContent(fullText.replace(/^(好的|收到|明白了|理解了|优化后|回复如下|对话建议)[:：\s]*/g, '').replace(/^["'“](.*)["'”]$/g, '$1').trim())
            }
          } catch (e) {}
        }
      }
      setHasOptimized(true)
    } catch (e) { setContent(originalText); toast.error('AI 链路故障') } finally { setOptimizing(false) }
  }

  const copyAndClose = () => { if (!content || optimizing) return; navigator.clipboard.writeText(content); resetSpecialModes(); }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!hasOptimized && !optimizing) optimizeScript()
      else if (hasOptimized) copyAndClose()
    }
  }

  useEffect(() => {
    const active = isPushMode || isScratchpad || isEvasionMode || isSopMode
    if (!active) return
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (optimizing) { if (e.key === 'Enter') e.preventDefault(); return; }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        const btn = document.getElementById('main-action-btn')
        btn?.click()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isPushMode, isScratchpad, hasOptimized, optimizing, content, selectedSentiment])

  useEffect(() => {
    if (!isOnline && token) {
      // V3.73: 物理链路中断瞬间触发语音警报
      if (!isMuted) {
        try {
          const utterance = new SpeechSynthesisUtterance("警告：物理链路已中断，系统进入脱机模式");
          utterance.lang = 'zh-CN';
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }

      // V3.78: 脱机强制自愈展开 - 链路断开时，强制展开面板以显示警告，防止用户找不到入口
      if (isFolded) setIsFolded(false);
    }
  }, [isOnline])

  useEffect(() => {
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const active = isPushMode || isScratchpad || isEvasionMode || isSopMode || isHistoryMode || showVoiceAlertOverlay || isExpanded || showHelpModal
    let width = isFolded ? 80 : 800 
    let height = showHelpModal ? 480 : (isExpanded ? 564 : 72)
    let x: number | undefined, y: number | undefined, center = false

    if (isLocked) { width = screenWidth; height = screenHeight; x = 0; y = 0; } 
    else if (showVoiceAlertOverlay) { 
      width = screenWidth; height = screenHeight; x = 0; y = 0;
    }
    else if (isHistoryMode || isExpanded || showHelpModal) {
      // V3.88: 历史、面板、求助模式使用更大的居中窗口
      width = 1000; height = 650; center = true;
    }
    else if (layoutMode === 'SIDE') {
      width = 440; height = 850; x = screenWidth - 460; y = (screenHeight - 850) / 2;
    }
    else if (active) { width = 800; height = 350; x = screenWidth - 820; y = 30; } 
    else { x = isFolded ? screenWidth - 100 : screenWidth - 820; y = 30 }
    
    window.electron.ipcRenderer.send('resize-window', { width, height, center, x, y })
    window.electron.ipcRenderer.send('set-always-on-top', isLocked || active || showVoiceAlertOverlay || !showBigScreenModal)
    if (isScratchpad && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isExpanded, showHelpModal, showBigScreenModal, layoutMode, isFolded, isLocked, isPushMode, isScratchpad, isEvasionMode, isSopMode, isHistoryMode, showVoiceAlertOverlay])

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none bg-transparent text-black">
      <motion.div 
        layout
        animate={{ 
          width: isLocked ? window.screen.width : (layoutMode === 'SIDE' ? 440 : (showBigScreenModal ? 1280 : (isFolded ? 80 : 800))),
          height: isLocked ? window.screen.height : (layoutMode === 'SIDE' ? 850 : (showBigScreenModal ? 850 : (isPushMode || isScratchpad || isEvasionMode || isSopMode ? 350 : (showHelpModal ? 480 : (isExpanded ? 564 : 72)))))
        }}
        className={cn(
          "pointer-events-auto border border-white/10 flex flex-col overflow-hidden transition-all duration-500 relative shadow-2xl", 
          isGlassMode ? "bg-slate-950/60 backdrop-blur-3xl" : "bg-slate-950", 
          (showBigScreenModal || layoutMode === 'SIDE' || isLocked) ? "rounded-none" : "rounded-3xl",
          voicePulse && "ring-4 ring-red-500 ring-offset-4 ring-offset-slate-900 animate-pulse"
        )}
      >
        {isEvasionMode ? (
          <div className="flex-1 flex flex-col p-6 text-white overflow-hidden bg-amber-950/60">
             <div className="flex justify-between items-start shrink-0">
                <div className="flex items-center gap-3"><div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center shadow-2xl animate-bounce"><AlertTriangle size={16} className="text-black"/></div><h4 className="text-base font-black italic tracking-tighter uppercase text-amber-400">战术规避拦截</h4></div>
                <button onClick={resetSpecialModes} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2 font-black text-[10px] border border-white/10 text-amber-200"><Undo2 size={12}/> 关闭</button>
             </div>
             <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="text-3xl font-black text-white italic tracking-tighter underline decoration-amber-500">"{evasionInfo?.keyword}"</div>
                <div className="w-full max-w-sm p-4 bg-black/40 rounded-2xl border border-amber-500/30">
                   <p className="text-[10px] font-black text-amber-400 uppercase mb-1">修正建议</p>
                   <p className="text-sm font-medium italic text-white leading-relaxed">"{evasionInfo?.suggestion}"</p>
                </div>
             </div>
          </div>
        ) : isHistoryMode ? (
          <div className="flex-1 flex flex-col p-8 text-white overflow-hidden bg-slate-900/90">
             <div className="flex justify-between items-start mb-6 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse"><History size={24} className="text-white"/></div>
                   <div>
                      <h4 className="text-2xl font-black italic tracking-tighter uppercase text-cyan-400">战术指令历史中枢</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Command Transmission Archives</p>
                   </div>
                </div>
                <button onClick={resetSpecialModes} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-3 font-black text-xs border border-white/10 text-slate-300 transition-all active:scale-95"><Undo2 size={16}/> 返回主链路</button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {sopHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                     <Box size={80} strokeWidth={1} />
                     <p className="text-sm font-black uppercase tracking-widest">暂无指令记录存档</p>
                  </div>
                ) : (
                  sopHistory.map((sop: any) => (
                    <div key={sop.id} className="p-6 bg-white/[0.03] rounded-[24px] border border-white/5 hover:border-cyan-500/40 transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={60} /></div>
                       <div className="flex justify-between items-start mb-3 relative z-10">
                          <div>
                             <h5 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">{sop.title}</h5>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[9px] font-black uppercase tracking-tighter border border-cyan-500/30">源: {sop.commander || '指挥部'}</span>
                                <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1"><Clock size={10}/> {new Date(sop.timestamp).toLocaleString()}</span>
                             </div>
                          </div>
                       </div>
                       <p className="text-sm text-slate-400 line-clamp-2 mb-4 font-medium italic leading-relaxed border-l-2 border-white/10 pl-4">"{sop.content}"</p>
                       <div className="flex gap-3 relative z-10">
                          <button onClick={() => { setSopInfo(sop); setIsSopMode(true); setIsHistoryMode(false); }} className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition-all active:scale-95">调取详细规程</button>
                          {(sop.sop_type === 'FILE' || sop.sop_type === 'IMAGE') && (
                            <button onClick={() => window.open(sop.content)} className="px-6 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10"><Download size={12}/> 获取原始附件</button>
                          )}
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        ) : showHelpModal ? (
          <div className="flex-1 flex flex-col p-8 text-white overflow-hidden bg-red-950/80">
             <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce"><Hand size={32} className="text-white"/></div>
                   <div>
                      <h4 className="text-3xl font-black italic tracking-tighter uppercase text-red-500">紧急战术求助</h4>
                      <p className="text-[10px] font-black text-red-400/60 uppercase tracking-[0.4em]">Emergency Support Request</p>
                   </div>
                </div>
                <button onClick={() => setShowHelpModal(false)} className="p-3 bg-white/5 hover:bg-red-600 rounded-xl transition-all"><X size={24}/></button>
             </div>
             <div className="grid grid-cols-2 gap-6 flex-1">
                <HelpCard icon={ShieldAlert} title="遭受言语攻击" desc="客户存在极端情绪或人身攻击" onClick={() => { window.dispatchEvent(new CustomEvent('send-risk-msg', { detail: { type: 'EMERGENCY_HELP', subType: 'ATTACK', content: '请求介入：遭遇客户言语攻击' } })); setShowHelpModal(false); toast.success('求助信号已并发至所有主管'); }} />
                <HelpCard icon={Zap} title="业务知识盲区" desc="遇到无法回答的专业技术问题" onClick={() => { window.dispatchEvent(new CustomEvent('send-risk-msg', { detail: { type: 'EMERGENCY_HELP', subType: 'KNOWLEDGE', content: '请求支持：遇到业务知识盲区' } })); setShowHelpModal(false); toast.success('战术支援申请已发送'); }} />
                <HelpCard icon={BrainCircuit} title="复杂投诉处理" desc="需要高级别权限介入协调" onClick={() => { window.dispatchEvent(new CustomEvent('send-risk-msg', { detail: { type: 'EMERGENCY_HELP', subType: 'COMPLAINT', content: '紧急：需要主管介入处理投诉' } })); setShowHelpModal(false); toast.success('投诉升级指令已下发'); }} />
                <HelpCard icon={Activity} title="系统链路异常" desc="遭遇延迟、报错等物理故障" onClick={() => { window.dispatchEvent(new CustomEvent('send-risk-msg', { detail: { type: 'EMERGENCY_HELP', subType: 'SYSTEM', content: '异常上报：系统运行不稳定' } })); setShowHelpModal(false); toast.error('故障报告已提交至技术部'); }} />
             </div>
          </div>
        ) : isExpanded ? (
          <div className="flex-1 flex flex-col p-8 text-white overflow-hidden bg-slate-900/95">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-800 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner"><LayoutGrid size={24} className="text-cyan-400"/></div>
                   <h4 className="text-2xl font-black italic tracking-tighter uppercase">战术应用矩阵</h4>
                </div>
                <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><X size={20}/></button>
             </div>
             <div className="grid grid-cols-3 gap-6">
                <ToolItem icon={Monitor} title="实时态势感应" active={isCustomerHudEnabled} onClick={() => setCustomerHudEnabled(!isCustomerHudEnabled)} />
                <ToolItem icon={GraduationCap} title="战术自愈培训" active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} />
                <ToolItem icon={Ghost} title="全息外观切换" active={!isGlassMode} onClick={() => setGlassMode(!isGlassMode)} />
                <ToolItem icon={VolumeX} title="静默监听模式" active={isMuted} onClick={() => setMuted(!isMuted)} />
                <ToolItem icon={Maximize2} title="全景视野展开" onClick={() => { setShowBigScreenModal(true); setIsExpanded(false); }} />
                <ToolItem icon={LogOut} title="退出战术链路" color="text-red-500" onClick={() => { logout(); window.location.hash = '/login'; }} />
             </div>
          </div>
        ) : layoutMode === 'SIDE' ? (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
             <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h4 className="font-black text-white italic uppercase flex items-center gap-3">
                   {activeSideTool === 'PRODUCTS' ? <><Package size={18} className="text-cyan-400"/> 商品战术资料</> : <><BookOpen size={18} className="text-cyan-400"/> 业务实战手册</>}
                </h4>
                <button onClick={() => setLayoutMode('FLOAT')} className="p-2 hover:bg-white/10 rounded-xl text-slate-400"><X size={20}/></button>
             </div>
             <div className="flex-1 p-4 flex flex-col items-center justify-center opacity-30 gap-4">
                <Loader2 size={40} className="animate-spin text-cyan-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">正在拉取加密数据流...</p>
             </div>
          </div>
        ) : isSopMode ? (
          <div className="flex-1 flex flex-col p-6 text-white overflow-hidden bg-emerald-950/60">
             <div className="flex justify-between items-start mb-4 shrink-0">
                <div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg"><FileText size={16} className="text-black"/></div><h4 className="text-base font-black italic tracking-tighter uppercase text-emerald-400">业务规范指引</h4></div>
                <button onClick={resetSpecialModes} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2 font-black text-[10px] border border-white/10 text-emerald-200"><Undo2 size={12}/> 关闭</button>
             </div>
             <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="bg-black/40 p-5 rounded-2xl border border-emerald-500/20 flex-1 overflow-y-auto custom-scrollbar">
                   <h5 className="text-lg font-black text-emerald-50 mb-3">{sopInfo?.title}</h5>
                   {sopInfo?.sop_type === 'IMAGE' ? <img src={sopInfo.content} className="max-w-full rounded-lg shadow-2xl" /> : <p className="text-sm font-medium leading-relaxed opacity-80 whitespace-pre-wrap">{sopInfo?.content}</p>}
                </div>
                {(sopInfo?.sop_type === 'FILE' || sopInfo?.sop_type === 'IMAGE') && (
                  <button onClick={() => window.open(sopInfo.content)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-lg"><Download size={14}/> 下载/查看原件</button>
                )}
             </div>
          </div>
        ) : (isPushMode || isScratchpad) ? (
          <div className="flex-1 flex flex-col p-5 text-white overflow-hidden bg-slate-950/40">
             <div className="flex justify-between items-start mb-3 shrink-0">
                <div className="flex items-center gap-3"><div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl", isPushMode ? "bg-cyan-600" : "bg-emerald-600", optimizing && "animate-pulse")}>{isPushMode ? <Sparkles size={20}/> : <PenTool size={20}/>}</div><h4 className="text-lg font-black italic tracking-tighter uppercase">{isPushMode ? '指挥部支援' : '战术草稿箱'}</h4></div>
                <button onClick={resetSpecialModes} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 font-black text-[10px] border border-white/10 text-slate-300"><Undo2 size={14}/> 退出</button>
             </div>
             <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex-1 bg-black rounded-2xl border border-white/10 relative group shadow-inner transition-all overflow-hidden">
                   <AnimatePresence>{optimizing && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2"><Loader2 className="animate-spin text-cyan-500" size={24} /><span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">AI 注入中...</span></motion.div> )}</AnimatePresence>
                   <textarea ref={inputRef} value={content} onChange={(e) => { setContent(e.target.value); setHasOptimized(false); }} onKeyDown={handleKeyDown} placeholder="输入内容并回车优化..." className="w-full h-full bg-transparent px-5 py-5 text-sm font-bold leading-relaxed text-white resize-none outline-none custom-scrollbar" />
                </div>
                <div className="flex items-center gap-2 h-14 shrink-0">
                   <div className="relative flex-1 h-full" ref={dropdownRef}>
                      <button onClick={() => setShowSentimentDropdown(!showSentimentDropdown)} className="w-full h-full px-4 flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
                         <div className="flex items-center gap-2"><Brain size={14} className={cn(selectedSentiment ? `text-${selectedSentiment.color}-400 shadow-[0_0_8px_rgba(0,0,0,0.5)]` : "text-slate-400")} /><span className="text-[10px] font-black text-white truncate">{selectedSentiment?.name || '情绪加载中...'}</span></div>
                         <div className="flex items-center gap-2"><ChevronDown size={12} className="text-slate-500 transition-transform" /><button onClick={(e)=>{e.stopPropagation(); refetch();}} className="p-1 text-cyan-500 hover:rotate-180 transition-all"><RefreshCw size={10}/></button></div>
                      </button>
                      <AnimatePresence>{showSentimentDropdown && ( <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute bottom-full left-0 right-0 mb-3 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"><div className="p-2.5 bg-white/5 border-b border-white/5 flex gap-2"><Search size={10} className="mt-2.5 text-slate-500" /><input autoFocus value={sentimentSearch} onChange={(e) => setSentimentSearch(e.target.value)} placeholder="极速检索维度..." className="flex-1 bg-transparent border-none py-1.5 text-[10px] font-bold text-white outline-none" /></div><div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 space-y-1">{filteredSentiments.map((s: any) => { const isSelected = selectedSentiment?.id === s.id; return ( <button key={s.id} onClick={() => { setSelectedSentiment(s); setHasOptimized(false); setShowSentimentDropdown(false); }} className={cn( "w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-[10px] font-black transition-all text-left", isSelected ? `bg-${s.color}-500/20 text-${s.color}-400 border border-${s.color}-500/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]` : "text-slate-500 hover:bg-white/5 hover:text-slate-200" )} > <div className="flex items-center gap-2"><div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", `bg-${s.color}-500`, isSelected && "animate-pulse")} />{s.name}</div> {isSelected && <Check size={12} className="animate-in zoom-in duration-300" />} </button> ) })}</div></motion.div> )}</AnimatePresence>
                   </div>
                   <button onClick={copyAndClose} className="px-5 h-full flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black border border-white/10 text-slate-300">复制</button>
                   <button id="main-action-btn" onClick={optimizeScript} disabled={optimizing || !selectedSentiment || !content} className={cn("px-8 h-full rounded-xl font-black text-[10px] uppercase shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95", hasOptimized ? "bg-emerald-600 text-white shadow-emerald-500/30" : "bg-cyan-600 text-white shadow-cyan-500/30")}>{optimizing ? <Loader2 className="animate-spin" size={14}/> : (hasOptimized ? <CheckCircle2 size={14}/> : <Sparkles size={14}/>)}{hasOptimized ? '再次回车复制' : 'AI 优化'}</button>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex items-center px-4 h-[72px] shrink-0 relative" style={{ WebkitAppRegion: 'drag' } as any}>
            {/* V3.73: 物理链路中断覆盖层 */}
            {!isOnline && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-red-600/10 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
                {!isFolded && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-tighter shadow-lg animate-pulse">
                    <Zap size={10} className="fill-current"/> 链路已挂断 · 脱机模式
                  </div>
                )}
              </motion.div>
            )}
            {!isFolded && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 w-[110px] shrink-0">
                                <div className="relative">
                                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-white", isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")}>{user?.real_name ? user.real_name[0] : <UserIcon size={18} />}</div>
                                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-slate-950", isOnline ? "bg-emerald-500" : "bg-red-500 animate-ping")} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[11px] font-black text-white truncate leading-none mb-0.5">{user?.real_name || '成员'}</span>
                                  <span className={cn("text-[8px] font-bold uppercase tracking-widest truncate", isOnline ? "text-emerald-500" : "text-red-500 font-black italic")}>{isOnline ? '在线' : '链路中断'}</span>
                                </div>
              </motion.div>
            )}
            <div className="flex-1 flex items-center justify-end gap-2 pr-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <AnimatePresence>
                {!isFolded && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2">
                    <HubBtn icon={<Ghost size={20} />} active={!isGlassMode} onClick={() => setGlassMode(!isGlassMode)} title="外观" color="muted" />
                    <HubBtn icon={<GraduationCap size={20} />} active={isOnboardingMode} onClick={() => setOnboardingMode(!isOnboardingMode)} title="培训" color="emerald" />
                    <HubBtn icon={isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} active={isMuted} onClick={() => setMuted(!isMuted)} title={isMuted ? "解禁" : "静音"} color={isMuted ? "red" : "muted"} />
                    <HubBtn icon={<History size={20} />} active={isHistoryMode} onClick={() => setIsHistoryMode(!isHistoryMode)} title="历史" color="muted" />
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <HubBtn icon={<PenTool size={20} />} active={isScratchpad} onClick={() => { setContent(''); setIsScratchpad(true); setHasOptimized(false); }} title="草稿" color="emerald" />
                    <HubBtn icon={<Package size={20} />} active={activeSideTool === 'PRODUCTS'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('PRODUCTS' as any); }} title="资料" color="white" />
                    <HubBtn icon={<BookOpen size={20} />} active={activeSideTool === 'KNOWLEDGE'} onClick={() => { setLayoutMode('SIDE'); setActiveSideTool('KNOWLEDGE' as any); }} title="手册" color="white" />
                    <HubBtn icon={<Tags size={20} />} active={isCustomerHudEnabled} onClick={() => setCustomerHudEnabled(!isCustomerHudEnabled)} title="画像" color={isCustomerHudEnabled ? "emerald" : "white"} />
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <HubBtn icon={<Globe size={20} />} active={showBigScreenModal} onClick={() => setShowBigScreenModal(!showBigScreenModal)} title="全景" color="emerald" />
                    <HubBtn icon={<Hand size={20} />} active={showHelpModal} onClick={() => setShowHelpModal(!showHelpModal)} title="求助" color="red" />
                    <HubBtn icon={<LayoutGrid size={20} />} active={isExpanded} onClick={() => setIsExpanded(!isExpanded)} title="面板" color="muted" />
                    <HubBtn icon={<LogOut size={20} />} active={false} onClick={() => { logout(); window.location.hash = '/login'; }} title="退出" color="red" />
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
              <HubBtn icon={isFolded ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />} active={isFolded} onClick={() => setIsFolded(!isFolded)} title={isFolded ? "展开" : "收起"} color="muted" />
            </div>
          </div>
        )}
      </motion.div>

      {/* V3.86: 语音指令视觉备份弹窗 (非阻塞) */}
      <AnimatePresence>
        {showVoiceAlertOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-red-600/90 backdrop-blur-xl px-12 py-8 rounded-[40px] shadow-[0_0_100px_rgba(220,38,38,0.5)] border border-white/20 flex flex-col items-center gap-6 max-w-2xl text-center">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                  <Mic size={40} className="text-red-600" strokeWidth={3} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-4xl font-black text-white uppercase italic tracking-widest drop-shadow-lg">收到战术指令</h3>
                  <p className="text-red-50 text-xl font-black italic leading-tight">"{voiceAlertText}"</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Tactical Voice Transmission Active</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ToolItem({ icon: Icon, title, active, onClick, color }: any) {
  return (
    <button onClick={onClick} className={cn(
      "flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] border transition-all active:scale-95 group",
      active ? "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/40" : "bg-white/[0.03] border-white/5 hover:border-white/20 text-slate-400 hover:text-white"
    )}>
       <Icon size={28} className={cn("group-hover:scale-110 transition-transform", color)} />
       <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
    </button>
  )
}

function HelpCard({ icon: Icon, title, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-start gap-3 p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-red-500/40 transition-all text-left group active:scale-[0.98]">
       <div className="w-10 h-10 bg-red-600/20 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Icon size={20}/></div>
       <div>
          <h5 className="text-sm font-black text-white group-hover:text-red-400 transition-colors uppercase italic">{title}</h5>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">{desc}</p>
       </div>
    </button>
  )
}

function HubBtn({ icon, active, onClick, title, color }: any) {
  const activeClassMap: any = { red: "bg-red-500 text-white", emerald: "bg-emerald-500 text-white", white: "bg-white text-black", muted: "bg-slate-800 text-white" }
  return (
    <div className="relative group/btn shrink-0">
      <button onClick={onClick} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 overflow-hidden relative", active ? activeClassMap[color] : "text-slate-500 hover:bg-white/10 hover:text-white")}>
        <div className="transition-all duration-300 group-hover/btn:opacity-0 group-hover/btn:scale-50">{icon}</div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-all duration-300 translate-y-2 group-hover/btn:translate-y-0"><span className="text-[10px] font-black text-white uppercase tracking-tighter">{title}</span></div>
      </button>
    </div>
  )
}
