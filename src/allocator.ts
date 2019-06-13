/**
 * @File   : allocator.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/13/2019, 3:11:55 PM
 */

export class Allocator {
    private id = 0;

    alloc() {
        this.id++;
        return this.id;
    }
}
