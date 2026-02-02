import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, ShieldAlert, TrendingUp, Target, Activity, Trophy, Medal } from 'lucide-react'

// 抽取 StatCard 以提高可读性
function StatCard({ title, value, unit, color = "text-white" }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => alert(`[战术下钻] 正在调取 ${title} 的历史原始链路数据...`)}
      className="bg-slate-900/40 border border-white/10 p-10 rounded-[48px] backdrop-blur-xl relative overflow-hidden group cursor-pointer"
    >
      <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-20 transition-all text-white">
        <TrendingUp size={100} />
      </div>
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">{title}</h4>
      <div className="flex items-baseline gap-3">
        <span className={cn("text-6xl font-black tracking-tighter text-tactical-glow leading-none", color)}>{value}</span>
        {unit && <span className="text-sm font-black text-slate-600 uppercase">{unit}</span>}
      </div>
    </motion.div>
  )
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ')

export default function BigScreen() {
  const [stats, setStats] = useState<any>(null)
  const [highlighter, setHighlighter] = useState<any>(null)
  const alertAudio = useRef<HTMLAudioElement | null>(null)

  // 模拟从后端获取实时数据
  useEffect(() => {
    const timer = setInterval(() => {
      // 随机波动数据
      setStats({
        total_risk_today: 12 + Math.floor(Math.random() * 5),
        ai_correction_rate: '94%',
        active_agents: 4,
        avg_response_time: '0.7s',
        risk_distribution: [
          {name: '违规引流', value: 40 + Math.floor(Math.random() * 10)},
          {name: '消极怠工', value: 25},
          {name: '敏感词汇', value: 35}
        ]
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 font-sans overflow-y-auto custom-scrollbar scanline grain relative pb-32">
      {/* 性能优化：使用更轻量的背景装饰，减少 blur 实时计算 */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
         {[...Array(3)].map((_, i) => (
           <div
             key={i}
             className="absolute rounded-full bg-cyan-500/10 blur-[80px] animate-pulse"
             style={{
               width: '400px',
               height: '400px',
               top: `${Math.random() * 80}%`,
               left: `${Math.random() * 80}%`,
               animationDuration: `${10 + i * 5}s`
             }}
           />
         ))}
      </div>

      <AnimatePresence>
        {highlighter && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-10 top-10 z-[200] w-80"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-[2px] rounded-[32px] shadow-[0_0_50px_rgba(245,158,11,0.3)]">
               <div className="bg-slate-950 rounded-[30px] p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                        <Medal size={24} />
                     </div>
                     <div>
                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">高光战报推送</div>
                        <h4 className="text-sm font-black text-white">{highlighter.username} 斩获勋章</h4>
                     </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">"{highlighter.msg}"</p>
                  <div className="text-2xl font-black text-amber-400 italic">+{highlighter.delta} 积分</div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-cyan-500 rounded-[24px] flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)]">
              <BarChart3 size={36} />
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tighter italic text-white text-tactical-glow uppercase">
                Smart-CS <span className="text-cyan-500">Tactical</span>
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.6em] mt-2 opacity-60">指挥中心实时监控系统</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
             <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
             <span className="text-xs font-black tracking-widest uppercase mr-4">System Core Online</span>
          </div>
        </div>

        {/* 核心 KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          <StatCard title="今日风险拦截" value={stats?.total_risk_today || 12} unit="次" trend="+12%" />
          <StatCard title="AI 战术纠偏" value={stats?.ai_correction_rate || '92%'} color="text-cyan-400" />
          <StatCard title="实时在线坐席" value={stats?.active_agents || 4} unit="人" />
          <StatCard title="平均响应时效" value={stats?.avg_response_time || '0.8s'} color="text-amber-400" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
           <div className="xl:col-span-2 bg-slate-900/40 border border-white/10 rounded-[48px] p-10 backdrop-blur-xl">
              <h3 className="text-xl font-black uppercase mb-10 flex items-center gap-3 text-cyan-500">
                <Target size={24} /> 风险构成全球矩阵
              </h3>
              <div className="space-y-8">
                 {(stats?.risk_distribution || [
                   {name: '违规引流', value: 45},
                   {name: '消极怠工', value: 30},
                   {name: '敏感词汇', value: 25}
                 ]).map((item: any, i: number) => (
                   <div key={i} className="space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em]">
                         <span className="text-slate-400">{item.name}</span>
                         <span className="text-white">{item.value}%</span>
                      </div>
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                         <motion.div 
                           initial={{ width: 0 }} animate={{ width: `${item.value}%` }}
                           className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="flex flex-col gap-8">
              <div className="bg-red-600/10 border-2 border-red-600 rounded-[48px] p-8 backdrop-blur-xl animate-pulse">
                 <h3 className="text-xl font-black uppercase mb-4 text-red-500 flex items-center gap-3">
                   <ShieldAlert size={24} /> 实时异常告警
                 </h3>
                 <div className="space-y-2">
                    <div className="text-sm font-black text-white">节点 AGENT-005 链路不稳定</div>
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest leading-relaxed">
                      疑似监控进程被强行关闭 (已尝试自愈 3 次)
                    </p>
                 </div>
              </div>

              <div className="bg-slate-900/40 border border-white/10 rounded-[48px] p-8 backdrop-blur-xl relative overflow-hidden flex flex-col">
                 <h3 className="text-xl font-black uppercase mb-6 text-amber-500 flex items-center gap-3">
                   <Trophy size={24} /> 战术精英榜
                 </h3>
                 <div className="flex-1 space-y-4">
                    {[
                      { name: '王专员', dept: '销售一部', pts: '2,450' },
                      { name: '李专员', dept: '售后组', pts: '1,820' },
                      { name: '周专员', dept: '技术支持', pts: '940' }
                    ].map((hero, i) => (
                      <div key={i} className="p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-2xl border-l-4 border-amber-500 flex justify-between items-center group transition-all hover:bg-white/5">
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-white group-hover:text-amber-400">{hero.name}</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase">{hero.dept}</span>
                         </div>
                         <div className="text-right">
                            <div className="text-lg font-black text-amber-400 italic">
                              {hero.pts} <span className="text-[8px] opacity-50">PTS</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
