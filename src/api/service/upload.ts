import { Api, ContentType, Delete, Get, Headers, Middleware, Post, Put, Query, useContext } from '@midwayjs/hooks';
import {
  Upload,
  useFields,
  useFiles,
} from '@midwayjs/hooks-upload';
import { prisma } from '@/api/utils/prisma';
import { exportExcel, failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';
import Excel from 'exceljs'
import { validateClass, validateCourse, validateStudent } from '../utils/upload';
import md5 from 'md5';

// 获取当前选课信息
const getCurTermInfo = async () => {
  return await prisma.term.findFirst({
    where: {
      status: true
    }
  })
}

/**
 * 导入课程
 */
export const course = Api(
  Upload('/upload/course'),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    // 返回结果
    const errorRows = []
    const warningRows = []
    const importRows = []
    // 校验辅助数据
    const termInfo = await getCurTermInfo()
    const allTeacher = await prisma.teacher.findMany()
    const allMajor = await prisma.major.findMany()

    // 读取 excel
    const files = useFiles()
    const data = files.file[0].data
    const workbook = new Excel.Workbook()
    await workbook.xlsx.readFile(data)
    const sheet = workbook.getWorksheet(1)
    for (let i = 2; i <= sheet.actualRowCount; i++) {
      const line = sheet.getRow(i).values
      const course = {
        course_id: line[1], name: line[2], link: line[3], week_num: line[4], score: line[5],
        hour: line[6], course_time: line[7], prop: line[8], domain: line[9], type: line[10],
        address: line[11], target_num: line[12],
        teacher_ids: line[13]?.split(/[,，]/) || [],
        major_limit_names: line[14]?.split(/[,，]/) || [],
        exhibit_limit: line[15]?.split(/[,，]/) || [],
        first_limit: line[16]?.split(/[,，]/) || [],
        second_limit: line[17]?.split(/[,，]/) || [],
        third_limit: line[18]?.split(/[,，]/) || [],
      }
      // 校验数据
      const valid = validateCourse(course, allTeacher, allMajor)
      if (valid !== true) {
        errorRows.push(`第${i}行 ${course.name}校验失败: ${valid}`)
      }

      // 校验重复数据
      const isExist = await prisma.course.findMany({
        where: {
          course_id: course.course_id,
          name: course.name,
          week_num: course.week_num,
        },
        include: {
          CourseTeachers: { select: { teacher: { select: { teacher_id: true } } } }
        }
      })
      // 同一课程 同一周次 不同老师
      let teacher_ids_isExist = isExist.some(c=>{
        const ori_ids = c.CourseTeachers.map(t=>t.teacher.teacher_id).slice().sort()
        const target_ids = course.teacher_ids.slice().sort()
        return JSON.stringify(ori_ids) === JSON.stringify(target_ids);
      })
      if (isExist.length > 0 && teacher_ids_isExist) {
        // 如果存在
        warningRows.push(`第${i}行 ${course.name} 已存在, 不再重复导入`)
      } else {
        // 不存在, 导入数据
        importRows.push(course)
      }
    }
    if (errorRows.length > 0) {
      return failRsp('校验未通过', 400, errorRows)
    }
    // 导入数据
    for (let j = 0; j < importRows.length; j++) {
      const course = importRows[j];
      const {
        course_id, name, link, week_num, score, hour,
        course_time, prop, domain, type, address, target_num,
        teacher_ids, major_limit_names, exhibit_limit, first_limit, second_limit, third_limit,
      } = course
      try {
        // 处理授课教师
        const teacherIds = teacher_ids.map(id => {
          const id_bysql = allTeacher.find(teacher => teacher.teacher_id === id)?.id
          return { teacher_id: id_bysql }
        })
        // 处理专业限制
        const majorLimitIds = major_limit_names.map(name => {
          const id_bysql = allMajor.find(major => major.name === name)?.id
          return { major_id: id_bysql }
        })
        // 处理阶段限制
        const gradeLimits = []
        exhibit_limit?.forEach(g => {
          gradeLimits.push({ stage: 0, grade: +g })
        })
        first_limit?.forEach(g => {
          gradeLimits.push({ stage: 1, grade: +g })
        })
        second_limit?.forEach(g => {
          gradeLimits.push({ stage: 2, grade: +g })
        })
        third_limit?.forEach(g => {
          gradeLimits.push({ stage: 3, grade: +g })
        })
        await prisma.course.create({
          data: {
            term_id: termInfo.id,
            course_id, name, week_num, course_time, domain, prop, address,
            score: +score,
            hour: +score,
            target_num: +target_num,
            link: link || '',
            type: type || '',
            // 教师数据
            CourseTeachers: { createMany: { data: teacherIds } },
            // 专业限制
            majorLimit: { createMany: { data: majorLimitIds } },
            // 阶段限制
            stageLimit: { createMany: { data: gradeLimits } }
          }
        })
      } catch (e) {
        errorRows.push(`${name}导入失败, 报错信息:${e.message}`)
      }
    }
    if (errorRows.length > 0) {
      return failRsp('校验未通过', 400, errorRows)
    }
    return successRsp({ importRows, warningRows })
  }
)

