import { Api, Get, Headers, Middleware, Post, Query, useContext } from "@midwayjs/hooks";
import { jwtMiddleWare } from "../middle/jwt";
import { prisma } from "../utils/prisma";
import { FindCourseOption } from "@/utils/types";
import { failRsp, successRsp } from "../utils/utils";
import { getStuSelectedNum, validateHistorySelected, validateTrem } from "../utils/select";
import { Selection } from "@prisma/client";


// 获取当前选课信息
const getCurTermInfo = async () => {
  return await prisma.term.findFirst({
    where: {
      status: true
    }
  })
}

/**
 * 分页获取课程
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
    const {
      major_id, academic_end, enroll_year, stage, student_id, only_star,
      // filterData,
    } = option as FindCourseOption
    if (major_id === null || academic_end === null || enroll_year === null || stage === null) {
      return failRsp('参数缺失, 请刷新或退出登录后重试')
    }
    // 计算年级 Grade
    const grade = academic_end - enroll_year
    const whereContent = {
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
    }
    if (only_star) {
      whereContent['Star'] = {
        some: { student_id }
      }
    }
    // 添加 filter 查询条件
    const filterKeys = ['course_id', 'name', 'domain', 'type']
    filterKeys.forEach(key => {
      if (option[key]) {
        whereContent[key] = { contains: option[key] }
      }
    })
    try {
      const data = await prisma.course.findMany({
        where: whereContent,
        include: {
          StarCount: {}, // 收藏人数
          Star: { where: { student_id: student_id }, }, // 是否有收藏记录
          Selection: { // 该学生的该门课程的选课记录
            where: {
              student_id,
              OR: [
                { stage: { lt: stage }, status: 1 },
                { stage: { equals: stage } }
              ]
            }
          }, // 是否有选课记录
          selection_count: {}, //该课程的选课计数
          CourseTeachers: { select: { teacher: { select: { name: true } } } } // 课程教师
        },
        skip: Number(page - 1) * Number(limit),
        take: Number(limit),
      })
      const total = await prisma.course.count({
        where: whereContent
      })
      return successRsp({
        list: data,
        total,
        whereContent
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
              select: { course_id: true, week_num: true, course_time: true }
            }
          }
        }
      }
    })
    const courseInfo = await prisma.course.findFirst({
      where: { id: course_id },
      select: {
        target_num: true,
        course_id: true,
        week_num: true,
        course_time: true,
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
    // 6. 周次限制
    const allWeekNumTag = []
    stuInfo.Selection.forEach(s => {
      if (s.term_id === termInfo.id && s.status !== 2) {
        allWeekNumTag.push(s.course.week_num + s.course.course_time)
      }
    })
    if (allWeekNumTag.includes(courseInfo.week_num + courseInfo.course_time)) {
      return failRsp('授课时间冲突! 您有同一授课时间(周次+授课时间)的课程, 不能重复选择')
    }
    // 7. 校验人数限制 (第三轮)
    if (stage === 3) {
      // 最好加下缓存
      // 获取当前课程可选人数 = target - 全部成功选上的
      const successNum = await prisma.selection.count({
        where: {
          course_id,
          status: 1
        }
      })
      const availableNum = courseInfo.target_num - successNum
      if (availableNum <= 0) return failRsp('该课程选课人数已满, 请选择其他课程')
    }

    // 校验通过 写入
    const res = await prisma.selection.create({
      data: {
        student_id: student_id,
        course_id: course_id,
        stage,
        status: stage === 3 ? 1 : 0, // 第三阶段直接选上, 其他为待处理
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
      updateContent = { third_all_num: { increment: 1 }, third_success_num: { increment: 1 } }
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


/**
 * 获取反选学生列表
 */
export const student = Api(
  Get(),
  Query<{ page: string, limit: string, stage: string, course_id: string, teacher_id: string, option?: string }>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    const ctx = useContext()
    const { stage, course_id, page, limit, teacher_id, option = '{}' } = ctx.query
    // 校验课程归属
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
    const filterData = JSON.parse(option)
    let stuWhere = {}
    let AllWhere = {}
    const keys = ['name', 'stu_id', 'major', 'class', 'status']
    Object.keys(filterData).forEach((key) => {
      if (keys.includes(key)) {
        if (key === 'class') {
          stuWhere[key] = { name: { contains: filterData[key] } }
        } else if (key === 'major') {
          if (!stuWhere['class']) stuWhere['class'] = {}
          stuWhere['class'].major = { name: { contains: filterData[key] } }
        } else if (key === 'status' && filterData?.status !== null) {
          AllWhere['status'] = filterData['status']
        } else {
          stuWhere[key] = { contains: filterData[key] }
        }
      }
    })
    if (Object.keys(stuWhere).length > 0) {
      AllWhere['student'] = stuWhere
    }
    // 获取选课记录
    const res = await prisma.selection.findMany({
      where: {
        stage: +stage,
        course_id: +course_id,
        ...AllWhere
      },
      include: { student: { include: { class: { select: { name: true } } } } },
      skip: Number(page - 1) * Number(limit),
      take: Number(limit),
    })
    const wait_num = await prisma.selection.count({
      where: {
        stage: +stage, course_id: +course_id, status: 0
      }
    })
    const total = await prisma.selection.count({ where: { stage: +stage, course_id: +course_id, ...AllWhere } })
    return successRsp({ list: res, total, wait_num })
  }
)


