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


var express = require('express'), app = express(), port = process.env.PORT || 8989;

var bodyParser = require('body-parser');
let path = require('path');  
var fs = require("fs");


const https = require('https');

//var multer  = require('multer');

var reportObject=[];

var ro_index=0;

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


var events = require("events");
var emitter = new events.EventEmitter();

const BASE='.';
const config_in_mem=JSON.parse(fs.readFileSync(BASE+'/data.json', 'utf8'));

console.log("ep: "+config_in_mem.admin.endpoint);


const URL = require('url');


const urlObject=URL.parse(config_in_mem.admin.endpoint);

if(urlObject.port!=undefined)   adminport=urlObject.port;
else {
	if(urlObject.protocol=="https")   adminport=443;
	else   adminport=80;
	
	
	console.log("protocol: "+urlObject.protocol);
	adminport=443;
}

function btoa(data) {
	return Buffer.from(data).toString('base64');
}


//var flatdb=__dirname+"/data.json";
var flatdb=BASE+"/data.json";

console.log("sending: "+flatdb);
app.get('/config', function(req, res) {
	//res.sendFile(flatdb);
	
	var content=JSON.parse(fs.readFileSync(flatdb, 'utf8'));


	
	//res.setHeader("Content-Type:","plain/text");
	//Content-Type: application/octet-stream
	//res.send(JSON.stringify(JSON.parse(content),null,3));
	
	//console.log(JSON.parse(content));

	//res.send(content);
	if(req.query.pretty!=undefined) {
		//res.setHeader('Content-Type', 'text/html');
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
	
	if(data.chapters[0].enabled) console.log("ex1 true"); else console.log("ex1 false");
	
	fs.writeFile(flatdb, JSON.stringify(data), function (err) {
    	if( err ) {
    		console.log( err );
    	} else {
    		JSON.stringify(data,null,2);
    	}
    });
	res.end();

});


function admin_end(inReq, inRes, result) {
	//Announce("admin_end");
	inRes.send(JSON.stringify(result));
 	inRes.end();
}

function GetAuth(inReq) {
	var auth='Basic '+config_in_mem.admin.auth;

	if(inReq.headers.authorization!=undefined) {
		auth=inReq.headers.authorization;
	}	
	console.log("using auth="+auth);
	console.log("not using auth=Basic "+config_in_mem.admin.auth);
	console.log("using hostname="+urlObject.hostname);
	console.log("using port="+adminport);
	return auth;
}

var getAdminAPIJSON = function(pt, label, url) {
	var promise = new Promise(function(resolve, reject) {
	
		console.log("url="+url);
		console.log("pt.auth="+pt.auth);
		var method='GET';
		
		if(pt.m=="POST") method='POST';
		//var auth=GetAuth();
		const options = {
			hostname: urlObject.hostname,
			path: url,
			method: method,
			headers: {
				'Authorization': pt.auth
			},
			port: adminport,
			rejectUnauthorized: false,
			resolve: resolve,
			reject: reject,
			index: label
		}
		
		const req = https.request(options, (resp) => {
			let data = '';
			console.log("reading...");
			resp.on('data', (chunk) => { data += chunk; });
			resp.on('end', () => {
				console.log("status = "+resp.statusCode);
				
				options.resolve({ "results" : JSON.parse(data), "label" : label, "pt" : pt });
			});
		}).on("error", (err) => { console.log("there was an error thrown\nError: " + err.message); options.reject("error");  });
	
		req.end();
	});
	
	
	return promise;
};

var getBucketListForGroup= function(pt) {
	console.log("\tgroupId="+pt.groupId);
	return getAdminAPIJSON(pt, "bucketlist" ,'/system/bucketlist?groupId='+pt.groupId);
}

var getBucketDetailsForUser= function(pt) {
	console.log("GET bucketlist for group");
	console.log("\tgroupId="+pt.groupId);
	console.log("\tbucket="+pt.bucket);
	return getAdminAPIJSON(pt, "bucketdetails" ,'/usage/repair/bucket?bucket='+pt.bucket);
}


app.get('/report', function(inReq, inRes) {
	//if(inReq.query.format!=undefined && inReq.query.format=="csv") {
	//	inRes.ContentType="plain/text";
	//}
	
	promises=[];
	resultObject=[];
	
	totalBuckets=0;
//	promises.push(new Promise(function(resolve) { setTimeout(function() { resolve("toast"); }, 1000); } ));
	
	promisesunknown=true;


	var auth=GetAuth(inReq);
	
	
	console.log("auth="+auth);
	
	
	var P0=getAdminAPIJSON({ "inRes" : inRes, "auth" : auth },"grouplist","/group/list").then(function(glresult) {
		
		//console.log(glresult);
		
		
		for(var i=0; i<glresult.results.length; i++) {
			console.log("i="+(i+1)+ " of "+glresult.results.length);
				
			var P=getBucketListForGroup( { "groupId" : glresult.results[i].groupId, "inRes" : glresult.pt.inRes, "auth" : glresult.pt.auth })		
				.then(function(blresult) {
				
						console.log("==== after bucketlistforgroup ====");
					//var promise = new RSVP.Promise(function(resolve, reject) {
						//console.log(JSON.stringify(blresult,null,3));
						console.log("groupId="+blresult.pt.groupId);
						
						console.log("rlen="+blresult.results.length);
						for(var j=0; j<blresult.results.length; j++) {
							console.log("working on user/bucket list result "+(j+1)+" of "+blresult.results.length);
						
						
							var userId=blresult.results[j].userId;
							for(var k=0; k<blresult.results[j].buckets.length; k++) {
															//initial gl, u/b list once per group and then bucket details, once per bucket; 
								console.log("\t(inner loop) working on bucket list result "+(k+1)+" of "+blresult.results[j].buckets.length);
							
							
								console.log("userId="+userId+", groupId="+blresult.pt.groupId+", bucket="+blresult.results[j].buckets[k].bucketName);
								totalBuckets++;
								var P2=getBucketDetailsForUser({ "m" : "POST", "userId" : userId, "groupId" :  blresult.pt.groupId, "bucket" : blresult.results[j].buckets[k].bucketName, "inRes" : blresult.pt.inRes, "auth" : blresult.pt.auth })
									.then(function(bdresult) {
										console.log("=====bucket detail results====");
										//bucket detail results
										console.log(JSON.stringify(bdresult.results,null,3));
										console.log("groupId="+bdresult.pt.groupId);
										console.log("userId="+bdresult.pt.userId);
										console.log("bucket="+bdresult.pt.bucket);
										console.log("TO="+bdresult.results.TO);
										console.log("TB="+bdresult.results.TB);
										//bdresult.pt.inRes.send({ "groupId" : bdresult.pt.groupId, "userId" : bdresult.pt.userId, "bucket" : bdresult.pt.bucket, "TO" : bdresult.results.TO, "TB" : bdresult.results.TB });
										resultObject.push( { "groupId" : bdresult.pt.groupId, "userId" : bdresult.pt.userId, "bucket" : bdresult.pt.bucket, "TO" : bdresult.results.TO, "TB" : bdresult.results.TB });
										
										
										
										
										if(!promisesunknown && resultObject.length==totalBuckets) {
										
											console.log("resultObject.length=="+totalBuckets);
											setTimeout(function() { emitter.emit("promisesKept"); }, 30000);
										}
									});
								promises.push(P2);		
								console.log("promises made: "+promises.length);
								
								
								console.log("i="+i+" "+glresult.results.length+", j="+j+" "+blresult.results.length+", k="+k+" "+blresult.results[j].buckets.length);
								if(promisesunknown && j==blresult.results.length-1 && k==blresult.results[j].buckets.length-1) {
									console.log("initial gl: 1");
									console.log("total groups: "+glresult.results.length);
									
									
									
									console.log("total buckets (looped) "+totalBuckets);
									console.log("total expected promises is initial gl (1) + gl length (once per group for bucketlist), + total buckets: "+(1+glresult.results.length+totalBuckets));
									console.log("expected promises: "+(1+glresult.results.length+totalBuckets));
									if(promises.length==(1+glresult.results.length+totalBuckets)) {  promisesunknown=false; }
								} else {
									console.log("\t\t\t====>rejected!");
								}
			
								
							} //end for k		
							 			
						} //end for j
						
						
						
						
						//return promise;
						//console.log("group="+resultObject[blresult.index].groupId);
					}); //end then
					//return promise;
			
			promises.push(P);
			console.log("final promises made: "+promises.length);
			//console.log("promise count="+promises.length);
			
			
			
				
		} //end for i
		
		
		promises.push(P0);	
		console.log("final promises made: "+promises.length);
		
		
		
	}).then(function() {	
	
	
		
		emitter.once("promisesKept", function() {
			console.log("!!!!!!!!!! FIRING EMITTER !!!!!!!!!!!!");
			Promise.all(promises).then(function(posts) {
					console.log("processing all promises now...");
		
					console.log(JSON.stringify(posts,null,3));
			
		
					console.log("about to send result");
					
					console.log("---promises kept---");
					console.log(JSON.stringify(resultObject,null,3));
					
					console.log("------------");
					console.log(JSON.stringify(inReq.query,null,3));
					console.log("------------");
					
					
					if(inReq.query.format!=undefined && inReq.query.format=="csv") {
						var content="";
						for(var ii=0; ii<resultObject.length; ii++) {
								content+=resultObject[ii].groupId+","
										+resultObject[ii].userId+","+resultObject[ii].bucket
										+","+resultObject[ii].TO+","+resultObject[ii].TB+"\n";
						}
						inRes.send(content);
					} else {
						inRes.send(resultObject);
					}
					inRes.end();

//					console.log(JSON.stringify(resultObject,null,3));
					
//					inRes.send(resultObject);
//					inRes.end();
					
			});
		});
	
			
			
		
	}).catch(function(error) {
  		// handle errors
	
		console.log("ERR! "+error);
		inRes.end();
		
	});
	
	console.log("it's over!");
}); // end app.get /report


function getAdminAjax(method,auth, url) {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: urlObject.hostname,
			path: url,
			method: method,
			headers: {
				'Authorization': auth
			},
			port: adminport,
			rejectUnauthorized: false,
			
		}
		
		const req = https.request(options, (resp) => {
			let data = '';
			console.log("reading...");
			resp.on('data', (chunk) => { data += chunk; });
			resp.on('end', () => {
				console.log("status = "+resp.statusCode);
				if(resp.statusCode==200) resolve(JSON.parse(data));
				else reject({ "error" : "error" }); 
			});
		}).on("error", (err) => { console.log("there was an error thrown\nError: " + err.message); reject("error");  });
	
		req.end();

    });
}

