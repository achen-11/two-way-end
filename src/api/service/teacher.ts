import { Api, Delete, Headers, Middleware, Post, Query, useContext, Get } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';

import md5 from 'md5';

/**创建教师信息 */
export const create = Api(
  Post(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (teacher_id: string, name: string) => {
    // 创建账号
    const account = await prisma.account.create({
      data: {
        user_name: teacher_id,
        password: md5('hxxy' + teacher_id)
      }
    })
    // 创建教师
    const teacher = await prisma.teacher.create({
      data: {
        teacher_id,
        name
      }
    })
    return successRsp('创建成功')
  }
)

/**删除教师信息 */
export const remove = Api(
  Delete(),
  Query<{ id: string }>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    const { query: { id } } = useContext()
    if (!id) return failRsp('参数id缺失')
    try {
      // 删除教师
      const res = await prisma.teacher.delete({ where: { id: +id } })
      // 删除 账号
      await prisma.account.delete({ where: { user_name: res.teacher_id } })
      return successRsp(res)
    } catch (e) {
      return failRsp(e.message)
    }
  }
)

/**
 * 获取教师授课课程
 */
export const course = Api(
  Get(),
  Query<{ teacher_id: string, term_id: string }>(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async () => {
    // 
    const ctx = useContext()
    const { teacher_id, term_id } = ctx.query
    const course = await prisma.course.findMany({
      where: {
        term_id: +term_id,
        CourseTeachers: {
          some: {
            teacher_id: +teacher_id,
          }
        }
      },
      include: {
        CourseTeachers: {
          include: {
            teacher: { select: { name: true } }
          }
        }
      }
    })
    return successRsp(course)
  }
)

