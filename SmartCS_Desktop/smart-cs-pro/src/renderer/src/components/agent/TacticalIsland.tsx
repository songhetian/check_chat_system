import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban, Undo2,
  UserSearch, Layers, Star, Info, Link2, ScanEye, Crosshair, HelpCircle, ChevronsLeft, ChevronsRight, Loader2, Brain, PenTool, Send,
  AlertTriangle, ChevronDown, Check
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
    isOnboardingMode, setOnboardingMode, isMuted, setMuted, isLocked
  } = useRiskStore()
  
  const { user, logout, token } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFolded, setIsFolded] = useState(false) 
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)
  
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showCriticalAlert, setShowCriticalAlert] = useState(false)

  // 核心状态 (V3.45: 流式打字机版)
  const [content, setContent] = useState('') 
  const [isPushMode, setIsPushMode] = useState(false)
  const [isScratchpad, setIsScratchpad] = useState(false)
  const [selectedSentiment, setSelectedSentiment] = useState<any>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [hasOptimized, setHasOptimized] = useState(false)
  const [sentimentSearch, setSentimentSearch] = useState('')
  const [showSentimentDropdown, setShowSentimentDropdown] = useState(false)

  const [isEvasionMode, setIsEvasionMode] = useState(false)
  const [evasionInfo, setEvasionInfo] = useState<any>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: sentiments = [] } = useQuery({
    queryKey: ['ai_sentiments_island'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sentiments`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      const data = res.data.data
      if (!selectedSentiment && data.length > 0) {
        const neutral = data.find((s: any) => s.name.includes('中性') || s.id === 0) || data[0]
        setSelectedSentiment(neutral)
      }
      return data
    },
    enabled: !!token
  })

  const resetSpecialModes = () => {
    setIsPushMode(false); setIsScratchpad(false); setIsEvasionMode(false);
    setEvasionInfo(null); setHasOptimized(false); setOptimizing(false);
  }

  useEffect(() => {
    const onCommand = (e: any) => {
      const data = e.detail;
      if (data.type === 'TACTICAL_PUSH') {
        setContent(data.payload.content || '')
        setIsPushMode(true); setIsScratchpad(false); setIsEvasionMode(false); setHasOptimized(false);
        window.electron.ipcRenderer.send('set-always-on-top', true)
      }
      if (data.type === 'TACTICAL_DEPT_VIOLATION') {
        setEvasionInfo(data)
        setIsEvasionMode(true); setIsPushMode(false); setIsScratchpad(false);
        window.api.callApi({ url: `http://localhost:8000/api/system/clear-input`, method: 'POST' })
      }
    }
    window.addEventListener('ws-tactical-command', onCommand)
    return () => window.removeEventListener('ws-tactical-command', onCommand)
  }, [])

  // V3.45: 流式渲染核心逻辑 (Streaming reader)
  const optimizeScript = async () => {
    if (!content || !selectedSentiment || optimizing) return
    
    setOptimizing(true)
    setHasOptimized(false)
    
    const originalText = content;
    // 预清空内容以准备流式注入
    setContent('') 

    try {
      const systemPrompt = `你是一个专业的金牌客服。
[任务]：对用户的原始回复进行重写优化。
[背景]：客户当前处于[${selectedSentiment.name}]状态，引导建议是：${selectedSentiment.prompt_segment}。
[规则]：
1. 严禁输出任何引言（如"好的"、"收到"、"建议如下"）。
2. 严禁输出任何解释、标点说明或引号。
3. 仅输出优化后的那一句话。`

      const serverConfig = await window.api.getServerConfig()
      const url = serverConfig.ai_engine.url
      const isChatApi = url.endsWith('/chat')
      
      const payload = isChatApi 
        ? { model: serverConfig.ai_engine.model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `原始话术：${originalText}\n\n直接输出优化结果：` }], stream: true, options: { temperature: 0.1 } }
        : { model: serverConfig.ai_engine.model, prompt: `${systemPrompt}\n\n原始话术：${originalText}\n\n优化后的单句回复：`, stream: true, options: { temperature: 0.1 } };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.body) throw new Error('ReadableStream not supported')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let fullText = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        // Ollama 每一行都是一个 JSON 对象
        const lines = chunk.split('\n').filter(l => l.trim())
        
        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            const token = isChatApi ? json.message?.content : json.response
            if (token) {
              fullText += token
              // 实时更新编辑器内容 (带清洗)
              setContent(fullText.replace(/^(好的|收到|明白了|理解了|优化后|回复如下|对话建议)[:：\s]*/g, '').replace(/^["'“](.*)["'”]$/g, '$1').trim())
            }
          } catch (e) { /* 忽略不完整的 JSON 块 */ }
        }
      }
      
      setHasOptimized(true)
    } catch (e) { 
      console.error(e)
      setContent(originalText) // 失败回滚
      toast.error('AI 链路中断')
    } finally { 
      setOptimizing(false) 
    }
  }

  const copyAndClose = () => {
    if (!content || optimizing) return
    navigator.clipboard.writeText(content)
    resetSpecialModes()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!hasOptimized && !optimizing) optimizeScript()
      else if (hasOptimized) copyAndClose()
    }
  }

  useEffect(() => {
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const active = isPushMode || isScratchpad || isEvasionMode
    let width = isFolded ? 80 : 800 
    let height = showHelpModal ? 480 : (isExpanded ? 564 : 72)
    let x: number | undefined, y: number | undefined, center = false

    if (isLocked) { width = screenWidth; height = screenHeight; x = 0; y = 0; } 
    else if (active) { width = 800; height = 320; x = screenWidth - 820; y = 30; } 
    else if (showBigScreenModal) { width = 1280; height = 850; center = true } 
    else if (layoutMode === 'SIDE') { width = 440; height = screenHeight - 80; x = screenWidth - 460; y = 40 } 
    else { x = isFolded ? screenWidth - 100 : screenWidth - 820; y = 30 }
    
    window.electron.ipcRenderer.send('resize-window', { width, height, center, x, y })
    window.electron.ipcRenderer.send('set-always-on-top', isLocked || active || !showBigScreenModal)
    if (isScratchpad && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isExpanded, showHelpModal, showBigScreenModal, layoutMode, isFolded, isLocked, isPushMode, isScratchpad, isEvasionMode])

  const filteredSentiments = useMemo(() => {
    return sentiments.filter((s: any) => s.name.toLowerCase().includes(sentimentSearch.toLowerCase()))
  }, [sentiments, sentimentSearch])

  const isInSpecialMode = isPushMode || isScratchpad

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none bg-transparent text-black">
      <motion.div 
        layout
        animate={{ 
          width: isLocked ? window.screen.width : (layoutMode === 'SIDE' ? 440 : (showBigScreenModal ? 1280 : (isFolded ? 80 : 800))),
          height: isLocked ? window.screen.height : (layoutMode === 'SIDE' ? 850 : (showBigScreenModal ? 850 : (isPushMode || isScratchpad || isEvasionMode ? 320 : (showHelpModal ? 480 : (isExpanded ? 564 : 72)))))
        }}
        className={cn("pointer-events-auto border border-white/10 flex flex-col overflow-hidden transition-all duration-500 relative", isGlassMode ? "bg-slate-950/60 backdrop-blur-3xl" : "bg-slate-950", (showBigScreenModal || layoutMode === 'SIDE' || isLocked) ? "rounded-none" : "rounded-3xl")}
      >
        {isEvasionMode ? (
          <div className="flex-1 flex flex-col p-6 text-white overflow-hidden bg-amber-950/60">
             <div className="flex justify-between items-start shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center shadow-2xl animate-bounce"><AlertTriangle size={16} className="text-black"/></div>
                   <h4 className="text-base font-black italic tracking-tighter uppercase text-amber-400">战术规避拦截</h4>
                </div>
                <button onClick={resetSpecialModes} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2 font-black text-[10px] transition-all border border-white/10 text-amber-200"><Undo2 size={12}/> 关闭</button>
             </div>
             <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="text-3xl font-black text-white italic tracking-tighter underline decoration-amber-500">"{evasionInfo?.keyword}"</div>
                <div className="w-full max-w-sm p-4 bg-black/40 rounded-2xl border border-amber-500/30">
                   <p className="text-[10px] font-black text-amber-400 uppercase mb-1">修正建议</p>
                   <p className="text-sm font-medium italic text-white leading-relaxed">"{evasionInfo?.suggestion}"</p>
                </div>
             </div>
          </div>
        ) : (isPushMode || isScratchpad) ? (
          <div className="flex-1 flex flex-col p-5 text-white overflow-hidden bg-slate-950/40">
             <div className="flex justify-between items-start mb-3 shrink-0">
                <div className="flex items-center gap-3">
                   <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl", isPushMode ? "bg-cyan-600" : "bg-emerald-600", optimizing && "animate-pulse")}>
                      {isPushMode ? <Sparkles size={20}/> : <PenTool size={20}/>}
                   </div>
                   <h4 className="text-lg font-black italic tracking-tighter uppercase">{isPushMode ? '指挥部战术支援' : '战术草稿箱'}</h4>
                </div>
                <button onClick={resetSpecialModes} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 font-black text-[10px] transition-all border border-white/10 text-slate-300"><Undo2 size={14}/> 退出</button>
             </div>

             <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 relative group shadow-inner focus-within:border-cyan-500/50 transition-all overflow-hidden">
                   <textarea
                     ref={inputRef}
                     value={content}
                     onChange={(e) => { setContent(e.target.value); setHasOptimized(false); }}
                     onKeyDown={handleKeyDown}
                     placeholder={optimizing ? "AI 正在思考并注入内容..." : "输入内容并回车优化..."}
                     className="w-full h-full bg-transparent px-5 py-5 text-sm font-medium leading-relaxed italic text-white resize-none outline-none custom-scrollbar"
                   />
                </div>

                <div className="flex items-center gap-2 h-14 shrink-0 bg-white/5 p-1 rounded-2xl border border-white/5">
                   <div className="relative w-48 h-full" ref={dropdownRef}>
                      <button onClick={() => setShowSentimentDropdown(!showSentimentDropdown)} className="w-full h-full px-4 flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
                         <div className="flex items-center gap-2">
                            <Brain size={14} className={cn(selectedSentiment ? `text-${selectedSentiment.color}-400` : "text-slate-400")} />
                            <span className="text-[10px] font-black text-white truncate">{selectedSentiment?.name || '情绪维度'}</span>
                         </div>
                         <ChevronDown size={12} className="text-slate-500" />
                      </button>
                      <AnimatePresence>
                        {showSentimentDropdown && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]">
                             <div className="p-2 bg-white/5 border-b border-white/5"><input autoFocus value={sentimentSearch} onChange={(e) => setSentimentSearch(e.target.value)} placeholder="检索..." className="w-full bg-black/40 border-none rounded-lg px-2 py-1 text-[10px] font-bold text-white outline-none" /></div>
                             <div className="max-h-32 overflow-y-auto custom-scrollbar p-1">
                                {filteredSentiments.map((s: any) => (
                                  <button key={s.id} onClick={() => { setSelectedSentiment(s); setHasOptimized(false); setShowSentimentDropdown(false); }} className={cn("w-full px-3 py-2 rounded-lg flex items-center justify-between text-[10px] font-black transition-all hover:bg-white/5 text-left", selectedSentiment?.id === s.id ? "bg-cyan-600/20 text-cyan-400" : "text-slate-400")}>
                                     <div className="flex items-center gap-2"><div className={cn("w-1 h-1 rounded-full", `bg-${s.color}-500`)} />{s.name}</div>
                                     {selectedSentiment?.id === s.id && <Check size={10}/>}
                                  </button>
                                ))}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                   <button onClick={copyAndClose} className="px-4 h-full flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black border border-white/10 text-slate-300 transition-all active:scale-95"><ImageIcon size={14}/> 复制</button>
                   <button 
                     id="main-action-btn"
                     disabled={optimizing || !selectedSentiment || !content}
                     onClick={optimizeScript}
                     className={cn("flex-1 h-full rounded-xl font-black text-[10px] uppercase shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95", hasOptimized ? "bg-emerald-600 text-white" : "bg-cyan-600 text-white")}
                   >
                      {optimizing ? <Loader2 className="animate-spin" size={14}/> : (hasOptimized ? <CheckCircle2 size={14}/> : <Sparkles size={14}/>)}
                      {hasOptimized ? '再次回车复制' : 'AI 优化 (Enter)'}
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex items-center px-4 h-[72px] shrink-0 relative" style={{ WebkitAppRegion: 'drag' } as any}>
            {!isFolded && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 w-[110px] shrink-0">
                <div className="relative">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-white", isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-600 border border-white/5")}>{user?.real_name ? user.real_name[0] : <UserIcon size={18} />}</div>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-slate-950", isOnline ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black text-white truncate leading-none mb-0.5">{user?.real_name || '成员'}</span>
                  <span className={cn("text-[8px] font-bold uppercase tracking-widest truncate", isOnline ? "text-emerald-500" : "text-red-500")}>{isOnline ? '在线' : '离线'}</span>
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
                    <div className="w-px h-5 bg-white/10 mx-0.5" />
                    <HubBtn icon={<PenTool size={20} />} active={isScratchpad} onClick={() => { setIsScratchpad(true); setContent(''); setHasOptimized(false); }} title="草稿" color="emerald" />
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
    </div>
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
