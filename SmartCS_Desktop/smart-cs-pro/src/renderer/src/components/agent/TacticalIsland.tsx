import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertCircle, MessageSquare, Package, ChevronRight, Zap, Video, VolumeX } from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'
import axios from 'axios'

export const TacticalIsland = () => {
  const { isAlerting, lastViolation, sendMessage, lastAiAnalysis } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleMute = () => {
    sendMessage({ type: 'MUTE_AGENT', agent_id: user?.username, timestamp: Date.now() })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // 可以在这里触发一个小岛内部的“已复制”动效
    alert('战术话术已复制')
  }

  // ... (保持现有逻辑)

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        layout
        initial={{ width: 240, height: 48 }}
        onDoubleClick={handleDoubleClick}
        animate={{
          width: isAlerting ? 420 : isExpanded ? 500 : 240,
          height: isExpanded ? 380 : 48, // 稍微调高一点以容纳 AI 建议
          backgroundColor: isAlerting ? 'rgba(220, 38, 38, 0.95)' : 
                           lastAiAnalysis ? 'rgba(8, 145, 178, 0.95)' : 'rgba(15, 23, 42, 0.85)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "rounded-[24px] border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col cursor-pointer select-none",
          isAlerting && "ring-4 ring-red-500/30 animate-pulse",
          !isAlerting && lastAiAnalysis && "ring-4 ring-cyan-500/30"
        )}
        onClick={() => !isAlerting && setIsExpanded(!isExpanded)}
      >
        {/* ... (Header 保持不变) */}

        {/* Expanded Content: 战术工具箱 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 pt-2 space-y-4"
            >
              {/* Top: AI Suggestion (新增) */}
              {lastAiAnalysis && (
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                      <BrainCircuit size={12} /> AI 实时战术建议 (风险分: {lastAiAnalysis.risk_score})
                    </span>
                    <span className="text-[9px] text-white/40 font-mono italic">语义识别结果</span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-snug">
                    <span className="text-cyan-400 font-bold">原因：</span>{lastAiAnalysis.reason}
                  </p>
                  <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 relative group/advice">
                    <p className="text-[11px] text-white font-medium italic italic">"{lastAiAnalysis.suggestion}"</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(lastAiAnalysis.suggestion); }}
                      className="absolute right-2 top-2 p-1.5 bg-cyan-600 text-white rounded-lg opacity-0 group-hover/advice:opacity-100 transition-all hover:bg-cyan-500 active:scale-90"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Left Column: Tools */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <Zap size={10} /> 快速战术行动
                  </h4>
                  <ToolButton icon={<VolumeX size={14} />} label="一键静音拦截" onClick={handleMute} />
                  <ToolButton icon={<MessageSquare size={14} />} label="常用话术库" onClick={handleCopyScript} />
                  <ToolButton icon={<Video size={14} />} label={isConverting ? "转码中..." : "视频格式转换"} onClick={handleVideoConvert} />
                </div>
                {/* ... (Right Column 保持不变) */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const ToolButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group active:scale-95"
  >
    <div className="text-slate-400 group-hover:text-cyan-400 transition-colors">{icon}</div>
    <span className="text-[11px] text-slate-300 group-hover:text-white">{label}</span>
  </div>
)
