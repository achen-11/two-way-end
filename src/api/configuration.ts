import { createConfiguration, hooks } from '@midwayjs/hooks';
import * as Koa from '@midwayjs/koa';
import * as jwt from '@midwayjs/jwt';
import * as redis from '@midwayjs/redis';
import logger from './middle/logger'
/**
 * setup midway server
 */
export default createConfiguration({
  imports: [Koa, jwt, redis, hooks({
    middleware: [logger]
  })],
  importConfigs: [{ 
    default: { 
      keys: 'session_keys',
      redis: {
        client: {
          port: 6379, // Redis port
          host: "127.0.0.1", // Redis host
          password: "123123",
          db: 0,
        },
      },
     },
  }],
});
