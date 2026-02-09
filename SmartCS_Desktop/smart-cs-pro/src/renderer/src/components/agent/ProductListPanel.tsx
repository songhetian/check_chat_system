import React from 'react'
import { motion } from 'framer-motion'
import { Package, Star, ShoppingCart, Tag, ShieldCheck, X } from 'lucide-react'

export const ProductListPanel = ({ onDismiss }: { onDismiss: () => void }) => {
  const products = [
    { name: '旗舰款智能手表 Pro', price: '2,999', tags: ['爆款', '高利润'], stock: 120, usp: '超长续航, 医疗级监测' },
    { name: '降噪耳机 Air-X', price: '1,299', tags: ['引流', '口碑'], stock: 450, usp: '45dB 主动降噪, Hi-Res 认证' },
    { name: '极简办公机械键盘', price: '599', tags: ['新品'], stock: 85, usp: '全键热插拔, 自研静音轴' },
    { name: '超薄便携显示屏', price: '1,599', tags: ['高连带'], stock: 30, usp: '100% sRGB, 触控交互' }
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
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
            <Package size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase italic tracking-widest">关联产品中心</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Real-time Matching</p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={18}/></button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar-dark">
        {products.map((p, i) => (
          <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase">{p.name}</span>
              <span className="text-sm font-black text-cyan-500 font-mono">¥{p.price}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic mb-4">"{p.usp}"</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[8px] font-black rounded border border-cyan-500/20 uppercase tracking-tighter">{t}</span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">当前库存: {p.stock}</span>
               <button className="px-4 py-1.5 bg-cyan-600 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-cyan-900/40">一键推送</button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
