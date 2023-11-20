import { Context } from '@midwayjs/koa';
import { useContext, useInject } from '@midwayjs/hooks';
import { failRsp } from '../utils/utils'
import dayjs from 'dayjs';
import fs from 'fs'

export default async (next: any) => {
  const ctx = useContext<Context>();
  try {
    await next()
  } catch (error) {
    const path = `./logs/request-error/${dayjs().format('YYYY-MM-DD')}.log`
    const errorContent = 
`
${dayjs().format('YYYY-MM-DD HH:mm:ss')}
================ [${ctx.method}] ${ctx.url} ================
${error.message}
=================${'='.repeat(ctx.method.length + ctx.url.length + 3)}=================
`
    fs.writeFile(path, errorContent, { flag: 'a' }, (e)=>{
      console.log('write-error', error?.message);
      
    })
    return failRsp(error.message, 500, null)
  }
}