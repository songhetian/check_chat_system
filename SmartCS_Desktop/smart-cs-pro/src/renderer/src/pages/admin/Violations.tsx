import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Eye, 
  CheckCircle2, 
  Trophy, 
  Clock, 
  User, 
  Search,
  Filter,
  ArrowRight
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { cn } from '../../lib/utils'

export default function ViolationsPage() {
  const { violations } = useRiskStore()
  const [selectedViolation, setSelectedViolation] = useState<any>(null)

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">紧急响应队列</h2>
          <p className="text-slate-500 text-sm">实时拦截记录与证据链复盘中心</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
            <Clock size={16} className="text-slate-400" />
            <span className="text-xs font-bold">今日累计：{violations.length} 次</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* 左侧：违规列表流 */}
        <div className="col-span-5 flex flex-col gap-4 overflow-y-auto pr-2">
          <AnimatePresence mode='popLayout'>
            {violations.map((v, index) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedViolation(v)}
                className={cn(
                  "group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                  selectedViolation?.id === v.id 
                    ? "bg-white border-cyan-500 shadow-xl shadow-cyan-500/10" 
                    : "bg-white/50 border-slate-200 hover:border-slate-300 hover:bg-white"
                )}
              >
                {selectedViolation?.id === v.id && (
                  <motion.div layoutId="active-pill" className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <User size={14} className="text-slate-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{v.agent}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{new Date(v.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                    "bg-red-100 text-red-600 border border-red-200"
                  )}>
                    敏感词命中
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  上下文：<span className="italic">"{v.context}"</span>
                </p>
                
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">命中关键词:</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">{v.keyword}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 右侧：证据复盘区 (红框截图展示) */}
        <div className="col-span-7 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {selectedViolation ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <AlertTriangle className="text-red-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">取证详情回放</h3>
                    <p className="text-xs text-slate-500">ID: {selectedViolation.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95">
                    <Trophy size={14} /> 表现优异，一键表扬
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">
                    <CheckCircle2 size={14} /> 核实无误
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* 截图容器 - 关键：红框标注逻辑 */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">现场截图证据</span>
                  <div className="relative rounded-2xl border-4 border-slate-100 overflow-hidden bg-slate-200 aspect-video group">
                    <img 
                      src={selectedViolation.screenshot || 'https://via.placeholder.com/800x450/f1f5f9/64748b?text=Evidence+Screenshot'} 
                      className="w-full h-full object-cover"
                    />
                    {/* 模拟红框标注：利用 CSS 绝对定位在文字识别处画框 */}
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute border-4 border-red-500 shadow-[0_0_0_4000px_rgba(0,0,0,0.4)]"
                      style={{ top: '40%', left: '30%', width: '120px', height: '40px' }}
                    >
                      <div className="absolute -top-8 left-0 bg-red-500 text-white text-[10px] px-2 py-1 font-bold rounded flex items-center gap-1">
                        命中：{selectedViolation.keyword}
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">坐席原始录入</span>
                    <p className="text-sm mt-1 text-slate-700 font-medium">"{selectedViolation.context}"</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-100">
                    <span className="text-[10px] font-black text-cyan-600 uppercase">自动纠偏建议</span>
                    <p className="text-sm mt-1 text-cyan-900 font-bold italic">“您好，非常抱歉给您带来不便，我会立即为您处理...”</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
              <Eye size={48} strokeWidth={1} />
              <p className="text-sm font-medium">请从左侧列表选择一条记录进行复盘</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
