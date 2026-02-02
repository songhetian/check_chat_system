import { useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Coins,
  Type,
  QrCode,
  Timer,
  Copy,
  Eraser,
  RefreshCw,
  Truck,
  ScanText,
  ShieldCheck,
  ExternalLink,
  Image as ImageIcon,
  Languages,
  Lock
} from 'lucide-react'

// Mock copy function if not available
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    // Ideally use toast here
    console.log('Copied:', text)
  })
}

export default function ToolsPage() {
  // 6. 图片安全处理
  const [isProcessingImg, setIsProcessingImg] = useState(false)
  const handleImageDefense = async () => {
    // Mock ipcRenderer for now as it's not easily accessible in valid TS without type augmentation
    // const filePath = await window.electron.ipcRenderer.invoke('select-video-file') 
    const filePath = null; // Placeholder
    if (!filePath) return
    setIsProcessingImg(true)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/agent/image-defense', {
        input_path: filePath,
        watermark_text: '仅供客户查阅-SmartCS'
      })
      if (res.data.status === 'ok') alert(`安全图片已生成：${res.data.output}`)
    } finally {
      setIsProcessingImg(false)
    }
  }

  // 7. 生僻字注音
  const [pinyinInput, setPinyinInput] = useState('')
  const [pinyinResult, setPinyinResult] = useState('')
  const handlePinyin = async () => {
    if (!pinyinInput) return
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/agent/pinyin?text=${pinyinInput}`)
      if (res.data.status === 'ok') setPinyinResult(res.data.result)
    } catch (e) {
      console.error(e)
    }
  }

  // Missing States for other tools
  const [trackingNum, setTrackingNum] = useState('')
  const [extractInput, setExtractInput] = useState('')
  const [extracted, setExtracted] = useState<string[]>([])
  const [preCheckText, setPreCheckText] = useState('')
  const [checkResult, setCheckResult] = useState<'idle' | 'safe' | 'danger'>('idle')

  const openLogistics = (type: string) => {
    const url = type === 'sf' ? 'https://www.sf-express.com/' : 'https://www.kuaidi100.com/'
    window.open(url, '_blank')
  }

  const extractInfo = () => {
     // Mock extraction
     const phones = extractInput.match(/\d{11}/g) || []
     setExtracted(phones)
  }

  const handlePreCheck = () => {
     if (preCheckText.includes('加微信') || preCheckText.includes('转账')) {
        setCheckResult('danger')
     } else {
        setCheckResult('safe')
     }
  }
  
  // Helper for class names
  const cn = (...classes: any[]) => classes.filter(Boolean).join(' ')

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 工具 3：物流查询 (Reconstructed from stray code) */}
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden col-span-1 md:col-span-2">
           <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Truck size={18} className="text-blue-500" /> 物流极速查询
            </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 左侧：查询入口 */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">第一步：极速查询</span>
                <input 
                  value={trackingNum}
                  onChange={(e) => setTrackingNum(e.target.value)}
                  placeholder="粘贴物流单号..."
                  className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openLogistics('sf')} className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1">
                    顺丰官网查询 <ExternalLink size={10} />
                  </button>
                  <button onClick={() => openLogistics('all')} className="py-3 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-bold hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-1">
                    快递100查询 <ExternalLink size={10} />
                  </button>
                </div>
              </div>

              {/* 右侧：结果格式化 */}
              <div className="space-y-4 border-l border-slate-100 pl-6">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">第二步：结果智能提炼</span>
                <textarea 
                  placeholder="直接 Ctrl+V 粘贴网页查到的杂乱内容..."
                  className="w-full h-20 bg-blue-50/30 border-dashed border-2 border-blue-100 rounded-2xl py-2 px-4 text-[10px] focus:ring-0 resize-none"
                  onChange={(e) => {
                    const raw = e.target.value;
                    const timeMatch = raw.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
                    const lastStatus = raw.split('\n').find(l => l.includes('派送') || l.includes('已签收') || l.includes('到达'));
                    if (timeMatch && lastStatus) {
                      e.target.value = `最新物流信息：\n【${timeMatch[0]}】${lastStatus.trim()}`;
                    }
                  }}
                />
                <button 
                  onClick={(e) => {
                    const txt = (e.currentTarget.previousElementSibling as HTMLTextAreaElement).value;
                    copyToClipboard(txt);
                    alert('物流话术已复制，可直接发送给客户');
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  <Copy size={14} /> 一键复制专业反馈话术
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 工具 4：关键信息提取 */}
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ScanText size={18} className="text-orange-500" /> 信息自动提取器
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <textarea 
              value={extractInput}
              onChange={(e) => setExtractInput(e.target.value)}
              placeholder="粘贴客户发来的杂乱信息..."
              className="w-full h-20 bg-slate-50 border-none rounded-2xl py-2 px-4 text-[10px] focus:ring-2 focus:ring-orange-500/20"
            />
            <button onClick={extractInfo} className="w-full py-2 bg-orange-500 text-white rounded-xl text-xs font-bold">开始提取</button>
            <div className="flex flex-wrap gap-2">
              {extracted.map(item => (
                <div key={item} onClick={() => copyToClipboard(item)} className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded border border-orange-100 cursor-pointer hover:bg-orange-100">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 工具 5：战术话术预检 */}
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-500" /> 话术合规预检
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <textarea 
              value={preCheckText}
              onChange={(e) => { setPreCheckText(e.target.value); setCheckResult('idle'); }}
              placeholder="在正式发送前在此输入话术..."
              className="w-full h-20 bg-slate-50 border-none rounded-2xl py-2 px-4 text-[10px] focus:ring-2 focus:ring-green-500/20"
            />
            <div className={cn(
              "p-3 rounded-2xl flex items-center justify-between transition-all",
              checkResult === 'safe' ? "bg-green-50 text-green-700 border border-green-100" :
              checkResult === 'danger' ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-50 text-slate-400"
            )}>
              <span className="text-[10px] font-bold uppercase">
                {checkResult === 'safe' ? '✅ 建议发送：未发现风险' :
                 checkResult === 'danger' ? '❌ 拦截预警：包含敏感词' : '等待检测...'}
              </span>
              <button onClick={handlePreCheck} className="px-3 py-1 bg-white rounded-lg shadow-sm text-[10px] font-bold text-slate-900 active:scale-95">点击检测</button>
            </div>
          </CardContent>
        </Card>

        {/* 工具 6：图片安全处理 */}
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ImageIcon size={18} className="text-purple-500" /> 图片防泄密水印
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="h-24 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2 hover:bg-slate-50 transition-colors cursor-pointer" onClick={handleImageDefense}>
              {isProcessingImg ? <RefreshCw className="animate-spin" /> : <ImageIcon size={24} />}
              <span className="text-[10px] font-bold">选择需要加水印的图片</span>
            </div>
            <p className="text-[10px] text-slate-400 italic text-center">自动添加半透明水印并压缩至 50% 体积</p>
          </CardContent>
        </Card>

        {/* 工具 7：生僻字注音助手 */}
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Languages size={18} className="text-rose-500" /> 生僻字/拼音助手
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="relative">
              <input 
                value={pinyinInput}
                onChange={(e) => setPinyinInput(e.target.value)}
                placeholder="输入客户姓名或生僻字..."
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-rose-500/20"
              />
              <button onClick={handlePinyin} className="absolute right-2 top-2 p-1.5 bg-rose-500 text-white rounded-lg"><RefreshCw size={14} /></button>
            </div>
            {pinyinResult && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex justify-between items-center group">
                <span className="text-xs font-black text-rose-900 tracking-widest">{pinyinResult}</span>
                <button onClick={() => copyToClipboard(pinyinResult)} className="opacity-0 group-hover:opacity-100"><Copy size={12} /></button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}