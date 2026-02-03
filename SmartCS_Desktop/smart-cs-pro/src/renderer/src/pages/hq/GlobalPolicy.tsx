import { useState } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, Save, Wifi, Volume2, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import axios from 'axios'
import { CONFIG } from '../../lib/config'

export default function GlobalPolicyPage() {
  const [aiEnabled, setAiEnabled] = useState(true)
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434/api/chat')
  const [isSaving, setIsSaving] = useState(false)

  const handlePushPolicy = async () => {
    setIsSaving(true)
    try {
      await axios.post(`${CONFIG.API_BASE}/admin/push-policy`, {
        ai_enabled: aiEnabled,
        ollama_url: ollamaUrl
      })
      alert('🚀 全局策略已广播！全链路已同步。')
    } catch (err) {
      alert('同步失败，请检查中枢链路')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl font-sans">
      <div className="flex flex-col">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
          全局 <span className="text-cyan-500">AI</span> 战略配置
        </h2>
        <p className="text-slate-500 text-sm mt-1">控制全域坐席的战术分析能力与语言协议</p>
      </div>

      <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-8">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3">
              <BrainCircuit className="text-cyan-400" />
              <span className="uppercase tracking-widest">语义风控核心 (Ollama)</span>
            </CardTitle>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${aiEnabled ? 'bg-green-500' : 'bg-slate-700'}`}>
              {aiEnabled ? 'ACTIVE' : 'PAUSED'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div>
              <h4 className="font-black text-slate-900">启用智脑纠偏分析</h4>
              <p className="text-xs text-slate-500">开启后将激活大模型实时对话流审计</p>
            </div>
            <button 
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`w-14 h-8 rounded-full transition-all relative ${aiEnabled ? 'bg-cyan-600' : 'bg-slate-300'}`}
            >
              <motion.div animate={{ x: aiEnabled ? 24 : 4 }} className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Wifi size={12} /> 指令中枢集群地址
            </label>
            <input 
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20 font-mono"
            />
          </div>

          <button 
            onClick={handlePushPolicy}
            disabled={isSaving}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            <Save size={18} /> {isSaving ? '正在同步策略...' : '立即保存并全域下发'}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}