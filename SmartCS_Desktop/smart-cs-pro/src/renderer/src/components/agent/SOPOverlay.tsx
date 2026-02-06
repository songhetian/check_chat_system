import { motion } from 'framer-motion'
import { ClipboardList, ChevronRight, X } from 'lucide-react'

export const SOPOverlay = ({ steps, onDismiss }: { steps: string[], onDismiss: () => void }) => {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-6 top-24 w-64 bg-slate-900 border border-white/10 rounded-lg shadow-2xl p-5 z-[60] backdrop-blur-xl"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase">
          <ClipboardList size={14} /> 战术 SOP 指引
        </div>
        <button onClick={onDismiss} className="text-white/40 hover:text-white"><X size={14} /></button>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3 items-start group">
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0 mt-0.5">
              {index + 1}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors cursor-pointer">
              {step}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <button className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase">
          查看完整操作文档 <ChevronRight size={12} />
        </button>
      </div>
    </motion.div>
  )
}
