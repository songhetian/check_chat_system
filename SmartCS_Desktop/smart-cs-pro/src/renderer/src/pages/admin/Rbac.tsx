import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, CheckCircle2, ShieldAlert, Zap, Radio, 
  Loader2, RefreshCw, X, Save, Lock, ArrowRight,
  UserCog, Building2, Key
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

export default function RbacPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null)
  const [rolePerms, setRolePerms] = useState<string[]>([])

  const initData = async () => {
    setLoading(true)
    try {
      const resRoles = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/roles`, method: 'GET' })
      const resPerms = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/permissions`, method: 'GET' })
      
      if (resRoles.status === 200) {
        setRoles(resRoles.data.data)
        if (resRoles.data.data.length > 0) setActiveRoleId(resRoles.data.data[0].id)
      }
      if (resPerms.status === 200) setPermissions(resPerms.data.data)
    } finally { setLoading(false) }
  }

  const fetchRolePerms = async () => {
    if (!activeRoleId) return
    const res = await window.api.callApi({ 
      url: `${CONFIG.API_BASE}/admin/role/permissions?role_id=${activeRoleId}`, 
      method: 'GET' 
    })
    if (res.status === 200) setRolePerms(res.data.data)
  }

  useEffect(() => { initData() }, [])
  useEffect(() => { fetchRolePerms() }, [activeRoleId])

  const togglePermission = (code: string) => {
    if (rolePerms.includes(code)) setRolePerms(rolePerms.filter(p => p !== code))
    else setRolePerms([...rolePerms, code])
  }

  const handleSave = async () => {
    if (!activeRoleId) return
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/admin/role/permissions`,
      method: 'POST',
      data: { role_id: activeRoleId, permissions: rolePerms }
    })
    if (res.data.status === 'ok') {
      window.dispatchEvent(new CustomEvent('trigger-toast', {
        detail: { title: '权限矩阵已固化', message: `角色权限集已实时同步至全链路`, type: 'success' }
      }))
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6">
      
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">权责矩阵定义</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">配置核心角色的指令权限与数据访问边界</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all">
          <Save size={16} /> 保存权限配置
        </button>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden min-h-0">
        
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
           {roles.map((r) => (
             <div 
               key={r.id} onClick={() => setActiveRoleId(r.id)}
               className={cn(
                 "p-6 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between group",
                 activeRoleId === r.id ? "bg-slate-900 border-slate-900 shadow-xl" : "bg-white border-slate-100 hover:border-cyan-200"
               )}
             >
                <div className="flex items-center gap-4">
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", activeRoleId === r.id ? "bg-cyan-500 text-slate-950" : "bg-slate-100 text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600")}>
                      <UserCog size={20} />
                   </div>
                   <span className={cn("text-base font-black uppercase tracking-tighter", activeRoleId === r.id ? "text-white" : "text-slate-900")}>{r.name}</span>
                </div>
                {activeRoleId === r.id && <motion.div layoutId="active-dot" className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />}
             </div>
           ))}
           <div className="mt-auto p-6 bg-cyan-50/50 border border-cyan-100 rounded-[32px] flex items-center gap-4 italic font-medium text-[10px] text-cyan-900 leading-relaxed">
              <Key size={24} className="text-cyan-600 shrink-0" />
              <p>修改角色权限将立即影响属于该角色的所有操作员，请谨慎执行变更。</p>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-9 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
           <div className="p-8 border-b border-slate-100 bg-slate-50/30 shrink-0 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-3"><Shield size={18} className="text-cyan-500" /> 指令与数据权限点矩阵</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black tracking-widest italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>同步矩阵中...</span></div>
              ) : (
                <div className="space-y-10">
                   {Array.from(new Set(permissions.map(p => p.module))).map(module => (
                     <div key={module} className="space-y-4">
                        <div className="flex items-center gap-3 ml-2"><div className="w-1 h-4 bg-slate-900 rounded-full" /><h4 className="text-sm font-black text-slate-900">{module} 模块</h4></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {permissions.filter(p => p.module === module).map(p => (
                             <div key={p.code} onClick={() => togglePermission(p.code)} className={cn("p-6 rounded-3xl border transition-all cursor-pointer flex justify-between items-center", rolePerms.includes(p.code) ? "bg-white border-cyan-500 shadow-lg" : "bg-slate-50 border-slate-100 opacity-60 grayscale hover:opacity-100")}>
                                <div className="flex flex-col gap-1"><span className={cn("text-sm font-black transition-colors", rolePerms.includes(p.code) ? "text-slate-900" : "text-slate-400")}>{p.name}</span><span className="text-[9px] font-mono text-slate-400">ID: {p.code}</span></div>
                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", rolePerms.includes(p.code) ? "bg-cyan-500 text-white" : "bg-slate-200 text-slate-400")}>{rolePerms.includes(p.code) ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-white" />}</div>
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