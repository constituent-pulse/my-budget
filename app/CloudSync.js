'use client';

import { useEffect, useRef, useState } from 'react';

const BUDGET_KEY='my-budget-v5';
const RECON_KEY='my-budget-reconciliation-v1';
const SYNC_KEY='my-budget-cloud-key-v1';
const CLOUD_TIME_KEY='my-budget-cloud-time-v1';
const LAST_SYNCED_KEY='my-budget-cloud-last-synced-v1';
const ENDPOINT='https://vksgfsftbzjgyavrkxyj.supabase.co/functions/v1/budget-sync';

function makeKey(){const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
function readJson(k){try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):null}catch{return null}}
function snapshot(){return {budget:readJson(BUDGET_KEY),reconciliation:readJson(RECON_KEY)}}
function signature(s){return JSON.stringify(s)}
function preserve(label){const b=localStorage.getItem(BUDGET_KEY);if(b)localStorage.setItem(`${BUDGET_KEY}-${label}`,b);const r=localStorage.getItem(RECON_KEY);if(r)localStorage.setItem(`${RECON_KEY}-${label}`,r)}
function applySnapshot(s){if(!s?.budget)return;localStorage.setItem(BUDGET_KEY,JSON.stringify(s.budget));if(s.reconciliation)localStorage.setItem(RECON_KEY,JSON.stringify(s.reconciliation));else localStorage.removeItem(RECON_KEY)}

export default function CloudSync(){
 const[key,setKey]=useState('');const[status,setStatus]=useState('Local only');const[busy,setBusy]=useState(false);const[showKey,setShowKey]=useState(false);const[connectKey,setConnectKey]=useState('');const syncing=useRef(false);
 async function request(method,syncKey,body){const r=await fetch(ENDPOINT,{method,headers:{'Content-Type':'application/json','x-sync-key':syncKey},body:body?JSON.stringify(body):undefined});const data=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(data.error||'Cloud sync failed');e.conflict=!!data.conflict;e.updated_at=data.updated_at;throw e}return data}
 function remember(s,t){localStorage.setItem(LAST_SYNCED_KEY,signature(s));localStorage.setItem(CLOUD_TIME_KEY,t||'')}

 useEffect(()=>{const existing=localStorage.getItem(SYNC_KEY)||'';setKey(existing);if(existing)setStatus('Automatic sync on')},[]);

 useEffect(()=>{if(!key)return;let stopped=false;
   async function sync(){if(stopped||syncing.current)return;syncing.current=true;try{
     const local=snapshot();if(!local.budget)return;
     const localSig=signature(local);const lastSig=localStorage.getItem(LAST_SYNCED_KEY)||'';const knownTime=localStorage.getItem(CLOUD_TIME_KEY)||'';
     const remote=await request('GET',key);if(!remote.snapshot)return;
     const cloud={budget:remote.snapshot.budget,reconciliation:remote.snapshot.reconciliation};const cloudSig=signature(cloud);const cloudTime=remote.snapshot.updated_at||'';
     if(!lastSig){remember(local,knownTime||cloudTime);setStatus('Automatic sync on');return}
     const localChanged=localSig!==lastSig;const cloudChanged=cloudSig!==lastSig;
     if(cloudChanged&&!localChanged){preserve('before-auto-sync');applySnapshot(cloud);remember(cloud,cloudTime);setStatus('Updated from cloud');setTimeout(()=>location.reload(),250);return}
     if(localChanged&&!cloudChanged){const result=await request('PUT',key,{...local,expectedUpdatedAt:knownTime||cloudTime});remember(local,result.updated_at);setStatus('Saved automatically');return}
     if(localChanged&&cloudChanged&&localSig!==cloudSig){preserve('sync-conflict');setStatus('Sync conflict — local copy preserved');return}
     remember(local,cloudTime);setStatus('Automatic sync on');
   }catch(e){setStatus(e.conflict?'Sync conflict — nothing overwritten':e.message)}finally{syncing.current=false}}
   sync();const timer=setInterval(sync,3000);const onFocus=()=>sync();window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onFocus);return()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus)}
 },[key]);

 async function enable(){const s=snapshot();if(!s.budget){setStatus('No local budget found to protect');return}setBusy(true);try{const syncKey=makeKey();const result=await request('PUT',syncKey,s);localStorage.setItem(SYNC_KEY,syncKey);remember(s,result.updated_at);setKey(syncKey);setShowKey(true);setStatus('Automatic sync on')}catch(e){setStatus(e.message)}finally{setBusy(false)}}
 async function saveNow(){const s=snapshot();if(!s.budget||!key)return;setBusy(true);try{const result=await request('PUT',key,s);remember(s,result.updated_at);setStatus('Saved to cloud')}catch(e){setStatus(e.message)}finally{setBusy(false)}}
 async function connectExisting(){const candidate=connectKey.trim();if(candidate.length<32){setStatus('Enter the complete recovery key');return}setBusy(true);try{const result=await request('GET',candidate);if(!result.snapshot){setStatus('No cloud budget found for that key');return}localStorage.setItem(SYNC_KEY,candidate);localStorage.setItem(CLOUD_TIME_KEY,result.snapshot.updated_at||'');localStorage.removeItem(LAST_SYNCED_KEY);setKey(candidate);setConnectKey('');setStatus('Connected. Restore once to start automatic sync.')}catch(e){setStatus(e.message)}finally{setBusy(false)}}
 function disconnectDevice(){localStorage.removeItem(SYNC_KEY);localStorage.removeItem(CLOUD_TIME_KEY);localStorage.removeItem(LAST_SYNCED_KEY);setKey('');setConnectKey('');setShowKey(false);setStatus('Disconnected. Local budget was not changed.')}
 async function restoreCloud(){if(!key)return;setBusy(true);try{const result=await request('GET',key);if(!result.snapshot){setStatus('No cloud copy found');return}preserve('before-cloud-restore');const s={budget:result.snapshot.budget,reconciliation:result.snapshot.reconciliation};applySnapshot(s);remember(s,result.snapshot.updated_at);setStatus('Cloud copy restored. Refreshing…');setTimeout(()=>location.reload(),300)}catch(e){setStatus(e.message)}finally{setBusy(false)}}

 return <details className="cloud-sync panel"><summary><strong>Cloud Sync</strong> <span className={`sync-status ${key?'connected':''}`}>{status}</span></summary><div className="sync-menu">{!key?<div className="sync-actions"><button type="button" onClick={enable} disabled={busy}>Enable cloud sync</button><span>Protects this device's current budget in the cloud.</span><details><summary>Connect another device</summary><div className="sync-connect"><input value={connectKey} onChange={e=>setConnectKey(e.target.value)} placeholder="Paste recovery key" autoCapitalize="off" autoCorrect="off"/><button type="button" onClick={connectExisting} disabled={busy}>Connect</button></div></details></div>:<div className="sync-actions"><p><strong>Automatic sync is active.</strong> Changes are checked every few seconds and whenever you return to the app.</p><div className="sync-buttons"><button type="button" onClick={saveNow} disabled={busy}>Save now</button><button className="secondary" type="button" onClick={restoreCloud} disabled={busy}>Restore cloud copy</button><button className="secondary" type="button" onClick={()=>setShowKey(v=>!v)}>{showKey?'Hide':'Show'} recovery key</button><button className="secondary" type="button" onClick={disconnectDevice} disabled={busy}>Connect a different cloud copy</button></div>{showKey&&<div className="recovery-key"><small>Keep this private.</small><code>{key}</code></div>}</div>}</div></details>;
}
