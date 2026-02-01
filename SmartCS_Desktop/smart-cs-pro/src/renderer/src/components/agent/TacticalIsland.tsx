import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertCircle, MessageSquare, Package, ChevronRight } from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

export const TacticalIsland = () => {
  const { isAlerting, lastViolation } = useRiskStore()
  const { user } = useAuthStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleDoubleClick = () => {
    // 调用 Electron 主进程切换窗口尺寸
    window.electron.ipcRenderer.send('open-big-screen')
    // 路由跳转到管理后台
    // navigate('/dashboard')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // 可以在这里触发一个小岛内部的“已复制”动效
  }

  const [isConverting, setIsConverting] = useState(false)

  const handleVideoConvert = async () => {
    // 1. 调用 Electron 选择文件
    const filePath = await window.electron.ipcRenderer.invoke('select-video-file')
    if (!filePath) return

    setIsConverting(true)
    try {
      // 2. 调用 Python 后端开始转换
      const res = await axios.post('http://127.0.0.1:8000/api/agent/convert-video', { input_path: filePath })
      if (res.data.status === 'ok') {
        alert(`转换成功！保存至：${res.data.output}`)
      }
    } catch (err) {
      console.error('转换失败', err)
    } finally {
      setIsConverting(false)
    }
  }

  const handleCopyScript = async () => {
    // 这里简单演示直接获取第一个话术，实际可以弹出一个二级菜单
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/agent/scripts')
      const script = res.data[0].content
      copyToClipboard(script)
      alert('已复制常用话术')
    } catch (err) {
      console.error('获取话术失败')
    }
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        layout
        initial={{ width: 240, height: 48 }}
        onDoubleClick={handleDoubleClick}
        animate={{
          width: isAlerting ? 420 : isExpanded ? 500 : 240,
          height: isExpanded ? 320 : 48,
          backgroundColor: isAlerting ? 'rgba(220, 38, 38, 0.95)' : 'rgba(15, 23, 42, 0.85)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "rounded-[24px] border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col cursor-pointer select-none",
          isAlerting && "ring-4 ring-red-500/30 animate-pulse"
        )}
        onClick={() => !isAlerting && setIsExpanded(!isExpanded)}
      >
        {/* Header / Capsule Row (保持不变) */}
        {/* ... (此处代码省略) */}

        {/* Expanded Content: 战术工具箱 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 pt-2 grid grid-cols-2 gap-4"
            >
              {/* Left Column: Tools */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                  <Zap size={10} /> 快速战术行动
                </h4>
                <ToolButton icon={<MessageSquare size={14} />} label="常用话术库" onClick={handleCopyScript} />
                <ToolButton icon={<Video size={14} />} label={isConverting ? "转码中..." : "视频格式转换"} onClick={handleVideoConvert} />
                <div className="h-[1px] bg-white/5 my-1" />
                <div className="flex items-center justify-between px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                   <span className="text-[10px] text-cyan-400 font-bold">双击切换管理大屏</span>
                   <ChevronRight size={12} className="text-cyan-400" />
                </div>
              </div>
              
              {/* Right Column: Status & Reward (保持不变) */}
              {/* ... (此处代码省略) */}
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
