'use client';
import {usePathname} from 'next/navigation';
import BudgetApp from './BudgetApp';
export default function AppContent({children}){const pathname=usePathname();if(pathname==='/')return <BudgetApp/>;return <div className="standalone-page">{children}</div>}
