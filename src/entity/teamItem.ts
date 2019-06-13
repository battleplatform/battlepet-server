/**
 * @File   : teamItem.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/12/2019, 2:10:16 PM
 */

import { ManyToOne, JoinColumn, Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { User } from './user';

@Entity({ name: 't_user_team' })
export class TeamItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(_type => User, user => user.userId)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'pet_id' })
    petId: number;
}
