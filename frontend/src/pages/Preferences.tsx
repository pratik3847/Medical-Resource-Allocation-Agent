import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { Preferences as PreferencesType } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

export default function Preferences() {
  const [preferences, setPreferences] = useState<PreferencesType>({
    distance_weight: 0.33,
    coverage_weight: 0.33,
    fairness_weight: 0.34,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<PreferencesType>('/preferences/');
      setPreferences(data);
    } catch (error: unknown) {
      toast({
        title: 'Error loading preferences',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await apiClient.post<PreferencesType>('/preferences/update', preferences);
      setPreferences(data);
      
      toast({
        title: 'Preferences Updated',
        description: 'Allocation weights have been saved',
      });
    } catch (error: unknown) {
      toast({
        title: 'Error saving preferences',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const total = preferences.distance_weight + preferences.coverage_weight + preferences.fairness_weight;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Allocation Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Adjust weights to control how resources are allocated
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preference Weights</CardTitle>
          <CardDescription>
            Configure the importance of each factor in allocation decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Distance Weight</Label>
                <span className="text-sm font-medium">{preferences.distance_weight.toFixed(2)}</span>
              </div>
              <Slider
                value={[preferences.distance_weight]}
                onValueChange={(value) => setPreferences({ ...preferences, distance_weight: value[0] })}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Prioritize transfers that minimize travel distance
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Coverage Weight</Label>
                <span className="text-sm font-medium">{preferences.coverage_weight.toFixed(2)}</span>
              </div>
              <Slider
                value={[preferences.coverage_weight]}
                onValueChange={(value) => setPreferences({ ...preferences, coverage_weight: value[0] })}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Maximize the number of facilities that receive resources
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Fairness Weight</Label>
                <span className="text-sm font-medium">{preferences.fairness_weight.toFixed(2)}</span>
              </div>
              <Slider
                value={[preferences.fairness_weight]}
                onValueChange={(value) => setPreferences({ ...preferences, fairness_weight: value[0] })}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Ensure equitable distribution across all facilities
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Total Weight</p>
              <p className="text-sm text-muted-foreground">Sum of all weights (doesn't need to equal 1.0)</p>
            </div>
            <span className="text-2xl font-bold">{total.toFixed(2)}</span>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Weights Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium mb-1">Distance Weight</h4>
            <p className="text-sm text-muted-foreground">
              Higher values favor shorter transfer distances, reducing transportation costs and time.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Coverage Weight</h4>
            <p className="text-sm text-muted-foreground">
              Higher values attempt to fulfill demands at more facilities, even if partially.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Fairness Weight</h4>
            <p className="text-sm text-muted-foreground">
              Higher values promote balanced distribution, preventing some facilities from being overlooked.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
