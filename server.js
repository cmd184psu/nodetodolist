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


const express = require('express'), app = express(), port = process.env.PORT || 8000;
const bodyParser = require('body-parser');
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

const BASE='.';
const config_in_mem=JSON.parse(fs.readFileSync(BASE+'/data.json', 'utf8'));
//const urlObject=URL.parse(config_in_mem.admin.endpoint);

// if(urlObject.port!=undefined)   adminport=urlObject.port;
// else {
// 	if(urlObject.protocol=="https")   adminport=443;
// 	else   adminport=80;
	
	
// 	console.log("protocol: "+urlObject.protocol);
// 	adminport=443;
// }

function btoa(data) {
	return Buffer.from(data).toString('base64');
}


//var flatdb=__dirname+"/data.json";

if(process.env.BASE!="" && process.env.BASE!=undefined) {
	BASE=process.env.BASE;
}

var flatdb=BASE+"/data.json";

console.log("sending: "+flatdb);
app.get('/config', function(req, res) {
	var content=JSON.parse(fs.readFileSync(flatdb, 'utf8'));
	
	if(process.env.TOPJSON!="" && process.env.TOPJSON!=undefined) {
		content.topjson=process.env.TOPJSON
	}

	if(process.env.JSONREPO!="" && process.env.JSONREPO!=undefined) {
		content.jsonrepo=process.env.JSONREPO
	}

	if(req.query.pretty!=undefined) {
		res.setHeader('Content-Type', 'plain/text');
		res.setHeader('Content-Disposition','inline');
		res.send(JSON.stringify(content,null,3));
	} else {
		res.setHeader('Content-Type', 'application/json');
		res.send(content);
	}
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






app.get("/*", function(request, response) {

	var url=request.url;
	
	var contentType="text/html";	
	if(request.url.toString()=="/") {
		url="/index.html";
		
	} else if(request.url.toString().endsWith(".js")){
		contentType="text/javascript";
	 } else if(request.url.toString().endsWith(".html")){
		contentType="text/html";
	 } else if(request.url.toString().endsWith(".png")){
		contentType="image/png";
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

// console.log("writing file!");
// 	var data=req.body;
// 	fs.writeFile(flatdb, JSON.stringify(data), function (err) {
//     	if( err ) {
//     		console.log( err );
//     	} else {
//     		JSON.stringify(data,null,2);
//     	}
//     });
// 	res.end();

app.listen(port);

console.log('(NodeJS Todolist) RESTful API server started on: ' + port);
