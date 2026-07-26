"use strict";

(() => {
  const STORAGE_KEY = "characterArchiveWorlds";
  const DEFAULT_COLOR = "#5B67B7";
  const MAX_SOURCE_SIZE = 10 * 1024 * 1024;
  const IMAGE_MAX_EDGE = 1400;
  const IMAGE_QUALITY = 0.86;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const form = document.getElementById("worldForm");
  if (!form) return;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const byId = id => document.getElementById(id);
  const el = {
    worldId:byId("worldId"), name:byId("name"), series:byId("series"), genre:byId("genre"), tags:byId("tags"), summary:byId("summary"),
    imageInput:byId("imageInput"), image:byId("image"), imageDropzone:byId("imageDropzone"), changeImageButton:byId("changeImageButton"), removeImageButton:byId("removeImageButton"), imagePosition:byId("imagePosition"),
    themeColor:byId("themeColor"), themeColorPicker:byId("themeColorPicker"), themeColorError:byId("themeColorError"), imagePreview:byId("imagePreview"), imagePlaceholder:byId("imagePlaceholder"), previewInitial:byId("previewInitial"), themeColorPreview:byId("themeColorPreview"),
    seriesPreview:byId("seriesPreview"), namePreview:byId("namePreview"), genrePreview:byId("genrePreview"), summaryPreview:byId("summaryPreview"), tagPreview:byId("tagPreview"), pageTitle:byId("pageTitle"), saveStatus:byId("saveStatus"), updatedAt:byId("updatedAt"),
    exportWorldButton:byId("exportWorldButton"), printButton:byId("printButton"), scrollToPromptButton:byId("scrollToPromptButton"), promptSection:byId("promptSection"), deleteButton:byId("deleteButton"), deleteDialog:byId("deleteDialog"), deleteDialogClose:byId("deleteDialogClose"), deleteCancelButton:byId("deleteCancelButton"), deleteConfirmButton:byId("deleteConfirmButton"), deleteTargetName:byId("deleteTargetName"), unsavedDialog:byId("unsavedDialog"), unsavedDialogClose:byId("unsavedDialogClose"), unsavedStayButton:byId("unsavedStayButton"), unsavedLeaveButton:byId("unsavedLeaveButton"), toast:byId("toast"), toastMessage:byId("toastMessage")
  };
  const saveButtons = $$(".js-save-world");
  const duplicateButtons = $$(".js-duplicate-world");
  const newButtons = $$("[data-new-world]");
  const state = {mode:"create", id:"", loadedData:null, originalComparable:"", dirty:false, saving:false, pendingUrl:"", toastTimer:0};
  const getValue = node => node ? String(node.value ?? "").trim() : "";
  const setValue = (node,v) => { if(node) node.value = v ?? ""; };
  const setText = (node,v,f="") => { if(node) node.textContent = String(v??"").trim() || f; };
  const createId = () => crypto?.randomUUID?.() || `world-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  const normalizeColor = input => { const t=String(input||"").trim().toUpperCase(); const c=t.startsWith("#")?t:`#${t}`; return /^#[0-9A-F]{6}$/.test(c)?c:""; };
  const splitTags = raw => String(raw||"").split(/[,、，\n]/).map(v=>v.trim()).filter(Boolean).slice(0,20);
  const formatDate = value => { if(!value) return "未保存"; const d=new Date(value); return Number.isNaN(d.getTime())?"未保存":new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d); };
  const sanitize = name => String(name||"").replace(/[\/:*?"<>|]/g,"_").trim() || "world";
  function readWorlds(){ try { const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); return Array.isArray(data)?data:[]; } catch(e){ console.warn(e); return []; } }
  function saveWorld(data){ const list=readWorlds(); const i=list.findIndex(v=>String(v.id)===String(data.id)); if(i>=0) list[i]=data; else list.unshift(data); localStorage.setItem(STORAGE_KEY,JSON.stringify(list)); return data; }
  function deleteWorld(id){ localStorage.setItem(STORAGE_KEY,JSON.stringify(readWorlds().filter(v=>String(v.id)!==String(id)))); }
  function findWorld(id){ return readWorlds().find(v=>String(v.id)===String(id))||null; }
  function getFormObject(){ const data={}; $$('[name]',form).forEach(field=>{ if(field.type!=="file") data[field.name]=field.value; }); return data; }
  function getWorldData(){ const now=new Date().toISOString(); const raw=getFormObject(); return {...raw,id:state.id||getValue(el.worldId)||createId(),image:getValue(el.image),themeColor:normalizeColor(getValue(el.themeColor))||DEFAULT_COLOR,createdAt:state.mode==="edit"&&state.loadedData?.createdAt?state.loadedData.createdAt:now,updatedAt:now}; }
  function comparable(data=getWorldData()){ const copy={...data}; delete copy.updatedAt; return JSON.stringify(copy); }
  function updateStatus(updatedAt=state.loadedData?.updatedAt){ if(el.saveStatus){ el.saveStatus.classList.toggle("is-dirty",state.dirty); el.saveStatus.classList.toggle("is-saved",!state.dirty&&state.mode==="edit"); el.saveStatus.textContent=state.dirty?"未保存の変更あり":state.mode==="edit"?"保存済み":"未保存"; } if(el.updatedAt) el.updatedAt.textContent=formatDate(updatedAt); }
  function markDirty(){ if(state.saving) return; state.dirty=comparable()!==state.originalComparable; updateStatus(); }
  function markClean(data){ state.originalComparable=comparable(data); state.dirty=false; updateStatus(data?.updatedAt); }
  function showToast(message,type="success"){ if(!el.toast||!el.toastMessage) return; clearTimeout(state.toastTimer); el.toastMessage.textContent=message; el.toast.hidden=false; state.toastTimer=setTimeout(()=>el.toast.hidden=true,3200); }
  function openDialog(d){ if(!d)return; if(typeof d.showModal==="function"&&!d.open)d.showModal(); else d.setAttribute("open",""); }
  function closeDialog(d){ if(!d)return; if(typeof d.close==="function"&&d.open)d.close(); else d.removeAttribute("open"); }
  function setBusy(b){ state.saving=!!b; saveButtons.forEach(x=>x.disabled=state.saving); duplicateButtons.forEach(x=>x.disabled=state.saving||state.mode!=="edit"); if(el.deleteButton)el.deleteButton.disabled=state.saving; }
  function updatePreview(){ const color=normalizeColor(getValue(el.themeColor))||DEFAULT_COLOR; document.documentElement.style.setProperty("--preview-color",color); document.documentElement.style.setProperty("--accent-color",color); setText(el.namePreview,getValue(el.name),"世界観名未設定"); setText(el.seriesPreview,getValue(el.series),"作品未設定"); setText(el.genrePreview,getValue(el.genre),"ジャンル未設定"); setText(el.summaryPreview,getValue(el.summary),"世界観の概要を入力すると、ここに表示されます。"); if(el.previewInitial)el.previewInitial.textContent=getValue(el.name)?Array.from(getValue(el.name))[0]:"✦"; if(el.themeColorPreview)el.themeColorPreview.style.backgroundColor=color; if(el.tagPreview)el.tagPreview.replaceChildren(...splitTags(getValue(el.tags)).map(tag=>{const s=document.createElement("span");s.textContent=tag;return s;})); const image=getValue(el.image); if(el.imagePreview&&el.imagePlaceholder){ if(image){el.imagePreview.src=image;el.imagePreview.alt=getValue(el.name)?`${getValue(el.name)}の世界観イメージ`:"世界観イメージ";el.imagePreview.style.objectPosition=getValue(el.imagePosition)||"center";el.imagePreview.hidden=false;el.imagePlaceholder.hidden=true;}else{el.imagePreview.removeAttribute("src");el.imagePreview.hidden=true;el.imagePlaceholder.hidden=false;} } }
  function validate(){ let ok=true; const err=byId("nameError"); if(!getValue(el.name)){el.name?.setAttribute("aria-invalid","true");if(err)err.hidden=false;ok=false;}else{el.name?.removeAttribute("aria-invalid");if(err)err.hidden=true;} const color=normalizeColor(getValue(el.themeColor)); if(!color){el.themeColor?.setAttribute("aria-invalid","true");if(el.themeColorError)el.themeColorError.hidden=false;ok=false;}else{el.themeColor?.removeAttribute("aria-invalid");if(el.themeColorError)el.themeColorError.hidden=true;setValue(el.themeColor,color);setValue(el.themeColorPicker,color);} if(!ok){form.querySelector('[aria-invalid="true"]')?.focus();showToast("入力内容を確認してください。","error");} return ok; }
  function populate(data={}){ $$('[name]',form).forEach(field=>{if(field.type!=="file"&&field.name)field.value=data[field.name]??"";}); const color=normalizeColor(data.themeColor)||DEFAULT_COLOR; setValue(el.themeColor,color);setValue(el.themeColorPicker,color);setValue(el.worldId,data.id||"");setValue(el.image,data.image||"");if(el.imagePosition&&!getValue(el.imagePosition))setValue(el.imagePosition,"center");state.loadedData={...data};updatePreview();updateStatus(data.updatedAt); }
  function setCreate(){ const data={id:createId(),themeColor:DEFAULT_COLOR,imagePosition:"center",image:"",createdAt:"",updatedAt:""};state.mode="create";state.id=data.id;populate(data);if(el.pageTitle)el.pageTitle.textContent="新規世界観";document.title="新規世界観 | Character Archive";duplicateButtons.forEach(x=>x.disabled=true);if(el.deleteButton)el.deleteButton.hidden=true;markClean(data); }
  function setEdit(data){state.mode="edit";state.id=String(data.id);populate(data);if(el.pageTitle)el.pageTitle.textContent=data.name||"世界観編集";document.title=`${data.name||"世界観編集"} | Character Archive`;duplicateButtons.forEach(x=>x.disabled=false);if(el.deleteButton)el.deleteButton.hidden=false;markClean(data);}
  function setDuplicate(source){const data={...source,id:createId(),name:source.name?`${source.name}のコピー`:"",createdAt:"",updatedAt:""};state.mode="duplicate";state.id=data.id;populate(data);if(el.pageTitle)el.pageTitle.textContent="世界観を複製";duplicateButtons.forEach(x=>x.disabled=true);if(el.deleteButton)el.deleteButton.hidden=true;state.originalComparable="";markDirty();}
  function initializeMode(){const p=new URLSearchParams(location.search);const id=p.get("id")||"";if(!id){setCreate();return;}const data=findWorld(id);if(!data){showToast("指定された世界観が見つかりませんでした。","error");setCreate();return;}p.get("mode")==="duplicate"?setDuplicate(data):setEdit(data);}
  async function submit(e){e.preventDefault();if(state.saving||!validate())return;const previous=state.mode;const data=getWorldData();setBusy(true);try{const saved=saveWorld(data);state.mode="edit";state.id=saved.id;populate(saved);markClean(saved);const url=new URL(location.href);url.searchParams.set("id",saved.id);url.searchParams.delete("mode");history.replaceState({},"",url);duplicateButtons.forEach(x=>x.disabled=false);if(el.deleteButton)el.deleteButton.hidden=false;if(el.pageTitle)el.pageTitle.textContent=saved.name||"世界観編集";showToast(previous==="edit"?"世界観を保存しました。":"世界観を登録しました。");}catch(err){console.error(err);showToast("保存に失敗しました。画像容量も確認してください。","error");}finally{setBusy(false);}}
  function loadImage(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result||""));r.onerror=()=>rej(new Error("画像の読み込みに失敗しました。"));r.readAsDataURL(file);});}
  function resizeImage(url,type){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,IMAGE_MAX_EDGE/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const ctx=c.getContext("2d");if(!ctx)return rej(new Error("画像の変換に失敗しました。"));ctx.drawImage(img,0,0,c.width,c.height);res(c.toDataURL(type==="image/png"?"image/png":"image/jpeg",IMAGE_QUALITY));};img.onerror=()=>rej(new Error("画像を表示できませんでした。"));img.src=url;});}
  async function processImage(file){if(!file)return;if(!ALLOWED_TYPES.includes(file.type))return showToast("JPG・PNG・WebP形式を選択してください。","error");if(file.size>MAX_SOURCE_SIZE)return showToast("元画像は10MB以下にしてください。","error");try{setValue(el.image,await resizeImage(await loadImage(file),file.type));updatePreview();markDirty();showToast("画像を読み込みました。");}catch(err){showToast(err.message,"error");}finally{if(el.imageInput)el.imageInput.value="";}}
  async function copyTarget(e){const target=byId(e.currentTarget.dataset.copyTarget);const text=target?.value||target?.textContent||"";if(!text.trim())return showToast("コピーする内容がありません。","error");try{await navigator.clipboard.writeText(text);showToast("コピーしました。");}catch{showToast("コピーに失敗しました。","error");}}
  function exportJson(){const data=getWorldData();const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${sanitize(data.name)}.json`;a.click();URL.revokeObjectURL(a.href);}
  form.addEventListener("submit",submit);
  form.addEventListener("input",e=>{if(e.target===el.themeColor){const c=normalizeColor(getValue(el.themeColor));if(c)setValue(el.themeColorPicker,c);}updatePreview();markDirty();});
  form.addEventListener("change",()=>{updatePreview();markDirty();});
  el.themeColorPicker?.addEventListener("input",()=>{setValue(el.themeColor,getValue(el.themeColorPicker));updatePreview();markDirty();});
  el.imageInput?.addEventListener("change",e=>processImage(e.target.files?.[0]));
  el.changeImageButton?.addEventListener("click",()=>el.imageInput?.click());
  el.removeImageButton?.addEventListener("click",()=>{setValue(el.image,"");updatePreview();markDirty();});
  ["dragenter","dragover"].forEach(n=>el.imageDropzone?.addEventListener(n,e=>{e.preventDefault();el.imageDropzone.classList.add("is-dragover");}));
  ["dragleave","drop"].forEach(n=>el.imageDropzone?.addEventListener(n,e=>{e.preventDefault();el.imageDropzone.classList.remove("is-dragover");}));
  el.imageDropzone?.addEventListener("drop",e=>processImage(e.dataTransfer?.files?.[0]));
  duplicateButtons.forEach(b=>b.addEventListener("click",()=>{if(state.mode!=="edit")return;setDuplicate(getWorldData());history.replaceState({},"",location.pathname);}));
  newButtons.forEach(b=>b.addEventListener("click",()=>{if(state.dirty){state.pendingUrl="world.html";openDialog(el.unsavedDialog);}else location.href="world.html";}));
  $$('[data-copy-target]').forEach(b=>b.addEventListener("click",copyTarget));
  el.exportWorldButton?.addEventListener("click",exportJson);el.printButton?.addEventListener("click",()=>print());el.scrollToPromptButton?.addEventListener("click",()=>el.promptSection?.scrollIntoView({behavior:"smooth"}));
  el.deleteButton?.addEventListener("click",()=>{if(el.deleteTargetName)el.deleteTargetName.textContent=getValue(el.name)||"この世界観";openDialog(el.deleteDialog);});
  el.deleteDialogClose?.addEventListener("click",()=>closeDialog(el.deleteDialog));el.deleteCancelButton?.addEventListener("click",()=>closeDialog(el.deleteDialog));
  el.deleteConfirmButton?.addEventListener("click",()=>{deleteWorld(state.id);state.dirty=false;location.href="index.html";});
  el.unsavedDialogClose?.addEventListener("click",()=>closeDialog(el.unsavedDialog));el.unsavedStayButton?.addEventListener("click",()=>closeDialog(el.unsavedDialog));el.unsavedLeaveButton?.addEventListener("click",()=>{state.dirty=false;if(state.pendingUrl)location.href=state.pendingUrl;});
  $$('a[href]:not([href^="#"])').forEach(a=>a.addEventListener("click",e=>{if(state.dirty&&!state.saving){e.preventDefault();state.pendingUrl=a.href;openDialog(el.unsavedDialog);}}));
  addEventListener("beforeunload",e=>{if(state.dirty&&!state.saving){e.preventDefault();e.returnValue="";}});
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();form.requestSubmit();}if(e.key==="Escape"){closeDialog(el.deleteDialog);closeDialog(el.unsavedDialog);}});
  initializeMode();updatePreview();if(el.toast)el.toast.hidden=true;
})();
