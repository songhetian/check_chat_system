import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, BrainCircuit, Activity, Radar as RadarIcon, Trophy, BarChart, 
  ChevronRight, AlertCircle, Zap, Terminal, Target, LogOut, Cpu, LayoutGrid, Settings, MessageSquareOff,
  Volume2, VolumeX, User as UserIcon, GraduationCap, Sparkles, Box, Search, Video, Monitor,
  Ghost, Square, History, Fingerprint, Hand, Image as ImageIcon, MessageSquareText, CheckCircle2, Globe, ArrowRight, X, Maximize2
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn, tacticalRequest } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export const TacticalIsland = () => {
  const { 
    isAlerting, lastAiAnalysis, isOnline, violations, isMuted, setMuted,
    isOnboardingMode, setOnboardingMode, isAiOptimizeEnabled, setAiOptimize,
    isGlassMode, setGlassMode
  } = useRiskStore()
  const { user, logout, hasPermission } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'RADAR' | 'TOOLS'>('AI')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showBigScreenModal, setShowBigScreenModal] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [helpText, setHelpText] = useState('')

  const handleSearch = async () => {
    if (!searchText) return;
    try {
      const res = await tacticalRequest({
        url: `${CONFIG.API_BASE}/admin/violations?keyword=${searchText}&status=RESOLVED&size=5`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
      });
      if (res.status === 200) setSearchResults(res.data.data);
    } catch (e) { console.error(e) }
  }

  const handleHelp = async (type: 'TEXT' | 'IMAGE') => {
    let payload: any = { type: 'EMERGENCY_HELP', subType: type }
    
    if (type === 'IMAGE' && window.api?.captureScreen) {
      const img = await window.api.captureScreen()
      payload.image = img
    } else {
      if (!helpText) return
      payload.content = helpText
    }

    // 通过 WS 链路发送 (由 useRiskSocket 监听)
    window.dispatchEvent(new CustomEvent('send-risk-msg', { detail: payload }))
    
    setShowHelpModal(false)
    setHelpText('')
    window.dispatchEvent(new CustomEvent('trigger-toast', { 
      detail: { title: '战术支援', message: '求助信号已加密发送', type: 'error' } 
    }))
  }

  // 灵动岛尺寸动态适配
  useEffect(() => {
    let width = 640
    let height = showHelpModal ? 400 : (isExpanded ? 800 : 80)
    
    if (showBigScreenModal) {
      width = 1280
      height = 850
    }

    window.electron.ipcRenderer.send('resize-window', { 
      width, 
      height, 
      center: (!isExpanded && !showHelpModal && !showBigScreenModal) || showBigScreenModal 
    })
    
    // 大屏模式下不需要强制置顶，方便操作
    window.electron.ipcRenderer.send('set-always-on-top', !showBigScreenModal)
  }, [isExpanded, showHelpModal, showBigScreenModal])

  return (
    <div className="h-screen w-screen flex items-start justify-center overflow-hidden pointer-events-none select-none bg-transparent">
      {/* 核心：SVG 强制裁剪路径 (解决 Electron 圆角失效的终极方案) */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="tactical-island-clip" clipPathUnits="objectBoundingBox">
            {/* 使用一个高精度的圆角矩形路径模拟 38px */}
            <rect x="0" y="0" width="1" height="1" rx="0.06" ry="0.06" />
          </clipPath>
        </defs>
      </svg>

      <motion.div 
        layout
        initial={false}
        className={cn(
          "pointer-events-auto border border-white/10 flex flex-col overflow-hidden",
          isGlassMode ? "bg-slate-950/30 backdrop-blur-3xl" : "bg-slate-950",
          isAlerting && "border-red-500 ring-1 ring-red-500/20"
        )}
        style={{ 
          clipPath: 'url(#tactical-island-clip)', 
          borderRadius: '38px',
          WebkitClipPath: 'url(#tactical-island-clip)'
        }}
      >
        {/* 1. 战术中枢条 (Main Bar) */}
        <div 
          className="flex items-center justify-between px-5 h-[64px] shrink-0 cursor-move" 
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {/* 左侧：用户信息 & 状态 */}
          <div className="flex items-center gap-3 min-w-[150px]">
            <div className="relative">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-500",
                isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-slate-900 text-slate-600 border border-white/5"
              )}>
                {user?.real_name ? user.real_name[0] : <UserIcon size={18} />}
              </div>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2px] border-slate-950 transition-all duration-500",
                isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 animate-pulse"
              )} />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-white tracking-tight flex items-center gap-1.5 leading-none mb-1">
                {user?.real_name || 'Node'}
                {isOnboardingMode && <GraduationCap size={12} className="text-amber-400 animate-bounce" />}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-emerald-500" : "bg-red-500")} />
                <span className={cn(
                  "text-[8px] font-bold uppercase tracking-widest opacity-60",
                  isOnline ? "text-emerald-500" : "text-red-500"
                )}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* 中间：核心控制组 */}
          <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <HubBtn 
              icon={isGlassMode ? <Ghost size={16} /> : <Square size={16} />} 
              active={!isGlassMode} 
              onClick={() => setGlassMode(!isGlassMode)}
              title={isGlassMode ? "切换实色背景" : "切换高透明磨砂"}
              color="muted"
            />
            <HubBtn 
              icon={<GraduationCap size={16} />} 
              active={isOnboardingMode} 
              onClick={() => setOnboardingMode(!isOnboardingMode)}
              title="培训模式"
              color="emerald"
            />
            <HubBtn 
              icon={isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />} 
              active={isMuted} 
              onClick={() => setMuted(!isMuted)}
              title="静音控制"
              color="red"
            />
            <div className="w-px h-5 bg-white/5 mx-0.5" />
            <HubBtn 
              icon={<Globe size={16} />} 
              active={false} 
              onClick={() => window.open('#/personal-screen', '_blank')}
              title="个人战术态势"
              color="white"
            />
            <HubBtn 
              icon={<Hand size={16} />} 
              active={showHelpModal} 
              onClick={() => setShowHelpModal(!showHelpModal)}
              title="战术求助"
              color="red"
            />
            <HubBtn 
              icon={<LayoutGrid size={16} />} 
              active={isExpanded} 
              onClick={() => setIsExpanded(!isExpanded)} 
              title="看板"
              color="emerald"
            />
          </div>

          {/* 右侧：退出 */}
          <div className="flex items-center justify-end min-w-[40px]" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button 
              onClick={() => { logout(); window.location.hash = '/login'; }}
              className="w-8 h-8 rounded-lg bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all group border border-white/5"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* 3. 求助模态框 (Help Modal) */}
        <AnimatePresence>
          {showHelpModal && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-8 border-t border-white/10 bg-slate-900 flex flex-col gap-6 rounded-b-[38px]"
            >
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-1.5 h-4 bg-red-500 rounded-full" />
                 <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">发起战术支援请求</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <button 
                   onClick={() => handleHelp('IMAGE')}
                   className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
                 >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-red-500 group-hover:bg-red-500/10"><ImageIcon size={24} /></div>
                    <div className="text-center">
                       <p className="text-sm font-black text-white mb-1">图片求助</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">自动截取当前屏幕</p>
                    </div>
                 </button>
                 
                 <button 
                   onClick={() => { /* 仅切换视图，暂不发送 */ }}
                   className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
                 >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cyan-500 group-hover:bg-cyan-500/10"><MessageSquareText size={24} /></div>
                    <div className="text-center">
                       <p className="text-sm font-black text-white mb-1">文字求助</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">描述具体困难点</p>
                    </div>
                 </button>
              </div>

              <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <textarea 
                   value={helpText}
                   onChange={(e) => setHelpText(e.target.value)}
                   placeholder="请输入求助详情（选填）..."
                   className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 focus:border-red-500/50 transition-all resize-none outline-none"
                 />
                 <button 
                   onClick={() => handleHelp('TEXT')}
                   className="absolute bottom-3 right-3 px-4 py-2 bg-red-500 text-white text-[10px] font-black rounded-xl hover:bg-red-600 transition-all uppercase tracking-widest shadow-lg"
                 >
                   立即下发
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. 展开看板 (Dashboard - 深度优化) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden border-t border-white/5 bg-gradient-to-b from-black/20 via-slate-900/40 to-black/60 rounded-b-[38px]"
            >
              <div className="flex p-2.5 bg-black/40 gap-2.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabBtn id="AI" active={activeTab} set={setActiveTab} icon={<Target size={17}/>} label="智脑核对" />
                 <TabBtn id="RADAR" active={activeTab} set={setActiveTab} icon={<RadarIcon size={17}/>} label="全域雷达" />
                 <TabBtn id="TOOLS" active={activeTab} set={setActiveTab} icon={<Box size={17}/>} label="战术工具" />
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-7">
                      <div className="p-7 bg-white/[0.03] border border-white/10 rounded-[32px] relative overflow-hidden group">
                         {/* AI 扫描动效 */}
                         <motion.div 
                           animate={{ y: [0, 240, 0] }} 
                           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                           className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent z-10"
                         />
                         
                         <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000">
                            <BrainCircuit size={180} />
                         </div>
                         <h4 className="text-[11px] font-black text-cyan-400 uppercase mb-4 flex items-center gap-2.5 tracking-widest">
                           <Terminal size={15} /> 智脑实时干预策略
                         </h4>
                         <div className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-inner">
                            <p className="text-[15px] text-slate-100 leading-relaxed font-semibold">
                              {lastAiAnalysis?.strategy || "中枢系统正在解析实时对话流，智脑处于待命状态。"}
                            </p>
                         </div>
                         <div className="mt-4 flex items-center gap-3">
                            <div className="flex -space-x-2">
                               {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-cyan-500/20 border border-slate-900 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /></div>)}
                            </div>
                            <span className="text-[9px] font-bold text-cyan-500/60 uppercase tracking-widest italic">Neural Link Processing...</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                         <DetailCard label="风险评估指数" value={`${lastAiAnalysis?.risk_score || 0}%`} sub="Real-time Risk Index" icon={<Shield size={14} />} />
                         <DetailCard label="情感共鸣偏移" value={lastAiAnalysis?.sentiment_score || 0} isCyan sub="Sentiment Analysis" icon={<Activity size={14} />} />
                      </div>
                   </div>
                 )}

                 {activeTab === 'RADAR' && (
                   <div className="space-y-5">
                      <div className="flex justify-between items-center px-4 mb-1">
                        <div className="flex items-center gap-2">
                           <History size={14} className="text-slate-500" />
                           <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">物理拦截日志 ({violations.length})</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-[9px] font-black text-emerald-500/60 uppercase">解决库: {useRiskStore.getState().resolvedViolations.length}</span>
                           <div className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-500 animate-pulse uppercase">Recording Active</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {violations.slice(0, 5).map((v, i) => (
                          <div 
                            key={i} 
                            onClick={async () => {
                               const solution = "坐席已确认风险并手动修正";
                               try {
                                 const res = await window.api.callApi({
                                   url: `${CONFIG.API_BASE}/admin/violation/resolve`,
                                   method: 'POST',
                                   headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
                                   data: { id: v.id, solution }
                                 });
                                 if (res.status === 200) {
                                   useRiskStore.getState().resolveViolation(v.id, solution);
                                   window.dispatchEvent(new CustomEvent('trigger-toast', { 
                                     detail: { title: '战术对齐', message: '记录已成功存入解决库', type: 'success' } 
                                   }));
                                 }
                               } catch (e) {
                                 console.error("Resolve failed", e);
                               }
                            }}
                            className="flex items-center gap-5 p-5 bg-white/[0.03] rounded-[28px] border border-white/5 hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all group relative overflow-hidden cursor-pointer"
                          >
                             <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                <AlertCircle size={22} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                   <div className="text-[13px] font-black text-white truncate">{v.keyword}</div>
                                   <div className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] font-mono text-slate-500 uppercase">LV.{v.risk_level || '5'}</div>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono uppercase flex items-center gap-2">
                                   <Monitor size={12} className="opacity-40" /> 
                                   <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-700" />
                                   <span className="text-emerald-500/40 group-hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors"><CheckCircle2 size={10}/> 点击标记为已解决</span>
                                </div>
                             </div>
                             <ChevronRight size={16} className="text-slate-800 group-hover:text-emerald-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                      {violations.length === 0 && (
                         <div className="h-64 flex flex-col items-center justify-center text-slate-700 italic opacity-40">
                            <div className="relative mb-6">
                               <RadarIcon size={64} className="animate-pulse" />
                               <motion.div animate={{ scale: [1, 2], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-cyan-500/20 rounded-full" />
                            </div>
                            <span className="text-[13px] font-black tracking-[0.4em] uppercase">雷达扫描空网中</span>
                         </div>
                      )}
                   </div>
                 )}

                 {activeTab === 'TOOLS' && (
                   <div className="grid grid-cols-2 gap-5">
                      <ToolCard 
                        icon={<Search size={24} />} 
                        title="全域战术检索" 
                        desc="检索知识库与标准话术矩阵" 
                        color="cyan" 
                        onClick={() => setShowSearchModal(true)}
                      />
                      <ToolCard icon={<Video size={24} />} title="屏幕实时协同" desc="发起远程专家现场指导请求" color="amber" />
                      <ToolCard icon={<Settings size={24} />} title="终端链路配置" desc="识别参数与自愈精度微调" color="slate" />
                      {hasPermission('agent:view:big_screen') && (
                        <ToolCard 
                          icon={<Maximize2 size={24} />} 
                          title="全景大屏态势" 
                          desc="切换至指挥中心同步视觉面板" 
                          color="cyan" 
                          onClick={() => setShowBigScreenModal(true)}
                        />
                      )}
                   </div>
                 )}
              </div>

              {/* 4. 战术检索模态框 (Search Modal) */}
              <AnimatePresence>
                {showSearchModal && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 z-[100] bg-slate-950 p-8 flex flex-col gap-6"
                  >
                    <div className="flex justify-between items-center">
                       <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-2">
                         <Search size={14} /> 战术对策检索中枢
                       </h4>
                       <button onClick={() => setShowSearchModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={18}/></button>
                    </div>
                    
                    <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
                       <input 
                         value={searchText}
                         onChange={(e) => setSearchText(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                         placeholder="输入关键词（如：转账、投诉）..."
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                       />
                       <button onClick={handleSearch} className="absolute right-3 top-3 p-2 bg-cyan-500 text-slate-950 rounded-xl hover:bg-cyan-400 transition-all shadow-lg"><ArrowRight size={18}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                       {searchResults.map((r, i) => (
                         <div key={i} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all">
                            <div className="text-[9px] font-black text-cyan-500 uppercase mb-2 tracking-widest">Matched Strategy</div>
                            <div className="text-[13px] font-black text-white mb-2 leading-tight">{r.keyword}</div>
                            <div className="text-[11px] font-bold text-slate-100 leading-relaxed bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/20 italic">
                               方案: {r.solution}
                            </div>
                         </div>
                       ))}
                       {searchResults.length === 0 && searchText && <div className="h-full flex items-center justify-center text-slate-600 italic text-[10px] uppercase tracking-widest">未找到匹配的战术载荷</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 5. 实时全景大屏模态框 (Big Screen Modal) */}
              <AnimatePresence>
                {showBigScreenModal && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-[110] bg-slate-950 flex flex-col"
                  >
                    <div className="flex justify-between items-center p-8 bg-black/40 border-b border-white/10 shrink-0">
                       <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-2">
                         <Maximize2 size={14} /> 全景战术态势指挥面板
                       </h4>
                       <button onClick={() => setShowBigScreenModal(false)} className="px-6 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                         关闭战术窗口 / CLOSE
                       </button>
                    </div>
                    <div className="flex-1 bg-black relative">
                       <iframe 
                         src="#/big-screen" 
                         className="w-full h-full border-none"
                         title="Tactical Big Screen"
                       />
                       <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* 底部页脚 */}
              <div className="p-6 bg-black/60 border-t border-white/10 flex justify-between items-center px-10 rounded-b-[38px]">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-black tracking-[0.2em]">Link Secure · Protocol v2.4</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">{CONFIG.APP_VERSION}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HubBtn({ icon, active, onClick, title, color }: any) {
  const activeClassMap: any = {
    red: "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] border-red-400",
    emerald: "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] border-emerald-400",
    white: "bg-white text-black shadow-lg",
    muted: "bg-slate-800 text-white border-white/20 shadow-md"
  }

  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 active:scale-90 border border-transparent",
        active ? activeClassMap[color] : "text-slate-500 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
    </button>
  )
}

function TabBtn({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); set(id); }} 
      className={cn(
        "flex-1 py-3.5 rounded-[20px] flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative overflow-hidden",
        isSelected ? "bg-white/10 text-cyan-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
      {isSelected && (
        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
      )}
    </button>
  )
}

function DetailCard({ label, value, isCyan, sub, icon }: any) {
  return (
    <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 group hover:border-white/10 transition-all relative overflow-hidden">
       <div className="absolute right-4 top-4 text-white/5 group-hover:text-white/10 transition-colors">
          {icon}
       </div>
       <div className="text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">{label}</div>
       <div className={cn("text-2xl font-black mb-0.5 tracking-tighter", isCyan ? "text-cyan-400" : "text-white")}>{value}</div>
       <div className="text-[8px] font-bold text-slate-600 uppercase italic opacity-50">{sub}</div>
    </div>
  )
}

function ToolCard({ icon, title, desc, color, onClick }: any) {
  const colors: any = {
    cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/15",
    amber: "text-amber-400 bg-amber-400/5 border-amber-400/15",
    red: "text-red-400 bg-red-400/5 border-red-400/15",
    slate: "text-slate-400 bg-white/5 border-white/10"
  }
  return (
    <button onClick={onClick} className={cn("p-6 rounded-[28px] border flex flex-col items-start gap-3.5 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group", colors[color])}>
       <div className="w-11 h-11 rounded-[18px] flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors shadow-inner">
          {icon}
       </div>
       <div>
          <div className="text-[14px] font-black text-white mb-0.5 uppercase tracking-tight">{title}</div>
          <div className="text-[10px] font-medium text-slate-500 leading-tight">{desc}</div>
       </div>
    </button>
  )
}
