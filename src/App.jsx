import { useState, useEffect, useRef, useCallback } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtShort = (iso) => iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "";
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDay = (y, m) => { let d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };
const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DAYS_LONG = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
const DAYS = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
const HOURS = Array.from({length:24},(_,i)=>i);
const RECUR_OPTS = [{v:"none",l:"Tekrar yok"},{v:"daily",l:"Her gün"},{v:"weekly",l:"Her hafta"},{v:"monthly",l:"Her ay"}];
const getDayIndex = (date) => { const d = date.getDay(); return d === 0 ? 6 : d - 1; };
const getWeekStart = (date) => { const d = new Date(date); d.setDate(d.getDate() - getDayIndex(d)); d.setHours(0,0,0,0); return d; };
const addDays = (date,n) => { const d=new Date(date); d.setDate(d.getDate()+n); return d; };
const isoDate = (d) => d.toISOString().slice(0,10);
const timeToY = (t) => { if(!t) return 0; const [h,m]=t.split(":").map(Number); return h*60+m; };
const nowMinutes = () => { const n=new Date(); return n.getHours()*60+n.getMinutes(); };

// ─── CYBER-DARK Theme ────────────────────────────────────────────────────────
const FONT = "'Syne', 'Space Grotesk', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const CK = {
  // Backgrounds - deep navy/charcoal, NOT pure black
  bg:     "#080C14",
  sb:     "#0A0F1A",
  card:   "rgba(12, 18, 32, 0.85)",
  cardSolid: "#0C1220",
  hdr:    "#060A12",
  dash:   "#080C14",
  inp:    "rgba(15, 22, 40, 0.9)",
  hover:  "rgba(30, 45, 75, 0.6)",

  // Borders & accents
  border:   "rgba(59, 130, 246, 0.15)",
  borderGlow: "rgba(99, 179, 237, 0.4)",

  // Text
  text:   "#E8F4FD",
  muted:  "#7BA4C8",
  faint:  "#3A5A7A",
  hdrFg:  "#E8F4FD",
  accFg:  "#080C14",

  // Accent - electric blue
  acc:    "#38BDF8",

  // Neon palette
  neon1:  "#38BDF8",  // electric blue
  neon2:  "#A78BFA",  // violet
  neon3:  "#34D399",  // emerald
  neon4:  "#F472B6",  // pink
  neon5:  "#FB923C",  // orange

  // Calendar & chart
  tl: "#38BDF8",

  // Note colors (glassmorphic tints)
  nc: [
    "rgba(56,189,248,0.06)",
    "rgba(167,139,250,0.06)",
    "rgba(52,211,153,0.06)",
    "rgba(244,114,182,0.06)",
    "rgba(251,146,60,0.06)",
  ],
  gc: ["#1E3A5F","#2D1E5F","#1E5F3A","#5F1E3A","#5F4A1E","#1E4A5F"],

  PR_C: {yüksek:"rgba(244,63,94,0.2)",orta:"rgba(251,146,60,0.2)",düşük:"rgba(52,211,153,0.2)"},
};

const LT = {
  bg:"#F8F8F7",sb:"#F0EDE8",card:"#FFF",cardSolid:"#FFF",border:"#E2DDD6",borderGlow:"#D0C8BE",
  text:"#1A1917",muted:"#7A7670",faint:"#B0ADA6",acc:"#1A1917",accFg:"#F8F8F7",hdr:"#111110",
  hdrFg:"#F8F8F7",hover:"#EDEAE4",inp:"#FFF",nc:["#F3EEE6","#E6EEF3","#EEF3E6","#F3E6EE","#FFF6E6"],
  gc:["#C8E0B4","#B4C8E0","#E0C8B4","#C8B4E0","#E0E0B4","#B4E0D8"],tl:"#4A90E2",dash:"#FFF9F0",
  neon1:"#2563EB",neon2:"#7C3AED",neon3:"#059669",neon4:"#DB2777",neon5:"#EA580C",
  PR_C:{yüksek:"#F0A0A0",orta:"#F0D4A0",düşük:"#A0CCA0"},
};

const EV_COLORS=[
  {id:"blue",l:"#38BDF8"},{id:"violet",l:"#A78BFA"},{id:"green",l:"#34D399"},
  {id:"pink",l:"#F472B6"},{id:"orange",l:"#FB923C"},{id:"teal",l:"#2DD4BF"}
];
const DEFAULT_EVCATS=[{id:"c1",name:"İş",colorId:"blue"},{id:"c2",name:"Kişisel",colorId:"green"},{id:"c3",name:"Aile",colorId:"orange"},{id:"c4",name:"Sağlık",colorId:"pink"}];
const evCol=(cid)=>(EV_COLORS.find(c=>c.id===cid)||EV_COLORS[0]).l;

const POMODORO_WORK=25*60, POMODORO_BREAK=5*60;
const xpForLevel=(lvl)=>lvl*200;
const XP_PER_TODO=50, GOLD_PER_TODO=10;

const STAT_KEYS=["INT","DEX","FOC","VIT"];
const STAT_LABELS={INT:"Zeka",DEX:"Çeviklik",FOC:"Odak",VIT:"Dayanıklılık"};
const STAT_COLORS={INT:"#38BDF8",DEX:"#34D399",FOC:"#A78BFA",VIT:"#F472B6"};
const STAT_ICONS={INT:"🧠",DEX:"⚡",FOC:"🎯",VIT:"❤️"};

const DEFAULT_TODO_CATS=[
  {id:"tc1",name:"Genel",emoji:"📋",stat:"FOC"},
  {id:"tc2",name:"İş",emoji:"💼",stat:"INT"},
  {id:"tc3",name:"Sağlık",emoji:"❤️",stat:"VIT"},
  {id:"tc4",name:"Öğrenme",emoji:"📚",stat:"INT"},
  {id:"tc5",name:"Egzersiz",emoji:"🏋️",stat:"DEX"},
];

// Project status colors
const PROJECT_COLORS = [
  {id:"blue",  l:"#38BDF8", g:"linear-gradient(135deg,#38BDF8,#0EA5E9)"},
  {id:"violet",l:"#A78BFA", g:"linear-gradient(135deg,#A78BFA,#7C3AED)"},
  {id:"green", l:"#34D399", g:"linear-gradient(135deg,#34D399,#059669)"},
  {id:"pink",  l:"#F472B6", g:"linear-gradient(135deg,#F472B6,#DB2777)"},
  {id:"orange",l:"#FB923C", g:"linear-gradient(135deg,#FB923C,#EA580C)"},
  {id:"teal",  l:"#2DD4BF", g:"linear-gradient(135deg,#2DD4BF,#0D9488)"},
];
const projCol=(cid)=>PROJECT_COLORS.find(c=>c.id===cid)||PROJECT_COLORS[0];

const SHOP_ITEMS=[
  {id:"s1",name:"☕ Kahve Molası",desc:"Hak ettin, bir fincan kahve!",cost:50},
  {id:"s2",name:"🎬 Dizi Bölümü",desc:"Bir bölüm izle, dinlen.",cost:200},
  {id:"s3",name:"🎮 Oyun Saati",desc:"30 dakika oyun zamanı!",cost:300},
  {id:"s4",name:"🍕 Favori Yemek",desc:"Bugün sen seç.",cost:500},
  {id:"s5",name:"😴 Ekstra Uyku",desc:"Yarın biraz geç kalk.",cost:400},
  {id:"s6",name:"🛁 Spa Günü",desc:"Kendine iyi bak.",cost:800},
];

const saveData=async(d)=>{try{await window.storage.set("napp-v8",JSON.stringify(d));}catch{}};
const loadData=async()=>{try{const r=await window.storage.get("napp-v8");if(r)return JSON.parse(r.value);}catch{}return null;};

const defEf=()=>({title:"",date:todayStr(),startTime:"09:00",endTime:"10:00",colorId:"blue",catId:"c1",desc:"",allDay:false,recur:"none",projectId:null});
const defTf=()=>({title:"",notes:"",todoCatId:"tc1",projectId:null,dueDate:"",dueTime:"",priority:"orta",subtasks:[],tags:[],linkedNoteId:""});
const defPf=()=>({name:"",desc:"",colorId:"blue",deadline:"",status:"aktif"});

// ─── Global CSS injected once ────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

* { box-sizing: border-box; }

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.25); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(56,189,248,0.5); }

