import { motion } from 'framer-motion'
import { BarChart3, ShieldAlert, TrendingUp, Target, Activity, Download, Trophy, Star, Medal } from 'lucide-react'

export default function BigScreen() {
  const [stats, setStats] = useState<any>(null)
  const [highlighter, setHighlighter] = useState<any>(null)
  const alertAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // 模拟监听全网奖励广播 (实际应通过 WebSocket 监听 REWARD_NOTIFY)
    const onGlobalReward = (e: any) => {
      if (e.detail.delta >= 50) { // 只展示大额奖励
        setHighlighter(e.detail)
        setTimeout(() => setHighlighter(null), 5000)
      }
    }
    window.addEventListener('trigger-reward', onGlobalReward)
    return () => window.removeEventListener('trigger-reward', onGlobalReward)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 font-sans overflow-hidden scanline grain relative">
      {/* 自驱动优化：高光战报浮层 */}
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
                  <div className="text-2xl font-black text-amber-400 italic">+{highlighter.delta} PTS</div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* 紧急取证流 / 异常告警 (自驱动优化) */}
        <div className="flex flex-col gap-8">
           <div className="bg-red-600/10 border-2 border-red-600 rounded-[48px] p-8 backdrop-blur-xl animate-pulse">
              <h3 className="text-xl font-black uppercase mb-4 text-red-500 flex items-center gap-3">
                <ShieldAlert size={24} /> 篡改检测告警
              </h3>
              <div className="space-y-2">
                 <div className="text-sm font-black text-white">坐席 AGENT-005 链路不稳定</div>
                 <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                   疑似监控进程被强行关闭 (已尝试自愈 3 次)
                 </p>
              </div>
           </div>

           <div className="bg-slate-900/40 border border-white/10 rounded-[48px] p-8 backdrop-blur-xl relative overflow-hidden flex flex-col">
              <h3 className="text-xl font-black uppercase mb-6 text-amber-500 flex items-center gap-3">
                <Trophy size={24} /> 新兵营毕业荣誉榜
              </h3>
              <div className="flex-1 space-y-4">
                 {[
                   { name: '王小二', dept: '销售一部', rank: 'Elite Operator' },
                   { name: '李萌萌', dept: '售后组', rank: 'Veteran' },
                   { name: '周杰', dept: '技术支持', rank: 'Elite Operator' }
                 ].map((hero, i) => (
                   <div className="p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-2xl border-l-4 border-amber-500 flex justify-between items-center group">
                      <div className="flex flex-col">
                         <span className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">{hero.name}</span>
                         <div className="flex items-center gap-2">
                            <span className="text-[8px] text-slate-500 font-bold uppercase">{hero.dept}</span>
                            <span className="text-[7px] bg-red-500/20 text-red-400 px-1 rounded">风险对冲已扣除</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-lg font-black text-amber-400 italic tracking-tighter">
                           {i === 0 ? '2,450' : i === 1 ? '1,820' : '940'} <span className="text-[8px] opacity-50">PTS</span>
                         </div>
                         <div className="text-[7px] text-cyan-500 font-bold uppercase">综合评分: EXCELLENT</div>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                 <span className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase">Honor. Loyalty. Excellence.</span>
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