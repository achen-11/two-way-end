import { createConfiguration, hooks } from '@midwayjs/hooks';
import * as Koa from '@midwayjs/koa';
import * as jwt from '@midwayjs/jwt';
import * as redis from '@midwayjs/redis';
import logger from './middle/logger';
import errorHandle from './middle/errorHandle';
import * as upload from '@midwayjs/upload';
import { tmpdir } from 'os';
import { join } from 'path';
/**
 * setup midway server
 */
export default createConfiguration({
  imports: [
    Koa, jwt, upload,
    // redis,
    hooks({ middleware: [logger, errorHandle] })
  ],
  importConfigs: [{
    default: {
      keys: 'session_keys',
      // redis: {
      //   client: {
      //     port: 6379, // Redis port
      //     host: "127.0.0.1", // Redis host
      //     password: "123123",
      //     db: 0,
      //   },
      // },
      upload: {
        mode: 'file',
        tmpdir: join(tmpdir(), './upload-files'),
        whitelist: ['.xlsx', '.csv', '.jpg', '.jpeg', '.png', 'pdf', '.gif', '.svg', '.json', '.pdf', '.zip', '.gz', '.tgz', '.gzip', '.mp3', '.mp4', '.avi',]
      }
    },
  }],
});
