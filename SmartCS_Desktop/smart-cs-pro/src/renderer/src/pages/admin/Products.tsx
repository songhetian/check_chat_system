import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Copy, 
  Edit3, 
  Trash2, 
  Target, 
  Zap, 
  Tag, 
  Loader2,
  Package 
} from 'lucide-react'
import axios from 'axios'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface Product {
  id: string
  name: string
  sku: string
  price: string
  keywords: string[] // 触发弹窗的关键词
  usp: string // Unique Selling Point 核心卖点
  stock: number
}

export default function ProductsPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [searchTerm, setSearchInput] = useState('')
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'SmartLink Pro 无线耳机',
      sku: 'SL-2024-X1',
      price: '¥899',
      keywords: ['耳机', '听不清', '无线'],
      usp: '采用自适应降噪技术，续航40小时，支持空间音频...', 
      stock: 142
    },
    {
      id: '2',
      name: 'Tactical Watch 极战手表',
      sku: 'TW-GT-05',
      price: '¥2,499',
      keywords: ['手表', '运动', '心率', '防水'],
      usp: '蓝宝石玻璃镜面，支持100+运动模式，50米专业防水...', 
      stock: 85
    }
  ])

  // 模糊搜索逻辑
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.keywords.some(k => k.includes(searchTerm))
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // 触发全局通知
  }

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/admin/products/import', formData)
      if (res.data.status === 'ok') {
        setProducts(prev => [...res.data.data, ...prev])
        alert(`成功导入 ${res.data.count} 个商品，战术引擎已同步！`)
      }
    } catch (err) {
      alert('导入失败，请检查 Excel 格式是否正确')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">商品战术库</h2>
          <p className="text-slate-500 text-sm">管理触发关键词、核心卖点与实时战术支持</p>
        </div>
        <div className="flex gap-3">
          {/* 隐藏的 File Input */}
          <input 
            type="file" 
            id="excel-upload" 
            className="hidden" 
            accept=".xlsx, .xls" 
            onChange={handleExcelImport}
          />
          <button 
            onClick={() => document.getElementById('excel-upload')?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 hover:border-cyan-500 text-slate-600 hover:text-cyan-600 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            批量导入 Excel
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-cyan-900/20 active:scale-95">
            <Plus size={18} />录入单条物料
          </button>
        </div>
      </div>
      {/* ... (后续搜索栏和卡片展示逻辑保持一致) */}
      {/* 搜索与过滤工具栏 */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="通过名称、SKU 或触发关键词进行模糊搜索..." 
            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-500 flex items-center gap-2">
              <Tag size={14} /> 全部分类
           </div>
        </div>
      </div>

      {/* 商品网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div
              layout
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all group relative overflow-hidden"
            >
              {/* 装饰性背景图标 */}
              <Package className="absolute -right-4 -top-4 w-24 h-24 text-slate-50 opacity-[0.03] group-hover:scale-110 transition-transform" />

              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                  <Package size={24} />
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors"><Edit3 size={16} /></button>
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">{product.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">SKU: {product.sku}</p>

              <div className="space-y-4">
                {/* 触发关键词 */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2">
                    <Target size={10} /> 触发关键词 (OCR/文本命中)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {product.keywords.map(k => (
                      <span key={k} className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[10px] font-bold rounded-md border border-cyan-100">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 核心卖点 */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group/usp">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">标准战术话术 (USP)</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">"{product.usp}"</p>
                  <button 
                    onClick={() => copyToClipboard(product.usp)}
                    className="absolute right-2 top-2 p-2 bg-white rounded-xl shadow-sm opacity-0 group-hover/usp:opacity-100 transition-all hover:text-cyan-600 active:scale-90"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-black text-slate-900">{product.price}</span>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">实时库存</p>
                      <p className="text-sm font-black text-slate-700">{product.stock}</p>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      product.stock > 20 ? "bg-green-500" : "bg-red-500 animate-pulse"
                    )} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
