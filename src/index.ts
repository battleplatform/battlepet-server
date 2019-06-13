/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/11/2019, 3:44:23 PM
 */

import * as Koa from 'koa';
import { routers, methods } from './routes';
import { db } from './db';

async function main() {
    await db.init();
    await db.test();

    const app = new Koa();

    app.use(routers)
        .use(methods)
        .listen(9527);
}

main();
