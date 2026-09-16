import './globals.css';
import BackupControls from './BackupControls';
import WeeklyReconciliation from './WeeklyReconciliation';
import CategoryTotals from './CategoryTotals';
import PaycheckDashboard from './PaycheckDashboard';

export const metadata = {
  title: 'My Budget',
  description: 'Paycheck-driven budget and bill tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="app-nav" aria-label="Budget navigation">
          <div className="app-nav-inner">
            <a className="nav-brand" href="#dashboard">My Budget</a>
            <div className="nav-links">
              <a href="#dashboard">Dashboard</a>
              <a href="#budget-details">Budget details</a>
              <a href="#category-totals">Categories</a>
            </div>
          </div>
        </nav>
        <div className="dashboard-shell"><PaycheckDashboard /></div>
        <div id="budget-details" className="details-wrap">{children}</div>
        <div id="category-totals" className="supplemental-wrap"><CategoryTotals /></div>
        <WeeklyReconciliation />
        <BackupControls />
      </body>
    </html>
  );
}
