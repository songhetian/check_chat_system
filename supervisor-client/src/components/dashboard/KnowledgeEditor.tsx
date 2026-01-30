// supervisor-client/src/components/dashboard/KnowledgeEditor.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export const KnowledgeEditor = ({ isOpen, onClose, initialData }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>沉淀为求助知识库</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-bold text-zinc-500">问题摘要 (用于搜索)</label>
            <Input defaultValue={initialData?.question} placeholder="请输入搜索关键词..." />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500">标准答案</label>
            <Textarea defaultValue={initialData?.solution} rows={4} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_global" />
            <label htmlFor="is_global" className="text-xs">设为全公司通用方案</label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="bg-blue-600 text-white">确认并入库</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
