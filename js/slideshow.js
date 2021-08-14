var slideIndex = 0;
var element_to_hide= undefined
var paused=true
var jpgs=[]

const subject_selector = "subject-selector"

function refreshDots() {
	var dots = document.getElementsByClassName("dot");
	for (var i = 0; i < dots.length; i++) {
		dots[i].className = dots[i].className.replace(" active", "");
	}
	dots[(slideIndex) % dots.length].className += " active";
}  

function getDelay(init) {
	if(!isNaN($("#delay").val()) && $("#delay").val()>0) {
		return $("#delay").val()*1000;
	}
	return 5000;
}

function recurring_goForwards() {
	if(paused) return;
	goForwards();
	if(!paused) setTimeout(recurring_goForwards, getDelay()); // Change image every 5 seconds

}
function pauseShow() {
	console.log("PAUSED!");
	document.getElementById("playBtn").style.display="block";
	document.getElementById("pauseBtn").style.display="none";
	paused=true;
}

function playShow() {
	console.log("PLAY!");
	document.getElementById("playBtn").style.display="none";
	document.getElementById("pauseBtn").style.display="block";
	//show current slide
	//slideIndex--;
	paused=false;
	recurring_goForwards();
}

function goBackwards(pausestate) {
	if(pausestate!=undefined) paused=pausestate;
	showImage(slideIndex-1);
}

function goForwards(pausestate) {
	if(pausestate!=undefined) paused=pausestate;
	showImage(slideIndex+1);
}

function showImage(newslideIndex) {
	//hide current element
	var s=0
	if(element_to_hide==undefined) {
		console.log("nothing to hide yet")
	} else {
		console.log("setting element to hide ( "+element_to_hide+") to none");
	}

	slideIndex=newslideIndex;
	if(slideIndex>jpgs[$('#'+subject_selector).val()].entries.length-1) {
		s=Number($('#'+subject_selector).val())+1
		if(s>jpgs.length-1) s=0;
		console.log("====== new subject: "+s)
		slideIndex=0;
		$('#'+subject_selector).val(Number(s))
		loadCurrentSubject();
	}

	if(slideIndex<0) {
		console.log("\t--->CAUGHT: index < 0");
		s=Number($('#'+subject_selector).val())-1;

		if(s<0) {
			s=jpgs.length-1;
		}	
		$('#'+subject_selector).val(Number(s))
		loadCurrentSubject();
		console.log("\t--->revert subject: "+$('#'+subject_selector).val());
		console.log("\t---->set slideIndex to length -1")
		slideIndex=jpgs[$('#'+subject_selector).val()].entries.length-1;
	}
	
	//show next element
	var element_to_show="subject_slide"+slideIndex;
	console.log("setting element to show ( "+element_to_show+") to block");
	console.log("\tsetting element to show ( subject_slide"+slideIndex+") to block");

	if(element_to_hide!=undefined) {
		console.log("want to hide:")
		console.log("\t"+element_to_hide)	
		if(document.getElementById(element_to_hide)!=null && document.getElementById(element_to_hide).style!=null) {
			document.getElementById(element_to_hide).style.display="none";
		}
	}
	try {
		if(element_to_show!=undefined) {
			document.getElementById(element_to_show).style.display="block";
		} else {
			console.log("element to show should not be undefined")
			console.log("it should be: subject_slide"+slideIndex)
			throw error
		}
	} catch (err) {
		console.error("what happened here?!?")
	}
	element_to_hide=element_to_show
	refreshDots();
}

function nextSubject() {
	pauseShow();
	if(element_to_hide!=undefined) document.getElementById(element_to_hide).style.display="none";
	var s=Number($('#'+subject_selector).val())+1
	slideIndex=0;
	if(s>jpgs.length-1) s=0;
	$( '#'+subject_selector ).val(Number(s));
	loadCurrentSubject();

	showImage(0)
}

function prevSubject() {
	pauseShow();
	if(element_to_hide!=undefined) document.getElementById(element_to_hide).style.display="none";
	var s=Number($('#'+subject_selector).val())-1;
	slideIndex=0;
	if(s<0) s=jpgs.length-1;
	$( '#'+subject_selector ).val(Number(s));
	loadCurrentSubject();
	showImage(0)
}

function changeSubject() {
	pauseShow();
	if(element_to_hide!=undefined) document.getElementById(element_to_hide).style.display="none";
	var s=Number($( '#'+subject_selector).val());
	slideIndex=0;
	if(s>jpgs.length-1) s=0;
	$( '#'+subject_selector ).val(Number(s));
	loadCurrentSubject();
	showImage(0)
}

