import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trello, X, Loader2, CheckCircle, AlertCircle, ExternalLink, Save, Trash2, Settings, File, Folder, Github, Database, Network, Globe, Plus, FileText, Copy, Check } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_GENESIS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

interface Template {
  id: string;
  name: string;
  route: string;
  content: string;
  isBuiltIn: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
  onDisconnect?: (connectorId: string) => void;
}

interface ConnectorSettings {
  [key: string]: {
    connected: boolean;
    [key: string]: any;
  };
}

const CONNECTORS = [
  { id: 'jira', name: 'JIRA', icon: Trello, color: 'bg-blue-500', description: 'Project tracking & issues' },
  { id: 'confluence', name: 'Confluence', icon: File, color: 'bg-blue-600', description: 'Documentation & wikis' },
  { id: 'gdrive', name: 'Google Drive', icon: Folder, color: 'bg-green-500', description: 'File storage & sharing' },
  { id: 'github', name: 'GitHub', icon: Github, color: 'bg-gray-800', description: 'Code repository & CI/CD' },
  { id: 'vectordb', name: 'Vector DB', icon: Database, color: 'bg-purple-500', description: 'AI embeddings & search' },
  { id: 'sqldb', name: 'SQL DB', icon: Database, color: 'bg-orange-500', description: 'Relational databases' },
  { id: 'knowledgegraph', name: 'Knowledge Graph', icon: Network, color: 'bg-indigo-500', description: 'Graph databases & relationships' },
  { id: 'externalapi', name: 'External APIs', icon: Globe, color: 'bg-red-500', description: 'Third-party integrations' },
];

const BUILT_IN_TEMPLATES: Template[] = [
  { id: 'jira-create', name: 'Create JIRA Issue', route: '@jira', content: 'Create a new JIRA issue with the following details:\n\n**Project:** {{project}}\n**Issue Type:** {{issue_type}}\n**Summary:** {{summary}}\n**Description:** {{description}}\n**Priority:** {{priority}}', isBuiltIn: true },
  { id: 'jira-update', name: 'Update JIRA Issue', route: '@jira', content: 'Update JIRA issue {{issue_key}}:\n\n**Status:** {{status}}\n**Comment:** {{comment}}', isBuiltIn: true },
  { id: 'confluence-create', name: 'Create Confluence Page', route: '@confluence', content: 'Create a new Confluence page:\n\n**Space:** {{space}}\n**Title:** {{title}}\n**Content:**\n{{content}}', isBuiltIn: true },
  { id: 'github-pr', name: 'Create GitHub PR', route: '@github', content: 'Create a Pull Request:\n\n**Repository:** {{repo}}\n**Title:** {{title}}\n**Description:** {{description}}\n**Base branch:** {{base}}\n**Head branch:** {{head}}', isBuiltIn: true },
  { id: 'sql-query', name: 'Execute SQL Query', route: '@sqldb', content: 'Execute the following SQL query on {{database}}:\n\n```sql\n{{query}}\n```', isBuiltIn: true },
  { id: 'vector-search', name: 'Search Vector DB', route: '@vectordb', content: 'Search the vector database:\n\n**Collection:** {{collection}}\n**Query:** {{query}}\n**Top K:** {{top_k}}', isBuiltIn: true },
];

const STORAGE_KEY = 'genesis_connector_settings';
const TEMPLATES_KEY = 'genesis_templates';

