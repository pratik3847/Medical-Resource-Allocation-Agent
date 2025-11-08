import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Stethoscope, 
  FileText, 
  Package, 
  Warehouse, 
  Route, 
  Settings, 
  Workflow 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analyze', href: '/analyze', icon: Stethoscope },
  { name: 'Research', href: '/research', icon: FileText },
  { name: 'Resources', href: '/resources', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Planner', href: '/planner', icon: Route },
  { name: 'Preferences', href: '/preferences', icon: Settings },
  { name: 'Workflow', href: '/workflow', icon: Workflow },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-64 border-r bg-card shadow-sm">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-primary">Medical Resource</h1>
        </div>
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1">
        <div className="h-16 border-b bg-card px-6 flex items-center shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
          </h2>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
