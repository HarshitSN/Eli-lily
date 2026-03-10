"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bankingVoiceApi } from "@/lib/api";
import { 
  Phone, 
  PhoneCall, 
  Send, 
  CheckCircle, 
  RefreshCw, 
  DollarSign, 
  MessageSquare 
} from "lucide-react";

interface CallResponse {
  call_id: string;
  customer_phone: string;
  customer_name: string;
  classification: {
    category: string;
    priority: string;
    requires_response: boolean;
    key_topics: string[];
    sentiment: string;
    mode: string;
  };
  transcript: string;
  completed: boolean;
  auto_call_enabled: boolean;
  response_tone: string;
  processed_at: string;
  payment_commitment?: {
    amount: number;
    date: string;
    method: string;
  };
  customer_response?: string;
}

interface CallAgentStatus {
  is_running: boolean;
  total_runs: number;
  calls_processed: number;
  last_check: string | null;
  real_vapi_configured: boolean;
  llm_model: string;
  vapi_server: string;
  service_active: boolean;
}

export default function BankingVoiceDashboard() {
  const [messages, setMessages] = useState<{role: 'agent'|'user', text: string, time: string}[]>([
    { role: 'agent', text: "Hi! I'm your Banking Voice Agent. Call me directly at +1 341-837-9258 for debt collection assistance. Or enter your number below and I'll call you back.", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
  ]);
  const [input, setInput] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calls, setCalls] = useState<CallResponse[]>([]);
  const [status, setStatus] = useState<CallAgentStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // API calls
  interface BankingVoiceResponse {
    status: string;
    message: string;
    data: any;
  }

  const fetchHistory = async () => {
    try {
      const data = await bankingVoiceApi.getHistory() as BankingVoiceResponse;
      if (data.status === 'success') {
        setCalls(data.data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setCalls([]);
    }
  };

  const fetchStatus = async () => {
    try {
      const data = await bankingVoiceApi.getStatus() as BankingVoiceResponse;
      if (data.status === 'success') {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setStatus({
        is_running: false,
        total_runs: 0,
        calls_processed: 0,
        last_check: null,
        real_vapi_configured: false,
        llm_model: 'Unknown',
        vapi_server: 'Unknown',
        service_active: false
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      text: input.trim(),
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Extract phone number from user input
    const phoneMatch = input.match(/(\+?\d{10,15})/);
    const phoneNumber = phoneMatch ? phoneMatch[1] : userPhone;
    
    if (!phoneNumber) {
      const errorMessage = {
        role: 'agent' as const,
        text: "Please provide a valid phone number (e.g., +1234567890)",
        time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add agent thinking message
    const thinkingMessage = {
      role: 'agent' as const,
      text: `Initiating call to ${phoneNumber}...`,
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    };
    setMessages(prev => [...prev, thinkingMessage]);
    setIsLoading(true);

    try {
      const data = await bankingVoiceApi.run({action: 'call_user', phone_number: phoneNumber}) as BankingVoiceResponse;
      
      if (data.status === 'success') {
        const resultMessage = {
          role: 'agent' as const,
          text: `✓ Call initiated! ID: ${data.data.calls?.[0]?.call_id || 'unknown'}. You should receive the call shortly.`,
          time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
        };
        setMessages(prev => [...prev, resultMessage]);
        await fetchHistory();
        await fetchStatus();
      } else {
        const errorMessage = {
          role: 'agent' as const,
          text: `✗ Call failed: ${data.message || 'Unknown error'}`,
          time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        role: 'agent' as const,
        text: `✗ Call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  const completedCalls = calls.filter(call => call.completed).length;
  const lastCheck = status?.last_check ? new Date(status.last_check).toLocaleString() : "Never";

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Banking Voice Agent</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Vapi Connected</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchStatus(); fetchHistory(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content - Split Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-96 flex flex-col border-r border-gray-200 bg-white">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Agent Chat
            </h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <p className="text-sm">Processing call...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
            <input
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="Your phone number (e.g., +1234567890)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
            <div className="flex space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or phone number..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-green-600 hover:bg-green-700 px-4 py-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {/* Stats Cards */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Total Calls</p>
                      <p className="text-2xl font-bold">{status?.calls_processed ?? 0}</p>
                    </div>
                    <PhoneCall className="h-5 w-5 opacity-70" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Completed</p>
                      <p className="text-2xl font-bold">{completedCalls}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 opacity-70" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Last Check</p>
                      <p className="text-sm font-bold truncate">{lastCheck}</p>
                    </div>
                    <RefreshCw className="h-5 w-5 opacity-70" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Vapi</p>
                      <p className="text-lg font-bold">{status?.real_vapi_configured ? "Connected" : "Demo"}</p>
                    </div>
                    <Phone className="h-5 w-5 opacity-70" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call Results */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <PhoneCall className="h-4 w-4 mr-2" />
              Call Results ({calls.length})
            </h3>

            {calls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No calls yet. Start a conversation to initiate a call.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calls.map((call) => (
                  <Card key={call.call_id} className="bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{call.customer_name}</h4>
                          <p className="text-sm text-gray-600">{call.customer_phone} · {new Date(call.processed_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {call.completed && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          <Badge className={
                            call.classification.priority === 'high' ? 'bg-red-100 text-red-800' :
                            call.classification.priority === 'medium' ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {call.classification.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">TRANSCRIPT</h5>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {call.transcript.length > 200 ? call.transcript.substring(0, 200) + '...' : call.transcript}
                        </p>
                      </div>

                      {call.payment_commitment && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            PAYMENT COMMITMENT
                          </h5>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Amount:</span> ${call.payment_commitment.amount.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {call.payment_commitment.date}
                            </div>
                            <div>
                              <span className="font-medium">Method:</span> {call.payment_commitment.method}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
