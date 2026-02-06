import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Wrench, ShieldCheck, Zap, Download, RefreshCw, Smartphone, Monitor } from 'lucide-react'
import axios from 'axios'
import { CONFIG } from '../../lib/config'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'

export default function ToolsPage() {
  const [loading, setLoading] = useState(false)

  const handleGenerateSecureImg = async () => {
    setLoading(true)
    try {
      // 模拟调用安全工具接口
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 规范化：使用全局事件分发 Toast
      toast.success('战术工具执行成功', { description: '安全加固图片已生成并同步至分发节点。' })
    } catch (e) {
      toast.error('工具链异常', { description: '无法生成安全载荷，请检查本地环境依赖。' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-end bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
            全域提效工具箱 <span className="text-cyan-500">UTILITIES</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">包含安全加固、屏幕诊断及终端同步等辅助实战功能</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm group hover:border-cyan-500/30 transition-all">
            <div className="w-14 h-14 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <ShieldCheck size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">安全图片加固</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">
              生成带有隐形水印和战术特征码的安全背景图，用于增强终端屏幕的防截屏溯源能力。
            </p>
            <button 
              onClick={handleGenerateSecureImg}
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />} 
              {loading ? '正在生成...' : '立即生成安全载荷'}
            </button>
         </div>
      </div>
    </div>
  )
}