//generate a report for a particular group
async function generateGroupReport(inReq, inRes) {
	try {
		var auth=GetAuth(inReq);
		
		var resultObject=[];
		//step 1, get list of groups
		
		
		
		
		
		const groupId=inReq.query.groupId;

		console.log('GET /system/bucketlist?groupId='+groupId);
		var userBucketList = await getAdminAjax('GET',auth,'/system/bucketlist?groupId='+groupId);
		if(userBucketList!=undefined) {
			console.log("\tthis group has "+userBucketList.length+" users with buckets");
			for(var j=0; j<userBucketList.length; j++) {
				if(userBucketList[j].buckets!=undefined) {
					for(var k=0; k<userBucketList[j].buckets.length; k++) {
						if(userBucketList[j].buckets[k].bucketName!=undefined) {
							console.log('POST /usage/repair/bucket?bucket='+userBucketList[j].buckets[k].bucketName);
							try {
								var bucketResults= await getAdminAjax('POST',auth,'/usage/repair/bucket?bucket='+userBucketList[j].buckets[k].bucketName);
								resultObject.push( { "groupId" : groupId, "userId" : userBucketList[j].userId, "bucket" : userBucketList[j].buckets[k].bucketName, "TO" : bucketResults.TO, "TB" : bucketResults.TB });
							} catch(error) {
								resultObject.push( { "groupId" : groupId, "userId" : userBucketList[j].userId, "bucket" : userBucketList[j].buckets[k].bucketName, "TO" : -1, "TB" : -1 });
							}
						}
					} // end for k
				}
			} // end for j
		} else {
			console.log("\tthis group has no users with buckets");
		}
		if(inReq.query.format!=undefined && inReq.query.format=="csv") {
			var content="";
			for(var ii=0; ii<resultObject.length; ii++) {
					content+=resultObject[ii].groupId+","
							+resultObject[ii].userId+","+resultObject[ii].bucket
							+","+resultObject[ii].TO+","+resultObject[ii].TB+"\n";
			}
			inRes.send(content);
		} else {
			inRes.send(JSON.stringify(resultObject,null,3));
		}
		
		//inRes.send(resultObject);
		inRes.end();
	} catch(error) {
  		// handle errors
		console.log("ERR! "+error);
		inRes.end();
	}
	console.log("it's over!");
}


