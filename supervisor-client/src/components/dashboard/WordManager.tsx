import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PlusCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

// 定义表单校验模式
const wordSchema = z.object({
  word: z.string().min(1, '词汇不能为空').max(20, '词汇过长'),
  type: z.enum(['sensitive', 'monitor']),
  level: z.enum(['1', '2', '3']).default('1'),
});

export const WordManager = () => {
  const form = useForm<z.infer<typeof wordSchema>>({
    resolver: zodResolver(wordSchema),
    defaultValues: {
      word: "",
      type: "monitor",
    },
  });

  const onSubmit = (values: z.infer<typeof wordSchema>) => {
    console.log("提交新词库:", values);
    // 实际代码中调用 React Query 的 mutation
    toast.success(`成功添加词汇: ${values.word}`);
    form.reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle size={16} /> 录入违禁词
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="text-blue-500" />
            添加监控内容
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="word"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>敏感词/关键词</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：加微信、私下交易" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>处理策略</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择处理方式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monitor">仅监控并记录日志</SelectItem>
                      <SelectItem value="sensitive">强制拦截并底层删除</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                立即同步至全员
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
