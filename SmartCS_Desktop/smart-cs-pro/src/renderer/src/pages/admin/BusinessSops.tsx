import React, { useState, useMemo, useEffect, memo } from 'react'
import { 
  FileText, Loader2, RefreshCw, X, Plus, Save, Trash2, Edit3, ShieldAlert, Search, FileCode, Paperclip, Image as ImageIcon,
  UploadCloud, ExternalLink, Info, CheckCircle2, FileType
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalTable, TacticalPagination } from '../../components/ui/TacticalTable'
import { TacticalSelect } from '../../components/ui/TacticalSelect'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

// V4.30: 增强型图标映射
const getTypeIcon = (type: string) => {
  if (!type) return <FileText className="text-slate-400" size={16}/>;
  switch(type) {
    case 'MD': return <FileCode className="text-cyan-500" size={16}/>
    case 'IMAGE': return <ImageIcon className="text-amber-500" size={16}/>
    case 'FILE': return <Paperclip className="text-purple-500" size={16}/>
    default: return <FileText className="text-slate-400" size={16}/>
  }
}

// V4.50: 工业级录入页面重塑
const SopEditModal = memo(({ item, onSave, onCancel, isPending }: any) => {
  const [editItem, setEditItem] = useState(item || { title: '', content: '', sop_type: 'TEXT' })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const { token } = useAuthStore()

  const handleSave = () => {
    if (!editItem.title?.trim()) { toast.error('规范标题不能为空'); return; }
    if (!editItem.content?.trim()) { toast.error('规范内容或文件路径不能为空'); return; }
    onSave(editItem);
  }

  // 物理上传核心引擎 (支持进度监控)
  const uploadFile = async (fileObj: { name: string, data: string }) => {
    try {
      setIsUploading(true); setUploadProgress(0);
      
      const byteCharacters = atob(fileObj.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      
      const formData = new FormData()
      formData.append('file', blob, fileObj.name)
      const apiHost = CONFIG.API_BASE.replace('/api', '')

      // 使用 XMLHttpRequest 以获得原生进度监控
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${CONFIG.API_BASE}/ai/sops/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      };

      const resultPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error('上传失败'));
        };
        xhr.onerror = () => reject(new Error('网络链路异常'));
      });

      xhr.send(formData);
      const result: any = await resultPromise;

      if (result.status === 'ok') {
        setEditItem({ ...editItem, content: `${apiHost}${result.url}` })
        toast.success('物理载荷同步成功')
      } else {
        toast.error('同步失败', { description: result.message })
      }
    } catch (e) {
      toast.error('物理上传中断')
    } finally {
      setIsUploading(false); setUploadProgress(0);
    }
  }

  const triggerNativeUpload = async () => {
    let filters: any[] = [];
    if (editItem.sop_type === 'IMAGE') filters = [{ name: '图片', extensions: ['jpg', 'png', 'gif', 'webp'] }];
    else if (editItem.sop_type === 'MD') filters = [{ name: 'Markdown', extensions: ['md'] }];
    else filters = [{ name: '附件', extensions: ['pdf', 'doc', 'docx', 'xlsx', 'xls', 'ppt', 'pptx', 'zip'] }];
    
    const file = await window.api.selectFile({ title: '选取战术载体', filters })
    if (file) uploadFile(file);
  }

  // 拖拽处理
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (!['IMAGE', 'FILE', 'MD'].includes(editItem.sop_type)) {
      toast.error('当前载体类型不支持拖拽上传', { description: '请先切换类型为图片或文档' });
      return;
    }
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // 检查扩展名 (简单前端校验)
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedExts = ['jpg', 'png', 'gif', 'webp', 'md', 'pdf', 'doc', 'docx', 'xlsx', 'xls', 'ppt', 'pptx', 'zip'];
      if (!allowedExts.includes(ext)) {
        toast.error('不支持的物理格式', { description: `不允许上传 .${ext} 文件` });
        return;
      }

      // 将 File 转为 Base64 以复用逻辑 (Electron 模式下 selectFile 返回的是 base64)
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        uploadFile({ name: file.name, data: base64 });
      };
      reader.readAsDataURL(file);
    }
  }

  const isFileMode = ['IMAGE', 'FILE', 'MD'].includes(editItem.sop_type)

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 lg:p-8">
      <div onClick={onCancel} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer" />
      
      <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 flex overflow-hidden border border-white/20">
         
         {/* 左栏：核心配置 */}
         <div className="w-[400px] bg-slate-50 border-r border-slate-100 flex flex-col p-10 shrink-0">
            <header className="mb-10">
               <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                  <Plus size={24} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">SOP 规范定义</h3>
               <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Systematic Operation Procedure</p>
            </header>

            <div className="space-y-8 flex-1">
               <section>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block ml-1 tracking-widest">物理标题 <span className="text-red-500">*</span></label>
                  <input 
                    value={editItem.title || ''} 
                    onChange={(e)=>setEditItem({...editItem, title: e.target.value})} 
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all shadow-sm"
                    placeholder="输入规范标题..." 
                  />
               </section>

               <section>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block ml-1 tracking-widest">载体类型选择</label>
                  <TacticalSelect 
                    options={[
                      {id: 'TEXT', name: '标准文本 (TEXT)'}, 
                      {id: 'MD', name: 'Markdown 指南 (MD)'}, 
                      {id: 'IMAGE', name: '视觉资产 (IMAGE)'}, 
                      {id: 'FILE', name: '数据附件 (FILE)'}
                    ]} 
                    value={editItem.sop_type || 'TEXT'} 
                    onChange={(val) => setEditItem({...editItem, sop_type: val, content: ''})} 
                  />
               </section>

               <section className="p-6 bg-cyan-50/50 rounded-3xl border border-cyan-100">
                  <div className="flex items-start gap-3">
                     <Info size={16} className="text-cyan-600 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold text-cyan-800 leading-relaxed uppercase tracking-tighter">
                        当前定义的规范将自动同步至所属部门的物理链路中，HQ 角色拥有最高权限可跨部门调阅。
                     </p>
                  </div>
               </section>
            </div>

            <div className="pt-8 border-t border-slate-200 flex gap-3">
               <button onClick={onCancel} className="px-6 py-4 bg-white text-slate-500 rounded-2xl text-xs font-black uppercase hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer">取消</button>
               <button 
                 disabled={isPending || isUploading} 
                 onClick={handleSave} 
                 className="flex-1 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
               >
                 {isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                 固化规范文档
               </button>
            </div>
         </div>

         {/* 右栏：内容编辑/上传区 */}
         <div 
           className={cn(
             "flex-1 bg-white flex flex-col overflow-hidden transition-colors duration-300",
             isDragging && "bg-cyan-50/50"
           )}
           onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
           onDragLeave={() => setIsDragging(false)}
           onDrop={handleDrop}
         >
            <header className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 shrink-0">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">规范载体详情内容</span>
               {isFileMode && (
                 <button 
                   onClick={triggerNativeUpload}
                   disabled={isUploading}
                   className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-cyan-200 hover:bg-cyan-500 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                 >
                   {isUploading ? <Loader2 className="animate-spin" size={14}/> : <UploadCloud size={14}/>}
                   {isUploading ? `同步中 ${uploadProgress}%` : '物理文件上传'}
                 </button>
               )}
            </header>

            {/* 战术进度条 */}
            {isUploading && (
              <div className="h-1 w-full bg-slate-100 shrink-0">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-slate-50/10">
               {editItem.sop_type === 'TEXT' ? (
                 <textarea 
                   value={editItem.content || ''} 
                   onChange={(e)=>setEditItem({...editItem, content: e.target.value})} 
                   className="w-full h-full bg-white border border-slate-100 rounded-[32px] p-8 text-sm font-medium leading-relaxed focus:border-cyan-500 outline-none shadow-inner no-scrollbar resize-none"
                   placeholder="在此输入业务规范的详细文字指引..."
                 />
               ) : (
                 <div className="h-full flex flex-col gap-6">
                    <div className="flex-1 bg-white border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden group">
                       {editItem.content ? (
                         <>
                           {editItem.sop_type === 'IMAGE' ? (
                             <img src={editItem.content} className="max-w-full max-h-full rounded-2xl shadow-2xl transition-transform group-hover:scale-105 duration-500" />
                           ) : (
                             <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-cyan-50 text-cyan-600 rounded-3xl flex items-center justify-center shadow-inner">
                                   {editItem.sop_type === 'MD' ? <FileCode size={40}/> : <FileType size={40}/>}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-slate-900 uppercase italic">载荷就绪: {editItem.sop_type}</p>
                                   <p className="text-[10px] font-medium text-slate-400 break-all mt-2 max-w-sm">{editItem.content}</p>
                                </div>
                                <button onClick={() => window.open(editItem.content)} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-black transition-all cursor-pointer"><ExternalLink size={12}/> 浏览器物理预览</button>
                             </div>
                           )}
                         </>
                       ) : (
                         <div className="opacity-30 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
                               {editItem.sop_type === 'IMAGE' ? <ImageIcon size={40}/> : (editItem.sop_type === 'MD' ? <FileCode size={40}/> : <Paperclip size={40}/>)}
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest">请点击上方按钮进行文件物理拉取</p>
                         </div>
                       )}
                    </div>
                    {editItem.sop_type === 'MD' && (
                      <div className="bg-slate-900 text-slate-400 p-6 rounded-3xl font-mono text-[10px] leading-relaxed">
                         <p className="text-slate-200 mb-2 font-black uppercase tracking-widest">// 支持 Markdown 原生解析</p>
                         <p>对于 .md 文件，坐席端将自动执行物理渲染，支持表格、列表及多媒体载体。</p>
                      </div>
                    )}
                 </div>
               )}
            </div>
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
        <td className="px-8 py-5 font-black text-slate-900 text-center min-w-[200px]">{item.title || '未命名规范'}</td>
        <td className="px-6 py-5 text-center max-w-md">
          <div className="mx-auto truncate italic opacity-60 w-fit max-w-[300px]">
            {item.content ? `"${item.content}"` : <span className="text-[10px] uppercase tracking-tighter opacity-30">空内容</span>}
          </div>
        </td>
        <td className="px-6 py-5 text-center">
           <div className="flex items-center justify-center">
             <span className="px-3 py-1 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 border border-slate-200 text-[9px] font-black uppercase shadow-sm">
                {getTypeIcon(item?.sop_type)} {item?.sop_type || 'TEXT'}
             </span>
           </div>
        </td>
        <td className="px-6 py-5 text-center">
          <div className="flex items-center justify-center">
            <span className={cn(
              "px-3 py-1 rounded-2xl text-[9px] font-black border uppercase tracking-widest",
              item.department_id ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-cyan-50 text-cyan-600 border-cyan-100"
            )}>
              {item.department__name || (item.department_id ? '未知部门' : '全域规范')}
            </span>
          </div>
        </td>
        <td className="px-8 py-5 text-center">
          <div className="flex justify-center gap-2">
            {hasPermission('admin:sop:update') && (<button onClick={() => { setActiveItem(item); setModalType('EDIT') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-cyan-600 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-slate-200 shadow-sm" title="修订"><Edit3 size={16} /></button>)}
            {hasPermission('admin:sop:delete') && (<button onClick={() => { setActiveItem(item); setModalType('DELETE') }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-slate-200 shadow-sm" title="废弃"><Trash2 size={16} /></button>)}
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
