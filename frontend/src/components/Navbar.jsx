import { NavLink } from 'react-router-dom';
import { Radar, Upload, Brain, Shield } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Radar },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/memory', label: 'Story Memory', icon: Brain },
  { to: '/review', label: 'Review', icon: Shield },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-verse-black/80 backdrop-blur-xl border-b border-verse-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-verse-red to-verse-red-glow flex items-center justify-center shadow-[0_0_15px_rgba(232,32,63,0.3)] group-hover:shadow-[0_0_25px_rgba(232,32,63,0.5)] transition-shadow">
                <Radar size={16} className="text-white" />
              </div>
            </div>
            <span className="text-verse-text font-bold tracking-tight text-lg">
              Pocket<span className="text-verse-red">Verse</span>
            </span>
          </NavLink>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-verse-red/10 text-verse-red'
                    : 'text-verse-text-muted hover:text-verse-text hover:bg-verse-surface'
                  }
                `}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
