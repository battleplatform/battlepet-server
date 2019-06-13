/**
 * @File   : unit.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/13/2019, 3:03:54 PM
 */
import { TeamType } from './battle';
import { Pet } from '../entity';

export class Unit {
    private _health: number;
    private _attack: number;
    private _speed: number;
    private _team: TeamType;
    private _entityId: number;

    constructor(pet: Pet, team: TeamType, entityId: number) {
        this._health = pet.health;
        this._attack = pet.attack;
        this._speed = pet.speed;
        this._team = team;
        this._entityId = entityId;
    }

    get health() {
        return this._health;
    }

    set health(val: number) {
        this._health = val;
    }

    get attack() {
        return this._attack;
    }

    get speed() {
        return this._speed;
    }

    get team() {
        return this._team;
    }

    get entityId() {
        return this._entityId;
    }

    isAlive() {
        return this._health > 0;
    }
}
