import { motion } from 'framer-motion'
import { 
  BarChart3, 
  ShieldAlert, 
  TrendingUp, 
  Target, 
  Activity,
  Download,
  Maximize2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function BigScreen() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/stats')
      setStats(res.data)
    }
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleExport = () => {
    window.location.href = 'http://127.0.0.1:8000/api/admin/reports/export'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic">SMART-CS <span className="text-cyan-500">TACTICAL BI</span></h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em]">数智化实时战术决策大屏</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black hover:bg-white/10 transition-all uppercase"
          >
            <Download size={16} className="text-cyan-400" /> 导出战术详表 (Excel)
          </button>
          <div className="px-6 py-3 bg-cyan-500 text-slate-900 rounded-2xl text-xs font-black uppercase">
            Live Stream Online
          </div>
        </div>
      </div>

      {/* 核心 KPI 矩阵 */}
      <div className="grid grid-cols-4 gap-8 mb-12">
        <StatCard title="今日拦截总数" value={stats?.total_risk_today || 0} unit="次" trend="+12.5%" />
        <StatCard title="AI 纠偏成功率" value={stats?.ai_correction_rate || '0%'} color="text-cyan-400" />
        <StatCard title="活跃坐席链路" value={stats?.active_agents || 0} unit="LINE" />
        <StatCard title="平均响应延迟" value={stats?.avg_response_time || '0ms'} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-3 gap-8 h-[500px]">
        {/* 左侧：风险分布图 */}
        <div className="col-span-2 bg-slate-900/50 border border-white/5 rounded-[40px] p-8 relative">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black uppercase flex items-center gap-2">
                <Target size={20} className="text-cyan-500" /> 风险类型分布实时矩阵
              </h3>
              <Activity className="text-slate-700 animate-pulse" />
           </div>
           
           <div className="space-y-6">
              {stats?.risk_distribution?.map((item: any, i: number) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-400">{item.name}</span>
                      <span>{item.value}%</span>
                   </div>
                   <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value * 2}%` }}
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* 右侧：实时动态流 */}
        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 overflow-hidden">
           <h3 className="text-lg font-black uppercase mb-6 text-red-500 flex items-center gap-2">
             <ShieldAlert size={20} /> 紧急拦截流
           </h3>
           <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                   <div className="flex justify-between text-[10px] font-black">
                      <span className="text-cyan-400">AGENT-{i}02</span>
                      <span className="text-slate-500">14:30:05</span>
                   </div>
                   <p className="text-xs text-slate-300 truncate font-medium">触发关键词: "转账给个人"</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, unit, trend, color = "text-white" }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-slate-900/50 border border-white/5 p-8 rounded-[40px] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <TrendingUp size={60} />
      </div>
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</h4>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-5xl font-black tracking-tighter", color)}>{value}</span>
        {unit && <span className="text-sm font-bold text-slate-600">{unit}</span>}
      </div>
      {trend && <div className="mt-4 text-[10px] font-bold text-green-500">↑ {trend} <span className="text-slate-600 ml-1 uppercase">较昨日</span></div>}
    </motion.div>
  )
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ')
