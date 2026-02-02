import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Cpu, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [bootStatus, setBootStatus] = useState('等待身份验证...')
  const [progress, setProgress] = useState(0)

  // 核心：中文机械语音合成函数
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9; // 稍微慢一点，更有机械厚重感
    utterance.pitch = 0.8; // 低沉一点
    window.speechSynthesis.speak(utterance);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBootStatus('正在建立加密隧道...')
    speak('神经链路启动中，正在连接战术中心。')
    
    for (let i = 0; i <= 100; i += 2) {
      setProgress(i)
      if (i === 40) {
        setBootStatus('身份校验成功...')
        speak('身份校验成功，操作员权限已激活。')
      }
      if (i === 80) {
        setBootStatus('注入战术协议...')
        speak('正在注入战术安全协议。')
      }
      await new Promise(r => setTimeout(r, 30))
    }

    speak('欢迎进入系统，全链路已就绪。')
    const mockUser = { username: 'admin', real_name: '张主管', role: 'ADMIN' as any, department: '战术指挥部' }
    setAuth(mockUser, 'token-123')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 scanline grain overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] bg-slate-900/50 border-2 border-cyan-500/20 p-10 rounded-[40px] backdrop-blur-3xl relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        
        <div className="flex flex-col items-center mb-10">
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
            <label className="text-[10px] font-black text-cyan-500 uppercase ml-2">Operator ID</label>
            <input placeholder="请输入操作员编号" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-cyan-500/50 transition-all outline-none" />
          </div>
          
          <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-95 flex flex-col items-center gap-1 uppercase tracking-widest text-xs">
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
            ) : "激活战术链路"}
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
