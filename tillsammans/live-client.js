/* Together Live: authenticated, opt-in room client. No school localStorage reads/writes. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.MO_LIVE_API=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const STORAGE='matteos.together.live.room.v1';
 let db=null,person=null;
 const get=(key)=>{try{return root.localStorage?.getItem(key)||null;}catch(_){return null;}};
 const set=(key,val)=>{try{root.localStorage?.setItem(key,val);return true;}catch(_){return false;}};
 const del=(key)=>{try{root.localStorage?.removeItem(key);}catch(_){}};
 function apiError(error){if(error)throw Error(String(error.message||error).slice(0,180));}
 async function init(){
  if(!db){
   const cfg=root.MO_CUP_CONFIG;
   if(!root.supabase?.createClient||!cfg?.url||!cfg?.anonKey)throw Error('Live-läget kräver internet och synkklienten.');
   db=root.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,
    detectSessionInUrl:false,storageKey:'matteos-study-auth-v1'}});
  }
  // Retry auth after sign-in on another tab; a cached null must not block login forever.
  const {data,error}=await db.auth.getUser();
  if(error||!data?.user){person=null;return null;}
  const {data:profile,error:profileError}=await db.from('study_profiles')
   .select('user_id,display_name,role').eq('user_id',data.user.id).maybeSingle();
  apiError(profileError);
  if(!profile){person=null;return null;}
  person={id:data.user.id,name:profile.display_name||'Deltagare',role:profile.role};
  return person;
 }
 function current(){return person;}
 async function call(fn,args){
  if(!db||!person)throw Error('Logga in på ditt eget konto under Konto och synk.');
  const {data,error}=await db.rpc(fn,args);
  apiError(error);
  if(data && typeof data==='object' && typeof data.error==='string')throw Error(data.error.slice(0,180));
  return data;
 }
 function remember(room){if(!person)return false;return set(STORAGE,JSON.stringify({user:person.id,room}));}
 function resume(){
  if(!person)return null;let x;
  try{x=JSON.parse(get(STORAGE)||'null');}catch(_){return null;}
  return x?.user===person.id&&/^[0-9a-f-]{36}$/i.test(x.room||'')?x.room:null;
 }
 function forget(){del(STORAGE);}
 return {init,current,call,remember,resume,forget,STORAGE};
});