import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { InventorySnapshot, InventoryRecord, InventoryUpdateItem } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuantities, setEditingQuantities] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [searchTerm, inventory]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<InventorySnapshot>('/inventory/');
      setInventory(data.records);
      setFilteredInventory(data.records);
    } catch (error: unknown) {
      toast({
        title: 'Error loading inventory',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    if (!searchTerm) {
      setFilteredInventory(inventory);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = inventory.filter(
      (item) =>
        item.hospital_name.toLowerCase().includes(term) ||
        item.hospital_id.toLowerCase().includes(term) ||
        item.resource_name.toLowerCase().includes(term)
    );
    setFilteredInventory(filtered);
  };

  const handleQuantityChange = (key: string, value: number) => {
    setEditingQuantities({ ...editingQuantities, [key]: value });
  };

  const handleUpdate = async (item: InventoryRecord) => {
    const key = `${item.hospital_id}-${item.resource_name}`;
    const newQuantity = editingQuantities[key];

    if (newQuantity === undefined || newQuantity === item.quantity) {
      return;
    }

    try {
      const updates: InventoryUpdateItem[] = [{
        hospital_id: item.hospital_id,
        resource_name: item.resource_name,
        quantity: newQuantity,
        mode: 'set'
      }];

      const data = await apiClient.post<InventorySnapshot>('/inventory/update', updates);
      setInventory(data.records);
      
      const newEditing = { ...editingQuantities };
      delete newEditing[key];
      setEditingQuantities(newEditing);

      toast({
        title: 'Inventory Updated',
        description: `${item.resource_name} quantity updated for ${item.hospital_name}`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error updating inventory',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">
          View and update resource stock levels across all facilities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Inventory</CardTitle>
          <CardDescription>
            {inventory.length} total records
          </CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by hospital or resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Hospital</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Resource</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Reserve Min</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInventory.map((item, idx) => {
                    const key = `${item.hospital_id}-${item.resource_name}`;
                    const editingQuantity = editingQuantities[key];
                    const isEdited = editingQuantity !== undefined && editingQuantity !== item.quantity;

                    return (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{item.hospital_name}</p>
                            <p className="text-xs text-muted-foreground">{item.hospital_id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.resource_name}</td>
                        <td className="px-4 py-3 text-right">
                          <Input
                            type="number"
                            value={editingQuantity !== undefined ? editingQuantity : item.quantity}
                            onChange={(e) => handleQuantityChange(key, parseInt(e.target.value) || 0)}
                            className="w-24 text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{item.reserve_min}</td>
                        <td className="px-4 py-3 text-sm">{item.unit}</td>
                        <td className="px-4 py-3">
                          {isEdited && (
                            <Button size="sm" onClick={() => handleUpdate(item)}>
                              Save
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
