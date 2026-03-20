import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, Menu } from 'lucide-react';
import clsx from 'clsx';

export default function Navigation() {
  const location = useLocation();

  const links = [
    { name: 'Admin Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Field Worker', path: '/field', icon: Users },
    { name: 'Volunteer Area', path: '/volunteer', icon: User },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-blue-600">SRAS Platform</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={clsx(
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu (simplified for MVP) */}
      <div className="sm:hidden flex overflow-x-auto p-2 space-x-4 border-t border-gray-100 bg-gray-50">
         {links.map(link => (
             <Link key={link.path} to={link.path} className="whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-white shadow-sm">
                {link.name}
             </Link>
         ))}
      </div>
    </nav>
  );
}
