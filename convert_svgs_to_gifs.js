/*this script converts all svg files in the symbols/websiteicons folder to gif files*/
import * as fs from 'fs';
import {execFile} from 'node:child_process';
import {optimize} from 'svgo';
import {promisify} from 'util';

const execFileAsync = promisify(execFile);

async function convertSvgsToGifs() {
    const svgFiles = fs.readdirSync('./symbols/websiteicons')
        .filter(file => file.endsWith('.svg'));

    for (const svgFile of svgFiles) {
        try {
            const svgPath = `./symbols/websiteicons/${svgFile}`;
            const gifPath = `./symbols/websiteicons/${svgFile.replace('.svg', '.gif')}`;
            
            // Optimize SVG first
            const svg = fs.readFileSync(svgPath, 'utf8');
            const result = optimize(svg);
            
            // Write optimized SVG temporarily, then convert to GIF using ImageMagick
            const tempSvgPath = `./symbols/websiteicons/${svgFile.replace('.svg', '.temp.svg')}`;
            fs.writeFileSync(tempSvgPath, result.data);
            
            // Convert SVG to GIF using ImageMagick (requires ImageMagick to be installed)
            await execFileAsync('magick', [tempSvgPath, gifPath]);
            
            // Clean up temporary file
            fs.unlinkSync(tempSvgPath);
            
            console.log(`Converted ${svgFile} to ${svgFile.replace('.svg', '.gif')}`);
        } catch (error) {
            console.error(`Error processing ${svgFile}:`, error.message);
        }
    }
}

convertSvgsToGifs().catch(console.error);