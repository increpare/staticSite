#! /usr/bin/env node
var gen = require('random-seed')
var exec = require('child_process').execSync

var name = process.argv[2]
var outputPath = process.argv[3]

var rand = gen.create(name);


function randomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[rand(16)];
  }
  return color;
}

var w = 250
var h = 250

var fs = require("fs");
var Canvas = require("canvas");

var canvas = Canvas.createCanvas(w, h, "png");

var g = canvas.getContext("2d");

g.fillStyle = randomColor();
g.fillRect(0, 0, w, h);

var max = 10+rand(5)
for (var i=0;i<max;i++){
	var x1 = rand(w)
	var y1 = rand(h)
	var x2 = rand(w)
	var y2 = rand(h)

	if (x1>x2){
		var t = x1
		x1=x2
		x2=t
	}
	if (y1>y2){
		var t = y1
		y1=y2
		y2=t
	}

	g.fillStyle = randomColor();
	g.fillRect(x1, y1, x2-x1, y2-y1);
}

var buf = canvas.toBuffer();
fs.writeFileSync(outputPath, buf);
exec(`pngquant --skip-if-larger --force --speed 1 --strip --ext .png ${outputPath}`)