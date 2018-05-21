#! /usr/bin/env node

var fs = require('fs')
var path = require('path')
var RSS = require('rss')

// STEP 1 : generate folders

var exec = require('child_process').execSync
var execAsync = require('child_process').exec
exec("rm -rf output")
exec("mkdir output")
exec("mkdir output/game")
exec("mkdir output/icos")
execAsync("cp templates/privacy.html output/privacy.html")
execAsync("cp -r symbols output/symbols")

// STEP 2 : read in CSV

function removeOuterQuotes(s){
	s=s.trim();
	if (s[0]==='"' && s[s.length-1]==='"') {
		s = s.substring(1, s.length-1);
		s = s.replace(/""/g,'"');
	}
	return s;
}
function htmlToMarkdown(s_html){
	s_html = s_html.replace(/\n\n/gi,'<p><p>\n');
	var TurndownService = require('turndown')
	var turndownService = new TurndownService()
	var markdown = turndownService.turndown(s_html);
	return markdown;
}

var content = fs.readFileSync('database/table.csv','utf8')

var postTemplate = '`'+fs.readFileSync('templates/post.txt')+'`';
var indexTemplate = '`'+fs.readFileSync('templates/index.txt')+'`';
var rows =  content.split("\r")

var table = rows.map( r => r.split(";").map( s => s.trim().replace(/±/gi,';')).map( s => removeOuterQuotes(s) )  )

table.shift();

var pageNames=[];

// STEP 3 : generate sub files
for (var i=0;i<table.length;i++){
	var r = table[i]
	var title = r[0]

	var niceDate=r[1]
	r[1] = r[1].replace(/"/gi,'-').replace(/\//gi,'-').trim()
	var date = r[1]

	var icon = r[2]

	var caption = r[3]
	var desc = r[4]
	var html = r[5]
	var mac = r[6]
	var win = r[7]
	var linux = r[8]
	var src = r[9]
	var src_desc = r[10]
	var flash = r[11]
	var zip = r[12]
	var unity = r[13]

	var datesplit = date.split('-')
	var datenum = parseInt(datesplit[0])*10000+parseInt(datesplit[1])*100+parseInt(datesplit[2]);
	r.push(datenum); [14]

	var safeName = title.replace(/[ ]/g,'-').replace(/[^a-zA-Z0-9-_\.]/g,'')
	var pageName = safeName+".html";

	if (pageNames.indexOf(pageName)>=0){
		var c = 2;	
		while (pageNames.indexOf(pageName)>=0){
			pageName = safeName+"_"+c+".html";
			c++;
		}
	}
	pageNames.push(pageName);


	if (icon==""){
		icon = date+"-"+safeName+".png";
		execAsync(`./generateicon.js ${safeName} output/icos/${icon}`)
		r[2] = icon
	} else {
		// -interpolate Nearest -filter point
		execAsync(`cp icos/${icon} output/icos/${icon}`)				
	}

	bodyMarkdown = htmlToMarkdown(desc)

	captionMarkdown = htmlToMarkdown(caption)

	var linkList = function(pre,presrc,post){
		var result="";
		if (html!=""){
			result += `${pre} <a href="${html}">Play Now</a> (HTML5) ${post} \n`
		}
		if (win!=""){
			result += `${pre} <a href="${win}">Download for Windows</a> ${post} \n`
		}
		if (mac!=""){
			result += `${pre} <a href="${mac}">Download for macOS</a> ${post} \n`
		}
		if (linux!=""){
			result += `${pre} <a href="${linux}">Download for Linux</a> ${post} \n`
		}
		if (zip!=""){
			result += `${pre} <a href="${zip}">Download Zip file</a> ${post} \n`
		}
		if (flash!=""){
			result += `${pre} <a href="${flash}">Play Now</a> ${post} (Flash) \n`
		}
		if (unity!=""){
			result += `${pre} <a href="${unity}">Play Now</a> ${post} (Unity Web Player) \n`
		}
		if (src!=""){
			result += `${presrc} <a href="${src}">Download Source Code</a> ${post} (${src_desc}) \n`
		}
		return result;
	}


	r.push(pageName)//[15]
	r.push(niceDate)//[16]
	var page=eval(postTemplate);
	fs.writeFile("output/game/"+pageName,page);

}


/* make index */

function sortByDate(a,b){
  if( a[14] > b[14]){
      return -1;
  }else if( a[14] < b[14] ){
      return 1;
  }
  return 0;
}

table.sort(sortByDate)

function doGrid(){
	var s = ""

	for (var i=0;i<table.length;i++){
		var r = table[i];

		var title = r[0]
		var date = r[1]
		var icon = r[2]
		var caption = r[3]
		var desc = r[4]
		var html = r[5]
		var mac = r[6]
		var win = r[7]
		var linux = r[8]
		var src = r[9]
		var src_desc = r[10]
		var flash = r[11]
		var zip = r[12]
		var unity = r[13]
		var datenum = r[14]
		var pageName = r[15]
		var niceDate = r[16]

		var cardTemplate = `<div class="card">
		<a href="game/${pageName}">
        <img class="thumb" width="250px" height="250px" src="icos/${icon}">
        <div class="date">${niceDate}</div >
        <div class="gamename">${title}</div>
        </a>
        `;

        if (html!=""){
        	cardTemplate += `
		          <div class="container">
		            <a href="${html}" title="Play Now (HTML5)" alt="Play Now (HTML5)" >
		              <img width="50px" height="50px" class="icon" src="symbols/html5.svg" width="50px" height="50px">        
		              <div class="overlay">
		                <div class="text">HTML5</div>
		              </div>
		            </a>
		          </div>`
      	}

        if (win!=""){
        	cardTemplate += `
		          <div class="container">
		            <a href="${win}" title="Download for Windows" alt="Download for Windows" >
		              <img width="50px" height="50px" class="icon" src="symbols/windows.svg" width="50px" height="50px">        
		              <div class="overlay">
		                <div class="text">WIN</div>
		              </div>
		            </a>
		          </div>`
      	}


        if (mac!=""){
        	cardTemplate += `
		          <div class="container">
		            <a href="${mac}" title="Download for macOS" alt="Download for macOS" >
		              <img width="50px" height="50px" class="icon" src="symbols/apple.svg" width="50px" height="50px">        
		              <div class="overlay">
		                <div class="text">MAC</div>
		              </div>
		            </a>
		          </div>`
      	}


        if (linux!=""){
        	cardTemplate += `
		          <div class="container">
		            <a href="${linux}" title="Download for Linux" alt="Download for Linux" >
		              <img width="50px" height="50px" class="icon" src="symbols/linux.svg" width="50px" height="50px">        
		              <div class="overlay">
		                <div class="text">LINUX</div>
		              </div>
		            </a>
		          </div>`
      	}

        if (flash!=""){
        	cardTemplate += `
		          <div class="container">
		            <a href="${flash}"  title="Play Online Now (Flash)" alt="Play Online Now (Flash)">
		              <img width="50px" height="50px" class="icon" src="symbols/flash.svg" width="50px" height="50px">        
		              <div class="overlay">
		                <div class="text">FLASH</div>
		              </div>
		            </a>
		          </div>`
      	}

        if (zip!=""){
        	cardTemplate += `
		          <div class="container">
		            <a href="${zip}">
		              <img width="50px" height="50px" class="icon" title="Download Zip File" alt="Download Zip File" src="symbols/zip.svg" width="50px" height="50px">        
		              <div class="overlay">
		                <div class="text">ZIP</div>
		              </div>
		            </a>
		          </div>`
      	}

        if (unity!=""){
        	cardTemplate += `
		          <div class="container">
		            <a href="${unity}">
		              <img width="50px" height="50px" class="icon" title="Play Online Now (Unity Web Player)" alt="Play Online Now (Unity Web Player)" src="symbols/unity.svg" width="50px" height="50px">        
		              <div class="overlay">
		                <div class="text">UNITY</div>
		              </div>
		            </a>
		          </div>`
      	}

        if (src!=""){
        	cardTemplate += `
		          <div class="container">
		            <a href="${src}">
		              <img width="50px" height="50px" class="icon" title="Download Source Code (${src_desc})" alt="Download Source Code (${src_desc})" src="symbols/source.svg" width="50px" height="50px">        
		              <div class="overlay">
		                <div class="text">SOURCE</div>
		              </div>
		            </a>
		          </div>`
      	}

      	s+="</div>"
		s+=cardTemplate;		
	}
	return s;
}

var page=eval(indexTemplate)
fs.writeFile("output/index.html",page)


var feedOptions = {
	title:"increpare games",
	description:"a feed of games and other things made by increpare",
	feed_url:"https://www.increpare.com/feed.rss",
	site_url:"https://www.increpare.com",
	image_url:"https://www.increpare.com/favicon.png",
	author:"Stephen Lavelle",
	categories: ['games','increpare','indie games','open source'],
	webMaster:"Stephen Lavelle",
	copyright:"2018 Stephen Lavelle",
	managingEditor:"Stephen Lavelle",
	language: 'en'
};

var feed = new RSS(feedOptions);

for (var i=0;i<Math.min(20,table.length);i++){
	var r = table[i];

	var title = r[0]
	var date = r[1]
	var icon = r[2]
	var caption = r[3]
	var desc = r[4]
	var html = r[5]
	var mac = r[6]
	var win = r[7]
	var linux = r[8]
	var src = r[9]
	var src_desc = r[10]
	var flash = r[11]
	var zip = r[12]
	var unity = r[13]
	var datenum = r[14]
	var pageName = r[15]
	var niceDate = r[16]

	var splitDate = niceDate.split('/');
	var year = splitDate[0];
	var month = splitDate[1];
	var day = splitDate[2];
	var date = new Date(year,month,date)

	var itemOptions = {
		title:title,
		description:caption,
		url:`https://www.increpare.com/games/${pageName}`,
		date:date.toUTCString()		
	}
	feed.item(itemOptions);

	var xml = feed.xml();

	fs.writeFile("output/feed.rss",xml);
}