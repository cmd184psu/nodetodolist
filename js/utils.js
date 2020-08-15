
const BASE='jsonrepo/'
var currentFilename="";
var maxVotes=0;
function LoadFile(filename) {
	return new Promise((resolve, reject) => {
		$.get("/"+BASE+filename,"", function(result) { resolve(result); });
    });
}

//FIXME: incomplete!
function SaveFile(filename) {
    console.log("SaveFile("+filename+");");

    console.log(JSON.stringify(arrayOfContent,null,3));
    for(var i=0; i<arrayOfContent.length; i++) {
        arrayOfContent[i].vote=0;
    }

    $.ajax({
		url: '/'+BASE+filename,
		type: 'post',
		dataType: 'text',
		contentType: 'application/json',
		success: function (data) {
			console.log(JSON.stringify(data));
			//$("#saveload-content-changeme").html("<strong>Saved</strong>");
			//setTimeout(function() { onClickCloseSaveLoadDialog() }, SAVE_LOAD_DIALOG_DELAY); //done
        },
        data: JSON.stringify(arrayOfContent),
        error: function(data){
            alert('error');
        	console.log(JSON.stringify(data,null,3));
        }

    }).done(function(data) {
    		//$("#saveload-content-changeme").html("<strong>Saved</strong>");
			console.log("done");
			//setTimeout(function() { onClickCloseSaveLoadDialog() }, SAVE_LOAD_DIALOG_DELAY); //done
    });
}

function calcValue(v,tv) {
    return v/tv;
}

function TotalValue(list) {
    var totalValue=0;
    for(var i=0; i<list.length; i++) {
	    totalValue+=list[i].currentWeight;
    }
    return totalValue;
}

function TotalVotes(list) {
    var totalVotes=0;
    for(var i=0; i<list.length; i++) {
	    totalVotes+=list[i].votes;
    }
    return totalVotes;
}

function skipit(i) {
    arrayOfContent[i].skip=true;
    render();
}

function dontskipit(i) {
    arrayOfContent[i].skip=false;
    render();
}

function deleteit(i) {
    arrayOfContent.splice(i,1);  
    render();
}

function addIt() {
    console.log("add new item");
    var object={};

    object.name=$("#itemName").val();
    object.currentWeight=$("#itemWeight").val();
    object.resetWeight=$("#itemWeight").val();
    object.votes=0;
    object.skip=false;

    arrayOfContent.push(object);

    $("#itemName").val("");
    $("#itemWeight").val(0);
    render();
}

function moveUp(i) {
    if(i==0) {
        console.log("already at end of list");
    } else {
        console.log("move i="+i+" to "+(i-1));

        var temp=arrayOfContent[i];
        arrayOfContent[i]=arrayOfContent[i-1];
        arrayOfContent[i-1]=temp;
        render();
    }
}
function moveDown(i) {
    if(i==arrayOfContent.length-1) {
        console.log("already at end of list");
    } else {
        console.log("move i="+i+" to "+(i+1));
        var temp=arrayOfContent[i];
        arrayOfContent[i]=arrayOfContent[i+1];
        arrayOfContent[i+1]=temp;
        render();
    }
}

function resetWeight(i) {
    arrayOfContent[i].currentWeight=arrayOfContent[i].resetWeight;
    render();
}

function renderRow(i) {
    //add delete column
    //var row="<td name=\"delcol\"><button onclick=\"deleteit("+i+")\">Delete</button></td>";
    var row="";
    var trophy="";

    if(arrayOfContent[i].votes==maxVotes) {
        trophy="<td><i class=\"fas fa-trophy\"></i></td>";
        arrayOfContent[i].currentWeight--;
        if(arrayOfContent[i].currentWeight==0) arrayOfContent[i].skip=true;
    }


    var updown="<table><tr>";
    updown+="<td><span onclick=\"moveUp("+i+")\"><i class=\"fas fa-angle-double-up\"></i></span></td>";
    updown+="<td><span onclick=\"moveDown("+i+")\"><i class=\"fas fa-angle-double-down\"></i></span></td>";
    updown+="<td><span onclick=\"deleteit("+i+")\"><i class=\"fa fa-trash\"></i></td>";
    updown+="<td>"+trophy+"</td>";
    updown+="</tr></table>";

    //add checkbox
    if(arrayOfContent[i].skip) {
        row="<td><input type=\"checkbox\" checked onclick=\"dontskipit("+i+")\"/></td>";
        row+="<td>"+updown+"</td>";
        row+="<td>"+(i+1)+"</td>";
        row+="<td><strike>"+arrayOfContent[i].name+"</strike></td>";
    } else {
        row="<td><input type=\"checkbox\" onclick=\"skipit("+i+")\"/></td>";
        row+="<td>"+updown+"</td>";
        row+="<td>"+(i+1)+"</td>";
        if(arrayOfContent[i].json!=undefined) {
            row+="<td><a href=\"javascript:SaveAndLoad('"+arrayOfContent[i].json+"')\">"+arrayOfContent[i].name+"</a></td>";
        } else {
            row+="<td>"+arrayOfContent[i].name+"</td>";
        }
    }
    

    //add vote count
    row+="<td>"+arrayOfContent[i].votes+"</td>";


    if(arrayOfContent[i].value!=undefined) {
        arrayOfContent[i].resetWeight=arrayOfContent[i].value;
        arrayOfContent[i].currentWeight=arrayOfContent[i].value;
        arrayOfContent[i].value=undefined;
    }

    //add weight
    row+="<td><table><tr><td width=60px>"+arrayOfContent[i].currentWeight+"/"+arrayOfContent[i].resetWeight+"&nbsp;</td><td><span onclick=\"resetWeight("+i+")\"><i class=\"fas fa-sync\"></i></span></td></tr></table></td>";

    


    return "<tr>"+row+"</tr>";
}

