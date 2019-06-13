/**
 * @File   : battle.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/13/2019, 2:48:50 PM
 */

import { User } from '../entity';

export enum TeamType {
    None,
    Friendly,
    Opposing
}

export enum ReplyType {
    Start = 'Start',
    Unit = 'Unit',
    Round = 'Round',
    Attack = 'Attack',
    Damage = 'Damage',
    Death = 'Death',
    End = 'End'
}

export interface ReplyStart {
    type: ReplyType.Start;
}

export interface ReplyUnit {
    type: ReplyType.Unit;
    entityId: number;
    petId: number;
    team: TeamType;
}

export interface ReplyRound {
    type: ReplyType.Round;
    round: number;
}

export interface ReplyAttack {
    type: ReplyType.Attack;
    source: number;
    target: number;
}

export interface ReplyDamage {
    type: ReplyType.Damage;
    source: number;
    damage: number;
}

export interface ReplyDeath {
    type: ReplyType.Death;
    source: number;
}

export interface ReplyEnd {
    type: ReplyType.End;
    winner: TeamType;
}

export type Reply = ReplyStart | ReplyUnit | ReplyRound | ReplyAttack | ReplyDamage | ReplyDeath | ReplyEnd;

export interface Battle {
    run(): Promise<void>;
    getReply(): Reply[];
    setup(user: User, opposing: User): void;
}
