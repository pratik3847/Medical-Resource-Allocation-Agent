import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { ReallocationDemand, ReallocationResponse, InventorySnapshot, ApiEnvelope } from '@/types/api';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function Planner() {
  const [demands, setDemands] = useState<ReallocationDemand[]>([{ hospital_id: '', resource_name: '', required_quantity: 0 }]);
  const [result, setResult] = useState<ReallocationResponse | null>(null);
  const [inventory, setInventory] = useState<InventorySnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await apiClient.get<InventorySnapshot>('/inventory/');
      setInventory(data);
    } catch (error: unknown) {
      toast({
        title: 'Error loading inventory',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const hospitalOptions = Array.from(
    new Set(inventory?.records.map(r => r.hospital_id) || [])
  );

  const resourceOptions = Array.from(
    new Set(inventory?.records.map(r => r.resource_name) || [])
  );

  const addDemand = () => {
    setDemands([...demands, { hospital_id: '', resource_name: '', required_quantity: 0 }]);
  };

  const removeDemand = (index: number) => {
    setDemands(demands.filter((_, i) => i !== index));
  };

  const updateDemand = (index: number, field: keyof ReallocationDemand, value: string | number) => {
    const updated = [...demands];
    updated[index] = { ...updated[index], [field]: value };
    setDemands(updated);
  };

  const handlePlan = async () => {
    const validDemands = demands.filter(d => d.hospital_id && d.resource_name && d.required_quantity > 0);
    
    if (validDemands.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one valid demand',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post<ReallocationResponse>('/inventory/reallocate', { demands: validDemands });
      setResult(response);
      
      toast({
        title: 'Plan Generated',
        description: `Created ${response.plan.length} transfers`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error generating plan',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reallocation Planner</h1>
        <p className="text-muted-foreground mt-2">
          Create optimal resource transfer plans based on facility demands
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Define Demands</CardTitle>
          <CardDescription>Specify which facilities need resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {demands.map((demand, index) => (
            <div key={index} className="flex gap-4 items-end border-b pb-4 last:border-0">
              <div className="flex-1 space-y-2">
                <Label>Hospital</Label>
                <Select
                  value={demand.hospital_id}
                  onValueChange={(value) => updateDemand(index, 'hospital_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitalOptions.map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Resource</Label>
                <Select
                  value={demand.resource_name}
                  onValueChange={(value) => updateDemand(index, 'resource_name', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32 space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={demand.required_quantity}
                  onChange={(e) => updateDemand(index, 'required_quantity', parseInt(e.target.value) || 0)}
                />
              </div>

              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeDemand(index)}
                disabled={demands.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Button onClick={addDemand} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Demand
            </Button>
            <Button onClick={handlePlan} disabled={loading} className="ml-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Plan</CardTitle>
              <CardDescription>{result.plan.length} transfers planned</CardDescription>
            </CardHeader>
            <CardContent>
              {result.plan.length > 0 ? (
                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">From</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">To</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Resource</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Distance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.plan.map((transfer, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{transfer.from_hospital_id}</td>
                          <td className="px-4 py-3 text-sm">{transfer.to_hospital_id}</td>
                          <td className="px-4 py-3 text-sm">{transfer.resource_name}</td>
                          <td className="px-4 py-3 text-sm text-right">{transfer.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">{transfer.distance_km.toFixed(1)} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No transfers needed</p>
              )}
            </CardContent>
          </Card>

          {result.unmet.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Unmet Demands</CardTitle>
                <CardDescription>{result.unmet.length} demands could not be fulfilled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.unmet.map((demand, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{demand.hospital_id}</p>
                        <p className="text-sm text-muted-foreground">{demand.resource_name}</p>
                      </div>
                      <p className="text-sm font-medium text-destructive">
                        {demand.required_quantity} units needed
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
