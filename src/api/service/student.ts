import { Api, Delete, Get, Headers, Middleware, Params, Post, Put, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';

export const list = Api(
  Get(),
  Query<{ page: string, limit: string, option?:string }>(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async () => {
    const { page, limit, option='{}' } = useContext().query
    try {
      const filterData = JSON.parse(option)
      console.log(filterData);
      
      let where = {}
      const keys = ['name', 'stu_id', 'major', 'class', 'is_delay']
      Object.keys(filterData).forEach((key)=> {
        if (keys.includes(key)) {
          if (key === 'class') {
            where[key] = {class: {name: {contains: filterData[key]}}}
          } else if (key === 'major') {
            where[key] = {major: {name: {contains: filterData[key]}}}
          } else {
            where[key] = {contains: filterData[key]}
          }
        }
      })
      const result = await prisma.student.findMany({
        where: where,
        skip: Number(page - 1) * Number(limit),
        take: Number(limit),
        include: {
          class: {
            include: {major: {
              select: {name: true}
            }},
          }
        }
      })
      const end_res = result.map(r=>{
        r.id_card = r.id_card.substring(0, 6) + '********' + r.id_card.substring(14)
        return r
      })
      const total = await prisma.student.count({where})
      return successRsp({ list: end_res, total, page, limit })
    } catch(e) {
      console.log('error', e.message);
      
      return failRsp(e.message)
    }
  }
)