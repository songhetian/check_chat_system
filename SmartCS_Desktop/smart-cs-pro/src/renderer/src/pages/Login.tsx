import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Cpu, Activity, Lock, User, Minus, X, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [bootStatus, setBootStatus] = useState('等待身份验证...')
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const handleMinimize = () => window.electron.ipcRenderer.send('minimize-window')
  const handleClose = () => window.electron.ipcRenderer.send('close-window')

  // 核心：中文机械语音合成函数
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 0.7;
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    // 登录页需要大窗口展示
    window.electron.ipcRenderer.send('resize-window', { width: 1000, height: 800 })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 预置账号模拟
    const users = [
      { u: 'admin', p: '123456', r: 'ADMIN', n: '指挥官' },
      { u: 'agent01', p: '123456', r: 'AGENT', n: '特勤专员-01' }
    ]

    const matched = users.find(u => u.u === formData.username && u.p === formData.password)

    if (!matched) {
      setError('链路认证失败：账号或加密密钥不匹配')
      speak('认证失败，访问请求已被系统拦截。')
      return
    }

    setBootStatus('正在建立加密隧道...')
    speak('身份确认，神经链路启动中。')
    
    for (let i = 0; i <= 100; i += 2) {
      setProgress(i)
      if (i === 20) setBootStatus('正在解析战术协议...')
      if (i === 40) {
        setBootStatus('权限包已下发...')
        speak('权限包校验通过。')
      }
      if (i === 60) setBootStatus('正在同步全域雷达...')
      if (i === 80) {
        setBootStatus('注入战术安全外壳...')
        speak('正在挂载战术外壳。')
      }
      await new Promise(r => setTimeout(r, 25))
    }

    speak('全链路已就绪。')
    setAuth({ 
      username: matched.u, 
      real_name: matched.n, 
      role: matched.r as any, 
      department: '战术指挥部' 
    }, 'token-123')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 scanline grain overflow-hidden relative text-slate-200">
      {/* 顶部全宽拖拽条 */}
      <div className="absolute top-0 left-0 w-full h-12 z-50 flex items-center justify-between px-6" style={{ WebkitAppRegion: 'drag' } as any}>
         <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest select-none">SmartCS Secure Login Port : 443</div>
         
         {/* 窗口控制按钮 */}
         <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button onClick={handleMinimize} className="text-slate-600 hover:text-white transition-colors">
               <Minus size={16} />
            </button>
            <button onClick={handleClose} className="text-slate-600 hover:text-red-500 transition-colors">
               <X size={16} />
            </button>
         </div>
      </div>

      <motion.div 
        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="w-full max-w-[420px] bg-slate-900/40 border-2 border-white/5 p-10 rounded-[40px] backdrop-blur-3xl relative z-10 shadow-2xl"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        
        <div className="flex flex-col items-center mb-8" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mb-6 border border-cyan-500/30">
            <Shield className="text-cyan-400 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic text-tactical-glow uppercase">SmartCS <span className="text-cyan-500">Pro</span></h1>
          <div className="flex items-center gap-2 mt-2">
             <Activity size={12} className="text-cyan-500 animate-pulse" />
             <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Neural Tactical Interface</span>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
             <AlertTriangle size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 flex items-center gap-1"><User size={10}/> Operator ID</label>
            <input 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="战术账号" 
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-cyan-500/50 focus:bg-white/10 transition-all outline-none placeholder:text-slate-700" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 flex items-center gap-1"><Lock size={10}/> Encryption Key</label>
            <input 
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="访问密码" 
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-cyan-500/50 focus:bg-white/10 transition-all outline-none placeholder:text-slate-700 font-mono tracking-widest" 
            />
          </div>
          
          <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex flex-col items-center gap-1 uppercase tracking-[0.2em] text-[10px] mt-4 disabled:opacity-50">
            {progress > 0 ? (
              <div className="w-full px-10 space-y-2">
                 <div className="flex justify-between text-[8px] font-bold">
                    <span>{bootStatus}</span>
                    <span>{progress}%</span>
                 </div>
                 <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${progress}%` }} className="h-full bg-white shadow-[0_0_10px_#fff]" />
                 </div>
              </div>
            ) : "Establish Tactical Link"}
          </button>
        </form>

        <div className="mt-10 flex justify-between items-center opacity-30 text-[8px] font-black text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-1"><Cpu size={10}/> Quantum Cryptography Active</div>
          <span>Secure Port: 8000</span>
        </div>
      </motion.div>
    </div>
  )
}

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] bg-slate-900/50 border-2 border-cyan-500/20 p-10 rounded-[40px] backdrop-blur-3xl relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        
        <div className="flex flex-col items-center mb-8" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mb-6 border border-cyan-500/30">
            <Shield className="text-cyan-400 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic text-tactical-glow">SMART-CS <span className="text-cyan-500">PRO</span></h1>
          <div className="flex items-center gap-2 mt-2">
             <Activity size={12} className="text-green-500" />
             <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Neural Tactical Interface</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 flex items-center gap-1"><User size={10}/> Account ID</label>
            <input 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="请输入战术账号 / Username" 
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-cyan-500/50 transition-all outline-none placeholder:text-slate-600" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 flex items-center gap-1"><Lock size={10}/> Security Key</label>
            <input 
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="请输入加密密钥 / Password" 
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-cyan-500/50 transition-all outline-none placeholder:text-slate-600 font-mono tracking-widest" 
            />
          </div>
          
          <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-95 flex flex-col items-center gap-1 uppercase tracking-widest text-xs mt-4">
            {progress > 0 ? (
              <div className="w-full px-10 space-y-2">
                 <div className="flex justify-between text-[8px] font-bold">
                    <span>{bootStatus}</span>
                    <span>{progress}%</span>
                 </div>
                 <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${progress}%` }} className="h-full bg-white" />
                 </div>
              </div>
            ) : "激活战术链路 / LOGIN SYSTEM"}
          </button>
        </form>

        <div className="mt-10 flex justify-between items-center opacity-30 text-[8px] font-black text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-1"><Cpu size={10}/> AES-512 Encrypted</div>
          <span>v10.4.5-Voice</span>
        </div>
      </motion.div>
    </div>
  )
}
