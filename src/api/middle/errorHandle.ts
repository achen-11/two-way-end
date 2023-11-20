import { Context } from '@midwayjs/koa';
import { useContext, useInject } from '@midwayjs/hooks';
import { failRsp } from '../utils/utils'

export default async (next: any) => {
  const ctx = useContext<Context>();
  try {
    await next()
  } catch (error) {
    return failRsp(error.message, 500, null)
  }
}