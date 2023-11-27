import { Api, Get, Headers, Middleware, Post, Query, useContext } from "@midwayjs/hooks";
import { jwtMiddleWare } from "../middle/jwt";
import { prisma } from "../utils/prisma";
import { FindCourseOption } from "@/api/utils/types";
import { failRsp, successRsp } from "../utils/utils";


// 根据 term 获取学生选课信息
export const all = Api(
  Get(),
  Query<{term_id: string, student_id: string}>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    const ctx = useContext()
    const { term_id, student_id } = ctx.query
    const res = await prisma.selection.findMany({
      where: {
        student_id: +student_id,
        term_id: +term_id,
      },
      include: {
        course: {
          include: {
            CourseTeachers: {
              include: {
                teacher: { select: {name: true} }
              }
            }
          }
        }
      }
    })
    return successRsp(res)
  })