app.get('/groupReport', function(inReq, inRes) { generateGroupReport(inReq, inRes); });



async function generateReport(inReq, inRes) {
	try {
		var auth=GetAuth(inReq);
		
		var resultObject=[];
		//step 1, get list of groups
        const groupList = await getAdminAjax('GET',auth,'/group/list');
        console.log('SHOULD WORK:');
        console.log(JSON.stringify(groupList,null,3));


    //    inRes.send(JSON.stringify(groupList,null,3));


		for(var i=0; i<groupList.length; i++) {
			console.log("i="+(i+1)+ " of "+groupList.length);
			console.log("groupId["+i+"]="+groupList[i].groupId);
			var userBucketList = await getAdminAjax('GET',auth,'/system/bucketlist?groupId='+groupList[i].groupId);
			
			console.log('GET /system/bucketlist?groupId='+groupList[i].groupId);
			
			if(userBucketList!=undefined) {
				console.log("\tthis group has "+userBucketList.length+" users with buckets");
				for(var j=0; j<userBucketList.length; j++) {
					if(userBucketList[j].buckets!=undefined) {
						for(var k=0; k<userBucketList[j].buckets.length; k++) {
							if(userBucketList[j].buckets[k].bucketName!=undefined) {
								console.log('POST /usage/repair/bucket?bucket='+userBucketList[j].buckets[k].bucketName);
								try {
									var bucketResults= await getAdminAjax('POST',auth,'/usage/repair/bucket?bucket='+userBucketList[j].buckets[k].bucketName);
									resultObject.push( { "groupId" : groupList[i].groupId, "userId" : userBucketList[j].userId, "bucket" : userBucketList[j].buckets[k].bucketName, "TO" : bucketResults.TO, "TB" : bucketResults.TB });
								} catch(error) {
									resultObject.push( { "groupId" : groupList[i].groupId, "userId" : userBucketList[j].userId, "bucket" : userBucketList[j].buckets[k].bucketName, "TO" : -1, "TB" : -1 });
								}
							}
						} // end for k
					}
				} // end for j
			} else {
				console.log("\tthis group has no users with buckets");
			}
		} //end for i
		
		
		
		if(inReq.query.format!=undefined && inReq.query.format=="csv") {
			var content="";
			for(var ii=0; ii<resultObject.length; ii++) {
					content+=resultObject[ii].groupId+","
							+resultObject[ii].userId+","+resultObject[ii].bucket
							+","+resultObject[ii].TO+","+resultObject[ii].TB+"\n";
			}
			inRes.send(content);
		} else {
			inRes.send(JSON.stringify(resultObject,null,3));
		}
		
		
		//inRes.send(JSON.stringify(resultObject,null,3));
		inRes.end();
	} catch(error) {
  		// handle errors
		console.log("ERR! "+error);
		inRes.end();
	}
	console.log("it's over!");
}


