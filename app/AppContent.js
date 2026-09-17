'use client';

import { usePathname } from 'next/navigation';
import BackupControls from './BackupControls';
import WeeklyReconciliation from './WeeklyReconciliation';
import CategoryTotals from './CategoryTotals';
import PaycheckDashboard from './PaycheckDashboard';
import WeekViewController from './WeekViewController';

export default function AppContent({children}){
 const pathname=usePathname();
 const main=pathname==='/';
 if(!main)return <div className="standalone-page">{children}</div>;
 return <>
   <div className="dashboard-shell">
     <PaycheckDashboard />
     <div id="category-totals"><div id="category-totals-slot" /></div>
   </div>
   <WeekViewController />
   <div id="budget-details" className="details-wrap">{children}</div>
   <WeeklyReconciliation />
   <BackupControls />
 </>;
}
