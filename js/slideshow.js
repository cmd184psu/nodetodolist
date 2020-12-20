var slideIndex = 1;
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
	dots[(slideIndex-1) % dots.length].className += " active";
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
	slideIndex--;
	paused=false;
	recurring_goForwards();
}

async function loadSlides() {
    jpgs=JSON.parse(await LoadFile("/jpg.json"));
    
    for(var i=0; i<jpgs.length; i++) {   
        console.log("item "+jpgs[i])
//         var content_to_add_to_dom="<div class=\"mySlides fade\"><div class=\"numbertext\">"+(i+1)+" / "+(jpgs.length+1)+" "+jpgs[i]+"</div>" +
//         "<img src=\""+jpgs[i]+"\" style=\"height: 700px\">" +
//         "</div>";
        var content_to_add_to_dom="<div class=\"mySlides fade\" ><div class=\"numbertext\">"+(i+1)+" / "+(jpgs.length+1)+" "+jpgs[i]+"</div>" +
        "<img src=\""+jpgs[i]+"\" class=\"dimcontrol\">" +
        "</div>";
        console.log("adding to dom: "+content_to_add_to_dom);      
        $( ".slideshow-container" ).append( content_to_add_to_dom );
    }
}

function goBackwards(pausestate) {
	if(pausestate!=undefined) paused=pausestate;
	
	showImage(slideIndex,slideIndex-1);
}

function goForwards(pausestate) {
	if(pausestate!=undefined) paused=pausestate;
	
	showImage(slideIndex,slideIndex+1);
}

function showImage(currentSlide,nextSlide) {
	var slides = document.getElementsByClassName("mySlides");
	
	//hide current slide


	//set prior slide
	previousSlide=slideIndex;
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

function getSubject(s) {
	console.log("current File: "+s);
	parts=s.split('/');
	console.log("\tcurrent Subject: "+parts[0]);
	return parts[0];
} 
function nextSubject() {
	paused_state=paused;
	
	pauseShow();

	oldsubject=getSubject(jpgs[slideIndex]);
	while (getSubject(jpgs[slideIndex])==oldsubject) {
		goForwards();
	}
	goForwards();
	paused=paused_state;
	if(!paused) playShow();
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
