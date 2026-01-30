import React from 'react';
import { AgentMonitorWall } from './components/dashboard/AgentMonitorWall';
import { LayoutDashboard, ShieldAlert, BookOpen, Settings, Bell } from 'lucide-react';

export const SupervisorApp = () => {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* 侧边栏 */}
      <aside className="w-64 bg-zinc-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">S</div>
          Smart-CS Pro
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={18}/>} label="实时监控" active />
          <NavItem icon={<ShieldAlert size={18}/>} label="违规审计" />
          <NavItem icon={<BookOpen size={18}/>} label="话术中心" />
          <NavItem icon={<Settings size={18}/>} label="系统设置" />
        </nav>
        <div className="p-4 border-t border-white/10 text-[11px] text-zinc-500">
          版本 v1.0.4 · 局域网已连接
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-zinc-800">坐席动态墙</h1>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer">
              <Bell size={20} className="text-zinc-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">3</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-zinc-200" />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 flex gap-8">
          <div className="flex-1 space-y-8">
            {/* 实时统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard label="在线坐席" value="42" subValue="/ 50" color="text-blue-600" />
              <StatsCard label="今日拦截违规" value="12" subValue="-15%" color="text-red-500" />
              <StatsCard label="待处理求助" value="3" subValue="紧急" color="text-amber-500" />
            </div>

            {/* 监控墙 */}
            <AgentMonitorWall />
          </div>

          {/* 右侧紧急任务队列 */}
          <aside className="w-80 space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 flex items-center gap-2">
              <Bell size={16} className="text-amber-500" /> 紧急求助队列 (3)
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border-2 border-amber-100 shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm">客服: 张小明</span>
                  <span className="text-[10px] text-zinc-400">2分钟前</span>
                </div>
                <p className="text-xs text-zinc-600 mb-3">"客户要求退全款，我该如何拒绝且不引起投诉？"</p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-[11px] btn-amber-gradient">立即指导</Button>
                  <Button variant="outline" size="sm" className="text-[11px]">查看截图</Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-[10px] text-zinc-400 hover:text-blue-500 hover:bg-blue-50"
                  onClick={() => toast.success('已成功沉淀至求助知识库')}
                >
                  <Plus size={10} className="mr-1" /> 结案并存为知识库
                </Button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const StatsCard = ({ label, value, subValue, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
    <div className="text-xs text-zinc-500 mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-sm text-zinc-400 font-medium">{subValue}</span>
    </div>
  </div>
);
