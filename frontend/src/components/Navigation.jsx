import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, Activity } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function Navigation() {
  const location = useLocation();

  const links = [
    { name: 'Command Center', path: '/', icon: LayoutDashboard },
    { name: 'Field Operative', path: '/field', icon: Users },
    { name: 'Volunteer Unit', path: '/volunteer', icon: User },
  ];

  return (
    <nav className="bg-[#0B1120] border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex w-full items-center justify-between">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Activity className="text-blue-500 w-6 h-6 animate-pulse" />
              <span className="font-black text-xl tracking-wider text-white">SRAS<span className="text-blue-500">.AI</span></span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="relative inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    <Icon className={clsx("mr-2 h-4 w-4 z-10", isActive ? 'text-blue-400' : 'text-slate-400')} />
                    <span className={clsx("z-10", isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200')}>
                      {link.name}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden flex overflow-x-auto p-3 space-x-4 border-t border-slate-800 bg-[#0B1120]">
         {links.map(link => (
             <Link key={link.path} to={link.path} className={clsx(
               "whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium border",
               location.pathname === link.path ? "bg-slate-800 border-blue-500/50 text-white" : "border-slate-800 text-slate-400"
             )}>
                {link.name}
             </Link>
         ))}
      </div>
    </nav>
  );
}
