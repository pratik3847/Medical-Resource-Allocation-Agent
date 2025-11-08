import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { WorkflowRequest, WorkflowResponse } from '@/types/api';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function Workflow() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [location, setLocation] = useState('');
  const [resources, setResources] = useState<string[]>([]);
  const [resourceInput, setResourceInput] = useState('');
  const [objective, setObjective] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResponse | null>(null);
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

  const handleRun = async () => {
    try {
      setLoading(true);
      const request: WorkflowRequest = {
        symptoms: symptoms.length > 0 ? symptoms : undefined,
        location: location || undefined,
        required_resources: resources.length > 0 ? resources : undefined,
        objective: objective || undefined,
      };

      const response = await apiClient.post<WorkflowResponse>('/workflow/run', request);
      setResult(response);
      
      toast({
        title: 'Workflow Complete',
        description: response.summary,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error running workflow',
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
        <h1 className="text-3xl font-bold tracking-tight">Agentic Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Orchestrate multiple operations in a single workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Configuration</CardTitle>
          <CardDescription>Define inputs for the orchestrated workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms (optional)</Label>
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

          <div className="space-y-2">
            <Label htmlFor="objective">Objective (optional)</Label>
            <Textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe the goal of this workflow..."
              rows={3}
            />
          </div>

          <Button onClick={handleRun} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Workflow
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          {result.trace && result.trace.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Execution Trace</CardTitle>
                <CardDescription>{result.trace.length} steps executed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.trace.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b pb-3 last:border-0">
                      {step.success ? (
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{step.name}</p>
                          {step.duration_ms !== undefined && (
                            <Badge variant="secondary">{step.duration_ms}ms</Badge>
                          )}
                        </div>
                        {step.notes && (
                          <p className="text-sm text-muted-foreground">{step.notes}</p>
                        )}
                      </div>
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
