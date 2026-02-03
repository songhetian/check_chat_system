import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, Filter, MoreHorizontal, Download, UserCircle2, Loader2, Calendar } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

interface Customer {
  name: string
  level: string
  tags: string
  ltv: number
  frequency: number
  last_seen_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/customers?search=${search}`,
        method: 'GET'
      })
      if (res.status === 200) {
        setCustomers(res.data.data)
        setTotal(res.data.total)
      }
    } catch (e) {
      console.error('获取客户画像失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return (
    <div className="space-y-6 h-full flex flex-col font-sans">
      {/* 战术头部：符合 rounded-[32px] 规范 */}
      <div className="flex justify-between items-end text-slate-900 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase italic text-tactical-glow">
            全视角客户画像 <span className="text-cyan-500">360°</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">基于 MySQL 中央库的实时行为分析面板</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black transition-all shadow-xl active:scale-95 hover:bg-slate-800">
          <Download size={16} /> 导出全量战术报告
        </button>
      </div>

      {/* 搜索过滤条 */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            placeholder="搜索客户姓名、标签或特征码..." 
            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium" 
          />
        </div>
        <button 
          onClick={fetchCustomers}
          className="px-6 bg-cyan-500 text-white rounded-2xl text-xs font-black hover:bg-cyan-600 flex items-center gap-2 transition-all"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Filter size={16} />} 实时检索
        </button>
      </div>

      {/* 核心内容区 */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 gap-3">
            <Loader2 className="animate-spin" />
            <span className="text-sm font-bold tracking-widest">正在调取中枢画像数据...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {customers.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-6 rounded-[32px] border-slate-200 hover:shadow-2xl hover:border-cyan-200 transition-all group relative overflow-hidden bg-white/80 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                       <UserCircle2 size={100} />
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                        c.level === 'VIP' ? "bg-amber-500/10 text-amber-600" : "bg-cyan-50 text-cyan-600"
                      )}>
                        <UserCircle2 size={32} />
                      </div>
                      <div className="text-right">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                           c.level === 'VIP' ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                         )}>
                           {c.level}
                         </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-cyan-600 transition-colors">{c.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                       <Calendar size={12} /> 最近上线: {new Date(c.last_seen_at).toLocaleDateString()}
                    </div>

                    <div className="mt-6 space-y-4 relative z-10">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.split(',').map(t => (
                          <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md border border-slate-200 uppercase">{t}</span>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-left">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">消费总额 (LTV)</p>
                          <p className="text-xl font-black text-slate-900 italic">¥{Number(c.ltv).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">互动频次</p>
                          <p className="text-lg font-black text-cyan-600">{c.frequency} <span className="text-[10px] opacity-50">TIMES</span></p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {!loading && customers.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
            <UserCircle2 size={64} strokeWidth={1} />
            <p className="font-black text-lg uppercase tracking-widest">MySQL 中未发现画像记录</p>
          </div>
        )}
      </div>
    </div>
  )
}