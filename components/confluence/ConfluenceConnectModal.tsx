import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { File, X, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ConfluenceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: ConfluenceCredentials) => Promise<void>;
  isConnected?: boolean;
}

interface ConfluenceCredentials {
  domain: string;
  email: string;
  api_token: string;
}

export function ConfluenceConnectModal({ isOpen, onClose, onConnect, isConnected = false }: ConfluenceConnectModalProps) {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await onConnect({
        domain: domain.trim(),
        email: email.trim(),
        api_token: apiToken.trim()
      });
      setSuccess('Successfully connected to Confluence!');
      // Close modal after successful connection
      setTimeout(() => {
        onClose();
        // Reset form
        setDomain('');
        setEmail('');
        setApiToken('');
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Confluence');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDomain('');
    setEmail('');
    setApiToken('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const getTokenHelpUrl = () => {
    return 'https://id.atlassian.com/manage-profile/security/api-tokens';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <File className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Connect to Confluence</h2>
              <p className="text-xs text-blue-100">
                {isConnected ? 'Already connected' : 'Enter your Confluence credentials'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="domain" className="text-sm font-medium text-gray-700">
              Confluence Domain
            </Label>
            <Input
              id="domain"
              type="text"
              placeholder="your-company.atlassian.net"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Your Confluence Cloud instance URL
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              The email you use to log into Confluence
            </p>
          </div>

          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="apiToken" className="text-sm font-medium text-gray-700">
              API Token
            </Label>
            <Input
              id="apiToken"
              type="password"
              placeholder="Enter your API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              required
              className="w-full"
            />
            <div className="flex items-center gap-1">
              <a 
                href={getTokenHelpUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                Generate API token
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !domain || !email || !apiToken}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </form>

        {/* Help Text */}
        <div className="px-6 pb-4">
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p className="font-medium mb-1">💡 Quick Help</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your Confluence domain is: <code className="bg-gray-200 px-1 rounded">company.atlassian.net</code></li>
              <li>Generate an API token from your Atlassian account settings</li>
              <li>Your user needs permission to access Confluence spaces</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
