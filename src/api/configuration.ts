import { createConfiguration, hooks } from '@midwayjs/hooks';
import * as Koa from '@midwayjs/koa';
import * as jwt from '@midwayjs/jwt';
import logger from './middle/logger'
/**
 * setup midway server
 */
export default createConfiguration({
  imports: [Koa, jwt, hooks({
    middleware: [logger]
  })],
  importConfigs: [{ 
    default: { keys: 'session_keys' },
    jwt: {
      secret: process.env.JWT_KEY, // fs.readFileSync('xxxxx.key')
      expiresIn: '7d', // https://github.com/vercel/ms
    }
  }],
});
