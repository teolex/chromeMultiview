// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const URLS = "urls";
const COLS = "column";

var d		= document;
	d.id	= d.getElementById,
	d.new	= d.createElement;

var g_id,						// global id variable to store selected frame's id number
	prefix = {
		url		: "urltext",
		window	: "window",		// prefix for iframe
		veil	: "veil",		// prefix for dim or veil
		frame	: "frame",		// prefix for wrapper
		close	: "close"
	},
	leftTime = 300,
	timeInterval,
	urlBackup = [];

var frames = d.id("frames");	// wrapper to contain all sub frame
var $left = $("#leftTime");

function _newFrame(id) {
	var frame = d.new("div");						// wrapper of iframe and veil
	frame.className = prefix.frame;					// set class name for this wrapper
	frame.id = prefix.frame+id;						// set id for this wrapper
	return frame;
}
function _newClose(frame) {
	var close = d.new("div");						// delete button for this frame
	close.className	= prefix.close;					// set class name for this delete button
	close.addEventListener("click", function(e) {	// when user clicks this,
		e.stopPropagation();
		//$(frame).remove();							// target frame will be removed.
		g_id = frame.id.replace(/[^\d]/gi, "");		// check the id,
		delFrame();
	});
	return close;
}
function _newWindow(id, url) {
	var wndw	= d.new("iframe");					// new iframe
	wndw.src	= url;								// set src for the new iframe
	wndw.id		= prefix.window+id;					// set id for the new iframe
	return wndw;
}
function _newVeil(id, close) {
	var veil		= d.new("div");					// new dim or veil
	veil.className	= prefix.veil;					// set class name for the veil
	veil.id			= prefix.veil+id;				// set id for the veil
	veil.addEventListener("click", function() {		// when user clicks veil,
		var _frames = $("."+prefix.frame).toArray();
		for( var i in _frames ) {
			_frames[i].style = "display:none;";		// set all frames hidden,
		}

		g_id = this.id.replace(/[^\d]/gi, "");		// check the id,
		var _frame = d.id(prefix.frame+g_id);		// find selected frame,
		_frame.style = "width:100%;height:100%;";	// enlarge selected frame,
		veil.style = "display:none;";				// hide veil to allow user to do whatever they want
	});
	veil.appendChild(close);
	return veil;
}
function _newUrl(id, url) {
	var _url = d.new("input");
	_url.className = prefix.url;
	_url.type = "text";
	_url.value = url;
	_url.readOnly = true;
	return _url;
}
function addFrame(url) {							// Add new sub wrapper containing iframe and veil
	if( !url ) {
		url	= d.id("url").value;					// get value for the src of new iframe
		url = url.startsWith("http") ? url : ("http://" + url);
		urlBackup.push(url);
		localStorage.setItem(URLS, urlBackup.join("@@"));
	}

	var id		= parseInt(Math.random() * 10000);	// random id number
	var frame	= _newFrame(id);
	var close	= _newClose(frame);
	var _url	= _newUrl(id, url);
	var wndw	= _newWindow(id, url);
	var veil	= _newVeil(id, close);
	
	frame.appendChild(_url);
	frame.appendChild(wndw);
	frame.appendChild(veil);
	frames.appendChild(frame);

	d.id("url").value = "";
	setFrameWidth();
}
function seeFrame() {
	$("."+prefix.veil).show();				// make all veil be seen
	$("."+prefix.frame).each(function() {
		this.style = "";					// set the size of all frame as it was
	});
	g_id = "";								// reset global id
}
function printTime() {
	var sec = parseInt(leftTime%60);
	sec = (sec < 10 ? "0" : "") + sec;
	$left.text("Refresh left time - " + parseInt(leftTime/60) + ":" + sec);
}
function refresh() {
	clearInterval(timeInterval);
	leftTime = 300;
	printTime();
	if( $("iframe").length > 0 ) {
		$("iframe").each(function() {
			this.src = this.src;
		});
		timeInterval = setInterval(function() {
			++leftTime;
			printTime();
		}, 1000);
	}
}
function delFrame() {
	$("#"+prefix.frame+g_id).remove();
	var $url = $(".urltext");
	var urls =  [];
	for(var i = 0 ; i < $url.length ; i++) {
		urls.push($url.eq(i).val());
	}
	urlBackup = urls;
	localStorage.setItem(URLS, urlBackup.join("@@"));
}

const $cols = $("#columns select");
function loadFromLS() {
	var cols = localStorage.getItem(COLS);
	$cols.find("option[value="+cols+"]").attr("selected", "selected");

	var tmp = localStorage.getItem(URLS);
	tmp = tmp && tmp.length > 0 ? tmp.split("@@") : [];
	urlBackup = tmp;
	for( var i in urlBackup ) {
		addFrame(urlBackup[i]);
	}

	setFrameWidth(cols);
}
function setFrameWidth(cols) {
	var count = $(".frames .frame").length;
	cols = cols && isFinite(cols) ? cols : $cols.val();
	console.log(cols);

	$(".frames .frame").width(100/cols + "%")
						.height(100/(Math.ceil(count/cols)) + "%");

	var width = $(".frames .frame").eq(0).width();
	$(".frames iframe").width(100*cols + "%")
						.height(100*cols + "%")
						.css({"-webkit-transform":"scale("+(1/cols)+")", "-webkit-transform-origin":"0 0"});

	localStorage.setItem(COLS, cols);
}
{
	var btns = ["addBtn",	"seeBtn",	"refreshBtn",	"delBtn"];
	var fncs = [addFrame,	seeFrame,	refresh,		delFrame];
	for( var i in btns ) {
		document.getElementById(btns[i])
				.addEventListener("click", fncs[i]);
	}

	$("input#url").keypress(function(e) {
		e.keyCode == 13 ? addFrame() : "";
	});

	var interval = setInterval(refresh, 1000 * 5 * 60);
	setInterval(function() {
		if( $("iframe").length > 0 ) {
			leftTime--;
		} else {
			leftTime = 300;
		}
		printTime();
	}, 1000);

	loadFromLS();
	$cols.change(setFrameWidth);
}