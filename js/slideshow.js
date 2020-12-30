var slideIndex = 0;
var subjectIndex = 0;
var paused=true
var jpgs=[]
//showSlides();

function showSlides() {
  slideIndex =$("#starthere").val();
  recurring_showSlides()
} 
 
function refreshDots() {
	var dots = document.getElementsByClassName("dot");
	for (var i = 0; i < dots.length; i++) {
		dots[i].className = dots[i].className.replace(" active", "");
	}
	dots[(slideIndex) % dots.length].className += " active";
}  
  // function recurring_showSlides() {
//   var i;
//   var slides = document.getElementsByClassName("mySlides");
//   
//   console.log("slideIndex="+slideIndex);
//   
//   for (i = 0; i < slides.length; i++) {
//     slides[i].style.display = "none";  
//   }
//   slideIndex++;
//   if (slideIndex > slides.length) {slideIndex = 1}    
//   $("#starthere").val(slideIndex);
//   
//   refreshDots();
//   slides[slideIndex-1].style.display = "block";  
//   
//   if(!paused)
//   setTimeout(recurring_showSlides, 5000); // Change image every 5 seconds
// }

function getDelay(init) {
	
	if($("#delay").val()!=NaN && $("#delay").val()>0) {
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

// async function loadSlides_previous() {
//     jpgs=JSON.parse(await LoadFile("/jpg.json"));
    
//     for(var i=0; i<jpgs.length; i++) {   
//         console.log("item "+jpgs[i])
// //         var content_to_add_to_dom="<div class=\"mySlides fade\"><div class=\"numbertext\">"+(i+1)+" / "+(jpgs.length+1)+" "+jpgs[i]+"</div>" +
// //         "<img src=\""+jpgs[i]+"\" style=\"height: 700px\">" +
// //         "</div>";
//         var content_to_add_to_dom="<div class=\"mySlides fade\" ><div class=\"numbertext\">"+(i+1)+" / "+(jpgs.length+1)+" "+jpgs[i]+"</div>" +
//         "<img src=\""+data.prefix+"/"+jpgs[i]+"\" class=\"dimcontrol\">" +
//         "</div>";
//         //console.log("adding to dom: "+content_to_add_to_dom);      
//         $( ".slideshow-container" ).append( content_to_add_to_dom );
//     }
// }
// async function loadSlides_new() {
//     var subjects=JSON.parse(await LoadFile("/subjects"));
	
// 	for(var i=0; i<subjects.length; i++) {
// 		console.log("working on subject: "+subjects[i])
// 		$.get( "subjects/"+subjects[i], function( data ) {
// 			subjects[i].entities=data;
// 			var content_to_add_to_dom="";
// 			for(var j=0; j<data.length; j++) {
// 				console.log("looking at file: "+data[j])
// 				content_to_add_to_dom+="<div class=\"mySlides fade\" ><div class=\"numbertext\">"+(j+1)+" / "+(data.length+1)+" "+data[j]+"</div>" +
// 				"<img src=\""+data.prefix+"/"+data[j]+"\" class=\"dimcontrol\">" +
// 				"</div>";
// 			}
// 			$( ".slideshow-container" ).append( content_to_add_to_dom );
// 		});
		
//     }
// }
async function loadSlides() {
    jpgs=await ajaxGet("/items");

	console.log("found "+jpgs.length+" subjects.")

	var slidecount=0;
	slideIndex=0;
	subjectIndex=0;

	var select = document.getElementById('subject-selector');
	for(var i=0; i<jpgs.length; i++) {   

		var opt = document.createElement('option');
    	opt.value = i;
    	opt.innerHTML = jpgs[i].subject;
    	select.appendChild(opt);

		console.log("item (subject):"+jpgs[i].subject)
		for(var j=0; j<jpgs[i].entries.length; j++) {
			
			var content_to_add_to_dom="<div class=\"mySlides fade\" id=\"subject"+i+"_slide"+j+"\" >"+
				"<div class=\"numbertext\">"+(j+1)+" / "+(jpgs[i].entries.length+1)+" "+jpgs[i].entries[j]+"</div>" +
         		"<img src=\""+data.prefix+"/"+jpgs[i].entries[j]+"\" class=\"dimcontrol\" onclick=\"goForwards(true)\" ondblclick=\"nextSubject()\">" +
         		"</div>";
         	//console.log("adding to dom: "+content_to_add_to_dom);      
			$( ".slideshow-container" ).append( content_to_add_to_dom );
			slidecount++;
		}
    }
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
	var element_to_hide="subject"+subjectIndex+"_slide"+slideIndex;
	console.log("setting element to hide ( "+element_to_hide+") to none");
	console.log("\tsetting element to hide ( subject"+subjectIndex+"_slide"+slideIndex+") to none");


	slideIndex=newslideIndex;
	console.log("--->(1) slideIndex is now "+slideIndex)

	if(slideIndex>jpgs[subjectIndex].entries.length-1) {
		subjectIndex++;

		if(subjectIndex>jpgs.length-1) subjectIndex=0;
		slideIndex=0;
	}

	console.log("--->(2) slideIndex is now "+slideIndex)

	if(slideIndex<0) {
		console.log("\t--->CAUGHT: index < 0");
		subjectIndex--;

		if(subjectIndex<0) {
			subjectIndex=jpgs.length-1;
		}	
		console.log("\t--->revert subject: "+subjectIndex);

		console.log("\t---->set slideIndex to length -1")

		slideIndex=jpgs[subjectIndex].entries.length-1;
		
	}
	console.log("--->(3) slideIndex is now "+slideIndex)

	//show next element
	var element_to_show="subject"+subjectIndex+"_slide"+slideIndex;

	console.log("setting element to show ( "+element_to_show+") to block");
	console.log("\tsetting element to show ( subject"+subjectIndex+"_slide"+slideIndex+") to block");

	document.getElementById(element_to_hide).style.display="none";
	document.getElementById(element_to_show).style.display="block";
	refreshDots();
}

function showImageOLD(currentSlide,nextSlide) {
	var slides = document.getElementsByClassName("mySlides");
	
	//hide current slide


	//set prior slide
	var previousSlide=slideIndex;
	if (previousSlide > slides.length) { previousSlide = 1 }
	if (previousSlide<1) { previousSlide=slides.length; }

	slides[previousSlide-1].style.display = "none";

	//set index
	slideIndex=nextSlide;	
	if (slideIndex > slides.length) {slideIndex = 1}   
	if (slideIndex<1) { slideIndex=slides.length; }
	
	
	
	//store in input box 
	$("#starthere").val(slideIndex);
	
	
	//show next slide
	slides[slideIndex-1].style.display = "block";
	
	//refresh dots
	refreshDots();
}

// function getSubject(s) {
// 	console.log("current File: "+s);
// 	parts=s.split('/');
// 	console.log("\tcurrent Subject: "+parts[0]);
// 	return parts[0];
// } 
// function nextSubjectOLD() {
// 	paused_state=paused;
	
// 	pauseShow();

// 	oldsubject=getSubject(jpgs[slideIndex]);
// 	while (getSubject(jpgs[slideIndex])==oldsubject) {
// 		goForwards();
// 	}
// 	goForwards();
// 	paused=paused_state;
// 	if(!paused) playShow();
// }
function nextSubject() {
	
	pauseShow();

	var element_to_hide="subject"+subjectIndex+"_slide"+slideIndex;
	document.getElementById(element_to_hide).style.display="none";

	
	subjectIndex++;
	slideIndex=0;
	
	if(subjectIndex>jpgs.length-1) subjectIndex=0;
	

	$( '#subject-selector' ).val(subjectIndex);

	showImage(0)
	
}

function prevSubject() {
	
	pauseShow();

	var element_to_hide="subject"+subjectIndex+"_slide"+slideIndex;
	document.getElementById(element_to_hide).style.display="none";

	
	subjectIndex--;
	slideIndex=0;
	
	if(subjectIndex<0) subjectIndex=jpgs.length-1;
	

	$( '#subject-selector' ).val(subjectIndex);

	showImage(0)
	
}

function changeSubject() {
	pauseShow();

	var element_to_hide="subject"+subjectIndex+"_slide"+slideIndex;
	document.getElementById(element_to_hide).style.display="none";

	
	subjectIndex=$( '#subject-selector' ).val();
	slideIndex=0;
	
	if(subjectIndex>jpgs.length-1) subjectIndex=0;

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
