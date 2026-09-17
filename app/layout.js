import './globals.css';
import './app-overrides.css';
import './mobile-weeks.css';
import AppMenu from './AppMenu';
import AppContent from './AppContent';

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
            <a className="nav-brand nav-brand-centered" href="/">My Budget</a>
            <div className="nav-spacer" aria-hidden="true" />
          </div>
        </nav>
        <AppContent>{children}</AppContent>
      </body>
    </html>
  );
}
