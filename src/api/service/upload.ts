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
import { validateCourse } from '../utils/upload';

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
      // importRows.push(course)
      // break
      // 校验数据

      const valid = validateCourse(course, allTeacher, allMajor)
      if (valid !== true) {
        errorRows.push(line)
      }

      // 校验重复数据
      const isExist = await prisma.course.findFirst({
        where: {
          course_id: course.course_id,
          name: course.name,
          week_num: course.week_num,
        },
        include: {
          CourseTeachers: { select: { teacher: { select: { teacher_id: true } } } }
        }
      })
      if (isExist?.id) {
        // 如果存在
        warningRows.push(`第${i}行 ${course.name} 已存在, 不再重复导入`)
      } else {
        // 不存在, 导入数据
        // 处理数据
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
