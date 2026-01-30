import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExportService {
  async exportMonitorLogs(logs: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('敏感词监控日志');

    // 定义表头
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '触发时间', key: 'created_at', width: 25 },
      { header: '客服人员', key: 'agent_name', width: 20 },
      { header: '触发词', key: 'word', width: 15 },
      { header: '上下文内容', key: 'context', width: 50 },
      { header: '处理动作', key: 'action', width: 15 },
    ];

    // 添加数据
    worksheet.addRows(logs);

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F7FF' },
    };

    // 设置响应头并流式输出
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=monitor_report_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  }
}
