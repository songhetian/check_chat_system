import { motion } from 'framer-motion'
import { ShieldCheck, User, Clock, Info, Search } from 'lucide-react'
import { useState } from 'react'

export default function AuditStreamPage() {
  const [logs] = useState([
    { id: 1, op: '张主管', action: 'VIEW_VIDEO', target: 'AGENT-002', details: '查看了违规视频取证', time: '14:20:05' },
    { id: 2, op: 'SYSTEM', action: 'AUTO_MUTE', target: 'AGENT-005', details: '触发敏感词自动禁言', time: '13:15:22' },
    { id: 3, op: '总部管理员', action: 'PUSH_POLICY', target: 'ALL_AGENTS', details: '更新了全局 AI 过滤阈值', time: '10:00:01' },
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">全局合规审计流</h2>
        <p className="text-slate-500 text-sm">记录所有高级操作，确保系统管理透明且可追溯</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">操作时间</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">操作员</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">战术动作</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">目标对象</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">详细载荷</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Clock size={12} /> {log.time}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-[10px] text-cyan-600 font-bold">
                      {log.op[0]}
                    </div>
                    <span className="text-xs font-black text-slate-900">{log.op}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-900 text-white text-[9px] font-black rounded uppercase tracking-tighter">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600">{log.target}</td>
                <td className="px-6 py-4 text-xs text-slate-400 italic">"{log.details}"</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
