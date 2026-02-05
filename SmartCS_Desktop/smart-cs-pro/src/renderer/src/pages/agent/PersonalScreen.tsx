import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, Activity, Trophy, Zap, History, 
  MessageSquare, Star, Target, CheckCircle2,
  AlertTriangle, Hand, Layout
} from 'lucide-react'
import { cn, tacticalRequest } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'

export default function PersonalScreen() {
  const { user, token, setUser } = useAuthStore()
  const [violations, setViolations] = useState<any[]>([])
  const [resolved, setResolved] = useState<any[]>([])
  const [stats, setStats] = useState({ score: 100, rank: '精英' })
  const [time, setTime] = useState(new Date())

  const fetchData = async () => {
    if (!token) return
    try {
      // 0. 获取最新用户信息 (同步积分)
      const resU = await tacticalRequest({
        url: `${CONFIG.API_BASE}/auth/me`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resU.status === 200) setUser(resU.data.data)

      // 1. 获取个人违规历史
      const resV = await tacticalRequest({
        url: `${CONFIG.API_BASE}/admin/violations?username=${user?.username}&status=PENDING&size=10`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resV.status === 200) setViolations(resV.data.data)

      // 2. 获取个人解决库
      const resR = await tacticalRequest({
        url: `${CONFIG.API_BASE}/admin/violations?username=${user?.username}&status=RESOLVED&size=10`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resR.status === 200) setResolved(resR.data.data)
      
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(() => setTime(new Date()), 1000)
    const sync = setInterval(fetchData, 10000)
    return () => { clearInterval(timer); clearInterval(sync); }
  }, [])

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-10 font-sans selection:bg-cyan-500 overflow-hidden relative">
      {/* 战术背景 */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto flex flex-col gap-10">
        {/* Header */}
        <header className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-widest italic">Personal HUD</div>
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-[0.3em] uppercase">{time.toLocaleDateString()}</span>
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              个人<span className="text-cyan-400">实战态势</span>舱
            </h1>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2 font-mono">{time.toLocaleTimeString()}</div>
             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[24px] border border-white/10 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black italic border border-cyan-500/20">{user?.real_name?.[0]}</div>
                <div className="flex flex-col items-start pr-4">
                   <span className="text-sm font-black text-white">{user?.real_name}</span>
                   <span className="text-[9px] font-bold text-slate-500 uppercase">操作员ID: {user?.username}</span>
                </div>
             </div>
          </div>
        </header>

        {/* Main Grid */}
        <main className="grid grid-cols-12 gap-10">
           {/* 左侧：核心指标 */}
           <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
              <div className="p-8 bg-slate-900/60 rounded-[40px] border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                 <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 rotate-12">
                    <Target size={180} />
                 </div>
                 <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                    <Shield size={16} className="text-cyan-400" /> 实时战术评分
                 </h4>
                 <div className="flex items-baseline gap-4">
                    <span className="text-7xl font-black italic text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                      {user?.tactical_score || 100}
                    </span>
                    <span className="text-sm font-black text-cyan-500 uppercase italic">Points</span>
                 </div>
                 <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-600 uppercase">战术衔级</span>
                       <span className="text-xs font-black text-white italic tracking-widest">ELITE SQUAD</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                       <Trophy size={20} className="text-amber-400" />
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-8 bg-slate-900/60 rounded-[40px] border border-white/5 backdrop-blur-2xl flex flex-col gap-6">
                 <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                    <Star size={16} className="text-amber-400" /> 近期实战荣誉
                 </h4>
                 <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-all">
                         <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400"><Zap size={18} /></div>
                         <div>
                            <p className="text-xs font-black text-white mb-1">高效拦截达人</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">连续3天无高危违规</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* 中间：拦截流 */}
           <div className="col-span-12 lg:col-span-4 bg-slate-900/40 rounded-[48px] p-8 border border-white/5 backdrop-blur-xl flex flex-col h-[700px]">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                 <History size={16} className="text-red-500 animate-pulse" /> 实时拦截回溯
              </h4>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
                 {violations.map((v, i) => (
                   <div key={i} className="p-6 rounded-[32px] bg-red-500/5 border border-red-500/10 flex flex-col gap-3 group hover:bg-red-500/10 transition-all">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-red-500 uppercase bg-red-500/10 px-2 py-0.5 rounded italic">Intercepted</span>
                         <span className="text-[9px] font-mono text-slate-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-xs font-black text-white italic tracking-tight font-mono">"{v.context}"</div>
                      <div className="flex justify-between items-center mt-1">
                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">触发因子: {v.keyword}</span>
                         <span className="text-[9px] font-black text-red-400">LV.{v.risk_score}</span>
                      </div>
                   </div>
                 ))}
                 {violations.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                      <Shield size={64} className="mb-4 text-emerald-500" />
                      <p className="text-sm font-black uppercase tracking-widest">全域净空 无拦截记录</p>
                   </div>
                 )}
              </div>
           </div>

           {/* 右侧：解决库 */}
           <div className="col-span-12 lg:col-span-4 bg-slate-900/40 rounded-[48px] p-8 border border-white/5 backdrop-blur-xl flex flex-col h-[700px]">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-emerald-500" /> 个人战术解决库
              </h4>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
                 {resolved.map((r, i) => (
                   <div key={i} className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">
                      <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic">Case Resolved</div>
                      <div className="text-sm font-black text-white mb-2 leading-tight">关键词: {r.keyword}</div>
                      <div className="p-3 bg-black/40 rounded-2xl border border-white/5 text-[10px] text-slate-400 italic mb-3 leading-relaxed">
                        场景: "{r.context}"
                      </div>
                      <div className="text-[11px] font-bold text-emerald-400 leading-relaxed bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                         处置: {r.solution}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </main>

        <footer className="mt-4 flex justify-between items-center opacity-30 text-[9px] font-black uppercase tracking-[0.5em] px-4">
           <span>Secure Tactical Link Active</span>
           <span>Powered by Smart-CS Pro v3.0</span>
        </footer>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  )
}
