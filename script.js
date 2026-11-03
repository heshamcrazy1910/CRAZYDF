const $=id=>document.getElementById(id);
try{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}catch(e){}

// شريط تقدم القراءة
window.onscroll = function() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled = (winScroll / height) * 100;
  $("progressBar").style.width = scrolled + "%";
};

[1,2,3,4,5].forEach(i=>$('t'+i).onclick=()=>tab(i));
function tab(n){[1,2,3,4,5].forEach(i=>{$('p'+i).classList.toggle('hide',i!=n);$('t'+i).classList.toggle('on',i==n)})}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function wire(d,f,cb){d.onclick=()=>f.click();f.onchange=()=>{cb([...f.files]);f.value=''};
d.ondragover=e=>{e.preventDefault();d.classList.add('h')};d.ondragleave=()=>d.classList.remove('h');
d.ondrop=e=>{e.preventDefault();d.classList.remove('h');cb([...e.dataTransfer.files])}}

/* Images -> PDF */
let imgs=[],dragI=null;
wire($('d1'),$('f1'),async files=>{
 for(const f of files.filter(f=>f.type.startsWith('image/'))){
  const url=URL.createObjectURL(f);const im=new Image();im.src=url;
  try{await im.decode()}catch(e){continue}
  imgs.push({url,im,type:f.type})}
 draw1()});
function draw1(){const g=$('g1');g.innerHTML='';
 imgs.forEach((o,i)=>{const d=document.createElement('div');d.className='it';d.draggable=true;
  d.innerHTML=`<img src="${o.url}"><span class="n">${i+1}</span><button class="x">✕</button>`;
  d.querySelector('.x').onclick=()=>{imgs.splice(i,1);draw1()};
  d.ondragstart=()=>dragI=i;d.ondragover=e=>{e.preventDefault();d.classList.add('over')};
  d.ondragleave=()=>d.classList.remove('over');
  d.ondrop=e=>{e.preventDefault();if(dragI===null||dragI===i)return;const [m]=imgs.splice(dragI,1);imgs.splice(i,0,m);dragI=null;draw1()};
  g.appendChild(d)});
 $('b1').disabled=!imgs.length}
$('b1').onclick=()=>{
 const {jsPDF}=window.jspdf,mm=.2646,m=+$('mar').value,a4=$('siz').value=='a4';
 let pdf=null;
 imgs.forEach((o,k)=>{
  const w=o.im.naturalWidth,h=o.im.naturalHeight;
  let pw,ph,or;
  if(a4){or=$('ori').value=='l'?'l':'p';pw=or=='l'?297:210;ph=or=='l'?210:297}
  else{pw=w*mm+2*m;ph=h*mm+2*m;or=pw>ph?'l':'p'}
  if(!pdf)pdf=new jsPDF({unit:'mm',format:[pw,ph],orientation:or});else pdf.addPage([pw,ph],or);
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  const png=o.type=='image/png';if(!png){x.fillStyle='#fff';x.fillRect(0,0,w,h)}
  x.drawImage(o.im,0,0);
  const data=c.toDataURL(png?'image/png':'image/jpeg',.92);
  const aw=pw-2*m,ah=ph-2*m,s=Math.min(aw/w,ah/h),iw=w*s,ih=h*s;
  pdf.addImage(data,png?'PNG':'JPEG',(pw-iw)/2,(ph-ih)/2,iw,ih)});
 dl(pdf.output('blob'),'crazydf.pdf')};

/* PDF -> Images */
let pages=[];
wire($('d2'),$('f2'),async fl=>{
 const f=fl[0];if(!f)return;$('st').textContent='جارٍ القراءة…';$('g2').innerHTML='';pages=[];
 try{
  const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;
  for(let n=1;n<=pdf.numPages;n++){
   const pg=await pdf.getPage(n),vp=pg.getViewport({scale:.4}),c=document.createElement('canvas');
   c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
   const d=document.createElement('div');d.className='it';d.appendChild(c);
   d.insertAdjacentHTML('beforeend',`<span class="n">${n}</span><label><input type="checkbox" checked> تحديد</label>`);
   $('g2').appendChild(d);pages.push({pg,n,cb:d.querySelector('input')})}
  $('st').textContent=pdf.numPages+' صفحة';$('b2').disabled=$('b3').disabled=false;
 }catch(e){$('st').textContent='تعذّر فتح الملف'}});
