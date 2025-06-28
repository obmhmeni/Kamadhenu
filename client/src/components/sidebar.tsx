import { Link, useLocation } from "wouter";
import { cn, getInitials } from "@/lib/utils";
import { hasRole, type AuthUser } from "@/lib/auth";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  List, 
  Settings, 
  User,
  Dog
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: [] },
  { name: 'Products', href: '/products', icon: Package, roles: ['admin', 'district_head', 'worker'] },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: [] },
  { name: 'Payment SMS', href: '/payments', icon: CreditCard, roles: [] },
  { name: 'User Management', href: '/users', icon: Users, roles: ['admin'] },
  { name: 'Transactions', href: '/transactions', icon: List, roles: ['admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
  { name: 'My Profile', href: '/profile', icon: User, roles: [] },
];

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const [location] = useLocation();

  const filteredNavigation = navigation.filter(item => 
    item.roles.length === 0 || item.roles.some(role => hasRole(user, role))
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out fixed lg:relative z-30 h-full",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Dog className="text-primary-foreground w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-foreground">KaamDhenu</h1>
              <p className="text-sm text-muted-foreground">Management System</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-secondary-foreground text-sm font-medium">
                  {getInitials(user.name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.roles.join(', ')}
                </p>
                {user.district && (
                  <p className="text-xs text-muted-foreground truncate">{user.district}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location === item.href || 
                (item.href !== '/dashboard' && location.startsWith(item.href));
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
