import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileSpreadsheet, File, X, Loader2, Plus, Files, Database, Globe, Sparkles, BarChart3, MessageSquare, ArrowRight, Shield, Activity, Bot, FolderOpen, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface DataUploaderProps {
  onFileUpload: (files: File[]) => void;
  isLoading: boolean;
}

type DataSource = 'upload' | 'postgres' | 'api' | 's3' | null;

export function DataUploader({ onFileUpload, isLoading }: DataUploaderProps) {
  const [source, setSource] = useState<DataSource>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  // PostgreSQL connection state
  const [pgConfig, setPgConfig] = useState({
    host: 'localhost',
    port: '5432',
    database: '',
    username: '',
    password: '',
    table: '',
  });

  // External API connection state
  const [apiConfig, setApiConfig] = useState({
    endpoint: '',
    apiKey: '',
    method: 'GET',
  });

  // S3 connection state
  const [s3Config, setS3Config] = useState({
    connected: false,
    currentPath: '',
    folders: [] as { name: string; key: string; is_folder: boolean }[],
    files: [] as { name: string; key: string; is_folder: boolean; size?: number }[],
    selectedFiles: [] as string[],
    loading: false,
    s3Error: null as string | null,
  });

  const handleSourceSelect = (newSource: DataSource) => {
    setSource(newSource);
    setSheetOpen(true);
    if (newSource === 's3') {
      handleS3Connect();
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSource(null);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(
        file => file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      if (files.length > 0) {
        setSelectedFiles(prev => [...prev, ...files]);
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        file => file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      if (files.length > 0) {
        setSelectedFiles(prev => [...prev, ...files]);
      }
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length > 0) {
      setUploadProgress('Analyzing your data...');
      try {
        await onFileUpload(selectedFiles);
      } finally {
        setUploadProgress('');
      }
    }
  }, [selectedFiles, onFileUpload]);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // PostgreSQL connection handler
  const handlePostgresConnect = async () => {
    if (!pgConfig.database || !pgConfig.username) return;
    
    setError(null);
    setUploadProgress('Connecting to PostgreSQL database...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/report/connect-postgres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pgConfig),
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to database');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Backend returns processed data directly
        // We need to call onFileUpload with a constructed file or handle differently
        setUploadProgress('Processing data...');
        // Create a simple JSON file for the backend to process
        const jsonStr = JSON.stringify(result.data.preview || []);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const file = new globalThis.File([blob], `${pgConfig.database}_export.json`, { type: 'application/json' });
        await onFileUpload([file]);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to database. Please check your credentials.');
    } finally {
      setUploadProgress('');
    }
  };

  // External API connection handler
  const handleApiConnect = async () => {
    if (!apiConfig.endpoint) return;
    
    setError(null);
    setUploadProgress('Connecting to external API...');
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiConfig.apiKey) {
        headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/report/connect-api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: apiConfig.endpoint,
          method: apiConfig.method,
          headers: apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {}
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setUploadProgress('Processing data...');
        // Create a simple JSON file for the backend to process
        const jsonStr = JSON.stringify(result.data.preview || []);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const file = new globalThis.File([blob], 'api_export.json', { type: 'application/json' });
        await onFileUpload([file]);
      } else {
        throw new Error(result.error || 'Failed to fetch data from API');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to external API. Please check the endpoint and credentials.');
    } finally {
      setUploadProgress('');
    }
  };

  // S3 connection and navigation handlers
  const handleS3Connect = async () => {
    setError(null);
    setS3Config(prev => ({ ...prev, loading: true, s3Error: null }));
    
    try {
      // Check S3 status first
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/s3/status`);
      const statusResult = await statusResponse.json();
      
      if (!statusResult.connected) {
        setS3Config(prev => ({ 
          ...prev, 
          loading: false, 
          s3Error: 'S3 is not configured. Please set AWS credentials in the .env file.' 
        }));
        return;
      }
      
      // Load initial objects (root folder)
      const response = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/s3/objects?prefix=`);
      const result = await response.json();
      
      if (result.success) {
        setS3Config(prev => ({ 
          ...prev, 
          connected: true,
          loading: false,
          currentPath: '',
          folders: result.folders || [],
          files: result.files || [],
          selectedFiles: []
        }));
      } else {
        setS3Config(prev => ({ 
          ...prev, 
          loading: false, 
          s3Error: result.error || 'Failed to connect to S3' 
        }));
      }
    } catch (err: any) {
      setS3Config(prev => ({ 
        ...prev, 
        loading: false, 
        s3Error: err.message || 'Failed to connect to S3' 
      }));
    }
  };

  const handleS3Navigate = async (prefix: string) => {
    setS3Config(prev => ({ ...prev, loading: true, s3Error: null }));
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/s3/objects?prefix=${encodeURIComponent(prefix)}`);
      const result = await response.json();
      
      if (result.success) {
        setS3Config(prev => ({ 
          ...prev, 
          loading: false,
          currentPath: prefix,
          folders: result.folders || [],
          files: result.files || [],
          selectedFiles: []
        }));
      } else {
        setS3Config(prev => ({ 
          ...prev, 
          loading: false, 
          s3Error: result.error || 'Failed to navigate to folder' 
        }));
      }
    } catch (err: any) {
      setS3Config(prev => ({ 
        ...prev, 
        loading: false, 
        s3Error: err.message || 'Failed to navigate to folder' 
      }));
    }
  };

  const handleS3GoBack = async () => {
    const currentPath = s3Config.currentPath;
    
    // Calculate parent path
    if (!currentPath) return;
    
    // Remove trailing slash and get parent folder
    const pathParts = currentPath.replace(/\/$/, '').split('/');
    pathParts.pop();
    const parentPath = pathParts.length > 0 ? pathParts.join('/') + '/' : '';
    
    await handleS3Navigate(parentPath);
  };

  const toggleS3FileSelection = (key: string) => {
    setS3Config(prev => {
      const isSelected = prev.selectedFiles.includes(key);
      return {
        ...prev,
        selectedFiles: isSelected 
          ? prev.selectedFiles.filter(f => f !== key)
          : [...prev.selectedFiles, key]
      };
    });
  };

  const handleS3Upload = async () => {
    if (s3Config.selectedFiles.length === 0) return;
    
    setError(null);
    setUploadProgress('Downloading files from S3...');
    setS3Config(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/report/connect-s3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: s3Config.selectedFiles }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUploadProgress('Processing data...');
        
        // Create files from the response
        const files: File[] = [];
        
        if (result.data.files && result.data.files.length > 0) {
          // Multiple files
          for (const fileData of result.data.files) {
            const content = fileData.content;
            let blob: Blob;
            
            if (fileData.type === 'csv' || fileData.type === 'json') {
              blob = new Blob([content], { type: 'text/csv' });
            } else {
              // Excel - content is base64
              const binaryString = atob(fileData.content);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            }
            
            files.push(new globalThis.File([blob], fileData.file_name, { 
              type: fileData.type === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }));
          }
        } else if (result.data.preview) {
          // Single file case - use the actual filename from the response
          const filename = result.data.filename || 's3_data.json';
          const jsonStr = JSON.stringify(result.data.preview);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          files.push(new globalThis.File([blob], filename, { type: 'application/json' }));
        }
        
        if (files.length > 0) {
          await onFileUpload(files);
        } else {
          throw new Error('No valid files were loaded');
        }
      } else {
        throw new Error(result.error || 'Failed to download files from S3');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download files from S3');
    } finally {
      setUploadProgress('');
      setS3Config(prev => ({ ...prev, loading: false }));
    }
  };

  const handleBack = () => {
    setSource(null);
    setSheetOpen(false);
    setError(null);
    setSelectedFiles([]);
    setPgConfig({
      host: 'localhost',
      port: '5432',
      database: '',
      username: '',
      password: '',
      table: '',
    });
    setApiConfig({
      endpoint: '',
      apiKey: '',
      method: 'GET',
    });
    setS3Config({
      connected: false,
      currentPath: '',
      folders: [],
      files: [],
      selectedFiles: [],
      loading: false,
      s3Error: null,
    });
  };

  // Show data source selection if no source selected
  if (!source && selectedFiles.length === 0) {
    return (
      <div className="flex flex-wrap gap-6 justify-center items-start h-full p-8">
        {/* Connect Your Data Card */}
        <Card className="w-full max-w-md flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-center text-base font-semibold">Connect Your Data</CardTitle>
            <p className="text-center text-slate-500 text-sm mt-1">
              Choose how you want to provide data for analysis
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => handleSourceSelect('upload')}
              className="w-full h-12 text-sm flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="h-5 w-5" />
              Upload CSV/Excel Files
            </Button>
            <Button 
              onClick={() => handleSourceSelect('postgres')}
              variant="outline"
              className="w-full h-12 text-sm flex items-center justify-center gap-2"
            >
              <Database className="h-5 w-5" />
              Connect PostgreSQL Database
            </Button>
            <Button 
              onClick={() => handleSourceSelect('api')}
              variant="outline"
              className="w-full h-12 text-sm flex items-center justify-center gap-2"
            >
              <Globe className="h-5 w-5" />
              Connect External API
            </Button>
            <Button 
              onClick={() => handleSourceSelect('s3')}
              variant="outline"
              className="w-full h-12 text-sm flex items-center justify-center gap-2"
            >
              <FolderOpen className="h-5 w-5" />
              Connect S3 Bucket
            </Button>
          </CardContent>
        </Card>

        {/* Flow Chart */}
        <Card className="flex-1 min-w-[500px] max-w-3xl">
          <CardHeader>
            <CardTitle className="text-center text-lg font-semibold">
              <Shield className="h-5 w-5 inline mr-2 text-blue-600" />
              How ReportAI Agent Works
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Upload className="h-7 w-7 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">1. Data Input</span>
                <span className="text-xs text-slate-500 text-center">CSV, Database<br/>or API</span>
              </div>
              
              <ArrowRight className="h-5 w-5 text-slate-400" />
              
              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <Activity className="h-7 w-7 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">2. AI Analysis</span>
                <span className="text-xs text-slate-500 text-center">Schema Detection<br/>& Correlations</span>
              </div>
              
              <ArrowRight className="h-5 w-5 text-slate-400" />
              
              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                  <BarChart3 className="h-7 w-7 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">3. Visualizations</span>
                <span className="text-xs text-slate-500 text-center">Auto-generated<br/>Charts & KPIs</span>
              </div>
              
              <ArrowRight className="h-5 w-5 text-slate-400" />
              
              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">4. AI Assistant</span>
                <span className="text-xs text-slate-500 text-center">Natural Language<br/>Exploration</span>
              </div>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center space-y-2 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Auto Visualizations</p>
                <p className="text-xs text-slate-500">AI picks best charts</p>
              </div>
              <div className="text-center space-y-2 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Smart Insights</p>
                <p className="text-xs text-slate-500">Cross-file correlations</p>
              </div>
              <div className="text-center space-y-2 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Natural Language</p>
                <p className="text-xs text-slate-500">Chat to explore</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sheet for PostgreSQL (rendered as part of main UI)
  // Show API connection form
  if (source === 'api') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Card className="w-full max-w-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Connect to External API
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>API Endpoint URL</Label>
                <Input 
                  value={apiConfig.endpoint}
                  onChange={(e) => setApiConfig({...apiConfig, endpoint: e.target.value})}
                  placeholder="https://api.example.com/data"
                />
              </div>
              <div className="space-y-2">
                <Label>API Key (Optional)</Label>
                <Input 
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
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
                    Connect & Fetch Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sheet for API (rendered as part of main UI - see below)
  // Sheet for S3 (rendered as part of main UI - see below)
  if (source === 's3') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Card className="w-full max-w-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Browse S3 Bucket
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {s3Config.s3Error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
                <p className="font-medium">S3 Connection Error</p>
                <p>{s3Config.s3Error}</p>
                <p className="mt-2 text-xs">Please ensure AWS credentials are set in the .env file:</p>
                <ul className="mt-1 text-xs list-disc list-inside">
                  <li>AWS_ACCESS_KEY_ID</li>
                  <li>AWS_SECRET_ACCESS_KEY</li>
                  <li>AWS_REGION</li>
                  <li>S3_BUCKET_NAME</li>
                </ul>
              </div>
            )}

            {!s3Config.connected && !s3Config.s3Error && (
              <div className="text-center py-8">
                <Button 
                  onClick={handleS3Connect}
                  disabled={s3Config.loading}
                  className="w-full max-w-xs"
                >
                  {s3Config.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting to S3...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Connect to S3 Bucket
                    </>
                  )}
                </Button>
              </div>
            )}

            {s3Config.connected && (
              <div className="space-y-4">
                {/* Breadcrumb navigation */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleS3GoBack}
                    disabled={!s3Config.currentPath}
                    className="p-1 h-8"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <span className="font-medium">{s3Config.currentPath || 'Root'}</span>
                </div>

                {/* Folder list */}
                {s3Config.folders.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase">Folders</p>
                    {s3Config.folders.map((folder) => (
                      <button
                        key={folder.key}
                        onClick={() => handleS3Navigate(folder.key)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 text-left"
                      >
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{folder.name}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}

                {/* File list */}
                {s3Config.files.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase">Files</p>
                    {s3Config.files.map((file) => (
                      <button
                        key={file.key}
                        onClick={() => toggleS3FileSelection(file.key)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          s3Config.selectedFiles.includes(file.key) 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          s3Config.selectedFiles.includes(file.key)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-300'
                        }`}>
                          {s3Config.selectedFiles.includes(file.key) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        <span className="text-sm flex-1">{file.name}</span>
                        {file.size && (
                          <span className="text-xs text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {s3Config.folders.length === 0 && s3Config.files.length === 0 && (
                  <p className="text-center text-slate-500 py-4">
                    No files or folders found in this location
                  </p>
                )}

                {/* Selected files info */}
                {s3Config.selectedFiles.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-slate-600 mb-2">
                      {s3Config.selectedFiles.length} file{s3Config.selectedFiles.length > 1 ? 's' : ''} selected
                    </p>
                    <Button 
                      onClick={handleS3Upload}
                      disabled={s3Config.loading}
                      className="w-full"
                    >
                      {s3Config.loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Selected Files
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sheet for Upload - rendered as part of main UI
  return (
    <>
      {/* Sheet for File Upload */}
      <Sheet open={sheetOpen && source === 'upload'} onOpenChange={(open) => { if (!open) handleSheetClose(); }}>
        <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Upload Your Data</SheetTitle>
            <SheetDescription>Upload CSV or Excel files for AI analysis.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {selectedFiles.length === 0 ? (
              <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 bg-white'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Drag and drop files here</p>
                <p className="text-xs text-slate-500">or click to browse</p>
              </div>
            ) : (
              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">{selectedFiles.length} file(s) selected</span>
                  <button onClick={handleClearAll} className="text-xs text-slate-500">Clear all</button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <File className="w-4 h-4 text-blue-600" /><span className="text-xs flex-1 truncate">{file.name}</span>
                      <button onClick={() => handleRemoveFile(idx)}><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedFiles.length > 0 && <Button onClick={handleUpload} disabled={isLoading} className="w-full">{isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Analyze {selectedFiles.length} file(s)</Button>}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet for PostgreSQL */}
      <Sheet open={sheetOpen && source === 'postgres'} onOpenChange={(open) => { if (!open) handleSheetClose(); }}>
        <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Connect to PostgreSQL</SheetTitle>
            <SheetDescription>Enter your database credentials.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Host</Label><Input value={pgConfig.host} onChange={(e) => setPgConfig({...pgConfig, host: e.target.value})} placeholder="localhost" /></div>
              <div className="space-y-2"><Label>Port</Label><Input value={pgConfig.port} onChange={(e) => setPgConfig({...pgConfig, port: e.target.value})} placeholder="5432" /></div>
              <div className="space-y-2"><Label>Database</Label><Input value={pgConfig.database} onChange={(e) => setPgConfig({...pgConfig, database: e.target.value})} placeholder="my_database" /></div>
              <div className="space-y-2"><Label>Username</Label><Input value={pgConfig.username} onChange={(e) => setPgConfig({...pgConfig, username: e.target.value})} placeholder="postgres" /></div>
            </div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={pgConfig.password} onChange={(e) => setPgConfig({...pgConfig, password: e.target.value})} placeholder="••••••••" /></div>
            <div className="space-y-2"><Label>Table (optional)</Label><Input value={pgConfig.table} onChange={(e) => setPgConfig({...pgConfig, table: e.target.value})} placeholder="Leave empty" /></div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            <Button onClick={handlePostgresConnect} disabled={!pgConfig.database || !pgConfig.username || isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}Connect & Fetch Data
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet for API */}
      <Sheet open={sheetOpen && (source as DataSource) === 'api'} onOpenChange={(open) => { if (!open) handleSheetClose(); }}>
        <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Connect to External API</SheetTitle>
            <SheetDescription>Connect to an external API.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2"><Label>API Endpoint</Label><Input value={apiConfig.endpoint} onChange={(e) => setApiConfig({...apiConfig, endpoint: e.target.value})} placeholder="https://api.example.com/data" /></div>
            <div className="space-y-2"><Label>API Key (Optional)</Label><Input type="password" value={apiConfig.apiKey} onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})} placeholder="Enter API key" /></div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            <Button onClick={handleApiConnect} disabled={!apiConfig.endpoint || isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}Connect & Fetch Data
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet for S3 */}
      <Sheet open={sheetOpen && (source as DataSource) === 's3'} onOpenChange={(open) => { if (!open) handleSheetClose(); }}>
        <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" />Browse S3 Bucket</SheetTitle>
            <SheetDescription>Select files from S3.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {s3Config.s3Error && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4"><p className="font-medium">S3 Error</p><p>{s3Config.s3Error}</p></div>}
            {!s3Config.connected && !s3Config.s3Error && <Button onClick={handleS3Connect} disabled={s3Config.loading} className="w-full">{s3Config.loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FolderOpen className="h-4 w-4 mr-2" />}Connect to S3</Button>}
            {s3Config.connected && (
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={handleS3GoBack} disabled={!s3Config.currentPath}><ArrowRight className="h-4 w-4 rotate-180" /></Button><span className="font-medium text-sm">{s3Config.currentPath || 'Root'}</span></div>
                {s3Config.folders.map((folder) => (<button key={folder.key} onClick={() => handleS3Navigate(folder.key)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100"><FolderOpen className="h-4 w-4 text-blue-500" /><span className="text-sm">{folder.name}</span></button>))}
                {s3Config.files.map((file) => (<button key={file.key} onClick={() => toggleS3FileSelection(file.key)} className={`w-full flex items-center gap-2 p-2 rounded-lg ${s3Config.selectedFiles.includes(file.key) ? 'bg-blue-50 border' : 'hover:bg-slate-100'}`}><div className={`w-4 h-4 rounded border ${s3Config.selectedFiles.includes(file.key) ? 'bg-blue-500' : 'border-slate-300'}`} /><FileSpreadsheet className="h-4 w-4 text-green-600" /><span className="text-sm flex-1">{file.name}</span></button>))}
                {s3Config.selectedFiles.length > 0 && <Button onClick={handleS3Upload} disabled={s3Config.loading} className="w-full mt-4">{s3Config.loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Upload {s3Config.selectedFiles.length} file(s)</Button>}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
