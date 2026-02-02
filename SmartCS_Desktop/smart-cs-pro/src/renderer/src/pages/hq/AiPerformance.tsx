import { motion } from 'framer-motion'
import { BrainCircuit, Clock, Zap, BarChart3, TrendingUp, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AiPerformancePage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/hq/ai-performance').then(res => setData(res.data))
  }, [])

  if (!data) return null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">数智效能 (AI ROI) 审计看板</h2>
        <p className="text-slate-500 text-sm">量化 AI 智脑对全公司业务效率的实际贡献与工时缩减</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="累计 AI 优化频次" value={data.total_optimizations} unit="次" icon={<Zap className="text-amber-500"/>} />
        <KPICard title="精炼话术总字数" value={data.total_chars_refined} unit="CHARS" icon={<BrainCircuit className="text-cyan-500"/>} />
        <KPICard title="缩减人工总工时" value={data.total_hours_saved} unit="HOURS" icon={<Clock className="text-green-500"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 效能增长趋势 */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
           <h3 className="text-lg font-black uppercase mb-8 flex items-center gap-2">
             <TrendingUp size={20} className="text-cyan-600" /> 效能增长轨迹 (近6月)
           </h3>
           <div className="h-48 flex items-end gap-4 px-4">
              {data.efficiency_trend.map((h: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                   <motion.div 
                     initial={{ height: 0 }} animate={{ height: `${h}%` }}
                     className="w-full bg-slate-100 rounded-t-xl relative group"
                   >
                      <div className="absolute inset-0 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-all rounded-t-xl" />
                   </motion.div>
                   <span className="text-[10px] font-black text-slate-400">{i+1}月</span>
                </div>
              ))}
           </div>
        </div>

        {/* 部门贡献排行 */}
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl">
           <h3 className="text-lg font-black uppercase mb-8 flex items-center gap-2">
             <Users size={20} className="text-cyan-400" /> 部门 AI 贡献排行
           </h3>
           <div className="space-y-6">
              {data.top_performing_depts.map((dept: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="text-2xl font-black text-white/20">0{i+1}</div>
                      <span className="font-bold text-sm">{dept.name}</span>
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-black text-slate-500 uppercase">累计节省</div>
                      <div className="text-lg font-black text-cyan-400">{dept.savings}</div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, unit, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
       <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">{icon}</div>
       <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-black text-slate-900 tracking-tighter">{value.toLocaleString()}</span>
             <span className="text-xs font-bold text-slate-400">{unit}</span>
          </div>
       </div>
    </div>
  )
}
