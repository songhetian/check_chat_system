import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Shield, UserCog, RefreshCw, ChevronRight, 
  Loader2, Search, Filter, ShieldCheck, Mail, Building2,
  Trash2, Plus, ArrowUpRight, Upload, Download, CheckCircle2, X,
  FileSpreadsheet, AlertCircle, Award, GraduationCap, Medal, ShieldAlert
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'

export default function UsersPage() {
  const { hasPermission, token, user } = useAuthStore()
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [depts, setDepts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [deptId, setDeptId] = useState<string | number>('')
  const [roleCode, setRoleCode] = useState<string | number>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [showImport, setShowImport] = useState(false)
  const [modalType, setModalType] = useState<'NONE' | 'DELETE'>('NONE')
  const [targetUser, setTargetUser] = useState<any>(null)

  const isHQ = user?.role_code === 'HQ'

  const fetchData = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      // 1. 同步角色与部门列表 (HQ专属或初始化)
      if (roles.length === 0 || depts.length === 0) {
        const [resRoles, resDepts] = await Promise.all([
          window.api.callApi({ url: `${CONFIG.API_BASE}/admin/roles`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }),
          window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?size=100`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
        ])
        if (resRoles.status === 200) setRoles(resRoles.data.data)
        if (resDepts.status === 200) setDepts(resDepts.data.data)
      }

      // 2. 获取成员列表
      const resUsers = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&size=10&search=${search}&dept_id=${deptId}&role_only=${roleCode}&_t=${Date.now()}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resUsers.status === 200) {
        setUsers(resUsers.data.data)
        setTotal(resUsers.data.total)
      }

      if (silent) {
        window.dispatchEvent(new CustomEvent('trigger-toast', { detail: { title: '矩阵已对齐', message: '成员权责数据已物理刷新', type: 'success' } }))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, search, deptId, roleCode, token])

  const openDeleteModal = (user: any) => { setTargetUser(user); setModalType('DELETE'); }

  const executeDelete = async () => {
    if (!targetUser || !token) return
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/admin/agents/delete`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      data: { username: targetUser.username }
    })
    if (res.data.status === 'ok') {
      setModalType('NONE'); fetchData(true)
    }
  }

  const handleRoleChange = async (username: string, newRoleId: number) => {
    if (!token) return
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/hq/user/update-role`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      data: { username, new_role_id: newRoleId }
    })
    if (res.data.status === 'ok') {
      fetchData(true)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0 gap-6">
        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">成员权责矩阵</h2><p className="text-slate-500 text-sm mt-1 font-medium">精确配置操作员身份、战术奖惩记录及实战入驻状态</p></div>
        <div className="flex flex-wrap gap-3">
           <button className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black shadow-lg"><Download size={14} /> 模板下载</button>
           {hasPermission('admin:user:create') && (
             <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-xl"><Upload size={14} /> 批量导入</button>
           )}
        </div>
      </header>

      {/* 增强搜索区：统一 TacticalSelect */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex-1 min-w-[240px]"><TacticalSearch value={search} onChange={setSearch} placeholder="搜索姓名拼音、账号..." /></div>
        
        {isHQ && (
          <div className="w-56">
            <TacticalSelect 
              options={[{id: '', name: '全域战术单元'}, ...depts]} 
              value={deptId} 
              onChange={(val) => { setDeptId(val); setPage(1); }} 
              placeholder="选择部门" 
            />
          </div>
        )}

        <div className="w-48">
          <TacticalSelect 
            options={[{id: '', name: '全量职位'}, ...roles.map(r => ({id: r.code, name: r.name}))]} 
            value={roleCode} 
            onChange={(val) => { setRoleCode(val); setPage(1); }} 
            placeholder="职位过滤" 
          />
        </div>

        <button onClick={() => fetchData(true)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 group">
          <RefreshCw size={18} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>调取中枢矩阵...</span></div> : (
            <TacticalTable headers={['成员身份', '管理权限', '战术单元', '当前角色', '权限快速重校', '战术操作']}>
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600">
                  <td className="px-8 py-5"><div className="flex items-center justify-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black border border-cyan-100">{u.real_name?.[0] || '?'}</div><div className="flex flex-col text-left"><span className="text-sm font-black text-slate-900">{u.real_name}</span><span className="text-[9px] text-slate-400 font-mono italic">@{u.username}</span></div></div></td>
                  <td className="px-6 py-5 text-center">{u.is_manager ? <div className="px-3 py-1 bg-cyan-50 text-cyan-600 text-[10px] font-black rounded-full border border-cyan-100 inline-flex items-center gap-1.5 shadow-sm"><ShieldCheck size={12} /> 部门主管</div> : <span className="text-[10px] text-slate-300 font-bold italic">普通成员</span>}</td>
                  <td className="px-6 py-5 text-center font-black text-slate-400 uppercase text-[10px] italic">{u.dept_name}</td>
                  <td className="px-6 py-5 text-center"><span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm", u.role_code === 'HQ' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200")}>{u.role_name}</span></td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                       {roles.map(r => (
                         <button key={r.id} onClick={() => handleRoleChange(u.username, r.id)} disabled={u.role_id === r.id || !hasPermission('admin:user:update')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 border shadow-sm", u.role_id === r.id ? "bg-cyan-500 border-cyan-400 text-slate-950" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-30")}>{r.name}</button>
                       ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {hasPermission('admin:user:delete') ? <button onClick={() => openDeleteModal(u)} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button> : <span className="text-[10px] text-slate-300 italic font-black uppercase">Locked</span>}
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 10 && <div className="shrink-0 border-t border-slate-100 bg-white p-2"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      <AnimatePresence>
        {modalType === 'DELETE' && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
               <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner"><ShieldAlert size={40} className="animate-pulse" /></div>
               <h3 className="text-xl font-black mb-2 italic">注销操作员节点？</h3>
               <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed px-4 text-center">您正在物理注销 <span className="text-red-600 font-black">[@{targetUser?.username}]</span>。此操作不可逆。</p>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all">放弃动作</button>
                  <button onClick={executeDelete} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600 active:scale-95 transition-all">确认注销</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}