'use client';

import { useRef, useState } from 'react';

const KEY = 'my-budget-v5';

export default function BackupControls() {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('');

  function exportBackup() {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      setStatus('No saved budget data was found in this browser.');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const backup = JSON.stringify({ app: 'my-budget', storageKey: KEY, exportedAt: new Date().toISOString(), data: parsed }, null, 2);
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-budget-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('Backup exported successfully. Keep that file somewhere safe.');
    } catch {
      setStatus('The saved budget could not be exported.');
    }
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const data = parsed?.app === 'my-budget' && parsed?.data ? parsed.data : parsed;
        if (!data || typeof data !== 'object' || !Array.isArray(data.bills)) throw new Error('Invalid backup');
        if (!window.confirm('Restore this backup? Your current budget data in this browser will be replaced.')) return;
        localStorage.setItem(KEY, JSON.stringify(data));
        window.location.reload();
      } catch {
        setStatus('That file does not look like a valid My Budget backup. Nothing was changed.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  return (
    <aside style={{position:'fixed',right:16,bottom:16,zIndex:1000,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end',maxWidth:'calc(100vw - 32px)'}}>
      {status && <span style={{background:'white',padding:'8px 10px',borderRadius:8,boxShadow:'0 2px 12px rgba(0,0,0,.12)',fontSize:12}}>{status}</span>}
      <button type="button" className="small-button" onClick={exportBackup}>Export Backup</button>
      <button type="button" className="small-button" onClick={() => inputRef.current?.click()}>Import Backup</button>
      <input ref={inputRef} type="file" accept="application/json,.json" onChange={importBackup} style={{display:'none'}} />
    </aside>
  );
}
