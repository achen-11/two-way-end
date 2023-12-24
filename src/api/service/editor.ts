import { Api, ContentType, Delete, Get, Headers, Middleware, Post, Put, Query, useContext } from '@midwayjs/hooks';
import {
  Upload,
  useFields,
  useFiles,
} from '@midwayjs/hooks-upload';
import { prisma } from '@/api/utils/prisma';
import { exportExcel, failRsp, successRsp } from '@/api/utils/utils';
import { jwtMiddleWare } from '@/api/middle/jwt';
import Excel from 'exceljs'
import { validateClass, validateCourse, validateStudent } from '../utils/upload';
import md5 from 'md5';
import * as fs from 'fs';

export const upload = Api(
  Upload('/upload/editor'),
  async () => {
    const files = useFiles()
    console.log(files);
    const file = files["wangeditor-uploaded-image"][0]

    const folderPath = './files/editor';

    // 判断文件夹是否存在
    if (!fs.existsSync(folderPath)) {
      // 如果不存在，创建文件夹
      fs.mkdirSync(folderPath, { recursive: true }); // recursive: true 表示递归创建多层文件夹
      console.log('Folder created successfully.');
    } else {
      console.log('Folder already exists.');
    }

    // 使用 fs.createReadStream 和 fs.createWriteStream 进行文件复制
    try {
      const readStream = fs.createReadStream(file.data);
      const writeStream = fs.createWriteStream('./files/editor/' + file.filename);

      // 执行文件复制
      readStream.pipe(writeStream);
      return {
        "errno": 0, // 注意：值是数字，不能是字符串
        "data": {
          "url": '/files/editor/' + file.filename, // 图片 src ，必须
          // "alt": "yyy", // 图片描述文字，非必须
          // "href": "zzz" // 图片的链接，非必须
        }
      }
    } catch (err) {
      return {
        "errno": 1, // 只要不等于 0 就行
        "message": err.message
      }

    }
  }
)