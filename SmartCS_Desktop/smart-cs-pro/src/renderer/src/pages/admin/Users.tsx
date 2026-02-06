import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, UserCog, RefreshCw, 
  Loader2, ShieldCheck, 
  Trash2, Download, X,
  ShieldAlert, Edit3, Save
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSearch } from '../../components/ui/TacticalSearch'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

// Lightweight Performance Modal
function PerformanceModal({ isOpen, onClose, title, children, isPending }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isPending && onClose()} className="absolute inset-0 bg-slate-900/40" />
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative w-full max-w-md rounded-xl shadow-xl z-10 bg-white p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase italic">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={18}/></button>
             </div>
             {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function UsersPage() {
  const { hasPermission, token } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [deptId, setDeptId] = useState<string | number>('')
  const [roleCode, setRoleCode] = useState<string | number>('')
  const [page, setPage] = useState(1)
  
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE' | 'ROLE_CONFIRM'>('NONE')
  const [targetUser, setTargetUser] = useState<any>(null)
  const [pendingRole, setPendingRole] = useState<any>(null)

  // React Query: Fetch Roles
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/roles`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data
    },
    enabled: !!token
  })

  // React Query: Fetch Departments
  const deptsQuery = useQuery({
    queryKey: ['departments_all'],
    queryFn: async () => {
      const res = await window.api.callApi({ url: `${CONFIG.API_BASE}/admin/departments?size=100`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      return res.data.data
    },
    enabled: !!token
  })

  // React Query: Fetch Users
  const usersQuery = useQuery({
    queryKey: ['users', page, search, deptId, roleCode],
    queryFn: async () => {
      const res = await window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents?page=${page}&size=10&search=${search}&dept_id=${deptId}&role_only=${roleCode}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.data
    },
    enabled: !!token
  })

  const users = usersQuery.data?.data || []
  const total = usersQuery.data?.total || 0
  const roles = rolesQuery.data || []
  const depts = deptsQuery.data || []

  // React Query: Role Change Mutation
  const roleMutation = useMutation({
    mutationFn: async (data: any) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/hq/user/update-role`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setModalType('NONE')
        toast.success('权责已重置', { description: `操作员 ${targetUser.real_name} 已切换至 ${pendingRole.name}` })
      }
    }
  })

  // React Query: Info Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      // 核心清洗：确保 ID 类型字段不传空字符串
      const sanitizedData = {
        ...payload,
        department_id: payload.department_id === '' ? null : payload.department_id
      }
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents/update-info`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: sanitizedData
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setModalType('NONE')
        toast.success('信息已更新', { description: `操作员 ${targetUser.real_name} 的档案已同步` })
      }
    }
  })

  // React Query: Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (username: string) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/agents/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { username }
      })
    },
    onSuccess: (res) => {
      if (res.status === 200 || res.data?.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setModalType('NONE')
        toast.success('节点已物理注销')
      }
    }
  })

  const handleRoleChangeRequest = (u: any, rId: string | number) => {
    const roleObj = roles.find((r: any) => String(r.id) === String(rId))
    if (!roleObj || String(u.role_id) === String(rId)) return
    setTargetUser(u)
    setPendingRole(roleObj)
    setModalType('ROLE_CONFIRM')
  }

  const isAnyLoading = usersQuery.isLoading || rolesQuery.isLoading || deptsQuery.isLoading
  const isAnyFetching = usersQuery.isFetching || rolesQuery.isFetching || deptsQuery.isFetching
  const isPending = roleMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic text-tactical-glow">成员权责矩阵</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            配置操作员身份标识、物理归属及实战权责等级
            {isAnyFetching && <span className="flex items-center gap-1 text-cyan-600 animate-pulse"><RefreshCw size={12} className="animate-spin" /> 同步中</span>}
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all"><Download size={16} /> 导出全量清单</button>
      </header>

      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex-1 min-w-[240px]"><TacticalSearch value={search} onChange={setSearch} placeholder="检索拼音、账号..." /></div>
        <div className="w-56"><TacticalSelect options={[{id: '', name: '全域战术单元'}, ...depts]} value={deptId} onChange={(val) => { setDeptId(val); setPage(1); }} /></div>
        <button onClick={() => usersQuery.refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all group">
          <RefreshCw size={18} className={cn(isAnyFetching && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isAnyLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 uppercase font-black italic opacity-50">
              <Loader2 className="animate-spin" size={40} />
              <span>同步矩阵中...</span>
            </div>
          ) : (
            <TacticalTable headers={['成员身份', '管理权责', '物理归属', '权限快速重设', '战术操作']}>
              {users.map((u: any) => (
                <tr key={u.username} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center">
                  <td className="px-8 py-5 text-left"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black border border-cyan-100 shadow-inner">{u.real_name?.[0] || '?'}</div><div className="flex flex-col"><span className="text-sm font-black text-slate-900">{u.real_name}</span><span className="text-[9px] text-slate-400 font-mono">@{u.username}</span></div></div></td>
                  <td className="px-6 py-5">{u.is_manager ? <div className="px-3 py-1 bg-cyan-50 text-cyan-600 text-[10px] font-black rounded-full border border-cyan-100 inline-flex items-center gap-1.5 shadow-sm"><ShieldCheck size={12} /> 部门主管</div> : <span className="text-[10px] text-slate-300 italic">普通节点</span>}</td>
                  <td className="px-6 py-5 font-black text-slate-400 uppercase text-[10px] italic tracking-widest">{u.dept_name}</td>
                  <td className="px-6 py-5 min-w-[180px]">
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
                         <button onClick={() => { setTargetUser(u); setModalType('DELETE'); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
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

      {/* Performant Modal Matrix */}
      <PerformanceModal isOpen={modalType === 'EDIT'} onClose={() => setModalType('NONE')} title="重校成员身份" isPending={updateMutation.isPending}>
         <div className="space-y-6">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">真实姓名</label><input disabled={updateMutation.isPending} value={targetUser?.real_name} onChange={(e)=>setTargetUser({...targetUser, real_name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-black text-slate-900 shadow-inner disabled:opacity-50" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">所属战术单元</label>
               <TacticalSelect disabled={updateMutation.isPending} options={depts} value={targetUser?.department_id} onChange={(val)=>setTargetUser({...targetUser, department_id: val})} placeholder="指派归属部门" />
            </div>
            <button disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ username: targetUser.username, real_name: targetUser.real_name, department_id: targetUser.department_id })} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 固化重校变更
            </button>
         </div>
      </PerformanceModal>

      <PerformanceModal isOpen={modalType === 'ROLE_CONFIRM'} onClose={() => setModalType('NONE')} title="权责重设预警" isPending={roleMutation.isPending}>
         <div className="space-y-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center border border-cyan-100 shadow-inner"><UserCog size={32} /></div>
            <div><h4 className="text-lg font-black text-slate-900 mb-1 italic">确认重设操作员权责？</h4><p className="text-[11px] text-slate-500 font-medium leading-relaxed px-4">您正在将 <span className="text-cyan-600 font-black">[{targetUser?.real_name}]</span> 的身份切换为 <span className="text-slate-900 font-black">[{pendingRole?.name}]</span>。</p></div>
            <div className="grid grid-cols-2 gap-3 w-full">
               <button disabled={roleMutation.isPending} onClick={() => setModalType('NONE')} className="py-3.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all disabled:opacity-50">放弃动作</button>
               <button disabled={roleMutation.isPending} onClick={() => roleMutation.mutate({ username: targetUser.username, new_role_id: pendingRole.id })} className="py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                 {roleMutation.isPending && <Loader2 className="animate-spin" size={14} />} 确认授权
               </button>
            </div>
         </div>
      </PerformanceModal>

      <PerformanceModal isOpen={modalType === 'DELETE'} onClose={() => setModalType('NONE')} title="节点注销警报" isPending={deleteMutation.isPending}>
         <div className="space-y-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-inner"><ShieldAlert size={32} /></div>
            <h3 className="text-lg font-black mb-1 italic text-red-600">物理注销确认</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-2">注销操作员 <span className="text-red-600 font-black">[@{targetUser?.username}]</span>。此行为将被物理审计。</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button disabled={deleteMutation.isPending} onClick={() => setModalType('NONE')} className="py-3.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase disabled:opacity-50">取消</button>
              <button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(targetUser.username)} className="py-3.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50">
                {deleteMutation.isPending && <Loader2 className="animate-spin" size={14} />} 确认注销
              </button>
            </div>
         </div>
      </PerformanceModal>
    </div>
  )
}

