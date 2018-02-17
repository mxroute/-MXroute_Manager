function sprintf(){if(!arguments||arguments.length<1||!RegExp){return}var str=arguments[0];var re=/([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)(.*)/;var a=b=[],numSubstitutions=0,numMatches=0;while(a=re.exec(str)){var leftpart=a[1],pPad=a[2],pJustify=a[3],pMinLength=a[4];var pPrecision=a[5],pType=a[6],rightPart=a[7];numMatches++;if(pType=="%"){subst="%"}else{numSubstitutions++;if(numSubstitutions>=arguments.length){alert("Error! Not enough function arguments ("+(arguments.length-1)+", excluding the string)\nfor the number of substitution parameters in string ("+numSubstitutions+" so far).")}var param=arguments[numSubstitutions];var pad="";if(pPad&&pPad.substr(0,1)=="'")pad=leftpart.substr(1,1);else if(pPad)pad=pPad;var justifyRight=true;if(pJustify&&pJustify==="-")justifyRight=false;var minLength=-1;if(pMinLength)minLength=parseInt(pMinLength);var precision=-1;if(pPrecision&&pType=="f")precision=parseInt(pPrecision.substring(1));var subst=param;if(pType=="b")subst=parseInt(param).toString(2);else if(pType=="c")subst=String.fromCharCode(parseInt(param));else if(pType=="d")subst=parseInt(param)?parseInt(param):0;else if(pType=="u")subst=Math.abs(param);else if(pType=="f")subst=precision>-1?Math.round(parseFloat(param)*Math.pow(10,precision))/Math.pow(10,precision):parseFloat(param);else if(pType=="o")subst=parseInt(param).toString(8);else if(pType=="s")subst=param;else if(pType=="x")subst=(""+parseInt(param).toString(16)).toLowerCase();else if(pType=="X")subst=(""+parseInt(param).toString(16)).toUpperCase()}str=leftpart+subst+rightPart}return str}function bytes(num){return num}function kilobytes(num){return num*1024}function megabytes(num){return num*1024*1024}function gigabytes(num){return num*1024*1024*1024}function terabytes(num){return num*1024*1024*1024*1024}function petabytes(num){return num*1024*1024*1024*1024*1024}function exabytes(num){return num*1024*1024*1024*1024*1024*1024}function toPrecision(num,per){var precision=per||2;var s=Math.round(num*Math.pow(10,precision)).toString();var pos=s.length-precision;var last=s.substr(pos,precision);return s.substr(0,pos)+(last.match("^0{"+precision+"}$")?"":"."+last)}function toHumanSize(num){if(num===void 0||num===null||isNaN(num)){return"unknown Bytes"}if(num<kilobytes(1))return num+" Bytes";if(num<megabytes(1))return toPrecision(num/kilobytes(1))+" KB";if(num<gigabytes(1))return toPrecision(num/megabytes(1))+" MB";if(num<terabytes(1))return toPrecision(num/gigabytes(1))+" GB";if(num<petabytes(1))return toPrecision(num/terabytes(1))+" TB";if(num<exabytes(1))return toPrecision(num/petabytes(1))+" PB";return toPrecision(num/exabytes(1))+" EB"}var uploadService=function(PAGE,$,LOCALE,YAHOO,sprintf,toHumanSize){"use strict";var INITIAL_UPLOAD_STATUS_DELAY=3e3;var UPLOAD_STATUS_INTERVAL=2e3;var file_upload_remain=document.getElementById("file_upload_remain");var uploadManager;var fileManagerWindow=window.opener;var thiswindow=window;var windowcloser=function(){thiswindow.close()};function safeencode(st){var enc=encodeURIComponent(st);var ecp=-1;var safeenc="";for(var i=0,len=enc.length;i<len;i++){if(ecp>=0){ecp++}if(ecp>=3){ecp=-1}if(ecp===1||ecp===2){safeenc+=enc.substring(i,i+1).toLowerCase()}else{safeenc+=enc.substring(i,i+1)}if(enc.substring(i,i+1)==="%"){ecp=0}}return safeenc.replace("(","%28").replace(")","%29").replace(",","%2c")}function clearFileInput(){var fileUploadElement=document.getElementById("uploader_file_input");fileUploadElement.value=""}function UploadManager(){this.file_upload_count=0;this.queue=[]}UploadManager.prototype.addToQueue=function(upload){this.queue.push(upload)};UploadManager.prototype.getCount=function(){return this.file_upload_count};UploadManager.prototype.incrementCount=function(){this.file_upload_count++;return this.file_upload_count};UploadManager.prototype.processQueue=function(){this.cleanupQueue();var overwrite=document.getElementById("overwrite_checkbox").checked;var i,len,upload;if(overwrite){for(i=0,len=this.queue.length;i<len;i++){upload=this.queue[i];if(!upload.in_progress){upload.start({overwrite:true})}}}else{var uploadsToCheck=[];for(i=0,len=this.queue.length;i<len;i++){upload=this.queue[i];if(!upload.in_progress){uploadsToCheck.push(upload)}}if(uploadsToCheck.length>0){this.filesExist(uploadsToCheck)}}};UploadManager.prototype.cleanupQueue=function(){var stillInProgress=[];for(var i=0,len=this.queue.length;i<len;i++){if(!this.queue[i].completed){stillInProgress.push(this.queue[i])}}this.queue=stillInProgress};UploadManager.prototype.filesExist=function(uploadObjects){var self=this;var dir=uploadObjects[0].dir;var url=CPANEL.security_token+"/execute/Fileman/list_files";var data={};data.dir=dir;data.limit_to_list=1;data.show_hidden=1;for(var i=0,len=uploadObjects.length;i<len;i++){data["filepath-"+i]=uploadObjects[i].fileName}$.ajax({type:"POST",url:url,data:data,dataType:"json"}).done(function(data){self.filesExistCallback(data,uploadObjects)}).fail(function(data){if(!data){alert('Error: The system could not determine if the specified files already exist. Try again with "Overwrite existing files" turned on.')}else{alert("Error: "+data.status+" "+data.statusText+'. The system could not determine if the specified files already exist. Try again with "Overwrite existing files" turned on.')}})};UploadManager.prototype.filesExistCallback=function(result,uploadObjects){var self=this;function clickyes(hash,keys){self.prompt.hide();for(var i=0,len=keys.length;i<len;i++){hash[keys[i]].start({overwrite:true})}self.prompt.destroy();self.prompt=null}function clickno(hash,keys){self.prompt.hide();for(var i=0,len=keys.length;i<len;i++){var upload=hash[keys[i]];for(var m=0,queueLen=self.queue.length;m<queueLen;m++){if(upload.fileName===self.queue[m].fileName){self.queue.splice(m,1);upload.cleanup();break}}}self.prompt.destroy();self.prompt=null}if(!result||!result.status){alert('Error: The system could not determine if the specified files already exist. Try again with "Overwrite existing files" turned on.');return}if(!result.data){alert('Error: The system could not determine if the specified files already exist. Try again with "Overwrite existing files" turned on.');return}var existence_hash={};var uploadObject={};var fileObj={};for(var i=0,len=result.data.length;i<len;i++){fileObj=result.data[i];for(var j=0,objsLen=uploadObjects.length;j<objsLen;j++){if(uploadObjects[j].fileName===fileObj.file){uploadObject=uploadObjects[j];break}}if(Object.keys(uploadObject).length>0){if(fileObj.exists){existence_hash[fileObj.file]=uploadObject}else{uploadObject.start()}}uploadObject={}}var existence_keys=Object.keys(existence_hash);if(existence_keys.length>0){var filePath=existence_hash[existence_keys[0]].dir;var fileList="";for(var k=0,keyLen=existence_keys.length;k<keyLen;k++){var file=existence_hash[existence_keys[k]].fileName;fileList+=file.html_encode()+"<br>"}var msg=YAHOO.lang.substitute(YAHOO.util.Dom.get("already_exists_template").text.trim(),{filelist_html:fileList,dir_html:filePath.html_encode()});self.prompt=new YAHOO.widget.SimpleDialog("sdlg1",{width:"450px",fixedcenter:true,visible:false,modal:true,draggable:false,close:true,constraintoviewport:true,effect:{effect:CPANEL.animate.ContainerEffect.FADE_MODAL,duration:.25},buttons:[{text:LOCALE.maketext("Yes"),handler:function(){clickyes(existence_hash,existence_keys)}.bind(self),isDefault:true},{text:LOCALE.maketext("No"),handler:function(){clickno(existence_hash,existence_keys)}.bind(self)}]});self.prompt.setHeader('<div class="lt"></div><span>'+LOCALE.maketext("Overwrite File?")+'</span><div class="rt"></div>');self.prompt.cfg.queueProperty("text",msg);self.prompt.render("promptContainer");self.prompt.show()}};function UploadViaXHR(opts){var id;if(opts){if(opts.id!==void 0){id=opts.id}}if(id===void 0){this.id=0}else{this.id=id}this.dir="";this.form="";this.fileName="";this.progress_template="upload_progress_template";this.form_template="dnd_uploaderhtml_template";this.request="";this.fileSize=0;this.success=false;this.reason="";this.in_progress=false;this.completed=false}UploadViaXHR.prototype.addForm=function(parentNode,dir,fileObj){var self=this;self.dir=dir;var template=document.getElementById(self.form_template);if(!template){throw new Error("Template does not exist: "+self.form_template)}var template_text=template.text.trim();var uploaderhtml=YAHOO.lang.substitute(template_text,{thisid_html:self.id});self.fileName=fileObj.name;var docFrag=document.createDocumentFragment();var dNew=document.createElement("div");dNew.id="uploader"+self.id;dNew.innerHTML=uploaderhtml;docFrag.appendChild(dNew);var upload_form=docFrag.querySelector("#frm"+self.id);var formData=new FormData(upload_form);formData.append("file-0",fileObj,fileObj.name);self.form=upload_form;self.formData=formData;parentNode.appendChild(docFrag)};UploadViaXHR.prototype.start=function(opts){var self=this;var overwrite=false;if(opts&&opts.overwrite!==void 0){overwrite=opts.overwrite}if(overwrite||document.getElementById("overwrite_checkbox").checked){self.formData.append("overwrite","1")}else{self.formData.append("overwrite","0")}var this_uploader_progress_container=document.getElementById("uploaderprogress"+self.id);var template=document.getElementById(self.progress_template);if(!template){throw new Error("Template does not exist: "+self.progress_template)}var template_text=template.textContent.trim();var html=YAHOO.lang.substitute(template_text,{thisid_html:self.id,fileName:self.fileName.html_encode()});this_uploader_progress_container.innerHTML=html;var uploaderstats=document.getElementById("uploaderstats"+self.id);var cancelLink=document.createElement("button");cancelLink.id="uploaderCancel"+self.id;cancelLink.className="cancel";cancelLink.innerHTML='<span class="fa fa-times"></span>';cancelLink.onclick=function(event){event.stopPropagation();event.preventDefault();self.cancel()};this_uploader_progress_container.insertBefore(cancelLink,uploaderstats);self.form.style.display="none";self.request=new XMLHttpRequest;self.request.onload=function(event){var payload;try{payload=JSON.parse(event.target.responseText)}catch(e){}var success=false;var message="An unknown error occurred";var fileSize=0;if(payload.errors){success=false;if(payload.data.uploads&&payload.data.uploads.length>0){message=payload.data.uploads[0].reason}else{message=payload.errors[payload.errors.length-1]}}else if(payload.data.uploads&&payload.data.uploads.length>0){success=true;message=payload.data.uploads[0].reason;fileSize=payload.data.uploads[0].size}if(payload.data.diskinfo){file_upload_remain.textContent=payload.data.diskinfo.file_upload_remain_humansize}self.success=success;self.reason=message;self.fileSize=fileSize;self.complete()};self.request.onabort=function(event){self.success=false;self.reason="Cancelled by user";self.complete()};self.request.onerror=function(event){self.success=false;self.reason="An unknown error occurred.  Are you over quota?";self.complete()};self.request.upload.onprogress=self.checkStatus.bind(self);self.request.open("post",CPANEL.security_token+"/execute/Fileman/upload_files",true);self.request.send(self.formData);self.in_progress=true};UploadViaXHR.prototype.checkStatus=function(data){var self=this;if(data.lengthComputable){var percentComplete=Math.floor(data.loaded/data.total*100);self.updateProgressTemplate({size:data.total,bytesSent:data.loaded,percentageComplete:percentComplete})}};UploadViaXHR.prototype.updateProgressTemplate=function(data){var self=this;var progressElement=document.getElementById("progress"+self.id);var stats=document.getElementById("uploaderstats"+self.id);progressElement.style.width=data.percentageComplete+"%";progressElement.textContent=data.percentageComplete+"%";progressElement.setAttribute("aria-valuenow",data.percentageComplete);self.fileSize=data.size;var humanSent=toHumanSize(data.bytesSent);var humanSize=toHumanSize(data.size);var newHTML=humanSent+" / "+humanSize+" ("+data.percentageComplete+"%) complete";stats.innerHTML=newHTML};UploadViaXHR.prototype.complete=function(){var self=this;var humanSize;var newHTML="";if(self.fileSize!==void 0){humanSize=toHumanSize(self.fileSize)}else{humanSize=toHumanSize(0)}var cancelLink=document.getElementById("uploaderCancel"+self.id);if(cancelLink){cancelLink.className="cancel hidden"}var progressElement=document.getElementById("progress"+self.id);var stats=document.getElementById("uploaderstats"+self.id);if(self.success){progressElement.style.width="100%";progressElement.textContent="100%";progressElement.setAttribute("aria-valuenow","100");progressElement.className+=" progress-bar-success";newHTML=humanSize+" complete"}else{progressElement.className+=" progress-bar-danger";newHTML=self.reason}stats.innerHTML=newHTML;self.cleanup()};UploadViaXHR.prototype.cancel=function(){var self=this;self.request.abort()};UploadViaXHR.prototype.cleanup=function(){var self=this;var uploadForm=document.getElementById("uploadform"+self.id);if(uploadForm){uploadForm.parentNode.removeChild(uploadForm);uploadForm=void 0}self.form=void 0;self.in_progress=false;self.completed=true};function UploadViaHiddenIframe(opts){var id,uploadkey,dir;if(opts){if(opts.id!==void 0){id=opts.id}if(opts.uploadkey!==void 0){uploadkey=opts.uploadkey}if(opts.dir!==void 0){dir=opts.dir}}if(id===void 0){this.id=0}else{this.id=id}if(uploadkey===void 0){this.uploadkey=""}else{this.uploadkey=uploadkey}var ro=Math.random()*9999999;var ri=Math.floor(ro);this.uploadkey+=ri;this.form="";this.fileName="";this.progress_template="upload_progress_template";this.form_template="uploaderhtml_template";this.dir="";this.fileSize=0;this.success=false;this.reason="";this.checkProgressCount=0;this.in_progress=false;this.completed=false}UploadViaHiddenIframe.prototype.addForm=function(parentNode,dir,input){var self=this;self.dir=dir;var template=document.getElementById(self.form_template);if(!template){throw new Error("Template does not exist: "+self.form_template)}var template_text=template.text.trim();var uploaderhtml=YAHOO.lang.substitute(template_text,{thisid_html:self.id});var thisFile=input.value;var backSlash=String.fromCharCode(92);var matchchar="/";if(thisFile.indexOf(backSlash)>-1){matchchar=backSlash}var filePath=thisFile.split(matchchar);self.fileName=filePath[filePath.length-1];var docFrag=document.createDocumentFragment();var dNew=document.createElement("div");dNew.id="uploader"+self.id;dNew.innerHTML=uploaderhtml;docFrag.appendChild(dNew);var master_upload_area=document.getElementById("uploader_button_area");var file_upload_element=input.cloneNode();master_upload_area.appendChild(file_upload_element);input.id="file";input.name="file";input.onchange=function(){return false};var upload_form=docFrag.querySelector("#frm"+self.id);upload_form.appendChild(input);self.form=upload_form;parentNode.appendChild(docFrag)};UploadViaHiddenIframe.prototype.start=function(opts){var self=this;var ro=Math.random()*9999999;var ri=Math.floor(ro);var overwrite=false;if(opts&&opts.overwrite!==void 0){overwrite=opts.overwrite}if(overwrite||document.getElementById("overwrite_checkbox").checked){self.form.overwrite.value="1"}else{self.form.overwrite.value="0"}var this_uploader_progress_container=document.getElementById("uploaderprogress"+self.id);var template=document.getElementById(self.progress_template);if(!template){throw new Error("Template does not exist: "+self.progress_template)}var template_text=template.textContent.trim();var html=YAHOO.lang.substitute(template_text,{thisid_html:self.id,fileName:self.fileName.html_encode()});this_uploader_progress_container.innerHTML=html;self.form["cpanel-trackupload"].value=self.uploadkey;var iframe=document.getElementById("ut"+self.id);iframe.onload=function(){iframe.onload=function(){};var json=CPANEL.util.get_text_content(iframe.contentDocument.documentElement);var jdata;try{jdata=JSON.parse(json)}catch(e){}var success=false;var message="An unknown error occurred";var fileSize=0;if(jdata&&jdata.cpanelresult){var payload=jdata.cpanelresult;if(payload.error){success=false;if(payload.data&&payload.data[0].uploads&&payload.data[0].uploads[0]){message=payload.data[0].uploads[0].reason}else{message=payload.error}}else if(payload.data&&payload.data[0].uploads&&payload.data[0].uploads[0]){message=payload.data[0].uploads[0].reason;fileSize=payload.data[0].uploads[0].size;var status=parseInt(payload.data[0].uploads[0].status,10);if(status){success=true}else{success=false}}if(payload.data&&payload.data[0].diskinfo){file_upload_remain.textContent=payload.data[0].diskinfo.file_upload_remain_humansize}}self.success=success;self.reason=message;self.fileSize=fileSize;self.complete()};self.form.submit();self.form.style.display="none";self.in_progress=true;self.status_timeout=setTimeout(function(){self.checkStatus()},INITIAL_UPLOAD_STATUS_DELAY)};UploadViaHiddenIframe.prototype.checkStatus=function(){var self=this;var statcallback={success:self.updateProgress.bind(self),failure:function(response){if(!response){return}self.status_timeout=setTimeout(function(){self.checkStatus()},UPLOAD_STATUS_INTERVAL)}.bind(self)};var sUrl=CPANEL.security_token+"/uploadstatus/?uploadid="+self.uploadkey;YAHOO.util.Connect.asyncRequest("GET",sUrl,statcallback,null)};UploadViaHiddenIframe.prototype.updateProgressTemplate=function(data){var self=this;if(data.complete||data.failure){self.success=!data.failure;self.reason=data.failureReason;self.fileSize=data.size;self.complete()}else{var progressElement=document.getElementById("progress"+self.id);var stats=document.getElementById("uploaderstats"+self.id);progressElement.style.width=data.percentageComplete+"%";progressElement.textContent=data.percentageComplete+"%";progressElement.setAttribute("aria-valuenow",data.percentageComplete);var humanSize=toHumanSize(data.size);var humanSent=toHumanSize(data.bytesSent);var newHTML=humanSent+" / "+humanSize+" ("+data.percentageComplete+"%) complete";stats.innerHTML=newHTML}};UploadViaHiddenIframe.prototype.updateProgress=function(response){var self=this;if(!response||!response.responseXML){return}var isComplete=false;var root=response.responseXML.documentElement;if(root===null||response.responseText===""){self.updateProgressCount+=1;if(self.updateProgressCount>=30){self.updateProgressTemplate({size:"unknown",complete:false,bytesSent:0,percentageComplete:0,failure:true,failureReason:"Unknown error or disk quota exceeded"})}else{self.status_timeout=setTimeout(function(){self.checkStatus()},UPLOAD_STATUS_INTERVAL)}return}var totalSize=root.getAttribute("size");var bytesSent=0;var files=root.getElementsByTagName("file");if(files.length>0){var errors=files[files.length-1].getElementsByTagName("error");if(errors.length>0){var failmsg=errors[errors.length-1].getAttribute("failmsg");self.updateProgressTemplate({size:totalSize||"unknown",complete:false,bytesSent:0,percentageComplete:0,failure:true,failureReason:failmsg});return}var progresses=files[files.length-1].getElementsByTagName("progress");if(progresses.length>0){isComplete=progresses[progresses.length-1].getAttribute("complete");bytesSent=progresses[progresses.length-1].getAttribute("bytes")}}else{self.status_timeout=setTimeout(function(){self.checkStatus()},UPLOAD_STATUS_INTERVAL);return}if(isComplete!==void 0&&isComplete!==null&&isComplete==="1"){isComplete=true}else{isComplete=false}var pcomplete=0;if(totalSize>0&&bytesSent){pcomplete=Math.floor(bytesSent/totalSize*100)}else{pcomplete=100}self.updateProgressTemplate({size:totalSize,complete:isComplete,bytesSent:bytesSent,percentageComplete:pcomplete,failure:false,failureReason:""});if(!isComplete){self.status_timeout=setTimeout(function(){self.checkStatus()},UPLOAD_STATUS_INTERVAL)}};UploadViaHiddenIframe.prototype.complete=function(){var self=this;clearTimeout(self.status_timeout);var humanSize;var newHTML="";if(self.fileSize!==void 0){humanSize=toHumanSize(self.fileSize)}else{humanSize=toHumanSize(0)}var progressElement=document.getElementById("progress"+self.id);var stats=document.getElementById("uploaderstats"+self.id);if(self.success){progressElement.style.width="100%";progressElement.textContent="100%";progressElement.setAttribute("aria-valuenow","100");progressElement.className+=" progress-bar-success";newHTML=humanSize+" complete"}else{progressElement.className+=" progress-bar-danger";newHTML=self.reason}stats.innerHTML=newHTML;self.cleanup()};UploadViaHiddenIframe.prototype.cancel=function(){return false};UploadViaHiddenIframe.prototype.cleanup=function(){var self=this;var uploadForm=document.getElementById("uploadform"+self.id);if(uploadForm){uploadForm.parentNode.removeChild(uploadForm);uploadForm=void 0}self.form=void 0;self.in_progress=false;self.completed=true};function cancelEvent(event){event.stopPropagation();event.preventDefault();event.dataTransfer.dropEffect="copy";return false}function supports_XHR2(){return!!window.ProgressEvent&&!!window.FormData}function supports_FileAPI(){return!!(window.File&&window.FileList&&window.FileReader)}function uploadfiles(files){var count,upload;var uploaders=document.getElementById("uploaders");for(var i=0,len=files.length;i<len;i++){count=uploadManager.incrementCount();upload=new UploadViaXHR({id:count});upload.addForm(uploaders,PAGE.dir,files[i]);uploadManager.addToQueue(upload)}uploadManager.processQueue();clearFileInput()}function uploadfile(file){var count,upload;var uploaders=document.getElementById("uploaders");count=uploadManager.incrementCount();if(supports_XHR2()&&supports_FileAPI()){var theFile;if(file.files!==void 0){theFile=file.files[0]}else{theFile=file}upload=new UploadViaXHR({id:count});upload.addForm(uploaders,PAGE.dir,theFile)}else{upload=new UploadViaHiddenIframe({id:count,uploadkey:PAGE.uploadkey});upload.addForm(uploaders,PAGE.dir,file)}uploadManager.addToQueue(upload);uploadManager.processQueue();clearFileInput()}function handleFileDrop(event){event.stopPropagation();event.preventDefault();if(!(supports_XHR2()&&supports_FileAPI())){return}var files=event.dataTransfer.files;if(files&&files.length>0){if(files.length>1){uploadfiles(files)}else{uploadfile(files[0])}}}function initialize(){YAHOO.util.Event.throwErrors=true;if(supports_XHR2()&&supports_FileAPI()){var dropZone=document.getElementById("upload_drop_zone");dropZone.addEventListener("dragover",cancelEvent,false);dropZone.addEventListener("dragenter",cancelEvent,false);dropZone.addEventListener("drop",handleFileDrop,false)}else{var uploaderTextArea=document.getElementById("uploader_text_area");uploaderTextArea.style.display="none"}uploadManager=new UploadManager}YAHOO.util.Event.onDOMReady(initialize);return{triggerFileSelection:function(){var file_input=document.getElementById("uploader_file_input");file_input.click()},goBackHandler:function(e){if(fileManagerWindow&&fileManagerWindow.updateFileList){setTimeout(windowcloser,5e3);fileManagerWindow.updateFileList(PAGE.dir,0,windowcloser);return false}else{windowcloser();return true}},uploadfile:uploadfile}}(PAGE,$,LOCALE,YAHOO,sprintf,toHumanSize);