@keyframes glow-pulse {
  0%,100% { box-shadow: 0 0 8px rgba(56,189,248,0.3); }
  50% { box-shadow: 0 0 20px rgba(56,189,248,0.6), 0 0 40px rgba(56,189,248,0.2); }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes neon-border {
  0%   { border-color: rgba(56,189,248,0.3); }
  33%  { border-color: rgba(167,139,250,0.4); }
  66%  { border-color: rgba(52,211,153,0.3); }
  100% { border-color: rgba(56,189,248,0.3); }
}
@keyframes float-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.cyber-card {
  position: relative;
  background: rgba(12,18,32,0.85);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(56,189,248,0.18);
  border-radius: 14px;
  transition: all 0.25s ease;
}
.cyber-card:hover {
  border-color: rgba(56,189,248,0.45);
  box-shadow: 0 0 0 1px rgba(56,189,248,0.15), 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(56,189,248,0.08);
  transform: translateY(-2px);
}
.cyber-card-violet:hover {
  border-color: rgba(167,139,250,0.5);
  box-shadow: 0 0 0 1px rgba(167,139,250,0.15), 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(167,139,250,0.1);
}
.cyber-card-green:hover {
  border-color: rgba(52,211,153,0.5);
  box-shadow: 0 0 0 1px rgba(52,211,153,0.15), 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(52,211,153,0.1);
}

.glow-btn {
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}
.glow-btn:hover {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 0 16px rgba(56,189,248,0.5), 0 4px 12px rgba(0,0,0,0.3);
}
.glow-btn:active { transform: scale(0.98); }

.glow-btn-violet:hover { box-shadow: 0 0 16px rgba(167,139,250,0.5), 0 4px 12px rgba(0,0,0,0.3); }
.glow-btn-green:hover  { box-shadow: 0 0 16px rgba(52,211,153,0.45), 0 4px 12px rgba(0,0,0,0.3); }

.todo-row {
  transition: all 0.2s ease;
  animation: slide-up 0.2s ease both;
}
.todo-row:hover {
  background: rgba(30,45,75,0.7) !important;
  border-color: rgba(56,189,248,0.3) !important;
  box-shadow: 0 2px 16px rgba(56,189,248,0.08);
}

.project-card {
  animation: float-in 0.3s ease both;
  position: relative;
}
.project-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 1px;
  background: linear-gradient(135deg, transparent 40%, rgba(56,189,248,0.3));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.neon-progress-bar {
  position: relative;
  overflow: visible !important;
}
.neon-progress-bar::after {
  content: '';
  position: absolute;
  right: 0;
  top: -3px;
  width: 6px;
  height: calc(100% + 6px);
  background: inherit;
  border-radius: 50%;
  box-shadow: 0 0 8px 2px currentColor;
  filter: blur(1px);
}

.stat-bar { transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }

.modal-enter {
  animation: float-in 0.25s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}

.tab-active {
  background: rgba(56,189,248,0.15) !important;
  color: #38BDF8 !important;
  box-shadow: inset 0 0 12px rgba(56,189,248,0.08);
}

.sidebar-active {
  background: rgba(56,189,248,0.1) !important;
  color: #38BDF8 !important;
  border-left: 2px solid #38BDF8;
}

input[type=date]::-webkit-calendar-picker-indicator,
input[type=time]::-webkit-calendar-picker-indicator {
  filter: invert(0.7) sepia(1) hue-rotate(180deg);
  opacity: 0.6;
}
`;

// ─── Inject CSS ──────────────────────────────────────────────────────────────
if (!document.getElementById("cyber-styles")) {
  const el = document.createElement("style");
  el.id = "cyber-styles";
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ─── Confetti ────────────────────────────────────────────────────────────────
const Confetti=({active,onDone})=>{
  const ref=useRef();
  useEffect(()=>{
    if(!active)return;
    const canvas=ref.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    canvas.width=window.innerWidth;canvas.height=window.innerHeight;
    const pieces=Array.from({length:100},()=>({
      x:Math.random()*canvas.width,y:-20,r:Math.random()*6+3,
      color:`hsl(${Math.random()*360},90%,65%)`,
      vx:(Math.random()-0.5)*5,vy:Math.random()*5+2,rot:Math.random()*360,vr:(Math.random()-0.5)*8
    }));
    let frame,t=0;
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p=>{
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color;ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r);ctx.restore();
        p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
      });
      t++;
      if(t<120)frame=requestAnimationFrame(draw);
      else{ctx.clearRect(0,0,canvas.width,canvas.height);onDone();}
    };
    frame=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(frame);
  },[active]);
  if(!active)return null;
  return<canvas ref={ref} style={{position:"fixed",inset:0,zIndex:9999,pointerEvents:"none"}}/>;
};

// ─── Radar Chart ─────────────────────────────────────────────────────────────
const RadarChart=({stats,dk})=>{
  const size=180,cx=90,cy=90,r=62;
  const keys=STAT_KEYS,n=keys.length,maxVal=200;
  const angle=(i)=>((i/n)*2*Math.PI)-Math.PI/2;
  const pt=(i,val)=>{const ratio=Math.min(val/maxVal,1);return{x:cx+r*ratio*Math.cos(angle(i)),y:cy+r*ratio*Math.sin(angle(i))};};
  const axPt=(i,ratio=1)=>({x:cx+r*ratio*Math.cos(angle(i)),y:cy+r*ratio*Math.sin(angle(i))});
  const polyPts=keys.map((k,i)=>pt(i,stats[k]||0));
  const polyStr=polyPts.map(p=>`${p.x},${p.y}`).join(" ");
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1"/>
        </radialGradient>
      </defs>
      {[0.25,0.5,0.75,1].map(ratio=>(
        <polygon key={ratio} points={keys.map((_,i)=>{const p=axPt(i,ratio);return`${p.x},${p.y}`;}).join(" ")}
          fill="none" stroke={dk?"rgba(56,189,248,0.12)":"rgba(0,0,0,0.08)"} strokeWidth="1"/>
      ))}
      {keys.map((_,i)=>{const p=axPt(i);return<line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={dk?"rgba(56,189,248,0.15)":"rgba(0,0,0,0.1)"} strokeWidth="1"/>;;})}
      <polygon points={polyStr} fill="url(#radarGrad)" stroke="#38BDF8" strokeWidth="1.5" strokeLinejoin="round"/>
      {polyPts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3.5" fill={STAT_COLORS[keys[i]]} style={{filter:`drop-shadow(0 0 4px ${STAT_COLORS[keys[i]]})`}}/>)}
      {keys.map((k,i)=>{
        const lp=axPt(i,1.28);
        return<text key={k} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill={dk?"#7BA4C8":"#7A7670"} fontFamily={FONT} fontWeight="700">{STAT_ICONS[k]} {k}</text>;
      })}
    </svg>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dk,setDk]=useState(true);
  const T=dk?CK:LT;

  const [tab,setTab]=useState("projeler");
  const [notes,setNotes]=useState([]);
  const [nCats,setNCats]=useState(["Genel","İş","Kişisel","Fikirler"]);
  const [todos,setTodos]=useState([]);
  const [archived,setArchived]=useState([]);
  const [todoCats,setTodoCats]=useState(DEFAULT_TODO_CATS);
  const [projects,setProjects]=useState([]);
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

  // Modals
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
  const [aTodoCat,setATodoCat]=useState("Tümü");
  const [aTag,setATag]=useState("");
  const [newSub,setNewSub]=useState("");
  const [newTag,setNewTag]=useState("");
  const [showCatMgr,setShowCatMgr]=useState(false);
  const [catForm,setCatForm]=useState({name:"",emoji:"📋",stat:"FOC"});
  const [editCatId,setEditCatId]=useState(null);
  const [deleteCatConfirm,setDeleteCatConfirm]=useState(null);

  // Projects
  const [showPF,setShowPF]=useState(false);
  const [editPId,setEditPId]=useState(null);
  const [pf,setPf]=useState(defPf());
  const [activeProject,setActiveProject]=useState(null); // viewed project detail
  const [showPEF,setShowPEF]=useState(false); // project event form
  const [pEf,setPEf]=useState({...defEf()}); // project event form data

  // Pomodoro
  const [pom,setPom]=useState({active:false,mode:"work",remaining:POMODORO_WORK,todoId:null,running:false});
  const pomRef=useRef();

  // Gamification
  const [xp,setXp]=useState(0);
  const [level,setLevel]=useState(1);
  const [gold,setGold]=useState(0);
  const [stats,setStats]=useState({INT:0,DEX:0,FOC:0,VIT:0});
  const [confetti,setConfetti]=useState(false);
  const [levelUpMsg,setLevelUpMsg]=useState(false);
  const [purchasedItems,setPurchasedItems]=useState([]);
  const [shopMsg,setShopMsg]=useState("");

  const imgRef=useRef(); const nTRef=useRef(); const tTRef=useRef(); const gridRef=useRef();

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      const d=await loadData();
      if(d){
        setNotes(d.notes||[]); setNCats(d.nCats||["Genel","İş","Kişisel","Fikirler"]);
        setTodos(d.todos||[]); setArchived(d.archived||[]);
        setTodoCats(d.todoCats||DEFAULT_TODO_CATS);
        setProjects(d.projects||[]);
        setEvents(d.events||[]); setEvCats(d.evCats||DEFAULT_EVCATS);
        setHiddenCats(d.hiddenCats||[]); setAllTags(d.allTags||["acil","bekliyor","alışveriş","fikir"]);
        setDk(d.dk!==undefined?d.dk:true);
        setXp(d.xp||0); setLevel(d.level||1); setGold(d.gold||0);
        setStats(d.stats||{INT:0,DEX:0,FOC:0,VIT:0});
        setPurchasedItems(d.purchasedItems||[]);
      }
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{
    if((calView==="hafta"||calView==="gün")&&gridRef.current) gridRef.current.scrollTop=8*60;
  },[calView]);

  useEffect(()=>{
    if(pom.running){
      pomRef.current=setInterval(()=>{
        setPom(p=>{
          if(p.remaining<=1){ clearInterval(pomRef.current); const iw=p.mode==="work"; return{...p,running:false,mode:iw?"break":"work",remaining:iw?POMODORO_BREAK:POMODORO_WORK}; }
          return{...p,remaining:p.remaining-1};
        });
      },1000);
    } else clearInterval(pomRef.current);
    return()=>clearInterval(pomRef.current);
  },[pom.running]);

  const saveAll=useCallback((patch={})=>{
    const s={notes,nCats,todos,archived,todoCats,projects,events,evCats,hiddenCats,allTags,dk,xp,level,gold,stats,purchasedItems,...patch};
    saveData(s);
  },[notes,nCats,todos,archived,todoCats,projects,events,evCats,hiddenCats,allTags,dk,xp,level,gold,stats,purchasedItems]);

  // ── Rewards ──────────────────────────────────────────────────────────────
  const earnRewards=(todoItem,patch={})=>{
    const cat=todoCats.find(c=>c.id===todoItem?.todoCatId);
    const statKey=cat?.stat||"FOC";
    const curStats={...(patch.stats||stats)};
    curStats[statKey]=(curStats[statKey]||0)+10;
    const curXp=(patch.xp!==undefined?patch.xp:xp)+XP_PER_TODO;
    const curGold=(patch.gold!==undefined?patch.gold:gold)+GOLD_PER_TODO;
    const curLevel=patch.level!==undefined?patch.level:level;
    const needed=xpForLevel(curLevel);
    setConfetti(true); setStats(curStats);
    if(curXp>=needed){
      const nl=curLevel+1,lo=curXp-needed;
      setLevel(nl);setXp(lo);setGold(curGold);
      setLevelUpMsg(true);setTimeout(()=>setLevelUpMsg(false),2500);
      return{xp:lo,level:nl,gold:curGold,stats:curStats};
    } else {
      setXp(curXp);setGold(curGold);
      return{xp:curXp,level:curLevel,gold:curGold,stats:curStats};
    }
  };

  // ── Project helpers ──────────────────────────────────────────────────────
  const getProject=(id)=>projects.find(p=>p.id===id);
  const projectTodos=(pid)=>todos.filter(t=>t.projectId===pid);
  const projectProgress=(pid)=>{
    const pt=projectTodos(pid);
    if(!pt.length)return 0;
    return Math.round(pt.filter(t=>t.done).length/pt.length*100);
  };
  // All project events = events with a projectId
  const projectEvents=(pid)=>events.filter(e=>e.projectId===pid);

  const submitProject=()=>{
    if(!pf.name.trim())return;
    const u=editPId
      ?projects.map(p=>p.id===editPId?{...p,...pf,upd:Date.now()}:p)
      :[{id:uid(),...pf,cre:Date.now(),upd:Date.now()},...projects];
    setProjects(u);saveAll({projects:u});setShowPF(false);setEditPId(null);setPf(defPf());
  };

  const deleteProject=(pid)=>{
    const updatedTodos=todos.map(t=>t.projectId===pid?{...t,projectId:null}:t);
    const updatedEvents=events.filter(e=>e.projectId!==pid);
    const updatedProjects=projects.filter(p=>p.id!==pid);
    setTodos(updatedTodos);setEvents(updatedEvents);setProjects(updatedProjects);
    if(activeProject===pid)setActiveProject(null);
    saveAll({todos:updatedTodos,events:updatedEvents,projects:updatedProjects});
  };

  const submitProjectEvent=()=>{
    if(!pEf.title.trim())return;
    const evt={id:uid(),...pEf,projectId:activeProject,catId:pEf.catId||"c1"};
    const u=[evt,...events];
    setEvents(u);saveAll({events:u});setShowPEF(false);setPEf(defEf());
  };

  // ── Todo CRUD ────────────────────────────────────────────────────────────
  const submitTodo=()=>{
    if(!tf.title.trim())return;
    const u=editTId
      ?todos.map(t=>t.id===editTId?{...t,...tf,upd:Date.now()}:t)
      :[{id:uid(),...tf,done:false,cre:Date.now(),upd:Date.now()},...todos];
    setTodos(u);saveAll({todos:u});setShowTF(false);
    const nu=[...new Set([...allTags,...tf.tags.filter(t=>!allTags.includes(t))])];
    if(nu.length!==allTags.length){setAllTags(nu);saveAll({todos:u,allTags:nu});}
  };

  const toggleTodo=(id)=>{
    const todo=todos.find(t=>t.id===id);
    const wasUndone=!todo?.done;
    const u=todos.map(t=>t.id===id?{...t,done:!t.done}:t);
    setTodos(u);
    if(wasUndone){const rewards=earnRewards(todo);saveAll({todos:u,...rewards});}
    else saveAll({todos:u});
  };

  const archiveDone=()=>{
    const done=todos.filter(t=>t.done),remain=todos.filter(t=>!t.done);
    const na=[...archived,...done.map(t=>({...t,archivedAt:Date.now()}))];
    setTodos(remain);setArchived(na);saveAll({todos:remain,archived:na});
  };
  const delTodo=(id)=>{const u=todos.filter(t=>t.id!==id);setTodos(u);saveAll({todos:u});};
  const toggleSub=(tid,sid)=>{
    const u=todos.map(t=>t.id===tid?{...t,subtasks:t.subtasks.map(s=>s.id===sid?{...s,done:!s.done}:s)}:t);
    setTodos(u);saveAll({todos:u});
  };
  const openET=(t)=>{
    setEditTId(t.id);
    setTf({title:t.title,notes:t.notes||"",todoCatId:t.todoCatId||"tc1",projectId:t.projectId||null,dueDate:t.dueDate||"",dueTime:t.dueTime||"",priority:t.priority||"orta",subtasks:t.subtasks||[],tags:t.tags||[],linkedNoteId:t.linkedNoteId||""});
    setShowTF(true);
  };
  const addSub=()=>{const t=newSub.trim();if(!t)return;setTf(f=>({...f,subtasks:[...f.subtasks,{id:uid(),title:t,done:false}]}));setNewSub("");};
  const addTfTag=(tag)=>{if(!tf.tags.includes(tag))setTf(f=>({...f,tags:[...f.tags,tag]}));setNewTag("");};
  const getTodoCat=(id)=>todoCats.find(c=>c.id===id);

  // ── Note CRUD ────────────────────────────────────────────────────────────
  const submitNote=()=>{
    if(!nf.title.trim()&&!nf.content.trim())return;
    const u=editNId
      ?notes.map(n=>n.id===editNId?{...n,...nf,upd:Date.now()}:n)
      :[{id:uid(),...nf,cre:Date.now(),upd:Date.now(),ci:Math.floor(Math.random()*5)},...notes];
    setNotes(u);saveAll({notes:u});setShowNF(false);
  };
  const delNote=(id)=>{const u=notes.filter(n=>n.id!==id);setNotes(u);saveAll({notes:u});};
  const addNCat=()=>{const t=newCat.trim();if(!t||nCats.includes(t))return;const u=[...nCats,t];setNCats(u);saveAll({nCats:u});setNewCat("");setShowCI(false);};
  const handleImg=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setNf(x=>({...x,image:ev.target.result}));r.readAsDataURL(f);};

  // ── Event CRUD ───────────────────────────────────────────────────────────
  const openNewEvent=(date="",time="")=>{setEditEId(null);setEf({...defEf(),date:date||todayStr(),startTime:time||"09:00",endTime:time?(String(parseInt(time)+1).padStart(2,"0")+":00"):"10:00"});setShowEF(true);};
  const submitEvent=()=>{if(!ef.title.trim())return;const u=editEId?events.map(e=>e.id===editEId?{...e,...ef}:e):[{id:uid(),...ef},...events];setEvents(u);saveAll({events:u});setShowEF(false);setShowEDetail(null);};
  const delEvent=(id)=>{const u=events.filter(e=>e.id!==id);setEvents(u);saveAll({events:u});setShowEDetail(null);};
  const toggleCatVis=(id)=>{const u=hiddenCats.includes(id)?hiddenCats.filter(c=>c!==id):[...hiddenCats,id];setHiddenCats(u);saveAll({hiddenCats:u});};
  const addEvCat=()=>{if(!newEvCatName.trim())return;const c={id:uid(),name:newEvCatName.trim(),colorId:newEvCatColor};const u=[...evCats,c];setEvCats(u);saveAll({evCats:u});setNewEvCatName("");setShowEvCatF(false);};
  const delEvCat=(id)=>{const u=evCats.filter(c=>c.id!==id);setEvCats(u);saveAll({evCats:u});};

  // ── Category CRUD ────────────────────────────────────────────────────────
  const saveCat=()=>{
    if(!catForm.name.trim())return;
    const updated=editCatId
      ?todoCats.map(c=>c.id===editCatId?{...c,...catForm,name:catForm.name.trim()}:c)
      :[...todoCats,{id:uid(),name:catForm.name.trim(),emoji:catForm.emoji,stat:catForm.stat}];
    setTodoCats(updated);saveAll({todoCats:updated});setEditCatId(null);setCatForm({name:"",emoji:"📋",stat:"FOC"});
  };
  const doDeleteCat=(catId,fallbackCatId)=>{
    const fallback=fallbackCatId||(todoCats.find(c=>c.id!==catId)?.id||null);
    const ut=todos.map(t=>t.todoCatId===catId?{...t,todoCatId:fallback}:t);
    const uc=todoCats.filter(c=>c.id!==catId);
    setTodos(ut);setTodoCats(uc);if(aTodoCat===catId)setATodoCat("Tümü");
    saveAll({todos:ut,todoCats:uc});setDeleteCatConfirm(null);
  };

  // ── Calendar helpers ─────────────────────────────────────────────────────
  const expandEvents=(evs,ds)=>{
    const res=[];
    evs.forEach(e=>{
      if(e.date===ds){res.push(e);return;}
      if(e.recur==="daily")res.push({...e,id:e.id+"_"+ds,date:ds,_virtual:true});
      else if(e.recur==="weekly"){const base=new Date(e.date),target=new Date(ds);if(getDayIndex(base)===getDayIndex(target)&&target>=base)res.push({...e,id:e.id+"_"+ds,date:ds,_virtual:true});}
      else if(e.recur==="monthly"){const base=new Date(e.date),target=new Date(ds);if(base.getDate()===target.getDate()&&target>=base)res.push({...e,id:e.id+"_"+ds,date:ds,_virtual:true});}
    });
    return res.filter(e=>!hiddenCats.includes(e.catId));
  };
  const visEvs=(ds)=>expandEvents(events,ds);
  const dayTodos=(ds)=>todos.filter(t=>t.dueDate===ds);
  const calCells=()=>{const tot=daysInMonth(calY,calM),st=firstDay(calY,calM),c=[];for(let i=0;i<st;i++)c.push(null);for(let d=1;d<=tot;d++)c.push(d);return c;};
  const weekDays=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const weekLabel=()=>{const s=weekDays[0],e=weekDays[6];if(s.getMonth()===e.getMonth())return`${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;return`${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;};
  const dayLabel=()=>{const d=new Date(calY,calM,calD);return`${calD} ${MONTHS[calM]} ${calY}, ${DAYS_LONG[getDayIndex(d)]}`;};
  const navPrev=()=>{if(calView==="ay"){if(calM===0){setCalY(y=>y-1);setCalM(11);}else setCalM(m=>m-1);}else if(calView==="hafta")setWeekStart(w=>addDays(w,-7));else{const d=new Date(calY,calM,calD-1);setCalY(d.getFullYear());setCalM(d.getMonth());setCalD(d.getDate());}};
  const navNext=()=>{if(calView==="ay"){if(calM===11){setCalY(y=>y+1);setCalM(0);}else setCalM(m=>m+1);}else if(calView==="hafta")setWeekStart(w=>addDays(w,7));else{const d=new Date(calY,calM,calD+1);setCalY(d.getFullYear());setCalM(d.getMonth());setCalD(d.getDate());}};
  const goToday=()=>{const n=new Date();setCalY(n.getFullYear());setCalM(n.getMonth());setCalD(n.getDate());setWeekStart(getWeekStart(n));};
  const goDayView=(ds)=>{const d=new Date(ds);setCalY(d.getFullYear());setCalM(d.getMonth());setCalD(d.getDate());setCalView("gün");};

  // ── Pomodoro ─────────────────────────────────────────────────────────────
  const startPom=(todoId=null)=>setPom({active:true,mode:"work",remaining:POMODORO_WORK,todoId,running:true});
  const togglePomRun=()=>setPom(p=>({...p,running:!p.running}));
  const resetPom=()=>{clearInterval(pomRef.current);setPom({active:false,mode:"work",remaining:POMODORO_WORK,todoId:null,running:false});};
  const pomMins=Math.floor(pom.remaining/60).toString().padStart(2,"0");
  const pomSecs=(pom.remaining%60).toString().padStart(2,"0");
  const pomProgress=(pom.mode==="work"?POMODORO_WORK-pom.remaining:POMODORO_BREAK-pom.remaining)/(pom.mode==="work"?POMODORO_WORK:POMODORO_BREAK)*100;
  const pomTodo=pom.todoId?todos.find(t=>t.id===pom.todoId):null;

  // ── Computed ─────────────────────────────────────────────────────────────
  const overdueCount=todos.filter(t=>!t.done&&t.dueDate&&t.dueDate<todayStr()).length;
  const todayEvCount=visEvs(todayStr()).length;
  const todayTodos=dayTodos(todayStr());
  const pendingCount=todos.filter(t=>!t.done).length;
  const doneCount=todos.filter(t=>t.done).length;
  const xpNeeded=xpForLevel(level);
  const xpPct=Math.min((xp/xpNeeded)*100,100);
  const sq=search.toLowerCase();
  const fNotes=notes.filter(n=>(aCat==="Tümü"||n.category===aCat)&&(!sq||n.title.toLowerCase().includes(sq)||n.content.toLowerCase().includes(sq)));
  const fTodos=todos.filter(t=>(aTodoCat==="Tümü"||t.todoCatId===aTodoCat)&&(aTag===""||( t.tags||[]).includes(aTag))&&(!sq||t.title.toLowerCase().includes(sq)));

  // ── Styles ───────────────────────────────────────────────────────────────
  const inp=dk?{
    background:"rgba(15,22,40,0.9)",border:"1px solid rgba(56,189,248,0.2)",color:T.text,
    fontFamily:FONT,outline:"none",borderRadius:"8px",padding:"0.55rem 0.8rem",
    fontSize:"0.86rem",width:"100%",boxSizing:"border-box",letterSpacing:"-0.01em",
    backdropFilter:"blur(8px)",transition:"border-color 0.2s"
  }:{
    background:"#FFF",border:"1px solid #E2DDD6",color:T.text,fontFamily:FONT,
    outline:"none",borderRadius:"8px",padding:"0.55rem 0.8rem",fontSize:"0.86rem",
    width:"100%",boxSizing:"border-box",letterSpacing:"-0.01em"
  };

  const btn=(v="pri",neonColor="blue")=>{
    const colors={blue:"#38BDF8",violet:"#A78BFA",green:"#34D399",pink:"#F472B6",orange:"#FB923C"};
    const c=colors[neonColor]||colors.blue;
    if(v==="pri") return{
      background:dk?`linear-gradient(135deg,${c},${c}aa)`:`#1A1917`,
      color:dk?"#080C14":"#F8F8F7",border:"none",borderRadius:"8px",
      padding:"0.48rem 0.92rem",cursor:"pointer",fontFamily:FONT,
      fontSize:"0.8rem",fontWeight:"700",letterSpacing:"-0.01em",
    };
    return{
      background:"transparent",color:dk?T.muted:T.muted,
      border:dk?`1px solid rgba(56,189,248,0.2)`:`1px solid #E2DDD6`,
      borderRadius:"8px",padding:"0.48rem 0.92rem",cursor:"pointer",
      fontFamily:FONT,fontSize:"0.8rem",fontWeight:"600",letterSpacing:"-0.01em",
    };
  };

  const modal={position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(6px)"};
  const mBox=dk?{
    background:"rgba(10,15,28,0.97)",backdropFilter:"blur(24px)",
    border:"1px solid rgba(56,189,248,0.25)",borderRadius:"16px",padding:"1.6rem",
    width:"min(96vw,480px)",boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.1)",
    color:T.text,maxHeight:"90vh",overflowY:"auto",
  }:{
    background:"#FFF",borderRadius:"16px",padding:"1.6rem",width:"min(96vw,480px)",
    boxShadow:"0 32px 80px rgba(0,0,0,0.25)",color:T.text,maxHeight:"90vh",overflowY:"auto",
  };

  const sBtn=(a)=>dk?{
    background:a?"rgba(56,189,248,0.12)":"transparent",
    color:a?"#38BDF8":T.muted,
    border:"none",borderLeft:a?"2px solid #38BDF8":"2px solid transparent",
    borderRadius:"0 6px 6px 0",padding:"0.38rem 0.65rem",textAlign:"left",cursor:"pointer",
    fontSize:"0.78rem",fontFamily:FONT,fontWeight:"500",display:"flex",alignItems:"center",gap:"0.4rem",width:"100%",
    transition:"all 0.15s",
  }:{
    background:a?"rgba(26,25,23,0.08)":"transparent",color:a?T.text:T.muted,
    border:"none",borderRadius:"6px",padding:"0.38rem 0.65rem",textAlign:"left",cursor:"pointer",
    fontSize:"0.78rem",fontFamily:FONT,fontWeight:"500",display:"flex",alignItems:"center",gap:"0.4rem",width:"100%",
  };

  const lbl=(txt)=><div style={{fontSize:"0.6rem",fontWeight:"800",color:T.faint,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"0.35rem",paddingLeft:"0.55rem",marginTop:"0.6rem"}}>{txt}</div>;

  if(!loaded)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#080C14",color:"#3A5A7A",fontFamily:FONT,fontSize:"0.9rem",letterSpacing:"0.1em",textTransform:"uppercase"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
        <div style={{width:40,height:40,border:"2px solid #38BDF8",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        Yükleniyor…
      </div>
    </div>
  );

  const TABS=[["projeler","◈ Projeler"],["notlar","Notlar"],["todolar","Todolar"],["takvim","Takvim"],["arşiv","Arşiv"],["pomodoro","🍅"],["ödüller","🏆"]];

  // ── TimeGrid ──────────────────────────────────────────────────────────────
  const TimeGrid=({days})=>(
    <div style={{display:"flex",flex:1,overflow:"hidden",flexDirection:"column"}}>
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{width:56,flexShrink:0,fontSize:"0.55rem",color:T.faint,padding:"0.3rem",textAlign:"right",borderRight:`1px solid ${T.border}`,lineHeight:1.3}}>TÜM<br/>GÜN</div>
        {days.map(ds=>{
          const ade=visEvs(ds).filter(e=>e.allDay||!e.startTime);
          const ntt=dayTodos(ds).filter(t=>!t.dueTime);
          return<div key={ds} style={{flex:1,borderRight:`1px solid ${T.border}`,padding:"0.2rem",minHeight:ntt.length+ade.length>0?32:24}}>
            {ade.map(e=><div key={e.id} onClick={()=>!e._virtual&&setShowEDetail(e)} style={{fontSize:"0.62rem",fontWeight:"700",background:evCol(e.colorId||"blue")+"33",border:`1px solid ${evCol(e.colorId||"blue")}66`,color:evCol(e.colorId||"blue"),borderRadius:"4px",padding:"1px 6px",marginBottom:"2px",cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{e.title}</div>)}
            {ntt.map(t=><div key={t.id} style={{fontSize:"0.6rem",background:T.hover,borderRadius:"4px",padding:"1px 6px",marginBottom:"2px",color:T.muted,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",textDecoration:t.done?"line-through":"none"}}>✅ {t.title}</div>)}
          </div>;
        })}
      </div>
      <div ref={gridRef} style={{flex:1,overflowY:"auto",position:"relative"}}>
        <div style={{display:"flex",position:"relative",minHeight:1440}}>
          <div style={{width:56,flexShrink:0,borderRight:`1px solid ${T.border}`}}>
            {HOURS.map(h=><div key={h} style={{height:60,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:"0.42rem",paddingTop:"2px"}}>
              <span style={{fontSize:"0.56rem",color:T.faint,fontWeight:"600"}}>{h===0?"":String(h).padStart(2,"0")+":00"}</span>
            </div>)}
          </div>
          {days.map(ds=>{
            const te=visEvs(ds).filter(e=>!e.allDay&&e.startTime);
            const tt=dayTodos(ds).filter(t=>t.dueTime);
            const isToday=ds===todayStr();
            return<div key={ds} onClick={e=>{if(e.target===e.currentTarget){const h=Math.floor(e.nativeEvent.offsetY/60);openNewEvent(ds,String(h).padStart(2,"0")+":00");}}} style={{flex:1,borderRight:`1px solid ${T.border}`,position:"relative",cursor:"crosshair"}}>
              {HOURS.map(h=><div key={h} style={{position:"absolute",top:h*60,left:0,right:0,height:60,borderBottom:`1px solid ${T.border}`,pointerEvents:"none"}}/>)}
              {HOURS.map(h=><div key={"hh"+h} style={{position:"absolute",top:h*60+30,left:0,right:0,borderBottom:`1px dashed ${T.border}`,opacity:0.3,pointerEvents:"none"}}/>)}
              {isToday&&<div style={{position:"absolute",top:nowMinutes(),left:0,right:0,height:2,background:T.tl,zIndex:5,pointerEvents:"none",boxShadow:`0 0 8px ${T.tl}`}}><div style={{position:"absolute",left:-4,top:-3,width:8,height:8,borderRadius:"50%",background:T.tl,boxShadow:`0 0 8px ${T.tl}`}}/></div>}
              {te.map(e=>{const top=timeToY(e.startTime),height=Math.max(timeToY(e.endTime)-timeToY(e.startTime),22);const ec=evCol(e.colorId||"blue");return<div key={e.id} onClick={ev=>{ev.stopPropagation();!e._virtual&&setShowEDetail(e);}} style={{position:"absolute",top,left:2,right:2,height:height-2,background:ec+"22",border:`1px solid ${ec}55`,color:ec,borderRadius:"6px",padding:"2px 6px",fontSize:"0.62rem",fontWeight:"700",cursor:"pointer",zIndex:4,overflow:"hidden",boxShadow:`0 2px 8px ${ec}22`}}>
                <div style={{overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{e.title}{e.projectId?` 📁`:""}{e.recur!=="none"?" 🔁":""}</div>
                {height>30&&<div style={{opacity:0.75,fontSize:"0.56rem"}}>{e.startTime}–{e.endTime}</div>}
              </div>;})}
              {tt.map(t=><div key={t.id} style={{position:"absolute",top:timeToY(t.dueTime),left:2,right:2,height:24,background:T.hover,border:`1px solid ${T.border}`,borderRadius:"5px",padding:"2px 6px",fontSize:"0.6rem",fontWeight:"500",color:T.muted,zIndex:4,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",textDecoration:t.done?"line-through":"none"}}>✅ {t.title}</div>)}
            </div>;
          })}
        </div>
      </div>
    </div>
  );

  const shopItem=(item)=>{const canAfford=gold>=item.cost;return(
    <div key={item.id} className="cyber-card" style={{padding:"1.1rem",display:"flex",flexDirection:"column",gap:"0.5rem"}}>
      <div style={{fontSize:"2rem"}}>{item.name.split(" ")[0]}</div>
      <div style={{fontSize:"0.88rem",fontWeight:"700",color:T.text}}>{item.name.split(" ").slice(1).join(" ")}</div>
      <div style={{fontSize:"0.75rem",color:T.muted,flex:1}}>{item.desc}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.3rem"}}>
          <span style={{fontSize:"0.9rem"}}>🪙</span>
          <span style={{fontSize:"0.86rem",fontWeight:"800",color:"#FB923C"}}>{item.cost}</span>
        </div>
        <button className="glow-btn" onClick={()=>{
          if(gold<item.cost){setShopMsg("❌ Yeterli altın yok!");setTimeout(()=>setShopMsg(""),2000);return;}
          const ng=gold-item.cost;setGold(ng);setPurchasedItems(p=>[...p,{...item,boughtAt:Date.now()}]);
          saveAll({gold:ng,purchasedItems:[...purchasedItems,{...item,boughtAt:Date.now()}]});
          setShopMsg(`✅ ${item.name} satın alındı!`);setTimeout(()=>setShopMsg(""),2500);
        }} style={{...btn(canAfford?"pri":"sec",canAfford?"orange":"blue"),opacity:canAfford?1:0.4,cursor:canAfford?"pointer":"not-allowed"}}>
          {canAfford?"Satın Al":"Yetersiz"}
        </button>
      </div>
    </div>
  );};

  return(
    <div style={{height:"100vh",background:T.bg,color:T.text,fontFamily:FONT,display:"flex",flexDirection:"column",letterSpacing:"-0.01em",overflow:"hidden"}}>
      <Confetti active={confetti} onDone={()=>setConfetti(false)}/>

      {/* LEVEL UP */}
      {levelUpMsg&&<div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:9998,background:"linear-gradient(135deg,#A78BFA,#38BDF8)",borderRadius:"20px",padding:"2.5rem 3.5rem",textAlign:"center",boxShadow:"0 0 80px rgba(167,139,250,0.6), 0 0 160px rgba(56,189,248,0.3)"}}>
        <div style={{fontSize:"3rem",marginBottom:"0.3rem"}}>⬆️</div>
        <div style={{fontSize:"1.8rem",fontWeight:"800",color:"#fff",letterSpacing:"-0.04em"}}>LEVEL UP!</div>
        <div style={{fontSize:"1rem",color:"rgba(255,255,255,0.85)",marginTop:"0.3rem"}}>Seviye {level} oldun! 🎉</div>
      </div>}

      {/* HEADER */}
      <header style={{background:T.hdr,padding:"0 1.2rem",display:"flex",alignItems:"center",gap:"0.7rem",height:48,flexShrink:0,borderBottom:`1px solid ${dk?"rgba(56,189,248,0.12)":T.border}`}}>
        <span style={{color:"#38BDF8",fontWeight:"800",fontSize:"0.88rem",flexShrink:0,letterSpacing:"-0.04em",textShadow:"0 0 20px rgba(56,189,248,0.6)"}}>✦ Çalışma Alanım</span>
        <div style={{display:"flex",gap:"0.08rem",flexWrap:"nowrap",overflow:"hidden"}}>
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} className={tab===k?"tab-active glow-btn":""} style={{background:"transparent",color:tab===k?(dk?"#38BDF8":"#1A1917"):"rgba(255,255,255,0.35)",border:"none",borderRadius:"6px",padding:"0.25rem 0.6rem",cursor:"pointer",fontSize:"0.74rem",fontFamily:FONT,fontWeight:"700",whiteSpace:"nowrap",transition:"all 0.15s"}}>{l}</button>
          ))}
          <button onClick={()=>setShowCatMgr(true)} style={{background:"transparent",color:"rgba(255,255,255,0.3)",border:"none",borderRadius:"6px",padding:"0.25rem 0.6rem",cursor:"pointer",fontSize:"0.72rem",fontFamily:FONT,fontWeight:"600",whiteSpace:"nowrap"}}>⚙️</button>
        </div>
        {pom.active&&<div style={{marginLeft:"auto",background:"rgba(244,114,182,0.15)",border:"1px solid rgba(244,114,182,0.4)",borderRadius:"8px",padding:"0.2rem 0.7rem",color:"#F472B6",fontSize:"0.76rem",fontWeight:"700",cursor:"pointer",flexShrink:0,boxShadow:"0 0 12px rgba(244,114,182,0.3)"}} onClick={()=>setTab("pomodoro")}>🍅 {pomMins}:{pomSecs}</div>}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ara…" style={{marginLeft:pom.active?"0.3rem":"auto",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:"8px",padding:"0.24rem 0.7rem",color:"rgba(255,255,255,0.8)",fontFamily:FONT,fontSize:"0.75rem",width:140,outline:"none",flexShrink:0}} />
        <button onClick={()=>{const nd=!dk;setDk(nd);saveAll({dk:nd});}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"1rem",padding:0,opacity:0.6,flexShrink:0}}>{dk?"☀":"🌙"}</button>
      </header>

      {/* XP / STAT BAR */}
      <div style={{background:dk?"rgba(6,10,18,0.95)":"#F0EDE8",borderBottom:`1px solid ${T.border}`,padding:"0.45rem 1.2rem",display:"flex",alignItems:"center",gap:"1rem",flexShrink:0,backdropFilter:"blur(8px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.55rem"}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#A78BFA,#38BDF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0,boxShadow:"0 0 16px rgba(167,139,250,0.5)"}}>⚔️</div>
          <div>
            <div style={{fontSize:"0.68rem",fontWeight:"800",color:T.text,letterSpacing:"-0.02em"}}>Seviye {level}</div>
            <div style={{fontSize:"0.58rem",color:T.muted,fontFamily:FONT_MONO}}>{xp}/{xpNeeded} XP</div>
          </div>
        </div>
        <div style={{flex:1,height:5,background:dk?"rgba(56,189,248,0.1)":T.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${xpPct}%`,background:"linear-gradient(90deg,#A78BFA,#38BDF8)",borderRadius:3,transition:"width 0.6s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:dk?"0 0 8px rgba(56,189,248,0.5)":"none"}}/>
        </div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          {STAT_KEYS.map(k=>(
            <div key={k} title={STAT_LABELS[k]} style={{display:"flex",alignItems:"center",gap:"0.2rem",fontSize:"0.64rem",color:STAT_COLORS[k],fontWeight:"800",fontFamily:FONT_MONO}}>
              <span>{STAT_ICONS[k]}</span><span>{stats[k]||0}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.3rem",background:dk?"rgba(251,146,60,0.1)":"rgba(255,180,0,0.1)",border:"1px solid rgba(251,146,60,0.35)",borderRadius:"20px",padding:"0.22rem 0.65rem",cursor:"pointer",boxShadow:dk?"0 0 12px rgba(251,146,60,0.2)":"none"}} onClick={()=>setTab("ödüller")}>
          <span style={{fontSize:"0.95rem"}}>🪙</span>
          <span style={{fontSize:"0.76rem",fontWeight:"800",color:"#FB923C",fontFamily:FONT_MONO}}>{gold}</span>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* SIDEBAR */}
        <aside style={{width:178,background:T.sb,borderRight:`1px solid ${T.border}`,padding:"0.7rem 0.5rem",display:"flex",flexDirection:"column",gap:"0.08rem",flexShrink:0,overflowY:"auto"}}>
          {tab==="notlar"&&<>{lbl("Kategoriler")}
            {["Tümü",...nCats].map(c=><button key={c} onClick={()=>setACat(c)} style={sBtn(aCat===c)}><span style={{flex:1}}>{c}</span><span style={{opacity:0.4,fontSize:"0.65rem",fontFamily:FONT_MONO}}>{c==="Tümü"?notes.length:notes.filter(n=>n.category===c).length}</span></button>)}
            <div style={{marginTop:"0.3rem"}}>{showCI?<div style={{display:"flex",gap:"0.2rem"}}><input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNCat()} placeholder="Kategori" autoFocus style={{...inp,padding:"0.3rem 0.45rem",fontSize:"0.72rem"}}/><button onClick={addNCat} style={{...btn(),padding:"0.3rem 0.52rem"}}>+</button></div>:<button onClick={()=>setShowCI(true)} style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"6px",padding:"0.3rem 0.6rem",color:T.faint,cursor:"pointer",fontSize:"0.7rem",fontFamily:FONT,width:"100%",textAlign:"left"}}>+ Kategori</button>}</div>
          </>}

          {tab==="projeler"&&<>
            {lbl("Projeler")}
            <button onClick={()=>setActiveProject(null)} style={sBtn(!activeProject)}>
              <span style={{flex:1}}>Tüm Projeler</span>
              <span style={{opacity:0.4,fontSize:"0.65rem",fontFamily:FONT_MONO}}>{projects.length}</span>
            </button>
            {projects.map(p=>{const c=projCol(p.colorId);return(
              <button key={p.id} onClick={()=>setActiveProject(p.id)} style={{...sBtn(activeProject===p.id),position:"relative"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:c.l,flexShrink:0,display:"inline-block",boxShadow:`0 0 6px ${c.l}88`}}/>
                <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                <span style={{opacity:0.4,fontSize:"0.62rem",fontFamily:FONT_MONO}}>{projectProgress(p.id)}%</span>
              </button>
            );})}
            <button onClick={()=>{setEditPId(null);setPf(defPf());setShowPF(true);}} style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"6px",padding:"0.3rem 0.6rem",color:T.faint,cursor:"pointer",fontSize:"0.7rem",fontFamily:FONT,width:"100%",textAlign:"left",marginTop:"0.3rem"}}>+ Yeni Proje</button>
          </>}

          {tab==="todolar"&&<>
            {lbl("Kategoriler")}
            <button onClick={()=>setATodoCat("Tümü")} style={sBtn(aTodoCat==="Tümü")}><span style={{flex:1}}>Tümü</span><span style={{opacity:0.4,fontSize:"0.65rem",fontFamily:FONT_MONO}}>{todos.length}</span></button>
            {todoCats.map(cat=>(
              <button key={cat.id} onClick={()=>setATodoCat(cat.id)} style={sBtn(aTodoCat===cat.id)}>
                <span>{cat.emoji}</span><span style={{flex:1}}>{cat.name}</span>
                <span style={{opacity:0.6,fontSize:"0.6rem",color:STAT_COLORS[cat.stat],fontWeight:"800"}}>{cat.stat}</span>
                <span style={{opacity:0.4,fontSize:"0.62rem",fontFamily:FONT_MONO}}>{todos.filter(t=>t.todoCatId===cat.id).length}</span>
              </button>
            ))}
            <button onClick={()=>setShowCatMgr(true)} style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"6px",padding:"0.3rem 0.6rem",color:T.faint,cursor:"pointer",fontSize:"0.7rem",fontFamily:FONT,width:"100%",textAlign:"left",marginTop:"0.3rem"}}>⚙️ Kategoriler</button>
            <div style={{marginTop:"0.55rem",borderTop:`1px solid ${T.border}`,paddingTop:"0.5rem"}}>{lbl("Etiketler")}
              {["", ...allTags].map(tag=><button key={tag} onClick={()=>setATag(tag)} style={sBtn(aTag===tag)}>{tag?`#${tag}`:"Tümü"}</button>)}
            </div>
            <div style={{marginTop:"auto",paddingTop:"0.6rem",borderTop:`1px solid ${T.border}`,fontSize:"0.68rem",color:T.faint,lineHeight:2.2,paddingLeft:"0.5rem",fontFamily:FONT_MONO}}>
              <div>✅ {doneCount}</div><div>⏳ {pendingCount}</div><div>⚠️ {overdueCount}</div>
            </div>
          </>}

          {tab==="takvim"&&<>
            <button onClick={()=>openNewEvent()} className="glow-btn" style={{...btn(),width:"100%",marginBottom:"0.55rem",display:"flex",justifyContent:"center"}}>+ Etkinlik</button>
            {lbl("Takvimler")}
            {evCats.map(cat=>{const hidden=hiddenCats.includes(cat.id);return(
              <div key={cat.id} style={{display:"flex",alignItems:"center",gap:"0.35rem",padding:"0.3rem 0.55rem",borderRadius:"6px",cursor:"pointer"}} onClick={()=>toggleCatVis(cat.id)}>
                <div style={{width:10,height:10,borderRadius:"3px",background:hidden?"transparent":evCol(cat.colorId),border:`2px solid ${evCol(cat.colorId)}`,flexShrink:0,boxShadow:hidden?"none":`0 0 6px ${evCol(cat.colorId)}66`}}/>
                <span style={{fontSize:"0.76rem",fontWeight:"500",color:hidden?T.faint:T.text,flex:1,textDecoration:hidden?"line-through":"none"}}>{cat.name}</span>
                <button onClick={e=>{e.stopPropagation();delEvCat(cat.id);}} style={{background:"transparent",border:"none",cursor:"pointer",color:T.faint,fontSize:"0.62rem",padding:0,opacity:0,transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>✕</button>
              </div>
            );})}
            {showEvCatF?<div style={{marginTop:"0.25rem",display:"flex",flexDirection:"column",gap:"0.25rem"}}>
              <input value={newEvCatName} onChange={e=>setNewEvCatName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEvCat()} placeholder="Takvim adı" autoFocus style={{...inp,padding:"0.28rem 0.45rem",fontSize:"0.72rem"}}/>
              <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>{EV_COLORS.map(c=><button key={c.id} onClick={()=>setNewEvCatColor(c.id)} style={{width:16,height:16,borderRadius:"50%",background:c.l,border:newEvCatColor===c.id?`2.5px solid ${T.text}`:"2px solid transparent",cursor:"pointer",boxShadow:newEvCatColor===c.id?`0 0 8px ${c.l}88`:"none"}}/>)}</div>
              <div style={{display:"flex",gap:"0.25rem"}}><button onClick={addEvCat} style={{...btn(),flex:1,fontSize:"0.72rem",padding:"0.3rem"}}>Ekle</button><button onClick={()=>setShowEvCatF(false)} style={{...btn("sec"),fontSize:"0.72rem",padding:"0.3rem"}}>İptal</button></div>
            </div>:<button onClick={()=>setShowEvCatF(true)} style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"6px",padding:"0.3rem 0.6rem",color:T.faint,cursor:"pointer",fontSize:"0.7rem",fontFamily:FONT,width:"100%",textAlign:"left",marginTop:"0.2rem"}}>+ Takvim ekle</button>}
            <button onClick={goToday} style={{...sBtn(false),color:T.neon1,fontWeight:"700",marginTop:"0.4rem"}}>↩ Bugün</button>
            <div style={{marginTop:"0.7rem",borderTop:`1px solid ${T.border}`,paddingTop:"0.6rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.35rem"}}>
                <button onClick={()=>{if(calM===0){setCalY(y=>y-1);setCalM(11);}else setCalM(m=>m-1);}} style={{background:"transparent",border:"none",cursor:"pointer",color:T.muted,fontSize:"0.75rem",padding:0}}>‹</button>
                <span style={{fontSize:"0.66rem",fontWeight:"800",color:T.text}}>{MONTHS[calM].slice(0,3)} {calY}</span>
                <button onClick={()=>{if(calM===11){setCalY(y=>y+1);setCalM(0);}else setCalM(m=>m+1);}} style={{background:"transparent",border:"none",cursor:"pointer",color:T.muted,fontSize:"0.75rem",padding:0}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"1px"}}>
                {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.46rem",fontWeight:"700",color:T.faint,padding:"1px 0"}}>{d[0]}</div>)}
                {calCells().map((day,i)=>{if(!day)return<div key={`e${i}`}/>;const ds=`${calY}-${String(calM+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const isT=ds===todayStr();const has=(visEvs(ds).length+dayTodos(ds).length)>0;return<div key={day} onClick={()=>goDayView(ds)} style={{textAlign:"center",fontSize:"0.56rem",fontWeight:isT?"800":"400",color:isT?"#080C14":T.text,background:isT?"#38BDF8":"transparent",borderRadius:"50%",width:15,height:15,lineHeight:"15px",cursor:"pointer",margin:"auto",position:"relative",boxShadow:isT?"0 0 8px #38BDF888":"none"}}>{day}{has&&!isT&&<div style={{position:"absolute",bottom:-1,left:"50%",transform:"translateX(-50%)",width:3,height:3,borderRadius:"50%",background:T.neon1,boxShadow:`0 0 4px ${T.neon1}`}}/>}</div>;})}
              </div>
            </div>
          </>}

          {(tab==="dashboard"||tab==="arşiv"||tab==="pomodoro"||tab==="ödüller")&&<div style={{fontSize:"0.68rem",color:T.faint,padding:"0.5rem 0.55rem",lineHeight:2,fontFamily:FONT_MONO}}>
            <div style={{fontWeight:"800",color:T.text,marginBottom:"0.3rem",fontSize:"0.76rem",fontFamily:FONT}}>Özet</div>
            <div>⚔️ Lv.{level}</div><div>✨ {xp}/{xpNeeded}</div><div>🪙 {gold}</div>
            <div style={{marginTop:"0.3rem"}}>📄 {notes.length} not</div><div>✅ {doneCount}/{todos.length} done</div><div>⚠️ {overdueCount} geç</div>
          </div>}
        </aside>

        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* ═══ PROJELER ════════════════════════════════════════════════════ */}
          {tab==="projeler"&&<div style={{flex:1,overflowY:"auto",padding:"1.2rem"}}>
            {!activeProject?(
              // Project list view
              <div style={{maxWidth:900,margin:"0 auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
                  <h1 style={{fontSize:"1.2rem",fontWeight:"800",color:T.text,margin:0,letterSpacing:"-0.04em"}}>◈ Projeler <span style={{color:T.faint,fontSize:"0.88rem",fontWeight:"400"}}>({projects.length})</span></h1>
                  <button className="glow-btn" onClick={()=>{setEditPId(null);setPf(defPf());setShowPF(true);}} style={btn()}>+ Yeni Proje</button>
                </div>
                {projects.length===0&&<div style={{textAlign:"center",color:T.faint,padding:"4rem 0",fontSize:"0.86rem"}}>
                  <div style={{fontSize:"3rem",marginBottom:"0.6rem",opacity:0.4}}>◈</div>
                  Henüz proje yok. Yeni bir proje oluştur!
                </div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"0.85rem"}}>
                  {projects.map(p=>{
                    const c=projCol(p.colorId);
                    const prog=projectProgress(p.id);
                    const pTodos=projectTodos(p.id);
                    const pEvts=projectEvents(p.id);
                    return(
                      <div key={p.id} className="cyber-card project-card" style={{padding:"1.2rem",cursor:"pointer"}} onClick={()=>setActiveProject(p.id)}>
                        {/* Color bar top */}
                        <div style={{height:3,background:c.g,borderRadius:"2px 2px 0 0",margin:"-1.2rem -1.2rem 1rem",borderTopLeftRadius:"14px",borderTopRightRadius:"14px",boxShadow:`0 2px 12px ${c.l}55`}}/>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.7rem"}}>
                          <div>
                            <div style={{fontSize:"1rem",fontWeight:"800",color:T.text,letterSpacing:"-0.03em",marginBottom:"0.18rem"}}>{p.name}</div>
                            {p.desc&&<div style={{fontSize:"0.76rem",color:T.muted,lineHeight:1.5}}>{p.desc}</div>}
                          </div>
                          <div style={{display:"flex",gap:"0.3rem",flexShrink:0}}>
                            <button onClick={e=>{e.stopPropagation();setEditPId(p.id);setPf({name:p.name,desc:p.desc||"",colorId:p.colorId,deadline:p.deadline||"",status:p.status||"aktif"});setShowPF(true);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.76rem",opacity:0.4,padding:"2px",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.4}>✏️</button>
                            <button onClick={e=>{e.stopPropagation();if(confirm(`"${p.name}" silinsin?`))deleteProject(p.id);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.76rem",opacity:0.4,padding:"2px",color:"#F472B6",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.4}>🗑️</button>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{marginBottom:"0.7rem"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.3rem"}}>
                            <span style={{fontSize:"0.66rem",color:T.muted,fontWeight:"600"}}>İlerleme</span>
                            <span style={{fontSize:"0.68rem",fontWeight:"800",color:c.l,fontFamily:FONT_MONO}}>{prog}%</span>
                          </div>
                          <div style={{height:5,background:dk?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",borderRadius:3,overflow:"hidden"}}>
                            <div className="stat-bar" style={{height:"100%",width:`${prog}%`,background:c.g,borderRadius:3,boxShadow:prog>0?`0 0 8px ${c.l}88`:"none"}}/>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:"0.5rem",fontSize:"0.68rem",color:T.faint,fontFamily:FONT_MONO}}>
                          <span>📋 {pTodos.length} görev</span>
                          <span>✅ {pTodos.filter(t=>t.done).length} tamamlandı</span>
                          <span>📅 {pEvts.length} etkinlik</span>
                        </div>
                        {p.deadline&&<div style={{marginTop:"0.45rem",fontSize:"0.66rem",color:T.muted}}>📆 Bitiş: {fmtShort(p.deadline)}</div>}
                        <div style={{marginTop:"0.55rem"}}>
                          <span style={{fontSize:"0.62rem",fontWeight:"700",background:p.status==="tamamlandı"?"rgba(52,211,153,0.15)":p.status==="beklemede"?"rgba(251,146,60,0.15)":"rgba(56,189,248,0.12)",color:p.status==="tamamlandı"?"#34D399":p.status==="beklemede"?"#FB923C":"#38BDF8",border:`1px solid ${p.status==="tamamlandı"?"#34D39933":p.status==="beklemede"?"#FB923C33":"#38BDF822"}`,borderRadius:"20px",padding:"0.1rem 0.5rem"}}>
                            {p.status==="tamamlandı"?"✓ Tamamlandı":p.status==="beklemede"?"⏸ Beklemede":"● Aktif"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ):(()=>{
              // Project detail view
              const p=getProject(activeProject);
              if(!p)return null;
              const c=projCol(p.colorId);
              const prog=projectProgress(p.id);
              const pTodos=projectTodos(p.id);
              const pEvts=projectEvents(p.id);
              return(
                <div style={{maxWidth:860,margin:"0 auto"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.8rem",marginBottom:"1.2rem"}}>
                    <button onClick={()=>setActiveProject(null)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:"8px",padding:"0.35rem 0.7rem",cursor:"pointer",color:T.muted,fontSize:"0.78rem",fontFamily:FONT,fontWeight:"600"}}>← Geri</button>
                    <h1 style={{fontSize:"1.15rem",fontWeight:"800",color:T.text,margin:0,flex:1}}>{p.name}</h1>
                    <button className="glow-btn glow-btn-green" onClick={()=>{setTf({...defTf(),projectId:activeProject});setEditTId(null);setShowTF(true);}} style={{...btn("pri","green"),fontSize:"0.78rem"}}>+ Todo Ekle</button>
                    <button className="glow-btn" onClick={()=>{setPEf({...defEf(),date:todayStr()});setShowPEF(true);}} style={{...btn("sec"),fontSize:"0.78rem"}}>+ Etkinlik</button>
                  </div>

                  {/* Progress bar hero */}
                  <div className="cyber-card" style={{padding:"1.3rem",marginBottom:"0.85rem",background:dk?`rgba(12,18,32,0.9)`:undefined}}>
                    <div style={{height:4,background:c.g,borderRadius:"2px 2px 0 0",margin:"-1.3rem -1.3rem 1.1rem",borderTopLeftRadius:"14px",borderTopRightRadius:"14px",boxShadow:`0 0 20px ${c.l}66`}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.8rem"}}>
                      <div>
                        <div style={{fontSize:"2.2rem",fontWeight:"800",color:c.l,letterSpacing:"-0.06em",fontFamily:FONT_MONO,lineHeight:1,textShadow:`0 0 20px ${c.l}66`}}>{prog}%</div>
                        <div style={{fontSize:"0.76rem",color:T.muted,marginTop:"0.15rem"}}>tamamlandı · {pTodos.filter(t=>t.done).length}/{pTodos.length} görev</div>
                      </div>
                      <div style={{display:"flex",gap:"0.8rem",fontSize:"0.76rem",color:T.muted}}>
                        {p.deadline&&<div>📆 {fmtShort(p.deadline)}</div>}
                        <span style={{fontSize:"0.65rem",fontWeight:"700",background:p.status==="tamamlandı"?"rgba(52,211,153,0.15)":"rgba(56,189,248,0.12)",color:p.status==="tamamlandı"?"#34D399":"#38BDF8",border:`1px solid ${p.status==="tamamlandı"?"#34D39944":"#38BDF822"}`,borderRadius:"20px",padding:"0.12rem 0.55rem"}}>{p.status||"aktif"}</span>
                      </div>
                    </div>
                    <div style={{height:8,background:dk?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.06)",borderRadius:4,overflow:"hidden"}}>
                      <div className="stat-bar" style={{height:"100%",width:`${prog}%`,background:c.g,borderRadius:4,boxShadow:`0 0 12px ${c.l}88`}}/>
                    </div>
                  </div>

                  {/* Todos */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.85rem",alignItems:"start"}}>
                    <div>
                      <div style={{fontWeight:"700",fontSize:"0.88rem",color:T.text,marginBottom:"0.6rem",letterSpacing:"-0.02em"}}>📋 Görevler</div>
                      {pTodos.length===0&&<div style={{fontSize:"0.78rem",color:T.faint,padding:"1rem 0"}}>Henüz görev yok.</div>}
                      <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
                        {pTodos.map(todo=>{
                          const cat=getTodoCat(todo.todoCatId);
                          return(
                            <div key={todo.id} className="todo-row cyber-card" style={{padding:"0.65rem 0.85rem",opacity:todo.done?0.5:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                                <button onClick={()=>toggleTodo(todo.id)} style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${todo.done?"#38BDF8":T.border}`,background:todo.done?"#38BDF8":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:todo.done?"0 0 8px #38BDF888":"none",transition:"all 0.2s"}}>{todo.done&&<span style={{color:"#080C14",fontSize:"0.5rem"}}>✓</span>}</button>
                                {cat&&<span title={cat.name}>{cat.emoji}</span>}
                                <span style={{fontSize:"0.8rem",fontWeight:"500",color:T.text,textDecoration:todo.done?"line-through":"none",flex:1}}>{todo.title}</span>
                                <div style={{display:"flex",gap:"0.2rem"}}>
                                  <button onClick={()=>openET(todo)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.72rem",opacity:0.3,padding:"1px",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>✏️</button>
                                  <button onClick={()=>delTodo(todo.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.72rem",opacity:0.3,padding:"1px",color:"#F472B6",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>✕</button>
                                </div>
                              </div>
                              {todo.dueDate&&<div style={{fontSize:"0.64rem",color:T.faint,marginTop:"0.18rem",paddingLeft:"1.6rem"}}>📅 {fmtShort(todo.dueDate)}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Events */}
                    <div>
                      <div style={{fontWeight:"700",fontSize:"0.88rem",color:T.text,marginBottom:"0.6rem",letterSpacing:"-0.02em"}}>📅 Etkinlikler</div>
                      {pEvts.length===0&&<div style={{fontSize:"0.78rem",color:T.faint,padding:"1rem 0"}}>Henüz etkinlik yok.</div>}
                      <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
                        {pEvts.map(e=>{const ec=evCol(e.colorId||"blue");return(
                          <div key={e.id} className="cyber-card" style={{padding:"0.65rem 0.85rem"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:ec,flexShrink:0,boxShadow:`0 0 6px ${ec}88`}}/>
                              <span style={{fontSize:"0.8rem",fontWeight:"600",color:T.text,flex:1}}>{e.title}</span>
                              <button onClick={()=>delEvent(e.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.7rem",opacity:0.3,color:"#F472B6",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>✕</button>
                            </div>
                            <div style={{fontSize:"0.64rem",color:T.muted,marginTop:"0.2rem",paddingLeft:"1.2rem"}}>
                              {fmtShort(e.date)}{!e.allDay&&e.startTime?` · ${e.startTime}–${e.endTime}`:" · Tüm gün"}
                            </div>
                          </div>
                        );})}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>}

          {/* ═══ NOTLAR ══════════════════════════════════════════════════════ */}
          {tab==="notlar"&&<div style={{flex:1,overflowY:"auto",padding:"1.2rem"}}>
            <div style={{maxWidth:860,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
                <h1 style={{fontSize:"1.1rem",fontWeight:"800",color:T.text,margin:0,letterSpacing:"-0.04em"}}>{aCat} <span style={{color:T.faint,fontSize:"0.84rem",fontWeight:"400"}}>({fNotes.length})</span></h1>
                <button className="glow-btn" onClick={()=>{setEditNId(null);setNf({title:"",content:"",category:aCat==="Tümü"?"Genel":aCat,image:null});setShowNF(true);setTimeout(()=>nTRef.current?.focus(),50);}} style={btn()}>+ Yeni Not</button>
              </div>
              {fNotes.length===0&&<div style={{textAlign:"center",color:T.faint,padding:"3rem 0",fontSize:"0.84rem"}}><div style={{fontSize:"2rem",marginBottom:"0.5rem",opacity:0.4}}>📄</div>{search?`"${search}" bulunamadı`:"Henüz not yok."}</div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:"0.75rem"}}>
                {fNotes.map(note=>{
                  const linkedTodos=todos.filter(t=>t.linkedNoteId===note.id);
                  return(
                    <div key={note.id} className="cyber-card" style={{padding:"0.9rem",background:dk?T.nc[note.ci??0]:LT.nc[note.ci??0]}}>
                      {note.image&&<img src={note.image} alt="" style={{width:"100%",height:82,objectFit:"cover",borderRadius:"8px",marginBottom:"0.55rem"}}/>}
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.3rem"}}>
                        <h3 style={{margin:0,fontSize:"0.84rem",fontWeight:"700",color:T.text,flex:1,letterSpacing:"-0.025em"}}>{note.title||"Başlıksız"}</h3>
                        <div style={{display:"flex",gap:"0.08rem",marginLeft:"0.2rem"}}>
                          <button onClick={()=>{setEditNId(note.id);setNf({title:note.title,content:note.content,category:note.category,image:note.image||null});setShowNF(true);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.72rem",opacity:0.35,padding:"1px",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.35}>✏️</button>
                          <button onClick={()=>delNote(note.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.72rem",opacity:0.35,padding:"1px",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.35}>🗑️</button>
                        </div>
                      </div>
                      <p style={{margin:"0 0 0.55rem",fontSize:"0.74rem",color:T.muted,lineHeight:1.65,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{note.content}</p>
                      {linkedTodos.length>0&&<div style={{marginBottom:"0.4rem"}}>{linkedTodos.map(t=><div key={t.id} style={{fontSize:"0.62rem",color:T.muted,display:"flex",alignItems:"center",gap:"0.28rem"}}><span style={{opacity:0.6}}>✅</span>{t.title}</div>)}</div>}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:"0.6rem",background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:"20px",padding:"0.09rem 0.42rem",color:T.muted,fontWeight:"600"}}>{note.category}</span>
                        <span style={{fontSize:"0.6rem",color:T.faint,fontFamily:FONT_MONO}}>{new Date(note.upd).toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>}

          {/* ═══ TODOLAR ═════════════════════════════════════════════════════ */}
          {tab==="todolar"&&<div style={{flex:1,overflowY:"auto",padding:"1.2rem"}}>
            <div style={{maxWidth:700,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem",gap:"0.5rem"}}>
                <h1 style={{fontSize:"1.1rem",fontWeight:"800",color:T.text,margin:0,letterSpacing:"-0.04em"}}>
                  {aTodoCat==="Tümü"?"Tüm Todolar":(()=>{const c=getTodoCat(aTodoCat);return c?`${c.emoji} ${c.name}`:"Todolar";})()}
                  <span style={{color:T.faint,fontSize:"0.84rem",fontWeight:"400"}}> ({fTodos.length})</span>
                </h1>
                <div style={{display:"flex",gap:"0.4rem"}}>
                  {todos.some(t=>t.done)&&<button className="glow-btn" onClick={archiveDone} style={{...btn("sec"),fontSize:"0.76rem"}}>📦 Arşivle</button>}
                  <button className="glow-btn" onClick={()=>{setEditTId(null);setTf(defTf());setShowTF(true);}} style={btn()}>+ Yeni Todo</button>
                </div>
              </div>
              {fTodos.length===0&&<div style={{textAlign:"center",color:T.faint,padding:"3rem 0",fontSize:"0.84rem"}}><div style={{fontSize:"2rem",marginBottom:"0.5rem",opacity:0.4}}>✅</div>Henüz todo yok.</div>}
              <div style={{display:"flex",flexDirection:"column",gap:"0.42rem"}}>
                {fTodos.map(todo=>{
                  const cat=getTodoCat(todo.todoCatId);
                  const proj=todo.projectId?getProject(todo.projectId):null;
                  const ov=todo.dueDate&&todo.dueDate<todayStr()&&!todo.done;
                  const prog=todo.subtasks?.length?Math.round(todo.subtasks.filter(s=>s.done).length/todo.subtasks.length*100):null;
                  const linkedNote=todo.linkedNoteId?notes.find(n=>n.id===todo.linkedNoteId):null;
                  return(
                    <div key={todo.id} className="todo-row cyber-card" style={{padding:"0.75rem 0.9rem",opacity:todo.done?0.5:1}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:"0.55rem"}}>
                        <button onClick={()=>toggleTodo(todo.id)} style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${todo.done?"#38BDF8":T.border}`,background:todo.done?"#38BDF8":"transparent",cursor:"pointer",flexShrink:0,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:todo.done?"0 0 10px #38BDF888":"none",transition:"all 0.2s"}}>{todo.done&&<span style={{color:"#080C14",fontSize:"0.48rem",lineHeight:1}}>✓</span>}</button>
                        <div style={{flex:1}}>
                          <div style={{fontSize:"0.84rem",fontWeight:"600",color:T.text,textDecoration:todo.done?"line-through":"none",marginBottom:"0.14rem"}}>{todo.title}</div>
                          {todo.notes&&<div style={{fontSize:"0.7rem",color:T.muted,marginBottom:"0.24rem"}}>{todo.notes}</div>}
                          {linkedNote&&<div style={{fontSize:"0.64rem",color:T.muted,marginBottom:"0.2rem"}}>📄 {linkedNote.title||"Not bağlı"}</div>}
                          <div style={{display:"flex",gap:"0.28rem",flexWrap:"wrap",alignItems:"center",marginBottom:"0.2rem"}}>
                            {cat&&<span style={{fontSize:"0.6rem",fontWeight:"700",background:dk?`${STAT_COLORS[cat.stat]}18`:`${STAT_COLORS[cat.stat]}22`,border:`1px solid ${STAT_COLORS[cat.stat]}44`,borderRadius:"20px",padding:"0.08rem 0.42rem",color:STAT_COLORS[cat.stat]}}>{cat.emoji} {cat.name}</span>}
                            {proj&&<span style={{fontSize:"0.6rem",fontWeight:"700",background:dk?`${projCol(proj.colorId).l}18`:`${projCol(proj.colorId).l}22`,border:`1px solid ${projCol(proj.colorId).l}44`,borderRadius:"20px",padding:"0.08rem 0.42rem",color:projCol(proj.colorId).l}}>◈ {proj.name}</span>}
                            <span style={{fontSize:"0.6rem",fontWeight:"700",background:todo.priority==="yüksek"?"rgba(244,114,182,0.12)":todo.priority==="orta"?"rgba(251,146,60,0.12)":"rgba(52,211,153,0.12)",border:`1px solid ${todo.priority==="yüksek"?"#F472B644":todo.priority==="orta"?"#FB923C44":"#34D39944"}`,borderRadius:"20px",padding:"0.08rem 0.42rem",color:todo.priority==="yüksek"?"#F472B6":todo.priority==="orta"?"#FB923C":"#34D399"}}>{todo.priority==="yüksek"?"🔴":todo.priority==="orta"?"🟡":"🟢"} {todo.priority}</span>
                            {todo.dueDate&&<span style={{fontSize:"0.6rem",color:ov?"#F472B6":T.muted,fontFamily:FONT_MONO}}>📅 {fmtShort(todo.dueDate)}{ov?" ⚠️":""}</span>}
                            {(todo.tags||[]).map(tag=><span key={tag} style={{fontSize:"0.58rem",background:T.hover,borderRadius:"20px",padding:"0.06rem 0.36rem",color:T.muted,fontWeight:"500"}}>#{tag}</span>)}
                          </div>
                          {prog!==null&&<>
                            <div style={{height:2,background:T.border,borderRadius:2,marginBottom:"0.3rem",overflow:"hidden"}}><div className="stat-bar" style={{height:"100%",width:`${prog}%`,background:"#38BDF8",borderRadius:2,boxShadow:"0 0 6px #38BDF888"}}/></div>
                            {todo.subtasks.map(s=>(
                              <div key={s.id} style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.14rem 0"}}>
                                <button onClick={()=>toggleSub(todo.id,s.id)} style={{width:12,height:12,borderRadius:"3px",border:`1.5px solid ${s.done?"#38BDF8":T.border}`,background:s.done?"#38BDF8":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>{s.done&&<span style={{color:"#080C14",fontSize:"0.42rem",lineHeight:1}}>✓</span>}</button>
                                <span style={{fontSize:"0.7rem",color:s.done?T.faint:T.muted,textDecoration:s.done?"line-through":"none"}}>{s.title}</span>
                              </div>
                            ))}
                            <div style={{fontSize:"0.62rem",color:T.faint,marginTop:"0.15rem",fontFamily:FONT_MONO}}>{todo.subtasks.filter(s=>s.done).length}/{todo.subtasks.length} · %{prog}</div>
                          </>}
                        </div>
                        <div style={{display:"flex",gap:"0.08rem",flexShrink:0}}>
                          <button onClick={()=>startPom(todo.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.72rem",opacity:0.3,padding:"2px",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>🍅</button>
                          <button onClick={()=>openET(todo)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.72rem",opacity:0.3,padding:"2px",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>✏️</button>
                          <button onClick={()=>delTodo(todo.id)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.72rem",opacity:0.3,padding:"2px",color:"#F472B6",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.3}>✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>}

          {/* ═══ TAKVİM ══════════════════════════════════════════════════════ */}
          {tab==="takvim"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.6rem 1rem",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <button className="glow-btn" onClick={navPrev} style={btn("sec")}>‹</button>
              <button className="glow-btn" onClick={navNext} style={btn("sec")}>›</button>
              <h2 style={{margin:0,fontSize:"0.92rem",fontWeight:"800",color:T.text,letterSpacing:"-0.03em"}}>{calView==="ay"?`${MONTHS[calM]} ${calY}`:calView==="hafta"?weekLabel():dayLabel()}</h2>
              <div style={{marginLeft:"auto",display:"flex",gap:"0.15rem",background:T.hover,borderRadius:"8px",padding:"0.15rem"}}>
                {[["gün","Gün"],["hafta","Hafta"],["ay","Ay"]].map(([v,l])=><button key={v} onClick={()=>setCalView(v)} style={{background:calView===v?(dk?"rgba(56,189,248,0.15)":"#FFF"):"transparent",color:calView===v?(dk?"#38BDF8":T.text):T.muted,border:"none",borderRadius:"6px",padding:"0.28rem 0.65rem",cursor:"pointer",fontSize:"0.76rem",fontFamily:FONT,fontWeight:"700",boxShadow:calView===v&&dk?"0 0 12px rgba(56,189,248,0.2)":"none",transition:"all 0.15s"}}>{l}</button>)}
              </div>
            </div>
            {calView==="ay"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"0.6rem 0.8rem"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"0.18rem",marginBottom:"0.18rem"}}>
                {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.6rem",fontWeight:"800",color:T.faint,padding:"0.2rem 0",letterSpacing:"0.08em",textTransform:"uppercase"}}>{d}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gridAutoRows:"1fr",gap:"0.18rem",flex:1}}>
                {calCells().map((day,i)=>{if(!day)return<div key={`e${i}`}/>;const ds=`${calY}-${String(calM+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const de=visEvs(ds);const dt=dayTodos(ds);const isT=ds===todayStr();return(
                  <div key={day} onClick={()=>goDayView(ds)} className={isT?"":"cyber-card"} style={{borderRadius:"8px",padding:"0.28rem 0.22rem",border:isT?`1.5px solid #38BDF8`:`1px solid ${T.border}`,background:isT?dk?"rgba(56,189,248,0.08)":"rgba(56,189,248,0.04)":T.card,cursor:"pointer",overflow:"hidden",minHeight:64,boxShadow:isT?dk?"0 0 16px rgba(56,189,248,0.2)":"none":"none"}}>
                    <div style={{fontSize:"0.68rem",fontWeight:isT?"800":"500",color:isT?"#38BDF8":T.text,background:isT?"rgba(56,189,248,0.15)":"transparent",width:isT?18:undefined,height:isT?18:undefined,borderRadius:isT?"50%":"",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:"0.18rem",boxShadow:isT?"0 0 8px rgba(56,189,248,0.4)":"none"}}>{day}</div>
                    {de.slice(0,2).map(e=>{const ec=evCol(e.colorId||"blue");return<div key={e.id} onClick={ev=>{ev.stopPropagation();!e._virtual&&setShowEDetail(e);}} style={{fontSize:"0.55rem",fontWeight:"700",background:ec+"22",border:`1px solid ${ec}55`,color:ec,borderRadius:"3px",padding:"1px 4px",marginBottom:"2px",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{e.title}{e.projectId?" 📁":""}</div>;})}
                    {dt.slice(0,1).map(t=><div key={t.id} style={{fontSize:"0.52rem",background:T.hover,borderRadius:"3px",padding:"1px 4px",marginBottom:"2px",color:T.muted,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",textDecoration:t.done?"line-through":"none"}}>✅ {t.title}</div>)}
                    {(de.length+dt.length)>3&&<div style={{fontSize:"0.5rem",color:T.faint,fontWeight:"700",fontFamily:FONT_MONO}}>+{de.length+dt.length-3}</div>}
                  </div>
                );})}
              </div>
            </div>}
            {calView==="hafta"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                <div style={{width:56,flexShrink:0,borderRight:`1px solid ${T.border}`}}/>
                {weekDays.map((date,i)=>{const ds=isoDate(date);const isT=ds===todayStr();return<div key={ds} onClick={()=>goDayView(ds)} style={{flex:1,textAlign:"center",padding:"0.42rem 0.2rem",borderRight:`1px solid ${T.border}`,cursor:"pointer"}}>
                  <div style={{fontSize:"0.58rem",fontWeight:"800",color:isT?"#38BDF8":T.faint,letterSpacing:"0.06em",textTransform:"uppercase"}}>{DAYS[i]}</div>
                  <div style={{fontSize:"1.1rem",fontWeight:"800",color:isT?"#38BDF8":T.text,letterSpacing:"-0.04em",lineHeight:1.1,textShadow:isT?"0 0 12px rgba(56,189,248,0.6)":"none"}}>{date.getDate()}</div>
                </div>;})}
              </div>
              <TimeGrid days={weekDays.map(d=>isoDate(d))}/>
            </div>}
            {calView==="gün"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                <div style={{width:56,flexShrink:0,borderRight:`1px solid ${T.border}`}}/>
                <div style={{flex:1,textAlign:"center",padding:"0.42rem 0.2rem"}}>
                  <div style={{fontSize:"0.58rem",fontWeight:"800",color:T.faint,letterSpacing:"0.06em",textTransform:"uppercase"}}>{DAYS_LONG[getDayIndex(new Date(calY,calM,calD))]}</div>
                  <div style={{fontSize:"1.6rem",fontWeight:"800",color:isoDate(new Date(calY,calM,calD))===todayStr()?"#38BDF8":T.text,letterSpacing:"-0.04em",lineHeight:1.1,textShadow:isoDate(new Date(calY,calM,calD))===todayStr()?"0 0 16px rgba(56,189,248,0.6)":"none"}}>{calD}</div>
                </div>
              </div>
              <TimeGrid days={[`${calY}-${String(calM+1).padStart(2,"0")}-${String(calD).padStart(2,"0")}`]}/>
            </div>}
          </div>}

          {/* ═══ ARŞİV ═══════════════════════════════════════════════════════ */}
          {tab==="arşiv"&&<div style={{flex:1,overflowY:"auto",padding:"1.2rem"}}>
            <div style={{maxWidth:700,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
                <h1 style={{fontSize:"1.1rem",fontWeight:"800",color:T.text,margin:0}}>Arşiv <span style={{color:T.faint,fontSize:"0.84rem",fontWeight:"400"}}>({archived.length})</span></h1>
                {archived.length>0&&<button className="glow-btn" onClick={()=>{setArchived([]);saveAll({archived:[]});}} style={{...btn("sec"),color:"#F472B6",fontSize:"0.76rem"}}>🗑️ Temizle</button>}
              </div>
              {archived.length===0&&<div style={{textAlign:"center",color:T.faint,padding:"3rem 0",fontSize:"0.84rem"}}><div style={{fontSize:"2rem",marginBottom:"0.5rem",opacity:0.4}}>📦</div>Arşiv boş.</div>}
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                {archived.map(t=>(
                  <div key={t.id} className="cyber-card" style={{padding:"0.7rem 0.9rem",opacity:0.6}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                      <div style={{width:15,height:15,borderRadius:"50%",background:"#38BDF8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 8px #38BDF888"}}><span style={{color:"#080C14",fontSize:"0.46rem"}}>✓</span></div>
                      <div style={{flex:1}}><div style={{fontSize:"0.8rem",fontWeight:"500",color:T.muted,textDecoration:"line-through"}}>{t.title}</div><div style={{fontSize:"0.62rem",color:T.faint,fontFamily:FONT_MONO}}>{t.archivedAt?new Date(t.archivedAt).toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"}):""}</div></div>
                      <button onClick={()=>{const u=archived.filter(a=>a.id!==t.id);setArchived(u);saveAll({archived:u});}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.68rem",color:T.faint,padding:"2px",opacity:0.5}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>}

          {/* ═══ POMODORO ════════════════════════════════════════════════════ */}
          {tab==="pomodoro"&&<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",gap:"1.6rem"}}>
            <div style={{fontSize:"0.76rem",fontWeight:"800",color:T.muted,letterSpacing:"0.15em",textTransform:"uppercase"}}>{pom.mode==="work"?"🍅 Odak Zamanı":"☕ Mola"}</div>
            <div style={{position:"relative",width:220,height:220}}>
              <svg width="220" height="220" style={{transform:"rotate(-90deg)"}}>
                <defs>
                  <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <circle cx="110" cy="110" r="96" fill="none" stroke={dk?"rgba(56,189,248,0.1)":"#E2DDD6"} strokeWidth="8"/>
                <circle cx="110" cy="110" r="96" fill="none" stroke={pom.mode==="work"?"#F472B6":"#34D399"} strokeWidth="8" strokeDasharray={`${2*Math.PI*96}`} strokeDashoffset={`${2*Math.PI*96*(1-pomProgress/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.6s",filter:"url(#glow)"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:"3.2rem",fontWeight:"800",color:T.text,letterSpacing:"-0.06em",lineHeight:1,fontFamily:FONT_MONO,textShadow:dk?`0 0 30px ${pom.mode==="work"?"rgba(244,114,182,0.5)":"rgba(52,211,153,0.5)"}`:""}}>{pomMins}:{pomSecs}</div>
                <div style={{fontSize:"0.68rem",color:T.faint,marginTop:"0.3rem",fontWeight:"600"}}>{pom.active?pom.mode==="work"?"odak":"mola":"hazır"}</div>
              </div>
            </div>
            {pomTodo&&<div style={{fontSize:"0.86rem",fontWeight:"600",color:T.text,textAlign:"center",maxWidth:280}}>📋 {pomTodo.title}</div>}
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button className="glow-btn" onClick={togglePomRun} style={{...btn(),padding:"0.72rem 1.6rem",fontSize:"0.9rem"}}>{pom.running?"⏸ Duraklat":"▶ Başlat"}</button>
              <button className="glow-btn" onClick={resetPom} style={{...btn("sec"),padding:"0.72rem 1.2rem",fontSize:"0.9rem"}}>↺ Sıfırla</button>
            </div>
            <div style={{width:"100%",maxWidth:400}}>
              <div style={{fontSize:"0.68rem",fontWeight:"800",color:T.faint,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.5rem"}}>Görev Seç</div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.32rem",maxHeight:190,overflowY:"auto"}}>
                {todos.filter(t=>!t.done).slice(0,8).map(t=>(
                  <div key={t.id} onClick={()=>startPom(t.id)} className="cyber-card" style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.45rem 0.7rem",border:pom.todoId===t.id?`1px solid rgba(56,189,248,0.5)`:undefined,cursor:"pointer",boxShadow:pom.todoId===t.id?"0 0 12px rgba(56,189,248,0.2)":"none"}}>
                    <span style={{fontSize:"0.82rem",flex:1,color:T.text,fontWeight:"500"}}>{t.title}</span>
                    {pom.todoId===t.id&&<span style={{fontSize:"0.64rem",color:"#38BDF8",fontWeight:"800"}}>● Seçili</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>}

          {/* ═══ ÖDÜLLER ═════════════════════════════════════════════════════ */}
          {tab==="ödüller"&&<div style={{flex:1,overflowY:"auto",padding:"1.2rem"}}>
            <div style={{maxWidth:760,margin:"0 auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.2rem"}}>
                <h1 style={{fontSize:"1.1rem",fontWeight:"800",color:T.text,margin:0}}>🏆 Ödül Marketi</h1>
                <div style={{display:"flex",alignItems:"center",gap:"0.4rem",background:dk?"rgba(251,146,60,0.1)":"rgba(255,180,0,0.1)",border:"1px solid rgba(251,146,60,0.35)",borderRadius:"20px",padding:"0.32rem 0.85rem",boxShadow:dk?"0 0 16px rgba(251,146,60,0.2)":"none"}}>
                  <span style={{fontSize:"1.1rem"}}>🪙</span>
                  <span style={{fontSize:"0.92rem",fontWeight:"800",color:"#FB923C",fontFamily:FONT_MONO}}>{gold}</span>
                </div>
              </div>
              {/* Radar + Stats */}
              <div className="cyber-card" style={{padding:"1.2rem",marginBottom:"1rem",display:"grid",gridTemplateColumns:"auto 1fr",gap:"1rem",alignItems:"center"}}>
                <RadarChart stats={stats} dk={dk}/>
                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                  <div style={{fontSize:"0.82rem",fontWeight:"800",color:T.text,marginBottom:"0.2rem"}}>⚔️ Nitelikler</div>
                  {STAT_KEYS.map(k=>(
                    <div key={k}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.16rem"}}>
                        <span style={{fontSize:"0.7rem",fontWeight:"700",color:STAT_COLORS[k]}}>{STAT_ICONS[k]} {STAT_LABELS[k]}</span>
                        <span style={{fontSize:"0.66rem",color:T.muted,fontFamily:FONT_MONO,fontWeight:"700"}}>{stats[k]||0}</span>
                      </div>
                      <div style={{height:5,background:dk?"rgba(255,255,255,0.05)":T.border,borderRadius:3,overflow:"hidden"}}>
                        <div className="stat-bar" style={{height:"100%",width:`${Math.min(((stats[k]||0)/200)*100,100)}%`,background:STAT_COLORS[k],borderRadius:3,boxShadow:dk?`0 0 8px ${STAT_COLORS[k]}88`:"none"}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {shopMsg&&<div style={{background:shopMsg.startsWith("✅")?"rgba(52,211,153,0.12)":"rgba(244,114,182,0.12)",border:`1px solid ${shopMsg.startsWith("✅")?"#34D39944":"#F472B644"}`,borderRadius:"10px",padding:"0.65rem 1rem",marginBottom:"0.9rem",fontSize:"0.82rem",color:shopMsg.startsWith("✅")?"#34D399":"#F472B6",fontWeight:"700"}}>{shopMsg}</div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:"0.8rem",marginBottom:"1.5rem"}}>
                {SHOP_ITEMS.map(shopItem)}
              </div>
              {purchasedItems.length>0&&<>
                <h2 style={{fontSize:"0.92rem",fontWeight:"800",color:T.text,marginBottom:"0.7rem"}}>📦 Satın Alınanlar</h2>
                <div style={{display:"flex",flexDirection:"column",gap:"0.38rem"}}>
                  {purchasedItems.slice().reverse().map((item,i)=>(
                    <div key={i} className="cyber-card" style={{padding:"0.65rem 0.95rem",display:"flex",alignItems:"center",gap:"0.65rem"}}>
                      <span style={{fontSize:"1.15rem"}}>{item.name.split(" ")[0]}</span>
                      <span style={{fontSize:"0.8rem",fontWeight:"600",color:T.text,flex:1}}>{item.name.split(" ").slice(1).join(" ")}</span>
                      <span style={{fontSize:"0.64rem",color:T.faint,fontFamily:FONT_MONO}}>{new Date(item.boughtAt).toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}</span>
                      <span style={{fontSize:"0.66rem",color:"#FB923C",fontWeight:"800",fontFamily:FONT_MONO}}>-{item.cost}🪙</span>
                    </div>
                  ))}
                </div>
              </>}
            </div>
          </div>}
        </main>
      </div>

      {/* ════════════════════ MODALLER ════════════════════════════════════════ */}

      {/* Project Form */}
      {showPF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowPF(false)}>
        <div style={mBox} className="modal-enter">
          <h2 style={{margin:"0 0 1.1rem",fontSize:"0.96rem",fontWeight:"800",color:T.text,letterSpacing:"-0.035em"}}>{editPId?"Projeyi Düzenle":"Yeni Proje"}</h2>
          <input value={pf.name} onChange={e=>setPf(f=>({...f,name:e.target.value}))} placeholder="Proje adı" autoFocus style={{...inp,marginBottom:"0.7rem"}}/>
          <textarea value={pf.desc} onChange={e=>setPf(f=>({...f,desc:e.target.value}))} placeholder="Açıklama (isteğe bağlı)" rows={2} style={{...inp,resize:"vertical",lineHeight:1.6,marginBottom:"0.7rem"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem",marginBottom:"0.7rem"}}>
            <div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Durum</label>
              <select value={pf.status} onChange={e=>setPf(f=>({...f,status:e.target.value}))} style={inp}>
                <option value="aktif">● Aktif</option><option value="beklemede">⏸ Beklemede</option><option value="tamamlandı">✓ Tamamlandı</option>
              </select>
            </div>
            <div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Bitiş Tarihi</label>
              <input type="date" value={pf.deadline} onChange={e=>setPf(f=>({...f,deadline:e.target.value}))} style={inp}/>
            </div>
          </div>
          <div style={{marginBottom:"0.9rem"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.3rem",fontWeight:"700"}}>Renk</label>
            <div style={{display:"flex",gap:"0.4rem"}}>{PROJECT_COLORS.map(c=><button key={c.id} onClick={()=>setPf(f=>({...f,colorId:c.id}))} style={{width:24,height:24,borderRadius:"50%",background:c.l,border:pf.colorId===c.id?`3px solid ${T.text}`:"3px solid transparent",cursor:"pointer",boxShadow:pf.colorId===c.id?`0 0 12px ${c.l}88`:"none",transition:"all 0.2s"}}/>)}</div>
          </div>
          <div style={{display:"flex",gap:"0.4rem",justifyContent:"flex-end"}}>
            <button className="glow-btn" onClick={()=>setShowPF(false)} style={btn("sec")}>İptal</button>
            <button className="glow-btn" onClick={submitProject} style={btn()}>Kaydet</button>
          </div>
        </div>
      </div>}

      {/* Project Event Form */}
      {showPEF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowPEF(false)}>
        <div style={mBox} className="modal-enter">
          <h2 style={{margin:"0 0 1rem",fontSize:"0.96rem",fontWeight:"800",color:T.text}}>📅 Projeye Etkinlik Ekle</h2>
          <input value={pEf.title} onChange={e=>setPEf(f=>({...f,title:e.target.value}))} placeholder="Etkinlik başlığı" autoFocus style={{...inp,marginBottom:"0.7rem"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem",marginBottom:"0.7rem"}}>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Tarih</label><input type="date" value={pEf.date} onChange={e=>setPEf(f=>({...f,date:e.target.value}))} style={inp}/></div>
            <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:"0.5rem"}}><input type="checkbox" id="pAllDay" checked={pEf.allDay} onChange={e=>setPEf(f=>({...f,allDay:e.target.checked}))} style={{accentColor:"#38BDF8"}}/><label htmlFor="pAllDay" style={{fontSize:"0.78rem",color:T.muted,cursor:"pointer",fontWeight:"500"}}>Tüm gün</label></div>
            {!pEf.allDay&&<><div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Başlangıç</label><input type="time" value={pEf.startTime} onChange={e=>setPEf(f=>({...f,startTime:e.target.value}))} style={inp}/></div><div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Bitiş</label><input type="time" value={pEf.endTime} onChange={e=>setPEf(f=>({...f,endTime:e.target.value}))} style={inp}/></div></>}
          </div>
          <div style={{marginBottom:"0.7rem"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.3rem",fontWeight:"700"}}>Renk</label>
            <div style={{display:"flex",gap:"0.4rem"}}>{EV_COLORS.map(c=><button key={c.id} onClick={()=>setPEf(f=>({...f,colorId:c.id}))} style={{width:20,height:20,borderRadius:"50%",background:c.l,border:pEf.colorId===c.id?`3px solid ${T.text}`:"3px solid transparent",cursor:"pointer",boxShadow:pEf.colorId===c.id?`0 0 10px ${c.l}88`:"none"}}/>)}</div>
          </div>
          <div style={{display:"flex",gap:"0.4rem",justifyContent:"flex-end"}}>
            <button className="glow-btn" onClick={()=>setShowPEF(false)} style={btn("sec")}>İptal</button>
            <button className="glow-btn" onClick={submitProjectEvent} style={btn()}>Ekle</button>
          </div>
        </div>
      </div>}

      {/* Event Form */}
      {showEF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowEF(false)}>
        <div style={mBox} className="modal-enter">
          <h2 style={{margin:"0 0 1rem",fontSize:"0.96rem",fontWeight:"800",color:T.text}}>{editEId?"Etkinliği Düzenle":"Yeni Etkinlik"}</h2>
          <input value={ef.title} onChange={e=>setEf(f=>({...f,title:e.target.value}))} placeholder="Etkinlik başlığı" autoFocus style={{...inp,marginBottom:"0.8rem"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem",marginBottom:"0.8rem"}}>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Tarih</label><input type="date" value={ef.date} onChange={e=>setEf(f=>({...f,date:e.target.value}))} style={inp}/></div>
            <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:"0.5rem"}}><input type="checkbox" id="allday" checked={ef.allDay} onChange={e=>setEf(f=>({...f,allDay:e.target.checked}))} style={{accentColor:"#38BDF8"}}/><label htmlFor="allday" style={{fontSize:"0.78rem",color:T.muted,cursor:"pointer",fontWeight:"500"}}>Tüm gün</label></div>
            {!ef.allDay&&<><div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Başlangıç</label><input type="time" value={ef.startTime} onChange={e=>setEf(f=>({...f,startTime:e.target.value}))} style={inp}/></div><div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Bitiş</label><input type="time" value={ef.endTime} onChange={e=>setEf(f=>({...f,endTime:e.target.value}))} style={inp}/></div></>}
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Takvim</label><select value={ef.catId} onChange={e=>setEf(f=>({...f,catId:e.target.value}))} style={inp}>{evCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Proje Bağla</label><select value={ef.projectId||""} onChange={e=>setEf(f=>({...f,projectId:e.target.value||null}))} style={inp}><option value="">— Bağlantı yok —</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Tekrar</label><select value={ef.recur} onChange={e=>setEf(f=>({...f,recur:e.target.value}))} style={inp}>{RECUR_OPTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
          </div>
          <div style={{marginBottom:"0.8rem"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.3rem",fontWeight:"700"}}>Renk</label><div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>{EV_COLORS.map(c=><button key={c.id} onClick={()=>setEf(f=>({...f,colorId:c.id}))} style={{width:22,height:22,borderRadius:"50%",background:c.l,border:ef.colorId===c.id?`3px solid ${T.text}`:"3px solid transparent",cursor:"pointer",boxShadow:ef.colorId===c.id?`0 0 12px ${c.l}88`:"none",transition:"all 0.2s"}}/>)}</div></div>
          <div style={{marginBottom:"1rem"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Açıklama</label><textarea value={ef.desc} onChange={e=>setEf(f=>({...f,desc:e.target.value}))} placeholder="Açıklama (isteğe bağlı)" rows={2} style={{...inp,resize:"vertical",lineHeight:1.6}}/></div>
          <div style={{display:"flex",gap:"0.4rem",justifyContent:"flex-end"}}><button className="glow-btn" onClick={()=>setShowEF(false)} style={btn("sec")}>İptal</button><button className="glow-btn" onClick={submitEvent} style={btn()}>Kaydet</button></div>
        </div>
      </div>}

      {/* Event Detail */}
      {showEDetail&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowEDetail(null)}>
        <div style={{...mBox,width:"min(96vw,340px)",padding:"1.2rem"}} className="modal-enter">
          <div style={{display:"flex",alignItems:"flex-start",gap:"0.6rem",marginBottom:"0.8rem"}}>
            <div style={{width:12,height:12,borderRadius:"50%",background:evCol(showEDetail.colorId||"blue"),flexShrink:0,marginTop:3,boxShadow:`0 0 8px ${evCol(showEDetail.colorId||"blue")}88`}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:"1rem",fontWeight:"800",color:T.text,marginBottom:"0.2rem"}}>{showEDetail.title}{showEDetail.projectId?` 📁`:""}{showEDetail.recur!=="none"?" 🔁":""}</div>
              <div style={{fontSize:"0.74rem",color:T.muted}}>{fmtShort(showEDetail.date)}{showEDetail.allDay?" · Tüm gün":showEDetail.startTime?` · ${showEDetail.startTime}–${showEDetail.endTime}`:""}</div>
              {showEDetail.catId&&<div style={{fontSize:"0.7rem",color:T.muted,marginTop:"0.2rem"}}>🗂 {evCats.find(c=>c.id===showEDetail.catId)?.name||""}</div>}
              {showEDetail.projectId&&<div style={{fontSize:"0.7rem",color:T.muted,marginTop:"0.2rem"}}>◈ {getProject(showEDetail.projectId)?.name||""}</div>}
              {showEDetail.desc&&<div style={{fontSize:"0.78rem",color:T.muted,marginTop:"0.5rem",lineHeight:1.6}}>{showEDetail.desc}</div>}
            </div>
            <button onClick={()=>setShowEDetail(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.faint,fontSize:"1rem",padding:0}}>✕</button>
          </div>
          <div style={{display:"flex",gap:"0.4rem",justifyContent:"flex-end"}}>
            <button className="glow-btn" onClick={()=>{setEditEId(showEDetail.id);setEf({title:showEDetail.title,date:showEDetail.date,startTime:showEDetail.startTime||"09:00",endTime:showEDetail.endTime||"10:00",colorId:showEDetail.colorId||"blue",catId:showEDetail.catId||evCats[0]?.id||"c1",desc:showEDetail.desc||"",allDay:showEDetail.allDay||false,recur:showEDetail.recur||"none",projectId:showEDetail.projectId||null});setShowEDetail(null);setShowEF(true);}} style={btn("sec")}>✏️ Düzenle</button>
            <button className="glow-btn" onClick={()=>delEvent(showEDetail.id)} style={{...btn("sec"),color:"#F472B6",borderColor:"rgba(244,114,182,0.3)"}}>🗑️ Sil</button>
          </div>
        </div>
      </div>}

      {/* Note Form */}
      {showNF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowNF(false)}>
        <div style={mBox} className="modal-enter">
          <h2 style={{margin:"0 0 1rem",fontSize:"0.96rem",fontWeight:"800",color:T.text}}>{editNId?"Notu Düzenle":"Yeni Not"}</h2>
          <input ref={nTRef} value={nf.title} onChange={e=>setNf(f=>({...f,title:e.target.value}))} placeholder="Başlık" style={{...inp,marginBottom:"0.7rem"}}/>
          <textarea value={nf.content} onChange={e=>setNf(f=>({...f,content:e.target.value}))} placeholder="Notunuzu yazın…" rows={5} style={{...inp,resize:"vertical",lineHeight:1.7,marginBottom:"0.7rem"}}/>
          <div style={{marginBottom:"0.7rem"}}>
            <div style={{fontSize:"0.64rem",color:T.muted,marginBottom:"0.3rem",fontWeight:"700"}}>Resim</div>
            {nf.image?<div style={{position:"relative",display:"inline-block"}}><img src={nf.image} alt="" style={{maxHeight:100,borderRadius:"8px",display:"block"}}/><button onClick={()=>setNf(f=>({...f,image:null}))} style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,0.7)",color:"white",border:"none",borderRadius:"50%",width:18,height:18,cursor:"pointer",fontSize:"0.6rem",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>
            :<button className="glow-btn" onClick={()=>imgRef.current?.click()} style={{...btn("sec"),fontSize:"0.76rem"}}>📷 Resim ekle</button>}
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} style={{display:"none"}}/>
          </div>
          <div style={{marginBottom:"1rem"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.28rem",fontWeight:"700"}}>Kategori</label><select value={nf.category} onChange={e=>setNf(f=>({...f,category:e.target.value}))} style={{...inp,width:"auto"}}>{nCats.map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={{display:"flex",gap:"0.4rem",justifyContent:"flex-end"}}><button className="glow-btn" onClick={()=>setShowNF(false)} style={btn("sec")}>İptal</button><button className="glow-btn" onClick={submitNote} style={btn()}>Kaydet</button></div>
        </div>
      </div>}

      {/* Todo Form */}
      {showTF&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowTF(false)}>
        <div style={mBox} className="modal-enter">
          <h2 style={{margin:"0 0 1rem",fontSize:"0.96rem",fontWeight:"800",color:T.text}}>{editTId?"Todo Düzenle":"Yeni Todo"}</h2>
          <input ref={tTRef} value={tf.title} onChange={e=>setTf(f=>({...f,title:e.target.value}))} placeholder="Todo başlığı" autoFocus style={{...inp,marginBottom:"0.7rem"}}/>
          <textarea value={tf.notes} onChange={e=>setTf(f=>({...f,notes:e.target.value}))} placeholder="Notlar (isteğe bağlı)" rows={2} style={{...inp,resize:"vertical",lineHeight:1.6,marginBottom:"0.7rem"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem",marginBottom:"0.7rem"}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Kategori</label>
              <select value={tf.todoCatId} onChange={e=>setTf(f=>({...f,todoCatId:e.target.value}))} style={inp}>
                {todoCats.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.name} [{c.stat}]</option>)}
              </select>
              {tf.todoCatId&&(()=>{const c=getTodoCat(tf.todoCatId);return c?<div style={{marginTop:"0.24rem",fontSize:"0.62rem",color:STAT_COLORS[c.stat]}}>✓ {STAT_ICONS[c.stat]} {STAT_LABELS[c.stat]} +10 puan kazanırsın</div>:null;})()}
            </div>
            {/* Project dropdown */}
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Proje</label>
              <select value={tf.projectId||""} onChange={e=>setTf(f=>({...f,projectId:e.target.value||null}))} style={inp}>
                <option value="">— Proje yok —</option>
                {projects.map(p=>{const c=projCol(p.colorId);return<option key={p.id} value={p.id}>{p.name}</option>;})}
              </select>
              {tf.projectId&&<div style={{marginTop:"0.24rem",fontSize:"0.62rem",color:"#38BDF8"}}>✓ Bu todo proje ilerlemesini etkiler</div>}
            </div>
            <div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Öncelik</label><select value={tf.priority} onChange={e=>setTf(f=>({...f,priority:e.target.value}))} style={inp}><option value="yüksek">🔴 Yüksek</option><option value="orta">🟡 Orta</option><option value="düşük">🟢 Düşük</option></select></div>
            <div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Bitiş</label><input type="date" value={tf.dueDate} onChange={e=>setTf(f=>({...f,dueDate:e.target.value}))} style={inp}/></div>
            <div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>⏰ Saat</label><input type="time" value={tf.dueTime} onChange={e=>setTf(f=>({...f,dueTime:e.target.value}))} style={inp}/></div>
            <div><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Not Bağla</label><select value={tf.linkedNoteId} onChange={e=>setTf(f=>({...f,linkedNoteId:e.target.value}))} style={inp}><option value="">— Yok —</option>{notes.map(n=><option key={n.id} value={n.id}>{n.title||"Başlıksız"}</option>)}</select></div>
          </div>
          <div style={{marginBottom:"0.7rem"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.28rem",fontWeight:"700"}}>Etiketler</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",marginBottom:"0.38rem"}}>{tf.tags.map(tag=><span key={tag} style={{fontSize:"0.66rem",background:T.hover,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"0.1rem 0.48rem",color:T.muted,cursor:"pointer"}} onClick={()=>setTf(f=>({...f,tags:f.tags.filter(t=>t!==tag)}))}>#{tag} ✕</span>)}</div>
            <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
              {allTags.filter(t=>!tf.tags.includes(t)).map(tag=><button key={tag} onClick={()=>addTfTag(tag)} style={{fontSize:"0.64rem",background:"transparent",border:`1px dashed ${T.border}`,borderRadius:"20px",padding:"0.09rem 0.42rem",color:T.faint,cursor:"pointer",fontFamily:FONT}}>+#{tag}</button>)}
              <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addTfTag(newTag))} placeholder="Yeni etiket" style={{...inp,width:96,padding:"0.2rem 0.42rem",fontSize:"0.66rem"}}/>
            </div>
          </div>
          <div style={{marginBottom:"1rem"}}><label style={{fontSize:"0.64rem",color:T.muted,display:"block",marginBottom:"0.3rem",fontWeight:"700"}}>Alt Görevler</label>
            {tf.subtasks.map(s=>(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.2rem 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:"0.76rem",color:T.muted,flex:1}}>· {s.title}</span>
                <button onClick={()=>setTf(f=>({...f,subtasks:f.subtasks.filter(x=>x.id!==s.id)}))} style={{background:"transparent",border:"none",cursor:"pointer",color:T.faint,fontSize:"0.72rem",padding:0}}>✕</button>
              </div>
            ))}
            <div style={{display:"flex",gap:"0.3rem",marginTop:"0.38rem"}}><input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addSub())} placeholder="Alt görev ekle…" style={inp}/><button className="glow-btn" onClick={addSub} style={{...btn(),padding:"0.5rem 0.8rem"}}>+</button></div>
          </div>
          <div style={{display:"flex",gap:"0.4rem",justifyContent:"flex-end"}}><button className="glow-btn" onClick={()=>setShowTF(false)} style={btn("sec")}>İptal</button><button className="glow-btn" onClick={submitTodo} style={btn()}>Kaydet</button></div>
        </div>
      </div>}

      {/* Category Manager */}
      {showCatMgr&&<div style={modal} onClick={e=>e.target===e.currentTarget&&setShowCatMgr(false)}>
        <div style={{...mBox,width:"min(96vw,540px)"}} className="modal-enter">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem"}}>
            <h2 style={{margin:0,fontSize:"0.96rem",fontWeight:"800",color:T.text}}>⚙️ Kategori Yönetimi</h2>
            <button onClick={()=>setShowCatMgr(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.faint,fontSize:"1.1rem",padding:0}}>✕</button>
          </div>
          <div style={{background:dk?"rgba(56,189,248,0.06)":"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:"10px",padding:"0.6rem 0.85rem",marginBottom:"1rem",fontSize:"0.74rem",color:T.muted,lineHeight:1.65}}>
            Todo tamamladığında seçilen <strong style={{color:"#38BDF8"}}>nitelik</strong> artar ve Radar Chart'ta görünür.
          </div>
          <div style={{marginBottom:"1rem",maxHeight:"240px",overflowY:"auto",display:"flex",flexDirection:"column",gap:"0.35rem"}}>
            {todoCats.map(cat=>(
              <div key={cat.id} className="cyber-card" style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.6rem 0.8rem"}}>
                <span style={{fontSize:"1.15rem",flexShrink:0}}>{cat.emoji}</span>
                <span style={{flex:1,fontSize:"0.82rem",fontWeight:"600",color:T.text}}>{cat.name}</span>
                <div style={{display:"flex",alignItems:"center",gap:"0.28rem",background:`${STAT_COLORS[cat.stat]}18`,border:`1px solid ${STAT_COLORS[cat.stat]}44`,borderRadius:"20px",padding:"0.08rem 0.48rem"}}>
                  <span style={{fontSize:"0.74rem"}}>{STAT_ICONS[cat.stat]}</span>
                  <span style={{fontSize:"0.66rem",fontWeight:"800",color:STAT_COLORS[cat.stat]}}>{cat.stat}</span>
                </div>
                <span style={{fontSize:"0.62rem",color:T.faint,fontFamily:FONT_MONO,minWidth:30}}>{todos.filter(t=>t.todoCatId===cat.id).length}</span>
                <button onClick={()=>{setEditCatId(cat.id);setCatForm({name:cat.name,emoji:cat.emoji,stat:cat.stat});}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.76rem",opacity:0.4,padding:"2px",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.4}>✏️</button>
                <button onClick={()=>{const inUse=todos.filter(t=>t.todoCatId===cat.id).length;if(inUse>0)setDeleteCatConfirm({catId:cat.id,catName:cat.name,inUse});else doDeleteCat(cat.id,null);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.76rem",opacity:0.4,padding:"2px",color:"#F472B6",transition:"opacity 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.4}>🗑️</button>
              </div>
            ))}
          </div>
          <div className="cyber-card" style={{padding:"1rem",marginBottom:"0.7rem"}}>
            <div style={{fontSize:"0.66rem",fontWeight:"800",color:T.faint,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.65rem"}}>{editCatId?"Düzenle":"Yeni Kategori"}</div>
            <div style={{display:"grid",gridTemplateColumns:"56px 1fr",gap:"0.6rem",marginBottom:"0.6rem"}}>
              <div><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Emoji</label><input value={catForm.emoji} onChange={e=>setCatForm(f=>({...f,emoji:e.target.value}))} maxLength={2} style={{...inp,textAlign:"center",fontSize:"1.2rem",padding:"0.35rem"}}/></div>
              <div><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.24rem",fontWeight:"700"}}>Ad</label><input value={catForm.name} onChange={e=>setCatForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveCat()} placeholder="Kategori adı…" style={inp}/></div>
            </div>
            <div style={{marginBottom:"0.7rem"}}><label style={{fontSize:"0.62rem",color:T.muted,display:"block",marginBottom:"0.35rem",fontWeight:"700"}}>Nitelik</label>
              <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
                {STAT_KEYS.map(k=><button key={k} onClick={()=>setCatForm(f=>({...f,stat:k}))} className="glow-btn" style={{background:catForm.stat===k?STAT_COLORS[k]:"transparent",color:catForm.stat===k?"#080C14":STAT_COLORS[k],border:`2px solid ${STAT_COLORS[k]}`,borderRadius:"8px",padding:"0.35rem 0.75rem",cursor:"pointer",fontFamily:FONT,fontSize:"0.76rem",fontWeight:"800",transition:"all 0.2s"}}>{STAT_ICONS[k]} {k}</button>)}
              </div>
            </div>
            <div style={{display:"flex",gap:"0.4rem",justifyContent:"flex-end"}}>
              {editCatId&&<button className="glow-btn" onClick={()=>{setEditCatId(null);setCatForm({name:"",emoji:"📋",stat:"FOC"});}} style={btn("sec")}>İptal</button>}
              <button className="glow-btn" onClick={saveCat} style={{...btn(),opacity:catForm.name.trim()?1:0.4}}>{editCatId?"Güncelle":"+ Ekle"}</button>
            </div>
          </div>
        </div>
      </div>}

      {/* Delete Cat Confirm */}
      {deleteCatConfirm&&<div style={{...modal,zIndex:400}} onClick={e=>e.target===e.currentTarget&&setDeleteCatConfirm(null)}>
        <div style={{...mBox,width:"min(96vw,380px)",padding:"1.4rem"}} className="modal-enter">
          <div style={{fontSize:"2rem",textAlign:"center",marginBottom:"0.7rem"}}>⚠️</div>
          <h3 style={{margin:"0 0 0.6rem",fontSize:"0.96rem",fontWeight:"800",color:T.text,textAlign:"center"}}>Kategoriyi Sil</h3>
          <p style={{margin:"0 0 1.1rem",fontSize:"0.8rem",color:T.muted,textAlign:"center",lineHeight:1.65}}>
            <strong style={{color:T.text}}>"{deleteCatConfirm.catName}"</strong> kategorisinde <strong style={{color:"#FB923C"}}>{deleteCatConfirm.inUse} todo</strong> var. Hangi kategoriye taşınsın?
          </p>
          <div style={{marginBottom:"1.1rem"}}><select id="fallbackCatSel" defaultValue={todoCats.find(c=>c.id!==deleteCatConfirm.catId)?.id||""} style={inp}>
            {todoCats.filter(c=>c.id!==deleteCatConfirm.catId).map(c=><option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select></div>
          <div style={{display:"flex",gap:"0.48rem"}}>
            <button className="glow-btn" onClick={()=>setDeleteCatConfirm(null)} style={{...btn("sec"),flex:1}}>İptal</button>
            <button className="glow-btn" onClick={()=>{const sel=document.getElementById("fallbackCatSel");doDeleteCat(deleteCatConfirm.catId,sel?.value||null);}} style={{...btn(),flex:1,background:"linear-gradient(135deg,#F472B6,#DB2777)",color:"#fff",border:"none"}}>Sil & Taşı</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
