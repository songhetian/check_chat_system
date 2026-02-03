import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Cpu, Activity, Lock, User, Minus, X, AlertTriangle, Square, Copy as CopyIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { CONFIG } from '../lib/config'
import axios from 'axios'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [bootStatus, setBootStatus] = useState('等待身份验证...')
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleMinimize = () => window.electron.ipcRenderer.send('minimize-window')
  const handleClose = () => window.electron.ipcRenderer.send('close-window')
  const [isFullScreen, setIsFullScreen] = useState(false)

  const toggleFullScreen = () => {
    const next = !isFullScreen
    setIsFullScreen(next)
    window.electron.ipcRenderer.send('set-fullscreen', next)
  }

  // 核心：中文机械语音合成函数
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 0.7;
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    // 登录页需要大窗口展示并居中
    window.electron.ipcRenderer.send('resize-window', { width: 1000, height: 800, center: true })
    // 登录页不需要置顶
    window.electron.ipcRenderer.send('set-always-on-top', false)

        // 链路预检 (使用主进程桥接)
        const checkLink = async () => {
          const baseUrl = CONFIG.API_BASE.toLowerCase();
          const target = `${baseUrl}/health`;
          
          try {
            await window.api.callApi({ url: target });
            console.log('✅ [链路诊断] 神经握手成功');
          } catch (err: any) {
            setError(`链路初始化失败：加密中枢无法响应，请联系系统管理员`);
            speak('警告，物理链路脱机。');
          }
        };
        checkLink();
      }, [])
    
      const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isLoading) return
        setError('')
        setIsLoading(true)
    
        try {
          // 登录前先物理注销，确保状态干净
          useAuthStore.getState().logout();
    
          // 1. 通过战术桥接发起认证请求
          const res = await window.api.callApi({
            url: `${CONFIG.API_BASE}/auth/login`,
            method: 'POST',
            data: {
              username: formData.username,
              password: formData.password
            }
          });
    
          if (res.status !== 200 || res.data.status !== 'ok') {
            setError(res.data?.message || '身份特征校验未通过，请重新输入');
            speak('身份核验未通过。');
            setIsLoading(false)
            return
          }  
        const { user, token } = res.data.data
  
        // 2. 启动仪式感序列
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
          await new Promise(r => setTimeout(r, 15))
        }
  
        speak(`欢迎进入系统，${user.real_name}。全链路已就绪。`)
        
        // 3. 持久化至中央状态库
        setAuth({ 
          username: user.username, 
          real_name: user.real_name, 
          role: user.role, 
          department: user.department,
          rank: user.rank,
          score: user.score
        }, token)
        
        // 强制使用 replace 导航，防止返回键导致的逻辑混乱
        navigate('/', { replace: true })
      } catch (err: any) {      if (err.response) {
        // 服务器返回了错误 (如 401, 404, 500)
        const msg = err.response.data?.message || '指挥中枢拒绝了访问请求'
        setError(`链路错误: ${msg}`)
        speak('身份核验未通过。')
      } else if (err.request) {
        // 请求发出了但没收到响应 (网络断了或引擎没开)
        setError(`无法建立战术连接：中枢服务器脱机 (目标: ${CONFIG.API_BASE})`)
        speak('警告，无法建立远程连接。')
      } else {
        setError(`初始化失败: ${err.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 scanline grain overflow-hidden relative text-slate-200 font-sans">
      {/* 顶部全宽拖拽条 */}
      <div className="absolute top-0 left-0 w-full h-12 z-50 flex items-center justify-between px-8" style={{ WebkitAppRegion: 'drag' } as any}>
         <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest select-none">
           {CONFIG.BRANDING.company} 安全认证端口 : 443
         </div>

         {/* 窗口控制按钮 */}
         <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button onClick={handleMinimize} className="text-slate-600 hover:text-white transition-colors" title="最小化">
               <Minus size={16} />
            </button>
            <button onClick={toggleFullScreen} className="text-slate-600 hover:text-white transition-colors" title={isFullScreen ? "向下还原" : "最大化"}>
               {isFullScreen ? <CopyIcon size={13} className="rotate-180" /> : <Square size={13} />}
            </button>
            <button onClick={handleClose} className="text-slate-600 hover:text-red-500 transition-colors" title="关闭">
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
            <span className="text-2xl font-black text-cyan-400">{CONFIG.BRANDING.logoText}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic text-tactical-glow uppercase">
            {CONFIG.BRANDING.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <Activity size={12} className="text-cyan-500 animate-pulse" />
             <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">
               {CONFIG.BRANDING.subName}
             </span>
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
            <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 flex items-center gap-1"><User size={10}/> 操作员账号</label>
                        <input 
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          placeholder="请输入账号" 
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-cyan-500/50 focus:bg-white/10 transition-all outline-none placeholder:text-slate-500" 
                        />
                      </div>
            
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 flex items-center gap-1"><Lock size={10}/> 访问密钥</label>
                        <input 
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="请输入密码" 
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-cyan-500/50 focus:bg-white/10 transition-all outline-none placeholder:text-slate-500 font-mono tracking-widest" 
                        />          </div>

          <button
            type="submit"
            disabled={progress > 0}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex flex-col items-center gap-1 uppercase tracking-[0.2em] text-[10px] mt-4 disabled:opacity-50"
          >
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
            ) : "建立战术链路 / LOGIN"}
          </button>
        </form>

        <div className="mt-10 flex justify-between items-center opacity-30 text-[8px] font-black text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-1"><Cpu size={10}/> 量子加密协议已激活</div>
          <span>版本: {CONFIG.APP_VERSION}</span>
        </div>
      </motion.div>
    </div>
  )
}
