/**
 * @File   : user.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/12/2019, 9:34:32 AM
 */

import { Entity, BaseEntity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TeamItem } from './teamItem';
import { UserPet } from './userPet';

@Entity('t_user')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ default: 0 })
    gold: number;

    @Column({ name: 'last_pick_time', default: 0 })
    lastPickTime: number;

    @OneToMany(_type => TeamItem, item => item.user)
    team: TeamItem[];

    @OneToMany(_type => UserPet, pet => pet.user)
    pets: UserPet[];

    hasPet(petId: number) {
        for (const item of this.pets) {
            if (item.petId === petId) {
                return true;
            }
        }
        return false;
    }
}
