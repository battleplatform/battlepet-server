/**
 * @File   : single.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/13/2019, 3:00:35 PM
 */
import { Battle, Reply } from './battle';
import { User } from '../entity';

export class BattleSingle implements Battle {
    private reply: Reply[] = [];

    setup(user: User, opposing: User) {
        console.log(user, opposing);
    }

    getReply() {
        return this.reply;
    }

    async run() {}
}
