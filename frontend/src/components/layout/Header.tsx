import { Menu, Moon, Sun, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore, useThemeStore } from '../../store';
import { authApi } from '../../api';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-brand-deep border-b border-ui-card/50 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-ui-card">
          <Menu size={22} />
        </button>
        <div>
          <h2 className="font-semibold text-lg">Welcome, {user?.fullName}</h2>
          <p className="text-sm text-brand-deep dark:text-ui-card capitalize">{user?.role?.toLowerCase()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-ui-card relative">
          <Bell size={20} />
        </button>
        <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-ui-card">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-accent-danger/20 text-accent-danger">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