app.get('/report2', function(inReq, inRes) { generateReport(inReq, inRes); });











app.get('/authtest', function(inReq, inRes) {


	const base64Credentials =  inReq.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
	
	const nuser="sysadmin";
	const npwd="public";
	var auth='Basic '+btoa(nuser+":"+npwd);
	
	//if(username!="sysadmin
	
	
	console.log("auth (calc):"+auth);
	console.log("user (calc)=sysadmin");
	console.log("password (calc)=public");

	console.log("auth (head):"+inReq.headers.authorization);
	console.log("user (head)="+username);
	console.log("password (head)="+password);
	console.log("auth (rehash): Basic "+btoa(username+":"+password));

	inRes.end();
});

app.get('/group/list', function(inReq,inRes) {
	console.log("==== /group/list =====");
	var groupListObject;
	var auth=GetAuth(inReq);

	const options = {
		hostname: urlObject.hostname,
		path: '/group/list',
		method: 'GET',
		headers: {
			'Authorization': auth
		},
		port: adminport,
		rejectUnauthorized: false
	}
	
	var result={};

	console.log("GET "+options.path);
	
	console.log(JSON.stringify(options,null,3));
	
	const req = https.request(options, (resp) => {
		let data = '';
		console.log("reading...");
		resp.on('data', (chunk) => {
			data += chunk;
		});
		
		resp.on('end', () => {
			console.log(data);
			console.log("status = "+resp.statusCode);
			
			inRes.send(JSON.parse(data));
		 	inRes.end();

		});
	}).on("error", (err) => {
		console.log("there was an error thrown");
		console.log("Error: " + err.message);
		inRes.send(JSON.stringify(result));
	 	inRes.end();

	});
	req.end();
});

