import { useState, useEffect } from 'react'
import axios from 'axios'
import { CONFIG } from '../../lib/config'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { BrainCircuit, Zap, Clock, ShieldCheck } from 'lucide-react'

export default function AiPerformancePage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    axios.get(`${CONFIG.API_BASE}/hq/ai-performance`)
      .then(res => setData(res.data))
      .catch(e => console.error('AI 效能数据获取失败', e))
  }, [])

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
          AI <span className="text-cyan-500">EFFICIENCY</span> 效能审计
        </h2>
        <p className="text-slate-500 text-sm">监控智能纠偏对人力成本的节省贡献</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[32px] border-none shadow-sm bg-white p-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center"><Zap size={24}/></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">累计节省工时</p>
                 <p className="text-2xl font-black text-slate-900">{data?.hours_saved || 0} H</p>
              </div>
           </div>
        </Card>
        {/* ... 其他统计卡片可以后续扩展 */}
      </div>
    </div>
  )
}