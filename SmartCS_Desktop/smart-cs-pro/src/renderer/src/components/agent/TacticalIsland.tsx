import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Zap, 
  Video, 
  VolumeX, 
  BrainCircuit, 
  Copy, 
  WifiOff, 
  MessageSquare, 
  ChevronRight,
  User,
  AlertTriangle,
  Smile,
  Target,
  Frown,
  RefreshCw
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'
import axios from 'axios'

export const TacticalIsland = () => {
  const { isAlerting, lastViolation, sendMessage, lastAiAnalysis, isOnline } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const handleMute = () => {
    sendMessage({ type: 'MUTE_AGENT', agent_id: user?.username, timestamp: Date.now() })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('战术建议已应用')
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        layout
        animate={{
          width: isAlerting ? 420 : isExpanded ? 520 : 240,
          height: isExpanded ? 450 : 48,
          backgroundColor: isAlerting ? 'rgba(220, 38, 38, 0.95)' : 
                           lastAiAnalysis ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.85)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "rounded-[24px] border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col cursor-pointer select-none",
          lastAiAnalysis && "ring-4 ring-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", isAlerting ? "bg-white text-red-600" : "bg-cyan-500/20 text-cyan-400")}>
              <Shield size={16} />
            </div>
            {lastAiAnalysis && (
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">超脑指挥中</span>
            )}
          </div>
          <div className="flex items-center gap-2">
             <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">System Link Active</div>
          </div>
        </div>

        {/* Expanded Intelligence Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 pt-0 space-y-5 overflow-hidden">
              {lastAiAnalysis && (
                <div className="space-y-4">
                  {/* AI 维度矩阵 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                       <div className="text-[8px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><Smile size={10} /> 客户情绪</div>
                       <div className={cn("text-xs font-black", lastAiAnalysis.sentiment_score < 40 ? "text-red-400" : "text-green-400")}>
                         {lastAiAnalysis.sentiment_score}%
                       </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                       <div className="text-[8px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><User size={10} /> 职业画像</div>
                       <div className="text-[10px] font-black text-white truncate">{lastAiAnalysis.persona.profession}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                       <div className="text-[8px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1"><Target size={10} /> 战术博弈</div>
                       <div className="text-[10px] font-black text-cyan-400 truncate">{lastAiAnalysis.strategy}</div>
                    </div>
                  </div>

                  {/* 核心建议 */}
                  <div className="bg-cyan-500/10 rounded-[20px] p-4 border border-cyan-500/20 relative group">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1"><BrainCircuit size={12} /> 一键纠偏建议</span>
                       <span className="text-[9px] text-slate-500 font-bold italic">{lastAiAnalysis.persona.personality}</span>
                    </div>
                    <p className="text-[12px] text-white font-medium leading-relaxed italic mb-3">"{lastAiAnalysis.suggestion}"</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(lastAiAnalysis.suggestion); }}
                      className="w-full py-2 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-cyan-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Copy size={12} /> 立即覆盖原话术
                    </button>
                  </div>
                </div>
              )}

              {/* 原有工具栏 */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <ToolButton icon={<VolumeX size={14} />} label="静音保护" onClick={handleMute} />
                <ToolButton icon={<Video size={14} />} label="证据溯源" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const ToolButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <div onClick={(e) => { e.stopPropagation(); onClick?.(); }} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group active:scale-95">
    <div className="text-slate-400 group-hover:text-cyan-400">{icon}</div>
    <span className="text-[11px] text-slate-300 font-black uppercase tracking-tighter">{label}</span>
  </div>
)
