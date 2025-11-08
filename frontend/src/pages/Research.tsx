import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { ResearchRequest, ApiEnvelope } from '@/types/api';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink } from 'lucide-react';

export default function Research() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  type EuropePmcPaper = {
    title?: string;
    pubYear?: string;
    journalTitle?: string;
    pmid?: string;
    pmcid?: string;
  };
  const [results, setResults] = useState<EuropePmcPaper[]>([]);
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
      const request: ResearchRequest = { query, limit: 10 };
  const response = await apiClient.post<ApiEnvelope<unknown>>('/research/papers', request);
  const data = response.data as { resultList?: { result?: EuropePmcPaper[] } };
  setResults(data.resultList?.result || []);
      
      toast({
        title: 'Search Complete',
        description: `Found ${results.length} papers`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error searching papers',
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
        <h1 className="text-3xl font-bold tracking-tight">Research Papers</h1>
        <p className="text-muted-foreground mt-2">
          Search medical literature from EuropePMC
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Query</CardTitle>
          <CardDescription>Enter keywords to find relevant medical papers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Search Terms</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., COVID-19 treatment, diabetes management"
            />
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search Papers
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>{results.length} papers found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((paper, idx) => (
                <div key={idx} className="border-b pb-4 last:border-0">
                  <h3 className="font-medium mb-2">{paper.title}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                    {paper.pubYear && <span>{paper.pubYear}</span>}
                    {paper.journalTitle && <span>• {paper.journalTitle}</span>}
                  </div>
                  <div className="flex gap-2 text-xs">
                    {paper.pmid && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline flex items-center gap-1"
                      >
                        PMID: {paper.pmid}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {paper.pmcid && (
                      <a
                        href={`https://europepmc.org/article/PMC/${paper.pmcid.replace('PMC', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline flex items-center gap-1"
                      >
                        {paper.pmcid}
                        <ExternalLink className="h-3 w-3" />
                      </a>
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
