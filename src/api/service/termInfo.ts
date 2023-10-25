import { Api, Delete, Get, Headers, Middleware, Post, Put, Query, useContext } from '@midwayjs/hooks';
import { prisma } from '../utils/prisma';
import { failRsp, successRsp } from '../utils/utils';
import { jwtMiddleWare } from '../middle/jwt';
import { TermInfo } from '@/utils/types';
import dayjs from 'dayjs';

/**获取当前选课信息
 * return termInfo
 */
export const getCurTermInfo = Api(
  Get('/termInfo/cur'), // Http Path: /api/hello,
  async () => {
    const data = await prisma.term.findFirst({
      where: {
        status: true
      }
    })
    return successRsp(data)
  }
);

/**获取历史选课信息
 * return termInfo[]
 */
export const getHistoryTermInfo = Api(
  Get('/termInfo/history'),
  Query<{ page: string, limit: string }>(),
  async () => {
    const ctx = useContext()
    const { page = 1, limit = 10 } = ctx.query
    const data = await prisma.term.findMany({
      where: {
        status: false
      },
      skip: (Number(page) - 1) * Number(limit), // 要跳过的记录数
      take: +limit, // 要获取的记录数
    })
    const total = await prisma.term.count({ where: { status: false }, })
    return successRsp({
      list: data,
      total, page, limit
    })
  }
);

/**添加选课信息
 * @param termInfo 选课信息
 */
export const addTremInfo = Api(
  Post('/termInfo'),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (formData: TermInfo) => {
    const { academic, semester, exhibitStage, firstStage, secondStage, thirdStage } = formData
    try {
      // 查询是否有正在进行的选课
      const isProcessing = await prisma.term.findFirst({
        where: {
          status: true
        }
      })
      if (isProcessing) {
        return failRsp('存在正在进行中的选课, 请先结束当前选课')
      }
      const res = await prisma.term.create({
        data: {
          academic_start: dayjs(academic[0]).get('year'),
          academic_end: dayjs(academic[1]).get('year'),
          semester,
          exhibit_stage_start: exhibitStage[0],
          exhibit_stage_end: exhibitStage[1],
          first_stage_start: firstStage[0],
          first_stage_end: firstStage[1],
          second_stage_start: secondStage[0],
          second_stage_end: secondStage[1],
          third_stage_start: thirdStage[0],
          third_stage_end: thirdStage[1],
          status: true
        }
      })
      return successRsp(res)
    } catch (e) {
      return failRsp(e)
    }
  }
)

/**
 * 更新选课信息
 * 
 */
export const updateTremInfo = Api(
  Put('/termInfo'),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (formData: TermInfo) => {
    const { academic, semester, exhibitStage, firstStage, secondStage, thirdStage, id } = formData
    try {
      const res = await prisma.term.update({
        where: { id: id },
        data: {
          academic_start: dayjs(academic[0]).get('year'),
          academic_end: dayjs(academic[1]).get('year'),
          semester,
          exhibit_stage_start: exhibitStage[0],
          exhibit_stage_end: exhibitStage[1],
          first_stage_start: firstStage[0],
          first_stage_end: firstStage[1],
          second_stage_start: secondStage[0],
          second_stage_end: secondStage[1],
          third_stage_start: thirdStage[0],
          third_stage_end: thirdStage[1],
        }
      })
      return successRsp(res)
    } catch (e) {
      return failRsp(e)
    }
  }
)

/**
 * 结束选课
 * @param termId 选课信息id
 */
export const endCurTermById = Api(
  Put('/termInfo/end'),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async (termId: number) => {
    try {
      const res = await prisma.term.update({
        where: {
          id: termId
        },
        data: {
          status: false
        }
      })
      return successRsp(res)
    } catch (e) {
      return failRsp(e)
    }
  }
)

/**
* 删除选课
*/
export const deleteTermById = Api(
  Delete('/termInfo'),
  Query<{ id: string }>(),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  async () => {
    const ctx = useContext()
    const id = ctx.query.id
    if (!id) return failRsp('参数id缺失')
    try {
      const res = await prisma.term.delete({
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