import { useState, useEffect, useRef, useCallback } from "react";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtShort = (iso) => iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "";
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
// Pazartesi=0 ... Pazar=6
const firstDay = (y, m) => { let d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };
const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DAYS_LONG = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
const DAYS = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
const HOURS = Array.from({length:24},(_,i)=>i);
const FONT = "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif";
const RECUR_OPTS = [{v:"none",l:"Tekrar yok"},{v:"daily",l:"Her gün"},{v:"weekly",l:"Her hafta"},{v:"monthly",l:"Her ay"}];

// Haftanın günü indeksi (Pzt=0, Paz=6)
const getDayIndex = (date) => { const d = date.getDay(); return d === 0 ? 6 : d - 1; };
const getWeekStart = (date) => {
  const d = new Date(date);
  const idx = getDayIndex(d);
  d.setDate(d.getDate() - idx);
  d.setHours(0,0,0,0);
  return d;
};
const addDays = (date,n) => { const d=new Date(date); d.setDate(d.getDate()+n); return d; };
const isoDate = (d) => d.toISOString().slice(0,10);
const timeToY = (t) => { if(!t) return 0; const [h,m]=t.split(":").map(Number); return h*60+m; };
const nowMinutes = () => { const n=new Date(); return n.getHours()*60+n.getMinutes(); };

const LT={bg:"#F8F8F7",sb:"#F0EDE8",card:"#FFF",border:"#E2DDD6",text:"#1A1917",muted:"#7A7670",faint:"#B0ADA6",acc:"#1A1917",accFg:"#F8F8F7",hdr:"#111110",hdrFg:"#F8F8F7",hover:"#EDEAE4",inp:"#FFF",nc:["#F3EEE6","#E6EEF3","#EEF3E6","#F3E6EE","#FFF6E6"],gc:["#C8E0B4","#B4C8E0","#E0C8B4","#C8B4E0","#E0E0B4","#B4E0D8"],tl:"#4A90E2",dash:"#FFF9F0"};
const DK={bg:"#141312",sb:"#1A1816",card:"#201E1C",border:"#2E2C28",text:"#EDEAE4",muted:"#8A8680",faint:"#4E4C48",acc:"#EDEAE4",accFg:"#141312",hdr:"#0C0B0A",hdrFg:"#EDEAE4",hover:"#262420",inp:"#201E1C",nc:["#262420","#1E2228","#1E2420","#24201E","#262418"],gc:["#1E2E18","#18222E","#2E2218","#22182E","#2E2E1E","#182E2A"],tl:"#4A90E2",dash:"#1A1816"};
const PR_C={yüksek:"#F0A0A0",orta:"#F0D4A0",düşük:"#A0CCA0"};
const PR_D={yüksek:"#3E1818",orta:"#3E3018",düşük:"#183E20"};
const EV_COLORS=[{id:"blue",l:"#4A90E2"},{id:"green",l:"#5BAD6F"},{id:"red",l:"#E25C5C"},{id:"purple",l:"#9B6BE2"},{id:"orange",l:"#E2934A"},{id:"teal",l:"#4ABFBF"}];
const DEFAULT_EVCATS=[{id:"c1",name:"İş",colorId:"blue"},{id:"c2",name:"Kişisel",colorId:"green"},{id:"c3",name:"Aile",colorId:"orange"},{id:"c4",name:"Sağlık",colorId:"red"}];
const evCol=(cid)=>(EV_COLORS.find(c=>c.id===cid)||EV_COLORS[0]).l;
const POMODORO_WORK=25*60, POMODORO_BREAK=5*60;

// XP per level = level * 200
const xpForLevel = (lvl) => lvl * 200;
const XP_PER_TODO = 50;
const GOLD_PER_TODO = 10;

const SHOP_ITEMS = [
  {id:"s1",name:"☕ Kahve Molası",desc:"Hak ettin, bir fincan kahve!",cost:50},
  {id:"s2",name:"🎬 Dizi Bölümü",desc:"Bir bölüm izle, dinlen.",cost:200},
  {id:"s3",name:"🎮 Oyun Saati",desc:"30 dakika oyun zamanı!",cost:300},
  {id:"s4",name:"🍕 Favori Yemek",desc:"Bugün sen seç.",cost:500},
  {id:"s5",name:"😴 Ekstra Uyku",desc:"Yarın biraz geç kalk.",cost:400},
  {id:"s6",name:"🛁 Spa Günü",desc:"Kendine iyi bak.",cost:800},
];

const saveData = async (d) => { try { await window.storage.set("napp-v6", JSON.stringify(d)); } catch {} };
const loadData = async () => { try { const r=await window.storage.get("napp-v6"); if(r) return JSON.parse(r.value); } catch {} return null; };
const defEf=()=>({title:"",date:todayStr(),startTime:"09:00",endTime:"10:00",colorId:"blue",catId:"c1",desc:"",allDay:false,recur:"none"});
const defTf=()=>({title:"",notes:"",groupId:"g1",dueDate:"",dueTime:"",priority:"orta",subtasks:[],tags:[],linkedNoteId:""});

// Konfeti
const Confetti=({active,onDone})=>{
  const canvasRef=useRef();
  useEffect(()=>{
    if(!active) return;
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const pieces=Array.from({length:80},()=>({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height-canvas.height,
      r:Math.random()*6+3, color:`hsl(${Math.random()*360},90%,60%)`,
      vx:(Math.random()-0.5)*4, vy:Math.random()*4+2, rot:Math.random()*360, vr:(Math.random()-0.5)*6
    }));
    let frame; let t=0;
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p=>{
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r); ctx.restore();
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
      });
      t++;
      if(t<90) frame=requestAnimationFrame(draw);
      else { ctx.clearRect(0,0,canvas.width,canvas.height); onDone(); }
    };
    frame=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(frame);
  },[active]);
  if(!active) return null;
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:9999,pointerEvents:"none"}}/>;
};

