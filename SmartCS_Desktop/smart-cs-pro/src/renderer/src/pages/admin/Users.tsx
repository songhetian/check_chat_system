import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Shield, UserCog, RefreshCw, ChevronRight, 
  Loader2, Search, Filter, ShieldCheck, Mail, Building2,
  Trash2, Plus, ArrowUpRight, Upload, Download, CheckCircle2, X,
  FileSpreadsheet, AlertCircle, Award, GraduationCap, Medal, ShieldAlert, Edit3, Save
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'

function Modal({ isOpen, onClose, title, children }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="relative w-full max-w-lg rounded-[40px] shadow-2xl z-10 bg-white p-10">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button>
             </div>
             {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

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
  
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE' | 'ROLE_CONFIRM'>('NONE')
  const [targetUser, setTargetUser] = useState<any>(null)
  const [pendingRole, setPendingRole] = useState<any>(null)

  const fetchData = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      if (roles.length === 0 || depts.length === 0) {
        const [resRoles, resDepts] = await Promise.all([
          window.api.callApi({ url: `${CONFIG.API_BASE}/admin/roles`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }),
          window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?size=100`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
        ])
        if (resRoles.status === 200) setRoles(resRoles.data.data)
        if (resDepts.status === 200) setDepts(resDepts.data.data)
      }
      const resUsers = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&size=10&search=${search}&dept_id=${deptId}&role_only=${roleCode}&_t=${Date.now()}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resUsers.status === 200) {
        setUsers(resUsers.data.data)
        setTotal(resUsers.data.total)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, search, deptId, roleCode, token])

  // --- 操作执行：角色变更 (带确认) ---
  const handleRoleChangeRequest = (u: any, rId: string | number) => {
    const roleObj = roles.find(r => String(r.id) === String(rId))
    if (!roleObj || String(u.role_id) === String(rId)) return
    setTargetUser(u)
    setPendingRole(roleObj)
    setModalType('ROLE_CONFIRM')
  }

  const executeRoleChange = async () => {
    if (!targetUser || !pendingRole || !token) return
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/hq/user/update-role`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      data: { username: targetUser.username, new_role_id: pendingRole.id }
    })
    if (res.data.status === 'ok') {
      setModalType('NONE'); fetchData(true)
      window.dispatchEvent(new CustomEvent('trigger-toast', { detail: { title: '权责已重置', message: `操作员 ${targetUser.real_name} 已切换至 ${pendingRole.name}`, type: 'success' } }))
    }
  }

  // --- 操作执行：信息编辑 ---
  const handleEditSave = async () => {
    if (!targetUser || !token) return
    const res = await window.api.callApi({
      url: `${CONFIG.API_BASE}/admin/agents/update-info`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      data: { username: targetUser.username, real_name: targetUser.real_name, department_id: targetUser.department_id }
    })
    if (res.data.status === 'ok') {
      setModalType('NONE'); fetchData(true)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div><h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">成员权责矩阵</h2><p className="text-slate-500 text-sm mt-1 font-medium">配置操作员身份标识、物理归属及实战权责等级</p></div>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all"><Download size={16} /> 导出全量清单</button>
      </header>

      {/* 增强搜索区 */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex-1 min-w-[240px]"><TacticalSearch value={search} onChange={setSearch} placeholder="检索拼音、账号..." /></div>
        <div className="w-56"><TacticalSelect options={[{id: '', name: '全域战术单元'}, ...depts]} value={deptId} onChange={(val) => { setDeptId(val); setPage(1); }} /></div>
        <button onClick={() => fetchData(true)} className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-9 group"><RefreshCw size={18} className={cn(loading && "animate-spin")} /></button>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50"><Loader2 className="animate-spin" size={40} /><span>同步矩阵中...</span></div> : (
            <TacticalTable headers={['成员身份', '管理权责', '物理归属', '权限快速重设', '战术操作']}>
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center">
                  <td className="px-8 py-5 text-left"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black border border-cyan-100 shadow-inner">{u.real_name?.[0] || '?'}</div><div className="flex flex-col"><span className="text-sm font-black text-slate-900">{u.real_name}</span><span className="text-[9px] text-slate-400 font-mono">@{u.username}</span></div></div></td>
                  <td className="px-6 py-5">{u.is_manager ? <div className="px-3 py-1 bg-cyan-50 text-cyan-600 text-[10px] font-black rounded-full border border-cyan-100 inline-flex items-center gap-1.5 shadow-sm"><ShieldCheck size={12} /> 部门主管</div> : <span className="text-[10px] text-slate-300 italic">普通节点</span>}</td>
                  <td className="px-6 py-5 font-black text-slate-400 uppercase text-[10px] italic tracking-widest">{u.dept_name}</td>
                  <td className="px-6 py-5 min-w-[180px]">
                    {/* 升级：下拉重设 */}
                    <TacticalSelect 
                      options={roles} 
                      value={u.role_id} 
                      onChange={(val) => handleRoleChangeRequest(u, val)} 
                      showSearch={false}
                      className="!py-2 !px-3 !rounded-xl !text-xs"
                    />
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                       {hasPermission('admin:user:update') && (
                         <button onClick={() => { setTargetUser({...u, department_id: u.department_id || ''}); setModalType('EDIT'); }} className="p-2.5 bg-slate-100 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                       )}
                       {hasPermission('admin:user:delete') && (
                         <button onClick={() => { setTargetUser(u); setModalType('DELETE'); }} className="p-2.5 bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </TacticalTable>
          )}
        </div>
        {total > 10 && <div className="shrink-0 border-t border-slate-100 bg-white p-2"><TacticalPagination total={total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      {/* 模态框矩阵 */}
      <Modal isOpen={modalType === 'EDIT'} onClose={() => setModalType('NONE')} title="重校成员身份">
         <div className="space-y-8">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">真实姓名</label><input value={targetUser?.real_name} onChange={(e)=>setTargetUser({...targetUser, real_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 shadow-inner" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">所属战术单元</label>
               <TacticalSelect options={depts} value={targetUser?.department_id} onChange={(val)=>setTargetUser({...targetUser, department_id: val})} placeholder="指派归属部门" />
            </div>
            <button onClick={handleEditSave} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Save size={18} /> 固化重校变更</button>
         </div>
      </Modal>

      <Modal isOpen={modalType === 'ROLE_CONFIRM'} onClose={() => setModalType('NONE')} title="权责重设预警">
         <div className="space-y-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center border border-cyan-100 shadow-inner animate-pulse"><UserCog size={40} /></div>
            <div><h4 className="text-lg font-black text-slate-900 mb-2 italic">确认重设操作员权责？</h4><p className="text-sm text-slate-500 font-medium leading-relaxed px-4">您正在将 <span className="text-cyan-600 font-black">[{targetUser?.real_name}]</span> 的身份切换为 <span className="text-slate-900 font-black">[{pendingRole?.name}]</span>。系统将物理记录此项高危变更至审计流。</p></div>
            <div className="grid grid-cols-2 gap-4 w-full">
               <button onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all">放弃动作</button>
               <button onClick={executeRoleChange} className="py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">确认授权</button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={modalType === 'DELETE'} onClose={() => setModalType('NONE')} title="节点注销警报">
         <div className="space-y-8 flex flex-col items-center text-center text-slate-900">
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-inner"><ShieldAlert size={40} className="animate-pulse" /></div>
            <h3 className="text-xl font-black mb-2 italic text-red-600">物理注销确认</h3>
            <p className="text-xs text-slate-400 font-medium mb-8">注销操作员 <span className="text-red-600 font-black">[@{targetUser?.username}]</span>。此行为将被物理审计。</p>
            <div className="grid grid-cols-2 gap-4 w-full"><button onClick={() => setModalType('NONE')} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">取消</button><button onClick={async() => { if(!targetUser || !token) return; await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/agents/delete`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: { username: targetUser.username } }); setModalType('NONE'); fetchData(true); }} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-600">确认注销</button></div>
         </div>
      </Modal>
    </div>
  )
}
