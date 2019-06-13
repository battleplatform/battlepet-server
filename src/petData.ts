/**
 * @File   : petData.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/13/2019, 9:46:23 AM
 */

import * as utils from './utils';
import { Pet } from './entity';

export const PET_LIST = ([
    ['hpea', 100, 20, 1, 50],
    ['hfoo', 100, 20, 1, 50],
    ['hkni', 100, 20, 1, 50],
    ['hrif', 100, 20, 1, 50],
    ['hmtm', 100, 20, 1, 50],
    ['hmpr', 200, 40, 1, 100],
    ['hsor', 200, 40, 1, 100],
    ['hmtt', 200, 40, 1, 100],
    ['hspt', 200, 40, 1, 100],
    ['nbee', 200, 40, 1, 100],
    ['nbel', 300, 60, 1, 150],
    ['nchp', 300, 60, 1, 150],
    ['hhdl', 300, 60, 1, 150],
    ['njks', 300, 60, 1, 150],
    ['hrdh', 300, 60, 1, 150],
    ['nhym', 400, 80, 1, 200],
    ['nmed', 400, 80, 1, 200],
    ['nhea', 400, 80, 1, 200],
    ['nhem', 400, 80, 1, 200],
    ['nhef', 400, 80, 1, 200],
    ['nemi', 500, 100, 1, 250],
    ['hcth', 500, 100, 1, 250],
    ['hhes', 500, 100, 1, 250],
    ['ogrk', 500, 100, 1, 250],
    ['nw2w', 50, 100, 1, 250]
] as [string, number, number, number, number][]).map(v => {
    const pet = new Pet();
    pet.petId = utils.id(v[0]);
    [, pet.health, pet.attack, pet.speed, pet.price] = v;
    return pet;
});

export const PET_DEFAULTS = PET_LIST.slice(0, 3);
