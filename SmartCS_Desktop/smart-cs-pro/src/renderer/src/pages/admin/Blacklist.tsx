import React from 'react'
import { 
  ShieldAlert, RefreshCw, Loader2, UserX, Unlock, 
  Clock, Trash2, Search, Info, CheckCircle2 
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable } from '../../components/ui/TacticalTable'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

export default function BlacklistPage() {
  const { token, hasPermission } = useAuthStore()
  const queryClient = useQueryClient()

  // 1. 数据拉取 (带物理隔离后端)
  const { data: blacklist = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['blacklist_admin'],
    queryFn: async () => {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/admin/blacklist`, 
        method: 'GET', 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      if (res.status !== 200) throw new Error('数据拉取失败');
      return res.data.data
    },
    enabled: !!token
  })

  // 2. 解封操作
  const unbanMutation = useMutation({
    mutationFn: async (username: string) => {
      return window.api.callApi({
        url: `${CONFIG.API_BASE}/admin/blacklist/delete`,
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        data: { username }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklist_admin'] })
      toast.success('解封成功', { description: '操作员战术链路已恢复正常' })
    }
  })

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50/50 p-4 lg:p-6 text-black">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
            <UserX size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter leading-none">战术禁闭名单</h2>
            <p className="text-slate-500 text-sm mt-2 font-bold flex items-center gap-2">
              管理当前处于物理封禁状态的操作员 · 
              <span className="text-red-600 uppercase tracking-widest">物理隔离机制已生效</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => refetch()} className="p-3 bg-slate-50 text-black rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer">
             <RefreshCw size={20} className={cn(isFetching && "animate-spin")} />
           </button>
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center opacity-30 gap-4">
              <Loader2 className="animate-spin" size={40} />
              <span className="font-black uppercase tracking-widest italic">载入封禁数据流...</span>
            </div>
          ) : (
            <TacticalTable headers={['禁闭成员画像', '所属部门', '封禁原因', '物理到期时间', '管理操作']}>
              {blacklist.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                       <CheckCircle2 size={64} className="text-emerald-600" />
                       <p className="text-sm font-black uppercase tracking-[0.3em]">当前无受限链路</p>
                    </div>
                  </td>
                </tr>
              ) : (
                blacklist.map((item: any) => (
                  <tr key={item.id} className="hover:bg-red-50/30 transition-colors group text-sm font-bold text-slate-600 text-center border-b border-slate-50">
                    <td className="px-8 py-5 min-w-[200px]">
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shadow-inner shrink-0">
                          {item.real_name?.[0]}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-black text-slate-900 leading-none">{item.real_name}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-1">@{item.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-2xl text-[9px] font-black border border-slate-200 uppercase tracking-widest">
                          {item.dept_name || '全域通用'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 italic opacity-60 text-[11px] font-medium max-w-xs truncate">
                      "{item.reason || '指挥部手动执行'}"
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-black uppercase">
                          <Clock size={12}/> {new Date(item.expired_at).toLocaleString()}
                        </div>
                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Remaining Access Restriction</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center">
                        {hasPermission('admin:blacklist:delete') && (
                          <button 
                            onClick={() => {
                              if(window.confirm(`确定要提前解除对 [${item.real_name}] 的物理封禁吗？`)) {
                                unbanMutation.mutate(item.username)
                              }
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-600 transition-all active:scale-95 cursor-pointer group"
                          >
                            <Unlock size={14} className="group-hover:animate-bounce" /> 解除封禁
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </TacticalTable>
          )}
        </div>
      </div>

      <div className="p-6 bg-slate-900 rounded-[32px] border border-white/5 shadow-2xl flex items-start gap-4 shrink-0">
         <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20 shadow-inner">
            <Info size={20} />
         </div>
         <div className="space-y-1">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">物理隔离协议说明</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              黑名单数据执行物理隔离。部门主管（ADMIN）仅能查看其所属战术单元内的被封禁成员。总部（HQ）拥有全域穿透权限。解封操作将同步清除 Redis 缓存并恢复该账号的建立链路能力。
            </p>
         </div>
      </div>
    </div>
  )
}
