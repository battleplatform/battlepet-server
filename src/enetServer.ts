import { promisify } from 'util';
const enet = require('enet');
import * as utils from './utils';

import { db } from './db';
import { User, UserPet } from './entity';
import { BattleMelee } from './battle';

const MINUTE = 1;
const WAGE_PRE_MINUTE = 1;
const WAGE_MAX = 500;

interface Peer {
    user: User;
    send(channel: any, packet: any, callback?: any): void;
    verify(val: any, error: number, message: string): void;
    on(message: string, callback: any): void;
}

function calcWage(last: number) {
    const gold = Math.floor(((utils.now() - last) / MINUTE) * WAGE_PRE_MINUTE);
    return Math.min(gold, WAGE_MAX);
}

function sendMessage(peer: Peer, msg: any) {
    const msgBuffer = Buffer.from(JSON.stringify(msg));
    const packet = new enet.Packet(msgBuffer, enet.PACKET_FLAG.RELIABLE);
    console.log(peer.send(0, packet));
}

async function onMessage(peer: Peer, packet: any) {
    const req = JSON.parse(packet.data().toString());
    let body;
    if (req.route === 'login') {
        peer.user = await db.getUser(req.data.userId);
        body = 'success';
    } else if (req.route === 'pets') {
        body = {
            pets: peer.user.pets.map(item => item.petId)
        };
    } else if (req.route === 'pet_buy') {
        const petId = Number.parseInt(req.data.id);
        peer.verify(petId, 500, 'Argument error');

        const pet = db.getPet(petId);
        peer.verify(pet, 500, 'Argument error');

        const user = peer.user;
        peer.verify(!user.hasPet(petId), 500, 'Pet exists');
        peer.verify(user.gold >= pet.price, 500, 'Gold not enough');

        const userPet = new UserPet();
        userPet.user = user;
        userPet.petId = pet.petId;

        user.pets.push(userPet);
        user.gold -= pet.price;

        await db.save(user);
        await db.save(userPet);

        body = {
            pets: user.pets.map(item => item.petId),
            gold: user.gold
        };
    } else if (req.route === 'pet_lottery') {
        const price = 150;
        const user = peer.user;
        peer.verify(user.gold >= price, 500, 'Gold not enough');

        const pets = db.getPets().filter(item => !user.hasPet(item.petId));
        peer.verify(pets.length > 0, 500, 'All have');

        const pet = pets[utils.random(0, pets.length - 1)];

        const userPet = new UserPet();
        userPet.user = user;
        userPet.petId = pet.petId;

        user.pets.push(userPet);
        user.gold -= price;

        await db.save(user);
        await db.save(userPet);

        body = {
            pets: user.pets.map(item => item.petId),
            gold: user.gold,
            petId: pet.petId
        };
    } else if (req.route === 'gold') {
        body = {
            gold: peer.user.gold
        };
    } else if (req.route === 'team') {
        body = {
            team: peer.user.team.map(item => item.petId)
        };
    } else if (req.route === 'set_team') {
        const user = peer.user;

        peer.verify(req.data.team, 500, 'Argument error');

        const pets = (req.data.team as string)
            .split(',')
            .map(item => Number.parseInt(item))
            .map(petId => db.getPet(petId))
            .filter(pet => pet);

        // peer.verify(pets.length === 3, 500, 'Argument error');

        for (const pet of pets) {
            peer.verify(user.hasPet(pet.petId), 500, 'Pet not exists');
        }

        await db.setTeam(user, pets);

        body = {
            team: user.team.map(item => item.petId)
        };
    } else if (req.route === 'look_wage') {
        const lastPickTime = peer.user.lastPickTime;
        body = {
            lastPickTime,
            wage: calcWage(lastPickTime)
        };
    } else if (req.route === 'wage') {
        const user = peer.user;
        const wage = calcWage(user.lastPickTime);
        if (wage > 0) {
            user.gold += wage;
            user.lastPickTime = utils.now();
            await db.save(user);
        }

        body = {
            lastPickTime: user.lastPickTime,
            wage: 0
        };
    } else if (req.route === 'battle') {
        const user = await db.getRandomUser();
        if (!user) {
            return;
        }

        const battle = new BattleMelee();
        battle.setup(peer.user, user);
        await battle.run();

        body = {
            battle: battle.getReply(),
            opposing: {}
        };
    }

    req.body = body;
    console.log(req);

    req.data = null;

    sendMessage(peer, req);
}

export async function init() {
    const host = await promisify(enet.createServer)({
        address: new enet.Address('127.0.0.1', 9528),
        peers: 1000,
        channels: 1,
        down: 0,
        up: 0
    });

    host.on('connect', (peer: Peer, _: any) => {
        peer.verify = (val: any, error: number, message: string) => {
            if (!val) {
                throw {
                    error,
                    message
                };
            }
        };
        peer.on('message', (packet: any, _: any) => {
            try {
                onMessage(peer, packet);
            } catch (error) {
                if (typeof error === 'object' && error.error) {
                    sendMessage(peer, error);
                } else {
                    throw error;
                }
            }
        });
    });

    return host.start();
}
