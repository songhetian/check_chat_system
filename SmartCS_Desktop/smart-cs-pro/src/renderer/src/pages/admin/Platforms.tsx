import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Plus, Trash2, Power, PowerOff, ShieldCheck } from 'lucide-react'
import axios from 'axios'

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<any[]>([])

  useEffect(() => {
    // 模拟拉取数据
    setPlatforms([
      { id: 1, name: '微信 PC 版', keyword: '微信', active: true },
      { id: 2, name: '钉钉桌面版', keyword: '钉钉', active: true },
      { id: 3, name: '飞书', keyword: 'Lark', active: false },
    ])
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">战术目标管理</h2>
          <p className="text-slate-500 text-sm">定义系统需要实时扫描和拦截的聊天软件窗口</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-cyan-900/20 active:scale-95 transition-all">
          <Plus size={16} /> 增加监控目标
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                p.active ? "bg-cyan-500 text-white shadow-lg shadow-cyan-200" : "bg-slate-100 text-slate-400"
              )}>
                <Monitor size={24} />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>

            <h3 className="font-black text-slate-900 text-lg mb-1">{p.name}</h3>
            <div className="flex items-center gap-2 mb-6">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">窗口特征码:</span>
               <span className="text-[10px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">{p.keyword}</span>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", p.active ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                  <span className="text-[10px] font-black text-slate-500 uppercase">{p.active ? 'Active' : 'Paused'}</span>
               </div>
               <button className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95",
                 p.active ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-cyan-600 text-white"
               )}>
                 {p.active ? '暂停监控' : '恢复监控'}
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ')
