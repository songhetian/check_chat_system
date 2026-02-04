import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, Filter, MoreHorizontal, Download, UserCircle2, Loader2, Calendar, RefreshCw } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'
import { TacticalPagination } from '../../components/ui/TacticalTable'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  level: string
  tags: string
  ltv: number
  frequency: number
  last_seen_at: string
}

export default function CustomersPage() {
  const { token, hasPermission } = useAuthStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchCustomers = async (silent = false) => {
    if (!token) return
    if (!hasPermission('admin:customer:view')) return
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/customers?page=${page}&size=12&search=${search}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setCustomers(res.data.data)
        setTotal(res.data.total)
        if (silent) {
           toast.success('客户画像已对齐', { description: '全域客户数据已同步至最新物理刻度' })
        }
      }
    } catch (e) { console.error('客户画像对齐失败', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomers() }, [page, token])

  if (!hasPermission('admin:customer:view')) {
    return <div className="h-full flex items-center justify-center text-slate-400 italic">权限熔断：您无权查看客户画像矩阵</div>
  }

  return (
    <div className="space-y-6 h-full flex flex-col font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">全视角客户画像</h2><p className="text-slate-500 text-sm mt-1 font-medium">基于中枢流的实时行为分析 with 战术画像面板</p></div>
        {hasPermission('admin:customer:export') && (
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-xl hover:bg-emerald-700 transition-all"><Download size={16} /> 导出全量战术报告</button>
        )}
      </header>

      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex gap-4 shrink-0">
        <TacticalSearch value={search} onChange={setSearch} onSearch={() => { setPage(1); fetchCustomers(false); }} placeholder="搜索客户姓名、特征码或业务标签..." className="flex-1" />
        <button onClick={() => { setPage(1); fetchCustomers(false); }} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
          <RefreshCw size={18} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>画像节点匹配中...</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode='popLayout'>
              {customers.map((c, i) => (
                <motion.div key={c.id || i} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all group relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform"><UserCircle2 size={100} /></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", c.level === 'VIP' ? "bg-amber-50 text-amber-600 border-amber-100 shadow-inner" : "bg-cyan-50 text-cyan-600 border-cyan-100")}><UserCircle2 size={32} /></div>
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", c.level === 'VIP' ? "bg-amber-500 text-white border-amber-400" : "bg-slate-100 text-slate-500 border-slate-200")}>{c.level === 'VIP' ? '核心权重' : '标准节点'}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">{c.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter"><Calendar size={12} /> 最近活跃: {new Date(c.last_seen_at).toLocaleDateString()}</div>
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-1">{c.tags.split(',').map(t => (<span key={t} className="px-2 py-0.5 bg-white text-slate-600 text-[10px] font-black rounded-md border border-slate-200 shadow-sm">{t}</span>))}</div>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center"><div className="text-left"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">生命周期价值</p><p className="text-xl font-black text-slate-900 italic">¥{Number(c.ltv).toLocaleString()}</p></div><div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">交互频次</p><p className="text-lg font-black text-cyan-600">{c.frequency}</p></div></div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {total > 12 && (
        <div className="shrink-0 bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm"><TacticalPagination total={total} pageSize={12} currentPage={page} onPageChange={setPage} /></div>
      )}
    </div>
  )
}