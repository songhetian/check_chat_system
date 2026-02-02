import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Zap, 
  Video, 
  VolumeX, 
  BrainCircuit, 
  Copy, 
  WifiOff, 
  History, 
  Trophy,
  Activity,
  MousePointer2,
  TrendingUp,
  Target,
  Radar
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, sendMessage, lastAiAnalysis, isOnline, violations } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')

  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 580 : 48
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  // --- 核心：战术雷达数据计算逻辑 ---
  const radarData = useMemo(() => {
    // 模拟五个战术维度：合规、情绪、战术、透明、效率
    const base = [65, 80, 45, 90, 70]
    if (violations.length > 0) {
      // 动态根据违规数量降低合规分
      base[0] = Math.max(20, 100 - violations.length * 10)
    }
    if (lastAiAnalysis) {
      base[1] = lastAiAnalysis.sentiment_score
      base[2] = 100 - lastAiAnalysis.risk_score * 10
    }
    return base
  }, [violations, lastAiAnalysis])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    window.dispatchEvent(new CustomEvent('trigger-toast', { 
      detail: { title: '战术同步', message: '话术已就绪', type: 'success' } 
    }))
  }

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      <motion.div
        layout
        className={cn(
          "bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px]",
          lastAiAnalysis && "ring-2 ring-cyan-500/50"
        )}
        style={{ width: isAlerting ? 420 : isExpanded ? 550 : 240 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAlerting ? "bg-white text-red-600" : "bg-cyan-500/20 text-cyan-400")}>
              <Shield size={16} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">TACTICAL LINK PRO</span>
          </div>
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <button onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-colors">
               <MousePointer2 size={12} className={cn("text-white transition-transform", isExpanded && "rotate-180")} />
             </button>
          </div>
        </div>

        {/* 内容区 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex p-2 bg-black/20 gap-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabButton id="AI" active={activeTab} set={setActiveTab} icon={<BrainCircuit size={12}/>} label="超脑" />
                 <TabButton id="HISTORY" active={activeTab} set={setActiveTab} icon={<Radar size={12}/>} label="战术雷达" />
                 <TabButton id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={12}/>} label="全景" />
              </div>

              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'HISTORY' && (
                   <div className="space-y-6">
                      {/* 1. 战术多面体雷达图 */}
                      <div className="bg-white/5 rounded-[32px] p-6 border border-white/5 relative flex flex-col items-center">
                         <div className="absolute top-4 left-6 flex flex-col">
                            <span className="text-[10px] font-black text-cyan-500 uppercase">实时综合评估</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Tactical Multi-Face</span>
                         </div>
                         
                         {/* SVG Radar implementation */}
                         <div className="relative w-48 h-48 mt-4">
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                               {/* 背景网格线 */}
                               {[0.2, 0.4, 0.6, 0.8, 1].map((r, idx) => (
                                 <polygon key={idx} points={getRadarPoints(r * 40)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                               ))}
                               {/* 轴线 */}
                               <RadarLines />
                               {/* 数据多面体 */}
                               <motion.polygon 
                                 initial={{ opacity: 0, scale: 0.5 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 points={getDataPoints(radarData)} 
                                 fill="rgba(6, 182, 212, 0.2)" 
                                 stroke="#06b6d4" 
                                 strokeWidth="1.5" 
                               />
                            </svg>
                            {/* 维度文字标签 */}
                            <RadarLabel top="-10%" left="50%" text="合规" />
                            <RadarLabel top="25%" left="105%" text="情绪" />
                            <RadarLabel top="85%" left="85%" text="战术" />
                            <RadarLabel top="85%" left="15%" text="透明" />
                            <RadarLabel top="25%" left="-5%" text="效率" />
                         </div>
                      </div>

                      {/* 维度解析看板 */}
                      <div className="grid grid-cols-2 gap-3">
                         <DimensionCard label="情绪稳定性" value={radarData[1] + '%'} status="良好" />
                         <DimensionCard label="战术采用率" value={radarData[2] + '%'} status="优秀" color="text-green-400" />
                      </div>
                   </div>
                 )}

                 {/* 智脑建议与战绩页保持逻辑不变... */}
                 {activeTab === 'AI' && (
                   <div className="space-y-4">
                      {lastAiAnalysis ? (
                        <div className="bg-cyan-500/10 p-5 rounded-[32px] border border-cyan-500/20">
                           <h4 className="text-[10px] font-black text-cyan-400 uppercase mb-3 flex items-center gap-2"><BrainCircuit size={14}/> 实时实战方案</h4>
                           <p className="text-[13px] text-white font-medium leading-relaxed mb-5 italic">"{lastAiAnalysis.suggestion}"</p>
                           <button onClick={(e) => { e.stopPropagation(); copyToClipboard(lastAiAnalysis.suggestion); }} className="w-full py-3 bg-cyan-600 text-white rounded-2xl text-[11px] font-black uppercase active:scale-95 transition-all">执行建议</button>
                        </div>
                      ) : <EmptyState text="战术大脑静默中" />}
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// --- 雷达图坐标辅助函数 ---
function getRadarPoints(radius: number) {
  const points = []
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
    points.push(`${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`)
  }
  return points.join(' ')
}

function getDataPoints(data: number[]) {
  const points = []
  for (let i = 0; i < 5; i++) {
    const radius = (data[i] / 100) * 40
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
    points.push(`${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`)
  }
  return points.join(' ')
}

function RadarLines() {
  return (
    <>
      {[0, 1, 2, 3, 4].map(i => {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        return <line key={i} x1="50" y1="50" x2={50 + 40 * Math.cos(angle)} y2={50 + 40 * Math.sin(angle)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      })}
    </>
  )
}

function RadarLabel({ top, left, text }: any) {
  return (
    <div className="absolute text-[8px] font-black text-slate-500 uppercase tracking-tighter" style={{ top, left, transform: 'translateX(-50%)' }}>
      {text}
    </div>
  )
}

function DimensionCard({ label, value, status, color = "text-cyan-400" }: any) {
  return (
    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
       <div className="text-[8px] text-slate-500 font-bold uppercase mb-1">{label}</div>
       <div className="flex items-baseline gap-2">
          <span className={cn("text-lg font-black", color)}>{value}</span>
          <span className="text-[8px] font-bold text-slate-600 uppercase">{status}</span>
       </div>
    </div>
  )
}

function TabButton({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return (
    <button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all", isSelected ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}>
      {icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 mt-10">
       <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-cyan-500 animate-spin" />
       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{text}</p>
    </div>
  )
}