async function render(p){const ext='png',b0=p.pg.getViewport({scale:1}),vp=p.pg.getViewport({scale:Math.min(3,7000/Math.max(b0.width,b0.height))}),c=document.createElement('canvas');
 c.width=vp.width;c.height=vp.height;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
 await p.pg.render({canvasContext:x,viewport:vp}).promise;
 return new Promise(r=>c.toBlob(r,'image/'+ext,1))}
async function run(sel){
 const list=pages.filter(p=>!sel||p.cb.checked);if(!list.length)return;
 const ext='png';$('st').textContent='جارٍ التحويل…';
 if(list.length==1&&sel){dl(await render(list[0]),`page-${list[0].n}.${ext}`)}
 else{const z=new JSZip();for(const p of list)z.file(`page-${p.n}.${ext}`,await render(p));dl(await z.generateAsync({type:'blob'}),'crazydf-pages.zip')}
 $('st').textContent='تم ✓'}
$('b2').onclick=()=>run(true);$('b3').onclick=()=>run(false);

document.querySelectorAll('select').forEach(sel=>{const w=document.createElement('div');w.className='dd';const b=document.createElement('button');b.type='button';const ul=document.createElement('ul');
sel.after(w);w.append(b,ul);sel.style.display='none';
const sync=()=>{b.textContent=sel.options[sel.selectedIndex].text;[...ul.children].forEach((li,i)=>li.classList.toggle('on',i==sel.selectedIndex))};
[...sel.options].forEach((o,i)=>{const li=document.createElement('li');li.textContent=o.text;li.onclick=()=>{sel.selectedIndex=i;sel.dispatchEvent(new Event('change'));w.classList.remove('open');sync()};ul.appendChild(li)});
b.onclick=e=>{e.stopPropagation();document.querySelectorAll('.dd.open').forEach(x=>x!==w&&x.classList.remove('open'));w.classList.toggle('open')};sync()});
document.addEventListener('click',()=>document.querySelectorAll('.dd.open').forEach(x=>x.classList.remove('open')));

let file3=null;
try{$('ky').value=localStorage.getItem('crazydf_gkey')||''}catch(e){}
const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
function clean(h){const d=new DOMParser().parseFromString(h,'text/html');d.querySelectorAll('script,iframe,object,embed,link,meta,style,form').forEach(e=>e.remove());d.body.querySelectorAll('*').forEach(e=>{[...e.attributes].forEach(a=>{if(/^on/i.test(a.name)||/javascript:/i.test(a.value))e.removeAttribute(a.name)})});return d.body.innerHTML}
function showKey(){$('kw').classList.toggle('hide',$('en').value!='ai');0}
$('en').onchange=showKey;showKey();
wire($('d3'),$('f3'),fl=>{const f=fl[0];if(!f||!f.type.startsWith('image/'))return;file3=f;$('pv3').src=URL.createObjectURL(f);$('pv3').classList.remove('hide');$('b4').disabled=false;$('st3').textContent=''});
function toJpeg(f){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1800/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=im.naturalWidth*k;c.height=im.naturalHeight*k;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.9).split(',')[1])};im.onerror=rej;im.src=URL.createObjectURL(f)})}
const RULES='Output only an HTML fragment (no <html>/<head>/<body>, no CSS classes, no code fences, no commentary). Use h1-h3, p, ul/ol, table for tables, b/i for emphasis, and inline style only for text-align or colors when needed. Keep the original language(s), do not translate, and put dir="rtl" on Arabic blocks.';
async function askAI(key,content){
 try{localStorage.setItem('crazydf_gkey',key)}catch(e){}
 const parts=content.map(c=>c.type=='image'?{inline_data:{mime_type:'image/jpeg',data:c.source.data}}:{text:c.text});
 const body=JSON.stringify({contents:[{parts}],generationConfig:{maxOutputTokens:8192}});
 const models=['gemini-3.8-flash','gemini-flash-latest','gemini-flash-lite-latest'];let last='';
 for(const m of models)for(let t=0;t<2;t++){
  try{
   const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body});
   const j=await r.json();
   if(!r.ok){last=j.error&&j.error.message||'';
    if(r.status==404)break;
    if([429,500,503,504].includes(r.status)){$('st3').textContent='الموديل مزحوم، بحاول تاني…';await new Promise(z=>setTimeout(z,1500*(t+1)));continue}
    throw new Error(last||'خطأ من الـ API')}
   const x=((j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[]).map(c=>c.text||'').join('');
   if(!x.trim()){last='empty';continue}
   return clean(x.replace(/^```(?:html)?\s*|```\s*$/g,''))
  }catch(e){if(e instanceof TypeError){last='network';continue}throw e}}
 throw new Error('Gemini مزحوم دلوقتي. جرّب بعد دقيقة أو اتنين، أو اختار OCR المجاني.')}
