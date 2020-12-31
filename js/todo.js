var config=new Object;
var arrayOfContent=[];
var lists=[]
//var subjectIndex=0
//var listIndex=0
const item_list_selector='item-list-selector'
const subject_list_selector='subject-list-selector'
var currentFilename=undefined


const DEBUG=false

function SaveList(content,filename) {
    $('#saveButton').prop('disabled', true);
    if(skipsave) {
        console.log("---- SKIPPING SAVE, for safety! ------")    
        return
    }
    console.log("SaveFile("+filename+");");

    dropVars();
    console.log(JSON.stringify(content,null,3));
    if(filename==undefined) {
        throw error
        //return
    }

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
        data: JSON.stringify(content),
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


async function SelectNewFile(nf) {
    if(nf==undefined) {
        throw error
    }    
    
    console.log("====SelectNewFile("+nf+")")
    
    
    
    console.log("\tcurrent file is "+currentFilename)
    console.log("\tselected file is "+lists[$('#'+subject_list_selector).val()].entries[$('#'+item_list_selector).val()])


    var newsubject=nf.includes('/') && nf.split('/')[0] || lists[$('#'+subject_list_selector).val()].subject
    console.log("\twith new subject: "+newsubject)

    if(!nf.includes('/')) nf=newsubject+'/'+nf


    console.log("\tdesired file is "+nf)




    if(nf!=undefined) {
        
        
        //if current subject and desired subject (within new filename nf, then select it)
        if(lists[$('#'+subject_list_selector).val()].subject!=newsubject) {
            //console.log("need new subject: "+newsubject)

            for(var i=0; i<lists.length; i++) {
                if(lists[i].subject==newsubject) {
                    $('#'+subject_list_selector).val(i)
                    //this.subjectListIndex=i
                    console.log("found and selected new subject ("+newsubject+")")



                    rebuildListSelector(subject_list_selector,lists,newsubject)

 

                    continue;
                }
            }
        } else {

            console.log("sticking with same subject ("+newsubject+")")
        }
    }

       //either the subject didn't change or it did; our lists should be correct now
       console.log("current subject index = "+$('#'+subject_list_selector).val());
       console.log("current list index = "+rebuildListSelector(item_list_selector,lists[$('#'+subject_list_selector).val()].entries,nf))
   
    if(currentFilename!=undefined && config.autosave) SaveList(arrayOfContent,currentFilename);
 

    arrayOfContent=await ajaxGet(config.prefix+'/'+lists[$('#'+subject_list_selector).val()].entries[$('#'+item_list_selector).val()]);
    currentFilename=lists[$('#'+subject_list_selector).val()].entries[$('#'+item_list_selector).val()];
    render();
}

function SaveAndLoad(newfilename) {
    SelectNewFile(newfilename);
}

function changeItem() {
    SelectNewFile(lists[$('#'+subject_list_selector).val()].entries[$('#'+item_list_selector).val()]);
}


function changeSubject() {
    SelectNewSubject(lists[$('#'+subject_list_selector).val()].subject,lists[$('#'+subject_list_selector).val()].subject+"/index."+config.ext)
}

function SelectNewSubject(newsubject,newfile) {
    
    if(newsubject==undefined && newfile==undefined) {
        console.log("neither subject nor file is defined; checking defaults")
        newfile=config.defaultItem || (config.defaultSubject+"/index."+config.ext);
        newsubject=tj.split('/')[0]
    }
    
    console.log("want to change subject to "+newsubject+" and load list "+newfile)
    // for(var i=0; i<lists.length; i++) {
    //     if(lists[i].subject==newsubject) {
    //         $('#'+subject_list_selector).val(i)
    //         console.log("found and selected new subject")
    //     }
    //     tj=lists[$('#'+subject_list_selector).val()].entries[$('#'+item_list_selector).val()]
    // }

    //subjectListIndex=$('#'+subject_list_selector).val();

    // console.log("changeSubjectList(): fire rebuild list-selector")

    // var t=lists[$('#'+subject_list_selector).val()].subject

    // if(tj.startsWith(t)) {
    //     console.log("tj DOES start with "+t)
    // } else {
    //     console.log("tj does NOT start with "+t)
     
    //     tj=t+"/index."+config.ext
    // }
    // console.log("\tcalling rebuildListSelector with tj="+tj)

    rebuildListSelector(item_list_selector,lists[$('#'+subject_list_selector).val()].entries,newfile)


    //newFilename=lists[$('#subject-list-selector').val()].entries[$('#list-selector').val()]
    //changeItem();
    SelectNewFile(lists[$('#'+subject_list_selector).val()].entries[$('#'+item_list_selector).val()]);

}


async function startTodo() {
    //load /config into memory
	config=await ajaxGet("config/");

	//load items into memory
	lists=await ajaxGet("items/");

	//render selectors
    DEBUG && console.log("config.defaultSubject="+config.defaultSubject)
    rebuildListSelector(subject_list_selector,lists,config.defaultSubject)
    
    DEBUG && console.log("config.defaultItem="+config.defaultItem)
	rebuildListSelector(item_list_selector,lists[$('#'+subject_list_selector).val()].entries,config.defaultItem)

    //load default topic and json
    currentFilename=lists[$('#'+subject_list_selector).val()].entries[$('#'+item_list_selector).val()] 
    DEBUG && console.log("loading: "+config.prefix+"/"+currentFilename)
    arrayOfContent=await ajaxGet(config.prefix+"/"+currentFilename)

	//render it
	render();
}