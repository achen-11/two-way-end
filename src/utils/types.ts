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
  role: ROLE,
  id:number,
  /**学生号 */
  stu_id?:number,
  class?: {
    /**入学年份 */
    enroll_year?: number,
    /**专业 id */
    major_id?: number,
  }

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

// 原始选课信息
export interface OriTermInfo {
  id?: number,
  academic_start: number,
  academic_end: number,
  semester: number,
  exhibit_stage_start: string,
  exhibit_stage_end: string,
  first_stage_start: string,
  first_stage_end: string,
  second_stage_start: string,
  second_stage_end: string,
  third_stage_start: string,
  third_stage_end: string
}

// 专业信息
export interface Major {
  id?: number
  name: string,
  college: "人文学院" | "商务与管理学院" | "信息与智能机电学院" | "环境与公共健康学院",
}

// excel表头接口
export interface ExcelColumn {
  /**列名 */
  label: string,
  /**列的 key */
  value: string
}

// 课程查询所需的字段
export interface FindCourseOption {
  // ========== 学生信息 ==========
  /**学生唯一id */
  student_id:number,
  /**入学年份 */
  enroll_year: number,
  /**专业 id */
  major_id: number,
  
  // ========== 选课信息 ==========
  
  /**结束学年 */
  academic_end: number,
  /**选课阶段 */
  stage: number,


}