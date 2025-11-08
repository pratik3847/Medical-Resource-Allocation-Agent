// Analyze
export interface AnalyzeRequest {
  symptoms: string[];
  location?: string;
  required_resources?: string[];
}

export interface ProbableDisease {
  name: string;
  confidence?: number;
  notes?: string;
}

export interface Facility {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
}

export interface AnalyzeResponse {
  probable_diseases: ProbableDisease[];
  resource_needs: string[];
  nearest_facilities: Facility[];
}

// Inventory
export interface InventoryRecord {
  hospital_id: string;
  hospital_name: string;
  address: string;
  lat: number;
  lon: number;
  resource_name: string;
  quantity: number;
  reserve_min: number;
  unit: string;
}

export interface InventorySnapshot {
  records: InventoryRecord[];
}

export interface InventoryUpdateItem {
  hospital_id: string;
  resource_name: string;
  quantity: number;
  mode?: 'set' | 'delta';
}

// Reallocation
export interface ReallocationDemand {
  hospital_id: string;
  resource_name: string;
  required_quantity: number;
}

export interface TransferPlanItem {
  resource_name: string;
  from_hospital_id: string;
  to_hospital_id: string;
  quantity: number;
  distance_km: number;
}

export interface ReallocationRequest {
  demands: ReallocationDemand[];
}

export interface ReallocationResponse {
  plan: TransferPlanItem[];
  unmet: ReallocationDemand[];
  summary_by_hospital: Record<string, Record<string, {
    before: number;
    after: number;
    reserve_min: number;
  }>>;
}

// Preferences
export interface Preferences {
  distance_weight: number;
  coverage_weight: number;
  fairness_weight: number;
}

export interface PreferenceUpdate {
  distance_weight?: number;
  coverage_weight?: number;
  fairness_weight?: number;
}

export interface PlanFeedback {
  accepted: boolean;
  reason?: string;
  plan_size?: number;
}

export interface FeedbackHistoryItem {
  ts: number;
  accepted: boolean;
  reason?: string;
  plan_size?: number;
}

export interface PreferenceFeedbackResponse {
  weights: Preferences;
  feedback_history: FeedbackHistoryItem[];
}

// Workflow
export interface WorkflowRequest {
  symptoms?: string[];
  location?: string;
  required_resources?: string[];
  objective?: string;
}

export interface WorkflowTraceStep {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  success: boolean;
  duration_ms?: number;
  notes?: string;
}

export interface WorkflowResponse {
  status: string;
  summary: string;
  analyze?: AnalyzeResponse;
  research?: unknown;
  insights?: unknown;
  inventory_snapshot?: InventorySnapshot;
  reallocation?: ReallocationResponse;
  trace: WorkflowTraceStep[];
}

// Research
export interface ResearchRequest {
  query: string;
  limit?: number;
}

// Resources
export interface ResourceSearchRequest {
  query: string;
  limit?: number;
}

// Generic API Envelope
export interface ApiEnvelope<T> {
  status: 'ok' | 'error';
  message: string;
  data: T;
}
