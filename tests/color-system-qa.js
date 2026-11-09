'use strict';
/* Grade-specific visual-token contract. No private data or network calls. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('css/color-system.css');
assert.equal(css,read('lara/color-system.css'),'Lärande must mirror exact theme data');
assert.equal(css,read('prov/css/color-system.css'),'Prov must mirror exact theme data');
const blocks=[...css.matchAll(/(?:^|\n)([^\n{}]+)\{\n([\s\S]*?)\n\}/g)].filter(x=>x[2].includes('--ui-canvas:'));
assert.equal(blocks.length,4,'Four color schemes exactly: grade8/9 × light/dark');
const value=(body,key)=>body.match(new RegExp('--ui-'+key+':(#[0-9A-Fa-f]{6})'))?.[1];
const luminance=hex=>{
 const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*a[0]+.7152*a[1]+.0722*a[2];
};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
let checks=0;
function check(ok,msg){assert.ok(ok,msg);checks++}
for(const [i,block] of blocks.entries()){
 const p=block[2],desc=['grade9/day','grade8/day','grade9/night','grade8/night'][i];
 const bg=value(p,'canvas'),paper=value(p,'surface'),raised=value(p,'surface-2');
 const ink=value(p,'text'),muted=value(p,'muted');
 const primary=value(p,'primary'),on=value(p,'on-primary');
 const tint=value(p,'primary-tint'),tintInk=value(p,'on-tint');
 const secondary=value(p,'secondary');
 for(const [a,b,n] of [[ink,bg,'text/canvas'],[ink,paper,'text/surface'],[muted,paper,'muted/surface'],[primary,paper,'accent/surface'],[secondary,paper,'secondary/surface'],[on,primary,'on-primary/primary'],[tintInk,tint,'on-tint/tint']]){
   check(contrast(a,b)>=4.5,desc+' '+n+' contrast '+contrast(a,b).toFixed(2));
 }
 check(contrast(bg,paper)>=1.03,desc+' background vs surface not identical');
 check(contrast(paper,raised)>=1.03,desc+' surface vs elevated not identical');
 check(contrast(primary,secondary)>=1.03,desc+' primary and secondary remain distinguishable');
 check(value(p,'border')!==value(p,'canvas'),desc+' border not canvas color');
}
for(const [p,need] of [
 ['index.html','css/color-system.css?v=6.1.0'],
 ['lara/index.html','./color-system.css?v=6.1.0'],
 ['prov/index.html','css/color-system.css?v=6.1.0'],
 ['sw.js','./css/color-system.css?v=6.1.0'],
 ['lara/sw.js','./color-system.css?v=6.1.0'],
 ['prov/sw.js','./css/color-system.css?v=6.1.0'],
 ['js/tabell-arena.js','css/color-arena.css?v=6.1.0']
])check(read(p).includes(need),p+' must ship color CSS');
for(const p of ['js/color-runtime.js','lara/color-runtime.js','prov/js/color-runtime.js'])
 check(read(p).includes('MutationObserver'),p+' updates mobile status bar');
console.log('Color-system token and offline QA: '+checks+'/'+checks+' PASS');
