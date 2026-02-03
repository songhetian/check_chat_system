import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, Eye, CheckCircle2, Trophy, Clock, User, 
  BrainCircuit, VideoOff, Loader2 
} from 'lucide-react'
import { useRiskStore } from '../../store/useRiskStore'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export default function ViolationsPage() {
  const { violations } = useRiskStore()
  const [selectedViolation, setSelectedViolation] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
            风险拦截审计 <span className="text-red-500">ALERTS</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">实时违规取证与战术复盘中枢</p>
        </div>
        <div className="bg-slate-50 border rounded-2xl px-6 py-3 flex items-center gap-3">
          <Clock size={18} className="text-slate-400" />
          <span className="text-sm font-black text-slate-700 uppercase">今日累计拦截: {violations.length} 次</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* 左侧：违规流 */}
        <div className="col-span-5 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode='popLayout'>
            {violations.map((v, index) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedViolation(v)}
                className={cn(
                  "p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden",
                  selectedViolation?.id === v.id 
                    ? "bg-white border-cyan-500 shadow-xl" 
                    : "bg-white/50 border-slate-200 hover:bg-white"
                )}
              >
                {selectedViolation?.id === v.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500" />}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">{v.agent[0]}</div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{v.agent}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{new Date(v.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-[9px] font-black rounded border border-red-200 uppercase">敏感词命中</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">上下文: <span className="italic">"{v.context}"</span></p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 右侧：证据链 */}
        <div className="col-span-7 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {selectedViolation ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-600" size={24} />
                  <h3 className="font-black text-slate-900 uppercase">取证回放详情</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const res = await axios.post(`${CONFIG.API_BASE}/ai/summarize`, { context: selectedViolation.context })
                      alert(`【智脑战术综述】\n${res.data.summary}`)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-cyan-500 text-cyan-600 rounded-xl text-xs font-black hover:bg-cyan-50"
                  >
                    <BrainCircuit size={14} /> 智脑提炼
                  </button>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto space-y-8">
                 <div className="aspect-video rounded-3xl bg-slate-900 flex items-center justify-center border-4 border-slate-100 shadow-inner relative overflow-hidden">
                    {selectedViolation.video_path ? (
                      <video controls className="w-full h-full" poster={selectedViolation.screenshot}>
                        <source src={`${CONFIG.API_BASE}/evidence/video/${selectedViolation.id}`} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-600">
                        <VideoOff size={48} strokeWidth={1} />
                        <span className="text-xs font-black uppercase tracking-widest">无视频流证据记录</span>
                      </div>
                    )}
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                       <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">坐席原始录入</span>
                       <p className="text-sm font-medium text-slate-700 italic">"{selectedViolation.context}"</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/20">
                       <span className="text-[10px] font-black text-cyan-600 uppercase block mb-2">纠偏话术建议</span>
                       <p className="text-sm font-black text-cyan-900 leading-relaxed">“非常抱歉，我司全链路加密，请您放心...”</p>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-200 gap-4 uppercase font-black">
              <Eye size={80} strokeWidth={1} />
              <p className="tracking-[0.3em]">选择记录以调取战术详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}