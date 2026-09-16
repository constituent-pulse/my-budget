import './globals.css';
import BackupControls from './BackupControls';
import WeeklyReconciliation from './WeeklyReconciliation';

export const metadata = {
  title: 'My Budget',
  description: 'Paycheck-driven budget and bill tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <WeeklyReconciliation />
        <BackupControls />
      </body>
    </html>
  );
}
