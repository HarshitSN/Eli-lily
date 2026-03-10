import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Activity,
  Eye,
  CheckCircle,
  Upload,
  Database,
  FileSpreadsheet,
  ArrowRight,
  Network,
  DollarSign,
  Clock,
  X,
  Loader2,
  Bot,
  Globe,
  Sparkles,
  FileText,
  Download
} from 'lucide-react';
import {
  Alert as AMLAlert,
  Transaction,
  Account,
  analyzeCSV,
  AnalysisResult
} from '../../lib/aml/api';
import { NetworkGraph } from './NetworkGraph';
import { AgentChat } from './AgentChat';

// Helper function to get pattern label
function getPatternLabel(pattern: string): string {
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

// Pattern descriptions for display
const PATTERN_DESCRIPTIONS: Record<string, string> = {
  'round_tripping': 'Funds leave an entity and eventually return disguised as legitimate revenue through circular transactions.',
  'funnel_account': 'Multiple small deposits (below $10K threshold) accumulate then rapidly transfer out - classic placement layer.',
  'multi_tier_layering': 'Money moves through multiple layers of shell companies to obscure its origin - classic layering technique.',
  'synthetic_identity': 'Fake identities created using real SSN fragments combined with fabricated information for fraud.',
  'u_turn_loan': 'Funds sent out as loans return quickly as repayments - disguise illicit funds as legitimate loan activity.',
  'corporate_structure': 'Complex corporate structures used to obscure beneficial ownership and hide illicit fund flows.',
  'correspondent_nesting': 'Third-party access to correspondent accounts used to layer transactions and evade controls.',
  'money_circle': 'Closed network of accounts that primarily transact among themselves with minimal external engagement.',
  'scatter_gather': 'Large amounts broken into smaller transactions to avoid reporting thresholds - structuring/smurfing.',
  'crypto_mixing': 'Cryptocurrency transactions mixed through various addresses to obscure the money trail.'
};

// Risk score calculation explanation
const RISK_SCORE_DESCRIPTION = 'Risk score (0-100) is calculated based on: pattern severity, number of involved accounts, transaction volume, velocity of transactions, and number of pattern indicators detected. Higher scores indicate greater risk.';

interface DataSourceProps {
  onDataLoaded: (transactions: Transaction[], accounts: Account[], alerts: AMLAlert[]) => void;
}

function DataSourceSelector({ onDataLoaded }: DataSourceProps) {
  const [source, setSource] = useState<'upload' | 'postgres' | 'api' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showProgress, setShowProgress] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // PostgreSQL connection state
  const [pgConfig, setPgConfig] = useState({
    host: 'localhost',
    port: '5432',
    database: '',
    username: '',
    password: '',
  });

  // External API connection state
  const [apiConfig, setApiConfig] = useState({
    endpoint: '',
    apiKey: '',
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setShowProgress(true);
    setError(null);

    // Progress steps
    const progressSteps = [
      'Agent in progress to understand the data...',
      'Analysing the patterns...',
      'Flagging the risks...',
      'Almost there...'
    ];

    try {
      // Simulate progress animation
      for (let i = 0; i < progressSteps.length; i++) {
        setUploadProgress(progressSteps[i]);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Show completion state briefly
      setUploadProgress('Complete! Loading dashboard...');
      setIsFadingOut(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call the backend API to analyze the CSV
      const result = await analyzeCSV(selectedFile);

      // Pass the results to parent - including alerts from backend
      onDataLoaded(result.transactions, result.accounts, result.alerts);

    } catch (err) {
      setError('Failed to analyze file. Make sure the backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setShowProgress(false);
      setIsFadingOut(false);
      setUploadProgress('');
    }
  };

  const handlePostgresConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call a backend API
      // For now, we'll simulate a connection and show a message
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulated response - in production this would come from the API
      setError('Database connection requires backend API. Please use CSV upload for now or configure API endpoint.');
    } catch (err) {
      setError('Failed to connect to database. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiConnect = async () => {
    if (!apiConfig.endpoint) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {})
        },
        body: JSON.stringify({ action: 'get_transactions' })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Call backend to analyze the data
      const result = await analyzeCSV(new File([JSON.stringify(data)], 'api-data.json', { type: 'application/json' }));
      onDataLoaded(result.transactions, result.accounts, result.alerts);

    } catch (err) {
      setError('Failed to connect to external API. Please check the endpoint and credentials.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!source) {
    return (
      <div className="flex flex-wrap gap-6 justify-center items-start">
        {/* Connect Your Data Card */}
        <Card className="w-full max-w-md flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-center text-base font-semibold">Connect Your Data</CardTitle>
            <p className="text-center text-gray-500 text-sm mt-1">
              Choose how you want to provide transaction data for analysis
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setSource('upload')}
              className="w-full h-12 text-sm flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="h-5 w-5" />
              Upload CSV/Excel File
            </Button>
            <Button
              onClick={() => setSource('postgres')}
              variant="outline"
              className="w-full h-12 text-sm flex items-center justify-center gap-2"
            >
              <Database className="h-5 w-5" />
              Connect to PostgreSQL Database
            </Button>
            <Button
              onClick={() => setSource('api')}
              variant="outline"
              className="w-full h-12 text-sm flex items-center justify-center gap-2"
            >
              <Globe className="h-5 w-5" />
              Connect to External API
            </Button>
          </CardContent>
        </Card>

        {/* Flow Chart */}
        <Card className="flex-1 min-w-[500px] max-w-3xl">
          <CardHeader>
            <CardTitle className="text-center text-lg font-semibold">
              <Shield className="h-5 w-5 inline mr-2 text-blue-600" />
              How Our AI Agent Detects Money Laundering Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Upload className="h-7 w-7 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">1. Data Input</span>
                <span className="text-xs text-gray-500 text-center">CSV, Database<br />or API</span>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400" />

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <Activity className="h-7 w-7 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">2. Pattern Engine</span>
                <span className="text-xs text-gray-500 text-center">10+ Detection<br />Algorithms</span>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400" />

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle className="h-7 w-7 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">3. Risk Analysis</span>
                <span className="text-xs text-gray-500 text-center">Severity &<br />Score Calculation</span>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400" />

              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <Shield className="h-7 w-7 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">4. Alert Generation</span>
                <span className="text-xs text-gray-500 text-center">Real-time<br />Flagging</span>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400" />

              {/* Step 5 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Bot className="h-7 w-7 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">5. AI Assistant</span>
                <span className="text-xs text-gray-500 text-center">Investigation<br />Support</span>
              </div>
            </div>

            {/* Detection Patterns Info */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Patterns We Detect</h4>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'Round-Tripping', icon: '🔄' },
                  { name: 'Funnel Account', icon: '�漏' },
                  { name: 'Multi-Tier Layering', icon: '🏗️' },
                  { name: 'Synthetic Identity', icon: '🎭' },
                  { name: 'U-Turn Loan', icon: '↩️' },
                  { name: 'Money Circle', icon: '⭕' },
                  { name: 'Scatter-Gather', icon: '📊' },
                  { name: 'Crypto Mixing', icon: '₿' },
                ].map((pattern) => (
                  <div key={pattern.name} className="text-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-lg">{pattern.icon}</span>
                    <p className="text-xs text-gray-600 mt-1">{pattern.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          {source === 'upload' ? 'Upload Transaction Data' : source === 'postgres' ? 'Connect to PostgreSQL' : 'Connect to External API'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => { setSource(null); setError(null); setSelectedFile(null); }}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {source === 'upload' ? (
          showProgress ? (
            <div className={`flex flex-col items-center justify-center py-12 transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
              <div className={`w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 ${isFadingOut ? 'scale-150' : 'animate-pulse'}`}>
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="text-center space-y-3">
                <p className={`text-lg font-semibold text-gray-800 ${isFadingOut ? '' : 'animate-pulse'}`}>
                  {uploadProgress || 'Processing...'}
                </p>
                {!isFadingOut && (
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
              {!isFadingOut && (
                <div className="mt-8 w-full max-w-xs bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 text-sm mb-3">
                  Upload a CSV file with transaction data
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
                {selectedFile && (
                  <p className="mt-4 text-sm text-green-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Expected CSV Columns:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <span>id</span>
                  <span>timestamp</span>
                  <span>from_account</span>
                  <span>to_account</span>
                  <span>amount</span>
                  <span>currency</span>
                  <span>type</span>
                  <span>purpose</span>
                  <span>source_country</span>
                  <span>destination_country</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleFileUpload}
                disabled={!selectedFile || isLoading}
                className="w-full"
              >
                <Bot className="h-4 w-4 mr-2" />
                Analyze with AI Agent
              </Button>
            </div>
          )
        ) : source === 'api' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Endpoint URL</Label>
              <Input
                value={apiConfig.endpoint}
                onChange={(e) => setApiConfig({ ...apiConfig, endpoint: e.target.value })}
                placeholder="https://api.example.com/transactions"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key (Optional)</Label>
              <Input
                type="password"
                value={apiConfig.apiKey}
                onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                placeholder="Enter your API key"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleApiConnect}
              disabled={!apiConfig.endpoint || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Connect & Analyze
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Host</Label>
                <Input
                  value={pgConfig.host}
                  onChange={(e) => setPgConfig({ ...pgConfig, host: e.target.value })}
                  placeholder="localhost"
                />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  value={pgConfig.port}
                  onChange={(e) => setPgConfig({ ...pgConfig, port: e.target.value })}
                  placeholder="5432"
                />
              </div>
              <div className="space-y-2">
                <Label>Database</Label>
                <Input
                  value={pgConfig.database}
                  onChange={(e) => setPgConfig({ ...pgConfig, database: e.target.value })}
                  placeholder="transactions_db"
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={pgConfig.username}
                  onChange={(e) => setPgConfig({ ...pgConfig, username: e.target.value })}
                  placeholder="postgres"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={pgConfig.password}
                  onChange={(e) => setPgConfig({ ...pgConfig, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handlePostgresConnect}
              disabled={!pgConfig.database || !pgConfig.username || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Connect & Analyze
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertListProps {
  alerts: AMLAlert[];
  selectedAlert: AMLAlert | null;
  onSelectAlert: (alert: AMLAlert) => void;
}

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const severityOrder = ['critical', 'high', 'medium', 'low'];

function AlertList({ alerts, selectedAlert, onSelectAlert }: AlertListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 px-4 pb-4">
            {alerts
              .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))
              .map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedAlert?.id === alert.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={severityColors[alert.severity]}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-mono text-gray-500">
                      {alert.riskScore}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">
                    {getPatternLabel(alert.patternType)}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {alert.involvedAccounts.length} accounts involved
                  </p>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AlertDetail({ alert, onViewNetwork, onAskAgent, allAlerts }: { alert: AMLAlert; onViewNetwork?: () => void; onAskAgent?: () => void; allAlerts?: AMLAlert[] }) {
  // Generate comprehensive report for the selected alert
  const generateReport = (includeAllAlerts: boolean) => {
    const alertsToInclude = includeAllAlerts && allAlerts ? allAlerts : [alert];

    const reportContent = `# AML Investigation Report\n\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Total Alerts: ${alertsToInclude.length}\n\n` +
      `---\n\n` +
      alertsToInclude.map((a, idx) => {
        return `## Alert ${idx + 1}: ${getPatternLabel(a.patternType)}\n\n` +
          `**ID:** ${a.id}\n` +
          `**Severity:** ${a.severity.toUpperCase()}\n` +
          `**Risk Score:** ${a.riskScore}/100\n` +
          `**Pattern Type:** ${a.patternType}\n\n` +
          `### Pattern Indicators\n${a.patternIndicators.map(i => `- ${i}`).join('\n')}\n\n` +
          `### Involved Accounts (${a.involvedAccounts.length})\n${a.involvedAccounts.join(', ')}\n\n` +
          `### Transaction IDs (${a.transactionIds.length})\n${a.transactionIds.slice(0, 20).join('\n')}${a.transactionIds.length > 20 ? `\n... and ${a.transactionIds.length - 20} more` : ''}\n`;
      }).join('\n\n---\n\n');

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aml-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{getPatternLabel(alert.patternType)}</CardTitle>
            <div className="relative group">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                <Eye className="h-4 w-4 text-gray-500" />
              </Button>
              <div className="absolute left-0 top-full mt-2 z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl hidden group-hover:block">
                {PATTERN_DESCRIPTIONS[alert.patternType] || 'This pattern has been detected based on transaction analysis.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onViewNetwork}>
              <Eye className="h-4 w-4 mr-1" />
              Network
            </Button>
            {onAskAgent && (
              <Button size="sm" className="gap-1 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={onAskAgent}>
                <Bot className="h-4 w-4" />
                Ask
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => generateReport(false)}>
              <FileText className="h-4 w-4 mr-1" />
              Report
            </Button>
            <Button size="sm" variant="default">
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Badge className={severityColors[alert.severity]}>
            {alert.severity.toUpperCase()}
          </Badge>
          <span className="text-sm text-gray-500">Risk Score: {alert.riskScore}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Pattern Indicators
          </h4>
          <ul className="space-y-2">
            {alert.patternIndicators.map((indicator, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Network className="h-4 w-4" />
            Involved Accounts ({alert.involvedAccounts.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {alert.involvedAccounts.map((accountId) => (
              <Badge key={accountId} variant="outline" className="px-2 py-1">
                {accountId}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Transaction IDs ({alert.transactionIds.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {alert.transactionIds.slice(0, 10).map((txId) => (
              <Badge key={txId} variant="secondary" className="font-mono text-xs">
                {txId}
              </Badge>
            ))}
            {alert.transactionIds.length > 10 && (
              <Badge variant="secondary">+{alert.transactionIds.length - 10} more</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCards({ alerts, transactionCount }: { alerts: AMLAlert[], transactionCount: number }) {
  const critical = alerts.filter(a => a.severity === 'critical').length;
  const high = alerts.filter(a => a.severity === 'high').length;
  const medium = alerts.filter(a => a.severity === 'medium').length;
  const low = alerts.filter(a => a.severity === 'low').length;

  const avgRiskScore = alerts.length > 0
    ? Math.round(alerts.reduce((sum, a) => sum + a.riskScore, 0) / alerts.length)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-red-600">{critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Risk</p>
              <p className="text-2xl font-bold text-orange-600">{high}</p>
            </div>
            <Shield className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-blue-600">{transactionCount}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Risk Score</p>
              <p className="text-2xl font-bold text-purple-600">{avgRiskScore}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AMLDashboard() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [alerts, setAlerts] = useState<AMLAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AMLAlert | null>(null);
  const [showNetworkGraph, setShowNetworkGraph] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [chatContext, setChatContext] = useState<{ type: 'node' | 'alert'; data: any } | null>(null);

  const handleDataLoaded = (txns: Transaction[], accs: Account[], detectedAlerts: AMLAlert[]) => {
    setTransactions(txns);
    setAccounts(accs);
    setAlerts(detectedAlerts);
    setDataLoaded(true);

    // Select first alert if available
    if (detectedAlerts.length > 0) {
      setSelectedAlert(detectedAlerts[0]);
    }
  };

  const handleReset = () => {
    setDataLoaded(false);
    setTransactions([]);
    setAccounts([]);
    setAlerts([]);
    setSelectedAlert(null);
    setChatContext(null);
  };

  // Generate report for all alerts
  const generateFullReport = () => {
    if (alerts.length === 0) return;

    const reportContent = `# AML Investigation Report\n\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Total Alerts: ${alerts.length}\n` +
      `Total Transactions: ${transactions.length}\n` +
      `Total Accounts: ${accounts.length}\n\n` +
      `---\n\n` +
      alerts.map((a, idx) => {
        return `## Alert ${idx + 1}: ${getPatternLabel(a.patternType)}\n\n` +
          `**ID:** ${a.id}\n` +
          `**Severity:** ${a.severity.toUpperCase()}\n` +
          `**Risk Score:** ${a.riskScore}/100\n` +
          `**Pattern Type:** ${a.patternType}\n\n` +
          `### Pattern Indicators\n${a.patternIndicators.map(i => `- ${i}`).join('\n')}\n\n` +
          `### Involved Accounts (${a.involvedAccounts.length})\n${a.involvedAccounts.join(', ')}\n\n` +
          `### Transaction IDs (${a.transactionIds.length})\n${a.transactionIds.slice(0, 20).join('\n')}${a.transactionIds.length > 20 ? `\n... and ${a.transactionIds.length - 20} more` : ''}\n`;
      }).join('\n\n---\n\n');

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aml-full-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 px-4 pb-4">
      {/* Floating Agent Chat Button */}
      {dataLoaded && (
        <div className="fixed bottom-6 right-6 z-50">
          {!chatExpanded ? (
            <Button
              onClick={() => setChatExpanded(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Bot className="h-6 w-6" />
            </Button>
          ) : (
            <div className="w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">AML Assistant</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setChatExpanded(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AgentChat
                  alerts={alerts}
                  transactions={transactions}
                  accounts={accounts}
                  initialContext={chatContext}
                  onAlertClick={setSelectedAlert}
                  onClearContext={() => setChatContext(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-4 pt-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">AML Transaction Monitoring Agent</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time detection of 10+ money laundering patterns</p>
          </div>
          {dataLoaded && alerts.length > 0 && (
            <div className="absolute top-6 right-0 flex gap-2">
              <Button onClick={generateFullReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Report All ({alerts.length})
              </Button>
              <Button onClick={handleReset} variant="outline">
                Analyze New Data
              </Button>
            </div>
          )}
        </div>

        {/* Data Source Selection */}
        {!dataLoaded && (
          <DataSourceSelector onDataLoaded={handleDataLoaded} />
        )}

        {/* Results */}
        {dataLoaded && (
          <>
            <StatsCards alerts={alerts} transactionCount={transactions.length} />

            {alerts.length === 0 ? (
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Suspicious Patterns Detected
                      </h3>
                      <p className="text-gray-500">
                        Analyzed {transactions.length} transactions across {accounts.length} accounts.
                        No money laundering patterns were detected.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-5">
                  <AlertList
                    alerts={alerts}
                    selectedAlert={selectedAlert}
                    onSelectAlert={setSelectedAlert}
                  />
                </div>
                <div className="col-span-7">
                  {selectedAlert ? (
                    <AlertDetail
                      alert={selectedAlert}
                      allAlerts={alerts}
                      onViewNetwork={() => setShowNetworkGraph(true)}
                      onAskAgent={() => {
                        setChatContext({ type: 'alert', data: selectedAlert });
                        setChatExpanded(true);
                      }}
                    />
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center py-12 text-gray-500">
                          Select an alert to view details
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Network Graph Overlay */}
      {showNetworkGraph && dataLoaded && (
        <NetworkGraph
          transactions={transactions}
          accounts={accounts}
          alertAccountIds={selectedAlert?.involvedAccounts || []}
          alerts={alerts}
          selectedAlert={selectedAlert}
          onClose={() => setShowNetworkGraph(false)}
          onAskAgent={(nodeData) => {
            setChatContext({ type: 'node', data: nodeData });
            setShowNetworkGraph(false);
            setChatExpanded(true);
          }}
        />
      )}
    </div>
  );
}