function vote() {
    //clear the vote
    for (var i = 0; i < arrayOfContent.length; i++) {
        arrayOfContent[i].votes=0;
    }

    //if($('#voteCount').val()!=0) total_vote_count=$('#voteCount').val();
    //else 
    total_vote_count=100;

    var rand = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
 
    var generateWeightedList = function(list) {
        var tv=TotalValue(list);
        var weighted_list = [];
        console.log("list length="+list.length);
        // Loop over weights
        for (var i = 0; i < list.length; i++) {
            if(!list[i].skip) {
                var multiples = calcValue(list[i].currentWeight,tv) * 100;
                console.log("list["+i+"].name="+list[i].name+" cw="+list[i].currentWeight);
                console.log("multiples="+multiples);
                // Loop over the list of items
                for (var j = 0; j < multiples; j++) {
                    weighted_list.push(list[i].name);
                }
            }
        }
        return weighted_list;
    };

    //var list = ['javascript', 'php', 'ruby', 'python'];
    //var weight = [0.5, 0.2, 0.2, 0.1];
    var weighted_list = generateWeightedList(arrayOfContent);

    console.log(weighted_list.length);
    var random_num = 0;
    var extra=0;
    var t=total_vote_count;
    for(var i=0; i<total_vote_count && weighted_list.length>0; i++) {
        random_num=rand(0, weighted_list.length-1);
    	for(var j=0; j<arrayOfContent.length; j++) {
            // console.log("vote for "+weighted_list[random_num]);
            if(arrayOfContent[j].skip && arrayOfContent[j].name==weighted_list[random_num]) {
                extra++;
                weighted_list.splice(random_num,1);
            } else if(arrayOfContent[j].name==weighted_list[random_num] && !arrayOfContent[j].skip && arrayOfContent[j].currenWeight!=0) {
                arrayOfContent[j].votes++;
            }
        }
        if(extra==t) total_vote_count=-1;
        else {
            total_vote_count+=extra;
            extra=0;
        }
    }
    total_vote_count=t;
    //console.log("extra votes: "+extra);
    
    for(var j=0; j<arrayOfContent.length; j++) {
        if(arrayOfContent[j].votes>maxVotes) maxVotes=arrayOfContent[j].votes
    }

    console.log(random_num);
    console.log(weighted_list[random_num]);
    render();
}
function render() {
    var content="<tr><th>Complete</th><th>Control</td><th>Priority</th><th>The Item</th><th>votes</th><th>Weight</th></tr>";

    console.log("length of array="+arrayOfContent.length);

    //console.log(JSON.stringify(arrayOfContent,null,3));

    for(var i=0; i<arrayOfContent.length; i++) {
        // var delcol="<td name=\"delcol\"><button onclick=\"deleteit("+i+")\">Delete</button></td>";
        // var checkbox_and_name=;
	    // if(arrayOfContent[i].skip) {

        //     var checkbox_and_name=";

            

           

        //     content+="<tr>"+delcol+checkbox_and_name+"<td></td><td>"+arrayOfContent[i].votes+"</td><td>";
		// 	continue;
        // }
        // if(arrayOfContent[i].json!=undefined) {
        //     content+="<tr>"+delcol+checkbox_and_name+"<td><a href=\"javascript:SaveAndLoad('"+arrayOfContent[i].json+"')\">"+arrayOfContent[i].name+"</a></td><td><span onclick=\"moveUp("+i+")\"><i class=\"fas fa-angle-double-up\"></i></span></td><td>"+arrayOfContent[i].votes+"</td><td>";
        // } else {
    	//     content+="<tr>"+delcol+checkbox_and_name+"<td><input type=\"checkbox\" onclick=\"skipit("+i+")\"/></td><td>"+arrayOfContent[i].name+"</td><td><span onclick=\"moveUp("+i+")\"><i class=\"fas fa-angle-double-up\"></i></span></td><td>"+arrayOfContent[i].votes+"</td><td>";
        // }
        // if(arrayOfContent[i].votes==maxVotes) {
        //     content+=" Winner!";
        //     arrayOfContent[i].currentWeight--;
        //     if(arrayOfContent[i].currentWeight==0) arrayOfContent[i].skip=true;
        // }
        // content+="</td><td>"+arrayOfContent[i].currentWeight+"</td></tr>";
        content+=renderRow(i);
    }

    content+="<tr><td name=\"delcol\">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>Totals</td><td>"+TotalVotes(arrayOfContent)+"</td><td>"+(TotalValue(arrayOfContent)+1)+"</td></tr>";

    document.getElementById("thetable").innerHTML=content;
}

async function loadit(filename) {
    currentFilename=filename;
    arrayOfContent=JSON.parse(await LoadFile(filename));

    render();
}

function saveit() {
    SaveFile(currentFilename);
}
function SaveAndLoad(newfilename) {
    SaveFile(currentFilename);
    loadit(newfilename);
}