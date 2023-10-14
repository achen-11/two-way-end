import { Api, ContentType, Delete, Get, Headers, Middleware, Params, Post, Put, Query, SetHeader, useContext } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { exportExcel, failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';
import { ExcelColumn } from '@/utils/types';


/**
 * 根据 query\page 分页查询学生数据
 */
export const list = Api(
  Get(),
  Query<{ page: string, limit: string, option?: string }>(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async () => {
    const { page, limit, option = '{}' } = useContext().query
    try {
      const filterData = JSON.parse(option)

      let where = {}
      const keys = ['name', 'stu_id', 'major', 'class', 'is_delay']
      Object.keys(filterData).forEach((key) => {
        if (keys.includes(key)) {
          if (key === 'class') {
            where[key] = { class: { name: { contains: filterData[key] } } }
          } else if (key === 'major') {
            where[key] = { major: { name: { contains: filterData[key] } } }
          } else {
            where[key] = { contains: filterData[key] }
          }
        }
      })
      const result = await prisma.student.findMany({
        where: where,
        skip: Number(page - 1) * Number(limit),
        take: Number(limit),
        include: { class: { include: { major: { select: { name: true } } } } }
      })
      const end_res = result.map(r => {
        r.id_card = r.id_card.substring(0, 4) + '********' + r.id_card.substring(12)
        return r
      })
      const total = await prisma.student.count({ where })
      return successRsp({ list: end_res, total, page, limit })
    } catch (e) {
      console.log('error', e.message);

      return failRsp(e.message)
    }
  }
)

/**
 * 根据 query导出学生数据
 * 
 */
export const excel = Api(
  Post(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  ContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  async (page: number, limit: number, option: any) => {
    page = page ? page : 1
    limit = limit ? limit : 100000
    option = option ? option : {}
    // 处理 where
    let where = {}
    const keys = ['name', 'stu_id', 'major', 'class', 'is_delay']
    Object.keys(option).forEach((key) => {
      if (keys.includes(key)) {
        if (key === 'class') {
          where[key] = { class: { name: { contains: option[key] } } }
        } else if (key === 'major') {
          where[key] = { major: { name: { contains: option[key] } } }
        } else {
          where[key] = { contains: option[key] }
        }
      }
    })
    const result = await prisma.student.findMany({
      where: where,
      skip: Number(page - 1) * Number(limit),
      take: Number(limit),
      include: {
        class: { include: { major: { select: { name: true } } }, }
      }
    })

    const studentHeader: ExcelColumn[] = [
      { label: '姓名', value: 'name' },
      { label: '学号', value: 'stu_id' },
      { label: '性别', value: 'sex' },
      { label: '专业', value: 'major' },
      { label: '班级', value: 'class.name' },
      { label: '身份证', value: 'id_card' },
      { label: '是否延毕', value: 'is_delay' }
    ]
    const handleData = result.map(stu => {
      return {
        name: stu.name,
        stu_id: stu.stu_id,
        sex: stu.sex,
        major: stu.class.major.name,
        class: stu.class.name,
        id_card: stu.id_card,
        is_delay: stu.is_delay ? '是' : '否'
      }
    })

    const buffer = await exportExcel(handleData, studentHeader)
    return Buffer.from(buffer);

  }
)