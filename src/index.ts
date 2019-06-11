/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/11/2019, 3:44:23 PM
 */

import * as Koa from 'koa';
import { routers, methods } from './routes';

const app = new Koa();

app.use(routers)
    .use(methods)
    .listen(9527);

