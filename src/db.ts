/**
 * @File   : db.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/12/2019, 9:40:00 AM
 */

import 'reflect-metadata';
import * as typeorm from 'typeorm';
import { User, TeamItem, Pet } from './entity';
import { UserPet } from './entity';
import { PET_LIST, PET_DEFAULTS } from './petData';
import * as utils from './utils';

class DataBase {
    private conn: typeorm.Connection;
    private pets = new Map<number, Pet>();

    constructor() {}

    async init() {
        this.conn = await typeorm.createConnection({
            type: 'mysql',
            host: '192.168.104.78',
            port: 3306,
            username: 'root',
            password: 'root',
            database: 'battle_pet',
            synchronize: true,
            logging: false,
            entities: [User, TeamItem, UserPet, Pet]
        });

        await Promise.all(PET_LIST.map(pet => this.save(pet)));

        this.pets = new Map(PET_LIST.map(pet => [pet.petId, pet]));
    }

    async test() {
        for (let i = 1; i <= 100; ++i) {
            await this.getUser(i);
        }
    }

    async getUser(userId: number) {
        let [user] = await this.conn.getRepository(User).find({ where: { userId }, relations: ['pets', 'team'] });
        if (!user) {
            user = await this.newUser(userId);
        }
        return user;
    }

    async getRandomUser() {
        const user = await this.conn.getRepository(User).findOne({ order: { userId: 'DESC' } });
        if (!user) {
            return;
        }

        const id = utils.random(1, user.id);
        return this.conn.getRepository(User).findOne(id, { relations: ['team', 'pets'] });
    }

    async newUser(userId: number) {
        const user = new User();
        user.userId = userId;
        user.gold = 0;
        user.pets = PET_DEFAULTS.map(pet => {
            const userPet = new UserPet();
            userPet.user = user;
            userPet.petId = pet.petId;
            return userPet;
        });
        user.team = PET_DEFAULTS.map(pet => {
            const item = new TeamItem();
            item.user = user;
            item.petId = pet.petId;
            return item;
        });

        await this.conn.manager.save(user);
        await Promise.all(user.team.map(item => this.conn.manager.save(item)));
        await Promise.all(user.pets.map(pet => this.conn.manager.save(pet)));

        return user;
    }

    async setTeam(user: User, pets: Pet[]) {
        await Promise.all(user.team.map(item => this.conn.manager.remove(item)));

        user.team = pets.map(pet => {
            const item = new TeamItem();
            item.user = user;
            item.petId = pet.petId;
            return item;
        });

        await Promise.all(user.team.map(item => this.conn.manager.save(item)));
    }

    save(item: any) {
        return this.conn.manager.save(item);
    }

    getPet(petId: number) {
        return this.pets.get(petId) as Pet;
    }

    getPets() {
        return [...this.pets.values()];
    }
}

export const db = new DataBase();
