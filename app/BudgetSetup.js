'use client';

import { useEffect, useState } from 'react';

const KEY='my-budget-week-view-v1';

export default function BudgetSetup(){
 const[mode,setMode]=useState('payday');
 useEffect(()=>{setMode(localStorage.getItem(KEY)||'payday')},[]);
 function change(next){setMode(next);localStorage.setItem(KEY,next);window.dispatchEvent(new CustomEvent('budget-week-view-change',{detail:next}))}
 return <details className="setup-menu"><summary>Budget setup</summary><div className="setup-menu-body"><label><span>Week-by-week view</span><select value={mode} onChange={e=>change(e.target.value)}><option value="payday">Payday week · Thursday–Wednesday</option><option value="calendar">Normal week · Monday–Sunday</option></select></label><small>Switch views anytime. This changes how bills are grouped on screen, not their due dates or amounts.</small></div></details>;
}
