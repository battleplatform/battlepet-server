/**
 * @File   : routes.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/11/2019, 3:47:02 PM
 */

import * as Base64 from 'crypto-js/enc-base64';
import * as koaBody from 'koa-body';
import * as Router from 'koa-router';
import * as RSA from 'node-rsa';

import { BattleMelee } from './battle';
import { db } from './db';
import { User, UserPet } from './entity';
import * as utils from './utils';

import C = require('crypto-js');

const MINUTE = 1;
const WAGE_PRE_MINUTE = 1;
const WAGE_MAX = 500;

interface State {
    user: User;
    body?: any;
    reqBody?: any;
    verify(val: any, error: number, message: string): void;
}

const router = new Router<State>();

// 测试KEY，请替换成实际使用的
const key = new RSA(
    '-----BEGIN PRIVATE KEY-----' +
    'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAOFLM8+cWfjWJrP6' +
    '3i0jiRtpc240U6wjyEV4Ji2XA8UpFsRMdsFLXRsy9Rs5YsW1GBlXcv3bgZD2itui' +
    'YSYnWdbJpI7yIFtkDKJZQ/k8kmH9v2QePUwzAbvXZsZ9hg92ORGms2nNT3DhQHNQ' +
    'wopSgdThz8Ztvhd4Er0s1M9ZAvhjAgMBAAECgYEAxwNLTUXsJGfn4Gzm/jC52MEZ' +
    '+mu2zgT90IAGGZeg+PUG63gwHyeXo4MsCVRz7/m8xAX/ykew+IEQwFt8Pdvc+rrs' +
    '5yml4gOBPfhpau5QaI75xNjnyH7UA3mbRCZeyZrvuKqtY/f8pCgzy3EBWnRpkcsq' +
    'eE6bsOQrD45mltr+0QECQQDynvhKEh+hD5xBpF/DIP8Fp6fizexHdA6+aZT/gLaF' +
    'A4XgZ9HEDDBhvNdadyYUNOLWhkxRHv6CkT5azfLXsJEhAkEA7begtbBCDXDf1+DR' +
    'h3j2S8zcv6+utYgcpjvxZqjbPi6UIWXLxI80PIwQ0uouHCUMjikBA6VX9vTbw9TZ' +
    '/IelAwJBAKI3W7baiz86mrTg3A4w/5GeWQexuurDVCBHo5F5U493nYk+oOe9ZpPS' +
    'mQIpa9JS0d+xB1GtsWlHBzPbQySnL0ECQA/btCjqvT1QTl6EbPXwp92eqQtQmQMb' +
    'NW4RiaUjlpyrVs5zkAho1T9EyMqJPNI71n6VVa/8k8WxyAdkZ7ZlBikCQEkNe1+s' +
    'AKnh+AFGCJ+6WAq1J2RuIgcA6bVL3ip7F2NHdE+N+tR9JqWw3JNCweWmAlzKIGs6' +
    'eKSVD5egzKaLXss=' +
    '-----END PRIVATE KEY-----'
);

function calcWage(last: number) {
    const gold = Math.floor(((utils.now() - last) / MINUTE) * WAGE_PRE_MINUTE);
    return Math.min(gold, WAGE_MAX);
}

