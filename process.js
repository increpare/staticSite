#! /usr/bin/env node

async function all(){
var fs = require('fs')
var path = require('path')
var RSS = require('rss')
var striptags = require('striptags');
var getSlug = require('speakingurl');
var colorConvert = require('color-convert');

const del = require('del');
const mkdirp = require('mkdirp')
const compressing = require('compressing');
var copy = require('recursive-copy');

var minify = require('html-minifier').minify;
var minifyOptions =  {
caseSensitive:true,
collapseBooleanAttributes:true,
collapseInlineTagWhitespace:true,
collapseWhitespace:true,
conservativeCollapse:true,
// customAttrAssign:true,
// customAttrCollapse:true,
// customAttrSurround:true,
// customEventAttributes:true,
decodeEntities:true,
html5:true,
// ignoreCustomComments:true,
// ignoreCustomFragments:true,
includeAutoGeneratedTags:true,
keepClosingSlash:true,
// maxLineLength:true,
minifyCSS:true,
minifyJS:true,
minifyURLs:true,
// preserveLineBreaks:true,
preventAttributesEscaping:true,
processConditionalComments:true,
processScripts:true,
quoteCharacter:true,
removeAttributeQuotes:true,
removeComments:true,
removeEmptyAttributes:true,
removeEmptyElements:true,
removeOptionalTags:true,
removeRedundantAttributes:true,
removeScriptTypeAttributes:true,
removeStyleLinkTypeAttributes:true,
// removeTagWhitespace:true,
sortAttributes:true,
sortClassName:true,
// trimCustomFragments:true,
useShortDoctype:true,
}

//for debug
// minifyOptions={}

// STEP 1 : generate folders

function gzipFile(path){
	compressing.gzip.compressFile(P(path),P(path+".gz"))
}
var exec = require('child_process').execSync
var execAsync = require('child_process').exec


del.sync("output")

mkdirp.sync("output")
mkdirp.sync("output/game")
mkdirp.sync("output/icos")
mkdirp.sync("output/categories")
mkdirp.sync("output/feed")

function P(a){
	return path.normalize("./"+a);
}

function copyFile(a,b){
	a = P(a)
	b = P(b)
	if (!fs.existsSync(a)){
		console.log(a + " NOT FOUND")
	}
	fs.copyFileSync(a,b);
}
//exec("SpreadsheetExportToCSV database/table.numbers ~/Documents/staticSiteGenerator/database/table.csv; sleep 2")

copyFile("templates/privacy.html","output/privacy.html")

gzipFile("output/privacy.html")

copyFile("templates/404.html","output/404.html")
gzipFile("output/404.html")

await copy('symbols', P('output/symbols'))

copyFile("templates/.htaccess_images","output/icos/.htaccess")
copyFile("templates/.htaccess_images","output/symbols/.htaccess")
copyFile("templates/.htaccess_root","output/.htaccess")



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

var content = fs.readFileSync(P('database/table.csv'),'utf8')
var postTemplate = '`'+fs.readFileSync(P('templates/post.txt'))+'`';
var indexTemplate = '`'+fs.readFileSync(P('templates/index.txt'))+'`';
var rows =  content.split("\r")

var table = rows.map( r => r.split(";").map( s => s.trim().replace(/±/gi,';')).map( s => removeOuterQuotes(s) )  )

table.shift();

var pageNames=[];

var tagList=[]

var platformList = ["flash","html","linux","macos","windows","other"]

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

	var tag = src_desc_to_tag(src_desc);
	if (tagList.indexOf(tag)===-1){
		tagList.push(tag);
	}

	var datesplit = date.split('-')
	var datenum = parseInt(datesplit[0])*10000+parseInt(datesplit[1])*100+parseInt(datesplit[2]);
	r.push(datenum); [14]

	var safeName = getSlug(title)
	var pageName = tag_to_urlsafe(safeName)+".html";

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
		execAsync(`npm generateicon.js ${safeName} output/icos/${icon}`)
		r[2] = icon
	} else {
		// -interpolate Nearest -filter point
		copyFile(`icos/${icon}`,`output/icos/${icon}`)
	}

	bodyMarkdown = htmlToMarkdown(desc)

	captionMarkdown = htmlToMarkdown(caption)

	var linkList = function(pre,presrc,post){
		var result="";
		if (html!=""){
			result += `${pre} <a href="${html}">Play Now</a> ${post} (HTML5) \n`
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
			result += `${presrc} <a href="${src}">Download Source Code</a> ${post} ( ${src_desc} )</a> \n`
		}
		return result;
	}


	r.push(pageName)//[15]
	r.push(niceDate)//[16]

	var page=eval(postTemplate)
	console.log(title)
	var pageMinified=minify(page,minifyOptions)

	let fpath = P("output/game/"+pageName);
	fs.writeFile(fpath,pageMinified, function(err) {
        if(err) return console.log(err);
        gzipFile( fpath )
    })
}


