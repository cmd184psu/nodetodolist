
const BASE='lists/'
const COOLDOWN_TIME=600000
const AUTO_SAVE_ENABLED=false
const AUTO_SAVE_PERIOD=60000
const VOTES_TO_CAST=100


var currentFilename="";
var priorFilename="";
var data=new Object;
var maxVotes=0;
var arrayOfContent=[];
var lists=[]

var subjectListIndex=0
var listIndex=0
// function LoadFile(filename) {
// 	return new Promise((resolve, reject) => {

//         //$("#loaded").html(filename);
//         console.log("attempting to load "+$('lists-selelctor'))
//         $.get(BASE+filename,"", function(result) { resolve(result); });
//     });
// }
function ajaxGet(uri) {
	return new Promise((resolve, reject) => {
        $.get(uri,"", function(result) { resolve(result); });
    });
}

function dropVars() {
    for(var i=0; i<arrayOfContent.length; i++) {
        arrayOfContent[i].votes=undefined;
        arrayOfContent[i].winner=undefined;
        arrayOfContent[i].resetWeight=undefined;
        arrayOfContent[i].currentWeight=undefined;
        arrayOfContent[i].value=undefined;
        arrayOfContent[i].winner=undefined;
        arrayOfContent[i].vote=undefined;
        arrayOfContent[i].expires=undefined;
        arrayOfContent[i].tempSkip=undefined;
    }
}
function clearWinner() {
    for(var i=0; i<arrayOfContent.length; i++) {
        if(arrayOfContent[i].winner!=undefined) arrayOfContent[i].winner=undefined;
    }
}

//FIXME: incomplete!
function SaveFile(filename) {
    $('#saveButton').prop('disabled', true);
    console.log("SaveFile("+filename+");");

    dropVars();
    console.log(JSON.stringify(arrayOfContent,null,3));
    

    $.ajax({
		url: BASE+filename,
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
        //re-enable save button
        $('#saveButton').prop('disabled', false);
        
    });
}

