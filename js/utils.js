
const BASE='jsonrepo/'
var currentFilename="";

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
	    totalValue+=list[i].value;
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

function render() {
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
                var multiples = calcValue(list[i].value,tv) * 100;
                console.log("list["+i+"].name="+list[i].name+" value="+list[i].value);
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
            console.log("vote for "+weighted_list[random_num]);
            if(arrayOfContent[j].skip && arrayOfContent[j].name==weighted_list[random_num]) {
                extra++;
                weighted_list.splice(random_num,1);
            } else if(arrayOfContent[j].name==weighted_list[random_num] && !arrayOfContent[j].skip && arrayOfContent[j].value!=0) arrayOfContent[j].votes++;
        }
        if(extra==t) total_vote_count=-1;
        else {
            total_vote_count+=extra;
            extra=0;
        }
    }
    total_vote_count=t;
    //console.log("extra votes: "+extra);
    var max=0;
    for(var j=0; j<arrayOfContent.length; j++) {
        if(arrayOfContent[j].votes>max) max=arrayOfContent[j].votes
    }

    console.log(random_num);
    console.log(weighted_list[random_num]);

    var content="<tr><th>the item</th><th>votes</th><th>Result</th><th>Weight</th></tr>";

    console.log("length of array="+arrayOfContent.length);

    //console.log(JSON.stringify(arrayOfContent,null,3));

    for(var i=0; i<arrayOfContent.length; i++) {
	    if(arrayOfContent[i].skip) {
            content+="<tr><td><strike>"+arrayOfContent[i].name+"</strike></td><td>"+arrayOfContent[i].votes+"</td><td>";
			continue;
        }
        if(arrayOfContent[i].json!=undefined) {
    	    content+="<tr><td><a href=\"javascript:SaveAndLoad('"+arrayOfContent[i].json+"')\">"+arrayOfContent[i].name+"</a></td><td>"+arrayOfContent[i].votes+"</td><td>";
        } else {
    	    content+="<tr><td>"+arrayOfContent[i].name+"</td><td>"+arrayOfContent[i].votes+"</td><td>";
        }
        if(arrayOfContent[i].votes==max) {
            content+=" Winner!";
            arrayOfContent[i].value--;
            if(arrayOfContent[i].value==0) arrayOfContent[i].skip=true;
        }
        content+="</td><td>"+arrayOfContent[i].value+"</td></tr>";
    }

    content+="<tr><td>Totals</td><td>"+TotalVotes(arrayOfContent)+"</td><td>&nbsp;</td><td>"+(TotalValue(arrayOfContent)+1)+"</td></tr>";

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