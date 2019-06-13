/**
 * @File   : pet.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/13/2019, 9:38:38 AM
 */

import { Entity, BaseEntity, PrimaryColumn, Column } from 'typeorm';

@Entity('t_pet')
export class Pet extends BaseEntity {
    @PrimaryColumn({ name: 'pet_id' })
    petId: number;

    @Column()
    health: number;

    @Column()
    attack: number;

    @Column()
    speed: number;

    @Column()
    price: number;
}