/* make index */

function sortByDate(a,b){
  if( a[14] > b[14]){
      return 1;
  }else if( a[14] < b[14] ){
      return -1;
  }
  return 0;
}

Array.prototype.stableSort = function(cmp) {
  cmp = !!cmp ? cmp : (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  };
  let stabilizedThis = this.map((el, index) => [el, index]);
  let stableCmp = (a, b) => {
    let order = cmp(a[0], b[0]);
    if (order != 0) return order;
    return a[1] - b[1];
  }
  stabilizedThis.sort(stableCmp);
  for (let i=0; i<this.length; i++) {
    this[i] = stabilizedThis[i][0];
  }
  return this;
}

table.stableSort(sortByDate).reverse()

function src_desc_to_tag(desc){
	return getSlug(desc.split(" ")[0].toLowerCase(),{
	    custom: ['#']
	});
}

function tag_to_urlsafe(desc){
	return getSlug(desc.split(" ")[0].toLowerCase(),{
	    custom: {'#':"sharp"}
	});
}

var tagToFilter="";
var platformToFilter="";
function doTitle(){
	var title = "increpare games";
	if (tagToFilter.length>0){
		title = tagToFilter+" - "+title
	}
	return title;
}

function doHeading(){
	if (tagToFilter!==""){
		if (platformToFilter!==""){
			return `<h1><a href="../index.html">increpare games</a> / ${platformToFilter} - ${tagToFilter}</h1>`;
		} else {
			return `<h1><a href="../index.html">increpare games</a> / ${tagToFilter}</h1>`;
		}
	} else if (platformToFilter!==""){
		return `<h1><a href="../index.html">increpare games</a> / ${platformToFilter}</h1>`;		
	} else {		
		return `<h1>increpare games</h1>`;
	}
}

function getPrefix(){
	var prefix="";
	if (tagToFilter!==""){
		prefix="../"
	}
	if (platformToFilter!==""){
		prefix="../"
	}
	return prefix;
}


var cachedgamecount = {};
function getGameCount(plat,tag){
	var key = plat+"_"+tag;
	if (cachedgamecount.hasOwnProperty(key)){
		return cachedgamecount[key];
	}

	var result = filterTable(table,plat,tag).length;
	cachedgamecount[key]=result;
	return result;
}

var cachedtables={};
function filterTable(table,plat,tag){
	var key = plat+"_"+tag;
	if (cachedtables.hasOwnProperty(key)){
		return cachedtables[key];
	}

	if (plat==="platform"){
		plat="";
	}
	if (tag==="engine"){
		tag="";
	}
	var filteredtable = table;
	if (tag!==""){
		filteredtable = filteredtable.filter( r => src_desc_to_tag(r[10])===tag)
	}
	if (plat!==""){
		var filterIndex=0;
		switch(plat){
			case "flash":
				filterIndex=11;
				break;
			case "html":
				filterIndex=5;
				break;
			case "linux":
				filterIndex=8;
				break;
			case "macos":
				filterIndex=6;
				break;
			case "windows":
				filterIndex=7;
				break;
			case "other":
				filterIndex=12;
				break;
		}
		filteredtable = filteredtable.filter( r => r[filterIndex].trim()!=="")
	}

	cachedtables[key]=filteredtable;
	return filteredtable;
}