export function SettingsModal({ isOpen, onClose, initialTab = 'jira', onDisconnect }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSection, setActiveSection] = useState<'tools' | 'templates'>('tools');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ConnectorSettings>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', route: '', content: '' });

  // Load saved settings on mount and when modal opens
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
        } catch (e) {
          console.error('Failed to parse saved settings');
        }
      }

      // Load templates
      const savedTemplates = localStorage.getItem(TEMPLATES_KEY);
      if (savedTemplates) {
        try {
          const parsed = JSON.parse(savedTemplates);
          setTemplates([...BUILT_IN_TEMPLATES, ...parsed]);
        } catch (e) {
          setTemplates(BUILT_IN_TEMPLATES);
        }
      } else {
        setTemplates(BUILT_IN_TEMPLATES);
      }
    };

    loadSettings();
  }, [isOpen]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setShowNewTemplateForm(false);
      setNewTemplate({ name: '', route: '', content: '' });
    }
  }, [isOpen]);

  // Update activeTab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Scroll to active tab when it changes
  useEffect(() => {
    if (isOpen && tabsRef.current) {
      const activeButton = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  const getConnectorSettings = (connectorId: string) => {
    return settings[connectorId] || { connected: false };
  };

  const updateConnectorSettings = (connectorId: string, newSettings: any) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        [connectorId]: { ...prev[connectorId], ...newSettings }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveJIRASettings = async () => {
    const jiraSettings = getConnectorSettings('jira');
    if (!jiraSettings.orgId || !jiraSettings.apiKey) {
      setError('Please enter both Organization ID and API Key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const domain = `${jiraSettings.orgId}.atlassian.net`;

      const response = await fetch(`${API_BASE_URL}/api/jira/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain,
          email: jiraSettings.email || '',
          api_token: jiraSettings.apiKey
        }),
      });

      const data = await response.json();

      if (data.success) {
        const email = jiraSettings.email || data.user?.email || '';
        updateConnectorSettings('jira', { ...jiraSettings, email, connected: true });
        setSuccess('JIRA connected successfully!');
      } else {
        setError(data.message || 'Failed to connect to JIRA');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to JIRA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = (connectorId: string) => {
    const currentSettings = getConnectorSettings(connectorId);
    updateConnectorSettings(connectorId, { ...currentSettings, connected: false });
    setSuccess(`${CONNECTORS.find(c => c.id === connectorId)?.name} disconnected`);
    if (onDisconnect) {
      onDisconnect(connectorId);
    }
  };

  const handleClearSettings = (connectorId: string) => {
    const newSettings = { ...settings };
    delete newSettings[connectorId];
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSuccess('Settings cleared');
  };

  // Template handlers
  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.route || !newTemplate.content) {
      setError('Please fill in all template fields');
      return;
    }

    const template: Template = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      route: newTemplate.route,
      content: newTemplate.content,
      isBuiltIn: false
    };

    const customTemplates = templates.filter(t => !t.isBuiltIn);
    const updatedCustom = [...customTemplates, template];
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updatedCustom));
    setTemplates([...BUILT_IN_TEMPLATES, ...updatedCustom]);
    setShowNewTemplateForm(false);
    setNewTemplate({ name: '', route: '', content: '' });
    setSuccess('Template saved successfully!');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isBuiltIn) return;

    const customTemplates = templates.filter(t => !t.isBuiltIn && t.id !== templateId);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customTemplates));
    setTemplates([...BUILT_IN_TEMPLATES, ...customTemplates]);
    setSuccess('Template deleted');
  };

  const handleCopyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    setCopiedTemplateId(template.id);
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  // Handlers for each connector
  const handleSaveConfluenceSettings = async () => {
    const connSettings = getConnectorSettings('confluence');
    if (!connSettings.domain || !connSettings.apiToken) {
      setError('Please enter Domain and API Token');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/confluence/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: connSettings.domain,
          email: connSettings.email || '',
          api_token: connSettings.apiToken
        }),
      });
      const data = await response.json();
      if (data.success) {
        updateConnectorSettings('confluence', { ...connSettings, connected: true });
        setSuccess('Confluence connected successfully!');
      } else {
        setError(data.message || 'Failed to connect to Confluence');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Confluence');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGitHubSettings = () => {
    const connSettings = getConnectorSettings('github');
    if (!connSettings.token) {
      setError('Please enter your Personal Access Token');
      return;
    }
    updateConnectorSettings('github', { ...connSettings, connected: true });
    setSuccess('GitHub connected successfully!');
  };

  const handleSaveGDriveSettings = () => {
    const connSettings = getConnectorSettings('gdrive');
    if (!connSettings.email || !connSettings.credentials) {
      setError('Please enter Email and Service Account JSON');
      return;
    }
    updateConnectorSettings('gdrive', { ...connSettings, connected: true });
    setSuccess('Google Drive connected successfully!');
  };

  const handleSaveVectorDBSettings = () => {
    const connSettings = getConnectorSettings('vectordb');
    if (!connSettings.provider || !connSettings.apiKey) {
      setError('Please enter Provider and API Key');
      return;
    }
    updateConnectorSettings('vectordb', { ...connSettings, connected: true });
    setSuccess('Vector DB connected successfully!');
  };

  const handleSaveSQLDBSettings = () => {
    const connSettings = getConnectorSettings('sqldb');
    if (!connSettings.type || !connSettings.host || !connSettings.database || !connSettings.username) {
      setError('Please fill in required fields');
      return;
    }
    updateConnectorSettings('sqldb', { ...connSettings, connected: true });
    setSuccess('SQL Database connected successfully!');
  };

  const handleSaveKnowledgeGraphSettings = () => {
    const connSettings = getConnectorSettings('knowledgegraph');
    if (!connSettings.provider || !connSettings.uri) {
      setError('Please enter Provider and Connection URI');
      return;
    }
    updateConnectorSettings('knowledgegraph', { ...connSettings, connected: true });
    setSuccess('Knowledge Graph connected successfully!');
  };

  const handleSaveExternalAPISettings = () => {
    const connSettings = getConnectorSettings('externalapi');
    if (!connSettings.name || !connSettings.baseUrl) {
      setError('Please enter API Name and Base URL');
      return;
    }
    updateConnectorSettings('externalapi', { ...connSettings, connected: true });
    setSuccess('External API connected successfully!');
  };

  const renderJIRASettings = () => {
    const jiraSettings = getConnectorSettings('jira');

    return (
      <div className="space-y-4">
        {jiraSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to JIRA</span>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Organization ID</Label>
          <Input
            placeholder="your-company"
            value={jiraSettings.orgId || ''}
            onChange={(e) => updateConnectorSettings('jira', { ...jiraSettings, orgId: e.target.value })}
            disabled={jiraSettings.connected}
          />
          <p className="text-xs text-gray-500">Part before .atlassian.net</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">API Key</Label>
          <Input
            type="password"
            placeholder="Enter your API token"
            value={jiraSettings.apiKey || ''}
            onChange={(e) => updateConnectorSettings('jira', { ...jiraSettings, apiKey: e.target.value })}
            disabled={jiraSettings.connected}
          />
          <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Generate API token <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Email <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input
            type="email"
            placeholder="your-email@company.com"
            value={jiraSettings.email || ''}
            onChange={(e) => updateConnectorSettings('jira', { ...jiraSettings, email: e.target.value })}
            disabled={jiraSettings.connected}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {jiraSettings.connected ? (
            <>
              <Button variant="outline" onClick={() => handleDisconnect('jira')} className="flex-1">Disconnect</Button>
              <Button variant="destructive" onClick={() => handleClearSettings('jira')} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />Clear
              </Button>
            </>
          ) : (
            <Button onClick={handleSaveJIRASettings} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</> : <><Save className="h-4 w-4 mr-2" />Save & Connect</>}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderConfluenceSettings = () => {
    const connSettings = getConnectorSettings('confluence');
    return (
      <div className="space-y-4">
        {connSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to Confluence</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Domain</Label>
          <Input placeholder="your-company.atlassian.net" value={connSettings.domain || ''} onChange={(e) => updateConnectorSettings('confluence', { ...connSettings, domain: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Email</Label>
          <Input type="email" placeholder="your-email@company.com" value={connSettings.email || ''} onChange={(e) => updateConnectorSettings('confluence', { ...connSettings, email: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">API Token</Label>
          <Input type="password" placeholder="Enter your API token" value={connSettings.apiToken || ''} onChange={(e) => updateConnectorSettings('confluence', { ...connSettings, apiToken: e.target.value })} disabled={connSettings.connected} />
          <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Generate API token <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
        {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" /><span>{success}</span></div>}
        <div className="flex gap-3 pt-4">
          {connSettings.connected ? (
            <><Button variant="outline" onClick={() => handleDisconnect('confluence')} className="flex-1">Disconnect</Button><Button variant="destructive" onClick={() => handleClearSettings('confluence')} className="flex-1"><Trash2 className="h-4 w-4 mr-2" />Clear</Button></>
          ) : (
            <Button onClick={handleSaveConfluenceSettings} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</> : <><Save className="h-4 w-4 mr-2" />Save & Connect</>}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderGDriveSettings = () => {
    const connSettings = getConnectorSettings('gdrive');
    return (
      <div className="space-y-4">
        {connSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to Google Drive</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Email</Label>
          <Input type="email" placeholder="your-email@gmail.com" value={connSettings.email || ''} onChange={(e) => updateConnectorSettings('gdrive', { ...connSettings, email: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Service Account JSON</Label>
          <Input placeholder='{"type": "service_account", ...}' value={connSettings.credentials || ''} onChange={(e) => updateConnectorSettings('gdrive', { ...connSettings, credentials: e.target.value })} disabled={connSettings.connected} />
          <p className="text-xs text-gray-500">Paste your Google Cloud service account JSON key</p>
        </div>
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
        {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" /><span>{success}</span></div>}
        <div className="flex gap-3 pt-4">
          {connSettings.connected ? (
            <><Button variant="outline" onClick={() => handleDisconnect('gdrive')} className="flex-1">Disconnect</Button><Button variant="destructive" onClick={() => handleClearSettings('gdrive')} className="flex-1"><Trash2 className="h-4 w-4 mr-2" />Clear</Button></>
          ) : (
            <Button onClick={handleSaveGDriveSettings} className="w-full bg-green-600 hover:bg-green-700"><Save className="h-4 w-4 mr-2" />Save & Connect</Button>
          )}
        </div>
      </div>
    );
  };

  const renderGitHubSettings = () => {
    const connSettings = getConnectorSettings('github');
    return (
      <div className="space-y-4">
        {connSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to GitHub</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Personal Access Token</Label>
          <Input type="password" placeholder="ghp_xxxx..." value={connSettings.token || ''} onChange={(e) => updateConnectorSettings('github', { ...connSettings, token: e.target.value })} disabled={connSettings.connected} />
          <p className="text-xs text-gray-500">Generate from GitHub Settings → Developer settings → Personal access tokens</p>
        </div>
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
        {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" /><span>{success}</span></div>}
        <div className="flex gap-3 pt-4">
          {connSettings.connected ? (
            <><Button variant="outline" onClick={() => handleDisconnect('github')} className="flex-1">Disconnect</Button><Button variant="destructive" onClick={() => handleClearSettings('github')} className="flex-1"><Trash2 className="h-4 w-4 mr-2" />Clear</Button></>
          ) : (
            <Button onClick={handleSaveGitHubSettings} className="w-full bg-gray-700 hover:bg-gray-800"><Save className="h-4 w-4 mr-2" />Save & Connect</Button>
          )}
        </div>
      </div>
    );
  };

  const renderVectorDBSettings = () => {
    const connSettings = getConnectorSettings('vectordb');
    return (
      <div className="space-y-4">
        {connSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to Vector DB</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Provider</Label>
          <Input placeholder="pinecone, weaviate, qdrant" value={connSettings.provider || ''} onChange={(e) => updateConnectorSettings('vectordb', { ...connSettings, provider: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">API Key</Label>
          <Input type="password" placeholder="Your API key" value={connSettings.apiKey || ''} onChange={(e) => updateConnectorSettings('vectordb', { ...connSettings, apiKey: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Endpoint <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input placeholder="https://your-vector-db.com" value={connSettings.endpoint || ''} onChange={(e) => updateConnectorSettings('vectordb', { ...connSettings, endpoint: e.target.value })} disabled={connSettings.connected} />
        </div>
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
        {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" /><span>{success}</span></div>}
        <div className="flex gap-3 pt-4">
          {connSettings.connected ? (
            <><Button variant="outline" onClick={() => handleDisconnect('vectordb')} className="flex-1">Disconnect</Button><Button variant="destructive" onClick={() => handleClearSettings('vectordb')} className="flex-1"><Trash2 className="h-4 w-4 mr-2" />Clear</Button></>
          ) : (
            <Button onClick={handleSaveVectorDBSettings} className="w-full bg-purple-600 hover:bg-purple-700"><Save className="h-4 w-4 mr-2" />Save & Connect</Button>
          )}
        </div>
      </div>
    );
  };

  const renderSQLDBSettings = () => {
    const connSettings = getConnectorSettings('sqldb');
    return (
      <div className="space-y-4">
        {connSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to SQL Database</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Database Type</Label>
          <Input placeholder="postgresql, mysql, mssql" value={connSettings.type || ''} onChange={(e) => updateConnectorSettings('sqldb', { ...connSettings, type: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Host</Label>
            <Input placeholder="localhost" value={connSettings.host || ''} onChange={(e) => updateConnectorSettings('sqldb', { ...connSettings, host: e.target.value })} disabled={connSettings.connected} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Port</Label>
            <Input placeholder="5432" value={connSettings.port || ''} onChange={(e) => updateConnectorSettings('sqldb', { ...connSettings, port: e.target.value })} disabled={connSettings.connected} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Database</Label>
            <Input placeholder="mydb" value={connSettings.database || ''} onChange={(e) => updateConnectorSettings('sqldb', { ...connSettings, database: e.target.value })} disabled={connSettings.connected} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Username</Label>
            <Input placeholder="user" value={connSettings.username || ''} onChange={(e) => updateConnectorSettings('sqldb', { ...connSettings, username: e.target.value })} disabled={connSettings.connected} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Password</Label>
            <Input type="password" placeholder="••••••••" value={connSettings.password || ''} onChange={(e) => updateConnectorSettings('sqldb', { ...connSettings, password: e.target.value })} disabled={connSettings.connected} />
          </div>
        </div>
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
        {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" /><span>{success}</span></div>}
        <div className="flex gap-3 pt-4">
          {connSettings.connected ? (
            <><Button variant="outline" onClick={() => handleDisconnect('sqldb')} className="flex-1">Disconnect</Button><Button variant="destructive" onClick={() => handleClearSettings('sqldb')} className="flex-1"><Trash2 className="h-4 w-4 mr-2" />Clear</Button></>
          ) : (
            <Button onClick={handleSaveSQLDBSettings} className="w-full bg-orange-600 hover:bg-orange-700"><Save className="h-4 w-4 mr-2" />Save & Connect</Button>
          )}
        </div>
      </div>
    );
  };

  const renderKnowledgeGraphSettings = () => {
    const connSettings = getConnectorSettings('knowledgegraph');
    return (
      <div className="space-y-4">
        {connSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to Knowledge Graph</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Provider</Label>
          <Input placeholder="neo4j, amazon-neptune" value={connSettings.provider || ''} onChange={(e) => updateConnectorSettings('knowledgegraph', { ...connSettings, provider: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Connection URI</Label>
          <Input placeholder="bolt://localhost:7687" value={connSettings.uri || ''} onChange={(e) => updateConnectorSettings('knowledgegraph', { ...connSettings, uri: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Username</Label>
            <Input placeholder="neo4j" value={connSettings.username || ''} onChange={(e) => updateConnectorSettings('knowledgegraph', { ...connSettings, username: e.target.value })} disabled={connSettings.connected} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Password</Label>
            <Input type="password" placeholder="••••••••" value={connSettings.password || ''} onChange={(e) => updateConnectorSettings('knowledgegraph', { ...connSettings, password: e.target.value })} disabled={connSettings.connected} />
          </div>
        </div>
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
        {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" /><span>{success}</span></div>}
        <div className="flex gap-3 pt-4">
          {connSettings.connected ? (
            <><Button variant="outline" onClick={() => handleDisconnect('knowledgegraph')} className="flex-1">Disconnect</Button><Button variant="destructive" onClick={() => handleClearSettings('knowledgegraph')} className="flex-1"><Trash2 className="h-4 w-4 mr-2" />Clear</Button></>
          ) : (
            <Button onClick={handleSaveKnowledgeGraphSettings} className="w-full bg-indigo-600 hover:bg-indigo-700"><Save className="h-4 w-4 mr-2" />Save & Connect</Button>
          )}
        </div>
      </div>
    );
  };

  const renderExternalAPISettings = () => {
    const connSettings = getConnectorSettings('externalapi');
    return (
      <div className="space-y-4">
        {connSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to External API</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">API Name</Label>
          <Input placeholder="My Custom API" value={connSettings.name || ''} onChange={(e) => updateConnectorSettings('externalapi', { ...connSettings, name: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Base URL</Label>
          <Input placeholder="https://api.example.com" value={connSettings.baseUrl || ''} onChange={(e) => updateConnectorSettings('externalapi', { ...connSettings, baseUrl: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">API Key <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input type="password" placeholder="Your API key" value={connSettings.apiKey || ''} onChange={(e) => updateConnectorSettings('externalapi', { ...connSettings, apiKey: e.target.value })} disabled={connSettings.connected} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input placeholder="What does this API do?" value={connSettings.description || ''} onChange={(e) => updateConnectorSettings('externalapi', { ...connSettings, description: e.target.value })} disabled={connSettings.connected} />
        </div>
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
        {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle className="h-4 w-4 flex-shrink-0" /><span>{success}</span></div>}
        <div className="flex gap-3 pt-4">
          {connSettings.connected ? (
            <><Button variant="outline" onClick={() => handleDisconnect('externalapi')} className="flex-1">Disconnect</Button><Button variant="destructive" onClick={() => handleClearSettings('externalapi')} className="flex-1"><Trash2 className="h-4 w-4 mr-2" />Clear</Button></>
          ) : (
            <Button onClick={handleSaveExternalAPISettings} className="w-full bg-red-600 hover:bg-red-700"><Save className="h-4 w-4 mr-2" />Save & Connect</Button>
          )}
        </div>
      </div>
    );
  };

  const renderGenericSettings = (connector: typeof CONNECTORS[0]) => {
    const connectorSettings = getConnectorSettings(connector.id);

    // For now, show placeholder UI for other connectors
    return (
      <div className="space-y-4">
        {connectorSettings.connected && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Connected to {connector.name}</span>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <connector.icon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">{connector.description}</p>
          <p className="text-xs text-gray-400 mt-2">Configuration coming soon</p>
        </div>

        <div className="flex gap-3 pt-4">
          {connectorSettings.connected ? (
            <>
              <Button variant="outline" onClick={() => handleDisconnect(connector.id)} className="flex-1">Disconnect</Button>
              <Button variant="destructive" onClick={() => handleClearSettings(connector.id)} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />Clear
              </Button>
            </>
          ) : (
            <Button disabled className="w-full">
              <Save className="h-4 w-4 mr-2" />Coming Soon
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    if (activeSection === 'templates') {
      return renderTemplatesSection();
    }

    switch (activeTab) {
      case 'jira':
        return renderJIRASettings();
      case 'confluence':
        return renderConfluenceSettings();
      case 'gdrive':
        return renderGDriveSettings();
      case 'github':
        return renderGitHubSettings();
      case 'vectordb':
        return renderVectorDBSettings();
      case 'sqldb':
        return renderSQLDBSettings();
      case 'knowledgegraph':
        return renderKnowledgeGraphSettings();
      case 'externalapi':
        return renderExternalAPISettings();
      default:
        return null;
    }
  };

  const renderTemplatesSection = () => {
    const customTemplates = templates.filter(t => !t.isBuiltIn);
    const builtInTemplates = templates.filter(t => t.isBuiltIn);

    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* New Template Form */}
        {showNewTemplateForm ? (
          <div className="p-4 border border-gray-200 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Create New Template</h3>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Template Name</Label>
              <Input
                placeholder="My Custom Template"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Route (e.g., @jira, @github)</Label>
              <Input
                placeholder="@jira"
                value={newTemplate.route}
                onChange={(e) => setNewTemplate({ ...newTemplate, route: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Template Content</Label>
              <textarea
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your template content here... Use {{variable}} for placeholders."
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewTemplateForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />Save Template
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowNewTemplateForm(true)} className="w-full bg-gray-700 hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />Create New Template
          </Button>
        )}

        {/* Built-in Templates */}
        {builtInTemplates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Built-in Templates</h4>
            <div className="space-y-2">
              {builtInTemplates.map((template) => (
                <div key={template.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">{template.name}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{template.route}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                      className="ml-2"
                    >
                      {copiedTemplateId === template.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Templates */}
        {customTemplates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Custom Templates</h4>
            <div className="space-y-2">
              {customTemplates.map((template) => (
                <div key={template.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">{template.name}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">{template.route}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.content}</p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyTemplate(template)}
                      >
                        {copiedTemplateId === template.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-700 to-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <p className="text-xs text-gray-300">Configure your connected tools</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveSection('tools')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeSection === 'tools'
                ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Settings className="h-4 w-4" />
            Tools
          </button>
          <button
            onClick={() => setActiveSection('templates')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeSection === 'templates'
                ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            <FileText className="h-4 w-4" />
            Templates
          </button>
        </div>

        {/* Tabs - Only show in Tools section */}
        {activeSection === 'tools' && (
          <div className="flex border-b border-gray-200 overflow-x-auto" ref={tabsRef}>
            {CONNECTORS.map((connector) => {
              const connectorSettings = getConnectorSettings(connector.id);
              return (
                <button
                  key={connector.id}
                  data-tab={connector.id}
                  onClick={() => setActiveTab(connector.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === connector.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <connector.icon className="h-4 w-4" />
                  {connector.name}
                  {connectorSettings.connected && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {renderSettings()}
        </div>
      </div>
    </>
  );
}
