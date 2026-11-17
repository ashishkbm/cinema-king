const $=s=>document.querySelector(s);
let projects=JSON.parse(localStorage.getItem('ck_projects')||'[]'), current=null, active=0, anim=null;
const save=()=>localStorage.setItem('ck_projects',JSON.stringify(projects));
const uid=()=>Math.random().toString(36).slice(2,10);
const starter=(title='Untitled film',script='')=>({id:uid(),title,created:Date.now(),updated:Date.now(),scenes:(script.trim()?script.split(/\n\s*\n/):['Every great story begins with a single idea.','The details reveal a world worth discovering.','And then, everything changes.']).map((t,i)=>({id:uid(),title:i===0?'THE BEGINNING':`CHAPTER ${String(i+1).padStart(2,'0')}`,narration:t.trim(),image:null,duration:5,look:'night'}))});
function renderLibrary(){ $('#projectCount').textContent=`${projects.length} project${projects.length===1?'':'s'}`;$('#projects').innerHTML=projects.length?projects.map(p=>`<article class="project-card" data-id="${p.id}"><div class="project-mark">♛</div><h3>${esc(p.title)}</h3><small>${p.scenes.length} scenes · Edited ${new Date(p.updated).toLocaleDateString()}</small></article>`).join(''):`<div class="empty"><div class="empty-icon">✦</div><b>Your next great film starts here.</b><p>Create a project to start building your storyboard.</p></div>`;document.querySelectorAll('.project-card').forEach(c=>c.onclick=()=>openProject(c.dataset.id));}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function create(){let title=prompt('Give your film a name','My cinematic story');if(title===null)return;let script=prompt('Paste your story. Leave a blank line between scenes.','');let p=starter(title||'Untitled film',script||'');projects.unshift(p);save();openProject(p.id);}
function openProject(id){current=projects.find(p=>p.id===id);active=0;$('#editor').classList.remove('hidden');$('#projectTitle').textContent=current.title;document.querySelector('.workspace').classList.add('hidden');document.querySelector('.hero').classList.add('hidden');renderEditor();window.scrollTo(0,0);}
function renderEditor(){if(!current)return;$('#projectTitle').textContent=current.title;$('#sceneList').innerHTML=current.scenes.map((s,i)=>`<div class="scene-item ${i===active?'active':''}" data-index="${i}"><img class="scene-thumb" src="${s.image||''}" onerror="this.style.opacity=0.15"><div class="scene-meta"><b>${String(i+1).padStart(2,'0')} · ${esc(s.title||'Untitled scene')}</b><small>${Math.max(1,s.duration||5)} sec</small></div></div>`).join('');document.querySelectorAll('.scene-item').forEach(e=>e.onclick=()=>{active=+e.dataset.index;renderEditor()});let s=current.scenes[active];if(s){$('#sceneTitle').value=s.title||'';$('#sceneNarration').value=s.narration||'';$('#sceneNumber').textContent=`Scene ${active+1}`;$('#sceneCounter').textContent=`SCENE ${String(active+1).padStart(2,'0')} / ${String(current.scenes.length).padStart(2,'0')}`;}drawFrame();}
function updateScene(){let s=current?.scenes[active];if(!s)return;s.title=$('#sceneTitle').value;s.narration=$('#sceneNarration').value;current.updated=Date.now();save();$('#sceneList').querySelectorAll('.scene-item')[active]?.querySelector('b').replaceChildren(document.createTextNode(`${String(active+1).padStart(2,'0')} · ${s.title||'Untitled scene'}`));drawFrame();}
function addScene(){current.scenes.push({id:uid(),title:`CHAPTER ${String(current.scenes.length+1).padStart(2,'0')}`,narration:'Write the next moment of your story.',image:null,duration:5,look:'night'});active=current.scenes.length-1;save();renderEditor();}
function deleteScene(){if(current.scenes.length===1){alert('A film needs at least one scene.');return;}if(!confirm('Delete this scene?'))return;current.scenes.splice(active,1);active=Math.max(0,active-1);save();renderEditor();}
function drawFrame(progress=0){const c=$('#preview'),ctx=c.getContext('2d'),s=current?.scenes[active];if(!s)return;ctx.fillStyle='#090d15';ctx.fillRect(0,0,c.width,c.height);const draw=()=>{if(s.image){let im=new Image();im.onload=()=>{ctx.save();let z=1.12+progress*.10,w=c.width*z,h=c.height*z;ctx.filter='brightness(.55) saturate(.8)';ctx.drawImage(im,(c.width-w)/2,(c.height-h)/2,w,h);ctx.restore();overlay();};im.src=s.image;}else{let g=ctx.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,'#25354b');g.addColorStop(.55,'#121b29');g.addColorStop(1,'#090d15');ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);for(let i=0;i<80;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.16})`;ctx.fillRect((i*197)%c.width,(i*83)%c.height,2,2);}overlay();}};function overlay(){let v=ctx.createRadialGradient(640,340,80,640,360,850);v.addColorStop(0,'transparent');v.addColorStop(1,'rgba(0,0,0,.7)');ctx.fillStyle=v;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#d6ad62';ctx.fillRect(95,490,55,4);ctx.fillStyle='#f3eee4';ctx.font='bold 58px Georgia';wrap(ctx,s.title||'UNTITLED',95,565,1080,68);ctx.fillStyle='#d5d7dc';ctx.font='28px Arial';wrap(ctx,s.narration||'',95,625,1050,38,2);ctx.fillStyle='#d6ad62';ctx.font='bold 17px Arial';ctx.fillText('CINEMA KING ORIGINAL',95,90);}draw();}
function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=2){let words=String(text).split(/\s+/),line='',n=0;for(let w of words){let test=line?line+' '+w:w;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y+n*lineHeight);line=w;n++;if(n>=maxLines-1)break;}else line=test;}if(line){if(n===maxLines-1&&words.length>0){while(ctx.measureText(line+'…').width>maxWidth&&line.length)line=line.slice(0,-1);line+='…';}ctx.fillText(line,x,y+n*lineHeight);}}
async function speak(){
 const s=current?.scenes[active];if(!s)return;
 const voices=('speechSynthesis'in window)?speechSynthesis.getVoices():[];
 if(voices.length){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s.narration||s.title||'');u.rate=.92;speechSynthesis.speak(u);return;}
 await previewRemoteVoice(s.narration||s.title||'Hello from Cinema King');
}
function preview(){if(anim){clearInterval(anim);anim=null;$('#playPreview').textContent='▶ Preview';return;}let t=0;$('#playPreview').textContent='Ⅱ Pause';anim=setInterval(()=>{t+=.025;drawFrame(t);if(t>=1){clearInterval(anim);anim=null;$('#playPreview').textContent='▶ Preview';}},80);}
function next(d){active=(active+d+current.scenes.length)%current.scenes.length;renderEditor();}
function exportProject(){let blob=new Blob([JSON.stringify(current,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(current.title||'cinema-king').replace(/[^a-z0-9-_]/gi,'_')+'.json';a.click();URL.revokeObjectURL(a.href);}
function importProject(file){let r=new FileReader();r.onload=()=>{try{let p=JSON.parse(r.result);if(!p.scenes||!Array.isArray(p.scenes))throw Error();p.id=uid();projects.unshift(p);save();renderLibrary();alert('Project imported.');}catch(e){alert('That project file is not valid.');}};r.readAsText(file);}
async async function compressSceneImage(dataUrl){
 const img=new Image();img.src=dataUrl;await new Promise((ok,bad)=>{img.onload=ok;img.onerror=()=>bad(new Error('Invalid image file'));});
 const max=2200,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,w,h);
 let quality=.86,out=canvas.toDataURL('image/jpeg',quality);
 while(out.length>10*1024*1024&&quality>.55){quality-=.08;out=canvas.toDataURL('image/jpeg',quality);}
 if(out.length>10*1024*1024)throw new Error('Image is too large. Choose a smaller photo.');
 return out;
}
function renderVideo(){if(!window.MediaRecorder){alert('Video recording is not supported in this browser.');return;}let c=document.createElement('canvas');c.width=1280;c.height=720;let x=c.getContext('2d'),stream=c.captureStream(30),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm',rec=new MediaRecorder(stream,{mimeType:mime}),chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onstop=()=>{let b=new Blob(chunks,{type:'video/webm'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(current.title||'cinema-king').replace(/[^a-z0-9-_]/gi,'_')+'.webm';a.click();$('#status').textContent='Render complete. Your WebM video has been saved.';stream.getTracks().forEach(t=>t.stop());};rec.start();$('#renderVideo').disabled=true;$('#status').textContent='Rendering scenes on this device… Keep this app open.';for(let i=0;i<current.scenes.length;i++){let s=current.scenes[i],img=null;if(s.image){img=new Image();img.src=s.image;await new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;});}let frames=Math.max(60,Math.min(300,(s.duration||5)*30));for(let f=0;f<frames;f++){let p=f/frames;x.fillStyle='#080c13';x.fillRect(0,0,1280,720);if(img?.naturalWidth){let scale=1.05+p*.13,w=1280*scale,h=720*scale;x.save();x.filter='brightness(.58) saturate(.8)';x.drawImage(img,(1280-w)/2,(720-h)/2,w,h);x.restore();}else{let g=x.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#26384e');g.addColorStop(1,'#080c13');x.fillStyle=g;x.fillRect(0,0,1280,720);}let v=x.createRadialGradient(640,330,100,640,360,850);v.addColorStop(0,'transparent');v.addColorStop(1,'rgba(0,0,0,.72)');x.fillStyle=v;x.fillRect(0,0,1280,720);x.fillStyle='#d6ad62';x.fillRect(95,490,55,4);x.fillStyle='#f4eee4';x.font='bold 58px Georgia';wrap(x,s.title||'',95,565,1080,68);x.fillStyle='#d5d7dc';x.font='27px Arial';wrap(x,s.narration||'',95,625,1080,38,2);x.fillStyle='#d6ad62';x.font='bold 17px Arial';x.fillText('CINEMA KING ORIGINAL',95,90);await new Promise(r=>setTimeout(r,1000/30));}$('#status').textContent=`Rendering scene ${i+1} of ${current.scenes.length}…`;}rec.stop();$('#renderVideo').disabled=false;}

const RENDER_PREFS='ck_cinematic_render_prefs';
function renderPrefs(){try{return JSON.parse(localStorage.getItem(RENDER_PREFS)||'{}')}catch{return {}}}
function loadRenderPrefs(){const p=renderPrefs();$('#renderServiceUrl').value=p.url||'';$('#renderToken').value='';$('#renderLanguage').value=p.language||'en';$('#renderVoice').value=p.voice||'';$('#renderSize').value=p.size||'1280x720';}
function saveRenderPrefs(){localStorage.setItem(RENDER_PREFS,JSON.stringify({url:$('#renderServiceUrl').value.trim(),language:$('#renderLanguage').value,voice:$('#renderVoice').value.trim(),size:$('#renderSize').value}));}
function renderBase(){return $('#renderServiceUrl').value.trim().replace(/\\/+$/,'');}
async function checkRenderService(){
 const base=renderBase(),btn=$('#checkRenderService'),out=$('#renderServiceStatus');
 if(!base){out.textContent='Enter your public render server URL first. Android cannot use 127.0.0.1 for a server on another computer.';return false;}
 btn.disabled=true;out.textContent='Checking render server…';
 try{
  const r=await fetch(base+'/health',{method:'GET',cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const d=await r.json();const t=d.tools||{};
  const ready=!!d.ready;
  out.textContent=ready?'Connected · renderer ready · '+(d.voices?.length||0)+' detected voices':'Server reachable, but not ready. Missing: '+(d.missing_requirements||Object.keys(t).filter(k=>!t[k]).join(', ')||'check server dependencies');
  out.dataset.state=ready?'ready':'warning';return ready;
 }catch(e){out.textContent='Cannot reach renderer: '+(e.message||e)+'. Check HTTPS URL, server uptime and firewall.';out.dataset.state='error';return false;}
 finally{btn.disabled=false;}
}
async function previewRemoteVoice(text){
 const base=renderBase();if(!base){$('#status').textContent='Device speech is unavailable. Configure the render server URL to preview a server voice.';return;}
 const btn=$('#previewRemoteVoice');if(btn)btn.disabled=true;
 try{
  const headers={'Content-Type':'application/json'},token=$('#renderToken').value.trim();if(token)headers.Authorization='Bearer '+token;
  const r=await fetch(base+'/api/voice-preview',{method:'POST',headers,body:JSON.stringify({text,language:$('#renderLanguage').value,voice:$('#renderVoice').value.trim()||null})});
  if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.detail||('HTTP '+r.status));}
  const blob=await r.blob(),url=URL.createObjectURL(blob),audio=new Audio(url);
  audio.onended=()=>URL.revokeObjectURL(url);await audio.play();$('#status').textContent='Playing server voice preview.';
 }catch(e){$('#status').textContent='Voice preview failed: '+(e.message||e);}
 finally{if(btn)btn.disabled=false;}
}
async function renderWithCinematicEngine(){
 if(!current)return;
 const btn=$('#cinematicRender'),base=$('#renderServiceUrl').value.trim().replace(/\/+$/,'');
 if(!base){$('#status').textContent='Enter your cinematic render service URL first.';return;}
 saveRenderPrefs();btn.disabled=true;$('#status').textContent='Sending storyboard photos and narration to the cinematic renderer…';
 try{
  const headers={'Content-Type':'application/json'};
  const token=$('#renderToken').value.trim();if(token)headers.Authorization='Bearer '+token;
  const response=await fetch(base+'/api/render',{method:'POST',headers,body:JSON.stringify({title:current.title,scenes:current.scenes.map(s=>({title:s.title||'Untitled scene',narration:s.narration||'',duration:s.duration||5,image:s.image||null})),language:$('#renderLanguage').value,voice:$('#renderVoice').value.trim()||null,size:$('#renderSize').value})});
  if(!response.ok){let message='Render service returned '+response.status;try{const data=await response.json();message=data.detail||message}catch{}throw new Error(message);}
  const blob=await response.blob();if(!blob.size)throw new Error('The render service returned an empty video.');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(current.title||'cinema-king').replace(/[^a-z0-9-_]/gi,'_')+'.mp4';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('#status').textContent='Cinematic MP4 received. If the download did not start, check your browser download permissions.';
 }catch(error){$('#status').textContent='Cinematic render failed: '+(error?.message||String(error));}
 finally{btn.disabled=false;}
}

$('#newProject').onclick=create;$('#startBtn').onclick=create;$('#importBtn').onclick=()=>$('#projectFile').click();$('#projectFile').onchange=e=>e.target.files[0]&&importProject(e.target.files[0]);$('#backBtn').onclick=()=>{if(anim)clearInterval(anim);anim=null;$('#editor').classList.add('hidden');$('.workspace').classList.remove('hidden');$('.hero').classList.remove('hidden');current=null;renderLibrary()};$('#sceneTitle').oninput=updateScene;$('#sceneNarration').oninput=updateScene;$('#addScene').onclick=addScene;$('#deleteScene').onclick=deleteScene;$('#prevScene').onclick=()=>next(-1);$('#nextScene').onclick=()=>next(1);$('#playPreview').onclick=preview;$('#speakScene').onclick=speak;$('#exportProject').onclick=exportProject;$('#renderVideo').onclick=renderVideo;$('#sceneImage').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=async()=>{try{const image=await compressSceneImage(r.result);current.scenes[active].image=image;save();renderEditor();$('#status').textContent='Photo added and optimized for cinematic rendering.';}catch(err){$('#status').textContent='Photo could not be processed: '+err.message;}};r.readAsDataURL(f);};renderLibrary();loadRenderPrefs();$('#cinematicRender').onclick=renderWithCinematicEngine;$('#checkRenderService').onclick=checkRenderService;$('#previewRemoteVoice').onclick=()=>previewRemoteVoice(current?.scenes[active]?.narration||current?.scenes[active]?.title||'Hello from Cinema King');['renderServiceUrl','renderToken','renderLanguage','renderVoice','renderSize'].forEach(id=>$('#'+id).addEventListener('change',saveRenderPrefs));if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
