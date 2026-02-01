import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, User, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

const loginSchema = z.object({
  username: z.string().min(2, '账号至少2位'),
  password: z.string().min(6, '密码至少6位'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setError('')
    try {
      // 模拟后端登录请求
      // 在实际生产中，这里调用 axios.post('http://localhost:8000/api/auth/login', values)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser = {
        username: values.username,
        real_name: '张主管',
        role: values.username === 'admin' ? 'ADMIN' : values.username === 'hq' ? 'HQ' : 'AGENT' as any,
        department: '销售一部',
      }

      setAuth(mockUser, 'mock-token-123')
      
      // 通知 Electron 主进程根据角色调整窗口
      window.electron.ipcRenderer.send('auth-success', mockUser.role)
      
      navigate('/')
    } catch (err) {
      setError('认证失败：账号或密码错误')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-slate-900/50 border border-white/10 p-8 rounded-[32px] backdrop-blur-xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-4 border border-cyan-500/20">
            <Shield className="text-cyan-400 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter italic">SMART-CS PRO</h1>
          <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest">战术级链路指挥系统</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
            <input
              {...form.register('username')}
              placeholder="操作员 ID"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
            />
            {form.formState.errors.username && (
              <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
            <input
              {...form.register('password')}
              type="password"
              placeholder="访问密钥"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold">
              {error}
            </motion.p>
          )}

          <button
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg shadow-cyan-950/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 uppercase tracking-widest text-xs"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '初始化系统链路'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
          <span>Version 10.0.1</span>
          <span className="text-cyan-900">Encrypted AES-256</span>
        </div>
      </motion.div>
    </div>
  )
}
