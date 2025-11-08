import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { AnalyzeRequest, ApiEnvelope, AnalyzeResponse } from '@/types/api';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, AlertCircle, Package } from 'lucide-react';

export default function Analyze() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [location, setLocation] = useState('');
  const [resources, setResources] = useState<string[]>([]);
  const [resourceInput, setResourceInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const { toast } = useToast();

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter((s) => s !== symptom));
  };

  const addResource = () => {
    if (resourceInput.trim() && !resources.includes(resourceInput.trim())) {
      setResources([...resources, resourceInput.trim()]);
      setResourceInput('');
    }
  };

  const removeResource = (resource: string) => {
    setResources(resources.filter((r) => r !== resource));
  };

  const handleAnalyze = async () => {
    if (symptoms.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one symptom',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const request: AnalyzeRequest = {
        symptoms,
        location: location || undefined,
        required_resources: resources.length > 0 ? resources : undefined,
      };

      const response = await apiClient.post<ApiEnvelope<AnalyzeResponse>>('/analyze/', request);
      setResult(response.data);
      
      toast({
        title: 'Analysis Complete',
        description: `Found ${response.data.probable_diseases.length} probable diseases`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error analyzing symptoms',
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
        <h1 className="text-3xl font-bold tracking-tight">Symptom Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Get disease predictions and resource recommendations based on symptoms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Information</CardTitle>
          <CardDescription>Enter patient symptoms and optional location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms *</Label>
            <div className="flex gap-2">
              <Input
                id="symptoms"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSymptom()}
                placeholder="Enter symptom and press Enter"
              />
              <Button onClick={addSymptom} type="button">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {symptoms.map((symptom) => (
                <Badge key={symptom} variant="secondary" className="cursor-pointer" onClick={() => removeSymptom(symptom)}>
                  {symptom} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., New York, NY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resources">Required Resources (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="resources"
                value={resourceInput}
                onChange={(e) => setResourceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addResource()}
                placeholder="Enter resource and press Enter"
              />
              <Button onClick={addResource} type="button">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {resources.map((resource) => (
                <Badge key={resource} variant="outline" className="cursor-pointer" onClick={() => removeResource(resource)}>
                  {resource} ×
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleAnalyze} disabled={loading || symptoms.length === 0} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Symptoms
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Probable Diseases
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.probable_diseases.length > 0 ? (
                <div className="space-y-3">
                  {result.probable_diseases.map((disease, idx) => (
                    <div key={idx} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{disease.name}</p>
                        {disease.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{disease.notes}</p>
                        )}
                      </div>
                      {disease.confidence !== undefined && (
                        <Badge variant="secondary">{(disease.confidence * 100).toFixed(0)}%</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No diseases identified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Resource Needs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.resource_needs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.resource_needs.map((resource, idx) => (
                    <Badge key={idx} variant="outline">{resource}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific resources identified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Nearest Facilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.nearest_facilities.length > 0 ? (
                <div className="space-y-3">
                  {result.nearest_facilities.map((facility, idx) => (
                    <div key={idx} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{facility.name}</p>
                        {facility.address && (
                          <p className="text-sm text-muted-foreground">{facility.address}</p>
                        )}
                      </div>
                      {facility.distance_km !== undefined && (
                        <Badge variant="secondary">{facility.distance_km.toFixed(1)} km</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No facilities found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
