import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { ResourceSearchRequest, ApiEnvelope } from '@/types/api';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Resources() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  type OpenFdaResult = {
    openfda?: {
      brand_name?: string[];
      generic_name?: string[];
      manufacturer_name?: string[];
    };
    purpose?: string[];
    indications_and_usage?: string[];
  };
  const [results, setResults] = useState<OpenFdaResult[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a search query',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const request: ResourceSearchRequest = { query, limit: 10 };
  const response = await apiClient.post<ApiEnvelope<unknown>>('/resources/search', request);
  const data = response.data as { results?: OpenFdaResult[] };
  setResults(data.results || []);
      
      toast({
        title: 'Search Complete',
        description: `Found ${results.length} resources`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error searching resources',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resource Search</h1>
        <p className="text-muted-foreground mt-2">
          Search medical resources and drugs from OpenFDA
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Query</CardTitle>
          <CardDescription>Enter resource name or drug information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Resource Name</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., oxygen, insulin, ventilator"
            />
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search Resources
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>{results.length} resources found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((resource, idx) => (
                <div key={idx} className="border-b pb-4 last:border-0">
                  <h3 className="font-medium mb-2">
                    {resource.openfda?.brand_name?.[0] || resource.openfda?.generic_name?.[0] || 'Unknown'}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {resource.openfda?.manufacturer_name?.[0] && (
                      <p>Manufacturer: {resource.openfda.manufacturer_name[0]}</p>
                    )}
                    {resource.purpose?.[0] && (
                      <p>Purpose: {resource.purpose[0].substring(0, 200)}...</p>
                    )}
                    {resource.indications_and_usage?.[0] && (
                      <p>Indications: {resource.indications_and_usage[0].substring(0, 200)}...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