export default function App() {
  const [dk,setDk]=useState(true); const T=dk?DK:LT;
  const [tab,setTab]=useState("dashboard");
  const [notes,setNotes]=useState([]);
  const [nCats,setNCats]=useState(["Genel","İş","Kişisel","Fikirler"]);
  const [todos,setTodos]=useState([]);
  const [archived,setArchived]=useState([]);
  const [groups,setGroups]=useState([{id:"g1",name:"Genel",ci:0},{id:"g2",name:"İş",ci:1}]);
  const [events,setEvents]=useState([]);
  const [evCats,setEvCats]=useState(DEFAULT_EVCATS);
  const [hiddenCats,setHiddenCats]=useState([]);
  const [allTags,setAllTags]=useState(["acil","bekliyor","alışveriş","fikir"]);
  const [loaded,setLoaded]=useState(false);
  const [search,setSearch]=useState("");
  const [calView,setCalView]=useState("hafta");
  const [calY,setCalY]=useState(new Date().getFullYear());
  const [calM,setCalM]=useState(new Date().getMonth());
  const [calD,setCalD]=useState(new Date().getDate());
  const [weekStart,setWeekStart]=useState(getWeekStart(new Date()));
  const [showEF,setShowEF]=useState(false);
  const [editEId,setEditEId]=useState(null);
  const [ef,setEf]=useState(defEf());
  const [showEDetail,setShowEDetail]=useState(null);
  const [showEvCatF,setShowEvCatF]=useState(false);
  const [newEvCatName,setNewEvCatName]=useState("");
  const [newEvCatColor,setNewEvCatColor]=useState("blue");
  const [showNF,setShowNF]=useState(false);
  const [editNId,setEditNId]=useState(null);
  const [nf,setNf]=useState({title:"",content:"",category:"Genel",image:null});
  const [aCat,setACat]=useState("Tümü");
  const [newCat,setNewCat]=useState(""); const [showCI,setShowCI]=useState(false);
  const [showTF,setShowTF]=useState(false);
  const [editTId,setEditTId]=useState(null);
  const [tf,setTf]=useState(defTf());
  const [aGrp,setAGrp]=useState("Tümü");
  const [aTag,setATag]=useState("");
  const [showGF,setShowGF]=useState(false);
  const [gf,setGf]=useState({name:"",ci:0});
  const [newSub,setNewSub]=useState("");
  const [newTag,setNewTag]=useState("");
  const [pom,setPom]=useState({active:false,mode:"work",remaining:POMODORO_WORK,todoId:null,running:false});
  const pomRef=useRef();

  // Gamification
  const [xp,setXp]=useState(0);
  const [level,setLevel]=useState(1);
  const [gold,setGold]=useState(0);
  const [confetti,setConfetti]=useState(false);
  const [levelUpMsg,setLevelUpMsg]=useState(false);
  const [purchasedItems,setPurchasedItems]=useState([]);
  const [shopMsg,setShopMsg]=useState("");

  const imgRef=useRef(); const nTRef=useRef(); const tTRef=useRef(); const gridRef=useRef();

  useEffect(()=>{
    (async()=>{
      const d=await loadData();
      if(d){
        setNotes(d.notes||[]); setNCats(d.nCats||["Genel","İş","Kişisel","Fikirler"]);
        setTodos(d.todos||[]); setArchived(d.archived||[]);
        setGroups(d.groups||[{id:"g1",name:"Genel",ci:0}]);
        setEvents(d.events||[]); setEvCats(d.evCats||DEFAULT_EVCATS);
        setHiddenCats(d.hiddenCats||[]); setAllTags(d.allTags||["acil","bekliyor","alışveriş","fikir"]);
        setDk(d.dk!==undefined?d.dk:true);
        setXp(d.xp||0); setLevel(d.level||1); setGold(d.gold||0);
        setPurchasedItems(d.purchasedItems||[]);
      }
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{ if((calView==="hafta"||calView==="gün")&&gridRef.current) gridRef.current.scrollTop=8*60; },[calView]);
  useEffect(()=>{
    if(pom.running){
      pomRef.current=setInterval(()=>{
        setPom(p=>{
          if(p.remaining<=1){ clearInterval(pomRef.current); const isWork=p.mode==="work"; return {...p,running:false,mode:isWork?"break":"work",remaining:isWork?POMODORO_BREAK:POMODORO_WORK}; }
          return {...p,remaining:p.remaining-1};
        });
      },1000);
    } else clearInterval(pomRef.current);
    return ()=>clearInterval(pomRef.current);
  },[pom.running]);

  const saveAll=useCallback((patch={})=>{
    const s={notes,nCats,todos,archived,groups,events,evCats,hiddenCats,allTags,dk,xp,level,gold,purchasedItems,...patch};
    saveData(s);
  },[notes,nCats,todos,archived,groups,events,evCats,hiddenCats,allTags,dk,xp,level,gold,purchasedItems]);

  // XP & Gold kazanma
  const earnRewards=(patch={})=>{
    const curXp=(patch.xp!==undefined?patch.xp:xp)+XP_PER_TODO;
    const curGold=(patch.gold!==undefined?patch.gold:gold)+GOLD_PER_TODO;
    const curLevel=patch.level!==undefined?patch.level:level;
    const needed=xpForLevel(curLevel);
    setConfetti(true);
    if(curXp>=needed){
      const newLevel=curLevel+1;
      const leftover=curXp-needed;
      setLevel(newLevel); setXp(leftover); setGold(curGold);
      setLevelUpMsg(true); setTimeout(()=>setLevelUpMsg(false),2500);
      return {xp:leftover,level:newLevel,gold:curGold};
    } else {
      setXp(curXp); setGold(curGold);
      return {xp:curXp,level:curLevel,gold:curGold};
    }
  };

  const expandEvents=(evs,ds)=>{
    const res=[];
    evs.forEach(e=>{
      if(e.date===ds){res.push(e);return;}
      if(e.recur==="daily") res.push({...e,id:e.id+"_"+ds,date:ds,_virtual:true});
      else if(e.recur==="weekly"){
        const base=new Date(e.date); const target=new Date(ds);
        if(getDayIndex(base)===getDayIndex(target)&&target>=base) res.push({...e,id:e.id+"_"+ds,date:ds,_virtual:true});
      } else if(e.recur==="monthly"){
        const base=new Date(e.date); const target=new Date(ds);
        if(base.getDate()===target.getDate()&&target>=base) res.push({...e,id:e.id+"_"+ds,date:ds,_virtual:true});
      }
    });
    return res.filter(e=>!hiddenCats.includes(e.catId));
  };
  const visEvs=(ds)=>expandEvents(events,ds);
  const dayTodos=(ds)=>todos.filter(t=>t.dueDate===ds);

  const openNewEvent=(date="",time="")=>{setEditEId(null);setEf({...defEf(),date:date||todayStr(),startTime:time||"09:00",endTime:time?(String(parseInt(time)+1).padStart(2,"0")+":00"):"10:00"});setShowEF(true);};
  const submitEvent=()=>{if(!ef.title.trim())return;const u=editEId?events.map(e=>e.id===editEId?{...e,...ef}:e):[{id:uid(),...ef},...events];setEvents(u);saveAll({events:u});setShowEF(false);setShowEDetail(null);};
  const delEvent=(id)=>{const u=events.filter(e=>e.id!==id);setEvents(u);saveAll({events:u});setShowEDetail(null);};
  const toggleCatVis=(id)=>{const u=hiddenCats.includes(id)?hiddenCats.filter(c=>c!==id):[...hiddenCats,id];setHiddenCats(u);saveAll({hiddenCats:u});};
  const addEvCat=()=>{if(!newEvCatName.trim())return;const c={id:uid(),name:newEvCatName.trim(),colorId:newEvCatColor};const u=[...evCats,c];setEvCats(u);saveAll({evCats:u});setNewEvCatName("");setShowEvCatF(false);};
  const delEvCat=(id)=>{const u=evCats.filter(c=>c.id!==id);setEvCats(u);saveAll({evCats:u});};

  const submitNote=()=>{if(!nf.title.trim()&&!nf.content.trim())return;const u=editNId?notes.map(n=>n.id===editNId?{...n,...nf,upd:Date.now()}:n):[{id:uid(),...nf,cre:Date.now(),upd:Date.now(),ci:Math.floor(Math.random()*5)},...notes];setNotes(u);saveAll({notes:u});setShowNF(false);};
  const delNote=(id)=>{const u=notes.filter(n=>n.id!==id);setNotes(u);saveAll({notes:u});};
  const addNCat=()=>{const t=newCat.trim();if(!t||nCats.includes(t))return;const u=[...nCats,t];setNCats(u);saveAll({nCats:u});setNewCat("");setShowCI(false);};
  const handleImg=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setNf(x=>({...x,image:ev.target.result}));r.readAsDataURL(f);};

  const submitTodo=()=>{
    if(!tf.title.trim())return;
    const u=editTId?todos.map(t=>t.id===editTId?{...t,...tf,upd:Date.now()}:t):[{id:uid(),...tf,done:false,cre:Date.now(),upd:Date.now()},...todos];
    setTodos(u);saveAll({todos:u});setShowTF(false);
    const nu=[...new Set([...allTags,...tf.tags.filter(t=>!allTags.includes(t))])];
    if(nu.length!==allTags.length){setAllTags(nu);saveAll({todos:u,allTags:nu});}
  };

  const toggleTodo=(id)=>{
    const todo=todos.find(t=>t.id===id);
    const wasUndone=!todo?.done;
    const u=todos.map(t=>t.id===id?{...t,done:!t.done}:t);
    setTodos(u);
    if(wasUndone){
      const rewards=earnRewards();
      saveAll({todos:u,...rewards});
    } else {
      saveAll({todos:u});
    }
  };

  const archiveDone=()=>{const done=todos.filter(t=>t.done);const remain=todos.filter(t=>!t.done);const newArch=[...archived,...done.map(t=>({...t,archivedAt:Date.now()}))];setTodos(remain);setArchived(newArch);saveAll({todos:remain,archived:newArch});};
  const delTodo=(id)=>{const u=todos.filter(t=>t.id!==id);setTodos(u);saveAll({todos:u});};
  const toggleSub=(tid,sid)=>{const u=todos.map(t=>t.id===tid?{...t,subtasks:t.subtasks.map(s=>s.id===sid?{...s,done:!s.done}:s)}:t);setTodos(u);saveAll({todos:u});};
  const openET=(t)=>{setEditTId(t.id);setTf({title:t.title,notes:t.notes||"",groupId:t.groupId,dueDate:t.dueDate||"",dueTime:t.dueTime||"",priority:t.priority||"orta",subtasks:t.subtasks||[],tags:t.tags||[],linkedNoteId:t.linkedNoteId||""});setShowTF(true);};
  const addGroup=()=>{if(!gf.name.trim())return;const g={id:uid(),name:gf.name.trim(),ci:gf.ci};const u=[...groups,g];setGroups(u);saveAll({groups:u});setShowGF(false);setGf({name:"",ci:0});};
  const addSub=()=>{const t=newSub.trim();if(!t)return;setTf(f=>({...f,subtasks:[...f.subtasks,{id:uid(),title:t,done:false}]}));setNewSub("");};
  const addTfTag=(tag)=>{if(!tf.tags.includes(tag))setTf(f=>({...f,tags:[...f.tags,tag]}));setNewTag("");};
  const getG=(id)=>groups.find(g=>g.id===id);

  const buyItem=(item)=>{
    if(gold<item.cost){setShopMsg("❌ Yeterli altın yok!");setTimeout(()=>setShopMsg(""),2000);return;}
    const ng=gold-item.cost;
    setGold(ng);
    setPurchasedItems(p=>[...p,{...item,boughtAt:Date.now()}]);
    saveAll({gold:ng,purchasedItems:[...purchasedItems,{...item,boughtAt:Date.now()}]});
    setShopMsg(`✅ ${item.name} satın alındı!`);
    setTimeout(()=>setShopMsg(""),2500);
  };

  const sq=search.toLowerCase();
  const fNotes=notes.filter(n=>(aCat==="Tümü"||n.category===aCat)&&(!sq||n.title.toLowerCase().includes(sq)||n.content.toLowerCase().includes(sq)));
  const fTodos=todos.filter(t=>(aGrp==="Tümü"||t.groupId===aGrp)&&(aTag===""||( t.tags||[]).includes(aTag))&&(!sq||t.title.toLowerCase().includes(sq)));

  const calCells=()=>{const tot=daysInMonth(calY,calM);const st=firstDay(calY,calM);const c=[];for(let i=0;i<st;i++)c.push(null);for(let d=1;d<=tot;d++)c.push(d);return c;};
  const weekDays=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const weekLabel=()=>{const s=weekDays[0],e=weekDays[6];if(s.getMonth()===e.getMonth())return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;};
  const dayLabel=()=>{const d=new Date(calY,calM,calD);return `${calD} ${MONTHS[calM]} ${calY}, ${DAYS_LONG[getDayIndex(d)]}`;};
  const navPrev=()=>{if(calView==="ay"){if(calM===0){setCalY(y=>y-1);setCalM(11);}else setCalM(m=>m-1);}else if(calView==="hafta")setWeekStart(w=>addDays(w,-7));else{const d=new Date(calY,calM,calD-1);setCalY(d.getFullYear());setCalM(d.getMonth());setCalD(d.getDate());}};
  const navNext=()=>{if(calView==="ay"){if(calM===11){setCalY(y=>y+1);setCalM(0);}else setCalM(m=>m+1);}else if(calView==="hafta")setWeekStart(w=>addDays(w,7));else{const d=new Date(calY,calM,calD+1);setCalY(d.getFullYear());setCalM(d.getMonth());setCalD(d.getDate());}};
  const goToday=()=>{const n=new Date();setCalY(n.getFullYear());setCalM(n.getMonth());setCalD(n.getDate());setWeekStart(getWeekStart(n));};
  const goDayView=(ds)=>{const d=new Date(ds);setCalY(d.getFullYear());setCalM(d.getMonth());setCalD(d.getDate());setCalView("gün");};
  const startPom=(todoId=null)=>setPom({active:true,mode:"work",remaining:POMODORO_WORK,todoId,running:true});
  const togglePomRun=()=>setPom(p=>({...p,running:!p.running}));
  const resetPom=()=>{clearInterval(pomRef.current);setPom({active:false,mode:"work",remaining:POMODORO_WORK,todoId:null,running:false});};
  const pomMins=Math.floor(pom.remaining/60).toString().padStart(2,"0");
  const pomSecs=(pom.remaining%60).toString().padStart(2,"0");
  const pomProgress=(pom.mode==="work"?POMODORO_WORK-pom.remaining:POMODORO_BREAK-pom.remaining)/(pom.mode==="work"?POMODORO_WORK:POMODORO_BREAK)*100;
  const pomTodo=pom.todoId?todos.find(t=>t.id===pom.todoId):null;

  const overdueCount=todos.filter(t=>!t.done&&t.dueDate&&t.dueDate<todayStr()).length;
  const todayEvCount=visEvs(todayStr()).length;
  const todayTodos=dayTodos(todayStr());
  const pendingCount=todos.filter(t=>!t.done).length;
  const doneCount=todos.filter(t=>t.done).length;
  const xpNeeded=xpForLevel(level);
  const xpPct=Math.min((xp/xpNeeded)*100,100);

  const inp={background:T.inp,border:`1px solid ${T.border}`,color:T.text,fontFamily:FONT,outline:"none",borderRadius:"8px",padding:"0.48rem 0.7rem",fontSize:"0.81rem",width:"100%",boxSizing:"border-box",letterSpacing:"-0.01em"};
  const btn=(v="pri")=>({background:v==="pri"?T.acc:"transparent",color:v==="pri"?T.accFg:T.muted,border:v==="pri"?"none":`1px solid ${T.border}`,borderRadius:"7px",padding:"0.4rem 0.82rem",cursor:"pointer",fontFamily:FONT,fontSize:"0.75rem",fontWeight:"600",letterSpacing:"-0.01em"});
  const modal={position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(4px)"};
  const mBox={background:T.card,borderRadius:"14px",padding:"1.45rem",width:"min(96vw,460px)",boxShadow:"0 32px 80px rgba(0,0,0,0.35)",color:T.text,maxHeight:"90vh",overflowY:"auto"};
  const sBtn=(a)=>({background:a?T.acc:"transparent",color:a?T.accFg:T.muted,border:"none",borderRadius:"6px",padding:"0.34rem 0.58rem",textAlign:"left",cursor:"pointer",fontSize:"0.73rem",fontFamily:FONT,fontWeight:"500",display:"flex",alignItems:"center",gap:"0.36rem",width:"100%"});
  const lbl=(txt)=><div style={{fontSize:"0.56rem",fontWeight:"800",color:T.faint,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.32rem",paddingLeft:"0.52rem"}}>{txt}</div>;

  if(!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#141312",color:"#4E4C48",fontFamily:FONT,fontSize:"0.82rem"}}>Yükleniyor…</div>;

  const TABS=[["dashboard","⬡ Ana"],["notlar","Notlar"],["todolar","Todolar"],["takvim","Takvim"],["arşiv","Arşiv"],["pomodoro","🍅"],["ödüller","🏆 Ödüller"]];

  const TimeGrid=({days})=>(
    <div style={{display:"flex",flex:1,overflow:"hidden",flexDirection:"column"}}>
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{width:52,flexShrink:0,fontSize:"0.5rem",color:T.faint,padding:"0.28rem 0.3rem",textAlign:"right",borderRight:`1px solid ${T.border}`,lineHeight:1.3}}>TÜM<br/>GÜN</div>
        {days.map(ds=>{
          const ade=visEvs(ds).filter(e=>e.allDay||!e.startTime);
          const ntt=dayTodos(ds).filter(t=>!t.dueTime);
          return <div key={ds} style={{flex:1,borderRight:`1px solid ${T.border}`,padding:"0.2rem",minHeight:ntt.length+ade.length>0?30:22}}>
            {ade.map(e=><div key={e.id} onClick={()=>!e._virtual&&setShowEDetail(e)} style={{fontSize:"0.58rem",fontWeight:"600",background:evCol(e.colorId||"blue"),color:"#fff",borderRadius:"4px",padding:"1px 5px",marginBottom:"2px",cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{e.title}</div>)}
            {ntt.map(t=><div key={t.id} style={{fontSize:"0.56rem",background:T.hover,borderRadius:"4px",padding:"1px 5px",marginBottom:"2px",color:T.muted,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",textDecoration:t.done?"line-through":"none"}}>✅ {t.title}</div>)}
          </div>;
        })}
      </div>
      <div ref={gridRef} style={{flex:1,overflowY:"auto",position:"relative"}}>
        <div style={{display:"flex",position:"relative",minHeight:1440}}>
          <div style={{width:52,flexShrink:0,borderRight:`1px solid ${T.border}`}}>
            {HOURS.map(h=><div key={h} style={{height:60,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:"0.38rem",paddingTop:"2px"}}>
              <span style={{fontSize:"0.52rem",color:T.faint,fontWeight:"500"}}>{h===0?"":String(h).padStart(2,"0")+":00"}</span>
            </div>)}
          </div>
          {days.map(ds=>{
            const te=visEvs(ds).filter(e=>!e.allDay&&e.startTime);
            const tt=dayTodos(ds).filter(t=>t.dueTime);
            const isToday=ds===todayStr();
            return <div key={ds} onClick={e=>{if(e.target===e.currentTarget){const h=Math.floor(e.nativeEvent.offsetY/60);openNewEvent(ds,String(h).padStart(2,"0")+":00");}}} style={{flex:1,borderRight:`1px solid ${T.border}`,position:"relative",cursor:"crosshair"}}>
              {HOURS.map(h=><div key={h} style={{position:"absolute",top:h*60,left:0,right:0,height:60,borderBottom:`1px solid ${T.border}`,pointerEvents:"none"}}/>)}
              {HOURS.map(h=><div key={"hh"+h} style={{position:"absolute",top:h*60+30,left:0,right:0,borderBottom:`1px dashed ${T.border}`,opacity:0.3,pointerEvents:"none"}}/>)}
              {isToday&&<div style={{position:"absolute",top:nowMinutes(),left:0,right:0,height:2,background:T.tl,zIndex:5,pointerEvents:"none"}}><div style={{position:"absolute",left:-4,top:-3,width:8,height:8,borderRadius:"50%",background:T.tl}}/></div>}
              {te.map(e=>{const top=timeToY(e.startTime);const height=Math.max(timeToY(e.endTime)-timeToY(e.startTime),20);return <div key={e.id} onClick={ev=>{ev.stopPropagation();!e._virtual&&setShowEDetail(e);}} style={{position:"absolute",top,left:2,right:2,height:height-2,background:evCol(e.colorId||"blue"),color:"#fff",borderRadius:"5px",padding:"2px 5px",fontSize:"0.58rem",fontWeight:"600",cursor:"pointer",zIndex:4,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.18)"}}>
                <div style={{overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{e.title}{e.recur!=="none"?" 🔁":""}</div>
                {height>28&&<div style={{opacity:0.85,fontSize:"0.52rem"}}>{e.startTime}–{e.endTime}</div>}
              </div>;})}
              {tt.map(t=><div key={t.id} style={{position:"absolute",top:timeToY(t.dueTime),left:2,right:2,height:22,background:T.hover,border:`1px solid ${T.border}`,borderRadius:"5px",padding:"2px 5px",fontSize:"0.56rem",fontWeight:"500",color:T.muted,zIndex:4,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",textDecoration:t.done?"line-through":"none"}}>✅ {t.title}</div>)}
            </div>;
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{height:"100vh",background:T.bg,color:T.text,fontFamily:FONT,display:"flex",flexDirection:"column",letterSpacing:"-0.01em",overflow:"hidden"}}>
      <Confetti active={confetti} onDone={()=>setConfetti(false)}/>

      {/* LEVEL UP */}
      {levelUpMsg&&<div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:9998,background:"linear-gradient(135deg,#9B6BE2,#4A90E2)",borderRadius:"16px",padding:"2rem 3rem",textAlign:"center",boxShadow:"0 0 60px rgba(155,107,226,0.6)",animation:"pulse 0.5s ease"}}>
        <div style={{fontSize:"2.5rem",marginBottom:"0.3rem"}}>⬆️</div>
        <div style={{fontSize:"1.5rem",fontWeight:"800",color:"#fff",letterSpacing:"-0.04em"}}>LEVEL UP!</div>
        <div style={{fontSize:"0.9rem",color:"rgba(255,255,255,0.8)",marginTop:"0.3rem"}}>Seviye {level} oldun! 🎉</div>
      </div>}

      {/* HEADER */}
      <header style={{background:T.hdr,padding:"0 1rem",display:"flex",alignItems:"center",gap:"0.65rem",height:44,flexShrink:0}}>
        <span style={{color:T.hdrFg,fontWeight:"800",fontSize:"0.78rem",flexShrink:0,letterSpacing:"-0.04em"}}>✦ Çalışma Alanım</span>
        <div style={{display:"flex",gap:"0.05rem",flexWrap:"nowrap",overflow:"hidden"}}>
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?"rgba(255,255,255,0.13)":"transparent",color:tab===k?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.36)",border:"none",borderRadius:"6px",padding:"0.22rem 0.52rem",cursor:"pointer",fontSize:"0.68rem",fontFamily:FONT,fontWeight:"600",whiteSpace:"nowrap"}}>{l}</button>
          ))}
        </div>
        {pom.active&&<div style={{marginLeft:"auto",background:"rgba(255,80,80,0.18)",border:"1px solid rgba(255,80,80,0.35)",borderRadius:"8px",padding:"0.18rem 0.6rem",color:"#FF6B6B",fontSize:"0.7rem",fontWeight:"700",cursor:"pointer",flexShrink:0}} onClick={()=>setTab("pomodoro")}>🍅 {pomMins}:{pomSecs}</div>}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ara…" style={{marginLeft:pom.active?"0.3rem":"auto",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",padding:"0.22rem 0.6rem",color:"rgba(255,255,255,0.85)",fontFamily:FONT,fontSize:"0.7rem",width:130,outline:"none",flexShrink:0}} />
        <button onClick={()=>{const nd=!dk;setDk(nd);saveAll({dk:nd});}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.86rem",padding:0,opacity:0.55,flexShrink:0}}>{dk?"☀":"🌙"}</button>
      </header>

      {/* PROFIL / XP BAR */}
      <div style={{background:dk?"#1A1816":"#F0EDE8",borderBottom:`1px solid ${T.border}`,padding:"0.4rem 1rem",display:"flex",alignItems:"center",gap:"1rem",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#9B6BE2,#4A90E2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem",flexShrink:0}}>⚔️</div>
          <div>
            <div style={{fontSize:"0.62rem",fontWeight:"800",color:T.text,letterSpacing:"-0.02em"}}>Seviye {level}</div>
            <div style={{fontSize:"0.54rem",color:T.muted}}>{xp} / {xpNeeded} XP</div>
          </div>
        </div>
        {/* XP Bar */}
        <div style={{flex:1,height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${xpPct}%`,background:"linear-gradient(90deg,#9B6BE2,#4A90E2)",borderRadius:3,transition:"width 0.5s ease"}}/>
        </div>
        {/* Gold */}
        <div style={{display:"flex",alignItems:"center",gap:"0.3rem",background:dk?"rgba(255,200,50,0.1)":"rgba(255,180,0,0.1)",border:"1px solid rgba(255,180,0,0.3)",borderRadius:"20px",padding:"0.2rem 0.6rem",cursor:"pointer"}} onClick={()=>setTab("ödüller")}>
          <span style={{fontSize:"0.9rem"}}>🪙</span>
          <span style={{fontSize:"0.72rem",fontWeight:"800",color:"#E2934A"}}>{gold}</span>
        </div>
        <div style={{fontSize:"0.6rem",color:T.faint}}>+{XP_PER_TODO}XP +{GOLD_PER_TODO}🪙 / todo</div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* SIDEBAR */}
        <aside style={{width:168,background:T.sb,borderRight:`1px solid ${T.border}`,padding:"0.85rem 0.6rem",display:"flex",flexDirection:"column",gap:"0.12rem",flexShrink:0,overflowY:"auto"}}>
          {tab==="notlar"&&<>{lbl("Kategoriler")}
            {["Tümü",...nCats].map(c=><button key={c} onClick={()=>setACat(c)} style={sBtn(aCat===c)}><span style={{flex:1}}>{c}</span><span style={{opacity:0.36,fontSize:"0.62rem"}}>{c==="Tümü"?notes.length:notes.filter(n=>n.category===c).length}</span></button>)}
            <div style={{marginTop:"0.26rem"}}>{showCI?<div style={{display:"flex",gap:"0.2rem"}}><input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNCat()} placeholder="Kategori" autoFocus style={{...inp,padding:"0.25rem 0.4rem",fontSize:"0.68rem"}}/><button onClick={addNCat} style={{...btn(),padding:"0.25rem 0.48rem"}}>+</button></div>:<button onClick={()=>setShowCI(true)} style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"6px",padding:"0.26rem 0.52rem",color:T.faint,cursor:"pointer",fontSize:"0.66rem",fontFamily:FONT,width:"100%",textAlign:"left"}}>+ Kategori ekle</button>}</div>
          </>}
          {tab==="todolar"&&<>
            {lbl("Gruplar")}
            {["Tümü",...groups.map(g=>g.id)].map(gid=>{const g=gid==="Tümü"?null:getG(gid);return <button key={gid} onClick={()=>setAGrp(gid)} style={sBtn(aGrp===gid)}>{g&&<span style={{width:7,height:7,borderRadius:"50%",background:T.gc[g.ci],flexShrink:0,display:"inline-block"}}/>}<span style={{flex:1}}>{gid==="Tümü"?"Tümü":g?.name}</span><span style={{opacity:0.36,fontSize:"0.62rem"}}>{gid==="Tümü"?todos.length:todos.filter(t=>t.groupId===gid).length}</span></button>;})}
            <button onClick={()=>setShowGF(true)} style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"6px",padding:"0.26rem 0.52rem",color:T.faint,cursor:"pointer",fontSize:"0.66rem",fontFamily:FONT,width:"100%",textAlign:"left",marginTop:"0.26rem"}}>+ Grup ekle</button>
            <div style={{marginTop:"0.55rem",borderTop:`1px solid ${T.border}`,paddingTop:"0.5rem"}}>{lbl("Etiketler")}
              {["", ...allTags].map(tag=><button key={tag} onClick={()=>setATag(tag)} style={sBtn(aTag===tag)}>{tag?`#${tag}`:"Tümü"}</button>)}
            </div>
            <div style={{marginTop:"auto",paddingTop:"0.6rem",borderTop:`1px solid ${T.border}`,fontSize:"0.64rem",color:T.faint,lineHeight:2.1}}>
              <div>✅ {doneCount} tamamlandı</div><div>⏳ {pendingCount} bekliyor</div><div>⚠️ {overdueCount} gecikmiş</div>
            </div>
          </>}
          {tab==="takvim"&&<>
            <button onClick={()=>openNewEvent()} style={{...btn(),width:"100%",marginBottom:"0.52rem",display:"flex",justifyContent:"center"}}>+ Etkinlik</button>
            {lbl("Takvimler")}
            {evCats.map(cat=>{const hidden=hiddenCats.includes(cat.id);return <div key={cat.id} style={{display:"flex",alignItems:"center",gap:"0.32rem",padding:"0.26rem 0.52rem",borderRadius:"6px",cursor:"pointer"}} onClick={()=>toggleCatVis(cat.id)}>
              <div style={{width:10,height:10,borderRadius:"3px",background:hidden?"transparent":evCol(cat.colorId),border:`2px solid ${evCol(cat.colorId)}`,flexShrink:0}}/>
              <span style={{fontSize:"0.72rem",fontWeight:"500",color:hidden?T.faint:T.text,flex:1,textDecoration:hidden?"line-through":"none"}}>{cat.name}</span>
              <button onClick={e=>{e.stopPropagation();delEvCat(cat.id);}} style={{background:"transparent",border:"none",cursor:"pointer",color:T.faint,fontSize:"0.6rem",padding:0,opacity:0}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>✕</button>
            </div>;})}
            {showEvCatF?<div style={{marginTop:"0.22rem",display:"flex",flexDirection:"column",gap:"0.22rem"}}>
              <input value={newEvCatName} onChange={e=>setNewEvCatName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEvCat()} placeholder="Takvim adı" autoFocus style={{...inp,padding:"0.24rem 0.4rem",fontSize:"0.68rem"}}/>
              <div style={{display:"flex",gap:"0.28rem",flexWrap:"wrap"}}>{EV_COLORS.map(c=><button key={c.id} onClick={()=>setNewEvCatColor(c.id)} style={{width:15,height:15,borderRadius:"50%",background:c.l,border:newEvCatColor===c.id?`2.5px solid ${T.text}`:"2px solid transparent",cursor:"pointer"}}/>)}</div>
              <div style={{display:"flex",gap:"0.22rem"}}><button onClick={addEvCat} style={{...btn(),padding:"0.26rem 0.5rem",fontSize:"0.68rem",flex:1}}>Ekle</button><button onClick={()=>setShowEvCatF(false)} style={{...btn("sec"),padding:"0.26rem 0.5rem",fontSize:"0.68rem"}}>İptal</button></div>
            </div>:<button onClick={()=>setShowEvCatF(true)} style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"6px",padding:"0.26rem 0.52rem",color:T.faint,cursor:"pointer",fontSize:"0.66rem",fontFamily:FONT,width:"100%",textAlign:"left",marginTop:"0.18rem"}}>+ Takvim ekle</button>}
            <button onClick={goToday} style={{...sBtn(false),color:T.acc,fontWeight:"700",marginTop:"0.38rem"}}>↩ Bugün</button>
            <div style={{marginTop:"0.65rem",borderTop:`1px solid ${T.border}`,paddingTop:"0.55rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.32rem"}}>
                <button onClick={()=>{if(calM===0){setCalY(y=>y-1);setCalM(11);}else setCalM(m=>m-1);}} style={{background:"transparent",border:"none",cursor:"pointer",color:T.muted,fontSize:"0.68rem",padding:0}}>‹</button>
                <span style={{fontSize:"0.62rem",fontWeight:"700",color:T.text}}>{MONTHS[calM].slice(0,3)} {calY}</span>
                <button onClick={()=>{if(calM===11){setCalY(y=>y+1);setCalM(0);}else setCalM(m=>m+1);}} style={{background:"transparent",border:"none",cursor:"pointer",color:T.muted,fontSize:"0.68rem",padding:0}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"1px"}}>
                {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.44rem",fontWeight:"700",color:T.faint,padding:"1px 0"}}>{d[0]}</div>)}
                {calCells().map((day,i)=>{if(!day)return <div key={`e${i}`}/>;const ds=`${calY}-${String(calM+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const isT=ds===todayStr();const has=(visEvs(ds).length+dayTodos(ds).length)>0;return <div key={day} onClick={()=>goDayView(ds)} style={{textAlign:"center",fontSize:"0.54rem",fontWeight:isT?"800":"400",color:isT?T.accFg:T.text,background:isT?T.acc:"transparent",borderRadius:"50%",width:14,height:14,lineHeight:"14px",cursor:"pointer",margin:"auto",position:"relative"}}>{day}{has&&!isT&&<div style={{position:"absolute",bottom:-1,left:"50%",transform:"translateX(-50%)",width:3,height:3,borderRadius:"50%",background:T.acc}}/>}</div>;})}
              </div>
            </div>
          </>}
          {(tab==="dashboard"||tab==="arşiv"||tab==="pomodoro"||tab==="ödüller")&&<div style={{fontSize:"0.64rem",color:T.faint,padding:"0.5rem 0.52rem",lineHeight:1.9}}>
            <div style={{fontWeight:"700",color:T.text,marginBottom:"0.3rem",fontSize:"0.72rem"}}>Özet</div>
            <div>⚔️ Seviye {level}</div><div>✨ {xp}/{xpNeeded} XP</div><div>🪙 {gold} Altın</div>
            <div style={{marginTop:"0.3rem"}}>📄 {notes.length} not</div><div>✅ {doneCount}/{todos.length+doneCount} todo</div><div>⚠️ {overdueCount} gecikmiş</div>
          </div>}
        </aside>

        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* DASHBOARD */}
          {tab==="dashboard"&&<div style={{flex:1,overflowY:"auto",padding:"1.1rem",background:T.dash}}>
            <h1 style={{fontSize:"1.05rem",fontWeight:"800",color:T.text,margin:"0 0 1rem",letterSpacing:"-0.04em"}}>Günaydın! ☀ <span style={{fontWeight:"400",color:T.muted,fontSize:"0.82rem"}}>{new Date().toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"})}</span></h1>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(128px,1fr))",gap:"0.62rem",marginBottom:"1rem"}}>
              {[["⏳",pendingCount,"Bekleyen","#E2934A"],["⚠️",overdueCount,"Gecikmiş","#E25C5C"],["📅",todayEvCount,"Bugün etkinlik","#4A90E2"],["📄",notes.length,"Not","#9B6BE2"],["⚔️",level,"Seviye","#5BAD6F"],["🪙",gold,"Altın","#E2934A"]].map(([icon,val,lbl2,col])=>(
                <div key={lbl2} style={{background:T.card,borderRadius:"10px",padding:"0.82rem",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:"1.2rem",marginBottom:"0.18rem"}}>{icon}</div>
                  <div style={{fontSize:"1.4rem",fontWeight:"800",color:col,letterSpacing:"-0.05em",lineHeight:1}}>{val}</div>
                  <div style={{fontSize:"0.6rem",color:T.faint,marginTop:"0.15rem",fontWeight:"500"}}>{lbl2}</div>
                </div>
              ))}
            </div>
            <div style={{background:T.card,borderRadius:"10px",padding:"0.88rem",border:`1px solid ${T.border}`,marginBottom:"0.7rem"}}>
              <div style={{fontWeight:"700",fontSize:"0.8rem",color:T.text,letterSpacing:"-0.025em",marginBottom:"0.55rem"}}>📋 Bugünün Todo'ları</div>
              {todayTodos.length===0&&<div style={{fontSize:"0.74rem",color:T.faint}}>Bugün için todo yok.</div>}
              {todayTodos.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.28rem 0",borderBottom:`1px solid ${T.border}`}}>
                <button onClick={()=>toggleTodo(t.id)} style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${t.done?T.acc:T.border}`,background:t.done?T.acc:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{t.done&&<span style={{color:T.accFg,fontSize:"0.44rem"}}>✓</span>}</button>
                <span style={{fontSize:"0.74rem",color:t.done?T.faint:T.text,textDecoration:t.done?"line-through":"none",flex:1}}>{t.title}</span>
                {t.dueTime&&<span style={{fontSize:"0.6rem",color:T.muted}}>⏰ {t.dueTime}</span>}
                <button onClick={()=>startPom(t.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.74rem",opacity:0.5}}>🍅</button>
              </div>)}
            </div>
            <div style={{background:T.card,borderRadius:"10px",padding:"0.88rem",border:`1px solid ${T.border}`,marginBottom:"0.7rem"}}>
              <div style={{fontWeight:"700",fontSize:"0.8rem",color:T.text,marginBottom:"0.55rem"}}>📅 Bugünün Etkinlikleri</div>
              {visEvs(todayStr()).length===0&&<div style={{fontSize:"0.74rem",color:T.faint}}>Bugün için etkinlik yok.</div>}
              {visEvs(todayStr()).map(e=><div key={e.id} style={{display:"flex",alignItems:"center",gap:"0.45rem",padding:"0.28rem 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:evCol(e.colorId||"blue"),flexShrink:0}}/>
                <span style={{fontSize:"0.74rem",color:T.text,flex:1}}>{e.title}</span>
                {!e.allDay&&e.startTime&&<span style={{fontSize:"0.6rem",color:T.muted}}>{e.startTime}</span>}
              </div>)}
            </div>
          </div>}

          {/* NOTLAR */}
          {tab==="notlar"&&<div style={{flex:1,overflowY:"auto",padding:"1.1rem"}}>
            <div style={{maxWidth:820,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem"}}>
                <h1 style={{fontSize:"0.98rem",fontWeight:"800",color:T.text,margin:0,letterSpacing:"-0.04em"}}>{aCat} <span style={{color:T.faint,fontSize:"0.78rem",fontWeight:"400"}}>({fNotes.length})</span></h1>
                <button onClick={()=>{setEditNId(null);setNf({title:"",content:"",category:aCat==="Tümü"?"Genel":aCat,image:null});setShowNF(true);setTimeout(()=>nTRef.current?.focus(),50);}} style={btn()}>+ Yeni Not</button>
              </div>
              {fNotes.length===0&&<div style={{textAlign:"center",color:T.faint,padding:"3rem 0",fontSize:"0.78rem"}}><div style={{fontSize:"1.8rem",marginBottom:"0.5rem"}}>📄</div>{search?`"${search}" bulunamadı`:"Henüz not yok."}</div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(198px,1fr))",gap:"0.65rem"}}>
                {fNotes.map(note=>{
                  const linkedTodos=todos.filter(t=>t.linkedNoteId===note.id);
                  return <div key={note.id} style={{background:T.nc[note.ci??0],borderRadius:"10px",padding:"0.82rem",border:`1px solid ${T.border}`,transition:"transform 0.15s,box-shadow 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                    {note.image&&<img src={note.image} alt="" style={{width:"100%",height:78,objectFit:"cover",borderRadius:"6px",marginBottom:"0.52rem"}}/>}
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.28rem"}}>
                      <h3 style={{margin:0,fontSize:"0.78rem",fontWeight:"700",color:T.text,flex:1,letterSpacing:"-0.025em"}}>{note.title||"Başlıksız"}</h3>
                      <div style={{display:"flex",gap:"0.06rem",marginLeft:"0.18rem"}}>
                        <button onClick={()=>{setEditNId(note.id);setNf({title:note.title,content:note.content,category:note.category,image:note.image||null});setShowNF(true);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.68rem",opacity:0.4,padding:"1px"}}>✏️</button>
                        <button onClick={()=>delNote(note.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.68rem",opacity:0.4,padding:"1px"}}>🗑️</button>
                      </div>
                    </div>
                    <p style={{margin:"0 0 0.52rem",fontSize:"0.7rem",color:T.muted,lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{note.content}</p>
                    {linkedTodos.length>0&&<div style={{marginBottom:"0.38rem"}}>{linkedTodos.map(t=><div key={t.id} style={{fontSize:"0.58rem",color:T.muted,display:"flex",alignItems:"center",gap:"0.25rem"}}><span style={{opacity:0.6}}>✅</span>{t.title}</div>)}</div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:"0.56rem",background:"rgba(0,0,0,0.06)",borderRadius:"20px",padding:"0.08rem 0.38rem",color:T.muted,fontWeight:"500"}}>{note.category}</span>
                      <span style={{fontSize:"0.56rem",color:T.faint}}>{new Date(note.upd).toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}</span>
                    </div>
                  </div>;
                })}
              </div>
            </div>
          </div>}

          {/* TODOLAR */}
          {tab==="todolar"&&<div style={{flex:1,overflowY:"auto",padding:"1.1rem"}}>
            <div style={{maxWidth:660,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem",gap:"0.5rem"}}>
                <h1 style={{fontSize:"0.98rem",fontWeight:"800",color:T.text,margin:0,letterSpacing:"-0.04em"}}>{aGrp==="Tümü"?"Tüm Todolar":getG(aGrp)?.name} <span style={{color:T.faint,fontSize:"0.78rem",fontWeight:"400"}}>({fTodos.length})</span></h1>
                <div style={{display:"flex",gap:"0.35rem"}}>
                  {todos.some(t=>t.done)&&<button onClick={archiveDone} style={{...btn("sec"),fontSize:"0.7rem"}}>📦 Arşivle</button>}
                  <button onClick={()=>{setEditTId(null);setTf(defTf());setShowTF(true);}} style={btn()}>+ Yeni Todo</button>
                </div>
              </div>
              {fTodos.length===0&&<div style={{textAlign:"center",color:T.faint,padding:"3rem 0",fontSize:"0.78rem"}}><div style={{fontSize:"1.8rem",marginBottom:"0.5rem"}}>✅</div>Henüz todo yok.</div>}
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                {fTodos.map(todo=>{
                  const g=getG(todo.groupId);
                  const ov=todo.dueDate&&todo.dueDate<todayStr()&&!todo.done;
                  const prog=todo.subtasks?.length?Math.round(todo.subtasks.filter(s=>s.done).length/todo.subtasks.length*100):null;
                  const linkedNote=todo.linkedNoteId?notes.find(n=>n.id===todo.linkedNoteId):null;
                  return <div key={todo.id} style={{background:T.card,borderRadius:"10px",padding:"0.68rem 0.82rem",border:`1px solid ${T.border}`,opacity:todo.done?0.52:1}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:"0.52rem"}}>
                      <button onClick={()=>toggleTodo(todo.id)} style={{width:15,height:15,borderRadius:"50%",border:`2px solid ${todo.done?T.acc:T.border}`,background:todo.done?T.acc:"transparent",cursor:"pointer",flexShrink:0,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center"}}>{todo.done&&<span style={{color:T.accFg,fontSize:"0.46rem",lineHeight:1}}>✓</span>}</button>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"0.78rem",fontWeight:"500",color:T.text,textDecoration:todo.done?"line-through":"none",marginBottom:"0.12rem"}}>{todo.title}</div>
                        {todo.notes&&<div style={{fontSize:"0.66rem",color:T.muted,marginBottom:"0.22rem"}}>{todo.notes}</div>}
                        {linkedNote&&<div style={{fontSize:"0.6rem",color:T.muted,marginBottom:"0.18rem"}}>📄 {linkedNote.title||"Not bağlı"}</div>}
                        <div style={{display:"flex",gap:"0.26rem",flexWrap:"wrap",alignItems:"center",marginBottom:"0.18rem"}}>
                          {g&&<span style={{fontSize:"0.56rem",fontWeight:"600",background:T.gc[g.ci],borderRadius:"20px",padding:"0.07rem 0.38rem",color:dk?T.text:"#1A1917"}}>{g.name}</span>}
                          <span style={{fontSize:"0.56rem",fontWeight:"600",background:dk?PR_D[todo.priority]:PR_C[todo.priority],borderRadius:"20px",padding:"0.07rem 0.38rem",color:T.text}}>{todo.priority==="yüksek"?"🔴":todo.priority==="orta"?"🟡":"🟢"} {todo.priority}</span>
                          {todo.dueDate&&<span style={{fontSize:"0.56rem",color:ov?"#D04040":T.muted}}>📅 {fmtShort(todo.dueDate)}{todo.dueTime?` ${todo.dueTime}`:""}{ov?" ⚠️":""}</span>}
                          {(todo.tags||[]).map(tag=><span key={tag} style={{fontSize:"0.54rem",background:T.hover,borderRadius:"20px",padding:"0.06rem 0.34rem",color:T.muted,fontWeight:"500"}}>#{tag}</span>)}
                        </div>
                        {prog!==null&&<><div style={{height:2,background:T.border,borderRadius:2,marginBottom:"0.28rem",overflow:"hidden"}}><div style={{height:"100%",width:`${prog}%`,background:T.acc,borderRadius:2,transition:"width 0.3s"}}/></div>
                          {todo.subtasks.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:"0.38rem",padding:"0.13rem 0"}}>
                            <button onClick={()=>toggleSub(todo.id,s.id)} style={{width:11,height:11,borderRadius:"3px",border:`1.5px solid ${s.done?T.acc:T.border}`,background:s.done?T.acc:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.done&&<span style={{color:T.accFg,fontSize:"0.4rem",lineHeight:1}}>✓</span>}</button>
                            <span style={{fontSize:"0.66rem",color:s.done?T.faint:T.muted,textDecoration:s.done?"line-through":"none"}}>{s.title}</span>
                          </div>)}
                          <div style={{fontSize:"0.58rem",color:T.faint,marginTop:"0.14rem"}}>{todo.subtasks.filter(s=>s.done).length}/{todo.subtasks.length} · %{prog}</div>
                        </>}
                      </div>
                      <div style={{display:"flex",gap:"0.06rem",flexShrink:0}}>
                        <button onClick={()=>startPom(todo.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.68rem",opacity:0.3,padding:"2px"}}>🍅</button>
                        <button onClick={()=>openET(todo)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.68rem",opacity:0.3,padding:"2px"}}>✏️</button>
                        <button onClick={()=>delTodo(todo.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.68rem",opacity:0.3,padding:"2px"}}>🗑️</button>
                      </div>
                    </div>
                  </div>;
                })}
              </div>
            </div>
          </div>}

          {/* TAKVİM */}
          {tab==="takvim"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.55rem",padding:"0.55rem 0.95rem",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <button onClick={navPrev} style={btn("sec")}>‹</button>
              <button onClick={navNext} style={btn("sec")}>›</button>
              <h2 style={{margin:0,fontSize:"0.86rem",fontWeight:"700",color:T.text,letterSpacing:"-0.03em"}}>{calView==="ay"?`${MONTHS[calM]} ${calY}`:calView==="hafta"?weekLabel():dayLabel()}</h2>
              <div style={{marginLeft:"auto",display:"flex",gap:"0.15rem",background:T.hover,borderRadius:"8px",padding:"0.15rem"}}>
                {[["gün","Gün"],["hafta","Hafta"],["ay","Ay"]].map(([v,l])=><button key={v} onClick={()=>setCalView(v)} style={{background:calView===v?T.card:"transparent",color:calView===v?T.text:T.muted,border:"none",borderRadius:"6px",padding:"0.26rem 0.6rem",cursor:"pointer",fontSize:"0.7rem",fontFamily:FONT,fontWeight:"600",boxShadow:calView===v?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>{l}</button>)}
              </div>
            </div>
            {calView==="ay"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"0.55rem 0.75rem"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"0.16rem",marginBottom:"0.16rem"}}>
                {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.56rem",fontWeight:"700",color:T.faint,padding:"0.18rem 0",letterSpacing:"0.06em",textTransform:"uppercase"}}>{d}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gridAutoRows:"1fr",gap:"0.16rem",flex:1}}>
                {calCells().map((day,i)=>{if(!day)return <div key={`e${i}`}/>;const ds=`${calY}-${String(calM+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const de=visEvs(ds);const dt=dayTodos(ds);const isT=ds===todayStr();return <div key={day} onClick={()=>goDayView(ds)} style={{borderRadius:"7px",padding:"0.26rem 0.2rem",border:`1.5px solid ${isT?T.acc:T.border}`,background:T.card,cursor:"pointer",overflow:"hidden",minHeight:60}} onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background=T.card}>
                  <div style={{fontSize:"0.64rem",fontWeight:isT?"800":"500",color:isT?T.accFg:T.text,background:isT?T.acc:"transparent",width:isT?16:undefined,height:isT?16:undefined,borderRadius:isT?"50%":"",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:"0.16rem"}}>{day}</div>
                  {de.slice(0,2).map(e=><div key={e.id} onClick={ev=>{ev.stopPropagation();!e._virtual&&setShowEDetail(e);}} style={{fontSize:"0.51rem",fontWeight:"600",background:evCol(e.colorId||"blue"),color:"#fff",borderRadius:"3px",padding:"1px 3px",marginBottom:"2px",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{e.title}{e.recur!=="none"?" 🔁":""}</div>)}
                  {dt.slice(0,1).map(t=><div key={t.id} style={{fontSize:"0.49rem",background:T.hover,borderRadius:"3px",padding:"1px 3px",marginBottom:"2px",color:T.muted,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",textDecoration:t.done?"line-through":"none"}}>✅ {t.title}</div>)}
                  {(de.length+dt.length)>3&&<div style={{fontSize:"0.46rem",color:T.faint,fontWeight:"600"}}>+{de.length+dt.length-3}</div>}
                </div>;})}
              </div>
            </div>}
            {calView==="hafta"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                <div style={{width:52,flexShrink:0,borderRight:`1px solid ${T.border}`}}/>
                {weekDays.map((date,i)=>{const ds=isoDate(date);const isT=ds===todayStr();return <div key={ds} onClick={()=>goDayView(ds)} style={{flex:1,textAlign:"center",padding:"0.4rem 0.18rem",borderRight:`1px solid ${T.border}`,cursor:"pointer"}}>
                  <div style={{fontSize:"0.54rem",fontWeight:"700",color:isT?T.acc:T.faint,letterSpacing:"0.05em",textTransform:"uppercase"}}>{DAYS[i]}</div>
                  <div style={{fontSize:"1rem",fontWeight:"800",color:isT?T.acc:T.text,letterSpacing:"-0.04em",lineHeight:1.1}}>{date.getDate()}</div>
                </div>;})}
              </div>
              <TimeGrid days={weekDays.map(d=>isoDate(d))}/>
            </div>}
            {calView==="gün"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                <div style={{width:52,flexShrink:0,borderRight:`1px solid ${T.border}`}}/>
                <div style={{flex:1,textAlign:"center",padding:"0.4rem 0.18rem"}}>
                  <div style={{fontSize:"0.54rem",fontWeight:"700",color:T.faint,letterSpacing:"0.05em",textTransform:"uppercase"}}>{DAYS_LONG[getDayIndex(new Date(calY,calM,calD))]}</div>
                  <div style={{fontSize:"1.45rem",fontWeight:"800",color:isoDate(new Date(calY,calM,calD))===todayStr()?T.acc:T.text,letterSpacing:"-0.04em",lineHeight:1.1}}>{calD}</div>
                </div>
              </div>
              <TimeGrid days={[`${calY}-${String(calM+1).padStart(2,"0")}-${String(calD).padStart(2,"0")}`]}/>
            </div>}
          </div>}

          {/* ARŞİV */}
          {tab==="arşiv"&&<div style={{flex:1,overflowY:"auto",padding:"1.1rem"}}>
            <div style={{maxWidth:660,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem"}}>
                <h1 style={{fontSize:"0.98rem",fontWeight:"800",color:T.text,margin:0,letterSpacing:"-0.04em"}}>Arşiv <span style={{color:T.faint,fontSize:"0.78rem",fontWeight:"400"}}>({archived.length})</span></h1>
                {archived.length>0&&<button onClick={()=>{setArchived([]);saveAll({archived:[]});}} style={{...btn("sec"),color:"#D04040",borderColor:"#D04040",fontSize:"0.7rem"}}>🗑️ Temizle</button>}
              </div>
              {archived.length===0&&<div style={{textAlign:"center",color:T.faint,padding:"3rem 0",fontSize:"0.78rem"}}><div style={{fontSize:"1.8rem",marginBottom:"0.5rem"}}>📦</div>Arşiv boş.</div>}
              <div style={{display:"flex",flexDirection:"column",gap:"0.38rem"}}>
                {archived.map(t=><div key={t.id} style={{background:T.card,borderRadius:"10px",padding:"0.65rem 0.82rem",border:`1px solid ${T.border}`,opacity:0.65}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                    <div style={{width:14,height:14,borderRadius:"50%",background:T.acc,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:T.accFg,fontSize:"0.44rem"}}>✓</span></div>
                    <div style={{flex:1}}><div style={{fontSize:"0.76rem",fontWeight:"500",color:T.muted,textDecoration:"line-through"}}>{t.title}</div><div style={{fontSize:"0.58rem",color:T.faint}}>{t.archivedAt?new Date(t.archivedAt).toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"}):""}</div></div>
                    <button onClick={()=>{const u=archived.filter(a=>a.id!==t.id);setArchived(u);saveAll({archived:u});}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.64rem",color:T.faint,padding:"2px"}}>✕</button>
                  </div>
                </div>)}
              </div>
            </div>
          </div>}

          {/* POMODORO */}
          {tab==="pomodoro"&&<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"1.5rem"}}>
            <div style={{fontSize:"0.7rem",fontWeight:"700",color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{pom.mode==="work"?"🍅 Odak Zamanı":"☕ Mola"}</div>
            <div style={{position:"relative",width:200,height:200}}>
              <svg width="200" height="200" style={{transform:"rotate(-90deg)"}}>
                <circle cx="100" cy="100" r="88" fill="none" stroke={T.border} strokeWidth="8"/>
                <circle cx="100" cy="100" r="88" fill="none" stroke={pom.mode==="work"?"#E25C5C":"#5BAD6F"} strokeWidth="8" strokeDasharray={`${2*Math.PI*88}`} strokeDashoffset={`${2*Math.PI*88*(1-pomProgress/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.5s"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:"3rem",fontWeight:"800",color:T.text,letterSpacing:"-0.05em",lineHeight:1}}>{pomMins}:{pomSecs}</div>
                <div style={{fontSize:"0.64rem",color:T.faint,marginTop:"0.3rem"}}>{pom.active?pom.mode==="work"?"odak":"mola":"hazır"}</div>
              </div>
            </div>
            {pomTodo&&<div style={{fontSize:"0.8rem",fontWeight:"600",color:T.text,textAlign:"center",maxWidth:260}}>📋 {pomTodo.title}</div>}
            <div style={{display:"flex",gap:"0.65rem"}}>
              <button onClick={togglePomRun} style={{...btn(),padding:"0.65rem 1.5rem",fontSize:"0.85rem"}}>{pom.running?"⏸ Duraklat":"▶ Başlat"}</button>
              <button onClick={resetPom} style={{...btn("sec"),padding:"0.65rem 1.1rem",fontSize:"0.85rem"}}>↺ Sıfırla</button>
            </div>
            <div style={{width:"100%",maxWidth:380}}>
              <div style={{fontSize:"0.64rem",fontWeight:"700",color:T.faint,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.45rem"}}>Görev Seç</div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",maxHeight:180,overflowY:"auto"}}>
                {todos.filter(t=>!t.done).slice(0,8).map(t=><div key={t.id} onClick={()=>startPom(t.id)} style={{display:"flex",alignItems:"center",gap:"0.45rem",padding:"0.4rem 0.6rem",borderRadius:"8px",border:`1px solid ${pom.todoId===t.id?T.acc:T.border}`,background:pom.todoId===t.id?T.hover:T.card,cursor:"pointer"}}>
                  <span style={{fontSize:"0.76rem",flex:1,color:T.text,fontWeight:"500"}}>{t.title}</span>
                  {pom.todoId===t.id&&<span style={{fontSize:"0.6rem",color:T.acc,fontWeight:"700"}}>Seçili</span>}
                </div>)}
              </div>
            </div>
          </div>}

          {/* ÖDÜLLER / MARKET */}
          {tab==="ödüller"&&<div style={{flex:1,overflowY:"auto",padding:"1.1rem"}}>
            <div style={{maxWidth:700,margin:"0 auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
                <h1 style={{fontSize:"0.98rem",fontWeight:"800",color:T.text,margin:0,letterSpacing:"-0.04em"}}>🏆 Ödül Marketi</h1>
                <div style={{display:"flex",alignItems:"center",gap:"0.4rem",background:dk?"rgba(255,200,50,0.1)":"rgba(255,180,0,0.1)",border:"1px solid rgba(255,180,0,0.3)",borderRadius:"20px",padding:"0.3rem 0.8rem"}}>
                  <span style={{fontSize:"1rem"}}>🪙</span>
                  <span style={{fontSize:"0.88rem",fontWeight:"800",color:"#E2934A"}}>{gold} Altın</span>
                </div>
              </div>
              {shopMsg&&<div style={{background:shopMsg.startsWith("✅")?"rgba(91,173,111,0.15)":"rgba(226,92,92,0.15)",border:`1px solid ${shopMsg.startsWith("✅")?"#5BAD6F":"#E25C5C"}`,borderRadius:"8px",padding:"0.6rem 1rem",marginBottom:"0.85rem",fontSize:"0.78rem",color:shopMsg.startsWith("✅")?"#5BAD6F":"#E25C5C",fontWeight:"600"}}>{shopMsg}</div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0.75rem",marginBottom:"1.5rem"}}>
                {SHOP_ITEMS.map(item=>{
                  const canAfford=gold>=item.cost;
                  return <div key={item.id} style={{background:T.card,borderRadius:"12px",padding:"1.1rem",border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:"0.5rem",transition:"transform 0.15s,box-shadow 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                    <div style={{fontSize:"1.8rem"}}>{item.name.split(" ")[0]}</div>
                    <div style={{fontSize:"0.82rem",fontWeight:"700",color:T.text,letterSpacing:"-0.02em"}}>{item.name.split(" ").slice(1).join(" ")}</div>
                    <div style={{fontSize:"0.7rem",color:T.muted,flex:1}}>{item.desc}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.25rem"}}>
                        <span style={{fontSize:"0.85rem"}}>🪙</span>
                        <span style={{fontSize:"0.82rem",fontWeight:"800",color:"#E2934A"}}>{item.cost}</span>
                      </div>
                      <button onClick={()=>buyItem(item)} style={{background:canAfford?"linear-gradient(135deg,#9B6BE2,#4A90E2)":"transparent",color:canAfford?"#fff":T.faint,border:canAfford?"none":`1px solid ${T.border}`,borderRadius:"8px",padding:"0.35rem 0.75rem",cursor:canAfford?"pointer":"not-allowed",fontFamily:FONT,fontSize:"0.72rem",fontWeight:"700"}}>
                        {canAfford?"Satın Al":"Yetersiz"}
                      </button>
                    </div>
                  </div>;
                })}
              </div>
              {purchasedItems.length>0&&<>
                <h2 style={{fontSize:"0.88rem",fontWeight:"800",color:T.text,marginBottom:"0.65rem",letterSpacing:"-0.03em"}}>📦 Satın Alınanlar</h2>
                <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
                  {purchasedItems.slice().reverse().map((item,i)=><div key={i} style={{background:T.card,borderRadius:"8px",padding:"0.6rem 0.9rem",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"0.6rem"}}>
                    <span style={{fontSize:"1.1rem"}}>{item.name.split(" ")[0]}</span>
                    <span style={{fontSize:"0.76rem",fontWeight:"600",color:T.text,flex:1}}>{item.name.split(" ").slice(1).join(" ")}</span>
                    <span style={{fontSize:"0.6rem",color:T.faint}}>{new Date(item.boughtAt).toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}</span>
                    <span style={{fontSize:"0.62rem",color:"#E2934A",fontWeight:"700"}}>-{item.cost}🪙</span>
                  </div>)}
                </div>
              </>}
            </div>
          </div>}
        </main>
      </div>

      {/* MODALLER */}
      {showEF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowEF(false)}>
        <div style={mBox}>
          <h2 style={{margin:"0 0 0.95rem",fontSize:"0.88rem",fontWeight:"800",color:T.text,letterSpacing:"-0.035em"}}>{editEId?"Etkinliği Düzenle":"Yeni Etkinlik"}</h2>
          <input value={ef.title} onChange={e=>setEf(f=>({...f,title:e.target.value}))} placeholder="Etkinlik başlığı" autoFocus style={{...inp,border:"none",borderBottom:`1.5px solid ${T.border}`,borderRadius:0,paddingLeft:0,paddingRight:0,fontSize:"0.9rem",fontWeight:"700",marginBottom:"0.85rem",background:"transparent"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.55rem",marginBottom:"0.8rem"}}>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Tarih</label><input type="date" value={ef.date} onChange={e=>setEf(f=>({...f,date:e.target.value}))} style={inp}/></div>
            <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:"0.45rem"}}><input type="checkbox" id="allday" checked={ef.allDay} onChange={e=>setEf(f=>({...f,allDay:e.target.checked}))} style={{accentColor:T.acc}}/><label htmlFor="allday" style={{fontSize:"0.74rem",color:T.muted,cursor:"pointer",fontWeight:"500"}}>Tüm gün</label></div>
            {!ef.allDay&&<><div><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Başlangıç</label><input type="time" value={ef.startTime} onChange={e=>setEf(f=>({...f,startTime:e.target.value}))} style={inp}/></div><div><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Bitiş</label><input type="time" value={ef.endTime} onChange={e=>setEf(f=>({...f,endTime:e.target.value}))} style={inp}/></div></>}
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Takvim</label><select value={ef.catId} onChange={e=>setEf(f=>({...f,catId:e.target.value}))} style={inp}>{evCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Tekrar</label><select value={ef.recur} onChange={e=>setEf(f=>({...f,recur:e.target.value}))} style={inp}>{RECUR_OPTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
          </div>
          <div style={{marginBottom:"0.8rem"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.28rem",fontWeight:"600"}}>Renk</label><div style={{display:"flex",gap:"0.38rem",flexWrap:"wrap"}}>{EV_COLORS.map(c=><button key={c.id} onClick={()=>setEf(f=>({...f,colorId:c.id}))} style={{width:21,height:21,borderRadius:"50%",background:c.l,border:ef.colorId===c.id?`3px solid ${T.text}`:"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
          <div style={{marginBottom:"0.95rem"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Açıklama</label><textarea value={ef.desc} onChange={e=>setEf(f=>({...f,desc:e.target.value}))} placeholder="Açıklama (isteğe bağlı)" rows={2} style={{...inp,resize:"vertical",lineHeight:1.6}}/></div>
          <div style={{display:"flex",gap:"0.38rem",justifyContent:"flex-end"}}><button onClick={()=>setShowEF(false)} style={btn("sec")}>İptal</button><button onClick={submitEvent} style={btn()}>Kaydet</button></div>
        </div>
      </div>}

      {showEDetail&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowEDetail(null)}>
        <div style={{...mBox,width:"min(96vw,330px)",padding:"1.15rem"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:"0.55rem",marginBottom:"0.7rem"}}>
            <div style={{width:11,height:11,borderRadius:"50%",background:evCol(showEDetail.colorId||"blue"),flexShrink:0,marginTop:3}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:"0.95rem",fontWeight:"800",color:T.text,letterSpacing:"-0.035em",marginBottom:"0.18rem"}}>{showEDetail.title}{showEDetail.recur!=="none"?" 🔁":""}</div>
              <div style={{fontSize:"0.7rem",color:T.muted}}>{fmtShort(showEDetail.date)}{showEDetail.allDay?" · Tüm gün":showEDetail.startTime?` · ${showEDetail.startTime}–${showEDetail.endTime}`:""}</div>
              {showEDetail.catId&&<div style={{fontSize:"0.66rem",color:T.muted,marginTop:"0.18rem"}}>🗂 {evCats.find(c=>c.id===showEDetail.catId)?.name||""}</div>}
              {showEDetail.desc&&<div style={{fontSize:"0.74rem",color:T.muted,marginTop:"0.45rem",lineHeight:1.6}}>{showEDetail.desc}</div>}
            </div>
            <button onClick={()=>setShowEDetail(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.faint,fontSize:"0.95rem",padding:0}}>✕</button>
          </div>
          <div style={{display:"flex",gap:"0.38rem",justifyContent:"flex-end"}}>
            <button onClick={()=>{setEditEId(showEDetail.id);setEf({title:showEDetail.title,date:showEDetail.date,startTime:showEDetail.startTime||"09:00",endTime:showEDetail.endTime||"10:00",colorId:showEDetail.colorId||"blue",catId:showEDetail.catId||evCats[0]?.id||"c1",desc:showEDetail.desc||"",allDay:showEDetail.allDay||false,recur:showEDetail.recur||"none"});setShowEDetail(null);setShowEF(true);}} style={btn("sec")}>✏️ Düzenle</button>
            <button onClick={()=>delEvent(showEDetail.id)} style={{...btn("sec"),color:"#D04040",borderColor:"#D04040"}}>🗑️ Sil</button>
          </div>
        </div>
      </div>}

      {showNF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowNF(false)}>
        <div style={mBox}>
          <h2 style={{margin:"0 0 0.95rem",fontSize:"0.88rem",fontWeight:"800",color:T.text,letterSpacing:"-0.035em"}}>{editNId?"Notu Düzenle":"Yeni Not"}</h2>
          <input ref={nTRef} value={nf.title} onChange={e=>setNf(f=>({...f,title:e.target.value}))} placeholder="Başlık" style={{...inp,border:"none",borderBottom:`1.5px solid ${T.border}`,borderRadius:0,paddingLeft:0,paddingRight:0,fontSize:"0.9rem",fontWeight:"700",marginBottom:"0.82rem",background:"transparent"}}/>
          <textarea value={nf.content} onChange={e=>setNf(f=>({...f,content:e.target.value}))} placeholder="Notunuzu yazın…" rows={5} style={{...inp,resize:"vertical",lineHeight:1.7,marginBottom:"0.82rem"}}/>
          <div style={{marginBottom:"0.82rem"}}><div style={{fontSize:"0.62rem",color:T.muted,marginBottom:"0.28rem",fontWeight:"600"}}>Resim</div>
            {nf.image?<div style={{position:"relative",display:"inline-block"}}><img src={nf.image} alt="" style={{maxHeight:95,borderRadius:"6px",display:"block"}}/><button onClick={()=>setNf(f=>({...f,image:null}))} style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,0.55)",color:"white",border:"none",borderRadius:"50%",width:16,height:16,cursor:"pointer",fontSize:"0.56rem",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>
            :<button onClick={()=>imgRef.current?.click()} style={{...btn("sec"),fontSize:"0.72rem"}}>📷 Resim ekle</button>}
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} style={{display:"none"}}/>
          </div>
          <div style={{marginBottom:"0.95rem"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.26rem",fontWeight:"600"}}>Kategori</label><select value={nf.category} onChange={e=>setNf(f=>({...f,category:e.target.value}))} style={{...inp,width:"auto"}}>{nCats.map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={{display:"flex",gap:"0.38rem",justifyContent:"flex-end"}}><button onClick={()=>setShowNF(false)} style={btn("sec")}>İptal</button><button onClick={submitNote} style={btn()}>Kaydet</button></div>
        </div>
      </div>}

      {showTF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowTF(false)}>
        <div style={mBox}>
          <h2 style={{margin:"0 0 0.95rem",fontSize:"0.88rem",fontWeight:"800",color:T.text,letterSpacing:"-0.035em"}}>{editTId?"Todo Düzenle":"Yeni Todo"}</h2>
          <input ref={tTRef} value={tf.title} onChange={e=>setTf(f=>({...f,title:e.target.value}))} placeholder="Todo başlığı" autoFocus style={{...inp,border:"none",borderBottom:`1.5px solid ${T.border}`,borderRadius:0,paddingLeft:0,paddingRight:0,fontSize:"0.9rem",fontWeight:"700",marginBottom:"0.82rem",background:"transparent"}}/>
          <textarea value={tf.notes} onChange={e=>setTf(f=>({...f,notes:e.target.value}))} placeholder="Notlar (isteğe bağlı)" rows={2} style={{...inp,resize:"vertical",lineHeight:1.6,marginBottom:"0.82rem"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.55rem",marginBottom:"0.82rem"}}>
            <div><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Grup</label><select value={tf.groupId} onChange={e=>setTf(f=>({...f,groupId:e.target.value}))} style={inp}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
            <div><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Öncelik</label><select value={tf.priority} onChange={e=>setTf(f=>({...f,priority:e.target.value}))} style={inp}><option value="yüksek">🔴 Yüksek</option><option value="orta">🟡 Orta</option><option value="düşük">🟢 Düşük</option></select></div>
            <div><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Bitiş Tarihi</label><input type="date" value={tf.dueDate} onChange={e=>setTf(f=>({...f,dueDate:e.target.value}))} style={inp}/></div>
            <div><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>⏰ Saat</label><input type="time" value={tf.dueTime} onChange={e=>setTf(f=>({...f,dueTime:e.target.value}))} style={inp}/></div>
          </div>
          <div style={{marginBottom:"0.82rem"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.26rem",fontWeight:"600"}}>Etiketler</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.28rem",marginBottom:"0.35rem"}}>{tf.tags.map(tag=><span key={tag} style={{fontSize:"0.62rem",background:T.hover,borderRadius:"20px",padding:"0.1rem 0.45rem",color:T.muted,cursor:"pointer",border:`1px solid ${T.border}`}} onClick={()=>setTf(f=>({...f,tags:f.tags.filter(t=>t!==tag)}))}>#{tag} ✕</span>)}</div>
            <div style={{display:"flex",gap:"0.28rem",flexWrap:"wrap"}}>
              {allTags.filter(t=>!tf.tags.includes(t)).map(tag=><button key={tag} onClick={()=>addTfTag(tag)} style={{fontSize:"0.6rem",background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"20px",padding:"0.08rem 0.4rem",color:T.faint,cursor:"pointer",fontFamily:FONT}}>+#{tag}</button>)}
              <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addTfTag(newTag))} placeholder="Yeni etiket" style={{...inp,width:90,padding:"0.18rem 0.4rem",fontSize:"0.62rem"}}/>
            </div>
          </div>
          <div style={{marginBottom:"0.82rem"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.22rem",fontWeight:"600"}}>Not Bağla</label>
            <select value={tf.linkedNoteId} onChange={e=>setTf(f=>({...f,linkedNoteId:e.target.value}))} style={inp}><option value="">— Bağlantı yok —</option>{notes.map(n=><option key={n.id} value={n.id}>{n.title||"Başlıksız"}</option>)}</select>
          </div>
          <div style={{marginBottom:"0.95rem"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.28rem",fontWeight:"600"}}>Alt Görevler</label>
            {tf.subtasks.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:"0.38rem",padding:"0.18rem 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:"0.72rem",color:T.muted,flex:1}}>· {s.title}</span><button onClick={()=>setTf(f=>({...f,subtasks:f.subtasks.filter(x=>x.id!==s.id)}))} style={{background:"transparent",border:"none",cursor:"pointer",color:T.faint,fontSize:"0.68rem",padding:0}}>✕</button></div>)}
            <div style={{display:"flex",gap:"0.28rem",marginTop:"0.35rem"}}><input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addSub())} placeholder="Alt görev ekle…" style={inp}/><button onClick={addSub} style={{...btn(),padding:"0.46rem 0.7rem"}}>+</button></div>
          </div>
          <div style={{display:"flex",gap:"0.38rem",justifyContent:"flex-end"}}><button onClick={()=>setShowTF(false)} style={btn("sec")}>İptal</button><button onClick={submitTodo} style={btn()}>Kaydet</button></div>
        </div>
      </div>}

      {showGF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowGF(false)}>
        <div style={{...mBox,width:"min(96vw,295px)"}}>
          <h2 style={{margin:"0 0 0.95rem",fontSize:"0.88rem",fontWeight:"800",color:T.text,letterSpacing:"-0.035em"}}>Yeni Grup</h2>
          <input value={gf.name} onChange={e=>setGf(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addGroup()} placeholder="Grup adı" style={{...inp,marginBottom:"0.82rem"}} autoFocus/>
          <div style={{marginBottom:"0.95rem"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.32rem",fontWeight:"600"}}>Renk</label><div style={{display:"flex",gap:"0.4rem"}}>{T.gc.map((c,i)=><button key={i} onClick={()=>setGf(f=>({...f,ci:i}))} style={{width:18,height:18,borderRadius:"50%",background:c,border:gf.ci===i?`2.5px solid ${T.acc}`:"2px solid transparent",cursor:"pointer"}}/>)}</div></div>
          <div style={{display:"flex",gap:"0.38rem",justifyContent:"flex-end"}}><button onClick={()=>setShowGF(false)} style={btn("sec")}>İptal</button><button onClick={addGroup} style={btn()}>Oluştur</button></div>
        </div>
      </div>}
    </div>
  );
}
