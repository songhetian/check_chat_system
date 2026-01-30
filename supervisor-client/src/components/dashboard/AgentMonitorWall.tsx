import React from 'react';
import { useMonitorStore } from '../../store/useMonitorStore';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { AlertTriangle, MessageSquare, Zap } from 'lucide-react';

export const AgentMonitorWall = () => {
  const agents = useMonitorStore((state) => state.agents);

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-200 rounded-3xl">
        <div className="text-4xl mb-4">🏠</div>
        <p className="text-zinc-500">当前暂无在线坐席，等待客服登录...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">

      {agents.map((agent) => (
        <Card key={agent.id} className={`border-l-4 transition-all hover:shadow-md ${
          agent.hasHelpRequest ? 'border-l-red-500 animate-pulse' : 
          agent.status === 'online' ? 'border-l-green-500' : 'border-l-zinc-300'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold">{agent.name}</CardTitle>
            <Badge variant={agent.status === 'online' ? 'default' : 'secondary'} className="text-[10px]">
              {agent.status.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>今日违规次数:</span>
                <span className={agent.violationCount > 0 ? 'text-red-500 font-bold' : ''}>
                  {agent.violationCount}
                </span>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-[10px] font-mono min-h-[40px] border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400">正在输入: </span>
                {agent.currentInput || <span className="italic text-zinc-300">等待输入...</span>}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] btn-premium">
                  <MessageSquare className="w-3 h-3 mr-1" /> 实时记录
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 h-8 text-[11px] btn-premium btn-danger-gradient"
                >
                  <Zap className="w-3 h-3 mr-1" /> 震屏提醒
                </Button>
              </div>

              {agent.hasHelpRequest && (
                <Button className="w-full h-9 text-[11px] btn-premium btn-amber-gradient font-bold shadow-amber-500/20">
                  <AlertTriangle className="w-3 h-3 mr-1 animate-bounce" /> 立即协助处理
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