app.get('/system/bucketlist', function(inReq, inRes) {

	var bucketListObject;
	console.log("GET /system/bucketlist?groupId="+inReq.query.groupId);
	var auth=GetAuth(inReq);

	const options = {
		hostname: urlObject.hostname,
		path:  '/system/bucketlist?groupId='+inReq.query.groupId,
		method: 'GET',
		headers: {
			'Authorization': auth
		},
		port: adminport,
		rejectUnauthorized: false
	}
	
	var result={};

	console.log("GET "+options.path);
	
	const req = https.request(options, (resp) => {
		let data = '';
		console.log("reading...");
		resp.on('data', (chunk) => {
			data += chunk;
		});
		
		resp.on('end', () => {
			console.log(data);
			console.log("status = "+resp.statusCode);
			
			inRes.send(JSON.parse(data));
		 	inRes.end();

		});
	}).on("error", (err) => {
		console.log("there was an error thrown");
		console.log("Error: " + err.message);
		inRes.send(JSON.stringify({}));
	 	inRes.end();

	});
	req.end();



});

/*

[
  {
    "averageValue": "107956",
    "bucket": null,
    "count": "744",
    "groupId": "QA",
    "ip": "",
    "maxValue": "305443",
    "operation": "SB",
    "region": "taoyuan",
    "timestamp": "1498867200000",
    "uri": "",
    "userId": "*",
    "value": "80319535",
    "whitelistAverageValue": "0",
    "whitelistCount": "0",
    "whitelistMaxValue": "0",
    "whitelistValue": "0"
  }
]*/


var getUsageRepairBucket=function(inReq, inRes) {

 	var bucketUsageObject;
	var auth=GetAuth(inReq);
	
	const options = {
		hostname: urlObject.hostname,
		path:  '/usage/repair/bucket?bucket='+inReq.query.bucket,
		method: 'POST',
		headers: {
			'Authorization': auth
		},
		port: adminport,
		rejectUnauthorized: false
	}

	
	var result={};

	console.log("GET "+options.path);
	
	const req = https.request(options, (resp) => {
		let data = '';
		console.log("reading...");
		resp.on('data', (chunk) => {
			data += chunk;
		});
		
		resp.on('end', () => {
			console.log(data);
			console.log("status = "+resp.statusCode);
			
			inRes.send(JSON.parse(data));
		 	inRes.end();

		});
	}).on("error", (err) => {
		console.log("there was an error thrown");
		console.log("Error: " + err.message);
		inRes.send(JSON.stringify({}));
	 	inRes.end();

	});
	req.end();
	
}

app.get('/usage/repair/bucket', getUsageRepairBucket);
app.post('/usage/repair/bucket', getUsageRepairBucket);

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

app.listen(port);

console.log('(NodeJS Todolist) RESTful API server started on: ' + port);
