import { Api, Get, Headers, Middleware, Post, Query, useContext } from "@midwayjs/hooks";
import { jwtMiddleWare } from "../middle/jwt";
import { prisma } from "../utils/prisma";
import { FindCourseOption } from "@/utils/types";
import { failRsp, successRsp } from "../utils/utils";


// 获取当前选课信息

/**
 * 分页获取展示阶段课程
 */
export const exhibit = Api(
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
          StarCount: {
            select: { num: true }
          },
          Star: {
            where: {
              student_id: student_id
            },
          },
          CourseTeachers: {
            select: {
              teacher: {
                select: {name: true}
              }
            }
          }
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
  async (course_id: number, student_id:number) => {
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
  async (course_id: number, student_id: number) => {

  }
)

/**
 * 取消选课
 */
export const unselect = Api(
  Post(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (course_id: number, student_id: number) => {

  }
)