/**
 * @File   : routes.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/11/2019, 3:47:02 PM
 */

import * as Router from 'koa-router';

const router = new Router();

router.get('/login', ctx => {
    ctx.body = 'ok';
});

export const routers = router.routes();
export const methods = router.allowedMethods();

