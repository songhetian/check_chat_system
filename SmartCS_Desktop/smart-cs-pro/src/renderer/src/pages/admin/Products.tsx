import { 
  FileSpreadsheet, Plus, Search, Copy, Edit3, Trash2, Target, Zap, Tag, Loader2, Package 
} from 'lucide-react'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../lib/config'
import { TacticalSearch } from '../../components/ui/TacticalSearch'

interface Product {
  id: string
  name: string
  sku: string
  price: string
  keywords: string[]
  usp: string
  stock: number
}

export default function ProductsPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [searchTerm, setSearchInput] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${CONFIG.API_BASE}/admin/products`)
      if (res.data.status === 'ok') setProducts(res.data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    const formData = new FormData(); formData.append('file', file)
    try {
      const res = await axios.post(`${CONFIG.API_BASE}/admin/products/import`, formData)
      if (res.data.status === 'ok') fetchProducts()
    } finally { setIsImporting(false) }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">商品战术库 <span className="text-cyan-500">ASSETS</span></h2>
          <p className="text-slate-500 text-sm mt-1">管理触发关键词、核心卖点与实时战术支持</p>
        </div>
        <div className="flex gap-3">
          <input type="file" id="excel-upload" className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
          <button onClick={() => document.getElementById('excel-upload')?.click()} disabled={isImporting} className="flex items-center gap-2 px-6 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition-all">
            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />} 批量同步 EXCEL
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black transition-all shadow-xl active:scale-95">
            <Plus size={16} /> 新增单条物料
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex gap-4 shrink-0">
        <TacticalSearch value={searchTerm} onChange={setSearchInput} placeholder="通过名称、SKU 检索战术资产..." className="flex-1" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-300 gap-3 font-black uppercase"><Loader2 className="animate-spin" /> 正在加载战术物料...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div layout key={product.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center"><Package size={24} /></div>
                    <div className="flex gap-1">
                      <button className="p-2 text-slate-300 hover:text-cyan-600 transition-colors"><Edit3 size={16} /></button>
                      <button className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">{product.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">SKU: {product.sku}</p>
                  <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">核心卖点 (USP)</span>
                      <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">"{product.usp}"</p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xl font-black text-slate-900">{product.price}</span>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">实时库存</p>
                        <p className="text-sm font-black text-slate-700">{product.stock}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}