import { Controller, Get, Query } from '@nestjs/common';

@Controller('words')
export class WordsController {
  @Get('sync')
  async getSyncWords(@Query('deptId') deptId: number) {
    // 逻辑：查询全局敏感词 + 本部门专属敏感词
    // const globalWords = await this.wordService.findGlobal();
    // const deptWords = await this.wordService.findByDept(deptId);
    
    // 模拟返回
    return {
      sensitive: ['加微信', '转账', '垃圾', '投诉'],
      monitor: ['价格', '优惠', '退款']
    };
  }
}
