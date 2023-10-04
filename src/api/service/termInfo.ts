import { Api, Get, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '../prisma';

export const getCurTermInfo = Api(
  Get('/api/termInfo/cur'), // Http Path: /api/hello,
  async () => {
    return await prisma.term.findFirst({
      where: {
        status: true
      }
    })
  }
);

export const getHistory = Api(
  Get('/api/termInfo/history'),
  Query<{page: string, limit: string}>,
  async () => {
    const ctx = useContext()
    const {page=1, limit=10} = ctx.query
    return await prisma.term.findMany({
      where: {
        status: true
      },
      skip: (page - 1) * limit, // 要跳过的记录数
      take: limit, // 要获取的记录数
    })
  }
);