async function viaAI(){
 const key=$('ky').value.trim();if(!key)throw new Error('اكتب مفتاح API الأول');
 const data=await toJpeg(file3);
 return askAI(key,[{type:'image',source:{type:'base64',media_type:'image/jpeg',data}},{type:'text',text:'Transcribe all the text in this image exactly as written and recreate its layout as clean HTML. '+RULES}])}
$('b8').onclick=async()=>{const c=$('cm').value.trim(),key=$('ky').value.trim();if(!c)return;
 if(!key){$('st3').textContent='التعديل بيحتاج مفتاح Gemini — اختار Gemini AI وحط المفتاح';return}
 $('b8').disabled=true;$('st3').textContent='جارٍ تطبيق التعديل…';
 try{const data=await toJpeg(file3);
  $('rs').innerHTML=await askAI(key,[{type:'image',source:{type:'base64',media_type:'image/jpeg',data}},{type:'text',text:'This is the current HTML recreation of the image:\n'+$('rs').innerHTML+'\n\nUser correction: '+c+'\n\nApply the correction and return the full updated HTML. '+RULES}]);
  $('cm').value='';$('st3').textContent='تم التعديل ✓'
 }catch(e){$('st3').textContent=e.message||'تعذّر التعديل'}
 $('b8').disabled=false};
async function viaOcr(){
 if(!window.Tesseract)throw new Error('تعذّر تحميل محرك OCR — افتح الملفات من جهازك مع إنترنت');
 const w=await Tesseract.createWorker($('lg').value.split('+'),1,{logger:m=>{if(m.status==='recognizing text')$('st3').textContent='جارٍ القراءة '+Math.round(m.progress*100)+'%'}});
 const r=await w.recognize(file3);await w.terminate();
 return r.data.text.trim().split(/\n{2,}/).map(p=>'<p dir="auto">'+esc(p).replace(/\n/g,'<br>')+'</p>').join('')}
$('b4').onclick=async()=>{$('b4').disabled=true;$('st3').textContent='جارٍ المعالجة…';
 try{const h=await($('en').value=='ai'?viaAI():viaOcr());
  $('rs').innerHTML=h;$('rs').classList.remove('hide');$('ex').classList.remove('hide');$('cmw').classList.remove('hide');$('st3').textContent='تم ✓ — تقدر تعدّل مباشرة قبل التصدير';
 }catch(e){$('st3').textContent=e.message||'تعذّرت المعالجة'}
 $('b4').disabled=false};
function docHtml(el){el=el||$('rs');return '<html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>body{font-family:Cairo,Arial,sans-serif;font-size:14pt;line-height:1.8}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px}</style></head><body>'+el.innerHTML+'</body></html>'}
$('b5').onclick=()=>dl(new Blob(['\ufeff',docHtml()],{type:'application/msword'}),'crazydf.doc');
$('b6').onclick=()=>{const w=window.open('','_blank');if(!w)return;w.document.write(docHtml());w.document.close();w.focus();setTimeout(()=>w.print(),500)};
$('b7').onclick=()=>{navigator.clipboard.writeText($('rs').innerText);$('st3').textContent='تم النسخ ✓'};

