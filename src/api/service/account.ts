import { Api, Get, Headers, Middleware, Post, Query, useContext, useInject, } from '@midwayjs/hooks';
import { prisma } from '../utils/prisma';
import { JwtService } from '@midwayjs/jwt';
import md5 from 'md5'
import { failRsp, successRsp } from '../utils/utils'

import { jwtMiddleWare } from '../middle/jwt';

enum ROLE {
  /**管理员 */
  Admin = 'Admin',
  /**教师 */
  Teacher = 'teacher',
  /**学生 */
  Student = 'student'
}
export const login = Api(
  Post('/account'),
  async (account: string, password: string, isRember = false) => {
    if (!account || !password) {
      return failRsp('参数缺失', 400, { account, password })
    }
    // 密码加密
    const newPwd = md5(password)
    const accountInfo = await prisma.account.findFirst({
      where: {
        user_name: account,
        password: newPwd
      },
      include: {
        adminProfile: true,
        teacerProfile: true,
        studentProfile: {
          select: {
            name: true,
            sex: true,
            is_delay: true,
            stu_id: true,
            type: true,
            class: true,
            id: true
          },
        }
      }
    })
    // 验证通过
    if (accountInfo) {
      let userInfo = {}
      if (accountInfo?.adminProfile) {
        userInfo = {
          ...accountInfo.adminProfile,
          role: ROLE.Admin
        }
      } else if (accountInfo.studentProfile) {
        userInfo = {
          ...accountInfo.studentProfile,
          role: ROLE.Student
        }
      } else if (accountInfo.teacerProfile) {
        userInfo = {
          ...accountInfo.teacerProfile,
          role: ROLE.Teacher
        }

      }
      // 生成token
      const jwt = await useInject(JwtService)
      const token = await jwt.sign(userInfo, 'two-way', {
        expiresIn: '7d'
      })
      return successRsp({
        token,
        userInfo
      })
    } else {
      return failRsp('账号或密码错误')
    }
  }
)

export const getUserInfo = Api(
  Get('/account'),
  Headers<{ Authorization: string }>(),
  Middleware(jwtMiddleWare),
  Query<{ token: string }>(),
  async () => {
    const jwt = await useInject(JwtService)
    const ctx = useContext()
    const payload = jwt.decodeSync(ctx.query.token)
    return successRsp(payload)
  }
)


/**
 * 重置密码
 */
export const reset = Api(
  Post(),
  async (stu_id: string, id_card: string) => {
    // 校验stu_id & id_card 
    const studentInfo = await prisma.student.findFirst({
      where: { stu_id, id_card }
    })
    if (!studentInfo?.id) return failRsp('账号校验未通过, 请检查学号或身份证')

    // 校验通过
    const res = await prisma.account.update({
      where: {
        user_name: studentInfo.stu_id
      },
      data: {
        password: md5(studentInfo.id_card.slice(12))
      }
    })
    return successRsp('操作成功')
  }
)

/**
 * 修改密码
 */
export const change = Api(
  Post(),
  Middleware(jwtMiddleWare),
  Headers<{ Authorization: string }>(),
  async (stu_id, ori_pwd, new_pwd) =>{
    // 校验旧密码
    const account = await prisma.account.findFirst({
      where: {
        user_name: stu_id,
        password: md5(ori_pwd)
      }
    })
    if (!account) return failRsp('账号或密码错误')
    // 更新新密码
    await prisma.account.update({
      where: { user_name: stu_id },
      data: { password: md5(new_pwd) }
    })
    return successRsp({}, '操作成功')
  }
)