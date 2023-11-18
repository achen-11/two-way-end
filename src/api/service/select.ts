import { Api, Get, Headers, Middleware, Post, Query, useContext } from "@midwayjs/hooks";
import { jwtMiddleWare } from "../middle/jwt";
import { prisma } from "../utils/prisma";
import { FindCourseOption } from "@/utils/types";
import { failRsp, successRsp } from "../utils/utils";
import { getStuSelectedNum, validateHistorySelected, validateTrem } from "../utils/select";


// 获取当前选课信息
const getCurTermInfo = async () => {
  return await prisma.term.findFirst({
    where: {
      status: true
    }
  })
}

/**
 * 分页获取展示阶段课程
 */
export const course = Api(
  Get(),
  Query<{ page: string, limit: string, option?: string }>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    // 分页信息
    let { page = 1, limit = 10, option = '{}' } = useContext().query
    // 学生信息
    option = JSON.parse(option)
    const { major_id, academic_end, enroll_year, stage, student_id } = option as FindCourseOption
    if (major_id === null || academic_end === null || enroll_year === null || stage === null) {
      return failRsp('参数缺失, 请刷新或退出登录后重试')
    }
    // 计算年级 Grade
    const grade = academic_end - enroll_year
    try {
      const data = await prisma.course.findMany({
        where: {
          NOT: {
            // 两个限制满足其一 (NOT需要用OR)
            OR: [
              // 阶段限制中不能包含该 年级 和 阶段 
              { stageLimit: { some: { AND: [{ stage: stage }, { grade: grade }] } }, },
              // 专业限制中不能包含该专业
              { majorLimit: { some: { major_id: major_id } } }
            ]
          },
          // term 限制 - 当前选课
          term: { status: true },
        },
        include: {
          StarCount: {}, // 收藏人数
          Star: { where: { student_id: student_id }, }, // 是否有收藏记录
          Selection: {
            where: {
              student_id,
              OR: [
                { stage: { lt: stage }, status: 1 },
                { stage: { equals: stage } }
              ]
            }
          }, // 是否有选课记录
          selection_count: {},
          CourseTeachers: { select: { teacher: { select: { name: true } } } } // 课程教师
        },
        skip: Number(page - 1) * Number(limit),
        take: Number(limit),
      })
      const total = await prisma.course.count({
        where: {
          NOT: {
            // 阶段限制中不能包含该 年级 和 阶段 
            stageLimit: { some: { AND: [{ stage: stage }, { grade: grade }] } },
            // 专业限制中不能包含该专业
            majorLimit: { some: { major_id: major_id } }
          },
          // term 限制 - 当前选课
          term: { status: true },
        }
      })
      return successRsp({
        list: data,
        total
      })
    } catch (e) {
      return failRsp(e.message, 500)
    }
  }
)

/**
 * 收藏课程
 */
