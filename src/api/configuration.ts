import { createConfiguration, hooks } from '@midwayjs/hooks';
import * as Koa from '@midwayjs/koa';
import * as jwt from '@midwayjs/jwt';
/**
 * setup midway server
 */
export default createConfiguration({
  imports: [Koa, jwt, hooks({
  })],
  importConfigs: [{ 
    default: { keys: 'session_keys' },
    jwt: {
      secret: process.env.JWT_KEY, // fs.readFileSync('xxxxx.key')
      expiresIn: '7d', // https://github.com/vercel/ms
    }
  }],
});
