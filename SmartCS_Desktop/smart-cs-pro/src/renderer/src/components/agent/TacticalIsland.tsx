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
  AlertTriangle
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
    alert('战术话术已复制')
  }

  const handleDoubleClick = () => {
    window.electron.ipcRenderer.send('open-big-screen')
  }

  const handleVideoConvert = async () => {
    const filePath = await window.electron.ipcRenderer.invoke('select-video-file')
    if (!filePath) return
    setIsConverting(true)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/agent/convert-video', { input_path: filePath })
      if (res.data.status === 'ok') alert(`转换成功！保存至：${res.data.output}`)
    } catch (err) {
      console.error('转换失败', err)
    } finally {
      setIsConverting(false)
    }
  }

  const handleCopyScript = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/agent/scripts')
      if (res.data && res.data.length > 0) {
        copyToClipboard(res.data[0].content)
      }
    } catch (err) {
      console.error('获取话术失败')
    }
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        layout
        onDoubleClick={handleDoubleClick}
        animate={{
          width: isAlerting ? 420 : isExpanded ? 500 : 240,
          height: isExpanded ? 380 : 48,
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
        {/* Header / Capsule Row */}
        <div className="flex items-center justify-between px-4 h-12 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-1.5 rounded-lg transition-colors",
              isAlerting ? "bg-white text-red-600" : "bg-cyan-500/20 text-cyan-400"
            )}>
              <Shield size={16} />
            </div>
            {!isOnline && (
              <motion.div 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-tighter"
              >
                <WifiOff size={12} /> 离线保护中
              </motion.div>
            )}
            {isOnline && !isAlerting && !lastAiAnalysis && (
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">系统监控中...</span>
            )}
            {lastAiAnalysis && !isAlerting && (
              <span className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">识别到战术机会</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
              {user?.username[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 pt-0 space-y-4 overflow-hidden"
            >
              {/* AI Suggestion Section */}
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10 space-y-2 relative overflow-hidden group/ai">
                  {/* 背景装饰动效 */}
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover/ai:scale-125 transition-transform">
                     <BrainCircuit size={80} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                      <BrainCircuit size={12} /> 智脑实时纠偏建议
                    </span>
                    <div className="flex gap-1">
                       <div className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" />
                       <div className="w-1 h-1 rounded-full bg-cyan-500" />
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-slate-200 leading-snug">
                    <span className="text-red-400 font-bold">风险：</span>{lastAiAnalysis.reason}
                  </p>

                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-900/80 p-2.5 rounded-xl border border-cyan-500/20 relative">
                      <p className="text-[11px] text-white font-medium italic">"{lastAiAnalysis.suggestion}"</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(lastAiAnalysis.suggestion); }}
                        className="p-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 transition-all active:scale-90"
                        title="复制话术"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        className="p-2.5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all active:scale-90"
                        title="战术修正"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase font-black text-white/30 tracking-widest flex items-center gap-1">
                    <Zap size={10} /> 战术工具
                  </h4>
                  <ToolButton icon={<VolumeX size={14} />} label="一键静音" onClick={handleMute} />
                  <ToolButton icon={<MessageSquare size={14} />} label="话术库" onClick={handleCopyScript} />
                  <ToolButton icon={<Video size={14} />} label={isConverting ? "处理中..." : "视频转码"} onClick={handleVideoConvert} />
                </div>
                
                <div className="space-y-2">
                   <h4 className="text-[9px] uppercase font-black text-white/30 tracking-widest flex items-center gap-1">
                    <User size={10} /> 当前状态
                  </h4>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">实时负载</div>
                    <div className="text-xs font-black text-cyan-400">NORMAL</div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20" onClick={handleDoubleClick}>
                     <span className="text-[9px] text-cyan-400 font-black">进入管理大屏</span>
                     <ChevronRight size={12} className="text-cyan-400" />
                  </div>
                </div>
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
    <span className="text-[11px] text-slate-300 group-hover:text-white font-medium">{label}</span>
  </div>
)