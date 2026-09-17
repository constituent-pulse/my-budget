'use client';

import { useEffect, useState } from 'react';

const BUDGET_KEY='my-budget-v5';
const RECON_KEY='my-budget-reconciliation-v1';
const SYNC_KEY='my-budget-cloud-key-v1';
const CLOUD_TIME_KEY='my-budget-cloud-time-v1';
const ENDPOINT='https://vksgfsftbzjgyavrkxyj.supabase.co/functions/v1/budget-sync';

function makeKey(){
  const bytes=new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}

function readJson(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}}

export default function CloudSync(){
  const[key,setKey]=useState('');
  const[status,setStatus]=useState('Local only');
  const[busy,setBusy]=useState(false);
  const[showKey,setShowKey]=useState(false);
  const[connectKey,setConnectKey]=useState('');

  useEffect(()=>{const existing=localStorage.getItem(SYNC_KEY)||'';setKey(existing);if(existing)setStatus('Cloud sync connected')},[]);

  async function request(method,syncKey,body){
    const r=await fetch(ENDPOINT,{method,headers:{'Content-Type':'application/json','x-sync-key':syncKey},body:body?JSON.stringify(body):undefined});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||'Cloud sync failed');
    return data;
  }

  async function enable(){
    const budget=readJson(BUDGET_KEY);
    if(!budget){setStatus('No local budget found to protect');return}
    setBusy(true);setStatus('Protecting current data…');
    try{
      const syncKey=makeKey();
      const reconciliation=readJson(RECON_KEY);
      const result=await request('PUT',syncKey,{budget,reconciliation});
      localStorage.setItem(SYNC_KEY,syncKey);
      localStorage.setItem(CLOUD_TIME_KEY,result.updated_at||'');
      setKey(syncKey);setShowKey(true);setStatus('Current data saved to cloud');
    }catch(e){setStatus(e.message)}finally{setBusy(false)}
  }

  async function saveNow(){
    const budget=readJson(BUDGET_KEY);if(!budget||!key)return;
    setBusy(true);setStatus('Saving…');
    try{
      const reconciliation=readJson(RECON_KEY);
      const result=await request('PUT',key,{budget,reconciliation});
      localStorage.setItem(CLOUD_TIME_KEY,result.updated_at||'');
      setStatus('Saved to cloud');
    }catch(e){setStatus(e.message)}finally{setBusy(false)}
  }

  async function connectExisting(){
    const candidate=connectKey.trim();
    if(candidate.length<32){setStatus('Enter the complete recovery key');return}
    setBusy(true);setStatus('Checking cloud copy…');
    try{
      const result=await request('GET',candidate);
      if(!result.snapshot){setStatus('No cloud budget found for that key');return}
      localStorage.setItem(SYNC_KEY,candidate);
      localStorage.setItem(CLOUD_TIME_KEY,result.snapshot.updated_at||'');
      setKey(candidate);setConnectKey('');setStatus('Cloud copy found. Local data was not changed.');
    }catch(e){setStatus(e.message)}finally{setBusy(false)}
  }

  function disconnectDevice(){
    // Only forget this browser's cloud connection. Budget and reconciliation data remain untouched.
    localStorage.removeItem(SYNC_KEY);
    localStorage.removeItem(CLOUD_TIME_KEY);
    setKey('');
    setConnectKey('');
    setShowKey(false);
    setStatus('Disconnected. Local budget was not changed.');
  }

  async function restoreCloud(){
    if(!key)return;
    setBusy(true);setStatus('Loading cloud copy…');
    try{
      const result=await request('GET',key);
      if(!result.snapshot){setStatus('No cloud copy found');return}
      const current=localStorage.getItem(BUDGET_KEY);
      if(current)localStorage.setItem(`${BUDGET_KEY}-before-cloud-restore`,current);
      const recon=localStorage.getItem(RECON_KEY);
      if(recon)localStorage.setItem(`${RECON_KEY}-before-cloud-restore`,recon);
      localStorage.setItem(BUDGET_KEY,JSON.stringify(result.snapshot.budget));
      if(result.snapshot.reconciliation)localStorage.setItem(RECON_KEY,JSON.stringify(result.snapshot.reconciliation));
      localStorage.setItem(CLOUD_TIME_KEY,result.snapshot.updated_at||'');
      setStatus('Cloud copy restored. Refreshing…');
      setTimeout(()=>location.reload(),400);
    }catch(e){setStatus(e.message)}finally{setBusy(false)}
  }

  return <section className="cloud-sync panel">
    <div className="section-head"><div><p className="eyebrow">Data protection</p><h2>Cloud Sync</h2></div><span className={`sync-status ${key?'connected':''}`}>{status}</span></div>
    {!key?<div className="sync-actions"><button type="button" onClick={enable} disabled={busy}>Enable cloud sync</button><span>Uploads the budget currently on this device. Nothing local is replaced.</span><details><summary>Connect another device</summary><div className="sync-connect"><input value={connectKey} onChange={e=>setConnectKey(e.target.value)} placeholder="Paste recovery key" autoCapitalize="off" autoCorrect="off"/><button type="button" onClick={connectExisting} disabled={busy}>Connect</button></div></details></div>:<div className="sync-actions"><div className="sync-buttons"><button type="button" onClick={saveNow} disabled={busy}>Save to cloud now</button><button className="secondary" type="button" onClick={restoreCloud} disabled={busy}>Restore cloud copy</button><button className="secondary" type="button" onClick={()=>setShowKey(v=>!v)}>{showKey?'Hide':'Show'} recovery key</button><button className="secondary" type="button" onClick={disconnectDevice} disabled={busy}>Connect a different cloud copy</button></div>{showKey&&<div className="recovery-key"><small>Keep this private. It connects another device to this budget.</small><code>{key}</code></div>}<small>Switching cloud copies only disconnects this browser. It does not delete or replace local budget data.</small></div>}
  </section>;
}
