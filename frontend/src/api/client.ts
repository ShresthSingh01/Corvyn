import { CaseMetadata, AnalysisSummary } from '../types';

const API_BASE = '/api';

export async function fetchCases(): Promise<CaseMetadata[]> {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function createCase(title: string = 'Cyber Fraud Case'): Promise<CaseMetadata> {
  const res = await fetch(`${API_BASE}/cases?title=${encodeURIComponent(title)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to create case');
  return res.json();
}

export async function ingestFiles(caseId: string, files: File[]): Promise<any> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const res = await fetch(`${API_BASE}/cases/${caseId}/ingest`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to ingest evidence files');
  return res.json();
}

export async function analyzeCase(caseId: string): Promise<AnalysisSummary> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/analyze`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Analysis failed');
  return res.json();
}

export async function fetchGraph(caseId: string): Promise<AnalysisSummary> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/graph`);
  if (!res.ok) throw new Error('Failed to load graph');
  return res.json();
}

export async function seedDemoCase(): Promise<{ metadata: CaseMetadata; summary: AnalysisSummary }> {
  const res = await fetch(`${API_BASE}/cases/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo case');
  return res.json();
}

export async function fetchDemoStatus(): Promise<{ seeded: boolean; case_id: string | null }> {
  const res = await fetch(`${API_BASE}/cases/demo-status`);
  if (!res.ok) return { seeded: false, case_id: null };
  return res.json();
}

export async function downloadSampleZip(): Promise<void> {
  const res = await fetch(`${API_BASE}/samples/zip`);
  if (!res.ok) throw new Error('Failed to download sample evidence zip');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Corvyn_Sample_Evidence_Package.zip';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

export function getReportDownloadUrl(caseId: string, format: 'pdf' | 'json' = 'pdf'): string {
  return `${API_BASE}/cases/${caseId}/report?format=${format}`;
}

