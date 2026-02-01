import { useState } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, Save, Wifi, Power } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import axios from 'axios'

export default function GlobalPolicyPage() {
  const [aiEnabled, setAiEnabled] = useState(false)
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434/api/chat')
  const [isSaving, setIsSaving] = useState(false)

  const handlePushPolicy = async () => {
    setIsSaving(true)
    try {
      // 模拟向后端发送全局推送指令
      await axios.post('http://127.0.0.1:8000/api/admin/push-policy', {
        ai_enabled: aiEnabled,
        ollama_url: ollamaUrl
      })
      alert('🚀 全局 AI 策略已下发！全员坐席端已同步。')
    } catch (err) {
      alert('推送失败，请检查网络')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">全局 AI 战略配置</h2>
        <p className="text-slate-500 text-sm">在这里一键控制全公司坐席的 AI 语义分析能力</p>
      </div>

      <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-8">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3">
              <BrainCircuit className="text-cyan-400" />
              <span>语义风控引擎 (Ollama)</span>
            </CardTitle>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${aiEnabled ? 'bg-green-500' : 'bg-slate-700'}`}>
              {aiEnabled ? 'Online' : 'Paused'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px] border border-slate-100">
            <div>
              <h4 className="font-black text-slate-900">启用离线大模型分析</h4>
              <p className="text-xs text-slate-500">开启后，坐席端将自动进行深度语义违规检测</p>
            </div>
            <button 
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`w-14 h-8 rounded-full transition-all relative ${aiEnabled ? 'bg-cyan-600' : 'bg-slate-300'}`}
            >
              <motion.div 
                animate={{ x: aiEnabled ? 24 : 4 }}
                className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md" 
              />
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Wifi size={12} /> AI 服务器集群地址 (方案 B)
            </label>
            <input 
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://192.168.x.x:11434/api/chat"
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-cyan-500/20 font-mono"
            />
            <p className="text-[10px] text-slate-400 italic">提示：如果是方案 A，请填写 localhost；如果是方案 B，请填写主管机 IP</p>
          </div>

          <button 
            onClick={handlePushPolicy}
            disabled={isSaving}
            className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? '正在广播策略...' : '保存并全员下发'}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
