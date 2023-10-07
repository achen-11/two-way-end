import { Api, Delete, Get, Headers, Middleware, Post, Put, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '../utils/prisma';
import { failRsp, successRsp } from '../utils/utils';
import { jwtMiddleWare } from '../middle/jwt';
import { Major } from '@/utils/types';

export const getMajorByPage = Api(
  Get('/api/major'),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  Query<{ page: string,  limit: string}>(),
  async () => {
    const { query: {page=1, limit=10 }} = useContext();
    // 分页获取数据
    const result = await prisma.major.findMany({
      skip: Number(page - 1) * Number(limit),
      take: Number(limit),
    })
    const total = await prisma.major.count()
    return successRsp({ list: result, total, page, limit})
  }
)

export const addMajor = Api(
  Post('/api/major'),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (formData: Major) => {
    try {
      const isExist = await prisma.major.findUnique({
        where: {id: String(formData)}
      })
      if (isExist) {
        return failRsp('该专业ID已存在')
      }
      const result = await prisma.major.create({
        data: {
          id: formData.id + '',
          name: formData.name,
          college: formData.college,
        }
      })
      return successRsp(result)
    } catch(e) {
      return failRsp(e)
    }
  }
)
export  const updateMajor = Api(
  Put('/api/major'),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async (formData: Major) => {
    const res = await prisma.major.update({
      where: {id: String(formData.id)},
      data: {
        name: formData.name,
        college: formData.college,
      }
    })
    return successRsp(res)
  }
)

export const deleteMajorById = Api(
  Delete('/api/major'),
  Query<{id: string}>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  async () => {
    const ctx = useContext()
    const id = ctx.query.id
    if (!id) return failRsp('参数id缺失')
    try {
      const res = await prisma.major.delete({
        where: {
          id: id
        }
      })
      return successRsp(res)
    } catch (e) {
      return failRsp(e)
    }
  }
)