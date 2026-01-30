import { create } from 'zustand';

interface Reply {
  id: number;
  content: string;
  category: string;
  pinyin: string; // 用于拼音首字母搜索
}

interface ReplyState {
  searchQuery: string;
  replies: Reply[];
  isExpanded: boolean;
  setSearchQuery: (query: string) => void;
  setExpanded: (expanded: boolean) => void;
  // 模拟初始化话术
  initReplies: (replies: Reply[]) => void;
}

export const useReplyStore = create<ReplyState>((set) => ({
  searchQuery: '',
  replies: [],
  isExpanded: false,
  setSearchQuery: (query) => set({ searchQuery: query, isExpanded: query.length > 0 }),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
  initReplies: (replies) => set({ replies }),
}));
