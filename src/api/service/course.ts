import { Api, ContentType, Delete, Get, Headers, Middleware, Post, Put, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { exportExcel, failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';
import { ExcelColumn } from '@/api/utils/types';
import * as fs from 'fs'

/**工具函数 */
/**处理专业限制数据 */
const handleMajorLimit = (oldData, newData) => {
  // oldData: [{id: xx, major_id: xx}]
  // newData: [major_id_1, major_id_2, major_id_3]

  const removedIds = []
  const addedIds = []
  // 遍历旧数据，检查是否还在 newData 中
  for (const oldItem of oldData) {
    if (!newData.some(newId => newId === oldItem.major_id)) {
      // 不存在, 则说明被移除了
      removedIds.push(oldItem.id);
    }
  }

  // 遍历新数据, 检查是否有 oldData 中没有的数据
  for (const newItem of newData) {
    if (!oldData.some(oldItem => oldItem.major_id === newItem)) {
      addedIds.push(newItem);
    }
  }
  return { removedIds, addedIds }
}

/**处理教师数据 */
const handleTeachers = (oldData, newData) => {
  const removedIds = []
  const addedIds = []
  for (const oldItem of oldData) {
    if (!newData.some(newId => newId === oldItem.teacher_id)) {
      // 不存在, 则说明被移除了
      removedIds.push(oldItem.id);
    }
  }

  // 遍历新数据, 检查是否有 oldData 中没有的数据
  for (const newItem of newData) {
    if (!oldData.some(oldItem => oldItem.teacher_id === newItem)) {
      addedIds.push(newItem);
    }
  }
  return { removedIds, addedIds }
}

/**处理阶段限制数据 */
const handleStageLimit = (oldData, newData) => {
  // oldData: stageLimit [{id, stage, grade, course_id}]
  // newData: {[grade]}

  const { grade_limits_exhibit, grade_limits_first, grade_limits_second, grade_limits_third } = newData
  const removedIds = []
  const addedIds = []
  // 遍历旧数据, 判断是否还在
  for (const oldItem of oldData) {
    const oldStage = oldItem.stage
    switch (oldStage) {
      case 0:
        if (!grade_limits_exhibit.includes(oldItem.grade)) removedIds.push(oldItem.id)
        break;
      case 1:
        if (!grade_limits_first.includes(oldItem.grade)) removedIds.push(oldItem.id)
        break;
      case 2:
        if (!grade_limits_second.includes(oldItem.grade)) removedIds.push(oldItem.id)
        break;
      case 3:
        if (!grade_limits_third.includes(oldItem.grade)) removedIds.push(oldItem.id)
        break;
    }
  }
  // 遍历新数据, 判断是否存在
  grade_limits_exhibit.forEach(grade => {
    if (!oldData.find(oldItem => oldItem.grade === grade && oldItem.stage === 0)) {
      addedIds.push({ stage: 0, grade })
    }
  })
  grade_limits_first.forEach(grade => {
    if (!oldData.find(oldItem => oldItem.grade === grade && oldItem.stage === 1)) {
      addedIds.push({ stage: 1, grade })
    }
  })
  grade_limits_second.forEach(grade => {
    if (!oldData.find(oldItem => oldItem.grade === grade && oldItem.stage === 2)) {
      addedIds.push({ stage: 2, grade })
    }
  })
  grade_limits_third.forEach(grade => {
    if (!oldData.find(oldItem => oldItem.grade === grade && oldItem.stage === 3)) {
      addedIds.push({ stage: 3, grade })
    }
  })
  return {
    removedIds,
    addedIds
  }
}


/**
 * 根据 query\page 分页查询课程数据
 */
export const list = Api(
  Get(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  Query<{ page: string, limit: string, option?: string }>(),
  async () => {
    let { page = 1, limit = 10, option = '{}' } = useContext().query
    try {
      // 处理 option
      let where = {}
      const keys = ['term_id', 'course_id', 'name', 'domain', 'type']
      option = JSON.parse(option)
      Object.keys(option).forEach((key) => {
        if (keys.includes(key) && option[key] !== '') {
          if (key === 'term_id') {
            where[key] = option[key]
          } else {
            where[key] = { contains: option[key] }
          }
        }
      })
      const res = await prisma.course.findMany({
        where,
        skip: Number(page - 1) * Number(limit),
        take: Number(limit),
        include: {
          majorLimit: {},
          stageLimit: {},
          CourseTeachers: {
            include: {
              teacher: true
            }
          }
        }
      })
      const total = await prisma.course.count({ where })
      return successRsp({
        list: res || [],
        total,
        where
      })
    } catch (e) {
      return failRsp(e.message)
    }
  }
)

/**
 * 根据 query导出课程数据
 * 
 */
export const excel = Api(
  Post(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  ContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  async (page: number, limit: number, option: any) => {
    page = page ? page : 1
    limit = limit ? limit : 100000
    option = option ? option : {}
    // 处理 where
    let where = {}
    const keys = ['term_id', 'course_id', 'name', 'domain', 'type']
    Object.keys(option).forEach((key) => {
      if (keys.includes(key) && option[key] !== '') {
        if (key === 'term_id') {
          where[key] = option[key]
        } else {
          where[key] = { contains: option[key] }
        }
      }
    })
    const result = await prisma.course.findMany({
      where: where,
      skip: Number(page - 1) * Number(limit),
      take: Number(limit),
    })

    const studentHeader: ExcelColumn[] = [
      { label: '课程ID', value: 'course_id' },
      { label: '课程名称', value: 'name' },
      { label: '课程链接', value: 'link' },
      { label: '学分', value: 'score' },
      { label: '学时', value: 'hour' },
      { label: '周次', value: 'week_num' },
      { label: '授课时间', value: 'course_time' },
      { label: '课程领域', value: 'domain' },
      { label: '课程性质', value: 'prop' },
      { label: '课程类型', value: 'type' },
      { label: '授课地址', value: 'address' },
      { label: '限选人数', value: 'target_num' },
    ]
    const handleData = result.map(course => {
      return {
        course_id: course.course_id,
        name: course.name,
        link: course.link,
        score: course.score,
        hour: course.hour,
        week_num: course.week_num,
        course_time: course.course_time,
        domain: course.domain,
        prop: course.prop,
        type: course.type,
        address: course.address,
        target_num: course.target_num,

      }
    })

    const buffer = await exportExcel(handleData, studentHeader)
    return Buffer.from(buffer);
  }
)

/**
 * 新增课程数据
 */
export const create = Api(
  Post(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (data) => {
    const {
      course_id, name, link, score, hour, week_num, course_time, domain, prop, type, address, target_num,
      major_limits, grade_limits_exhibit, grade_limits_first, grade_limits_second, grade_limits_third,
      term_id, teachers, priority
    } = data

    // 专业限制
    const majorLimits = major_limits.map(m => {
      return { major_id: m }
    })
    // 授课教师
    const teacherIds = teachers.map(t => {
      return { teacher_id: t }
    })
    // 阶段限制
    const gradeLimits = []
    grade_limits_exhibit.forEach(g => {
      gradeLimits.push({ stage: 0, grade: g })
    })
    grade_limits_first.forEach(g => {
      gradeLimits.push({ stage: 1, grade: g })
    })
    grade_limits_second.forEach(g => {
      gradeLimits.push({ stage: 2, grade: g })
    })
    grade_limits_third.forEach(g => {
      gradeLimits.push({ stage: 3, grade: g })
    })

    const newCourse = await prisma.course.create({
      data: {
        term_id,
        course_id, name, link, score, hour, week_num, course_time, domain, prop, type, address, target_num, priority,

        majorLimit: {
          createMany: {
            data: majorLimits
          }
        },
        CourseTeachers: {
          createMany: {
            data: teacherIds
          }
        },
        stageLimit: {
          createMany: {
            data: gradeLimits
          }
        }

      }
    })
    return successRsp(newCourse)
  }
)


/**更新课程数据 */
export const update = Api(
  Put(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (data) => {
    const {
      course_id, name, link, score, hour, week_num, course_time, domain, prop, type, address, target_num,
      major_limits, grade_limits_exhibit, grade_limits_first, grade_limits_second, grade_limits_third,
      term_id, id, majorLimit, stageLimit, CourseTeachers, teachers, priority
    } = data

    // 专业限制
    // 对比原来的专业 limit
    const { removedIds: removedMajorIds, addedIds: addedMajorIds } = handleMajorLimit(majorLimit, major_limits)

    // 对比原来的教师 
    const { removedIds: removedTeachers, addedIds: addTeachers } = handleTeachers(CourseTeachers, teachers)
    // return successRsp({ removedTeachers, addTeachers, oriMajors: CourseTeachers, newMajors: teachers })

    // 阶段限制
    const gradeLimits = []
    const { removedIds: removedIds, addedIds } = handleStageLimit(stageLimit, { grade_limits_exhibit, grade_limits_first, grade_limits_second, grade_limits_third })
    // return {removedIds, addedIds, oldData: stageLimit, newData: {grade_limits_exhibit, grade_limits_first, grade_limits_second, grade_limits_third} }
    const newCourse = await prisma.course.update({
      data: {
        term_id,
        course_id, name, link, score, hour, week_num, course_time, domain, prop, type, address, target_num, priority,
        majorLimit: {
          deleteMany: removedMajorIds.map(m => { return { id: m } }),
          createMany: {
            data: addedMajorIds.map(m => { return { major_id: m } })
          }
        },
        stageLimit: {
          deleteMany: removedIds.map(m => { return { id: m } }),
          createMany: {
            data: addedIds
          }
        },
        CourseTeachers: {
          deleteMany: removedTeachers.map(m => { return { id: m } }),
          createMany: {
            data: addTeachers.map(t => { return { teacher_id: t } })
          }
        }
      },
      where: { id }
    })
    return successRsp({})
  }
)

/**
 * 根据 id 删除课程
 *  */
export const remove = Api(
  Delete(),
  Query<{ id: string }>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    const { query: { id } } = useContext()
    if (!id) return failRsp('参数id缺失')
    // 删除教师关联数据
    const teacherLimit = await prisma.courseTeachers.deleteMany({ where: { course_id: +id } })
    // 删除专业限制\年级限制
    const majorLimits = await prisma.courseMaojrLimit.deleteMany({ where: { course_id: +id } })
    const stageLimits = await prisma.stageLimit.deleteMany({ where: { course_id: +id } })
    // 删除课程
    const course = await prisma.course.delete({
      where: { id: +id },
    })
    return successRsp(course)
  }
)

/**
 * 根据课程 id \ 教师 id 获取课程成员
 */
export const member = Api(
  Get(),
  Query<{ page: string, limit: string, teacher_id: string, course_id: string }>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    const ctx = useContext()
    const { teacher_id, course_id, page, limit } = ctx.query
    const course = await prisma.course.findUnique({
      where: {
        id: +course_id
      },
      include: {
        CourseTeachers: {
          where: {
            teacher_id: +teacher_id
          }
        }
      }
    })
    if (course.CourseTeachers.length === 0) {
      return failRsp('您不是该课程的授课教师')
    }
    const res = await prisma.selection.findMany({
      where: {
        course_id: +course_id,
        status: 1,
      },
      include: {
        student: {
          select: {
            name: true, sex: true, is_delay: true, stu_id: true,
            class: { select: { name: true } }
          }
        },
      },
      skip: Number(page - 1) * Number(limit),
      take: Number(limit),
    })
    const total = await prisma.selection.count({
      where: {
        course_id: +course_id,
        status: 1
      }
    })
    return successRsp({
      list: res,
      total
    })
  }
)

/**
 * 根据课程 id \ 教师 id 获取课程信息
 */
export const detail = Api(
  Get(),
  Query<{ teacher_id: string, course_id: string }>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    const ctx = useContext()
    const { teacher_id, course_id, page, limit } = ctx.query
    // 课程归属校验
    const course = await prisma.course.findUnique({
      where: {
        id: +course_id
      },
      include: {
        CourseTeachers: {
          where: {
            teacher_id: +teacher_id
          }
        },
        selection_count: {}
      }
    })
    if (course.CourseTeachers.length === 0) {
      return failRsp('您不是该课程的授课教师')
    } else {
      return successRsp(course)
    }
  }
)

/**
 * 下载课程数据导入模板
 */
export const download = Api(
  Post(),
  ContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  async () => {
    return Buffer.from(fs.readFileSync('./import-template/课程信息导入模版.xlsx'))
  }
)