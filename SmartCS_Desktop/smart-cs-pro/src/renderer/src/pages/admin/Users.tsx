import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Shield, UserCog, RefreshCw, ChevronRight } from 'lucide-react'
import axios from 'axios'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([
    { username: 'zhangsan', real_name: '张三', role: 'AGENT', dept: '销售一部' },
    { username: 'lisi', real_name: '李四', role: 'ADMIN', dept: '销售一部' },
    { username: 'hq_admin', real_name: '总部老王', role: 'HQ', dept: '总经办' },
  ])

  const handleRoleChange = async (username: string, newRole: string) => {
    // 调用我们刚才写的 API
    const res = await axios.post('http://127.0.0.1:8000/api/hq/user/update-role', {
      username,
      new_role: newRole,
      operator: 'HQ_MANAGER'
    })
    if (res.data.status === 'ok') {
      alert(`用户 ${username} 角色已修改为 ${newRole}，指令已通过实时链路下发。`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">公司成员权限矩阵</h2>
        <p className="text-slate-500 text-sm">在这里动态调整成员角色，变更将通过战术链路实时生效</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <motion.div key={u.username} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                <UserCog size={24} />
              </div>
              <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-[10px] font-black rounded uppercase tracking-tighter">
                {u.role}
              </span>
            </div>
            
            <h3 className="font-black text-slate-900 text-lg">{u.real_name}</h3>
            <p className="text-xs text-slate-400 font-bold mb-6">@{u.username} · {u.dept}</p>

            <div className="space-y-2 pt-4 border-t border-slate-50">
               <span className="text-[10px] font-black text-slate-400 uppercase">快捷调整角色</span>
               <div className="flex gap-2">
                  <RoleButton current={u.role} target="AGENT" onClick={() => handleRoleChange(u.username, 'AGENT')} />
                  <RoleButton current={u.role} target="ADMIN" onClick={() => handleRoleChange(u.username, 'ADMIN')} />
                  <RoleButton current={u.role} target="HQ" onClick={() => handleRoleChange(u.username, 'HQ')} />
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function RoleButton({ current, target, onClick }: any) {
  const active = current === target
  return (
    <button 
      onClick={onClick}
      disabled={active}
      className={cn(
        "flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95",
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
      )}
    >
      {target}
    </button>
  )
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ')
