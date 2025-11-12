/*this script converts all svg files in the symbols/websiteicons folder to gif files*/
const fs = require('fs');
const svg2img = require('svg2img');
const btoa = require('btoa');

const svgFiles = fs.readdirSync('./symbols/websiteicons');

for (const svgFile of svgFiles) {
    //check extension
    if (!svgFile.endsWith('.svg')) {
        continue;
    }
    const svgString = fs.readFileSync(`./symbols/websiteicons/${svgFile}`, 'utf8');
    svg2img(svgString, 
        {
            resvg: {
                fitTo: {
                    mode: 'width', // or height
                    value: 20,
                },
            },
        },
        function(error, buffer) {
        //returns a Buffer
        fs.writeFileSync(`./symbols/websiteicons/${svgFile.replace('.svg', '.png')}`, buffer);
    });
}