---
layout: post
title: "lightcone: prototype 2"
categories: Source "Haskell"
win: ""
mac: ""
linux: ""
flash: ""
zip: ""
src: "http://ded.increpare.com/~locus/lightconehs.zip"
icon: "lightconehs.gif"
caption: "hopefully this won't be my last toying about with Graphics.Rendering.OpenGL"
---
I decided to try doing a one-player prototype of this game, and to do it in haskell this time as an exercise instead of C++. It’s a much more bare-bones things, but might be of interest to some people (requires OpenGL and GLUT to be installed).

In this demo, you are a red or blue block, the enemies are red blocks, moving in various patterns. When you overlap with an enemy block, your colour changes.

I’m not bothering with a binary distribution, but I’ve thrown up the source
	