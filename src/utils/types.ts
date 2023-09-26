export enum ROLE {
  /**管理员 */
  Admin = 'Admin',
  /**教师 */
  Teacher = 'teacher',
  /**学生 */
  Student = 'student'
}

export interface UserInfo {
  name: string;
  role: ROLE
}