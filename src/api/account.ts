import { Api, Get, Middleware, Post, Query, useContext, useInject, } from '@midwayjs/hooks';
import { prisma } from './prisma';
import { JwtService } from '@midwayjs/jwt';
import md5 from 'md5'
import {failRsp, successRsp} from './utils'
import { ROLE } from '../utils/types';
import { jwtMiddleWare } from './middle/jwt';


export const login = Api(
  Post('/account'),
  async (account: string, password: string, isRember=false) => {
    if (!account || !password) {
      return failRsp('参数缺失', 400, {account, password})
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
        studentProfile: true,
        teacerProfile: true
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
  Query<{token: string}>,
  async() => {
    const jwt = await useInject(JwtService)
    const ctx = useContext()
    const payload = jwt.decode(ctx.query.token)
    return successRsp(payload)
})