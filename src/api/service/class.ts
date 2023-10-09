import { Api, Delete, Get, Headers, Middleware, Params, Post, Put, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';

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
        major: { select: { name: true, id: true } } }
    })
    const total = await prisma.class.count()
    return successRsp({ list: result, total, page, limit })
  }
)
