// Copyright (c) 2020 C Delezenski <cmd184psu@gmail.com>
//  
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//  
//      http://www.apache.org/licenses/LICENSE-2.0
//  
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

require("dotenv").config();


const express = require('express'), app = express(), port = process.env.PORT || 8000;
const bodyParser = require('body-parser');
const  glob = require('glob')
let path = require('path');  
const fs = require("fs");
const https = require('https');
const URL = require('url');


app.use(express.static(path.join(__dirname, 'data')));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//5 minutes
const apiTimeout = 5*60000;
app.timeout=apiTimeout;
https.timeout=apiTimeout;


app.use((req, res, next) => {
    // Set the timeout for all HTTP requests
    req.setTimeout(apiTimeout, () => {
        let err = new Error('Request Timeout');
        err.status = 408;
        next(err);
    });
    // Set the server response timeout for all HTTP requests
    res.setTimeout(apiTimeout, () => {
        let err = new Error('Service Unavailable');
        err.status = 503;
        next(err);
    });
    next();
});

const BASE=process.env.BASE || '.';
var config=JSON.parse(fs.readFileSync(BASE+'/data.json', 'utf8'));

function btoa(data) {
	return Buffer.from(data).toString('base64');
}

function prettyPrint(req, res, content) {
	res.setHeader('Content-Type', 'application/json');
	if(req.query!=undefined && req.query.pretty!=undefined) {
		res.setHeader('Content-Type', 'text/plain');
//		res.setHeader('Content-Disposition','inline');
		res.send(JSON.stringify(content,null,3));
	} else {
		res.send(content);
	}
}

var flatdb=BASE+"/data.json";

console.log("sending: "+flatdb);
app.get('/config', function(req, res) {
	config=JSON.parse(fs.readFileSync(flatdb, 'utf8'));
	
	var content=new Object
	content.defaultSubject=config.defaultSubject || process.env.DEFAULTSUBJECT || "home"

	content.index=config.index || process.env.INDEX || "todo.html" //todo.html or slideshow.html
	content.prefix=config.prefix || process.env.PREFIX || "lists" //list or nt
	content.ext=config.ext || process.env.EXT || "json" //json or jpg

	var di=config.defaultItem || process.env.DEFAULTITEM || ""

	//if config and env have nothing for defaultsubject, we need to infer from defaultitem
	if(config.defaultSubject==undefined && process.env.DEFAULTSUBJECT==undefined && di.includes("/")) {
		content.defaultSubject=di.split('/')[0]
		content.defaultItem=di
	} else {
		content.defaultItem=config.defaultItem || process.env.DEFAULTITEM || content.defaultSubject+"/index."+content.ext
	}

	content.autosave=config.autosave || process.env.AUTOSAVE

	if(process.env.TODO!="" && process.env.TODO!=undefined) {
		content.todo=(process.env.TODO=="true")
	}
	prettyPrint(req,res,content)
	res.end();
});

app.post('/config', function(req, res) {
	console.log("writing file!");
	var data=req.body;
	fs.writeFile(flatdb, JSON.stringify(data), function (err) {
    	if( err ) {
    		console.log( err );
    	} else {
    		JSON.stringify(data,null,2);
    	}
    });
	res.end();

});

const rejects = new Set(['#recycle','css', 'js', 'node_modules', 'nodestuff', 'webfonts'])


app.get('/subjects/:subject',function(req,res) {
	console.log("/subjects/{subject}")
	var rootdir=process.env.PREFIX || 'nt'
	var ext=process.env.EXT || 'jpg'

	if(req.params!=undefined && req.params.subject!=undefined) {
		//single subject use case
		var entries=[]
		entries=glob.sync(rootdir+'/'+req.params.subject+'/*.'+ext).map(f => f.substr(rootdir.length+1))
		prettyPrint(req,res,entries)
		res.end();
	} else {
		//send all subjects
		const subjects = fs.readdirSync(rootdir); 
		var dirlist=[];

		console.log("directories:"); 
		subjects.forEach(subject => { 
			if(!rejects.has(subject) && fs.statSync(rootdir+'/'+subject).isDirectory()) {
				var item=new Object;
				item.subject=subject;
				item.entries=[];
				dirlist.push(item)
			}
		})
		prettyPrint(req,res,dirlist)
		
	}
	res.end();
})


app.get('/items',function(req,res) {
	var rootdir=process.env.PREFIX || 'lists'

	var ext=process.env.EXT || 'json'

	const subjects = fs.readdirSync(rootdir); 
	var dirlist=[];

	console.log("directories:"); 
	subjects.forEach(subject => { 
		if(!rejects.has(subject) && !subject.startsWith("_") && fs.statSync(rootdir+'/'+subject).isDirectory()) {
			var item=new Object;
			item.subject=subject;
			item.entries=[];
			dirlist.push(item)
		}
	})
	for(var i=0; i<dirlist.length; i++) {
		dirlist[i].entries=glob.sync(rootdir+'/'+dirlist[i].subject+'/*.'+ext).map(f => f.substr(rootdir.length+1))
	}
	prettyPrint(req,res,dirlist)
	
	res.end();
})




app.get("/*", function(request, response) {

	var url=request.url;
	
	var index_html="/index.html";

	if(process.env.INDEX!="" && process.env.INDEX!=undefined) {
		index_html=process.env.INDEX;
	}

	var contentType="text/plain";	
	if(request.url.toString()=="/") {
		url=index_html;
		contentType="text/html";
	} else if(request.url.toString().endsWith(".js")){
		contentType="text/javascript";
	} else if(request.url.toString().endsWith(".json")){
		contentType="application/json";
	 } else if(request.url.toString().endsWith(".html")){
		contentType="text/html";
	 } else if(request.url.toString().endsWith(".png")){
		contentType="image/png";
	} else if(request.url.toString().endsWith(".jpg")){
		contentType="image/jpg";
	} else if(request.url.toString().endsWith(".woff")){
		contentType="font/woff";
	 } else if(request.url.toString().endsWith(".woff2")){
		contentType="font/woff2";
	} else if(request.url.toString().endsWith(".tff")){
		contentType="font/ttf";
	} else if(request.url.toString().endsWith(".css")){
		contentType="text/css";
	} 
	console.log("Requested URL is: " + url + " with contentType "+contentType);
	sendFileContent(response, url.toString().substring(1), contentType);
})

function sendFileContent(response, fileName, contentType){
	fs.readFile(fileName, function(err, data){
		if(err){
			response.writeHead(404);
			response.write("Not Found!");
		}
		else{
			response.writeHead(200, {'Content-Type': contentType});
			response.write(data);
		}
		response.end();
	});
}

app.post("/*", function(request, response) {

	var url=request.url;
	
	var data=request.body;

	console.log("writing to "+url);

	console.log(JSON.stringify(data,null,3));


 	fs.writeFile('.'+url, JSON.stringify(data,null,3), function (err) {
     	if( err ) {
     		console.log( err );
     	} else {
     		JSON.stringify(data,null,2);
     	}
     });
	response.end();

})

app.listen(port);

console.log('(NodeJS Todolist) RESTful API server started on: ' + port);
