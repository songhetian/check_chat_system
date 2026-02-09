import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, ShieldCheck, Zap, ArrowRight, X, MessageSquare } from 'lucide-react'

export const KnowledgePanel = ({ onDismiss }: { onDismiss: () => void }) => {
  const kbs = [
    { kw: '退款时效', ans: '所有订单在申请后 24 小时内完成初审，款项通常在 1-3 个工作日原路退回。' },
    { kw: '物流查询', ans: '建议客户通过“我的订单”实时查看。如物流停更超过 48 小时，请立即通过内网录入延迟补偿申请。' },
    { kw: '质量问题', ans: '确认属实后，支持 7 天无理由退换。优先引导客户换货，并赠送一张 20 元无门槛优惠券。' },
    { kw: '账号安全', ans: '请告知客户：官方不会以任何形式索要验证码或密码。如遇可疑引导，请立即物理切断对话并上报。' }
  ]

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-6 top-24 bottom-24 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl z-50 flex flex-col overflow-hidden"
    >
      <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <BookOpen size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase italic tracking-widest">战术知识手册</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Tactical SOP Handbook</p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={18}/></button>
      </header>

      <div className="p-4 border-b border-white/5">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input placeholder="搜索战术条目..." className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-emerald-500/50 transition-all" />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar-dark">
        {kbs.map((kb, i) => (
          <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center gap-2 mb-3">
               <Zap size={12} className="text-emerald-500" />
               <span className="text-xs font-black text-white uppercase tracking-tight">{kb.kw}</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">"{kb.ans}"</p>
            <div className="mt-4 flex justify-end">
               <button className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase hover:text-emerald-400 transition-colors">
                  快速话术回复 <MessageSquare size={12}/>
               </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="p-6 bg-emerald-950/20 border-t border-white/5">
         <div className="flex items-center gap-3 opacity-50">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">内容已通过合规性审计</span>
         </div>
      </footer>
    </motion.div>
  )
}
