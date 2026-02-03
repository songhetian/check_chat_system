import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Save, RefreshCw, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { CONFIG } from '../../lib/config'
import { cn } from '../../lib/utils'

export default function GlobalPolicyPage() {
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(8)

  const handleBroadcast = async () => {
    setLoading(true)
    try {
      // 模拟调用中枢策略广播接口
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 规范化：使用全局事件分发 Toast，而非原生 alert
      window.dispatchEvent(new CustomEvent('trigger-toast', {
        detail: { 
          title: '战术策略同步成功', 
          message: '全局 AI 拦截阈值已更新，全链路坐席节点已同步生效。', 
          type: 'success' 
        }
      }))
    } catch (e) {
      window.dispatchEvent(new CustomEvent('trigger-toast', {
        detail: { 
          title: '同步链路故障', 
          message: '无法连接到中央策略服务器，请检查网络链路。', 
          type: 'error' 
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
            全局 AI 防御策略 <span className="text-cyan-500">POLICIES</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">定义中枢智脑的拦截权重与自动化处置协议</p>
        </div>
        <button 
          onClick={handleBroadcast}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} 广播全局策略
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
              <Zap size={16} className="text-cyan-500" /> AI 敏感度权重阈值
            </h3>
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">拦截灵敏度 (1-10)</span>
                  <span className="text-2xl font-black text-cyan-600 italic">{threshold}</span>
               </div>
               <input 
                 type="range" min="1" max="10" value={threshold} 
                 onChange={(e) => setThreshold(parseInt(e.target.value))}
                 className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
               />
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                  <Info size={16} className="text-slate-400 shrink-0" />
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    阈值越低，拦截越严格。当前设置下，分值超过 <span className="font-black text-slate-900">{threshold}</span> 的行为将立即触发人工介入。
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

function Info(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