export const star = Api(
  Post(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (course_id: number, student_id: number) => {
    const res = await prisma.star.create({
      data: {
        course_id,
        student_id
      }
    })
    // 更新计数 +1
    await prisma.starCount.upsert({
      create: {
        course_id: course_id,
        num: 1,
      },
      where: {
        course_id: course_id,
      },
      update: {
        num: {
          increment: 1
        }
      }
    })
    return successRsp({})
  }

)

/**
 * 取消收藏
 */
export const unstar = Api(
  Post(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (course_id: number, student_id: number) => {
    const res = await prisma.star.deleteMany({
      where: {
        student_id: student_id,
        course_id: course_id
      }
    })
    // 更新计数 -1
    await prisma.starCount.upsert({
      create: {
        course_id: course_id,
        num: 0,
      },
      where: {
        course_id: course_id,
      },
      update: {
        num: {
          decrement: 1
        }
      }
    })
    return successRsp({})
  }
)

/**
 * 选课
 */
export const select = Api(
  Post(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (course_id: number, student_id: number, stage: number, will_num?: number, cause?: string) => {
    // 获取当前选课信息
    const termInfo = await getCurTermInfo()
    // 获取学生数据
    const stuInfo = await prisma.student.findUnique({
      where: {
        id: student_id,
      },
      select: {
        id: true,
        is_delay: true, // 是否延毕
        type: true, // 专升本 or 本科生
        class: {
          select: {
            enroll_year: true,
            major_id: true, // 专业限制
          }
        },
        Selection: {
          where: {
            student_id,
          },
          include: {
            course: {
              select: { course_id: true }
            }
          }
        }
      }
    })
    const courseInfo = await prisma.course.findFirst({
      where: { id: course_id },
      select: {
        course_id: true,
        majorLimit: { select: { major_id: true, } },
        stageLimit: { select: { stage: true, grade: true } },
      }
    })
    const majorLimtIds = courseInfo.majorLimit.map(item => item.major_id)

    // 
    // 1. 校验选课时间 (保险非正当手段-api)
    const termValidRes = validateTrem(termInfo, stage)
    if (termValidRes !== true) {
      return failRsp(termValidRes)
    }
    // 2. 校验学生专业
    if (majorLimtIds.includes(stuInfo.class.major_id)) {
      return failRsp('专业限制')
    }
    // 3. 校验学生年级
    const grade = termInfo.academic_end - stuInfo.class.enroll_year
    if (courseInfo.stageLimit.find(item => item.stage === stage && item.grade === grade)) {
      return failRsp('阶段-年级限制')
    }

    // 4. 校验学生选课数量
    const selected_course_num = getStuSelectedNum(stuInfo.Selection, termInfo, stage)
    // 本科生 && 大一大二 限制两门课程
    if (stuInfo.type === 0 && [1, 2].includes(grade) && selected_course_num >= 2) {
      return failRsp('选课数量已达上限')
    }
    // 5. 校验历史选课
    const historySelectedValidate = validateHistorySelected(stuInfo.Selection, courseInfo.course_id)
    if (!historySelectedValidate) {
      return failRsp('您已修读过该课程')
    }
    // 6. 校验人数限制 (第三轮)
    // const selected_person_num = getSelectedNum()

    // 校验通过 写入
    const res = await prisma.selection.create({
      data: {
        student_id: student_id,
        course_id: course_id,
        stage,
        status: 0,
        will_num: will_num || 0,
        cause: cause || '',
        term_id: termInfo.id
      }
    })

    // 更新选课计数
    let createContent
    let updateContent
    if (stage === 1) {
      createContent = { course_id: course_id, first_all_num: 1 }
      updateContent = { first_all_num: { increment: 1 }, }
    } else if (stage === 2) {
      createContent = { course_id: course_id, second_all_num: 1 }
      updateContent = { second_all_num: { increment: 1 }, }
    } else if (stage === 3) {
      createContent = { course_id: course_id, third_all_num: 1 }
      updateContent = { third_all_num: { increment: 1 }, }
    }
    await prisma.selectionCount.upsert({
      create: createContent,
      update: updateContent,
      where: {
        course_id: course_id
      }
    })
    return successRsp(res)
  }
)

/**
 * 取消选课
 */
export const unselect = Api(
  Post(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (course_id: number, student_id: number, stage: number, status: number) => {
    // 删除选课记录
    const res = await prisma.selection.deleteMany({
      where: {
        course_id,
        student_id,
        stage
      }
    })
    // 更新选课计数
    let updateContent
    if (stage === 1) {
      updateContent = { first_all_num: { decrement: 1 } }
      if (status === 1) updateContent.first_success_num = { decrement: 1 }
    } else if (stage === 2) {
      updateContent = { second_all_num: { decrement: 1 } }
      if (status === 1) updateContent.second_success_num = { decrement: 1 }
    } else if (stage === 3) {
      updateContent = { third_all_num: { decrement: 1 } }
      if (status === 1) updateContent.third_success_num = { decrement: 1 }
    }
    await prisma.selectionCount.update({
      where: {
        course_id,
      },
      data: updateContent
    })
    return successRsp(res, "取消成功")
  }
)
