var stIsIE=0;if(navigator.appVersion.indexOf("MSIE")!=-1){stIsIE=1}sorttable={init:function(){if(arguments.callee.done)return;arguments.callee.done=true;if(!document.createElement||!document.getElementsByTagName)return;sorttable.DATE_RE=/^(\d\d?)[\/\.-](\d\d?)[\/\.-]((\d\d)?\d\d)$/;forEach(document.getElementsByTagName("table"),function(table){if(table.className.search(/\bsortable\b/)!=-1){var customMethodName=table.getAttribute("custom-sort-method");if(customMethodName){sorttable.makeSortable(table,customMethodName)}else{sorttable.makeSortable(table)}}})},makeSortable:function(table,customClickHanderName){if(table.getElementsByTagName("thead").length==0){the=document.createElement("thead");the.appendChild(table.rows[0]);table.insertBefore(the,table.firstChild)}if(table.tHead==null)table.tHead=table.getElementsByTagName("thead")[0];var tBody=table.getElementsByTagName("tbody");if(tBody.length>1){var is_empty=1;for(var i=0;i<tBody[0].childNodes.length;i++){if(tBody[0].childNodes[i].nodeType!=3){is_empty=0;break}}if(is_empty){table.removeChild(tBody[0])}}if(table.tHead.rows.length!=1)return;sortbottomrows=[];for(var i=0;i<table.rows.length;i++){if(table.rows[i].className.search(/\bsortbottom\b/)!=-1){sortbottomrows[sortbottomrows.length]=table.rows[i]}}if(sortbottomrows){if(table.tFoot==null){tfo=document.createElement("tfoot");table.appendChild(tfo)}for(var i=0;i<sortbottomrows.length;i++){tfo.appendChild(sortbottomrows[i])}delete sortbottomrows}headrow=table.tHead.rows[0].cells;for(var i=0;i<headrow.length;i++){if(!headrow[i].className.match(/\bsorttable_nosort\b/)&&!(headrow[i].getAttribute("nonsortable")!=null&&headrow[i].getAttribute("nonsortable").length>0)){mtch=headrow[i].className.match(/\bsorttable_([a-z0-9]+)\b/);if(mtch){override=mtch[1]}if(mtch&&typeof sorttable["sort_"+override]=="function"){headrow[i].sorttable_sortfunction=sorttable["sort_"+override]}else{headrow[i].sorttable_sortfunction=sorttable.guessType(table,i)}headrow[i].sorttable_columnindex=i;headrow[i].sorttable_tbody=table.tBodies[0];headrow[i].className+=" clickable";sorttable.initializeHeader(headrow[i]);dean_addEvent(headrow[i],"click",function(e){var customClickHandler=null;if(customClickHanderName){customClickHandler=window[customClickHanderName]}if(this.className.search(/\bsorttable_sorted\b/)!=-1){if(!customClickHanderName)sorttable.reverse(this.sorttable_tbody);this.className=this.className.replace("sorttable_sorted","sorttable_sorted_reverse");this.removeChild(document.getElementById("sorttable_sortfwdind"));sortrevind=document.createElement("span");sortrevind.id="sorttable_sortrevind";sortrevind.className="sortable_reverse";sortrevind.innerHTML=stIsIE?'&nbsp<font face="webdings">5</font>':"&nbsp;&#x25B4;";this.appendChild(sortrevind);if(customClickHandler){if(!e.currentTarget){e.currentTarget=this}customClickHandler(e)}return}if(this.className.search(/\bsorttable_sorted_reverse\b/)!=-1){if(!customClickHanderName)sorttable.reverse(this.sorttable_tbody);this.className=this.className.replace("sorttable_sorted_reverse","sorttable_sorted");this.removeChild(document.getElementById("sorttable_sortrevind"));sortfwdind=document.createElement("span");sortfwdind.id="sorttable_sortfwdind";sortfwdind.className="sortable_forward";sortfwdind.innerHTML=stIsIE?'&nbsp<font face="webdings">6</font>':"&nbsp;&#x25BE;";this.appendChild(sortfwdind);if(customClickHandler){if(!e.currentTarget){e.currentTarget=this}customClickHandler(e)}return}theadrow=this.parentNode;forEach(theadrow.childNodes,function(cell){if(cell.nodeType==1){cell.className=cell.className.replace("sorttable_sorted_reverse","");cell.className=cell.className.replace("sorttable_sorted","")}});sortfwdind=document.getElementById("sorttable_sortfwdind");if(sortfwdind){sortfwdind.parentNode.removeChild(sortfwdind)}sortrevind=document.getElementById("sorttable_sortrevind");if(sortrevind){sortrevind.parentNode.removeChild(sortrevind)}var isDefaultReverse=this.getAttribute("sortable-default-reverse")==="1";if(!isDefaultReverse){this.className+=" sorttable_sorted";sortfwdind=document.createElement("span");sortfwdind.id="sorttable_sortfwdind";sortfwdind.innerHTML=stIsIE?'&nbsp<font face="webdings">6</font>':"&nbsp;&#x25BE;";this.appendChild(sortfwdind)}else{this.className+=" sorttable_sorted_reverse";sortrevind=document.createElement("span");sortrevind.id="sorttable_sortrevind";sortrevind.className="sortable_reverse";sortrevind.innerHTML=stIsIE?'&nbsp<font face="webdings">5</font>':"&nbsp;&#x25B4;";this.appendChild(sortrevind)}if(customClickHandler){if(!e.currentTarget){e.currentTarget=this}customClickHandler(e)}else{row_array=[];col=this.sorttable_columnindex;rows=this.sorttable_tbody.rows;for(var j=0;j<rows.length;j++){row_array[row_array.length]=[sorttable.getInnerText(rows[j].cells[col]),rows[j]]}row_array.sort(this.sorttable_sortfunction);tb=this.sorttable_tbody;for(var j=0;j<row_array.length;j++){var new_class,other_class;if(j%2==0){new_class="info-even";other_class="info-odd"}else{new_class="info-odd";other_class="info-even"}var row_class=row_array[j][1].className;row_class=row_class.replace(other_class,new_class).replace(/^\s+|\s+$/,"").replace(/\s+/," ");row_array[j][1].className=row_class;tb.appendChild(row_array[j][1])}delete row_array}})}}},initializeHeader:function(current){if(current.className.search(/\bsorttable_sorted\b/)!=-1){sortfwdind=document.createElement("span");sortfwdind.id="sorttable_sortfwdind";sortfwdind.className="sortable_forward";sortfwdind.innerHTML=stIsIE?'&nbsp<font face="webdings">6</font>':"&nbsp;&#x25BE;";current.appendChild(sortfwdind)}if(current.className.search(/\bsorttable_sorted_reverse\b/)!=-1){sortrevind=document.createElement("span");sortrevind.id="sorttable_sortrevind";sortrevind.className="sortable_reverse";sortrevind.innerHTML=stIsIE?'&nbsp<font face="webdings">5</font>':"&nbsp;&#x25B4;";current.appendChild(sortrevind)}},guessType:function(table,column){sortfn=sorttable.sort_alpha;if(!table.tBodies[0]){return sortfn}for(var i=0;i<table.tBodies[0].rows.length;i++){text=sorttable.getInnerText(table.tBodies[0].rows[i].cells[column]);if(text!=""){if(text.match(/^-?[�$�]?[\d,.]+%?\s(Bytes|KB|MB|GB|TB|PB)$/)){return sorttable.sort_space}if(text.match(/^-?[�$�]?[\d,.]+%?$/)){return sorttable.sort_numeric}possdate=text.match(sorttable.DATE_RE);if(possdate){first=parseInt(possdate[1]);second=parseInt(possdate[2]);if(first>12){return sorttable.sort_ddmm}else if(second>12){return sorttable.sort_mmdd}else{sortfn=sorttable.sort_ddmm}}}}return sortfn},getInnerText:function(node){if(!node){return""}hasInputs=typeof node.getElementsByTagName=="function"&&node.getElementsByTagName("input").length;if(node.nodeType!=3&&node.getAttribute("sorttable_customkey")!=null){return node.getAttribute("sorttable_customkey")}else if(typeof node.textContent!="undefined"&&!hasInputs){return node.textContent.replace(/^\s+|\s+$/g,"")}else if(typeof node.innerText!="undefined"&&!hasInputs){return node.innerText.replace(/^\s+|\s+$/g,"")}else if(typeof node.text!="undefined"&&!hasInputs){return node.text.replace(/^\s+|\s+$/g,"")}else{switch(node.nodeType){case 3:if(node.nodeName.toLowerCase()=="input"){return node.value.replace(/^\s+|\s+$/g,"")}case 4:return node.nodeValue.replace(/^\s+|\s+$/g,"");break;case 1:case 11:var innerText="";for(var i=0;i<node.childNodes.length;i++){innerText+=sorttable.getInnerText(node.childNodes[i])}return innerText.replace(/^\s+|\s+$/g,"");break;default:return""}}},reverse:function(tbody){newrows=[];for(var i=0;i<tbody.rows.length;i++){newrows[newrows.length]=tbody.rows[i]}for(var i=newrows.length-1;i>=0;i--){tbody.appendChild(newrows[i])}delete newrows},sort_space:function(a,b){abytesunit=a[0].split(/\s+/);aa=unit_to_bytes(abytesunit[0],abytesunit[1]);if(isNaN(aa))aa=0;bbytesunit=b[0].split(/\s+/);bb=unit_to_bytes(bbytesunit[0],bbytesunit[1]);if(isNaN(bb))bb=0;return aa-bb},sort_numeric:function(a,b){aa=parseFloat(a[0].replace(/[^0-9.-]/g,""));if(isNaN(aa))aa=0;bb=parseFloat(b[0].replace(/[^0-9.-]/g,""));if(isNaN(bb))bb=0;return aa-bb},sort_alpha:function(a,b){if(a[0]==b[0])return 0;if(a[0]<b[0])return-1;return 1},sort_ddmm:function(a,b){mtch=a[0].match(sorttable.DATE_RE);y=mtch[3];m=mtch[2];d=mtch[1];if(m.length==1)m="0"+m;if(d.length==1)d="0"+d;dt1=y+m+d;mtch=b[0].match(sorttable.DATE_RE);y=mtch[3];m=mtch[2];d=mtch[1];if(m.length==1)m="0"+m;if(d.length==1)d="0"+d;dt2=y+m+d;if(dt1==dt2)return 0;if(dt1<dt2)return-1;return 1},sort_mmdd:function(a,b){mtch=a[0].match(sorttable.DATE_RE);y=mtch[3];d=mtch[2];m=mtch[1];if(m.length==1)m="0"+m;if(d.length==1)d="0"+d;dt1=y+m+d;mtch=b[0].match(sorttable.DATE_RE);y=mtch[3];d=mtch[2];m=mtch[1];if(m.length==1)m="0"+m;if(d.length==1)d="0"+d;dt2=y+m+d;if(dt1==dt2)return 0;if(dt1<dt2)return-1;return 1},shaker_sort:function(list,comp_func){var b=0;var t=list.length-1;var swap=true;while(swap){swap=false;for(var i=b;i<t;++i){if(comp_func(list[i],list[i+1])>0){var q=list[i];list[i]=list[i+1];list[i+1]=q;swap=true}}t--;if(!swap)break;for(var i=t;i>b;--i){if(comp_func(list[i],list[i-1])<0){var q=list[i];list[i]=list[i-1];list[i-1]=q;swap=true}}b++}}};YAHOO.util.Event.onDOMReady(sorttable.init);function dean_addEvent(element,type,handler){if(element.addEventListener){element.addEventListener(type,handler,false)}else{if(!handler.$$guid)handler.$$guid=dean_addEvent.guid++;if(!element.events)element.events={};var handlers=element.events[type];if(!handlers){handlers=element.events[type]={};if(element["on"+type]){handlers[0]=element["on"+type]}}handlers[handler.$$guid]=handler;element["on"+type]=handleEvent}}dean_addEvent.guid=1;function removeEvent(element,type,handler){if(element.removeEventListener){element.removeEventListener(type,handler,false)}else{if(element.events&&element.events[type]){delete element.events[type][handler.$$guid]}}}function handleEvent(event){var returnValue=true;event=event||fixEvent(((this.ownerDocument||this.document||this).parentWindow||window).event);var handlers=this.events[event.type];for(var i in handlers){this.$$handleEvent=handlers[i];if(this.$$handleEvent(event)===false){returnValue=false}}return returnValue}function fixEvent(event){event.preventDefault=fixEvent.preventDefault;event.stopPropagation=fixEvent.stopPropagation;return event}fixEvent.preventDefault=function(){this.returnValue=false};fixEvent.stopPropagation=function(){this.cancelBubble=true};if(!Array.forEach){Array.forEach=function(array,block,context){for(var i=0;i<array.length;i++){block.call(context,array[i],i,array)}}}Function.prototype.forEach=function(object,block,context){for(var key in object){if(typeof this.prototype[key]=="undefined"){block.call(context,object[key],key,object)}}};String.forEach=function(string,block,context){Array.forEach(string.split(""),function(chr,index){block.call(context,chr,index,string)})};var forEach=function(object,block,context){if(object){var resolve=Object;if(object instanceof Function){resolve=Function}else if(object.forEach instanceof Function){object.forEach(block,context);return}else if(typeof object=="string"){resolve=String}else if(typeof object.length=="number"){resolve=Array}resolve.forEach(object,block,context)}};function unit_to_bytes(num,bytes){switch(bytes){case"KB":return parseFloat(num)*1024;case"MB":return parseFloat(num)*1024*1024;case"GB":return parseFloat(num)*1024*1024*1024;case"TB":return parseFloat(num)*1024*1024*1024*1024;case"PB":return parseFloat(num)*1024*1024*1024*1024*1024;default:return parseFloat(num)}}