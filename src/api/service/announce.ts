import { Api, Get, Headers, Middleware, Post, Put, Query, useContext } from "@midwayjs/hooks";
import { jwtMiddleWare } from "../middle/jwt";
import { prisma } from "../utils/prisma";
import { failRsp, successRsp } from "../utils/utils";
import { Prisma } from "@prisma/client";



/**
 * 根据 id 获取 announce 详情
 */
export const detail = Api(
  Get(),
  Query<{ id: string }>(),
  // Headers<{ Authorization: string }>(),
  // Middleware(jwtMiddleWare),
  async () => {
    const { query: { id } } = useContext()
    const res = await prisma.announce.findUnique({
      where: { id: +id },
    })
    return successRsp(res)
  }
)

/**
 * 分页获取通知公告
 */
export const list = Api(
  Get(),
  Query<{ page: string, limit: string, isPublish?: string }>(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async () => {
    const { query: { page, limit, isPublish=false } } = useContext()
    const whereContent: Prisma.AnnounceWhereInput = { id: { not: -1 } }
    if (isPublish === 'true') {
      whereContent.status = true
    }
    const res = await prisma.announce.findMany({
      where: whereContent,
      skip: Number(page - 1) * Number(limit),
      take: Number(limit),
    })
    const total = await prisma.announce.count({ where: whereContent })
    return successRsp({
      list: res,
      total
    })
  }
)

/**
 * 根据 id 更新通知状态
*/
export const update = Api(
  Put(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (id: number, data) => {
    if (!id) return failRsp('参数 id 缺失')
    delete data.id
    try {
      if (id === -1) {
        const res = await prisma.announce.upsert({
          create: { id, ...data },
          update: {
            content: data.content,
            department: data.department,
            title: data.title,
          },
          where: {
            id: -1
          }
        })
        return successRsp(res)
      }
      const res = await prisma.announce.update({
        where: { id },
        data: { ...data }
      })
      return successRsp(res)
    } catch (e) {
      return failRsp(e.message)
    }
  }

)