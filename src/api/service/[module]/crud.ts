import { Api, Delete, Get, Headers, Middleware, Params, Post, Put, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';


// 模块白名单
const modules = ['major', 'class', 'student', 'teacher', 'announce']


/**
 * 新增数据
 */
export const create = Api(
  Post(),
  Headers<{ Authorization: string }>(),
  Params<{ module: string }>(),
  Middleware(jwtMiddleWare),
  async (data) => {
    const ctx = useContext()
    const { module } = ctx.params
    if (!modules.includes(module)) {
      return failRsp('模块参数错误')
    }
    if (data.id) data.id = +data.id
    try {
      const res = await prisma[module].create({
        data: { ...data, }
      })
      return successRsp(res)
    } catch (e) {
      return failRsp(e.message)
    }
  }
)

/**
 * 分页查询数据
 */
export const list = Api(
  Get(),
  Headers<{ Authorization: string }>(),
  Params<{ module: string }>(),
  Query<{ page: string, limit: string, where?: string }>(),
  Middleware(jwtMiddleWare),
  async () => {
    try {
      let { query: { page = 1, limit = 10, where }, params: { module } } = useContext();
      if (!modules.includes(module)) {
        return failRsp('模块参数错误')
      }
      let _where = {}
      if (where) {
        where = JSON.parse(where)
        if (where?.name) _where['name'] = { contains: where.name }
        if (where?.teacher_id) _where['teacher_id'] = { contains: where.teacher_id }
      }
      // 分页获取数据
      const result = await prisma[module].findMany({
        where: _where,
        skip: Number(page - 1) * Number(limit),
        take: Number(limit),
      })
      const total = await prisma[module].count({ where: _where })
      return successRsp({ list: result, total, page, limit })
    } catch (e) {
      return failRsp(e.message)
    }
  }
)

/**
 * 根据 id 更新
 * 
 */
export const update = Api(
  Put(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  Params<{ module: string }>(),
  async (formData) => {
    const { params: { module } } = useContext();
    if (!modules.includes(module)) {
      return failRsp('模块参数错误')
    }
    try {
      const data = { ...formData }
      delete data.id
      const res = await prisma[module].update({
        where: { id: +formData.id },
        data
      })
      return successRsp(res)
    } catch (e) {
      return failRsp(e)
    }
  }
)

/**
 * 根据 id 删除
 */
export const remove = Api(
  Delete(),
  Query<{ id: string }>(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  Params<{ module: string }>(),
  async () => {
    const { params: { module }, query: { id } } = useContext()
    if (!modules.includes(module)) {
      return failRsp('模块参数错误')
    }
    if (!id) return failRsp('参数id缺失')
    try {
      const res = await prisma[module].delete({
        where: {
          id: +id
        }
      })
      return successRsp(res)
    } catch (e) {
      return failRsp(e)
    }
  }
)