/**
 * 导入学生
 */
export const student = Api(
  Upload('/upload/student'),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    // 返回结果
    const errorRows = []
    const warningRows = []
    const importRows = []
    // 校验辅助数据
    const allMajor = await prisma.major.findMany()
    const allClass = await prisma.class.findMany()

    // 读取 excel
    const files = useFiles()
    const data = files.file[0].data
    const workbook = new Excel.Workbook()
    await workbook.xlsx.readFile(data)
    const sheet = workbook.getWorksheet(1)
    for (let i = 2; i <= sheet.actualRowCount; i++) {
      const line = sheet.getRow(i).values
      const student = {
        stu_id: line[1],
        name: line[2],
        sex: line[3],
        id_card: line[4],
        major_name: line[5],
        class_name: line[6],
        is_delay: line[7],
        type: line[8]
      }
      // 校验数据
      const valid = validateStudent(student, allMajor, allClass)
      if (valid !== true) {
        errorRows.push(`第${i}行 [${student.stu_id}]${student.name}校验失败: ${valid}`)
      }
      // 校验重复数据
      const isExist = await prisma.student.findUnique({ where: { stu_id: student.stu_id } })
      if (isExist?.id) {
        // 如果存在
        warningRows.push(`第${i}行 [${student.stu_id}]${student.name} 已存在, 不再重复导入`)
      } else {
        // 不存在, 导入数据
        importRows.push(student)
      }
    }
    // 校验失败
    if (errorRows.length > 0) {
      return failRsp('校验未通过', 400, errorRows)
    }
    // 导入数据
    for (let i = 0; i < importRows.length; i++) {
      const student = importRows[i];
      const { stu_id, name, sex, id_card, class_name, is_delay, type } = student
      try {
        await prisma.student.create({
          data: {
            name, id_card,
            sex: sex === '男' ? 1 : 0,
            is_delay: is_delay === '是' ? true : false,
            type: type === '本科' ? 0 : 1,
            account: {
              create: { user_name: stu_id, password: md5(id_card.slice(12)) }
            },
            class: { connect: { id: allClass.find(item => item.name === class_name)?.id, } }
          }
        })
      } catch (e) {
        errorRows.push(`${stu_id}-${name}导入失败, 报错信息:${e.message}`)
      }
    }
    // 返回结果
    if (errorRows.length > 0) {
      return failRsp('校验未通过', 400, errorRows)
    }
    return successRsp({ importRows, warningRows })

  }
)

/**
 * 导入班级
 */
export const classes = Api(
  Upload('/upload/class'),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    // 返回结果
    const errorRows = []
    const warningRows = []
    const importRows = []
    // 校验辅助数据
    const allMajor = await prisma.major.findMany()

    // 读取 excel
    const files = useFiles()
    const data = files.file[0].data
    const workbook = new Excel.Workbook()
    await workbook.xlsx.readFile(data)
    const sheet = workbook.getWorksheet(1)
    for (let i = 2; i <= sheet.actualRowCount; i++) {
      const line = sheet.getRow(i).values
      const classInfo = {
        name: line[1],
        major_name: line[2],
        enroll_year: line[3]
      }
      // 校验数据
      const valid = validateClass(classInfo, allMajor)
      if (valid !== true) {
        errorRows.push(`第${i}行 ${classInfo.name}校验失败: ${valid}`)
      }
      // 校验重复数据
      const isExist = await prisma.class.findFirst({ where: { name: classInfo.name } })
      if (isExist?.id) {
        // 如果存在
        warningRows.push(`第${i}行 ${classInfo.name}已存在, 不再重复导入`)
      } else {
        // 不存在, 导入数据
        importRows.push(classInfo)
      }
    }

    // 校验失败
    if (errorRows.length > 0) {
      return failRsp('校验未通过', 400, errorRows)
    }
    // 导入数据
    for (let i = 0; i < importRows.length; i++) {
      const classInfo = importRows[i]
      try {
        await prisma.class.create({
          data: {
            name: classInfo.name,
            major: {
              connect: {id: allMajor.find(major=>major.name===classInfo.major_name).id}
            },
            enroll_year: +classInfo.enroll_year
          }
        })
      } catch(e) {
        errorRows.push(`${classInfo.name}导入失败, 报错信息:${e.message}`)
      }
    }
    // 返回结果
    if (errorRows.length > 0) {
      return failRsp('校验未通过', 400, errorRows)
    }
    return successRsp({ importRows, warningRows })

  }
)