function fixRes() {
// <td>Max Width: <div id="mw">2048</div></td>
//   		<td><div class="slidecontainer"><input type="range" min="448" max="2048" value="2048" id="maxWidth" onchange="fixRes()"></div>px</td>
//   		<td>Max Height: <div id="mh">800</div></td>
//   		<td><div class="slidecontainer"><input type="range" min="0" max="5" value="5" id="maxHeight" 
	$("#mw").html($("#maxWidth").val()*200+1000);
	$("#mh").html($("#maxHeight").val()*100+300);
	$('.dimcontrol').css('max-width',$("#mw").html()+'px');
	$('.dimcontrol').css('max-height',$("#mh").html()+'px');
	console.log("fixRes: "+$("#mw").html()+" x "+$("#mh").html());
}

function saveSubject() {
	console.log("Save button clicked")
	config.defaultSubject=jpgs[$('#'+subject_selector).val()].subject
	config.defaultItem=undefined

	$.ajax({
        url: 'config',  //relative target route
        type: 'post',  //method
        dataType: 'json',  //type to receive... json
        contentType: 'application/json', //contenttype to send
        success: function (data) {
           $('#saveButton').prop('disabled', false);
           console.log("success in saving config")
           alert(data.msg)
       },
       data: JSON.stringify(config), // content to send; has to be stringified, even though it's application/json
       error: function(err){   //something bad happened and ajax is unhappy
            console.log(JSON.stringify(err,null,3));
            alert(err.responseJSON.error);
       }

   }).done(function(data) {
       console.log("done");
       //re-enable save button
       $('#saveButton').prop('disabled', false);
       
   });
}

function deleteSubject() {
	if(config.deleted==undefined) config.deleted=[]
	config.deleted.push(jpgs[$('#'+subject_selector).val()].subject)
}

//Load the ith subject into container c
function loadSubject(i,c) {
	console.log("loading subject i="+i+" which is ")
console.log(jpgs[i].subject+" into c=#"+c)

	$("#"+c).hide();
	$( "#"+c ).empty();
	for(var j=0; j<jpgs[i].entries.length; j++) {
		var content_to_add_to_dom="<div class=\"mySlides fade\" id=\"subject_slide"+j+"\" style=\"display:none\">"+
			"<div class=\"numbertext\">"+(j+1)+" / "+(jpgs[i].entries.length)+" "+jpgs[i].entries[j]+"</div>" +
			 "<img src=\""+config.prefix+"/"+jpgs[i].entries[j]+"\" class=\"dimcontrol\" onclick=\"goForwards(true)\" ondblclick=\"nextSubject()\">" +
			 "</div>";
		 //console.log("adding to dom: "+content_to_add_to_dom);      
		$( "#"+c ).append( content_to_add_to_dom );
		//slidecount++;
	}
	$("#"+c).show();
	fixRes();

}

function loadCurrentSubject() { loadSubject($('#'+subject_selector).val(),'slideshow-container') }



async function startSlideShow() {
    //load /config into memory
	config=await ajaxGet("config/");

    jpgs=await ajaxGet("/items");

	console.log("found "+jpgs.length+" subjects.")

	var slidecount=0;
	slideIndex=0;

	var select = document.getElementById(subject_selector);
	var i=0;
	for( ; i<jpgs.length; i++) {   
		var opt = document.createElement('option');
    	opt.value = i;
    	opt.innerHTML = jpgs[i].subject;
    	select.appendChild(opt);
		console.log("item (subject):"+jpgs[i].subject)
		
	}
    
	$('#'+subject_selector).val(0)
	
	if(config.defaultSubject!=undefined) {
		console.log("looking for default subject....")
		for(var i=0; i<jpgs.length; i++) {
			if(config.defaultSubject==jpgs[i].subject) {
				
				console.log("!!!! setting selector to "+i+" !!!!")
				$('#'+subject_selector).val(i)
				
			} else {
				console.log("rejecting "+jpgs[i].subject)
			}
		}
	}

	loadCurrentSubject();
	//loadSubject($('#'+subject_selector).val(),'slideshow-container')


	console.log("show first image, selector="+$('#'+subject_selector).val())
	console.log("\tdefault subject is "+config.defaultSubject)
	showImage(0)
}


define(["jquery", "utils"], function($) {
    //the jquery.alpha.js and jquery.beta.js plugins have been loaded.
    $(function() {
        startSlideShow()
    });
});


