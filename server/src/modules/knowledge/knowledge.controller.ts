// server/src/modules/knowledge/knowledge.controller.ts
import { Controller, Get, Query, Req } from '@nestjs/common';

@Controller('knowledge')
export class KnowledgeController {
  @Get('search')
  async search(@Query('q') query: string, @Query('deptId') deptId: number) {
    // 核心逻辑：
    // SELECT * FROM help_knowledge 
    // WHERE (question LIKE %query% OR tags LIKE %query%)
    // AND (scope = 'global' OR dept_id = deptId)
    
    return [
      { id: 1, question: '价格怎么谈？', solution: '如果是老客户，可以申请9折...', category: '主管方案' }
    ];
  }

  // 服务端全局管理：导出
  @Get('export')
  async exportAll() {
    // 生成 Excel/PDF 逻辑
    return { url: 'http://cdn.example.com/exports/knowledge_audit.xlsx' };
  }
}
