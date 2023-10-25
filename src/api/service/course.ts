import { Api, ContentType, Delete, Get, Headers, Middleware, Post, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { exportExcel, failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';
import { ExcelColumn } from '@/utils/types';

/**
 * 根据 query\page 分页查询课程数据
 */
export const list = Api(
  Get(),
  Middleware([jwtMiddleWare]),
  Headers<{ Authorization: string }>(),
  Query<{ page: string, limit: string, option?: string }>(),
  async () => {
    let { page = 1, limit = 10, option = '{}' } = useContext().query
    try {
      // 处理 option
      let where = {}
      const keys = ['term_id', 'course_id', 'name', 'domain', 'type']
      option = JSON.parse(option)
      Object.keys(option).forEach((key) => {
        if (keys.includes(key) && option[key] !== '') {
          if (key === 'term_id') {
            where[key] = option[key]
          } else {
            where[key] = { contains: option[key] }
          }
        }
      })
      const res = await prisma.course.findMany({
        where,
        skip: Number(page - 1) * Number(limit),
        take: Number(limit)
      })
      const total = await prisma.course.count({ where })
      return successRsp({
        list: res,
        total,
        where
      })
    } catch (e) {
      return failRsp(e.message)
    }
  }
)

/**
 * 根据 query导出课程数据
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
    const keys = ['term_id', 'course_id', 'name', 'domain', 'type']
    Object.keys(option).forEach((key) => {
      if (keys.includes(key) && option[key] !== '') {
        if (key === 'term_id') {
          where[key] = option[key]
        } else {
          where[key] = { contains: option[key] }
        }
      }
    })
    const result = await prisma.course.findMany({
      where: where,
      skip: Number(page - 1) * Number(limit),
      take: Number(limit),
    })

    const studentHeader: ExcelColumn[] = [
      { label: '课程ID', value: 'course_id' },
      { label: '课程名称', value: 'name' },
      { label: '课程链接', value: 'link' },
      { label: '学分', value: 'score' },
      { label: '学时', value: 'hour' },
      { label: '周次', value: 'week_num' },
      { label: '授课时间', value: 'course_time' },
      { label: '课程领域', value: 'domain' },
      { label: '课程性质', value: 'prop' },
      { label: '课程类型', value: 'type' },
      { label: '授课地址', value: 'address' },
      { label: '限选人数', value: 'target_num' },
    ]
    const handleData = result.map(course => {
      return {
        course_id: course.course_id,
        name: course.name,
        link: course.link,
        score: course.score,
        hour: course.hour,
        week_num: course.week_num,
        course_time: course.course_time,
        domain: course.domain,
        prop: course.prop,
        type: course.type,
        address: course.address,
        target_num: course.target_num,

      }
    })

    const buffer = await exportExcel(handleData, studentHeader)
    return Buffer.from(buffer);
  }
)