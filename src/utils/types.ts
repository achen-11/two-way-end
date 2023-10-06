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
  academic: Date[],
  semester: number,
  exhibitStage: Date[],
  firstStage: Date[]
  secondStage: Date[]
  thirdStage: Date[]
}