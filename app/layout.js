import './globals.css';
import BackupControls from './BackupControls';
import WeeklyReconciliation from './WeeklyReconciliation';
import CategoryTotals from './CategoryTotals';
import PaycheckDashboard from './PaycheckDashboard';
import AppMenu from './AppMenu';

export const metadata = {
  title: 'My Budget',
  description: 'Paycheck-driven budget and bill tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="app-nav" aria-label="Budget navigation">
          <div className="app-nav-inner app-nav-streamlined">
            <AppMenu />
            <a className="nav-brand nav-brand-centered" href="#dashboard">My Budget</a>
            <div className="nav-spacer" aria-hidden="true" />
          </div>
        </nav>
        <div className="dashboard-shell">
          <PaycheckDashboard />
          <div id="category-totals"><div id="category-totals-slot" /></div>
        </div>
        <div id="budget-details" className="details-wrap">{children}</div>
        <WeeklyReconciliation />
        <BackupControls />
      </body>
    </html>
  );
}