router
    .use(koaBody())
    .use(async (ctx, next) => {
        try {
            ctx.state.verify = (val: any, error: number, message: string) => {
                if (!val) {
                    throw {
                        error,
                        message
                    };
                }
            };

            if (ctx.request.body && ctx.get('Access-Token')) {
                const token = ctx.get('Access-Token');
                if (!token) {
                    ctx.state.verify(0, 401, 'No Access-Token');
                }
                const data = Base64.parse(key.decrypt(token, 'base64')).toString(C.enc.Utf8);
                const keyPair = data.split('\n');
                const aesKey = Base64.parse(keyPair[0]);
                const iv = Base64.parse(keyPair[1]);

                const body = C.AES.decrypt(ctx.request.body, aesKey, {
                    iv,
                    mode: C.mode.CBC,
                    padding: C.pad.Pkcs7,
                    encoding: 'base64'
                }).toString(C.enc.Utf8);

                ctx.state.reqBody = body;
            }

            await next();

            if (ctx.state.body) {
                ctx.body = {
                    body: ctx.state.body
                };
            }
        } catch (error) {
            if (typeof error === 'object' && error.error) {
                ctx.body = error;
            } else {
                throw error;
            }
        }
    })
    .use(async (ctx, next) => {
        const userId = Number.parseInt(ctx.get('user'));
        ctx.state.verify(userId, 401, 'Access denied');

        ctx.state.user = await db.getUser(userId);
        ctx.state.verify(ctx.state.user, 401, 'Access denied');

        await next();
    })
    .get('/pets', (ctx) => {
        ctx.state.body = {
            pets: ctx.state.user.pets.map((item) => item.petId)
        };
    })
    .get('/pet_buy', async (ctx) => {
        const petId = Number.parseInt(ctx.query.id);
        ctx.state.verify(petId, 500, 'Argument error');

        const pet = db.getPet(petId);
        ctx.state.verify(pet, 500, 'Argument error');

        const user = ctx.state.user;
        ctx.state.verify(!user.hasPet(petId), 500, 'Pet exists');
        ctx.state.verify(user.gold >= pet.price, 500, 'Gold not enough');

        const userPet = new UserPet();
        userPet.user = user;
        userPet.petId = pet.petId;

        user.pets.push(userPet);
        user.gold -= pet.price;

        await db.save(user);
        await db.save(userPet);

        ctx.state.body = {
            pets: user.pets.map((item) => item.petId),
            gold: user.gold
        };
    })
    .get('/pet_lottery', async (ctx) => {
        const price = 150;
        const user = ctx.state.user;
        ctx.state.verify(user.gold >= price, 500, 'Gold not enough');

        const pets = db.getPets().filter((item) => !user.hasPet(item.petId));
        ctx.state.verify(pets.length > 0, 500, 'All have');

        const pet = pets[utils.random(0, pets.length - 1)];

        const userPet = new UserPet();
        userPet.user = user;
        userPet.petId = pet.petId;

        user.pets.push(userPet);
        user.gold -= price;

        await db.save(user);
        await db.save(userPet);

        ctx.state.body = {
            pets: user.pets.map((item) => item.petId),
            gold: user.gold,
            petId: pet.petId
        };
    })
    .get('/gold', (ctx) => {
        ctx.state.body = {
            gold: ctx.state.user.gold
        };
    })
    .get('/team', (ctx) => {
        ctx.state.body = {
            team: ctx.state.user.team.map((item) => item.petId)
        };
    })
    .get('/set_team', async (ctx) => {
        const user = ctx.state.user;

        ctx.state.verify(ctx.query.team, 500, 'Argument error');

        const pets = (ctx.query.team as string)
            .split(',')
            .map((item) => Number.parseInt(item))
            .map((petId) => db.getPet(petId))
            .filter((pet) => pet);

        // ctx.state.verify(pets.length === 3, 500, 'Argument error');

        for (const pet of pets) {
            ctx.state.verify(user.hasPet(pet.petId), 500, 'Pet not exists');
        }

        await db.setTeam(user, pets);

        ctx.state.body = {
            team: user.team.map((item) => item.petId)
        };
    })
    .get('/look_wage', (ctx) => {
        const lastPickTime = ctx.state.user.lastPickTime;
        ctx.state.body = {
            lastPickTime,
            wage: calcWage(lastPickTime)
        };
    })
    .get('/wage', async (ctx) => {
        const user = ctx.state.user;
        const wage = calcWage(user.lastPickTime);
        if (wage > 0) {
            user.gold += wage;
            user.lastPickTime = utils.now();
            await db.save(user);
        }

        ctx.state.body = {
            lastPickTime: user.lastPickTime,
            wage: 0
        };
    })
    .get('/battle', async (ctx) => {
        const user = await db.getRandomUser();
        if (!user) {
            return;
        }

        const battle = new BattleMelee();
        battle.setup(ctx.state.user, user);
        await battle.run();

        ctx.state.body = {
            battle: battle.getReply(),
            opposing: {}
        };
    })
    .post('/login', async (ctx) => {
        console.log(ctx.state.reqBody);
        console.log(ctx.request.get('Access-Token'));

        ctx.state.body = {
            success: true
        };
    })
    .get('/search', async (ctx) => {
        console.log(ctx.state.reqBody);
        console.log(ctx.request.headers);
        ctx.state.body = {
            success: true
        };
    });

export const routers = router.routes();
export const methods = router.allowedMethods();
