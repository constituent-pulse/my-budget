'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_BILLS = [
  { id: 'insurance', name: 'Insurance', dueDate: '2026-09-18', repeat: 'monthly', amount: 160, paid: 0 },
  { id: 'support', name: 'Child Support', dueDate: '2026-09-18', repeat: 'monthly', amount: 354, paid: 0 },
  { id: 'internet', name: 'Internet', dueDate: '2026-09-20', repeat: 'monthly', amount: 60, paid: 0 },
  { id: 'phone', name: 'Phone', dueDate: '2026-09-22', repeat: 'monthly', amount: 80, paid: 0 },
  { id: 'zip', name: 'ZIP', dueDate: '2026-09-23', repeat: 'monthly', amount: 200.64, paid: 0 },
  { id: 'bronco', name: 'Bronco Sport', dueDate: '2026-09-24', repeat: 'monthly', amount: 1000, paid: 0 },
  { id: 'gas', name: 'Gas / Auto', dueDate: '2026-09-17', repeat: 'weekly', amount: 120, paid: 0 },
  { id: 'village', name: 'Village', dueDate: '2026-09-28', repeat: 'monthly', amount: 150, paid: 0 },
  { id: 'grocery', name: 'Grocery / Household', dueDate: '2026-09-30', repeat: 'monthly', amount: 300, paid: 0 },
  { id: 'tax', name: 'Tax Burden', dueDate: '2026-09-30', repeat: 'monthly', amount: 340, paid: 0 },
  { id: 'rent', name: 'Rent', dueDate: '2026-10-01', repeat: 'monthly', amount: 500, paid: 0 },
];

const STORAGE_KEY = 'my-budget-v2';

