import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Bot, User, Sparkles, BarChart2, TrendingUp, Filter, Table, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toDisplayName } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Visualization {
  type: string;
  title: string;
  x_axis?: string;
  y_axis?: string;
  aggregation?: string;
  column?: string;
  description?: string;
}

interface ReportDataSchema {
  fields: Array<{
    name: string;
    dtype: string;
    category: string;
    stats?: any;
  }>;
  numeric_fields: string[];
  categorical_fields: string[];
  date_fields: string[];
}

interface ReportData {
  filename: string;
  row_count: number;
  columns: string[];
  schema: ReportDataSchema;
  visualizations: Visualization[];
  insights: string[];
  narrative: string;
  preview: any[];
}

interface ChatPanelProps {
  data: ReportData;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  lastResponse?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function ChatPanel({ data, onSendMessage, isLoading, lastResponse }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `I've analyzed your ${data.filename} with ${data.row_count} rows. 

**What I can do:**
• Add/remove visualizations
• Filter data by any column
• Create charts (bar, line, pie)
• Add KPI cards
• Export to PDF
• Answer questions about your data


What would you like to do?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const suggs: Array<{label: string; prompt: string}> = [];
    const numeric = data.schema?.numeric_fields || [];
    const categorical = data.schema?.categorical_fields || [];
    const dateFields = data.schema?.date_fields || [];

    if (numeric.length > 0 && categorical.length > 0) {
      const numDisplay = toDisplayName(numeric[0]);
      const catDisplay = toDisplayName(categorical[0]);
      suggs.push({
        label: `Bar: ${numDisplay} by ${catDisplay}`,
        prompt: `Create a bar chart showing ${numeric[0]} by ${categorical[0]}`
      });
    }

    if (dateFields.length > 0 && numeric.length > 0) {
      const numDisplay = toDisplayName(numeric[0]);
      const dateDisplay = toDisplayName(dateFields[0]);
      suggs.push({
        label: `Line: ${numDisplay} over time`,
        prompt: `Show ${numeric[0]} trend over ${dateFields[0]}`
      });
    }

    if (categorical.length > 0) {
      const catDisplay = toDisplayName(categorical[0]);
      suggs.push({
        label: `Pie: ${catDisplay} distribution`,
        prompt: `Show distribution by ${categorical[0]}`
      });
    }

    if (numeric.length > 0) {
      const numDisplay = toDisplayName(numeric[0]);
      suggs.push({
        label: `KPI: Total ${numDisplay}`,
        prompt: `Add a KPI showing total ${numeric[0]}`
      });
    }

    suggs.push({ label: 'Show data table', prompt: 'Create a data table view' });
   

    return suggs.slice(0, 6);
  }, [data.schema]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    onSendMessage(userMessage.content);
    
    const loadingMessage: Message = {
      id: 'loading',
      role: 'system',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);
  }, [input, isLoading, onSendMessage]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id === 'loading') {
        // Generate a contextual response based on what was done
        let responseContent = lastResponse || "I've updated the report based on your request.";
        
        // If no specific response but loading just finished, provide a contextual message
        if (!lastResponse) {
          responseContent = "I've created the visualization based on your query. You can see it in the canvas. Feel free to ask for more charts or modifications!";
        }
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMessage,
            id: Date.now().toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
          };
          return updated;
        });
      }
    }
  }, [isLoading, lastResponse]);

  const quickActions = [
    { icon: BarChart2, label: 'Add Chart', color: 'bg-blue-100 text-blue-600', prompt: 'Add a new visualization' },
    { icon: TrendingUp, label: 'Add KPI', color: 'bg-emerald-100 text-emerald-600', prompt: 'Add a KPI card for' },
    { icon: Filter, label: 'Filter', color: 'bg-purple-100 text-purple-600', prompt: 'Filter data where' },
    { icon: Table, label: 'Table', color: 'bg-orange-100 text-orange-600', prompt: 'Show data in a table' },
  ];

  return (
    <div className="flex h-full">
      {/* Tools Sidebar */}
      <div className="w-72 border-r bg-gradient-to-b from-slate-50 to-white p-4 flex flex-col overflow-y-auto">
        <h3 className="font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          AI Tools
        </h3>
        
        <div className="grid grid-cols-2 gap-2 mb-6">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(action.prompt)}
              disabled={isLoading}
              className="flex flex-col items-center gap-1 p-3 bg-white border rounded-xl hover:bg-slate-50 hover:border-blue-200 transition-all disabled:opacity-50"
            >
              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-600">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Suggestions</h4>
          <div className="space-y-2">
            {suggestions.map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => setInput(sugg.prompt)}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 text-sm bg-white border rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all disabled:opacity-50"
              >
                {sugg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Columns</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.schema?.numeric_fields?.map((col: string) => (
              <div key={col} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-blue-50 text-blue-700 rounded">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                {toDisplayName(col)}
              </div>
            ))}
            {data.schema?.categorical_fields?.map((col: string) => (
              <div key={col} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-purple-50 text-purple-700 rounded">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                {toDisplayName(col)}
              </div>
            ))}
            {data.schema?.date_fields?.map((col: string) => (
              <div key={col} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-emerald-50 text-emerald-700 rounded">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                {toDisplayName(col)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role !== 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                message.role === 'user' ? 'bg-blue-600 text-white' : 
                message.role === 'system' ? 'bg-slate-100 text-slate-800' : 
                'bg-gradient-to-br from-slate-50 to-white border text-slate-800'
              }`}>
                {message.id === 'loading' && isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                ) : (
                  <div className="text-sm">
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p className="mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-blue-600" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        code: ({node, ...props}) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask to modify visualizations..."
                className="w-full px-4 py-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                disabled={isLoading}
              />
              {input && (
                <button type="button" onClick={() => setInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              )}
            </div>
            <Button type="submit" disabled={!input.trim() || isLoading} className="px-6">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send</>}
            </Button>
          </form>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
            <Sparkles className="w-3 h-3" />
            <span>AI-powered • Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
