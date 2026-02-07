import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2,
  Package, BookOpen, Tags, SearchCheck, Filter, ChevronLeft, AlertOctagon, Wallet, Heart, Ban, Undo2,
  UserSearch, Layers, Star, Info, Link2, ScanEye, Crosshair, HelpCircle, ChevronsLeft, ChevronsRight, Loader2, Brain, PenTool, Send,
  AlertTriangle, ChevronDown, Check, RefreshCw
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
  
  // 1. 基础 UI 状态
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFolded, setIsFolded] = useState(false) 
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)

  // 2. 战术实战状态 (V3.61: 稳定兼容版)
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

  // 3. 数据拉取：V3.61 多路加速版
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
    enabled: !!token,
    staleTime: 300000
  })

  // 补强：监听 token 变化自动刷新，解决初始加载为空的问题
  useEffect(() => { if (token) refetch(); }, [token])

  useEffect(() => {
    if (sentiments.length > 0 && !selectedSentiment) {
      const neutral = sentiments.find((s: any) => s.name.includes('中性') || s.id === 4) || sentiments[0]
      setSelectedSentiment(neutral)
    }
  }, [sentiments, selectedSentiment])

  const resetSpecialModes = () => {
    setIsPushMode(false); setIsScratchpad(false); setIsEvasionMode(false);
    setEvasionInfo(null); setHasOptimized(false); setOptimizing(false);
  }

  // 指令监听中心
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowSentimentDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSentiments = useMemo(() => {
    return sentiments.filter((s: any) => s.name.toLowerCase().includes(sentimentSearch.toLowerCase()))
  }, [sentiments, sentimentSearch])

  // V3.61: Qwen 友好型提示词协议
  const optimizeScript = async () => {
    if (!content || !selectedSentiment || optimizing) return
    setOptimizing(true); setHasOptimized(false);
    const originalText = content;
    setContent('') 

    try {
      const serverConfig = await window.api.getServerConfig()
      // 极简指令：模型越小指令越要直接
      const prompt = `请直接重写这段话术，使其语气更加${selectedSentiment.name}。规则：只输出重写后的一句话，不要有任何多余的解释。原文：${originalText}`;

      const response = await fetch(serverConfig.ai_engine.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: serverConfig.ai_engine.model,
          prompt: prompt,
          stream: true,
          options: { temperature: 0.1, stop: ["\n", "["] }
        })
      })

      if (!response.body) throw new Error('Stream missing')
      const reader = response.body.getReader(); const decoder = new TextDecoder();
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.trim())
        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            const token = json.response || json.message?.content
            if (token) {
              fullText += token
              setContent(fullText.replace(/^(好的|收到|明白了|理解了|优化后|回复如下|对话建议)[:：\s]*/g, '').replace(/^["'“](.*)["'”]$/g, '$1').trim())
            }
          } catch (e) {}
        }
      }
      setHasOptimized(true)
    } catch (e) { setContent(originalText); toast.error('AI 引擎未响应') } finally { setOptimizing(false) }
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
    const active = isPushMode || isScratchpad
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
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const active = isPushMode || isScratchpad || isEvasionMode
    
    // V3.61: 扩宽至 760px 确保按钮全显示
    let width = isFolded ? 80 : 760 
    let height = showHelpModal ? 480 : (isExpanded ? 564 : 72)
    let x: number | undefined, y: number | undefined, center = false

    if (isLocked) { width = screenWidth; height = screenHeight; x = 0; y = 0; } 
    else if (active) { width = 760; height = 320; x = screenWidth - 780; y = 30; } 
    else { x = isFolded ? screenWidth - 100 : screenWidth - 780; y = 30 }
    
    window.electron.ipcRenderer.send('resize-window', { width, height, center, x, y })
    window.electron.ipcRenderer.send('set-always-on-top', isLocked || active || !showBigScreenModal)
    if (isScratchpad && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isExpanded, showHelpModal, showBigScreenModal, layoutMode, isFolded, isLocked, isPushMode, isScratchpad, isEvasionMode])

  const isInSpecialMode = isPushMode || isScratchpad

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none bg-transparent text-black">
      <motion.div 
        layout
        animate={{ 
          width: isLocked ? window.screen.width : (layoutMode === 'SIDE' ? 440 : (showBigScreenModal ? 1280 : (isFolded ? 80 : 760))),
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
        ) : isInSpecialMode ? (
          <div className="flex-1 flex flex-col p-5 text-white overflow-hidden">
             <div className="flex justify-between items-start mb-3 shrink-0">
                <div className="flex items-center gap-3">
                   <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl", isPushMode ? "bg-cyan-600 shadow-cyan-500/30 shadow-lg" : "bg-emerald-600 shadow-emerald-500/30 shadow-lg", optimizing && "animate-pulse")}>
                      {isPushMode ? <Sparkles size={20}/> : <PenTool size={20}/>}
                   </div>
                   <h4 className="text-lg font-black italic tracking-tighter uppercase">{isPushMode ? '指挥部支援' : '战术草稿箱'}</h4>
                </div>
                <button onClick={resetSpecialModes} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 font-black text-[10px] border border-white/10 text-slate-300"><Undo2 size={14}/> 退出</button>
             </div>

             <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex-1 bg-black rounded-2xl border border-white/10 relative group shadow-inner transition-all overflow-hidden">
                   <AnimatePresence>
                     {optimizing && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-cyan-500" size={24} />
                          <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">AI 注入中...</span>
                       </motion.div>
                     )}
                   </AnimatePresence>
                   <textarea
                     ref={inputRef}
                     value={content}
                     onChange={(e) => { setContent(e.target.value); setHasOptimized(false); }}
                     onKeyDown={handleKeyDown}
                     placeholder="输入内容并回车优化..."
                     className="w-full h-full bg-transparent px-5 py-5 text-sm font-bold leading-relaxed text-white resize-none outline-none custom-scrollbar"
                   />
                </div>

                <div className="flex items-center gap-2 h-14 shrink-0">
                   <div className="relative flex-1 h-full" ref={dropdownRef}>
                      <button onClick={() => setShowSentimentDropdown(!showSentimentDropdown)} className="w-full h-full px-4 flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                         <div className="flex items-center gap-2">
                            <Brain size={14} className={cn(selectedSentiment ? `text-${selectedSentiment.color}-400 shadow-[0_0_8px_rgba(0,0,0,0.5)]` : "text-slate-400")} />
                            <span className="text-[10px] font-black text-white truncate">{selectedSentiment?.name || '情绪加载中...'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <ChevronDown size={12} className="text-slate-500" />
                            {sentiments.length === 0 && <button onClick={(e)=>{e.stopPropagation(); refetch();}} className="p-1 text-cyan-500 hover:rotate-180 transition-all"><RefreshCw size={10}/></button>}
                         </div>
                      </button>
                      <AnimatePresence>
                        {showSentimentDropdown && (
                          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute bottom-full left-0 right-0 mb-3 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100]">
                             <div className="p-2.5 bg-white/5 border-b border-white/5 flex gap-2">
                                <Search size={10} className="mt-2.5 text-slate-500" />
                                <input autoFocus value={sentimentSearch} onChange={(e) => setSentimentSearch(e.target.value)} placeholder="极速检索维度..." className="flex-1 bg-transparent border-none py-1.5 text-[10px] font-bold text-white outline-none" />
                             </div>
                             <div className="max-h-48 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                                {filteredSentiments.map((s: any) => {
                                  const isSelected = selectedSentiment?.id === s.id;
                                  return (
                                    <button key={s.id} onClick={() => { setSelectedSentiment(s); setHasOptimized(false); setShowSentimentDropdown(false); }} className={cn("w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-[10px] font-black transition-all text-left", isSelected ? `bg-${s.color}-500/20 text-${s.color}-400 border border-${s.color}-500/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]` : "text-slate-500 hover:bg-white/5 hover:text-slate-200")}>
                                       <div className="flex items-center gap-2"><div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", `bg-${s.color}-500`, isSelected && "animate-pulse")} />{s.name}</div>
                                       {isSelected && <Check size={12} className="animate-in zoom-in duration-300" />}
                                    </button>
                                  )
                                })}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                   <button onClick={copyAndClose} className="px-5 h-full flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black border border-white/10 text-slate-300">复制</button>
                   <button id="main-action-btn" onClick={optimizeScript} disabled={optimizing || !selectedSentiment || !content} className={cn("px-8 h-full rounded-xl font-black text-[10px] uppercase shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95", hasOptimized ? "bg-emerald-600 text-white shadow-emerald-500/30" : "bg-cyan-600 text-white shadow-cyan-500/30")}>
                      {optimizing ? <Loader2 className="animate-spin" size={14}/> : (hasOptimized ? <CheckCircle2 size={14}/> : <Sparkles size={14}/>)}
                      {hasOptimized ? '再次回车复制' : 'AI 优化'}
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