function doFilterLists(){
	var result="";

	var s = ""
	var prefix=getPrefix();
	var indexpath = (platformToFilter.length>0 || tagToFilter.length>0)?"../index.html":"index.html"

	function getPath(plat,tag){
		if (plat===platformToFilter && tag===tagToFilter){
			return "#";
		}
		var currentlyIndex = platformToFilter==="" && tagToFilter===""
		var targetIsIndex = (plat===""||plat==="platform")&&(tag===""||tag==="engine");
		tag = tag_to_urlsafe(tag);
		var prefix="";
		if (currentlyIndex===targetIsIndex){

		} else if (currentlyIndex==true){
			prefix="categories/"
		} else {
			prefix="../"
		}


		var fileName = "";

		if (plat===""&&tag===""){
			fileName="index"
		} else if (plat!==""){
			fileName=plat
			if (tag!==""){
				fileName+="-"+tag_to_urlsafe(tag);
			}
		} else {//tag!==""
			fileName=tag_to_urlsafe(tag);
		}
		fileName+=".html"

		return prefix+fileName;
	}


	//1 platofrm list
	result+=`<select id="plat_select" onchange="window.location.href = this.options[this.selectedIndex].value;">\n`

	function sortByNumGames_platformVary(plat_a,plat_b){
		var n_a = getGameCount(plat_a,tagToFilter);
		var n_b = getGameCount(plat_b,tagToFilter);

	  if( n_a > n_b){
	      return -1;
	  }else if( n_a < n_b ){
	      return 1;
	  }
	  return 0;
	}

	platformList.sort();
	platformList.stableSort(sortByNumGames_platformVary);

	var entryCount = getGameCount("",tagToFilter)
	var path = getPath("",tagToFilter);
	result += `<option value="${path}">platform (${entryCount})</option>\n`
	for (plat of platformList) {
		entryCount = getGameCount(plat,tagToFilter)
		var sel = (plat===platformToFilter) ? "selected ='selected'":"";
		var disabled = entryCount===0?"disabled":""
		result += `<option value="${getPath(plat,tagToFilter)}" ${sel} ${disabled}>${plat} (${entryCount})</option>\n`
	}
	result+=`</select>\n`

	//2 tag list
	result+=`<select id="tag_select" onchange="window.location.href = this.options[this.selectedIndex].value;">\n`

	function sortByNumGames_tagVary(tag_a,tag_b){
		var n_a = getGameCount(platformToFilter,tag_a);
		var n_b = getGameCount(platformToFilter,tag_b);

	  if( n_a > n_b){
	      return -1;
	  }else if( n_a < n_b ){
	      return 1;
	  }
	  return 0;
	}

	tagList.sort();
	tagList.stableSort(sortByNumGames_tagVary);

	var entryCount = getGameCount(platformToFilter,"")
	var path = getPath(platformToFilter,"");
	result += `<option value="${path}">engine (${entryCount})</option>\n`
	for (tag of tagList) {
		entryCount = getGameCount(platformToFilter,tag)
		var sel = (tag===tagToFilter) ? "selected ='selected'":"";
		var disabled = entryCount===0?"disabled":""
		result += `<option value="${getPath(platformToFilter, tag)}" ${sel} ${disabled}>${tag} (${entryCount})</option>\n`
	}
	result+=`</select>\n`


	result += `<script>
window.addEventListener('pageshow', function(event) {
     tag_select.value = "#"
     plat_select.value = "#"
});
	</script>\n`
	return result;
}


