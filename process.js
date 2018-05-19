#! /usr/bin/env node


// STEP 1 : generate folders

var exec = require('child_process').exec;
exec("rm -rf bin/");
exec("mkdir bin");
exec("mkdir bin/games");

// STEP 2 : read in CSV

function filenameify(s){
	return s.replaceAll("\\W+", "").toLowerCase();
}

var fs = require('fs')

var content = fs.readFileSync('database/table.csv','utf8')

var rows =  content.split("\r")

var table = rows.map( r => r.split(";").map( s => s.trim().replace(/±/gi,';'))  )

// STEP 3 : generate sub files
for (var i=0;i<table.legth;i++){
	var r = table[i];
	var title = r[0];
	var date = r[1];
	var icon = r[2];
	var caption = r[3];
	var desc = r[4];
	var html = r[5];
	var mac = r[6];
	var win = r[7];
	var linux = r[8];
	var src = r[9];
	var src_desc = r[10];
	var flash = r[11];
	var zip = r[12];
}