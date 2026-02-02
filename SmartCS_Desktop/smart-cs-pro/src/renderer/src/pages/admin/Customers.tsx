import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, UserPlus, Filter, MoreHorizontal, Download, UserCircle2 } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { cn } from '../../lib/utils'

export default function CustomersPage() {
  const [customers] = useState([
    { id: '1', name: '王大锤', phone: '138****5678', ltv: '12,500', tags: ['大客户', '高频'], status: 'Active' },
    { id: '2', name: '李萌萌', phone: '155****1234', ltv: '450', tags: ['潜在退款'], status: 'Watch' },
    { id: '3', name: '周杰', phone: '189****9999', ltv: '3,200', tags: ['新品关注'], status: 'Active' },
  ])

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end text-slate-900">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">全视角客户画像</h2>
          <p className="text-slate-500 text-sm">基于行为历史的 360° 深度分析面板</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold transition-all shadow-xl active:scale-95">
          <Download size={16} /> 导出全量画像报告
        </button>
      </div>

      <div className="bg-white p-4 rounded-[32px] border border-slate-200 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input placeholder="搜索客户姓名、电话或标签..." className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-cyan-500/20" />
        </div>
        <button className="px-6 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 flex items-center gap-2">
          <Filter size={16} /> 维度筛选
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((c) => (
          <Card key={c.id} className="p-6 rounded-[32px] border-slate-200 hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <UserCircle2 size={32} />
              </div>
              <button className="p-2 text-slate-300 hover:text-slate-600"><MoreHorizontal size={20} /></button>
            </div>
            
            <h3 className="text-lg font-black text-slate-900">{c.name}</h3>
            <p className="text-xs font-bold text-slate-400 mb-4">{c.phone}</p>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {c.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">{t}</span>
                ))}
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">消费总额 (LTV)</p>
                  <p className="text-lg font-black text-slate-900">¥{c.ltv}</p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                  c.status === 'Active' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                )}>
                  {c.status}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
