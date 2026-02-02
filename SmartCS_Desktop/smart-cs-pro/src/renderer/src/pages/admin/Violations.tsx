import { useState } from 'react'
import axios from 'axios'
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
  ArrowRight,
  BrainCircuit,
  VideoOff
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
                  <button 
                    onClick={async () => {
                      const res = await axios.post('http://127.0.0.1:8000/api/ai/summarize', { context: selectedViolation.context })
                      alert(`【AI 战术综述】\n${res.data.summary}`)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-cyan-500 text-cyan-600 rounded-xl text-xs font-black hover:bg-cyan-50 transition-all"
                  >
                    <BrainCircuit size={14} /> AI 智能提炼
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95">
                    <Trophy size={14} /> 表现优异，一键表扬
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">
                    <CheckCircle2 size={14} /> 核实无误
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* 截图/视频 容器 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">现场取证复盘 (截图+视频)</span>
                    {selectedViolation.video_path && (
                      <span className="px-2 py-0.5 bg-cyan-500 text-white text-[9px] font-black rounded-full animate-pulse">
                        VIDEO EVIDENCE READY
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* 截图展示 */}
                    <div className="relative rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-200 aspect-video">
                      <img 
                        src={selectedViolation.screenshot || 'https://via.placeholder.com/800x450/f1f5f9/64748b?text=Evidence+Screenshot'} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/50 text-[8px] text-white px-1.5 py-0.5 rounded font-bold">静态取证</div>
                    </div>

                    {/* 视频回放 (新增) */}
                    <div className="relative rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
                      {selectedViolation.video_path ? (
                        <video 
                          controls 
                          className="w-full h-full"
                          poster={selectedViolation.screenshot}
                        >
                          <source src={`http://127.0.0.1:8000/api/evidence/video/${selectedViolation.id}`} type="video/mp4" />
                          您的系统不支持视频播放
                        </video>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-600">
                          <VideoOff size={24} />
                          <span className="text-[10px] font-bold">无视频证据留存</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-cyan-600/80 text-[8px] text-white px-1.5 py-0.5 rounded font-bold">视频回放链路</div>
                    </div>
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