function doGrid(){
	var s = ""
	var prefix=getPrefix();
	var filteredtable = filterTable(table,platformToFilter,tagToFilter);


	for (var i=0;i<filteredtable.length;i++){
		var r = filteredtable[i];

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

		var icocount = ((html!="")?1:0)+((win!="")?1:0)+((mac!="")?1:0)+((linux!="")?1:0)+((flash!="")?1:0)+((zip!="")?1:0)+((unity!="")?1:0)+((src!="")?1:0);
		var containertype = icocount<5?"container":"smcontainer";
		var overlaytype = icocount<5?"overlay":"smoverlay";
		var icontype = icocount<5?"icon":"smicon";
		var iconsize = icocount<5?"50":"30";

		var cardTemplate = `
    <div class="card">
		<a href="${prefix}game/${pageName}">
			<img class="thumb" alt="" width="250" height="250" src="${prefix}icos/${icon}">
			<div class="date">${niceDate}</div >
			<div class="gamename">${title}</div>
		</a>`;

		var someico=false;
        if (html!=""){
        	someico=true;
        	cardTemplate += `
    	<div class="${containertype}">
            <a href="${html}" title="Play Now (HTML5)" >
            	<img alt="Play Now (HTML5)" width="${iconsize}" height="${iconsize}" class="${icontype}" src="${prefix}symbols/html5.svg" >        
            	<div class="${overlaytype}">
                	<div class="text">HTML5</div>
             	</div>
            </a>
        </div>`
      	}

        if (win!=""){
        	someico=true;
        	cardTemplate += `
    	<div class="${containertype}">
            <a href="${win}" title="Download for Windows" >
              	<img alt="Download for Windows" width="${iconsize}" height="${iconsize}" class="${icontype}" src="${prefix}symbols/windows.svg">        
              	<div class="${overlaytype}">
                	<div class="text">WIN</div>
              	</div>
            </a>
        </div>`
      	}


        if (mac!=""){
        	someico=true;
        	cardTemplate += `
    	<div class="${containertype}">
            <a href="${mac}" title="Download for macOS" >
				<img alt="Download for macOS" width="${iconsize}" height="${iconsize}" class="${icontype}" src="${prefix}symbols/apple.svg">        
				<div class="${overlaytype}">
					<div class="text">MAC</div>
				</div>
            </a>
		</div>`
      	}


        if (linux!=""){
        	someico=true;
        	cardTemplate += `
    	<div class="${containertype}">
            <a href="${linux}" title="Download for Linux" >
			<img alt="Download for Linux" width="${iconsize}" height="${iconsize}" class="${icontype}" src="${prefix}symbols/linux.svg">        
			<div class="${overlaytype}">
				<div class="text">LINUX</div>
			</div>
            </a>
		</div>`
      	}

        if (flash!=""){
        	someico=true;
        	cardTemplate += `
    	<div class="${containertype}">
            <a href="${flash}"  title="Play Online Now (Flash)" >
				<img alt="Play Online Now (Flash)" width="${iconsize}" height="${iconsize}" class="${icontype}" src="${prefix}symbols/flash.svg">        
				<div class="${overlaytype}">
					<div class="text">FLASH</div>
				</div>
            </a>
    	</div>`
      	}

        if (zip!=""){
        	someico=true;
        	cardTemplate += `
    	<div class="${containertype}">
            <a href="${zip}" title="Download Zip File" >
				<img alt="Download Zip File"  width="${iconsize}" height="${iconsize}" class="${icontype}"  src="${prefix}symbols/zip.svg">        
				<div class="${overlaytype}">
					<div class="text">ZIP</div>
				</div>
            </a>
    	</div>`
      	}

        if (unity!=""){
        	someico=true;
        	cardTemplate += `
    	<div class="${containertype}">
            <a href="${unity}" title="Play Online Now (Unity Web Player)">
				<img width="${iconsize}" height="${iconsize}" class="${icontype}" alt="Play Online Now (Unity Web Player)"  src="${prefix}symbols/unity.svg" >        
				<div class="${overlaytype}">
                	<div class="text">UNITY</div>
				</div>
            </a>
    	</div>`
      	}

        if (src!=""){
        	someico=true;
        	cardTemplate += `
    	<div class="${containertype}">
            <a href="${src}" title="Download Source Code">
				<img width="${iconsize}" height="${iconsize}" class="${icontype}" alt="Download Source Code (${src_desc})" src="${prefix}symbols/source.svg">        
				<div class="${overlaytype}">
					<div class="text">SOURCE</div>
				</div>
            </a>
    	</div>`
      	}

      	if (someico===false){

        	cardTemplate += `
    	<div class="${containertype}">
            	<img width="${iconsize}" height="${iconsize}" class="${icontype}" alt="" src="${prefix}symbols/blank.svg">        

    	</div>`
      	}
      	cardTemplate+=`
  	</div>`
		s+=cardTemplate;		
	}
	return s;
}




