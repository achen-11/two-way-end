import { Api, ContentType, Delete, Get, Headers, Middleware, Params, Post, Put, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';
import fs from 'fs'

/**
 * 分页查询数据
 */
export const list = Api(
  Get(),
  Headers<{ Authorization: string }>(),
  Query<{ page: string, limit: string }>(),
  Middleware(jwtMiddleWare),
  async () => {
    const { query: { page = 1, limit = 10 }, params: { module } } = useContext();

    // 分页获取数据
    const result = await prisma.class.findMany({
      skip: Number(page - 1) * Number(limit),
      take: Number(limit),
      include: {
        major: { select: { name: true, id: true } }
      }
    })
    const total = await prisma.class.count()
    return successRsp({ list: result, total, page, limit })
  }
)

/**
 * 根据专业获取班级
 */
export const findByMajor = Api(
  Get(),
  Query<{ major_id: string }>(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async () => {
    const ctx = useContext()
    const { query: { major_id } } = ctx

    const res = await prisma.class.findMany({
      where: {
        major_id: +major_id
      }
    })
    return successRsp(res)
  }
)

/**
 * 下载课程数据导入模板
 */
export const download = Api(
  Post(),
  ContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  async () => {
    return Buffer.from(fs.readFileSync('./import-template/班级信息导入模版.xlsx'))
  }
)