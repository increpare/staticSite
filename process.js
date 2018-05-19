#! /usr/bin/env node

var fs = require('fs')

// STEP 1 : generate folders

var exec = require('child_process').exec
exec("rm -rf myblog/_posts/*.md")

// STEP 2 : read in CSV


function removeOuterQuotes(s){
	s=s.trim();
	if (s[0]==='"' && s[s.length-1]==='"') {
		s = s.substring(1, s.length-2);
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

var rows =  content.split("\r")

var table = rows.map( r => r.split(";").map( s => s.trim().replace(/±/gi,';')).map( s => removeOuterQuotes(s) )  )

// STEP 3 : generate sub files
for (var i=1;i<table.length;i++){
	var r = table[i]
	var title = r[0]
	var date = r[1].replace(/"/gi,'-').replace(/\//gi,'-').trim()
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

	var categories = [];
	if (html!=""){
		categories.push('HTML')
	}
	if (win!=""){
		categories.push('Windows')
	}
	if (mac!=""){
		categories.push('macOS')
	}
	if (linux!=""){
		categories.push('Linux')
	}
	if (zip!=""){
		categories.push('Zip')
	}
	if (flash!=""){
		categories.push('Flash')
	}
	if (src!=""){
		categories.push('Source')
	}
	if (src_desc!=""){
		categories+=`"${src_desc}" `
	}
	categories = categories.trim()

	bodyMarkdown = htmlToMarkdown(desc)

	captionMarkdown = htmlToMarkdown(caption)

	var linkList = function(pre,post){
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
			result += `${pre} <a href="${flash}">Play Now</a> (Flash) ${post} \n`
		}
		if (src!=""){
			result += `${pre} <a href="${source}">Download Source Code</a> (${src_desc}) ${post} \n`
		}
	}

		var page = `---
	}
	layout: post
	title: "${title}"
	categories: ${categories}
	win: "${win}"
	mac: "${mac}"
	linux: "${linux}"
	flash: "${flash}"
	zip: "${zip}"
	src: "${src}"
	icon: "${icon}"
	caption: "${captionMarkdown}"
	---
	${bodyMarkdown}
		`

	var safeName = title.replace(/[ ]/g,'-').replace(/[^a-zA-Z0-9-_\.]/g,'')
	var pageName = date+"-"+safeName+".md";
	
	fs.writeFile("myblog/_posts/"+pageName,page);

}

