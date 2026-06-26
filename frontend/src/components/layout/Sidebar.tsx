import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Truck, Users, ShoppingCart,
  CreditCard, ShoppingBag, UserCog, DollarSign, FileText, Settings, UserPlus, X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store';
import type { Role } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/products', label: 'Products', icon: <Package size={20} />, roles: ['ADMIN', 'MANAGER'] },
      { to: '/categories', label: 'Categories', icon: <Tags size={20} />, roles: ['ADMIN', 'MANAGER'] },
      { to: '/suppliers', label: 'Suppliers', icon: <Truck size={20} />, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'Sales',
    items: [
      { to: '/customers', label: 'Customers', icon: <Users size={20} />, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
      { to: '/sales', label: 'Sales', icon: <ShoppingCart size={20} />, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
      { to: '/payments', label: 'Payments', icon: <CreditCard size={20} />, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    ],
  },
  {
    title: 'Procurement',
    items: [
      { to: '/purchases', label: 'Purchases', icon: <ShoppingBag size={20} />, roles: ['ADMIN', 'MANAGER'] },
      { to: '/reports', label: 'Reports', icon: <FileText size={20} />, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'HR',
    items: [
      { to: '/employees', label: 'Employees', icon: <UserCog size={20} />, roles: ['ADMIN'] },
      { to: '/salary-payments', label: 'Payroll', icon: <DollarSign size={20} />, roles: ['ADMIN'] },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/users', label: 'Users', icon: <UserPlus size={20} />, roles: ['ADMIN'] },
      { to: '/settings', label: 'Settings', icon: <Settings size={20} />, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => user && item.roles.includes(user.role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-dark text-ui-bg shadow-xl transition-transform duration-300',
          'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between border-b border-brand-deep px-5 py-6">
          <div>
            <h1 className="text-xl font-bold text-brand-primary">Alraxma</h1>
            <p className="text-xs text-ui-card/70">Supermarket System</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-brand-deep lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-5">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-ui-card/50">
                {section.title}
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'text-ui-card hover:bg-brand-deep hover:text-white'
                      )
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {user && (
          <div className="border-t border-brand-deep px-5 py-5">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="text-xs capitalize text-ui-card/60">{user.role.toLowerCase()}</p>
          </div>
        )}
      </aside>
    </>
  );
}
