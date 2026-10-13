// API Types — compatible with SYNESIS 26 FastAPI backend responses

export interface HealthResponse {
  status: string;
  timestamp?: string;
  database?: string;
  version?: string;
}

export interface DashboardStats {
  total_transactions: number;
  total_value: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  open_cases: number;
  flagged_accounts?: number;
  aml_patterns?: number;
}

export interface DashboardResponse {
  stats?: DashboardStats;
  // Some backends return top-level fields
  total_transactions?: number;
  total_value?: number;
  high_risk?: number;
  medium_risk?: number;
  low_risk?: number;
  open_cases?: number;
  flagged_accounts?: number;
  aml_patterns?: number;
  recent_alerts?: Alert[];
  alerts?: Alert[];
}

export interface Alert {
  id?: string;
  alert_id?: string;
  transaction_ref?: string;
  transaction_id?: string;
  risk_score?: number;
  severity?: string;
  risk_level?: string;
  timestamp?: string;
  created_at?: string;
  reasons?: string[];
  reason?: string;
  description?: string;
  status?: string;
  amount?: number;
}

export interface Transaction {
  id?: string | number;
  transaction_ref?: string;
  reference?: string;
  amount?: number;
  account_id?: string;
  account?: string;
  sender_account?: string;
  receiver_account?: string;
  timestamp?: string;
  created_at?: string;
  risk_score?: number;
  risk_level?: string;
  status?: string;
  transaction_type?: string;
  type?: string;
  currency?: string;
  location?: string;
  device_id?: string;
  ip_address?: string;
  merchant?: string;
  description?: string;
}

export interface TransactionsResponse {
  transactions?: Transaction[];
  data?: Transaction[];
  total?: number;
  count?: number;
}

export interface AMLPattern {
  id?: string | number;
  pattern_id?: string;
  pattern_type?: string;
  type?: string;
  severity?: string;
  risk_level?: string;
  description?: string;
  accounts?: string[];
  related_accounts?: string[];
  transactions?: string[];
  related_transactions?: string[];
  amount?: number;
  total_amount?: number;
  confidence?: number;
  flagged_at?: string;
  timestamp?: string;
  explanation?: string;
  indicators?: string[];
}

export interface AMLResponse {
  patterns?: AMLPattern[];
  data?: AMLPattern[];
  total?: number;
  count?: number;
}

export interface AccountNode {
  id: string;
  account_id?: string;
  label?: string;
  account_type?: string;
  risk_level?: string;
  risk_score?: number;
  balance?: number;
  transaction_count?: number;
  flagged?: boolean;
}

export interface AccountEdge {
  source: string;
  target: string;
  source_account?: string;
  target_account?: string;
  amount?: number;
  transaction_count?: number;
  transaction_ref?: string;
  relationship_type?: string;
}

export interface AccountRelationshipsResponse {
  nodes?: AccountNode[];
  edges?: AccountEdge[];
  accounts?: AccountNode[];
  relationships?: AccountEdge[];
  links?: AccountEdge[];
  data?: unknown;
}

export interface InvestigationCase {
  id?: string | number;
  case_id?: string;
  case_number?: string;
  title?: string;
  description?: string;
  severity?: string;
  risk_level?: string;
  status?: string;
  assigned_to?: string;
  investigator?: string;
  created_at?: string;
  updated_at?: string;
  related_transactions?: string[];
  transactions?: string[];
  related_accounts?: string[];
  timeline?: TimelineEvent[];
  tags?: string[];
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  description?: string;
  actor?: string;
}

export interface CasesResponse {
  cases?: InvestigationCase[];
  data?: InvestigationCase[];
  total?: number;
  count?: number;
  open_cases?: number;
}

export interface EvaluationResponse {
  score?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  total_predictions?: number;
  correct_predictions?: number;
  metrics?: Record<string, number>;
}
