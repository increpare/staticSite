var fs = require('fs');
const {execFile} = require('child_process');
const optipng = require('optipng-bin');


var files = fs.readdirSync('./icos');

for (i in files){
    var fn = files[i];
    var fullname = `./icos/${fn}`;
    (async (fn) => {
        await execFile(optipng, ['-o7','-out', fn, fn]);
        console.log(`${fn} compressed`)
    })(fullname);
}