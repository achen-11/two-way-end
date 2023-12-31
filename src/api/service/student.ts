import { Api, ContentType, Delete, Get, Headers, Middleware, Params, Post, Put, Query, SetHeader, useContext } from '@midwayjs/hooks';
import { prisma } from '@/api/utils/prisma';
import { exportExcel, failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';
import { ExcelColumn } from '@/api/utils/types';
import md5 from 'md5'
import * as fs from 'fs'


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
            where[key] = { name: { contains: filterData[key] } }
          } else if (key === 'major') {
            if (!where['class']) where['class'] = {}
            where['class'].major = { name: { contains: filterData[key] } }
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
      // const end_res = result.map(r => {
      //   r.id_card = r.id_card.substring(0, 4) + '********' + r.id_card.substring(12)
      //   return r
      // })
      const total = await prisma.student.count({ where })
      return successRsp({ list: result, total, page, limit })
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


/**
 * 创建学生
 */
export const create = Api(
  Post(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (
    data: {
      stu_id: string,
      name: string,
      sex: number,
      id_card: string,
      class_id: number,
      is_delay: boolean,
      type: number
    }) => {
    const { stu_id, name, sex, id_card, class_id, is_delay, type } = data
    const isExist = await prisma.student.findFirst({
      where: { stu_id: stu_id }
    })
    if (isExist) {
      return failRsp('学号已存在, 请检查')
    }
    // 创建学生
    const student = await prisma.student.create({
      data: {
        account: {
          connectOrCreate: {
            where: { user_name: stu_id },
            create: {
              user_name: stu_id,
              password: md5(id_card.slice(12))
            }
          }
        },
        class: { connect: { id: class_id } },
        name, id_card, sex, is_delay, type
      }
    })
    return successRsp(student)
  }
)

/**
 * 更新学生
 */
export const update = Api(
  Put(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (
    data: {
      id: number,
      name: string,
      sex: number,
      id_card: string,
      class_id: number,
      is_delay: boolean,
      type: number
    }
  ) => {
    const { id, name, sex, id_card, class_id, is_delay, type } = data
    const res = await prisma.student.update({
      where: { id, },
      data: { name, sex, id_card, class_id, is_delay, type }
    })
    return successRsp(res)
  }
)

/**
 * 删除学生
 */
export const remove = Api(
  Delete(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (id: number) => {
    const stu = await prisma.student.findUnique({ where: { id } })

    // 查询收藏数据
    const starData = await prisma.star.findMany({
      where: { student_id: stu.id }
    })
    const star_course_ids = starData.map(s => s.course_id)
    // 减少对应的 star 数
    await prisma.starCount.updateMany({
      where: { course_id: { in: star_course_ids } },
      data: { num: { decrement: 1 } }
    })
    // 删除收藏数据
    await prisma.star.deleteMany({ where: { student_id: stu.id } })

    // 查询选课数据
    const selectData = await prisma.selection.findMany({
      where: { student_id: stu.id }
    })
    // 减少对应的 select 数
    for (let i = 0; i < selectData.length; i++) {
      const s = selectData[i];
      const updateContent = {}
      switch (s.stage) {
        case 1:
          updateContent['first_all_num'] = { decrement: 1 }
          if (s.status === 1) updateContent['first_success_num'] = { decrement: 1 }
          break
        case 2:
          updateContent['second_all_num'] = { decrement: 1 }
          if (s.status === 1) updateContent['second_success_num'] = { decrement: 1 }
          break
        case 3:
          updateContent['third_all_num'] = { decrement: 1 }
          if (s.status === 1) updateContent['third_success_num'] = { decrement: 1 }
          break
      }
      await prisma.selectionCount.update({
        where: { course_id: s.course_id },
        data: updateContent
      })
    }
    // 删除选课数据
    await prisma.selection.deleteMany({ where: { student_id: stu.id } })
    // 删除学生
    await prisma.student.delete({ where: { id } })
    // 删除账号
    await prisma.account.delete({ where: { user_name: stu.stu_id } })
    return successRsp('删除成功')
  }
)

/**
 * 下载课程数据导入模板
 */
export const download = Api(
  Post(),
  ContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  async () => {
    return Buffer.from(fs.readFileSync('./import-template/学生信息导入模板.xlsx'))
  }
)