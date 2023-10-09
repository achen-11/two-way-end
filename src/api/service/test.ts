import { Api, Get, Middleware, Post, Query, useContext, useInject, } from '@midwayjs/hooks';
import { prisma } from '../utils/prisma';
import { JwtService } from '@midwayjs/jwt';
import md5 from 'md5'
import {failRsp, successRsp} from '../utils/utils'
import { jwtMiddleWare } from '../middle/jwt';
import { RedisService } from '@midwayjs/redis';
import dayjs from 'dayjs';

export const Test = Api(
  Get('/test'),
  async () => {
    const res = process.env
    // const redis = await useInject(RedisService)
    // await redis.set('token', token)

    return successRsp(res)
  }
)
