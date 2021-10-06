#! /usr/bin/env node

/* backs up game-gists from github to /backup DIRECTORY */

const fs = require("fs");
const getSlug = require("speakingurl");
var request = require('request');

console.time("timer");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


async function all() {
  


    let table = JSON.parse(
        fs.readFileSync("database.json", {
            encoding: "utf8",
        })
    );

    // STEP 3 : generate sub files
    for (let i = 0; i < table.length; i++) {
        let r = table[i];
        let src = r.SRC;
        src = src.trim().toLowerCase();

        let html = r["WEB-BROWSER"];
        html = html.trim().toLowerCase();

        var title = r.TITLE;
        var title_safe =  getSlug(title, {
            custom: {
                "#": "sharp",
            },
        });

        if (src.indexOf("https://www.puzzlescript.net/editor.html?hack=")===0){
            var startidx = src.indexOf("=")+1;
            var gist_id = src.substr(startidx);
            let gist_url = "https://api.github.com/gists/" + gist_id;

            var options = {
                url: gist_url,
                headers: {
                  'User-Agent': 'request'
                }
              };
              
            request(options, function(resperror, response, body) {
                var parsed = JSON.parse(body);

                var filename = "gist_backups/puzzlescript/"+gist_id+"_"+title_safe;
                console.log("PUZZLESCRIPT : " + filename);
                fs.writeFile(filename, parsed["files"]["script.txt"]["content"],function(){});
            });  
            await delay(62000);
        } else if (html.indexOf("https://www.flickgame.org/play.html?p=")===0){
            var startidx = html.indexOf("=")+1;
            var gist_id = html.substr(startidx);
            let gist_url = "https://api.github.com/gists/" + gist_id;

            var options = {
                url: gist_url,
                headers: {
                  'User-Agent': 'request'
                }
              };
              
            request(options, function(resperror, response, body) {
                var parsed = JSON.parse(body);

   

                var filename = "gist_backups/flickgame/"+gist_id+"_"+title_safe;
                fs.writeFile(filename, parsed["files"]["game.txt"]["content"],function(){});
            });  
            await delay(62000);
        }
    }

}

all();
