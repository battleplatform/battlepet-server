/**
 * @File   : userPet.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/12/2019, 2:55:40 PM
 */

import { BaseEntity, Entity, ManyToOne, JoinColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user';

@Entity('t_user_pet')
export class UserPet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(_type => User, user => user.userId)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'pet_id' })
    petId: number;
}
