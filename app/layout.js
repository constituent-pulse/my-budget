import './globals.css';

export const metadata = {
  title: 'My Budget',
  description: 'Paycheck-driven budget and bill tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
