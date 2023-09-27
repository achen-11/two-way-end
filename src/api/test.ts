import { Api, Get, Middleware, Post, Query, useContext, useInject, } from '@midwayjs/hooks';
import { prisma } from './prisma';
import { JwtService } from '@midwayjs/jwt';
import md5 from 'md5'
import {failRsp, successRsp} from './utils'
import { jwtMiddleWare } from './middle/jwt';

export const login = Api(
  Get('/test'),
  Middleware(jwtMiddleWare),
  async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcl9pZCI6ImFkbWluIiwibmFtZSI6Iui2hee6p-euoeeQhuWRmCIsImNyZWF0ZWRUaW1lIjoiMjAyMy0wOS0yNlQwOTo1Nzo1Mi4wMDBaIiwidXBkYXRlZFRpbWUiOiIyMDIzLTA5LTI2VDA5OjU3OjU0LjAwMFoiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2OTU3MzIwODAsImV4cCI6MTY5NjMzNjg4MH0.bg1zDNIPlueaDZwSiVMBAozXs_aby5dMlUUo57D4Ueg'
    const jwt = await useInject(JwtService)
    const res = jwt.decode(token)
    return successRsp(res)
  }
)
