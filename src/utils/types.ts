// 角色
export enum ROLE {
  /**管理员 */
  Admin = 'Admin',
  /**教师 */
  Teacher = 'teacher',
  /**学生 */
  Student = 'student'
}

// 用户信息
export interface UserInfo {
  name: string;
  role: ROLE
}

// 选课信息
export interface TermInfo {
  id?: number,
  academic: Date[],
  semester: number,
  exhibitStage: Date[],
  firstStage: Date[]
  secondStage: Date[]
  thirdStage: Date[]
}

// 专业信息
export interface Major {
  id?: string
  name: string,
  college: "人文学院" | "商务与管理学院" | "信息与智能机电学院" | "环境与公共健康学院",
}