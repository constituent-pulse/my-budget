import './globals.css';
import './app-overrides.css';
import './mockup.css';
import AppContent from './AppContent';
export const metadata={title:'My Budget',description:'Paycheck to paycheck budget tracker'};
export default function RootLayout({children}){return <html lang="en"><body><AppContent>{children}</AppContent></body></html>}
