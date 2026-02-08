import React, { useState, useMemo, useEffect, memo } from 'react'
import { 
  FileText, Loader2, RefreshCw, X, Plus, Save, Trash2, Edit3, ShieldAlert, Search, FileCode, Paperclip, Image as ImageIcon
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

// V3.99: 外部化图标逻辑
const getTypeIcon = (type: string) => {
  if (!type) return <FileText className="text-slate-400" size={16}/>;
  switch(type) {
    case 'MD': return <FileCode className="text-cyan-500" size={16}/>
    case 'IMAGE': return <ImageIcon className="text-amber-500" size={16}/>
    case 'FILE': return <Paperclip className="text-purple-500" size={16}/>
    default: return <FileText className="text-slate-400" size={16}/>
  }
}

// V4.00: 弹窗组件隔离 (核心性能优化点)
const SopEditModal = memo(({ item, onSave, onCancel, isPending }: any) => {
  const [editItem, setEditItem] = useState(item || { title: '', content: '', sop_type: 'TEXT' })

  const handleSave = () => {
    if (!editItem.title || editItem.title.trim() === '') {
      toast.error('规范标题为必填项', { description: '请输入战术规范的标题名称' });
      return;
    }
    onSave(editItem);
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
      <div onClick={onCancel} className="absolute inset-0 bg-slate-950/60 cursor-pointer" />
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 p-12 overflow-y-auto max-h-[90vh] no-scrollbar">
         <div className="flex justify-between items-start mb-8">
            <h3 className="text-2xl font-black text-slate-900 italic uppercase flex items-center gap-3"><FileText className="text-emerald-500"/> 业务规范定义</h3>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={24}/></button>
         </div>
         <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">规范标题 <span className="text-red-500">*</span></label>
              <input 
                value={editItem.title || ''} 
                onChange={(e)=>setEditItem({...editItem, title: e.target.value})} 
                className={cn(
                  "w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-bold border outline-none transition-all",
                  (!editItem.title || editItem.title.trim() === '') ? "border-red-200" : "border-transparent focus:border-cyan-500"
                )}
                placeholder="如：售后退换货 SOP v1.2" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">载体类型</label>
                <TacticalSelect 
                  options={[
                    {id: 'TEXT', name: '纯文本'}, 
                    {id: 'MD', name: 'Markdown 指南'}, 
                    {id: 'IMAGE', name: '全息图片'}, 
                    {id: 'FILE', name: '外部文件/附件'}
                  ]} 
                  value={editItem.sop_type || 'TEXT'} 
                  onChange={(val) => setEditItem({...editItem, sop_type: val})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">数据归属</label>
                <div className="px-6 py-4 bg-slate-100 rounded-2xl text-xs font-black text-slate-500 border border-slate-200 uppercase tracking-widest">物理隔离：部门内部规范</div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 ml-1">详细内容 / 远程 URL 地址</label>
              <textarea 
                value={editItem.content || ''} 
                onChange={(e)=>setEditItem({...editItem, content: e.target.value})} 
                rows={6} 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium border border-transparent focus:border-cyan-500 outline-none resize-none transition-all no-scrollbar" 
                placeholder="输入详细文本、Markdown 内容，或文件的网络地址..." 
              />
            </div>

            <button 
              disabled={isPending} 
              onClick={handleSave} 
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 固化规范文档
            </button>
         </div>
      </div>
    </div>
  )
})

export default function BusinessSopsPage() {
  const { token, hasPermission, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalType, setModalType] = useState<'NONE' | 'EDIT' | 'DELETE'>('NONE')
  const [activeItem, setActiveItem] = useState<any>(null)

  const isHQ = user?.role_id === 3 || user?.role_code === 'HQ'

  const { data: sopData, isLoading, isFetching, refetch, isError, error: queryError } = useQuery({
    queryKey: ['business_sops_admin', page, search],
    queryFn: async () => {
      const res = await window.api.callApi({ 
        url: `${CONFIG.API_BASE}/ai/sops?page=${page}&size=10&search=${encodeURIComponent(search)}`, 
        method: 'GET', 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      if (res.status !== 200 || res.data?.status === 'error') {
        throw new Error(res.data?.message || res.error || '指挥中心同步失败');
      }
      return res.data
    },
    enabled: !!token,
    retry: false,
    staleTime: 5000
  })

  useEffect(() => {
    if (isError && queryError) {
      toast.error('SOP 获取异常', { description: queryError instanceof Error ? queryError.message : String(queryError) });
    }
  }, [isError, queryError]);

  const SopItems = useMemo(() => {
    const items = Array.isArray(sopData?.data) ? sopData.data : [];
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="py-20 text-center text-slate-400 italic font-medium opacity-50">
            {isLoading ? "正在同步指挥中心数据..." : "暂无 SOP 业务规范记录"}
          </td>
        </tr>
      );
    }

    return items.map((item: any) => (
      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm font-bold text-slate-600 text-center border-b border-slate-50">
        <td className="px-8 py-5 font-black text-slate-900 text-left min-w-[200px]">{item.title || '未命名规范'}</td>
        <td className="px-6 py-5 text-left max-w-md truncate italic opacity-60">
          {item.content ? `"${item.content}"` : <span className="text-[10px] uppercase tracking-tighter opacity-30">空内容</span>}
        </td>
        <td className="px-6 py-5 text-center">
           <span className="px-3 py-1 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 mx-auto w-fit border border-slate-200 text-[9px] font-black uppercase shadow-sm">
              {getTypeIcon(item?.sop_type)} {item?.sop_type || 'TEXT'}
           </span>
        </td>
        <td className="px-6 py-5 text-center">
          <span className={cn(
            "px-3 py-1 rounded-2xl text-[9px] font-black border uppercase tracking-widest",
            item.department_id ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-cyan-50 text-cyan-600 border-cyan-100"
          )}>
            {item.department__name || (item.department_id ? '未知部门' : '全域规范')}
          </span>
        </td>
        <td className="px-8 py-5 text-center">
          <div className="flex justify-center gap-2">
            {hasPermission('admin:sop:update') && (<button onClick={() => { setActiveItem(item); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-slate-200" title="修订"><Edit3 size={16} /></button>)}
            {hasPermission('admin:sop:delete') && (<button onClick={() => { setActiveItem(item); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-slate-200" title="废弃"><Trash2 size={16} /></button>)}
          </div>
        </td>
      </tr>
    ));
  }, [sopData?.data, hasPermission, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sops`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: payload })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_sops_admin'] })
      setModalType('NONE'); toast.success('部门SOP规范已同步')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return window.api.callApi({ url: `${CONFIG.API_BASE}/ai/sops/delete`, method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_sops_admin'] })
      setModalType('NONE'); toast.success('部门SOP已成功注销')
    }
  })

  return (
    <div className="flex flex-col gap-6 h-full font-sans bg-slate-50 p-4 lg:p-6 text-slate-900">
      <header className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">SOP 业务规范库</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic text-emerald-600">管理业务标准流程 · 支持文字、Markdown、图片及多媒体</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} placeholder="搜索 SOP 标题..." className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold w-64 outline-none" />
           </div>
           <button onClick={() => refetch()} className="p-3 bg-slate-50 text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"><RefreshCw size={18} className={cn((isLoading || isFetching) && "animate-spin")} /></button>
           {hasPermission('admin:sop:create') && (
             <button onClick={() => { setActiveItem({ title: '', content: '', sop_type: 'TEXT' }); setModalType('EDIT'); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl transition-all cursor-pointer"><Plus size={16} /> 录入 SOP</button>
           )}
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? <div className="h-64 flex flex-col items-center justify-center opacity-30"><Loader2 className="animate-spin mb-4" size={40} /></div> : (
              <TacticalTable headers={['规范标题', '内容预览', '载体类型', '作用域', '操作']}>
                {SopItems}
              </TacticalTable>
            )}
         </div>
         {sopData?.total > 10 && <div className="p-2 border-t border-slate-100"><TacticalPagination total={sopData.total} pageSize={10} currentPage={page} onPageChange={setPage} /></div>}
      </div>

      {modalType === 'EDIT' && (
        <SopEditModal 
          item={activeItem} 
          isPending={saveMutation.isPending}
          onCancel={() => setModalType('NONE')}
          onSave={(data: any) => saveMutation.mutate(data)}
        />
      )}

      {modalType === 'DELETE' && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 text-slate-900">
          <div onClick={() => setModalType('NONE')} className="absolute inset-0 bg-slate-950/60 cursor-pointer" />
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 p-10 text-center">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><ShieldAlert size={40} /></div>
             <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic">注销 SOP 规范?</h3>
             <p className="text-slate-500 text-xs font-medium mb-8">此操作将逻辑移除该业务指南。</p>
             <div className="flex gap-4">
                <button onClick={() => setModalType('NONE')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all cursor-pointer">取消</button>
                <button disabled={deleteMutation.isPending} onClick={() => activeItem?.id && deleteMutation.mutate(activeItem.id)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-200 transition-all cursor-pointer">确认注销</button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}