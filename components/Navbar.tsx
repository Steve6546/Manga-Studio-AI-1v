
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_TITLE } from '../constants';

const Navbar: React.FC = () => {
  const location = useLocation();

  const linkStyles = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkStyles = "bg-sky-600 text-white";
  const inactiveLinkStyles = "text-gray-300 hover:bg-gray-700 hover:text-white";

  const getLinkClass = (path: string) => {
    return `${linkStyles} ${location.pathname === path || (path === '/dashboard' && location.pathname === '/') ? activeLinkStyles : inactiveLinkStyles}`;
  };

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-white hover:text-sky-400 transition-colors">
              {APP_TITLE}
            </Link>
          </div>
          <div className="hidden sm:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                🏠 الرئيسية
              </Link>
              <Link to="/setup" className={getLinkClass('/setup')}>
                ➕ قصة جديدة
              </Link>
            </div>
          </div>
          <div className="sm:hidden"> {/* Mobile menu button placeholder if needed */}
            {/* Example: <button>Menu</button> */}
          </div>
        </div>
      </div>
       {/* Mobile menu, show/hide based on menu state if implemented */}
       <div className="sm:hidden bg-gray-800 p-2 space-y-1">
          <Link to="/dashboard" className={`${getLinkClass('/dashboard')} block`}>
            🏠 الرئيسية
          </Link>
          <Link to="/setup" className={`${getLinkClass('/setup')} block`}>
            ➕ قصة جديدة
          </Link>
        </div>
    </nav>
  );
};

export default Navbar;