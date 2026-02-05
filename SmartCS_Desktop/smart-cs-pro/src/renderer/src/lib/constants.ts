/**
 * [Smart-CS Pro] 战术系统全局常量 (前端专用)
 */

export const ROLE_ID = {
  /** 总部管理员：全域穿透 */
  HQ: 1,
  /** 部门主管：锁定部门视图 */
  ADMIN: 2,
  /** 坐席操作员：个人实战态势 */
  AGENT: 3
} as const;
