import { motion } from 'framer-motion'
import { BarChart3, ShieldAlert, TrendingUp, Target, Activity, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function BigScreen() {
  const [stats, setStats] = useState<any>(null)
  const alertAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/stats')
      // 自驱动优化：若检测到今日拦截总数增加，触发大屏音效
      if (stats && res.data.total_risk_today > stats.total_risk_today) {
        if (alertAudio.current) {
          alertAudio.current.volume = 0.2
          alertAudio.current.play().catch(() => {})
        }
      }
      setStats(res.data)
    }
    fetchData()
    // ... 保持原有 interval 逻辑
  }, [stats])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 font-sans overflow-hidden scanline grain relative">
      <audio ref={alertAudio} src="https://assets.mixkit.co/active_storage/sfx/2568/2534-preview.mp3" />
      {/* ... 保持原有渲染结构 */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         {[...Array(6)].map((_, i) => (
           <motion.div
             key={i}
             className="absolute w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px]"
             animate={{
               x: [Math.random() * 1000, Math.random() * 1000],
               y: [Math.random() * 800, Math.random() * 800],
             }}
             transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
           />
         ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-cyan-500 rounded-[24px] flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)]">
              <BarChart3 size={36} />
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tighter italic text-white text-tactical-glow">
                SMART-CS <span className="text-cyan-500">TACTICAL</span>
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.6em] mt-2 opacity-60">指挥中心实时监控系统</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
             <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
             <span className="text-xs font-black tracking-widest uppercase mr-4">System Core Online</span>
          </div>
        </div>

        {/* 核心 KPI - 应用字体增强 */}
        <div className="grid grid-cols-4 gap-10 mb-16">
          <StatCard title="今日风险拦截" value={stats?.total_risk_today || 0} unit="ERR" trend="+12%" />
          <StatCard title="AI 战术纠偏" value={stats?.ai_correction_rate || '92%'} color="text-cyan-400" />
          <StatCard title="实时在线坐席" value={stats?.active_agents || 0} unit="AGENTS" />
          <StatCard title="平均响应时效" value={stats?.avg_response_time || '0.8s'} color="text-amber-400" />
        </div>

        <div className="grid grid-cols-3 gap-10">
           <div className="col-span-2 bg-slate-900/40 border border-white/10 rounded-[48px] p-10 backdrop-blur-xl">
              <h3 className="text-xl font-black uppercase mb-10 flex items-center gap-3 text-cyan-500">
                <Target size={24} /> 风险构成全球矩阵
              </h3>
              <div className="space-y-8">
                 {stats?.risk_distribution?.map((item: any, i: number) => (
                   <div key={i} className="space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em]">
                         <span className="text-slate-400">{item.name}</span>
                         <span className="text-white">{item.value}%</span>
                      </div>
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                         <motion.div 
                           initial={{ width: 0 }} animate={{ width: `${item.value}%` }}
                           className="h-full bg-gradient-to-r from-cyan-600 to-blue-400"
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-red-500/5 border border-red-500/20 rounded-[48px] p-10 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5"><ShieldAlert size={120} /></div>
              <h3 className="text-xl font-black uppercase mb-8 text-red-500 flex items-center gap-3">
                <Activity size={24} /> 紧急取证流
              </h3>
              <div className="space-y-4">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="p-5 bg-red-500/10 rounded-3xl border border-red-500/20">
                      <div className="flex justify-between text-[10px] font-black text-red-400 mb-1">
                         <span>AGENT-00{i}</span>
                         <span>CRITICAL</span>
                      </div>
                      <p className="text-sm font-bold text-white leading-none">敏感词命中: "私下转账"</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, unit, trend, color = "text-white" }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-slate-900/40 border border-white/10 p-10 rounded-[48px] backdrop-blur-xl relative overflow-hidden group"
    >
      <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={100} /></div>
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">{title}</h4>
      <div className="flex items-baseline gap-3">
        <span className={cn("text-6xl font-black tracking-tighter text-tactical-glow leading-none", color)}>{value}</span>
        {unit && <span className="text-sm font-black text-slate-600 uppercase">{unit}</span>}
      </div>
    </motion.div>
  )
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ')