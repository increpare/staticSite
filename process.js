#! /usr/bin/env node

var fs = require('fs')

// STEP 1 : generate folders

var exec = require('child_process').execSync
var execAsync = require('child_process').exec
exec("rm -rf output")
exec("mkdir output")
exec("mkdir output/game")
exec("mkdir output/icos")
exec("cp templates/privacy.html output/privacy.html")

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

	var datesplit = date.split('-')
	var datenum = parseInt(datesplit[0])*10000+parseInt(datesplit[1])*100+parseInt(datesplit[2]);
	r.push(datenum);

	var safeName = title.replace(/[ ]/g,'-').replace(/[^a-zA-Z0-9-_\.]/g,'')
	var pageName = date+"-"+safeName+".html";


	if (icon==""){
		var iconName = date+"-"+safeName+".png";
		execAsync(`./generateicon.js ${safeName} output/icos/${iconName}`)
		r[2] = iconName
		icon = iconName
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
		if (src!=""){
			result += `${presrc} <a href="${src}">Download Source Code</a> ${post} (${src_desc}) \n`
		}
		return result;
	}


	r.push(pageName)

	var page=eval(postTemplate);
	fs.writeFile("output/game/"+pageName,page);

}


/* make index */

function sortByDate(a,b){
  if( a[13] > b[13]){
      return -1;
  }else if( a[13] < b[13] ){
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


		var pageName = r[14]

		if (i%6===0){
			s+="\t<tr>\n"
		}

		s+=`\t\t<td><a href="game/${pageName}"><img class="ico" src="icos/${icon}"><br>${title}</a>`

		s+="\n"

		execAsync(`cp icos/${icon} output/icos/${icon}`)

	}
	return s;
}

var page=eval(indexTemplate)
fs.writeFile("output/index.html",page)