function calcValue(v,tv) {
    return v/tv;
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

function DaysToMS(days) {
	//return days*24*60*60*1000;
	return days*86400000;
}

function EpocMStoISODate(ms) {
	var d=new Date(ms);
	return formatedDate(d);
}

function isDueNow(ms) {
    var now=new Date();
    return ms<now.getTime();
}

function formatedDate(d) {
    return (d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear();
}

function resetDueDate(i) {
    var now=new Date();
	var dtom=DaysToMS(arrayOfContent[i].period)
	console.log("days="+arrayOfContent[i].period);
	console.log("ms="+dtom);
    console.log("ms(now)="+now.getTime());
    console.log("formated date(now)="+formatedDate(now))
	var dueDate=new Date(now.getTime()+dtom);
	arrayOfContent[i].nextDue=dueDate.getTime();
	console.log("next due is "+arrayOfContent[i].nextDue+" "+EpocMStoISODate(arrayOfContent[i].nextDue));
    render();
}

function addIt() {
    console.log("add new item");
    var object={};

    object.name=$("#itemName").val();
    object.votes=0;
    object.skip=false;
    if($("#itemJSON").val()!="") object.json=$("#itemJSON").val();

	if($("#itemPeriod").val()!="") {
		object.periodic=true;
		object.period=Number($("#itemPeriod").val());
		var now=new Date();
		var dtom=DaysToMS(object.period)
		console.log("days="+object.period);
		console.log("ms="+dtom);
		console.log("ms(now)="+now.getTime());
		var dueDate=new Date(now.getTime()+dtom);
		object.nextDue=dueDate.getTime();
		
		console.log("next due is "+object.nextDue);
		console.log("\tas date: "+EpocMStoISODate(object.nextDue));
	}
    arrayOfContent.push(object);

    $("#itemName").val("");
    $("#itemJSON").val("");
    $("#itemPeriod").val("");
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

function resetCoolDown(i) {
    arrayOfContent[i].expires=0;
    render();
}

function isInCoolDown(item) {
    var d=new Date();
    return (item.expires!=undefined && item.expires>d.getTime());
}
function renderRow(i) {
    //add delete column
    //var row="<td name=\"delcol\"><button onclick=\"deleteit("+i+")\">Delete</button></td>";
    var row="";
    var trophy="";

    var d=new Date();
    if(arrayOfContent[i].winner) {
        trophy="<td><i class=\"fas fa-trophy\"></i></td>";
        arrayOfContent[i].expires=d.getTime()+COOLDOWN_TIME;
        
    }

    

    var updown="<table><tr>";
    updown+="<td><span onclick=\"moveUp("+i+")\"><i class=\"fas fa-angle-double-up\"></i></span></td>";
    updown+="<td><span onclick=\"moveDown("+i+")\"><i class=\"fas fa-angle-double-down\"></i></span></td>";
    updown+="<td><span onclick=\"deleteit("+i+")\"><i class=\"fa fa-trash\"></i></td>";
    updown+="<td>"+trophy+"</td>";
    updown+="</tr></table>";


   
    //add checkbox
    if(arrayOfContent[i].skip || (!arrayOfContent[i].winner && isInCoolDown(arrayOfContent[i]))) {
        row="<td><input type=\"checkbox\" checked onclick=\"dontskipit("+i+")\"/></td>";
        row+="<td>"+updown+"</td>";
        row+="<td>"+(i+1)+"</td>";
        row+="<td><strike>"+arrayOfContent[i].name+"</strike></td>";
    } else {
        row="<td><input type=\"checkbox\" onclick=\"skipit("+i+")\"/></td>";
        row+="<td>"+updown+"</td>";
        row+="<td>"+(i+1)+"</td>";


        var prepend="";
        var append="";
        if(arrayOfContent[i].periodic!=undefined && arrayOfContent[i].periodic && isDueNow(arrayOfContent[i].nextDue)) {
            prepend="<strong><b>";
            append="</b></strong>";
        }
        
        if(arrayOfContent[i].json!=undefined) {
            row+="<td><a href=\"javascript:SaveAndLoad('"+arrayOfContent[i].json+"')\">"+prepend+arrayOfContent[i].name+append+"</a></td>";
        } else {
            row+="<td>"+prepend+arrayOfContent[i].name+append+"</td>";
        }
    }
    

    //add vote count
    if(arrayOfContent[i].votes==undefined)
        row+="<td>&nbsp;</td>";
    else
        row+="<td>"+arrayOfContent[i].votes+"</td>";


	//new variables:
	//periodic - boolean; if true, this item is a recurring item
	//nextDue  - milliseconds since the EPOC / UTC, usually in the future; this is the next due date for this recurring item
	//period   - duration between due dates in days		

    // var content="<tr><th>Complete</th><th>Control</td><th>Priority</th><th>The Item</th><th>votes</th><th>Ready?</th><th>Period (in days)</th><th>Next Due Date</th></tr>";
    if(arrayOfContent[i].periodic==undefined || !arrayOfContent[i].periodic) {
        row+="<td></td><td></td>";
    } else {
        var dueDate=new Date(arrayOfContent[i].nextDue);

        row+="<td>"+arrayOfContent[i].period+"</td>";
        row+="<td><table><tr><td width=90px>"+formatedDate(dueDate)+"&nbsp;</td><td><span onclick=\"resetDueDate("+i+")\"><i class=\"fas fa-sync\"></i></span></td></tr></table></td>";
    }

    
    //cool down
    var timeRemaining=0;
    var coolDown="Cool down";
    if(arrayOfContent[i].expires==undefined || (arrayOfContent[i].expires-d.getTime()<=0)) { 
        coolDown="Ready";
    } 
    row+="<td><table><tr><td width=60px>"+coolDown+"&nbsp;</td><td><span onclick=\"resetCoolDown("+i+")\"><i class=\"fas fa-sync\"></i></span></td></tr></table></td>";

    
    return "<tr>"+row+"</tr>";
}

function eligibleToVote(item) {
    var d=new Date();
    if(item.skip) return false;
    if(item.expires!=undefined && item.expires-d.getTime()>0) return false;
    return true;
}
function vote() {
    //clear the vote
    for (var i = 0; i < arrayOfContent.length; i++) {
        arrayOfContent[i].votes=0;
    }

    var rand = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
 
    var generateVoteList = function(list) {
        var vote_list = [];
        console.log("list length="+list.length);
        
        for (var i = 0; i < list.length; i++) {
            if(eligibleToVote(list[i]) ) {
                console.log("list["+i+"].name="+list[i].name);
                // Loop over the list of items
                vote_list.push(list[i].name);
                
            }
        }
        return vote_list;
    };

    //var list = ['javascript', 'php', 'ruby', 'python'];
    
    var vote_list = generateVoteList(arrayOfContent);

    console.log(vote_list.length);
    var random_num = 0;
    var extra=0;
    var t=VOTES_TO_CAST;
    var old_random_num=-1;
    var random_num=-1;


    clearWinner();
    maxVote_j=-1;


    switch(vote_list.length) {
        case 0:
            console.log("no votes were cast");
        break;
        case 1:
            for(var j=0; j<arrayOfContent.length; j++) {
                if(arrayOfContent[j].name==vote_list[0]) {
                    arrayOfContent[j].votes=VOTES_TO_CAST;
                    arrayOfContent[j].winner=true;
                }
            }
        break;
        default: // size 2 or bigger
            for(var i=0; i<VOTES_TO_CAST; i++) {
                while(old_random_num==random_num) {
                    random_num=rand(0, vote_list.length-1);
                }
                old_random_num=random_num;
                for(var j=0; j<arrayOfContent.length; j++) {
                    if(arrayOfContent[j].name==vote_list[random_num]) {
                        arrayOfContent[j].votes++;
                    } else {
                        console.log("skipped: "+arrayOfContent[j].name)
                    }
                }
            }
        break;

    }
    total_vote_count=t;
    //console.log("extra votes: "+extra);
    
    maxVotes=0;
    maxVote_j=-1;
    for(var j=0; j<arrayOfContent.length; j++) {
        if(arrayOfContent[j].votes>maxVotes) {
            maxVotes=arrayOfContent[j].votes
            maxVote_j=j;
        }
    }

    if(maxVote_j>-1) {
        console.log("the winner is: "+arrayOfContent[maxVote_j].name+" with "+arrayOfContent[maxVote_j].votes)
        arrayOfContent[maxVote_j].winner=true;
    } else {
        console.log("no winner declared")
    }
   
    maxVotes=0;
    render();
}
function render() {
    var content="<tr><th>Complete</th><th>Control</td><th>Priority</th><th>The Item</th><th>votes</th><th>Period (in days)</th><th>Next Due Date</th><th>Cooldown</th></tr>";
    console.log("length of array="+arrayOfContent.length);
    //console.log(JSON.stringify(arrayOfContent,null,3));
    for(var i=0; i<arrayOfContent.length; i++) {
        content+=renderRow(i);
		// for recurring expiration
    	if(arrayOfContent[i].periodic!=undefined && arrayOfContent[i].periodic) {
			console.log("==>"+i+"th can expire");    

			//new variables:
			//periodic - boolean; if true, this item is a recurring item
			//nextDue  - milliseconds since the EPOC / UTC, usually in the future; this is the next due date for this recurring item
			//period   - duration between due dates in days		

            if(isDueNow(arrayOfContent[i].nextDue)) {
                console.log("\tdue now and again in "+arrayOfContent[i].period+" days");
            } else {
				console.log("\tdue in the future: "+EpocMStoISODate(arrayOfContent[i].nextDue));
			} 
		} else {
			console.log("==>"+i+"th does not expire");
		}
    }

    content+="<tr><td name=\"delcol\">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>Totals</td><td>"+TotalVotes(arrayOfContent)+"</td><td colspan=3>=====</td></tr>";
    document.getElementById("thetable").innerHTML=content;
    // for cooldown
    var now=new Date();
    var future=new Date(60000+now.getTime());
    console.log("==== "+(future.getUTCMilliseconds()-now.getUTCMilliseconds()));
    console.log("now: "+formatedDate(now));
    console.log("future: "+formatedDate(future));
}

// function buildSubjectSelector(s,l) {
//     $('#'+s)
//     .find('option')
//     .remove();
//     var selector = document.getElementById(s);

//     //loop through subjects (groups)
//     for(var i=0; i<l.length; i++) {
//         var opt = document.createElement('option');
//         opt.innerHTML=l[i].subject;
//         opt.value=i
//         if(data.topic!=undefined && data.topic==l[i].subject) {
//             subjectListIndex=i
//         }
//         selector.appendChild(opt);
//         console.log("looking at "+(i+1)+" of "+l.length)
//     } 
//     $('#'+s).val(subjectListIndex);
// }

function rebuildListSelector(s,l,desired) {
    console.log("rebuildListSelector("+s+",list,"+(desired || "none")+")");
    $('#'+s)
    .find('option')
    .remove().end();
    var selector = document.getElementById(s);
    var retIndex=0
    //loop through lists for this subject
    for(var i=0; i<l.length; i++) {

        var opt = document.createElement('option');
        opt.innerHTML=l[i].subject || l[i];
        opt.value=i;
        console.log("===>adding "+opt.innerHTML+" as value "+opt.value)
        if(desired!=undefined && desired==l[i]) {
            retIndex=i
        }

        selector.appendChild(opt);
        console.log("looking at "+(i+1)+" of "+l.length)
    } 
    console.log("val of "+s+": "+$('#'+s).val())
    
    $('#'+s).val(retIndex);
    return retIndex;
}

async function loadit(filename) {
    if(filename==undefined) {
        data=await ajaxGet("config/");
        filename=data.topjson;
    }

    priorFilename=currentFilename;
    currentFilename=filename;
    var selected=0;
    if(data.todo) {
        console.log("TODO list mode")
        lists=await ajaxGet("/items");

        //buildSubjectSelector('subject-list-selector',lists)
        
        
        //move to changeSubjectList():
        subjectListIndex=rebuildListSelector('subject-list-selector',lists,data.topic)

        changeSubjectList()


        // var list_selector = document.getElementById('list-selector');
        // //loop through lists for this subject
        // for(var j=0; j<lists.length; j++) {
        //     var opt2 = document.createElement('option');
        //     opt2.innerHTML=lists[subjectListIndex].entries[j];
        //     opt2.value=j;
        //     if(data.topjson!=undefined && data.topjson==lists[subjectListIndex].entries[j]) {
        //         listIndex=j
        //     }

        //     list_selector.appendChild(opt2);
        //     console.log("looking at "+(j+1)+" of "+lists[subjectListIndex].entries.length)
        // } 
        // console.log("val of list-selector: "+$('#list-selector').val())
        
        // $('#list-selector').val(listIndex);

        console.log("val of subject-list-selector: "+$('#subject-list-selector').val())
        console.log("val of list-selector: "+$('#list-selector').val())
        console.log("\tval of list-selector: "+listIndex)
        console.log("total subjects: "+lists.length)
        console.log("total lists in this subject: "+lists[$('#subject-list-selector').val()].entries.length)
        



        filename=lists[$('#subject-list-selector').val()].entries[$('#list-selector').val()]
        console.log("ajax load filename: "+data.prefix+'/'+filename)

        //arrayOfContent=[]
        //var temp=await ajaxGet(data.prefix+'/'+filename);
        //arrayOfContent=JSON.parse(temp)
        render();
    } else {
        console.log("NOT todolist mode!!")
    }
}



// function NOPEinitAutoSave() {
//     if(AUTO_SAVE_ENABLED) {
//         console.log("doing auto-save...")
//         setTimeout(function() { 
//             console.log("=============================================")
//             console.log("calling saveit()...")
//             saveit();
//             console.log("reinstalling initAutoSave() recursively...")

//             initAutoSave(); 
//          }, AUTO_SAVE_PERIOD); //done
//     }
// }

function saveit() {
    SaveFile(currentFilename);
}
function SaveAndLoad(newfilename) {
    SaveFile(currentFilename);
    loadit(newfilename);
}

async function changeList() {
    console.log("list selected: "+ $( '#list-selector' ).val())


    var filename=lists[$('#subject-list-selector').val()].entries[$('#list-selector').val()]
    console.log("ajax load filename: "+data.prefix+'/'+filename)

    //arrayOfContent=[]
    var temp=await ajaxGet(data.prefix+'/'+filename);
    arrayOfContent=JSON.parse(temp)
    render();

}

function changeSubjectList() {

    subjectListIndex=$('#subject-list-selector').val();

    console.log("changeSubjectList(): fire rebuild list-selector")
    listIndex=rebuildListSelector('list-selector',lists[subjectListIndex].entries,data.topjson)
    changeList();
}