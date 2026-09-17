'use client';

import { useEffect, useRef, useState } from 'react';
import CloudSync from './CloudSync';

export default function AppMenu(){
  const[open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{function outside(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false)}function esc(e){if(e.key==='Escape')setOpen(false)}document.addEventListener('pointerdown',outside);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',esc)}},[]);
  const go=()=>setOpen(false);
  return <div className="app-menu" ref={ref}>
    <button className="hamburger-button" type="button" aria-label="Open menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span/><span/><span/></button>
    {open&&<div className="menu-popover">
      <div className="menu-heading"><strong>My Budget</strong><small>Navigation & settings</small></div>
      <nav className="menu-links" aria-label="App menu">
        <a href="#dashboard" onClick={go}>Dashboard</a>
        <a href="#category-totals" onClick={go}>Categories</a>
        <a href="#budget-details" onClick={go}>Budget details</a>
      </nav>
      <div className="menu-divider"/>
      <CloudSync />
      <div className="menu-note">Backup and data tools remain available at the bottom of Budget details.</div>
    </div>}
  </div>;
}
