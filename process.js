#! /usr/bin/env node

const fs = require("fs");
const path = require("path");
const striptags = require("striptags");
const getSlug = require("speakingurl");
const compressing = require("compressing");
const copy = require("recursive-copy");
const minify = require("html-minifier").minify;
const execAsync = require("child_process").exec;
const TurndownService = require("turndown");

const turndownService = new TurndownService();

console.time("timer");

async function all(){

    const minifyOptions =  {
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
    useShortDoctype:true
    };

    //memoize slugs
    let slugs=JSON.parse(fs.readFileSync("slugs_cache.json",{encoding:"utf8"}));

    //for debug
    // minifyOptions={}

    // STEP 1 : generate folders

    function gzipFile(path){
        compressing.gzip.compressFile(P(path),P(path+".gz"));
    }

    if (fs.existsSync("output")){
        fs.renameSync("output","output2");
        fs.rmdir("output2",{recursive:true},function(){});
    }

    fs.mkdirSync("output");
    fs.mkdirSync("output/game");
    fs.mkdirSync("output/icos");
    fs.mkdirSync("output/categories");
    fs.mkdirSync("output/engine");
    fs.mkdirSync("output/feed");
    
    function P(a){
        return path.normalize("./"+a);
    }
    
    function copyFile(a,b){
        a = P(a);
        b = P(b);
        fs.exists(a,function(exists){
            if (exists){
                fs.copyFile(a,b,function(){
                    if (a.indexOf(".html")>=0){
                        gzipFile(b);
                    }
                });
            } else {
                console.log(a + " NOT FOUND");
            }
        });
    }
    
    copyFile("templates/privacy.html","output/privacy.html");
    
    copyFile("templates/404.html","output/404.html");
    
    await copy('symbols', P('output/symbols'));
    
    copyFile("templates/.htaccess_images","output/icos/.htaccess");
    copyFile("templates/.htaccess_images","output/symbols/.htaccess");
    copyFile("templates/.htaccess_root","output/.htaccess");
    
    
    
    // STEP 2 : read in CSV

    function htmlToMarkdown(s_html){
        s_html = s_html.replace(/\n\n/gi,'<p><p>\n');
        let markdown = turndownService.turndown(s_html);
        return markdown;
    }
    
    let postTemplate = '`'+fs.readFileSync(P('templates/post.txt'))+'`';
	postTemplate=minify(postTemplate,minifyOptions);


    let indexTemplate = '`'+fs.readFileSync(P('templates/index.txt'))+'`';
	indexTemplate = minify(indexTemplate,minifyOptions);
    
    let table = JSON.parse(fs.readFileSync("database.json",{encoding:"utf8"}));
    
    let pageNames=[];
    
    let tagList=[];
    
    let platformList = ["flash-player","web-browser","linux","macos","windows","other"];
    
    // STEP 3 : generate sub files
    for (let i=0;i<table.length;i++){
        let r = table[i]
        let title = r.TITLE;
    
        let niceDate=r.DATE;
        r.DATE = r.DATE.replace(/"/gi,'-').replace(/\//gi,'-').trim()
        let date = r.DATE
    
        let icon = r.ICON
    
        let caption = r.CAPTION
        let desc = r.DESC
        let html = r["WEB-BROWSER"]
        let mac = r.MAC
        let win = r.WIN
        let linux = r.LINUX
        let src = r.SRC
        let src_desc = r["SRC-DESC"]
        let flash = r["FLASH-PLAYER"]
        let zip = r.ZIP
        let unity = r["UNITY PLAYER"]
    
        let tag = src_desc_to_tag(src_desc);
        if (tagList.indexOf(tag)===-1){
            tagList.push(tag);
        }
    
        let datesplit = date.split('-')
        // console.log(date);
        // console.log(datesplit);
        let datenum = parseInt(datesplit[0])*10000+parseInt(datesplit[1])*100+parseInt(datesplit[2]);
        r.DATENUM=datenum; 
    
        let safeName = getSlug(title)
        let pageName = tag_to_urlsafe(safeName)+".html";
    
        if (pageNames.indexOf(pageName)>=0){
            let c = 2;	
            while (pageNames.indexOf(pageName)>=0){
                pageName = safeName+"_"+c+".html";
                c++;
            }
        }
        pageNames.push(pageName);
    
        if (icon==""){
            icon = date+"-"+safeName+".png";
            execAsync(`./generateicon.js ${safeName} output/icos/${icon}`)
            r.ICON = icon
        } else {
            // -interpolate Nearest -filter point
            copyFile(`icos/${icon}`,`output/icos/${icon}`)
        }
    
        bodyMarkdown = htmlToMarkdown(desc)
    
        captionMarkdown = htmlToMarkdown(caption)
    
        let linkList = function(pre,presrc,post){
            let result="";
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
    
    
        r.PAGENAME = pageName //[15]
        r.NICEDATE = niceDate //[16]
    
        let page=eval(postTemplate)
        console.log(title)
    
        let fpath = P("output/game/"+pageName);
        fs.writeFile(fpath,page, function(err) {
            if(err) return console.log(err);
            gzipFile( fpath )
        })
    }
    
    
    /* make index */
    
    function sortByDate(a,b){
      if( a.DATENUM > b.DATENUM){
          return 1;
      }else if( a.DATENUM < b.DATENUM ){
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
        if (desc in slugs){
            return slugs[desc];
        }
        let slug = getSlug(desc.split(" ")[0].toLowerCase(),{
            custom: ['#']
        });
        slugs[desc]=slug;
        return slug;
    }
    
    function tag_to_urlsafe(desc){
        var key = desc+"_SHARP#"
        if (key in slugs){
            return slugs[key];
        }
        let slug = getSlug(desc.split(" ")[0].toLowerCase(),{
            custom: {'#':"sharp"}
        });
        slugs[key]=slug;
        return slug;
    }
    
    let tagToFilter="";
    let platformToFilter="";
    function doTitle(){
        let title = "increpare games";
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
        let prefix="";
        if (tagToFilter!==""){
            prefix="../"
        }
        if (platformToFilter!==""){
            prefix="../"
        }
        return prefix;
    }
    
    
    let cachedgamecount = {};
    function getGameCount(plat,tag){
        let key = plat+"_"+tag;
        if (cachedgamecount.hasOwnProperty(key)){
            return cachedgamecount[key];
        }
    
        let result = filterTable(table,plat,tag).length;
        cachedgamecount[key]=result;
        return result;
    }
    
    let cachedtables={};
    function filterTable(table,plat,tag){
        let key = plat+"_"+tag;
        if (cachedtables.hasOwnProperty(key)){
            return cachedtables[key];
        }
    
        if (plat==="platform"){
            plat="";
        }
        if (tag==="engine"){
            tag="";
        }
        let filteredtable = table;
        if (tag!==""){
            filteredtable = filteredtable.filter( r => src_desc_to_tag(r["SRC-DESC"])===tag)
        }
        if (plat!==""){
            let filterIndex=0;
            switch(plat){
                case "flash-player":
                    filterIndex="FLASH-PLAYER";
                    break;
                case "web-browser":
                    filterIndex="WEB-BROWSER";
                    break;
                case "linux":
                    filterIndex="LINUX";
                    break;
                case "macos":
                    filterIndex="MAC";
                    break;
                case "windows":
                    filterIndex="WIN";
                    break;
                case "other":
                    filterIndex="ZIP";
                    break;
            }
            filteredtable = filteredtable.filter( r => r[filterIndex].trim()!=="")
        }
    
        cachedtables[key]=filteredtable;
        return filteredtable;
    }
    
    function doFilterLists(){
        let result="";
    
        let s = ""
        let prefix=getPrefix();
        let indexpath = (platformToFilter.length>0 || tagToFilter.length>0)?"../index.html":"index.html"
    
        function getPath(plat,tag){
            if (plat===platformToFilter && tag===tagToFilter){
                return "#";
            }
            let currentlyIndex = platformToFilter==="" && tagToFilter===""
            let targetIsIndex = (plat===""||plat==="platform")&&(tag===""||tag==="engine");
            tag = tag_to_urlsafe(tag);
            let prefix="";
            if (currentlyIndex===targetIsIndex){
    
            } else if (currentlyIndex==true){
                prefix="categories/"
            } else {
                prefix="../"
            }
    
    
            let fileName = "";
    
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
            let n_a = getGameCount(plat_a,tagToFilter);
            let n_b = getGameCount(plat_b,tagToFilter);
    
          if( n_a > n_b){
              return -1;
          }else if( n_a < n_b ){
              return 1;
          }
          return 0;
        }
    
        platformList.sort();
        platformList.stableSort(sortByNumGames_platformVary);
    
        let entryCount = getGameCount("",tagToFilter)
        let path = getPath("",tagToFilter);
        result += `<option value="${path}">platform (${entryCount})</option>\n`
        for (plat of platformList) {
            entryCount = getGameCount(plat,tagToFilter)
            let sel = (plat===platformToFilter) ? "selected ='selected'":"";
            let disabled = entryCount===0?"disabled":""
            result += `<option value="${getPath(plat,tagToFilter)}" ${sel} ${disabled}>${plat} (${entryCount})</option>\n`
        }
        result+=`</select>\n`
    
        //2 tag list
        result+=`<select id="tag_select" onchange="window.location.href = this.options[this.selectedIndex].value;">\n`
    
        function sortByNumGames_tagVary(tag_a,tag_b){
            let n_a = getGameCount(platformToFilter,tag_a);
            let n_b = getGameCount(platformToFilter,tag_b);
    
          if( n_a > n_b){
              return -1;
          }else if( n_a < n_b ){
              return 1;
          }
          return 0;
        }
    
        tagList.sort();
        tagList.stableSort(sortByNumGames_tagVary);
    
        entryCount = getGameCount(platformToFilter,"")
        path = getPath(platformToFilter,"");
        result += `<option value="${path}">engine (${entryCount})</option>\n`
        for (tag of tagList) {
            entryCount = getGameCount(platformToFilter,tag)
            let sel = (tag===tagToFilter) ? "selected ='selected'":"";
            let disabled = entryCount===0?"disabled":""
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
        let s = ""
        let prefix=getPrefix();
        let filteredtable = filterTable(table,platformToFilter,tagToFilter);
    
    
        for (let i=0;i<filteredtable.length;i++){
            const r = filteredtable[i];
    
            const title = r.TITLE
            const date = r.DATE
            const icon = r.ICON
            const caption = r.CAPTION
            const desc = r.DESC
            const html = r["WEB-BROWSER"]
            const mac = r.MAC
            const win = r.WIN
            const linux = r.LINUX
            const src = r.SRC
            const src_desc = r["SRC-DESC"]
            const flash = r["FLASH-PLAYER"]
            const zip = r.ZIP
            const unity = r["UNITY PLAYER"]
            const datenum = r.DATENUM
            const pageName = r.PAGENAME
            const niceDate = r.NICEDATE
    
            const icocount = ((html!="")?1:0)+((win!="")?1:0)+((mac!="")?1:0)+((linux!="")?1:0)+((flash!="")?1:0)+((zip!="")?1:0)+((unity!="")?1:0)+((src!="")?1:0);
            const containertype = icocount<5?"container":"smcontainer";
            const overlaytype = icocount<5?"overlay":"smoverlay";
            const icontype = icocount<5?"icon":"smicon";
            const iconsize = icocount<5?"50":"30";
    
            let cardTemplate = `
        <div class="card">
            <a href="${prefix}game/${pageName}">
                <img class="thumb" alt="" width="250" height="250" src="${prefix}icos/${icon}">
                <div class="date">${niceDate}</div >
                <div class="gamename">${title}</div>
            </a>`;
    
            let someico=false;
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
        const filteredPage=eval(indexTemplate)
    
        let pageName="";
        pageName+=plat
        if (tag!==""){
            if (pageName.length>0){
                pageName+="-";
            }
            pageName+= tag_to_urlsafe(tag);
        }
    
        const categoryPagePath = `output/categories/${pageName}.html`
        fs.writeFile(categoryPagePath,filteredPage, function(err) {
                if(err) return console.log(err);
                gzipFile(categoryPagePath)
            })
    
    }
    
    let page=eval(indexTemplate)
    console.log("index.html")
    
    fs.writeFile("output/index.html",page, function(err) {
            if(err) return console.log(err);
            gzipFile("output/index.html")
    
        })
    
    const tags = tagList.slice();
    const plats = platformList.slice();
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
    
    const feedOptions = {
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
    
    const date_now = new Date().toUTCString();
    
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
    
    
    for (let i=0;i<Math.min(50,table.length);i++){
        const r = table[i];
        const title = r.TITLE
        // let date = r.DATE
        const icon = r.ICON
        const caption = r.CAPTION
        const desc = r.DESC
        const html = r["WEB-BROWSER"]
        const mac = r.MAC
        const win = r.WIN
        const linux = r.LINUX
        const src = r.SRC
        const src_desc = r["SRC-DESC"]
        const flash = r["FLASH-PLAYER"]
        const zip = r.ZIP
        const unity = r["UNITY PLAYER"]
        const datenum = r.DATENUM
        const pageName = r.PAGENAME
        const niceDate = r.NICEDATE
    
        const splitDate = niceDate.split('/');
        const year = splitDate[0];
        const month = splitDate[1];
        const day = splitDate[2];
        const date = new Date(year,month-1,day)
    
        let itemOptions = {
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
            gzipFile( 'output/feed.rss' )
        })
    
    fs.writeFile('output/feed/index.html',feed_str, function(err) {
            if(err) return console.log(err);
            gzipFile( 'output/feed/index.html' )
        })
    
    console.log(new Date(Date.now()).toLocaleString() + ": finished");
    
    fs.writeFile("slugs_cache.json",JSON.stringify(slugs),function(){});
    
    console.timeEnd('timer')
    }
    
    all()