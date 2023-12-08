import { Major, Teacher } from '@prisma/client';
import Excel from 'exceljs'


/**
 * 校验课程数据
 */
export const validateCourse = (course, allTeacher: Teacher[], allMajor: Major[]) => {
  const {
    course_id, name, link, week_num, score, hour, course_time, prop, domain, type,
    address, target_num, teacher_ids, major_limit_names, exhibit_limit, first_limit, second_limit, third_limit,
  } = course
  const errorInfo = []
  // 校验课程 id
  if (!course_id) {
    errorInfo.push('课程 id 为空')
  }
  // 校验课程名称
  if (!name){
    errorInfo.push('课程名称为空')
  }
  // 校验周次
  if (!week_num){
    errorInfo.push('周次为空')
  }
  // 校验学分
  if (!score){
    errorInfo.push('学分为空')
  } else if (isNaN(Number(score))) {
    errorInfo.push('学分类型异常')
  }
  // 校验课时
  if (!hour){
    errorInfo.push('学时为空')
  } else if (isNaN(Number(hour))){
    errorInfo.push('学时类型异常')
  }
  // 校验授课时间
  if (!course_time){
    errorInfo.push('授课时间为空')
  }
  // 校验课程属性
  if (!prop){
    errorInfo.push('课程属性为空')
  }
  // 校验课程领域
  if (!domain){
    errorInfo.push('课程领域为空')
  }
  // 校验授课地址
  if (!address){
    errorInfo.push('授课地点为空')
  }
  // 校验限选人数
  if (!target_num){
    errorInfo.push('限选人数为空')
  } else if (isNaN(Number(target_num))) {
    errorInfo.push('限选人数类型异常')
  }
  // 校验授课教师
  if (!teacher_ids){
    errorInfo.push('教师 id 为空')
  }
  teacher_ids.forEach(id => {
    if (!allTeacher.some(item => item.teacher_id === id)){
      errorInfo.push(`教师 id ${id} 不存在`)
    }
  })
  // 校验专业限制
  if (major_limit_names.length > 0) {
    major_limit_names.forEach(name => {
      if (!allMajor.some(item => item.name === name)){
        errorInfo.push(`专业 ${name} 不存在`)
      }
    })
  }
  // 如果存在错误信息, 返回
  if (errorInfo.length > 0){
    return errorInfo.join(', ')
  }
  return true
}
