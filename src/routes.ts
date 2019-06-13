/**
 * @File   : routes.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/11/2019, 3:47:02 PM
 */

import * as Router from 'koa-router';
import * as utils from './utils';

import { db } from './db';
import { User, UserPet } from './entity';
import { BattleMelee } from './battle';

const MINUTE = 1;
const WAGE_PRE_MINUTE = 1;
const WAGE_MAX = 500;

interface State {
    user: User;
    body?: any;
    verify(val: any, error: number, message: string): void;
}

const router = new Router<State>();

function calcWage(last: number) {
    const gold = Math.floor(((utils.now() - last) / MINUTE) * WAGE_PRE_MINUTE);
    return Math.min(gold, WAGE_MAX);
}

router
    .use(async (ctx, next) => {
        ctx.state.verify = (val: any, error: number, message: string) => {
            if (!val) {
                throw {
                    error,
                    message
                };
            }
        };

        try {
            const userId = Number.parseInt(ctx.get('user'));
            ctx.state.verify(userId, 401, 'Access denied');

            ctx.state.user = await db.getUser(userId);
            ctx.state.verify(ctx.state.user, 401, 'Access denied');

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
    .get('/pets', ctx => {
        ctx.state.body = {
            pets: ctx.state.user.pets.map(item => item.petId)
        };
    })
    .get('/pet_buy', async ctx => {
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
            pets: user.pets.map(item => item.petId),
            gold: user.gold
        };
    })
    .get('/gold', ctx => {
        ctx.state.body = {
            gold: ctx.state.user.gold
        };
    })
    .get('/team', ctx => {
        ctx.state.body = {
            team: ctx.state.user.team.map(item => item.petId)
        };
    })
    .get('/set_team', async ctx => {
        const user = ctx.state.user;

        ctx.state.verify(ctx.query.team, 500, 'Argument error');

        const pets = (ctx.query.team as string)
            .split(',')
            .map(item => Number.parseInt(item))
            .map(petId => db.getPet(petId))
            .filter(pet => pet);

        ctx.state.verify(pets.length === 3, 500, 'Argument error');

        for (const pet of pets) {
            ctx.state.verify(user.hasPet(pet.petId), 500, 'Pet not exists');
        }

        await db.setTeam(user, pets);

        ctx.state.body = {
            team: user.team.map(item => item.petId)
        };
    })
    .get('/look_wage', ctx => {
        const lastPickTime = ctx.state.user.lastPickTime;
        ctx.state.body = {
            lastPickTime,
            wage: calcWage(lastPickTime)
        };
    })
    .get('/wage', async ctx => {
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
    .get('/battle', async ctx => {
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
    });

export const routers = router.routes();
export const methods = router.allowedMethods();
