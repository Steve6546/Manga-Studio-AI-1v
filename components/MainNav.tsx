import React from 'react';
import { Link, NavLink } from 'react-router-dom';
// FIX: Corrected import path
import { APP_TITLE } from '../constants';
import { LayoutTemplate, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const MainNav: React.FC = () => {
  const linkStyles = "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2";
  const activeLinkStyles = "bg-slate-800 text-violet-400";
  const inactiveLinkStyles = "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link to="/dashboard" className="flex items-center gap-2 text-lg font-bold text-slate-50 hover:text-violet-400 transition-colors">
          <LayoutTemplate className="h-6 w-6 text-violet-500" />
          {APP_TITLE}
        </Link>
        <nav className="flex items-center space-x-2">
          <NavLink 
            to="/dashboard" 
            className={({isActive}) => cn(linkStyles, isActive ? activeLinkStyles : inactiveLinkStyles)}
          >
            <HomeIcon className="h-4 w-4" />
            الرئيسية
          </NavLink>
          <NavLink 
            to="/setup"
            className={({isActive}) => cn(linkStyles, isActive ? activeLinkStyles : inactiveLinkStyles)}
          >
            <PlusCircle className="h-4 w-4" />
            مشروع جديد
          </NavLink>
        </nav>
      </div>
    </header>
  );
};


function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}


export default MainNav;
