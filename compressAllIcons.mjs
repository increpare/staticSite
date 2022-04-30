import * as fs from 'fs';
import {execFile} from 'node:child_process';
import optipng from 'optipng-bin';


var files = fs.readdirSync('./icos');

for (var i in files){
    var fn = files[i];
    var fullname = `./icos/${fn}`;
    (async (fn) => {
        await execFile(optipng, ['-o7','-out', fn, fn]);
        console.log(`${fn} compressed`)
    })(fullname);
}