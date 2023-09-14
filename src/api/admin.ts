import { Api, Get } from '@midwayjs/hooks';
import { prisma } from './prisma';

export const getAdminCount = Api(
  Get('/admin'), // Http Path: /api/hello,
  async () => {
    return await prisma.admin.count()
  }
);