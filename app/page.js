'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_BILLS = [
  { id: 'insurance', name: 'Insurance', dueDate: '2026-09-18', repeat: 'monthly', amount: 160 },
  { id: 'support', name: 'Child Support', dueDate: '2026-09-18', repeat: 'monthly', amount: 354 },
  { id: 'internet', name: 'Internet', dueDate: '2026-09-20', repeat: 'monthly', amount: 60 },
  { id: 'phone', name: 'Phone', dueDate: '2026-09-22', repeat: 'monthly', amount: 80 },
  { id: 'zip', name: 'ZIP', dueDate: '2026-09-23', repeat: 'monthly', amount: 200.64 },
  { id: 'bronco', name: 'Bronco Sport', dueDate: '2026-09-24', repeat: 'monthly', amount: 1000 },
  { id: 'gas', name: 'Gas / Auto', dueDate: '2026-09-17', repeat: 'weekly', amount: 120 },
  { id: 'village', name: 'Village', dueDate: '2026-09-28', repeat: 'monthly', amount: 150 },
  { id: 'grocery', name: 'Grocery / Household', dueDate: '2026-09-30', repeat: 'monthly', amount: 300 },
  { id: 'tax', name: 'Tax Burden', dueDate: '2026-09-30', repeat: 'monthly', amount: 340 },
  { id: 'rent', name: 'Rent', dueDate: '2026-10-01', repeat: 'monthly', amount: 500 },
];

const STORAGE_KEY = 'my-budget-v3';

