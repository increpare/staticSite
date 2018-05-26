#!/usr/bin/env node
glob = require("glob")
fs = require("fs")
const jsdom = require('jsdom')
const {JSDOM} = jsdom
var dateFormat = require('dateformat');
var url = require("url");
var path = require("path");
var excel = require('excel4node');

var getDirectories = function (src) {
  return glob.sync(src + '/*/*/*/*.html');
};

var dirs = getDirectories('www.increpare.com');


var workbook = new excel.Workbook();
var worksheet = workbook.addWorksheet('Sheet 1');

// Create a reusable style
var style = workbook.createStyle({
  font: {
    color: '#FF0800',
    size: 12
  },
  numberFormat: '$#,##0.00; ($#,##0.00); -'
});

worksheet.cell(1,1).string("TITLE");
worksheet.cell(1,2).string("DATE");
worksheet.cell(1,3).string("ICON");
worksheet.cell(1,4).string("CAPTION");
worksheet.cell(1,5).string("DESC");

for (var i=0;i<dirs.length;i++) {
	var pfad = dirs[i];
	console.log(pfad)
	var s = fs.readFileSync(pfad,'utf-8');
	var result;

	const dom = new JSDOM(s);

	global.window = dom.window
	global.document = window.document

	var title = document.getElementsByClassName("entry-title")[0].innerHTML;
	// console.log(title.innerHTML);

	var imgname="";
	var caption="";

	var floatright = document.getElementsByClassName("floatright")[0];
	if (floatright){
		imgurl = floatright.children[0].getAttribute("src")
		var img_url = url.parse(imgurl);
		// console.log(img_url);
		var imgname = path.basename(img_url.path);
		// console.log(imgname);

		var capresult = document.getElementsByClassName("imagecaption");
		if (capresult.length>0){
			caption = capresult[0].innerHTML;
		}
		// console.log(caption);
	}

	var desc = document.getElementsByClassName("entry-content")[0].innerHTML;
	// console.log(desc);

	var date_str_orig = document.getElementsByClassName("published")[0].getAttribute("title");
	var date_date = new Date(date_str_orig)
	date_str = dateFormat(date_date, "yyyy/mm/dd");
	// console.log(date_str)

	worksheet.cell(2+i,1).string(title);
	worksheet.cell(2+i,2).string(date_str);
	worksheet.cell(2+i,3).string(imgname);
	worksheet.cell(2+i,4).string(caption);
	worksheet.cell(2+i,5).string(desc);
	// break;
	
}

workbook.write('bla.xlsx');
