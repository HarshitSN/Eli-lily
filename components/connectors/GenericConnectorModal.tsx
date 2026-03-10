import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface GenericConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: Record<string, string>) => Promise<void>;
  isConnected?: boolean;
  title: string;
  description: string;
  fields: ConnectorField[];
  icon: LucideIcon;
  color: string;
  accentColor: string;
}

export interface ConnectorField {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'password' | 'url';
  required?: boolean;
}

export function GenericConnectorModal({ 
  isOpen, 
  onClose, 
  onConnect, 
  isConnected = false,
  title,
  description,
  fields,
  icon: Icon,
  color,
  accentColor
}: GenericConnectorModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
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
      await onConnect(formData);
      setSuccess(`Successfully connected to ${title}!`);
      setTimeout(() => {
        onClose();
        setFormData({});
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect to ${title}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
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
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r ${accentColor}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Connect to {title}</h2>
              <p className="text-xs text-white/80">
                {isConnected ? 'Already connected' : description}
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
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
                {field.label}
              </Label>
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required={field.required ?? true}
                className="w-full"
              />
            </div>
          ))}

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
              disabled={isLoading || fields.some(f => f.required && !formData[f.id])}
              className={`flex-1 ${accentColor.replace('from-', 'bg-').replace(' to-', '').split(' ')[0]} hover:opacity-90`}
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
      </div>
    </>
  );
}