function parseDate(s) { return new Date(`${s}T12:00:00`); }
function iso(d) { return d.toISOString().slice(0, 10); }
function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return iso(d); }
function addMonths(s, n) {
  const original = parseDate(s);
  const day = original.getDate();
  const d = new Date(original.getFullYear(), original.getMonth() + n, 1, 12);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12).getDate();
  d.setDate(Math.min(day, last));
  return iso(d);
}
function money(v) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v || 0)); }
function pretty(s) { return parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function occurrencesForBill(bill, start, end) {
  const out = [];
  let date = bill.dueDate;
  let guard = 0;
  while (date < start && guard++ < 500) {
    if (bill.repeat === 'weekly') date = addDays(date, 7);
    else if (bill.repeat === 'biweekly') date = addDays(date, 14);
    else if (bill.repeat === 'monthly') date = addMonths(date, 1);
    else return [];
  }
  guard = 0;
  while (date <= end && guard++ < 500) {
    if (date >= start) out.push({ ...bill, occurrenceDate: date, key: `${bill.id}:${date}` });
    if (bill.repeat === 'weekly') date = addDays(date, 7);
    else if (bill.repeat === 'biweekly') date = addDays(date, 14);
    else if (bill.repeat === 'monthly') date = addMonths(date, 1);
    else break;
  }
  return out;
}

export default function Home() {
  const [payday, setPayday] = useState('2026-09-17');
  const [paycheck, setPaycheck] = useState(2608);
  const [bank, setBank] = useState(404.75);
  const [advances, setAdvances] = useState(1412);
  const [bills, setBills] = useState(DEFAULT_BILLS);
  const [payments, setPayments] = useState({});
  const [newBill, setNewBill] = useState({ name: '', amount: '', dueDate: '', repeat: 'monthly' });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('my-budget-v2');
    if (saved) try {
      const p = JSON.parse(saved);
      if (p.payday) setPayday(p.payday);
      if (p.paycheck !== undefined) setPaycheck(p.paycheck);
      if (p.bank !== undefined) setBank(p.bank);
      if (p.advances !== undefined) setAdvances(p.advances);
      if (Array.isArray(p.bills)) setBills(p.bills.map(({ paid, ...b }) => b));
      if (p.payments) setPayments(p.payments);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify({ payday, paycheck, bank, advances, bills, payments }));
  }, [hydrated, payday, paycheck, bank, advances, bills, payments]);

  const periods = useMemo(() => {
    const paydays = Array.from({ length: 7 }, (_, i) => addDays(payday, i * 14));
    const end = addDays(paydays[6], -1);
    const all = bills.flatMap((b) => occurrencesForBill(b, payday, end));
    return paydays.slice(0, 6).map((date, i) => {
      const periodEnd = addDays(paydays[i + 1], -1);
      const items = all.filter((o) => o.occurrenceDate >= date && o.occurrenceDate <= periodEnd).sort((a,b) => a.occurrenceDate.localeCompare(b.occurrenceDate));
      const planned = items.reduce((s, o) => s + Number(o.amount || 0), 0);
      const paid = items.reduce((s, o) => s + Math.min(Number(o.amount || 0), Number(payments[o.key] || 0)), 0);
      return { date, end: periodEnd, items, planned, paid, remainingBills: planned - paid, leftover: Number(paycheck || 0) - (planned - paid) };
    });
  }, [payday, paycheck, bills, payments]);

  const current = periods[0];
  const currentFunds = Number(bank || 0) + Number(paycheck || 0) - Number(advances || 0);
  const currentSafe = currentFunds - (current?.remainingBills || 0);

  function patchBill(id, patch) { setBills((x) => x.map((b) => b.id === id ? { ...b, ...patch } : b)); }
  function removeBill(id) { setBills((x) => x.filter((b) => b.id !== id)); }
  function setPaid(key, value) { setPayments((p) => ({ ...p, [key]: value })); }
  function addBill(e) {
    e.preventDefault();
    if (!newBill.name.trim() || !newBill.amount || !newBill.dueDate) return;
    setBills((x) => [...x, { id: `${Date.now()}`, name: newBill.name.trim(), amount: Number(newBill.amount), dueDate: newBill.dueDate, repeat: newBill.repeat }]);
    setNewBill({ name: '', amount: '', dueDate: '', repeat: 'monthly' });
  }

  return <main className="shell">
    <header className="hero"><div><p className="eyebrow">Paycheck-driven planner</p><h1>My Budget</h1><p className="sub">Each paycheck automatically picks up the bills due before the next paycheck.</p></div><div className={`safe ${currentSafe < 0 ? 'negative' : ''}`}><span>Current period safe to spend</span><strong>{money(currentSafe)}</strong></div></header>

    <section className="summary-grid">
      <label className="card">Next payday<input type="date" value={payday} onChange={(e) => setPayday(e.target.value)} /></label>
      <label className="card">Paycheck amount<input type="number" step="0.01" value={paycheck} onChange={(e) => setPaycheck(e.target.value)} /></label>
      <label className="card">Current bank balance<input type="number" step="0.01" value={bank} onChange={(e) => setBank(e.target.value)} /></label>
      <label className="card">Pay advances owed<input type="number" step="0.01" value={advances} onChange={(e) => setAdvances(e.target.value)} /></label>
    </section>

    <section className="panel"><div className="section-head"><div><p className="eyebrow">Automatic allocation</p><h2>Pay periods</h2></div><p>Change any due date or recurring amount below and these periods recalculate instantly.</p></div>
      <div style={{display:'grid',gap:'16px'}}>{periods.map((period, index) => <article className="card" key={period.date} style={{display:'block'}}>
        <div className="section-head"><div><p className="eyebrow">Paycheck {index + 1}</p><h2>{pretty(period.date)} → {pretty(period.end)}</h2></div><div style={{textAlign:'right'}}><strong style={{fontSize:'1.35rem'}}>{money(period.leftover)}</strong><p>left after unpaid bills</p></div></div>
        <div className="stats"><article><span>Paycheck</span><strong>{money(paycheck)}</strong></article><article><span>Bills this period</span><strong>{money(period.planned)}</strong></article><article><span>Still to pay</span><strong>{money(period.remainingBills)}</strong></article></div>
        {period.items.length ? <div className="table-wrap"><table><thead><tr><th>Due</th><th>Bill</th><th>Amount</th><th>Paid this occurrence</th><th>Remaining</th></tr></thead><tbody>{period.items.map((o) => { const paid = Math.min(Number(o.amount||0), Number(payments[o.key]||0)); return <tr key={o.key}><td>{pretty(o.occurrenceDate)}</td><td>{o.name}</td><td>{money(o.amount)}</td><td><input className="money-input" type="number" min="0" max={o.amount} step="0.01" value={payments[o.key] || ''} placeholder="0.00" onChange={(e)=>setPaid(o.key,e.target.value)} /></td><td className={paid >= Number(o.amount) ? 'done' : ''}>{money(Number(o.amount)-paid)}</td></tr>})}</tbody></table></div> : <p>No bills due in this pay period.</p>}
      </article>)}</div>
    </section>

    <section className="panel"><div className="section-head"><div><p className="eyebrow">Recurring rules</p><h2>Bills & expenses</h2></div><p>The due date is the first occurrence; weekly, biweekly and monthly items roll forward automatically.</p></div><div className="table-wrap"><table><thead><tr><th>Bill</th><th>First / next due</th><th>Repeats</th><th>Amount</th><th></th></tr></thead><tbody>{bills.map((b)=><tr key={b.id}><td><input className="text-input" value={b.name} onChange={(e)=>patchBill(b.id,{name:e.target.value})}/></td><td><input type="date" value={b.dueDate} onChange={(e)=>patchBill(b.id,{dueDate:e.target.value})}/></td><td><select value={b.repeat} onChange={(e)=>patchBill(b.id,{repeat:e.target.value})}><option value="monthly">monthly</option><option value="biweekly">biweekly</option><option value="weekly">weekly</option><option value="one-time">one-time</option></select></td><td><input className="money-input" type="number" step="0.01" value={b.amount} onChange={(e)=>patchBill(b.id,{amount:e.target.value})}/></td><td><button className="icon-button" onClick={()=>removeBill(b.id)}>×</button></td></tr>)}</tbody></table></div></section>

    <form className="panel add-form" onSubmit={addBill}><div className="section-head"><div><p className="eyebrow">Flexible</p><h2>Add a bill or expense</h2></div></div><div className="form-grid"><input placeholder="Bill name" value={newBill.name} onChange={(e)=>setNewBill({...newBill,name:e.target.value})}/><input type="number" step="0.01" placeholder="Amount" value={newBill.amount} onChange={(e)=>setNewBill({...newBill,amount:e.target.value})}/><input type="date" value={newBill.dueDate} onChange={(e)=>setNewBill({...newBill,dueDate:e.target.value})}/><select value={newBill.repeat} onChange={(e)=>setNewBill({...newBill,repeat:e.target.value})}><option value="monthly">monthly</option><option value="biweekly">biweekly</option><option value="weekly">weekly</option><option value="one-time">one-time</option></select><button type="submit">Add expense</button></div></form>
    <footer>Payments are tracked separately for each occurrence. Changes save automatically in this browser.</footer>
  </main>;
}
