export interface EvidenceItem {
  rule: string;
  weight: number;
  description: string;
  source_file: string;
  source_row: number;
  is_counter_evidence: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  component_scores: Record<string, number>;
  is_mule_candidate: boolean;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  amount: number | null;
  timestamp: string | null;
  time_delta_seconds: number | null;
  is_fraud_path: boolean;
  evidence: EvidenceItem[];
}

export interface TemporalHop {
  from_entity: string;
  to_entity: string;
  amount: number;
  timestamp: string;
  time_delta_seconds: number;
  tx_id?: string;
}

export interface TemporalPath {
  path_id: string;
  hops: TemporalHop[];
  total_duration_seconds: number;
  initial_amount: number;
  final_amount: number;
  retention_rate: number;
  hop_count: number;
}

export interface NextBestAction {
  priority_rank: number;
  target_entity: string;
  action_text: string;
  reason: string;
  priority_score: number;
}

export interface AnalysisSummary {
  case_id: string;
  total_loss: number;
  records_processed: number;
  entities_count: number;
  fraud_hops_found: number;
  top_risk_entities: GraphNode[];
  temporal_paths: TemporalPath[];
  recommendations: NextBestAction[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  file_hashes: Record<string, string>;
  time_to_insight_ms: number;
}

export interface CaseMetadata {
  case_id: string;
  title: string;
  description: string;
  created_at: string;
  files: string[];
  file_hashes: Record<string, string>;
}
