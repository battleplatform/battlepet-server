/**
 * @File   : melee.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/13/2019, 2:48:40 PM
 */

import * as utils from '../utils';

import { db } from '../db';
import { TeamType, Reply, ReplyType, Battle } from './battle';
import { User } from '../entity';
import { Unit } from './unit';
import { Allocator } from '../allocator';

export class BattleMelee implements Battle {
    private units: Unit[] = [];
    private reply: Reply[] = [];
    private entityId = new Allocator();

    constructor() {}

    setup(user: User, opposing: User) {
        this.reply.push({
            type: ReplyType.Start
        });

        for (const { petId } of user.team) {
            const entityId = this.entityId.alloc();

            this.units.push(new Unit(db.getPet(petId), TeamType.Friendly, entityId));

            this.reply.push({
                type: ReplyType.Unit,
                team: TeamType.Friendly,
                petId,
                entityId
            });
        }

        for (const { petId } of opposing.team) {
            const entityId = this.entityId.alloc();

            this.units.push(new Unit(db.getPet(petId), TeamType.Opposing, entityId));

            this.reply.push({
                type: ReplyType.Unit,
                team: TeamType.Opposing,
                petId,
                entityId
            });
        }

        this.units.sort((a, b) => a.speed - b.speed);
    }

    getReply() {
        return this.reply;
    }

    getWinner() {
        const alive = this.units.filter(unit => unit.isAlive());
        const friendly = alive.filter(unit => unit.team === TeamType.Friendly);
        const opposing = alive.filter(unit => unit.team === TeamType.Opposing);

        if (friendly.length === 0) {
            return TeamType.Opposing;
        }

        if (opposing.length === 0) {
            return TeamType.Friendly;
        }
        return TeamType.None;
    }

    getOpposingTeam(team: TeamType) {
        switch (team) {
            case TeamType.Friendly:
                return TeamType.Opposing;
            case TeamType.Opposing:
                return TeamType.Friendly;
            default:
                return TeamType.None;
        }
    }

    getTarget(unit: Unit) {
        const targetTeam = this.getOpposingTeam(unit.team);
        const targets = this.units.filter(u => u.isAlive() && u.team === targetTeam);

        if (targets.length === 0) {
            return;
        }

        const index = utils.random(0, targets.length);
        return targets[index];
    }

    attack(source: Unit, target: Unit) {
        target.health -= source.attack;

        this.reply.push({
            type: ReplyType.Damage,
            source: target.entityId,
            damage: source.attack
        });

        if (target.health <= 0) {
            this.reply.push({
                type: ReplyType.Death,
                source: target.entityId
            });
        }
    }

    async run() {
        const round = new Allocator();
        while (true) {
            const winner = this.getWinner();
            if (winner !== TeamType.None) {
                this.reply.push({
                    type: ReplyType.End,
                    winner
                });
                return;
            }

            this.reply.push({
                type: ReplyType.Round,
                round: round.alloc()
            });

            for (const unit of this.units) {
                if (!unit.isAlive()) {
                    continue;
                }

                const target = this.getTarget(unit);
                if (!target) {
                    break;
                }

                this.reply.push({
                    type: ReplyType.Attack,
                    source: unit.entityId,
                    target: target.entityId
                });

                this.attack(unit, target);
            }
        }
    }
}
