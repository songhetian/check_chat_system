import { useState, useEffect } from 'react'
import axios from 'axios'
import { CONFIG } from '../../lib/config'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { BrainCircuit, Zap, Clock, ShieldCheck, RefreshCw, Loader2, BarChart3, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/useAuthStore'

export default function AiPerformancePage() {
  const { token } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/hq/ai-performance`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 200) {
        setData(res.data)
        if (silent) toast.success('效能数据已对齐')
      }
    } catch (e) {
      console.error('AI 效能数据获取失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [token])

  return (
    <div className="space-y-6 h-full flex flex-col font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic text-tactical-glow">
            AI <span className="text-cyan-500">EFFICIENCY</span> 效能审计
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">监控智能纠偏对人力成本的节省贡献与全域覆盖深度</p>
        </div>
        <button onClick={() => fetchData(false)} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
          <RefreshCw size={18} className={cn(loading && "animate-spin")} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50">
            <Loader2 className="animate-spin" size={40} /><span>演算效能指标中...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <StatsCard icon={Zap} label="累计节省工时" value={`${data?.hours_saved || 0} H`} color="text-cyan-600" bg="bg-cyan-50" border="border-cyan-100" />
            <StatsCard icon={ShieldCheck} label="风险拦截精度" value="99.2%" color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
            <StatsCard icon={TrendingUp} label="话术覆盖深度" value="84.5%" color="text-amber-600" bg="bg-amber-50" border="border-amber-100" />
          </div>
        )}
      </div>
    </div>
  )
}

function StatsCard({ icon: Icon, label, value, color, bg, border }: any) {
  return (
    <div className={cn("bg-white p-10 rounded-[40px] border shadow-sm group hover:shadow-2xl transition-all", border)}>
       <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner", bg, color)}>
          <Icon size={32} />
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{label}</p>
       <p className={cn("text-4xl font-black italic tracking-tighter", color)}>{value}</p>
    </div>
  )
}