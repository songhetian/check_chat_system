import React from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Star, AlertTriangle, History, ShoppingBag, TrendingUp, X, Fingerprint, ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/utils'

export const CustomerHUD = ({ data, onDismiss }: { data: any, onDismiss: () => void }) => {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-6 top-24 bottom-24 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl z-50 flex flex-col overflow-hidden"
    >
      {/* 顶部：模拟识别动画头部 */}
      <header className={cn(
        "p-6 border-b flex justify-between items-center relative overflow-hidden",
        data.level === 'VIP' ? "bg-amber-500/10 border-amber-500/20" : "bg-cyan-500/10 border-cyan-500/20"
      )}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
        <div className="flex items-center gap-3 relative z-10">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
            data.level === 'VIP' ? "bg-amber-600 shadow-amber-600/20" : "bg-cyan-600 shadow-cyan-600/20"
          )}>
            <Fingerprint size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase italic tracking-widest">智能画像识别</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 animate-pulse">Identity Verified</p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-2 text-slate-500 hover:text-white transition-colors relative z-10"><X size={18}/></button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-dark">
        {/* 用户基础卡片 */}
        <section className="bg-white/5 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">当前匹配对象</span>
                 <h3 className="text-xl font-black text-white leading-none">{data.name}</h3>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                data.level === 'VIP' ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-300"
              )}>{data.level}</span>
           </div>
           <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-white/5 text-slate-300 text-[9px] font-black rounded border border-white/10 uppercase italic">
                  #{tag}
                </span>
              ))}
           </div>
        </section>

        {/* 核心战术指标 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase mb-2">
              <TrendingUp size={10} className="text-cyan-500" /> 终身价值
            </div>
            <div className="text-sm font-black text-white font-mono">¥{data.ltv}</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase mb-2">
              <History size={10} className="text-emerald-500" /> 沟通频次
            </div>
            <div className="text-sm font-black text-white font-mono">{data.frequency}次</div>
          </div>
        </div>

        {/* 消费趋势图表 */}
        <section className="space-y-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={12} /> 购买力雷达 (6M)
          </span>
          <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
             <div className="h-16 flex items-end gap-1.5 px-1">
               {(data.trend || [20, 40, 30, 50, 40, 60]).map((val: number, i: number) => {
                 const height = (val / 100) * 100;
                 return (
                   <motion.div
                     key={i}
                     initial={{ height: 0 }}
                     animate={{ height: `${Math.max(height, 10)}%` }}
                     className={cn(
                       "flex-1 rounded-t-sm",
                       i === 5 ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "bg-white/10"
                     )}
                   />
                 )
               })}
             </div>
          </div>
        </section>

        {/* 偏好列表 */}
        <section className="space-y-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag size={12} /> 意向/已购商品
          </span>
          <div className="space-y-2">
            {data.lastProducts.map((p: string) => (
              <div key={p} className="flex items-center justify-between text-[11px] font-bold text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                {p} <Star size={10} className="text-amber-500 fill-amber-500 opacity-50" />
              </div>
            ))}
          </div>
        </section>

        {data.isRisk && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
             <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
             <p className="text-[10px] font-bold text-red-400 leading-relaxed uppercase">
                警告：该客户在近 30 天内曾有 2 次恶意投诉记录，请严格按照 SOP 流程沟通。
             </p>
          </div>
        )}
      </div>

      <footer className="p-6 bg-white/5 border-t border-white/5">
         <div className="flex items-center gap-3 opacity-50">
            <ShieldCheck size={14} className="text-cyan-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">身份链路已加密加密</span>
         </div>
      </footer>
    </motion.div>
  )
}