function addDays(dateString, days) {
  const d = new Date(`${dateString}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

export default function Home() {
  const [payday, setPayday] = useState('2026-09-17');
  const [paycheck, setPaycheck] = useState(2608);
  const [bank, setBank] = useState(404.75);
  const [advances, setAdvances] = useState(1412);
  const [bills, setBills] = useState(DEFAULT_BILLS);
  const [newBill, setNewBill] = useState({ name: '', amount: '', dueDate: '', repeat: 'monthly' });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.payday) setPayday(parsed.payday);
        if (parsed.paycheck !== undefined) setPaycheck(parsed.paycheck);
        if (parsed.bank !== undefined) setBank(parsed.bank);
        if (parsed.advances !== undefined) setAdvances(parsed.advances);
        if (Array.isArray(parsed.bills)) setBills(parsed.bills);
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ payday, paycheck, bank, advances, bills }));
  }, [hydrated, payday, paycheck, bank, advances, bills]);

  const paydays = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(payday, i * 14)), [payday]);

  const outstanding = useMemo(
    () => bills.reduce((sum, bill) => sum + Math.max(0, Number(bill.amount || 0) - Number(bill.paid || 0)), 0),
    [bills]
  );

  const paidTotal = useMemo(() => bills.reduce((sum, bill) => sum + Number(bill.paid || 0), 0), [bills]);
  const available = Number(bank || 0) + Number(paycheck || 0) - Number(advances || 0);
  const safeToSpend = available - outstanding;

  function patchBill(id, patch) {
    setBills((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeBill(id) {
    setBills((items) => items.filter((item) => item.id !== id));
  }

  function addBill(e) {
    e.preventDefault();
    if (!newBill.name.trim() || !newBill.amount || !newBill.dueDate) return;
    setBills((items) => [
      ...items,
      {
        id: `${Date.now()}`,
        name: newBill.name.trim(),
        amount: Number(newBill.amount),
        dueDate: newBill.dueDate,
        repeat: newBill.repeat,
        paid: 0,
      },
    ]);
    setNewBill({ name: '', amount: '', dueDate: '', repeat: 'monthly' });
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Paycheck-driven planner</p>
          <h1>My Budget</h1>
          <p className="sub">Track what comes in, what is already spoken for, and what is genuinely safe to spend.</p>
        </div>
        <div className={`safe ${safeToSpend < 0 ? 'negative' : ''}`}>
          <span>Safe to spend</span>
          <strong>{money(safeToSpend)}</strong>
        </div>
      </header>

      <section className="summary-grid">
        <label className="card">Next payday<input type="date" value={payday} onChange={(e) => setPayday(e.target.value)} /></label>
        <label className="card">Paycheck amount<input type="number" step="0.01" value={paycheck} onChange={(e) => setPaycheck(e.target.value)} /></label>
        <label className="card">Current bank balance<input type="number" step="0.01" value={bank} onChange={(e) => setBank(e.target.value)} /></label>
        <label className="card">Pay advances owed<input type="number" step="0.01" value={advances} onChange={(e) => setAdvances(e.target.value)} /></label>
      </section>

      <section className="stats">
        <article><span>Available after advances</span><strong>{money(available)}</strong></article>
        <article><span>Outstanding bills</span><strong>{money(outstanding)}</strong></article>
        <article><span>Payments recorded</span><strong>{money(paidTotal)}</strong></article>
      </section>

      <section className="panel">
        <div className="section-head">
          <div><p className="eyebrow">Automatic</p><h2>Upcoming paydays</h2></div>
          <p>Biweekly from your selected starting payday.</p>
        </div>
        <div className="payday-row">
          {paydays.map((date, index) => <div className="payday-chip" key={date}><span>Pay {index + 1}</span><strong>{date}</strong><small>{money(paycheck)}</small></div>)}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div><p className="eyebrow">Editable</p><h2>Bills & expenses</h2></div>
          <p>Enter partial or full payments as you make them.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Bill</th><th>Due</th><th>Repeats</th><th>Amount</th><th>Paid</th><th>Remaining</th><th></th></tr></thead>
            <tbody>
              {bills.map((bill) => {
                const remaining = Math.max(0, Number(bill.amount || 0) - Number(bill.paid || 0));
                return <tr key={bill.id}>
                  <td><input className="text-input" value={bill.name} onChange={(e) => patchBill(bill.id, { name: e.target.value })} /></td>
                  <td><input type="date" value={bill.dueDate} onChange={(e) => patchBill(bill.id, { dueDate: e.target.value })} /></td>
                  <td><select value={bill.repeat} onChange={(e) => patchBill(bill.id, { repeat: e.target.value })}><option value="monthly">monthly</option><option value="biweekly">biweekly</option><option value="weekly">weekly</option><option value="one-time">one-time</option></select></td>
                  <td><input className="money-input" type="number" step="0.01" value={bill.amount} onChange={(e) => patchBill(bill.id, { amount: e.target.value })} /></td>
                  <td><input className="money-input" type="number" min="0" step="0.01" value={bill.paid} onChange={(e) => patchBill(bill.id, { paid: e.target.value })} /></td>
                  <td className={remaining === 0 ? 'done' : ''}>{money(remaining)}</td>
                  <td><button className="icon-button" onClick={() => removeBill(bill.id)} aria-label={`Remove ${bill.name}`}>×</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <form className="panel add-form" onSubmit={addBill}>
        <div className="section-head"><div><p className="eyebrow">Flexible</p><h2>Add a bill or expense</h2></div></div>
        <div className="form-grid">
          <input placeholder="Bill name" value={newBill.name} onChange={(e) => setNewBill({ ...newBill, name: e.target.value })} />
          <input type="number" step="0.01" placeholder="Amount" value={newBill.amount} onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })} />
          <input type="date" value={newBill.dueDate} onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })} />
          <select value={newBill.repeat} onChange={(e) => setNewBill({ ...newBill, repeat: e.target.value })}><option value="monthly">monthly</option><option value="biweekly">biweekly</option><option value="weekly">weekly</option><option value="one-time">one-time</option></select>
          <button type="submit">Add expense</button>
        </div>
      </form>

      <footer>Changes save automatically in this browser.</footer>
    </main>
  );
}