function md2html(md){const out=[];let list=false,tbl=false;
 const inl=x=>esc(x).replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|\s)\*([^*\s][^*]*)\*/g,'$1<i>$2</i>');
 const close=()=>{if(list){out.push('</ul>');list=false}if(tbl){out.push('</table>');tbl=false}};
 for(const raw of md.split('\n')){const l=raw.trim();let m;
  if(!l){close();continue}
  if(l[0]=='|'){if(/^\|[\s:|-]+\|?$/.test(l))continue;if(list){out.push('</ul>');list=false}if(!tbl){out.push('<table>');tbl=true}
   out.push('<tr>'+l.replace(/^\||\|$/g,'').split('|').map(c=>'<td dir="auto">'+inl(c.trim())+'</td>').join('')+'</tr>');continue}
  close();
  if(m=l.match(/^(#{1,4})\s+(.*)/)){out.push('<h'+m[1].length+' dir="auto">'+inl(m[2])+'</h'+m[1].length+'>');continue}
  if(m=l.match(/^[-*+]\s+(.*)/)){out.push('<ul><li dir="auto">'+inl(m[1])+'</li></ul>');continue}
  if(/^[-=_*]{3,}$/.test(l))continue;
  out.push('<p dir="auto">'+inl(l)+'</p>')}
 close();return out.join('')}
async function getPage(u){
 try{const r=await fetch('https://r.jina.ai/'+u,{headers:{Accept:'text/plain'}});if(!r.ok)throw 0;const t=await r.text();
  const ti=(t.match(/^Title:\s*(.*)$/m)||[])[1],k=t.indexOf('Markdown Content:'),body=k>=0?t.slice(k+17):t;
  if(body.trim().length<20)throw 0;return (ti?'# '+ti+'\n\n':'')+body}
 catch(e){const r=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(u));if(!r.ok)throw new Error('تعذّر فتح الرابط');
  const d=new DOMParser().parseFromString(await r.text(),'text/html');d.querySelectorAll('script,style,nav,footer,aside,header,form,noscript').forEach(e=>e.remove());
  const root=d.querySelector('article,main')||d.body,pre={H1:'# ',H2:'## ',H3:'### ',H4:'#### ',LI:'- '};
  const md=[...root.querySelectorAll('h1,h2,h3,h4,p,li')].map(e=>(pre[e.tagName]||'')+e.textContent.trim().replace(/\s+/g,' ')).filter(x=>x.replace(/^[#-]+\s*/,'').length>1).join('\n\n');
  if(md.length<20)throw new Error('ما لقيتش نص في الصفحة دي');return (d.title?'# '+d.title+'\n\n':'')+md}}
$('b9').onclick=async()=>{let u=$('ul').value.trim();if(!u)return;if(!/^https?:\/\//i.test(u))u='https://'+u;
 $('b9').disabled=true;$('st4').textContent='جارٍ قراءة الصفحة…';
 try{$('rs4').innerHTML=clean(md2html(await getPage(u)));$('rs4').classList.remove('hide');$('ex4').classList.remove('hide');$('st4').textContent='تم ✓ — تقدر تعدّل مباشرة قبل التصدير'}
 catch(e){$('st4').textContent=e.message||'تعذّر استخراج النص'}
 $('b9').disabled=false};
$('b10').onclick=()=>dl(new Blob(['\ufeff',docHtml($('rs4'))],{type:'application/msword'}),'crazydf-page.doc');
$('b11').onclick=()=>{const w=window.open('','_blank');if(!w)return;w.document.write(docHtml($('rs4')));w.document.close();w.focus();setTimeout(()=>w.print(),500)};
$('b12').onclick=()=>{navigator.clipboard.writeText($('rs4').innerText);$('st4').textContent='تم النسخ ✓'};

/* أي ملف -> PDF */
const CODE=['js','ts','jsx','tsx','py','java','c','cpp','h','cs','php','rb','go','rs','sql','css','xml','yml','yaml','ini','sh','bat','svg','env','conf'];
const pre=t=>'<pre style="white-space:pre-wrap;direction:ltr;text-align:left;font:13px/1.6 monospace">'+esc(t)+'</pre>';
const plain=t=>t.split(/\r?\n/).map(l=>l.trim()?'<p dir="auto" style="margin:.2em 0">'+esc(l)+'</p>':'<br>').join('');
const unx=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
let name5='file';
async function conv5(f){
 $('st5').textContent='جارٍ التحويل…';$('rs5').classList.add('hide');$('ex5').classList.add('hide');
 const ext=(f.name.split('.').pop()||'').toLowerCase();name5=f.name.replace(/\.[^.]+$/,'')||'file';let h='';
 try{
  if(f.type.startsWith('image/'))h='<p style="text-align:center"><img src="'+URL.createObjectURL(f)+'" style="max-width:100%"></p>';
  else if(ext=='pdf')throw new Error('الملف ده PDF أصلاً 🙂');
  else if(ext=='docx'){if(!window.mammoth)throw new Error('تعذّر تحميل مكتبة Word — تأكد من الإنترنت');h=clean((await mammoth.convertToHtml({arrayBuffer:await f.arrayBuffer()})).value)}
  else if(['xlsx','xls','xlsm','ods','csv','tsv'].includes(ext)){if(!window.XLSX)throw new Error('تعذّر تحميل مكتبة Excel — تأكد من الإنترنت');
   const wb=['csv','tsv'].includes(ext)?XLSX.read(await f.text(),{type:'string'}):XLSX.read(await f.arrayBuffer(),{type:'array'});
   h=wb.SheetNames.map(n=>'<h2>'+esc(n)+'</h2>'+clean(XLSX.utils.sheet_to_html(wb.Sheets[n]))).join('')}
  else if(ext=='pptx'){const z=await JSZip.loadAsync(await f.arrayBuffer());
   const ns=Object.keys(z.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>a.match(/\d+/)[0]-b.match(/\d+/)[0]);
   if(!ns.length)throw new Error('ما لقيتش شرائح في الملف');
   for(let i=0;i<ns.length;i++){const xml=await z.file(ns[i]).async('string');
    const ps=[...xml.matchAll(/<a:p[ >][\s\S]*?<\/a:p>/g)].map(p=>[...p[0].matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map(m=>unx(m[1])).join('')).filter(x=>x.trim());
    h+='<h2>شريحة '+(i+1)+'</h2>'+ps.map(x=>'<p dir="auto">'+esc(x)+'</p>').join('')}}
  else if(['html','htm'].includes(ext))h=clean(await f.text());
  else if(['md','markdown'].includes(ext))h=clean(md2html(await f.text()));
  else if(ext=='json'){let t=await f.text();try{t=JSON.stringify(JSON.parse(t),null,2)}catch(e){}h=pre(t)}
  else if(CODE.includes(ext))h=pre(await f.text());
  else{const t=await f.text();
   if(t.includes('\u0000')||(t.match(/\uFFFD/g)||[]).length>t.length*.02)throw new Error('الصيغة .'+ext+' مش مدعومة جوّه المتصفح (زي DWG وDOC القديم). حوّلها من برنامجها الأصلي أو صدّرها لـ docx/xlsx/صورة الأول.');
   h=plain(t)}
  if(!h.trim())throw new Error('الملف فاضي أو مفيش نص يتعرض');
  $('rs5').innerHTML=h;$('rs5').classList.remove('hide');$('ex5').classList.remove('hide');$('st5').textContent='تم ✓ — '+f.name+' — تقدر تعدّل قبل التحميل'
 }catch(e){$('st5').textContent=e.message||'تعذّر التحويل'}}
wire($('d5'),$('f5'),fl=>{if(fl[0])conv5(fl[0])});
$('b13').onclick=async()=>{$('b13').disabled=true;$('st5').textContent='جارٍ إنشاء PDF…';
 try{const {jsPDF}=window.jspdf,c=await html2canvas($('rs5'),{scale:2,backgroundColor:'#ffffff',useCORS:true});
  const pdf=new jsPDF({unit:'mm',format:'a4'}),m=10,iw=190,k=c.width/iw,ph=Math.floor(277*k);
  for(let y=0,i=0;y<c.height;y+=ph,i++){const p=document.createElement('canvas');p.width=c.width;p.height=Math.min(ph,c.height-y);
   p.getContext('2d').drawImage(c,0,y,c.width,p.height,0,0,c.width,p.height);
   if(i)pdf.addPage();pdf.addImage(p.toDataURL('image/jpeg',.95),'JPEG',m,m,iw,p.height/k)}
  pdf.save(name5+'.pdf');$('st5').textContent='تم التحميل ✓'
 }catch(e){$('st5').textContent='تعذّر إنشاء PDF — جرّب "نص قابل للتحديد"'}
 $('b13').disabled=false};
$('b14').onclick=()=>{const w=window.open('','_blank');if(!w)return;w.document.write(docHtml($('rs5')));w.document.close();w.focus();setTimeout(()=>w.print(),600)};
