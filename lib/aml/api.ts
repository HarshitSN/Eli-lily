// AML Agent API Service
// Communicates with the FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_GENESIS_API_URL || 'http://localhost:8000';

export interface Transaction {
  id: string;
  timestamp: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  type: string;
  purpose: string;
  sourceCountry: string;
  destinationCountry: string;
}

export interface Account {
  id: string;
  ownerName: string;
  ownerType: string;
  riskProfile: string;
  jurisdiction: string;
  isShellCompany: boolean;
  beneficialOwners: string[];
}

export interface Alert {
  id: string;
  patternType: string;
  severity: string;
  riskScore: number;
  involvedAccounts: string[];
  transactionIds: string[];
  patternIndicators: string[];
  timestamp: string;
  status: string;
}

export interface AnalysisResult {
  transactions: Transaction[];
  accounts: Account[];
  alerts: Alert[];
  statistics: {
    total_transactions: number;
    total_accounts: number;
    total_amount: number;
    total_alerts: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    avg_risk_score: number;
    patterns_detected: string[];
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  question: string;
  context: {
    alerts: Alert[];
    selectedAlert: Alert | null;
    transactions: Transaction[];
    statistics: any;
  };
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// Analyze CSV file
export async function analyzeCSV(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/analyze/csv`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Analysis failed');
  }

  return result.data;
}

// Analyze JSON data
export async function analyzeJSON(transactions: any[]): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactions }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Analysis failed');
  }

  return result.data;
}

// Get statistics
export async function getStatistics(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/statistics`);
  const result = await response.json();
  return result.data;
}

// Get all alerts
export async function getAlerts(): Promise<Alert[]> {
  const response = await fetch(`${API_BASE_URL}/api/alerts`);
  const result = await response.json();
  return result.data || [];
}

// Get specific alert
export async function getAlert(alertId: string): Promise<Alert> {
  const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`);
  const result = await response.json();
  return result.data;
}

// Get account transactions
export async function getAccountTransactions(accountId: string): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/${accountId}`);
  const result = await response.json();
  return result.data || [];
}

// Chat with AML Assistant
export async function chatWithAssistant(
  question: string,
  context: { alerts: Alert[]; selectedAlert: Alert | null; transactions: Transaction[]; statistics: any }
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context } as ChatRequest),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result) {
      return 'I apologize, but I could not generate a response. Please try again.';
    }

    if (result.success === false) {
      return result.error || 'I encountered an error. Please try again.';
    }

    return result.response || result.data?.response || 'No response generated.';
  } catch (error) {
    console.error('Chat error:', error);
    return 'Sorry, I encountered an error connecting to the analysis agent. Please ensure the backend is running and try again.';
  }
}

// Check API health
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Helper function to get pattern label
export function getPatternLabel(pattern: string): string {
  const labels: Record<string, string> = {
    'round_tripping': 'Round-Tripping',
    'funnel_account': 'Funnel Account',
    'multi_tier_layering': 'Multi-Tier Layering',
    'synthetic_identity': 'Synthetic Identity',
    'u_turn_loan': 'U-Turn Loan',
    'corporate_structure': 'Corporate Structure',
    'correspondent_nesting': 'Correspondent Nesting',
    'money_circle': 'Money Circle',
    'scatter_gather': 'Scatter-Gather (Smurfing)',
    'crypto_mixing': 'Crypto Mixing'
  };
  return labels[pattern] || pattern.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