function generatePage(plat,tag){
	console.log("filtered page : "+tag+"\t"+plat)
	var filteredPage=eval(indexTemplate)
	var filteredPageMinified = minify(filteredPage,minifyOptions)

	var pageName="";
	pageName+=plat
	if (tag!==""){
		if (pageName.length>0){
			pageName+="-";
		}
		pageName+= tag_to_urlsafe(tag);
	}

	var categoryPagePath = `output/categories/${pageName}.html`
	fs.writeFile(categoryPagePath,filteredPageMinified, function(err) {
	        if(err) return console.log(err);
	        gzipFile(categoryPagePath)
	    })

}

var page=eval(indexTemplate)
var pageMinified = minify(page,minifyOptions)
console.log("index.html")

fs.writeFile("output/index.html",pageMinified, function(err) {
        if(err) return console.log(err);
        gzipFile("output/index.html")

    })

var tags = tagList.slice();
var plats = platformList.slice();
for (tag of tags){
	tagToFilter = tag
	platformToFilter="";
	generatePage(platformToFilter,tagToFilter);
}

for (platform of plats){
	platformToFilter = platform
	tagToFilter="";
	generatePage(platformToFilter,tagToFilter);
}


for (tag of tags){
	tagToFilter = tag
	for (platform of plats){
		platformToFilter = platform
		generatePage(platformToFilter,tagToFilter);
	}
}

var feedOptions = {
	title:"increpare games",
	description:"a feed of games and other things made by increpare",
	feed_url:"https://www.increpare.com/feed.rss",
	site_url:"https://www.increpare.com",
	image_url:"https://www.increpare.com/favicon.png",
	author:"analytic@gmail.com (Stephen Lavelle)",
	categories: ['games','increpare','indie games','open source'],
	webMaster:"analytic@gmail.com (Stephen Lavelle)",
	copyright:"2018 Stephen Lavelle",
	managingEditor:"analytic@gmail.com (Stephen Lavelle)",
	language: 'en'
};

var date_now = new Date().toUTCString();

var feed_str = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"  xmlns:atom="http://www.w3.org/2005/Atom">

<channel>
  <language>en</language>
  <title>increpare games</title>
  <link>https://www.increpare.com</link>
  <description>Games and other things made by increpare.</description>
  <copyright>2018 Stephen Lavelle</copyright>
  <managingEditor>analytic@gmail.com (Stephen Lavelle)</managingEditor>
  <webMaster>analytic@gmail.com (Stephen Lavelle)</webMaster>
  <pubDate>${date_now}</pubDate>
  <lastBuildDate>${date_now}</lastBuildDate>
  <category>games</category>
  <generator>https://github.com/increpare/staticSite/blob/master/process.js</generator>
  <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
  <atom:link href="https://www.increpare.com/feed.rss" rel="self" type="application/rss+xml" />
`


for (var i=0;i<Math.min(50,table.length);i++){
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
	var date = new Date(year,month-1,day)

	var itemOptions = {
		title:title,
		author:'analytic@gmail.com (Stephen Lavelle)',
		description:striptags(caption),
		url:`https://www.increpare.com/game/${pageName}`,
		date:date.toUTCString()		
	}

	feed_str+=`
  <item>
    <title>${itemOptions.title}</title>
    <pubDate>${itemOptions.date}</pubDate>
    <link>${itemOptions.url}</link>
    <author>analytic@gmail.com (Stephen Lavelle)</author>    
    <description>${itemOptions.description}</description>
    <guid isPermaLink="true">${itemOptions.url}</guid>
    <source url="https://www.increpare.com/feed.rss">increpare games</source>
  </item>`

}

feed_str+=	`
</channel>

</rss>`


fs.writeFile('output/feed.rss',feed_str, function(err) {
        if(err) return console.log(err);
    })

fs.writeFile('output/feed/index.html',feed_str, function(err) {
        if(err) return console.log(err);
    })

console.log(new Date(Date.now()).toLocaleString() + ": finished");


}

all()