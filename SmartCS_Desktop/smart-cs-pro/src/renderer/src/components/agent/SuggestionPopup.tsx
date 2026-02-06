import { motion, AnimatePresence } from 'framer-motion'
import { Package, ShoppingCart, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export const SuggestionPopup = ({ products, onDismiss }: { products: any[], onDismiss: () => void }) => {
  const isMultiple = products.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[380px] bg-white rounded-xl"
    >
      <div className="bg-cyan-500 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
          <Package size={14} /> {isMultiple ? `识别到 ${products.length} 个潜在意向` : '发现采购意向'}
        </div>
        <button onClick={onDismiss} className="text-white/80 hover:text-white"><X size={16} /></button>
      </div>
      
      <div className="p-4 max-h-[300px] overflow-y-auto">
        {isMultiple ? (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 font-bold mb-3">客户提到了通用词，请选择精准型号：</p>
            {products.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-cyan-300 hover:bg-white transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-cyan-500 shadow-sm font-bold text-[10px]">
                    {p.pid[0]}
                  </div>
                  <span className="text-xs font-black text-slate-700">{p.pid}</span>
                </div>
                <button className="p-2 bg-slate-900 text-white rounded-lg active:scale-90 transition-transform">
                   <ShoppingCart size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <Package size={32} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">匹配关键词: {products[0].keyword}</div>
              <h4 className="font-black text-slate-900 text-sm mb-2">型号: {products[0].pid}</h4>
              <button className="flex items-center gap-2 w-full py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold justify-center active:scale-95 transition-all">
                <ShoppingCart size={12} /> 一键调取战术物料
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
