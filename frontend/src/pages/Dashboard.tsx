import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { InventorySnapshot, Preferences, ApiEnvelope } from '@/types/api';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Sliders, 
  TrendingUp, 
  Activity,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const [inventoryCount, setInventoryCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [inventoryData, preferencesData] = await Promise.all([
        apiClient.get<InventorySnapshot>('/inventory/'),
        apiClient.get<Preferences>('/preferences/')
      ]);

      setInventoryCount(inventoryData.records.length);
      setPreferences(preferencesData);
    } catch (error: unknown) {
      toast({
        title: 'Error loading dashboard',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { name: 'Analyze Symptoms', href: '/analyze', description: 'Get resource recommendations', icon: Activity },
    { name: 'Manage Inventory', href: '/inventory', description: 'View and update stock levels', icon: Package },
    { name: 'Plan Reallocation', href: '/planner', description: 'Optimize resource distribution', icon: TrendingUp },
    { name: 'Configure Preferences', href: '/preferences', description: 'Adjust allocation weights', icon: Sliders },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted" />
              <CardContent className="h-24 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Medical Resource Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage healthcare resource allocation across facilities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Inventory Records"
          value={inventoryCount}
          icon={Package}
          description="Total resource entries"
        />
        <MetricCard
          title="Distance Weight"
          value={preferences?.distance_weight.toFixed(2) || '0.00'}
          icon={Sliders}
          description="Current allocation preference"
        />
        <MetricCard
          title="Coverage Weight"
          value={preferences?.coverage_weight.toFixed(2) || '0.00'}
          icon={Sliders}
          description="Current allocation preference"
        />
        <MetricCard
          title="Fairness Weight"
          value={preferences?.fairness_weight.toFixed(2) || '0.00'}
          icon={Sliders}
          description="Current allocation preference"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Card key={link.href} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <link.icon className="h-5 w-5 text-primary" />
                    {link.name}
                  </CardTitle>
                  <CardDescription className="mt-1">{link.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link to={link.href}>
                <Button variant="outline" className="w-full">
                  Go to {link.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Quick guide to using the Medical Resource Allocation System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              1
            </div>
            <div>
              <p className="font-medium">Analyze Symptoms</p>
              <p className="text-sm text-muted-foreground">
                Input patient symptoms to get disease predictions and resource recommendations
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              2
            </div>
            <div>
              <p className="font-medium">Check Inventory</p>
              <p className="text-sm text-muted-foreground">
                Monitor current stock levels across all facilities
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              3
            </div>
            <div>
              <p className="font-medium">Plan Reallocation</p>
              <p className="text-sm text-muted-foreground">
                Create optimal transfer plans based on current demands
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