/**
 * 教师反选
 */
export const reverse = Api(
  Post(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (course_id: number, selection_ids: { id: number, status: number }[], status: number, stage: number) => {
    // 校验
    const course = await prisma.course.findFirst({
      where: {
        id: course_id,
      },
      include: {
        Selection: {
          where: { status: 1 },
          select: { id: true }
        }
      }
    })
    const canSelectNum = course.target_num - course.Selection.length
    if (canSelectNum === 0 && status === 1) return failRsp('超出可选人数限制')

    const res = await prisma.selection.updateMany({
      where: {
        id: { in: selection_ids.map(item => item.id) }
      },
      data: {
        status
      }
    })
    if (status === 1) {
      // 同意
      let confirmIds = selection_ids.filter(i => i.status !== 1)
      let countUpdateContent
      if (stage === 1) {
        countUpdateContent = {
          first_success_num: { increment: confirmIds.length }
        }
      } else if (stage === 2) {
        countUpdateContent = {
          second_success_num: { increment: confirmIds.length }
        }
      }
      // 如果是同意, 需要更新 selection_count
      await prisma.selectionCount.updateMany({
        where: {
          course_id: course_id
        },
        data: countUpdateContent
      })
    } else if (status === 2) {
      // 拒绝
      const rejectIds = selection_ids.filter(i => i.status === 1)
      let countUpdateContent
      if (stage === 1) {
        countUpdateContent = {
          first_success_num: { decrement: rejectIds.length }
        }
      } else if (stage === 2) {
        countUpdateContent = {
          second_success_num: { decrement: rejectIds.length }
        }
      }
      // 原本同意的, 需要更新计数
      await prisma.selectionCount.updateMany({
        where: {
          course_id: course_id
        },
        data: countUpdateContent
      })
    }
    return successRsp(res, '反选成功')
  }
)


/**
 * 自动补选
 */
let autoLoading = false
export const auto = Api(
  Post(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (stage: number) => {
    if (autoLoading === true) {
      return failRsp('自动补选中, 请勿重复点击')
    }
    autoLoading = true
    // 获取所有课程
    const termInfo = await getCurTermInfo()
    const courseArr = await prisma.course.findMany({
      where: {
        term_id: termInfo.id
      },
      select: {
        target_num: true,
        id: true,
        Selection: {
          where: { stage: { lte: stage } }
        }
      }
    })
    const res = []
    for (let i = 0; i < courseArr.length; i++) {
      const course = courseArr[i];
      const target = course.target_num
      const successArr = course.Selection.filter(s => s.status === 1)
      const waitArr = course.Selection.filter(s => s.status === 0 && s.stage === stage)
      const handleNum = target - successArr.length
      // 根据 时间 \ 意向分 \ 理由字数排序
      waitArr.sort((a, b) => {
        // Weight for each field
        var timeWeight = 1;
        var scoreWeight = 1;
        var reasonWeight = 1;

        // 根据权重计算分数
        function calculateScore(item: Selection) {
          return (
            timeWeight * (1 / new Date(item.created_time).getTime()) +
            scoreWeight * item.will_num +
            reasonWeight * Math.min(item.cause.length, 300)
          );
        }

        // Compare scores for sorting
        var scoreA = calculateScore(a);
        var scoreB = calculateScore(b);

        return scoreB - scoreA;
      })
      const successIds = waitArr.slice(0, handleNum).map(i => i.id)
      // 同意
      await prisma.selection.updateMany({
        where: { id: { in: successIds } },
        data: { status: 1 }
      })
      // 同意的需要更新计数
      let updateContent
      if (stage === 1) {
        updateContent = { first_success_num: { increment: successIds.length } }
      } else if (stage === 2) {
        updateContent = { second_success_num: { increment: successIds.length } }
      }
      await prisma.selectionCount.updateMany({
        where: { course_id: course.id },
        data: updateContent
      })
      // 其他的需要拒绝
      const rejectIds = waitArr.slice(handleNum).map(i => i.id)
      await prisma.selection.updateMany({
        where: { id: { in: rejectIds } },
        data: { status: 2 }
      })
      res.push({ course_id: course.id, successIds, rejectIds })
    }
    // res.push(courseArr)
    autoLoading = false
    return successRsp(res, '操作中..')
  }
)