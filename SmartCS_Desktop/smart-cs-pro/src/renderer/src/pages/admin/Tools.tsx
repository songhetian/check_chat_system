import { useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { CONFIG } from '../../lib/config'
import { 
  Copy, RefreshCw, Truck, ScanText, ShieldCheck, ExternalLink, Image as ImageIcon, Languages 
} from 'lucide-react'
import { cn } from '../../lib/utils'

export default function ToolsPage() {
  const [isProcessingImg, setIsProcessingImg] = useState(false)
  const [pinyinInput, setPinyinInput] = useState('')
  const [pinyinResult, setPinyinResult] = useState('')
  const [trackingNum, setTrackingNum] = useState('')
  const [extractInput, setExtractInput] = useState('')
  const [extracted, setExtracted] = useState<string[]>([])
  const [preCheckText, setPreCheckText] = useState('')
  const [checkResult, setCheckResult] = useState<'idle' | 'safe' | 'danger'>('idle')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('✅ 已复制到剪贴板');
  }

  const handleImageDefense = async () => {
    setIsProcessingImg(true)
    try {
      const res = await axios.post(`${CONFIG.API_BASE}/agent/image-defense`, { input_path: 'mock_path', watermark_text: 'SmartCS' })
      if (res.data.status === 'ok') alert(`已生成安全图片`)
    } finally { setIsProcessingImg(false) }
  }

  const handlePinyin = async () => {
    if (!pinyinInput) return
    const res = await axios.get(`${CONFIG.API_BASE}/agent/pinyin?text=${pinyinInput}`)
    if (res.data.status === 'ok') setPinyinResult(res.data.result)
  }

  const handlePreCheck = () => {
     setCheckResult(preCheckText.includes('钱') ? 'danger' : 'safe')
  }

  return (
    <div className="space-y-6 pb-20 font-sans">
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">全域提效工具 <span className="text-cyan-500">UTILITIES</span></h2>
          <p className="text-slate-500 text-sm mt-1">内置战术组件，辅助一线坐席快速响应</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest"><ImageIcon size={18} className="text-cyan-500" /> 证据加水印器</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <button onClick={handleImageDefense} className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2 hover:bg-slate-50 transition-all">
              {isProcessingImg ? <RefreshCw className="animate-spin" /> : <ImageIcon size={24} />}
              <span className="text-[10px] font-black uppercase">选择并加注水印</span>
            </button>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest"><ShieldCheck size={18} className="text-red-500" /> 话术合规预检</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <textarea value={preCheckText} onChange={(e) => setPreCheckText(e.target.value)} placeholder="输入待发送内容..." className="w-full h-20 bg-slate-50 border-none rounded-xl p-4 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-cyan-500/20" />
            <button onClick={handlePreCheck} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">立即分析</button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
