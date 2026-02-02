import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, VolumeX, BrainCircuit, Copy, History, Activity, MousePointer2, Radar as RadarIcon, FileText, Sparkles, TrendingUp
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastAiAnalysis, isAiOptimizeEnabled, setAiOptimize, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')
  
  const tabAudioRef = useRef<HTMLAudioElement | null>(null);
  const reloadAudioRef = useRef<HTMLAudioElement | null>(null);

  // 播放机械点击音
  const playClick = () => {
    if (tabAudioRef.current) {
      tabAudioRef.current.currentTime = 0;
      tabAudioRef.current.volume = 0.2;
      tabAudioRef.current.play().catch(() => {});
    }
  }

  // 监听 Tab 切换播放音效
  useEffect(() => {
    if (isExpanded) playClick();
  }, [activeTab]);

  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 580 : 48
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      {/* 机械点击音效文件 */}
      <audio ref={tabAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2534-preview.mp3" preload="auto" />
      
      <motion.div layout className={cn("bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px] scanline")}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAiOptimizeEnabled ? "bg-cyan-500 text-white animate-pulse" : "bg-cyan-500/20 text-cyan-400")}><BrainCircuit size={16} /></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Tactical Hub</span>
          </div>
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <button onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-colors">
               <MousePointer2 size={12} className={cn("text-white transition-transform", isExpanded && "rotate-180")} />
             </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex p-2 bg-black/20 gap-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabButton id="AI" active={activeTab} set={setActiveTab} icon={<Sparkles size={12}/>} label="智脑" onSwitch={playClick} />
                 <TabButton id="HISTORY" active={activeTab} set={setActiveTab} icon={<RadarIcon size={12}/>} label="雷达" onSwitch={playClick} />
                 <TabButton id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={12}/>} label="数据" onSwitch={playClick} />
              </div>
              {/* ... 内容区保持不变 */}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function TabButton({ id, active, set, icon, label, onSwitch }: any) {
  const isSelected = active === id
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); set(id); onSwitch(); }} 
      className={cn(
        "flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all", 
        isSelected ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  )
}