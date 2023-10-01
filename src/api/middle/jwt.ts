import { Context } from '@midwayjs/koa';
import { useContext, useInject } from '@midwayjs/hooks';
import { JwtService } from '@midwayjs/jwt';
import { failRsp } from '../utils'




export const jwtMiddleWare = async (next: any) => {
  const ctx = useContext<Context>();
  const jwt = await useInject(JwtService)

  // 判断是否有校验信息
  if (ctx.headers['Authorization']) {
    return failRsp('token缺失', 401, null)
  }

  // 校验token
  const parts = ctx.get('Authorization').trim().split('=')
  if (parts.length !== 2) {
    return failRsp('token缺失', 401, null)
  }

  const [scheme, token] = parts
  if(/^two_way_token$/i.test(scheme)) {
    try {
      await jwt.verify(token, "two-way", {
        ignoreExpiration: false
      })
      await next()
    }catch (error) {
      return failRsp('token过期, 请重新登录', 401, null)
    }
  }


  

}