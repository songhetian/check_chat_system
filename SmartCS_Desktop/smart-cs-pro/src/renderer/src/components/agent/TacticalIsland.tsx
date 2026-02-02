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
  Radar
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, sendMessage, lastAiAnalysis, isOnline, violations, isAiOptimizeEnabled, setAiOptimize } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'AI' | 'HISTORY' | 'STATS'>('AI')

  // 同步窗口尺寸
  useEffect(() => {
    const width = isAlerting ? 420 : isExpanded ? 550 : 240
    const height = isExpanded ? 580 : 48
    window.electron.ipcRenderer.send('resize-window', { width, height })
  }, [isExpanded, isAlerting])

  // 雷达图数据计算 (集成自驱动优化：AI 开启则战术加分)
  const radarData = useMemo(() => {
    const base = [65, 80, 45, 90, 70]
    if (violations.length > 0) base[0] = Math.max(20, 100 - violations.length * 10)
    if (lastAiAnalysis) {
      base[1] = lastAiAnalysis.sentiment_score
      base[2] = (100 - lastAiAnalysis.risk_score * 10) + (isAiOptimizeEnabled ? 20 : 0)
      base[2] = Math.min(base[2], 100)
    }
    return base
  }, [violations, lastAiAnalysis, isAiOptimizeEnabled])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    window.dispatchEvent(new CustomEvent('trigger-toast', { detail: { title: '战术同步', message: '纠偏话术已就绪', type: 'success' } }))
  }

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 overflow-hidden">
      <motion.div layout className={cn("bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col select-none rounded-[32px]", lastAiAnalysis && "ring-2 ring-cyan-500/50")} style={{ width: isAlerting ? 420 : isExpanded ? 550 : 240 }}>
        <div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/5 cursor-move" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAlerting ? "bg-white text-red-600" : "bg-cyan-500/20 text-cyan-400")}><Shield size={16} /></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">TACTICAL LINK PRO</span>
          </div>
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
             <button onClick={() => setIsExpanded(!isExpanded)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-colors">
               <MousePointer2 size={12} className={cn("text-white transition-transform", isExpanded && "rotate-180")} />
             </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex p-2 bg-black/20 gap-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 <TabButton id="AI" active={activeTab} set={setActiveTab} icon={<BrainCircuit size={12}/>} label="超脑" />
                 <TabButton id="HISTORY" active={activeTab} set={setActiveTab} icon={<Radar size={12}/>} label="记录" />
                 <TabButton id="STATS" active={activeTab} set={setActiveTab} icon={<Activity size={12}/>} label="战绩" />
              </div>

              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
                 {activeTab === 'AI' && (
                   <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all", isAiOptimizeEnabled ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "bg-slate-800 text-slate-500")}><Zap size={20} /></div>
                            <div>
                               <div className="text-[10px] font-black text-white uppercase">AI 自动优化模式</div>
                               <div className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">{isAiOptimizeEnabled ? '神经链路已激活' : '仅进行风险拦截'}</div>
                            </div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); setAiOptimize(!isAiOptimizeEnabled); }} className={cn("w-12 h-6 rounded-full relative transition-all", isAiOptimizeEnabled ? "bg-cyan-600" : "bg-slate-700")}>
                            <motion.div animate={{ x: isAiOptimizeEnabled ? 26 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-lg" />
                         </button>
                      </div>
                      {lastAiAnalysis ? (
                        <div className="bg-cyan-500/10 p-5 rounded-[32px] border border-cyan-500/20">
                           <h4 className="text-[10px] font-black text-cyan-400 uppercase mb-3 flex items-center gap-2">实时战术方案</h4>
                           <p className="text-[13px] text-white font-medium leading-relaxed mb-5 italic">"{lastAiAnalysis.suggestion}"</p>
                           <button onClick={(e) => { e.stopPropagation(); copyToClipboard(lastAiAnalysis.suggestion); }} className="w-full py-3 bg-cyan-600 text-white rounded-2xl text-[11px] font-black uppercase active:scale-95 transition-all">执行修正话术</button>
                        </div>
                      ) : <EmptyState text="等待对话触发" />}
                   </div>
                 )}

                 {activeTab === 'HISTORY' && (
                   <div className="space-y-6 flex flex-col items-center">
                      <div className="relative w-48 h-48 mt-4">
                        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                           {[0.2, 0.4, 0.6, 0.8, 1].map((r, idx) => (
                             <polygon key={idx} points={getRadarPoints(r * 40)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                           ))}
                           <motion.polygon points={getDataPoints(radarData)} fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full">
                         <DimensionCard label="合规" value={radarData[0] + '%'} />
                         <DimensionCard label="战术" value={radarData[2] + '%'} />
                      </div>
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

function getRadarPoints(radius: number) {
  let p = []; for (let i = 0; i < 5; i++) { const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; p.push(`${50 + radius * Math.cos(a)},${50 + radius * Math.sin(a)}`); }
  return p.join(' ')
}
function getDataPoints(data: number[]) {
  let p = []; for (let i = 0; i < 5; i++) { const r = (data[i] / 100) * 40; const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`); }
  return p.join(' ')
}
function DimensionCard({ label, value }: any) {
  return <div className="bg-white/5 p-3 rounded-2xl border border-white/5"><div className="text-[8px] text-slate-500 font-bold uppercase">{label}</div><div className="text-lg font-black text-white">{value}</div></div>
}
function TabButton({ id, active, set, icon, label }: any) {
  const isSelected = active === id
  return <button onClick={(e) => { e.stopPropagation(); set(id); }} className={cn("flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all", isSelected ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}>{icon}<span className="text-[9px] font-black uppercase tracking-tighter">{label}</span></button>
}
function EmptyState({ text }: { text: string }) {
  return <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 mt-10"><div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-cyan-500 animate-spin" /><p className="text-[10px] font-black text-slate-600 uppercase">{text}</p></div>
}