/* Matte Prov v1.1 — exam-safe figures.
   Rule: figures may show GIVEN information and requested unknowns, but never formulas,
   solution steps or hidden answer values. Geometry is intentionally marked "Ej skalenlig"
   unless scale itself is the subject. */
(function(root){
'use strict';

const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const isU=v=>v==null||v==='?'||String(v).trim()==='?';
const n=v=>Number(String(v).replace(',','.'));
const fmt=v=>isU(v)?'?':String(v).replace('.',',');
const unit=(x, fallback='cm')=>x?.vis?.unit||fallback;
const label=(v,u='')=>isU(v)?'?':fmt(v)+(u?' '+u:'');
const S=(body,aria='Figur',note='Ej skalenlig')=>`<div class="exam-figure"><svg viewBox="0 0 360 240" role="img" aria-label="${E(aria)}">${body}</svg>${note?`<div class="fig-note">${E(note)}</div>`:''}</div>`;
const L=(x1,y1,x2,y2,cls='g-line')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const T=(x,y,t,cls='g-text',anchor='middle')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${E(t)}</text>`;
const R=(x,y,w,h,cls='g-shape',rx=4)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"/>`;
const C=(cx,cy,r,cls='g-shape')=>`<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls}"/>`;
const P=(pts,cls='g-shape')=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" class="${cls}"/>`;
const dash=(x1,y1,x2,y2)=>L(x1,y1,x2,y2,'g-line g-dash');
const right=(x,y,s=14)=>`<path d="M${x} ${y-s} L${x+s} ${y-s} L${x+s} ${y}" class="g-line thin"/>`;
const arc=(cx,cy,r,a1,a2,cls='g-arc')=>{
  const p1=[cx+r*Math.cos(a1),cy+r*Math.sin(a1)],p2=[cx+r*Math.cos(a2),cy+r*Math.sin(a2)];
  let d=a2-a1; while(d<0)d+=Math.PI*2; const large=d>Math.PI?1:0;
  return `<path d="M ${p1[0]} ${p1[1]} A ${r} ${r} 0 ${large} 1 ${p2[0]} ${p2[1]}" class="${cls}"/>`;
};
const dim=(x1,y1,x2,y2,txt,tx,ty)=>{
  return L(x1,y1,x2,y2,'g-dim')+
    `<path d="M${x1} ${y1} l8 -4 M${x1} ${y1} l8 4 M${x2} ${y2} l-8 -4 M${x2} ${y2} l-8 4" class="g-dim"/>`+
    T(tx,ty,txt,'g-label');
};

function triAngles(v){
 let b='';
 if(Number(v.b)===90){
   // A right angle belongs at vertex B, not in an arbitrary schematic triangle.
   b+=P([[68,194],[300,194],[300,48]]);
   b+=`<path d="M284 194 L284 178 L300 178" class="g-line thin"/>`;
   b+=T(101,176,label(v.a,'°'),'g-label')+T(261,170,label(v.b,'°'),'g-label')+T(276,82,label(v.c,'°'),'g-label');
   return S(b,'Triangel med rät vinkel i hörn B');
 }
 if(Number(v.a)===90){
   b+=P([[65,194],[290,194],[65,48]]);
   b+=`<path d="M65 178 L81 178 L81 194" class="g-line thin"/>`;
   b+=T(102,176,label(v.a,'°'),'g-label')+T(260,176,label(v.b,'°'),'g-label')+T(90,84,label(v.c,'°'),'g-label');
   return S(b,'Triangel med rät vinkel i hörn A');
 }
 // When two base angles are equal the apex must lie above the midpoint.
 b+=P([[64,193],[296,193],[180,42]]);
 b+=T(91,176,label(v.a,'°'),'g-label')+T(268,176,label(v.b,'°'),'g-label')+T(180,80,label(v.c,'°'),'g-label');
 return S(b,'Triangel med markerade vinklar');
}
function lineAngle(v){
 let b=L(35,165,325,165)+L(180,165,250,65);
 b+=arc(180,165,42,Math.PI,5.32)+arc(180,165,52,5.32,Math.PI*2);
 b+=T(130,139,label(v.a,'°'),'g-label')+T(231,138,label(v.b,'°'),'g-label');
 return S(b,'Två sidovinklar på en rak linje');
}
function pointAngles(v){
 const ls=v.list||[90,110,'?'],O=[180,124],radius=87;
 // The first known angle is measured clockwise from the upward ray,
 // the second follows it. The last sector is the unknown (not labelled numerically).
 const first=Number(ls[0])||90,second=Number(ls[1])||110;
 const direction=[-Math.PI/2,-Math.PI/2+first*Math.PI/180,
   -Math.PI/2+(first+second)*Math.PI/180];
 let b='';
 direction.forEach(a=>b+=L(O[0],O[1],O[0]+radius*Math.cos(a),O[1]+radius*Math.sin(a)));
 b+=C(O[0],O[1],3,'g-dot');
 const mid=[-Math.PI/2+first*Math.PI/360,
  -Math.PI/2+(first+second/2)*Math.PI/180,
  -Math.PI/2+(first+second+(360-first-second)/2)*Math.PI/180];
 for(let i=0;i<3;i++){
   const x=O[0]+46*Math.cos(mid[i]),y=O[1]+46*Math.sin(mid[i]);
   b+=T(x,y,label(ls[i],'°'),'g-label');
 }
 return S(b,'Vinklar runt en punkt');
}
function parallel(v,q){
 const marks=v.marks||{},crossing=v.single===true||(!/parallell/i.test(q||''));
 let b='';
 if(crossing){
   const acute=Math.max(20,Math.min(85,Number(v.acute)||65));
   const half=acute*Math.PI/360,cx=180,cy=120,r=94;
   const dx=r*Math.sin(half),dy=r*Math.cos(half);
   b+=L(cx-dx,cy-dy,cx+dx,cy+dy)+L(cx+dx,cy-dy,cx-dx,cy+dy);
   const pos={1:[cx,cy-39],2:[cx+48,cy+5],3:[cx,cy+43],4:[cx-48,cy+5]};
   for(const [k,t] of Object.entries(marks))if(pos[k])b+=T(pos[k][0],pos[k][1],t,'g-label');
   return S(b,'Två korsande linjer');
 }
 // Match the instructional figure's explicit angle numbering:
 // 1=upper-left, 2=upper-right, 3=lower-right, 4=lower-left
 // at the first intersection, 5..8 likewise at the second.
 const acute=Math.max(25,Math.min(80,Number(v.acute)||65));
 const angle=acute*Math.PI/180;
 const y1=67,y2=164,cx1=139,cx2=cx1+(y2-y1)/Math.tan(angle);
 const ux=Math.cos(angle),uy=Math.sin(angle);
 b+=L(25,y1,332,y1)+L(25,y2,332,y2);
 b+=L(cx1-37*ux,y1-37*uy,cx2+37*ux,y2+37*uy);
 b+=`<path d="M40 ${y1-6} l11 6 M40 ${y2-6} l11 6" class="g-mark"/>`;
 const pos={
  1:[cx1-30,y1-18],2:[cx1+39,y1-18],3:[cx1+38,y1+29],4:[cx1-31,y1+29],
  5:[cx2-30,y2-19],6:[cx2+38,y2-19],7:[cx2+38,y2+30],8:[cx2-31,y2+30]
 };
 for(const [k,t] of Object.entries(marks))if(pos[k])b+=T(pos[k][0],pos[k][1],t,'g-label');
 return S(b,'Två parallella linjer skurna av en transversal');
}
function polygon(v,q){
 const N=Math.max(3,Number(v.n)||5),cx=180,cy=117,r=76;
 const pts=Array.from({length:N},(_,i)=>[cx+r*Math.sin(2*Math.PI*i/N),cy-r*Math.cos(2*Math.PI*i/N)]);
 let b=P(pts);
 if(/regelbunden/i.test(q||'')) b+=T(180,218,'alla sidor/vinklar lika','g-sub');
 return S(b,`${N}-hörning`);
}
function rightTri(v,q){
 const u=v.unit||'cm';
 if(/kvadrat/i.test(q||'')){
   let b=R(101,47,150,150)+L(101,197,251,47,'g-accent');
   b+=T(176,221,label(v.a,u),'g-label')+T(77,124,label(v.b,u),'g-label')+T(190,112,label(v.c,u),'g-label');
   return S(b,'Kvadrat med diagonal');
 }
 if(/stege|vägg/i.test(q||'')){
   let b=L(80,198,80,45)+L(55,198,300,198)+L(80,75,270,198,'g-accent')+right(80,198,14);
   b+=T(58,127,label(v.a,u),'g-label')+T(176,219,label(v.b,u),'g-label')+T(202,125,label(v.c,u),'g-label');
   return S(b,'Stege mot vägg');
 }
 let b=P([[78,194],[78,58],[292,194]])+right(78,194,14);
 b+=T(55,130,label(v.a,u),'g-label')+T(185,218,label(v.b,u),'g-label')+T(200,118,label(v.c,u),'g-label');
 return S(b,'Rätvinklig triangel');
}
function isoTri(v){
 const u=v.unit||'cm'; let b=P([[180,40],[62,194],[298,194]])+dash(180,40,180,194)+right(180,194,12);
 b+=T(110,114,label(v.side,u),'g-label')+T(250,114,label(v.side,u),'g-label')+T(180,219,label(v.base,u),'g-label');
 if(v.h!=null)b+=T(196,124,label(v.h,u),'g-label','start');
 return S(b,'Likbent triangel med höjd');
}
function scaleMap(v){
 let b=T(46,42,'ritning / karta','g-sub','start')+T(46,135,'verklighet','g-sub','start');
 b+=R(46,55,142,22,'g-bar',4)+R(46,148,236,22,'g-bar2',4);
 b+=T(205,72,String(v.img??'?'),'g-label','start')+T(294,165,String(v.real??'?'),'g-label','end');
 b+=T(180,210,`skala 1:${String(v.ratio).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}`,'g-label');
 return S(b,'Skala mellan ritning och verklighet','Schematisk bild');
}
function areaScale(item){
 const given=(item.given||[]).join(' ');
 const m=given.match(/(?:areafaktor|area.*?)(\d+(?:[.,]\d+)?)/i); const factor=m?m[1]:'?';
 let b=R(65,92,58,58,'g-shape')+R(190,55,116,116,'g-shape2');
 b+=T(94,181,'A₁','g-label')+T(248,198,'A₂','g-label')+T(180,30,`area × ${factor}`,'g-label')+T(180,124,'längdfaktor = ?','g-label');
 return S(b,'Två likformiga ytor','Schematisk bild');
}
function similar(v){
 let b=R(38,91,94,64,'g-shape')+R(190,55,132,100,'g-shape2');
 const sm=v.small||['?','?'],bg=v.big||['?','?'];
 b+=T(85,177,label(sm[0],v.unit||'cm'),'g-label')+T(22,126,label(sm[1],v.unit||'cm'),'g-label');
 b+=T(256,177,label(bg[0],v.unit||'cm'),'g-label')+T(337,109,label(bg[1],v.unit||'cm'),'g-label');
 return S(b,'Två likformiga rektanglar');
}
function circleFig(v,item){
 let b=C(160,115,72);
 const show=v.show||'';
 if(v.d!=null){b+=L(88,115,232,115,'g-accent')+T(160,103,`d = ${label(v.d,'cm')}`,'g-label')}
 if(v.r!=null){b+=L(160,115,232,115,'g-accent')+T(198,103,`r = ${label(v.r,'cm')}`,'g-label')}
 if(v.O!=null)b+=T(160,210,`O = ${v.O}`,'g-label');
 if(v.A!=null)b+=T(160,210,`A = ${v.A}`,'g-label');
 return S(b,show==='A'?'Cirkel för area':'Cirkel');
}
function sector(v,item){
 const asksAngle=/vinkel/i.test(item.find||'')||/hur stor är vinkeln/i.test(item.q||'');
 const ang=asksAngle?72:(Number(v.v)||90); // never encode hidden answer when angle is unknown
 const cx=155,cy=125,r=76,a=-ang*Math.PI/180,p=[cx+r*Math.cos(a),cy+r*Math.sin(a)];
 let b=C(cx,cy,r)+L(cx,cy,cx+r,cy,'g-accent')+L(cx,cy,p[0],p[1],'g-accent');
 b+=`<path d="M${cx+r},${cy} A${r},${r} 0 ${ang>180?1:0} 0 ${p[0]},${p[1]} L${cx},${cy} Z" class="g-sector"/>`;
 b+=T(198,113,asksAngle?'v = ?':`v = ${v.v}°`,'g-label');
 if(v.r!=null)b+=T(194,145,`r = ${label(v.r,'cm')}`,'g-label');
 const area=(item.given||[]).find(x=>/area/i.test(x));
 if(area)b+=T(160,218,area,'g-label');
 return S(b,'Cirkelsektor');
}
function cuboid(v,diag=false){
 let b=R(82,73,154,105)+P([[82,73],[126,42],[279,42],[236,73]])+P([[236,73],[279,42],[279,145],[236,178]]);
 if(diag)b+=L(82,178,279,42,'g-accent');
 const u=v.unit||'cm'; b+=T(159,203,label(v.l,u),'g-label')+T(262,171,label(v.b,u),'g-label')+T(62,129,label(v.h,u),'g-label');
 if(diag)b+=T(190,104,'d = ?','g-label');
 return S(b,diag?'Rätblock med rymddiagonal':v.cube?'Kub':'Rätblock');
}
function cylinder(v){
 let b=`<ellipse cx="170" cy="60" rx="68" ry="20" class="g-shape"/><path d="M102 60 V176 M238 60 V176" class="g-line"/><ellipse cx="170" cy="176" rx="68" ry="20" class="g-shape"/>`;
 if(v.d!=null)b+=L(102,60,238,60,'g-accent')+T(170,48,`d = ${label(v.d,'cm')}`,'g-label');
 if(v.r!=null)b+=L(170,60,238,60,'g-accent')+T(210,48,`r = ${label(v.r,'cm')}`,'g-label');
 if(v.h!=null)b+=dim(266,60,266,176,`h = ${label(v.h,'cm')}`,304,122);
 return S(b,'Cylinder');
}
function pyramid(v){
 let b=P([[82,176],[228,176],[286,142],[140,142]])+L(184,38,82,176)+L(184,38,228,176)+L(184,38,286,142)+dash(184,38,140,142);
 if(v.s!=null)b+=T(153,201,`s = ${label(v.s,'cm')}`,'g-label');
 if(v.B!=null)b+=T(184,164,`B = ${v.B} cm²`,'g-label');
 if(v.h!=null)b+=dash(184,38,184,159)+T(198,102,`h = ${label(v.h,'cm')}`,'g-label','start');
 return S(b,'Pyramid');
}
function cone(v){
 let b=`<path d="M180 34 L102 181 M180 34 L258 181" class="g-line"/><ellipse cx="180" cy="181" rx="78" ry="22" class="g-shape"/>`+dash(180,34,180,181);
 if(v.d!=null)b+=L(102,181,258,181,'g-accent')+T(180,170,`d = ${label(v.d,'cm')}`,'g-label');
 if(v.r!=null)b+=L(180,181,258,181,'g-accent')+T(223,170,`r = ${label(v.r,'cm')}`,'g-label');
 if(v.B!=null)b+=T(180,211,`B = ${v.B} cm²`,'g-label');
 if(v.h!=null)b+=T(194,108,`h = ${label(v.h,'cm')}`,'g-label','start');
 return S(b,'Kon');
}
function sphere(v){
 let b=C(170,116,77)+`<ellipse cx="170" cy="116" rx="77" ry="22" class="g-dash-only"/>`;
 if(v.d!=null)b+=L(93,116,247,116,'g-accent')+T(170,103,`d = ${label(v.d,'cm')}`,'g-label');
 if(v.r!=null)b+=L(170,116,247,116,'g-accent')+T(213,103,`r = ${label(v.r,'cm')}`,'g-label');
 return S(b,'Klot');
}
function trapezoid(v){
 let b=P([[65,184],[300,184],[252,63],[115,63]])+dash(115,63,115,184)+right(115,184,12);
 b+=T(183,213,`b = ${label(v.b,'cm')}`,'g-label')+T(184,51,`a = ${label(v.a,'cm')}`,'g-label')+T(132,129,`h = ${label(v.h,'cm')}`,'g-label','start');
 return S(b,'Trapets');
}
function lshape(v){
 const W=v.W??10,H=v.H??8,w=v.w??4,h=v.h??3;
 let b=P([[70,40],[250,40],[250,105],[310,105],[310,195],[70,195]])+R(250,40,60,65,'g-cut');
 b+=T(190,220,`hela: ${W} × ${H}`,'g-label')+T(280,83,`bort: ${w} × ${h}`,'g-label');
 return S(b,'L-formad figur','Schematisk bild');
}
function perim(v){
 if(v.shape==='tri'){
   const s=v.sides||['?','?','?']; let b=P([[180,45],[62,190],[302,190]]);
   b+=T(109,115,label(s[2],'cm'),'g-label')+T(253,115,label(s[1],'cm'),'g-label')+T(180,216,label(s[0],'cm'),'g-label');
   return S(b,'Triangel med sidlängder');
 }
 let b=R(95,50,170,140)+T(180,216,`s = ${label(v.side,'cm')}`,'g-label');
 return S(b,'Kvadrat');
}
function area(v){
 const sh=v.shape||'rect';
 if(sh==='tri'){
   let b=P([[70,190],[300,190],[206,50]])+dash(206,50,206,190)+right(206,190,12);
   b+=T(180,216,`b = ${label(v.b,'cm')}`,'g-label')+T(221,125,`h = ${label(v.h,'cm')}`,'g-label','start');
   return S(b,'Triangel med bas och höjd');
 }
 if(sh==='para'){
   let b=P([[100,55],[300,55],[255,190],[55,190]])+dash(100,55,100,190)+right(100,190,12);
   b+=T(170,216,`b = ${label(v.b,'cm')}`,'g-label')+T(117,125,`h = ${label(v.h,'cm')}`,'g-label','start');
   return S(b,'Parallellogram med bas och höjd');
 }
 let b=R(70,55,230,135)+T(185,216,`l = ${label(v.b,'cm')}`,'g-label')+T(48,127,`b = ${label(v.h,'cm')}`,'g-label');
 return S(b,'Rektangel');
}
function symmetry(v){
 let b=v.shape==='rect'?R(70,70,220,110):R(100,45,160,160);
 return S(b,v.shape==='rect'?'Rektangel':'Kvadrat','Räkna symmetrilinjerna själv');
}
function units(v,item){
 const given=(item.given||[])[0]||'',target=(item.find||'').replace(/^.*?i\s+/i,'');
 let b=R(45,78,112,60,'g-box')+R(203,78,112,60,'g-box')+L(164,108,196,108,'g-accent');
 b+=T(101,114,given,'g-label')+T(259,114,target?`? ${target}`:'?','g-label')+T(180,181,`${v.dim===1?'längd':v.dim===2?'area':'volym'}`,'g-sub');
 return S(b,'Enhetsomvandling','Schematisk bild');
}
function bigarea(v,item){
 const given=(item.given||[])[0]||'',target=(item.find||'').replace(/^arean i\s+/i,'');
 let b=R(46,75,120,68,'g-box')+R(194,75,120,68,'g-box')+L(170,109,190,109,'g-accent');
 b+=T(106,115,given,'g-label')+T(254,115,target?`? ${target}`:'?','g-label');
 return S(b,'Omvandling av stora areor','Schematisk bild');
}
function density(v,item){
 const gs=item.given||[]; let b=R(58,50,174,126,'g-map');
 for(let i=0;i<20;i++) b+=C(78+(i%5)*30,72+Math.floor(i/5)*28,4,'g-person');
 b+=T(266,83,gs[0]||'täthet','g-label','start')+T(266,119,gs[1]||'area','g-label','start')+T(266,155,'invånare = ?','g-label','start');
 return S(b,'Befolkning och area','Schematisk bild');
}
function netAsCube(v){return cuboid({l:v.a||4,b:v.a||4,h:v.a||4,cube:true,unit:'cm'},false)}
function infer(item,sid){
 const q=item.q||'',g=item.given||[];
 if(sid==='s9-pythagoras' && /rektangulär skärm/i.test(q)){
   let b=R(60,62,240,132)+L(60,194,300,62,'g-accent')+T(180,219,'48 cm','g-label')+T(37,132,'36 cm','g-label')+T(190,116,'d = ?','g-label');
   return S(b,'Rektangulär skärm med diagonal');
 }
 if(sid==='s9-pyth-more' && /sidorna är/i.test(q)){
   const nums=(q.match(/\d+(?:[.,]\d+)?/g)||[]).slice(0,3); if(nums.length===3){
    let b=P([[70,190],[295,190],[190,45]])+T(120,112,nums[0],'g-label')+T(250,112,nums[1],'g-label')+T(183,215,nums[2],'g-label');
    return S(b,'Triangel med givna sidlängder');
   }
 }
 if(sid==='f8-circle-circ' && /diametern|radien/i.test(q)){const m=q.match(/(diametern|radien).*?(\d+(?:[.,]\d+)?)/i);return circleFig(m?.[1]?.toLowerCase().startsWith('d')?{d:m[2]}:{r:m?.[2]},item)}
 if(sid==='f8-circle-area' && /diametern|radien/i.test(q)){const m=q.match(/(diametern|radien).*?(\d+(?:[.,]\d+)?)/i);return circleFig(m?.[1]?.toLowerCase().startsWith('d')?{d:m[2]}:{r:m?.[2]},item)}
 if(sid==='f8-cylinder' && g.length>=2){return S(T(180,115,g.join(' · '),'g-label'),'Cylinderuppgift','Ingen extra hjälpbilder visas i provläge')}
 if(sid==='f8-cone' && g.length>=2){return S(T(180,115,g.join(' · '),'g-label'),'Konuppgift','Ingen extra hjälpbilder visas i provläge')}
 if(sid==='f8-sphere' && g.length){const r=g.join(' ').match(/r\s*=\s*([\d,.]+)/i); if(r)return sphere({r:r[1]})}
 if(sid==='f8-area-more' && /trapets/i.test(q)){
   const nums=(q.match(/\d+(?:[.,]\d+)?/g)||[]); if(nums.length>=3)return trapezoid({a:nums[0],b:nums[1],h:nums[2]});
 }
 return '';
}

function examUnit(item,v){
 const given=(item.given||[]).join(' ');
 const m=given.match(/\d+(?:[.,]\d+)?\s*(mm|cm|dm|km|m)(?![A-Za-z0-9²³])/);
 return m?m[1]:(v.unit||'cm');
}
function render(item,sid){
 const v=item?.vis;
 if(!v) return infer(item||{},sid);
 const vv={...v,unit:examUnit(item,v)};
 switch(v.t){
   case'triAngles':return triAngles(v);
   case'lineAngle':return lineAngle(v);
   case'pointAngles':return pointAngles(v);
   case'parallel':return parallel(v,item.q);
   case'polygon':return polygon(v,item.q);
   case'rightTri':return rightTri(vv,item.q);
   case'isoTri':return isoTri(vv);
   case'scaleMap':return scaleMap(v);
   case'areaScale':return areaScale(item);
   case'similar':return similar(vv);
   case'circle':return circleFig(v,item);
   case'sector':return sector(v,item);
   case'cuboid':return cuboid(v,false);
   case'spaceDiag':return cuboid(v,true);
   case'cylinder':return cylinder(v);
   case'pyramid':return pyramid(v);
   case'cone':return cone(v);
   case'sphere':return sphere(v);
   case'net':return netAsCube(v);
   case'trapezoid':return trapezoid(v);
   case'lshape':return lshape(v);
   case'perim':return perim(v);
   case'area':return area(v);
   case'symmetry':return symmetry(v);
   case'units':return units(v,item);
   case'bigarea':return bigarea(v,item);
   case'density':return density(v,item);
   default:return infer(item||{},sid);
 }
}

const API={render};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.MOExamVisuals=API;
})(typeof window!=='undefined'?window:globalThis);
