import { motion } from 'framer-motion'
import { UserCheck, Star, AlertTriangle, History, ShoppingBag, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'

export const CustomerHUD = ({ data, onDismiss }: { data: any, onDismiss: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 w-72 bg-white/95 backdrop-blur-xl rounded-[32px] border border-cyan-500/30 shadow-2xl z-50 overflow-hidden"
    >
      {/* 顶部状态条 */}
      <div className={cn(
        "p-4 flex items-center gap-3 text-white",
        data.level === 'VIP' ? "bg-gradient-to-r from-amber-500 to-orange-600" : "bg-slate-900"
      )}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
          <UserCheck size={24} />
        </div>
        <div>
          <div className="text-xs font-bold opacity-80 uppercase tracking-tighter">实时画像识别</div>
          <h3 className="font-black text-lg leading-none">{data.name}</h3>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 标签云 */}
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-cyan-50 text-cyan-700 text-[9px] font-black rounded-md border border-cyan-100 uppercase">
              {tag}
            </span>
          ))}
          {data.isRisk && (
            <span className="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-md border border-red-100 flex items-center gap-1">
              <AlertTriangle size={8} /> 曾有投诉记录
            </span>
          )}
        </div>

        {/* 核心指标 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mb-1">
              <TrendingUp size={10} /> 终身价值
            </div>
            <div className="text-sm font-black text-slate-900">¥{data.ltv}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mb-1">
              <History size={10} /> 沟通频次
            </div>
            <div className="text-sm font-black text-slate-900">{data.frequency}次</div>
          </div>
        </div>

        {/* 近期购买力趋势 - 新增 */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp size={10} /> 近期购买力趋势 (近6月)
          </span>
          <div className="h-12 flex items-end gap-1 px-1">
            {[40, 70, 45, 90, 65, 80].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={cn(
                  "flex-1 rounded-t-sm",
                  i === 5 ? "bg-cyan-500" : "bg-slate-200"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase px-1">
            <span>9月</span>
            <span>当前</span>
          </div>
        </div>

        {/* 购买偏好 */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <ShoppingBag size={10} /> 意向/已购商品
          </span>
          <div className="space-y-1.5">
            {data.lastProducts.map((p: string) => (
              <div key={p} className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-slate-50/50 p-2 rounded-lg">
                {p} <Star size={10} className="text-amber-400 fill-amber-400" />
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={onDismiss}
          className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
        >
          关闭画像预览
        </button>
      </div>
    </motion.div>
  )
}
