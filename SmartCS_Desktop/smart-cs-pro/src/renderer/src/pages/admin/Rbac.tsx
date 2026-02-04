import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, CheckCircle2, ShieldAlert, Zap, Radio, 
  Loader2, RefreshCw, X, Save, Lock, ArrowRight,
  UserCog, Building2, Key, CheckSquare, Square
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

export default function RbacPage() {
  const { token } = useAuthStore()
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null)
  const [rolePerms, setRolePerms] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)

  const initData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [resRoles, resPerms] = await Promise.all([
        window.api.callApi({ 
          url: `${CONFIG.API_BASE}/admin/roles`, 
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        window.api.callApi({ 
          url: `${CONFIG.API_BASE}/admin/permissions`, 
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      if (resRoles.status === 200) {
        setRoles(resRoles.data.data)
        if (resRoles.data.data.length > 0 && !activeRoleId) setActiveRoleId(resRoles.data.data[0].id)
      }
      if (resPerms.status === 200) setPermissions(resPerms.data.data)
    } catch (e) {
      console.error('RBAC初始化失败', e)
    } finally { setLoading(false) }
  }

  const fetchRolePerms = async () => {
    if (!activeRoleId || !token) return
    const res = await window.api.callApi({ 
      url: `${CONFIG.API_BASE}/admin/role/permissions?role_id=${activeRoleId}`, 
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.status === 200) setRolePerms(res.data.data)
  }

  useEffect(() => { initData() }, [])
  useEffect(() => { fetchRolePerms() }, [activeRoleId])

  const togglePermission = (code: string) => {
    if (rolePerms.includes(code)) setRolePerms(rolePerms.filter(p => p !== code))
    else setRolePerms([...rolePerms, code])
  }

  const toggleModule = (module: string) => {
    const moduleCodes = permissions.filter(p => p.module === module).map(p => p.code)
    const allSelected = moduleCodes.every(c => rolePerms.includes(c))
    if (allSelected) setRolePerms(rolePerms.filter(c => !moduleCodes.includes(c)))
    else setRolePerms(Array.from(new Set([...rolePerms, ...moduleCodes])))
  }

  const handleSave = async () => {
    if (!activeRoleId || !token || processing) return
    setProcessing(true)
    try {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/role/permissions`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { role_id: activeRoleId, permissions: rolePerms }
      })
      if (res.data.status === 'ok') {
        toast.success('矩阵已固化', { description: '权责变更已实时同步至受影响节点' })
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div><h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">权责矩阵定义</h2><p className="text-slate-500 text-sm mt-1 font-medium">精确定义系统角色的实战权限范围与数据访问红线</p></div>
        <div className="flex gap-3">
           <button onClick={() => initData()} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
             <RefreshCw size={18} className={cn(loading && "animate-spin")} />
           </button>
           <button disabled={processing} onClick={handleSave} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 hover:bg-slate-800 transition-all disabled:opacity-50">
             {processing ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 保存配置
           </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* 左侧：角色选择 (稍微扩宽) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10">
           {roles.map((r) => (
             <div key={r.id} onClick={() => setActiveRoleId(r.id)} className={cn("p-6 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between group", activeRoleId === r.id ? "bg-slate-900 border-slate-900 shadow-xl" : "bg-white border-slate-100 hover:border-cyan-200 shadow-sm hover:shadow-md")}>
                <div className="flex items-center gap-4">
                   <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-inner", activeRoleId === r.id ? "bg-cyan-500 text-slate-950" : "bg-slate-100 text-slate-400")}> <UserCog size={24} /> </div>
                   <div className="flex flex-col"><span className={cn("text-lg font-black uppercase tracking-tighter", activeRoleId === r.id ? "text-white" : "text-slate-900")}>{r.name}</span><span className={cn("text-[9px] font-mono", activeRoleId === r.id ? "text-cyan-400" : "text-slate-400")}>ROLE_ID: {r.id}</span></div>
                </div>
                {activeRoleId === r.id && <motion.div layoutId="active-dot" className="w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]" />}
             </div>
           ))}
        </div>

        {/* 右侧：权限点定义 (收紧宽度) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative bg-gradient-to-b from-white to-slate-50/30">
           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/20">
              {loading ? <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>同步矩阵定义中...</span></div> : (
                <div className="space-y-12">
                   {Array.from(new Set(permissions.map(p => p.module))).map(module => (
                     <div key={module} className="space-y-6">
                        <div className="flex items-center justify-between ml-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                           <div className="flex items-center gap-3"><div className="w-1 h-4 bg-slate-900 rounded-full" /><h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{module} 业务域</h4></div>
                           <button onClick={() => toggleModule(module)} className="text-[10px] font-black text-cyan-600 hover:text-cyan-700 flex items-center gap-1.5 uppercase transition-colors">
                              {permissions.filter(p => p.module === module).every(c => rolePerms.includes(c.code)) ? <><CheckSquare size={14}/> 全选</> : <><Square size={14}/> 快速全选</>}
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                           {permissions.filter(p => p.module === module).map(p => (
                             <div key={p.code} onClick={() => togglePermission(p.code)} className={cn("p-6 rounded-3xl border transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden", rolePerms.includes(p.code) ? "bg-white border-cyan-500 shadow-lg" : "bg-slate-50 border-slate-100 opacity-60 grayscale hover:opacity-100")}>
                                <div className="flex justify-between items-start"><span className={cn("text-sm font-black transition-colors", rolePerms.includes(p.code) ? "text-slate-900" : "text-slate-400")}>{p.name}</span><div className={cn("w-5 h-5 rounded-full flex items-center justify-center transition-all", rolePerms.includes(p.code) ? "bg-cyan-500 text-white shadow-md" : "bg-slate-200 text-slate-400")}>{rolePerms.includes(p.code) && <CheckCircle2 size={12} />}</div></div>
                                <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md w-fit">{p.code}</span>
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