import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, CheckCircle2, ShieldAlert, Zap, Radio, 
  Loader2, RefreshCw, X, Save, Lock, ArrowRight,
  UserCog, Building2, Key
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable } from '../../components/ui/TacticalTable'

export default function RbacPage() {
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState('ADMIN')
  const [rolePerms, setRolePerms] = useState<string[]>([])

  const fetchRbacData = async () => {
    setLoading(true)
    try {
      // 模拟调取权限定义
      const res = await new Promise(resolve => setTimeout(() => resolve([
        { id: 1, code: 'input:lock', name: '一键输入锁定', module: '实时指挥' },
        { id: 2, code: 'tactical:assist', name: '话术弹射协助', module: '实时指挥' },
        { id: 3, code: 'dept:manage', name: '组织架构管理', module: '后台管理' },
        { id: 4, code: 'user:manage', name: '操作员矩阵管理', module: '后台管理' },
        { id: 5, code: 'audit:view', name: '违规详情取证', module: '风险拦截' }
      ]), 800))
      setPermissions(res as any[])
      
      // 模拟已分配权限
      if (activeRole === 'ADMIN') setRolePerms(['input:lock', 'tactical:assist', 'audit:view'])
      else if (activeRole === 'HQ') setRolePerms(['input:lock', 'tactical:assist', 'dept:manage', 'user:manage', 'audit:view'])
      else setRolePerms([])
      
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchRbacData() }, [activeRole])

  const togglePermission = (code: string) => {
    if (rolePerms.includes(code)) setRolePerms(rolePerms.filter(p => p !== code))
    else setRolePerms([...rolePerms, code])
  }

  const handleSave = () => {
    window.dispatchEvent(new CustomEvent('trigger-toast', {
      detail: { title: '权限矩阵已固化', message: `角色 [${activeRole}] 的权限集已同步至全链路节点`, type: 'success' }
    }))
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      
      {/* 战术头部 */}
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
            权责矩阵配置中枢
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">定义系统核心角色的指令权限与数据访问边界</p>
        </div>
        <div className="flex gap-3">
           <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all">
             <Save size={16} /> 保存权限配置
           </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden min-h-0">
        
        {/* 左侧：角色选择 */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
           {['HQ', 'ADMIN', 'AGENT'].map((role) => (
             <div 
               key={role} onClick={() => setActiveRole(role)}
               className={cn(
                 "p-6 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between group",
                 activeRole === role ? "bg-slate-900 border-slate-900 shadow-xl" : "bg-white border-slate-100 hover:border-cyan-200"
               )}
             >
                <div className="flex items-center gap-4">
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activeRole === role ? "bg-cyan-500 text-slate-950" : "bg-slate-100 text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600")}>
                      <UserCog size={20} />
                   </div>
                   <span className={cn("text-base font-black uppercase tracking-tighter", activeRole === role ? "text-white" : "text-slate-900")}>
                     {role === 'HQ' ? '总部' : role === 'ADMIN' ? '主管' : '坐席'}
                   </span>
                </div>
                {activeRole === role && <motion.div layoutId="active-dot" className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />}
             </div>
           ))}
           <div className="mt-auto p-6 bg-cyan-50/50 border border-cyan-100 rounded-[32px] flex items-center gap-4">
              <Key size={24} className="text-cyan-600 shrink-0" />
              <p className="text-[10px] text-cyan-900 font-medium leading-relaxed italic">修改角色权限将立即影响所有属于该角色的操作员，请谨慎执行实战变更。</p>
           </div>
        </div>

        {/* 右侧：权限点勾选列表 */}
        <div className="col-span-12 lg:col-span-9 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
           <div className="p-8 border-b border-slate-100 bg-slate-50/30 shrink-0 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-3">
                <Shield size={18} className="text-cyan-500" /> 指令与数据权限点定义
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Encrypted Policy Layer</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/50">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black tracking-widest italic">
                  <Loader2 className="animate-spin" size={40} />
                  <span>同步中枢权责定义中...</span>
                </div>
              ) : (
                <div className="space-y-8">
                   {['实时指挥', '后台管理', '风险拦截'].map(module => (
                     <div key={module} className="space-y-4">
                        <div className="flex items-center gap-3 ml-2">
                           <div className="w-1 h-4 bg-slate-900 rounded-full" />
                           <h4 className="text-sm font-black text-slate-900">{module} 模块</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {permissions.filter(p => p.module === module).map(p => (
                             <div 
                               key={p.code} onClick={() => togglePermission(p.code)}
                               className={cn(
                                 "p-6 rounded-3xl border transition-all cursor-pointer flex justify-between items-center",
                                 rolePerms.includes(p.code) ? "bg-white border-cyan-500 shadow-lg" : "bg-slate-50 border-slate-100 opacity-60 grayscale hover:opacity-100"
                               )}
                             >
                                <div className="flex flex-col gap-1">
                                   <span className={cn("text-sm font-black transition-colors", rolePerms.includes(p.code) ? "text-slate-900" : "text-slate-400")}>{p.name}</span>
                                   <span className="text-[9px] font-mono text-slate-400">ID: {p.code}</span>
                                </div>
                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", rolePerms.includes(p.code) ? "bg-cyan-500 text-white shadow-md" : "bg-slate-200 text-slate-400")}>
                                   {rolePerms.includes(p.code) ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  )
}
