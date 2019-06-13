/**
 * @File   : utils.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/12/2019, 4:19:27 PM
 */

export function now() {
    return Math.floor(Date.now() / 1000);
}

export function id(val: string) {
    if (val.length !== 4) {
        throw Error('id must be length 4');
    }
    return val.split('').reduce((r, c, i) => r + c.charCodeAt(0) * Math.pow(2, (3 - i) * 8), 0);
}

export function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}
