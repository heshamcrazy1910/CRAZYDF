const $=id=>document.getElementById(id);
try{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}catch(e){}
$('t1').onclick=()=>tab(1);$('t2').onclick=()=>tab(2);
function tab(n){$('p1').classList.toggle('hide',n!=1);$('p2').classList.toggle('hide',n!=2);$('t1').classList.toggle('on',n==1);$('t2').classList.toggle('on',n==2)}
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
async function render(p){const ext=$('fmt').value,vp=p.pg.getViewport({scale:+$('sc').value}),c=document.createElement('canvas');
 c.width=vp.width;c.height=vp.height;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
 await p.pg.render({canvasContext:x,viewport:vp}).promise;
 return new Promise(r=>c.toBlob(r,'image/'+ext,.92))}
async function run(sel){
 const list=pages.filter(p=>!sel||p.cb.checked);if(!list.length)return;
 const ext=$('fmt').value=='jpeg'?'jpg':'png';$('st').textContent='جارٍ التحويل…';
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
