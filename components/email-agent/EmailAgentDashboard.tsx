"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { emailResponderApi } from "@/lib/api";
import { 
  Mail, 
  Send, 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  TrendingUp,
  Filter,
  Inbox,
  SendHorizontal,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Activity,
  Settings,
  Eye,
  Trash2,
  Archive,
  Star,
  Flag,
  Users,
  MessageSquare,
  Zap,
  Target,
  Brain,
  Shield,
  Sparkles,
  Bell,
  Edit,
  X
} from "lucide-react";

interface EmailStats {
  total_emails: number;
  classified: number;
  responses_generated: number;
  responses_sent: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

interface EmailResponse {
  email_id: string;
  from: string;
  subject: string;
  classification: {
    category: string;
    priority: string;
    requires_response: boolean;
    key_topics: string[];
    sentiment: string;
    mode: string;
  };
  draft_response: string;
  sent: boolean;
  auto_send_enabled: boolean;
  response_tone: string;
  processed_at: string;
}

interface EmailAgentStatus {
  is_running: boolean;
  total_runs: number;
  emails_processed: number;
  last_check: string | null;
  real_email_configured: boolean;
  llm_model: string;
  email_server: string;
  service_active: boolean;
}

const categoryColors: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-800",
  complaint: "bg-red-100 text-red-800",
  meeting_request: "bg-purple-100 text-purple-800",
  follow_up: "bg-red-100 text-red-800",
  feedback: "bg-green-100 text-green-800",
  support: "bg-orange-100 text-orange-800",
  introduction: "bg-pink-100 text-pink-800",
  notification: "bg-gray-100 text-gray-800",
  spam: "bg-red-50 text-red-600",
  other: "bg-slate-100 text-slate-800"
};

const priorityColors: Record<string, string> = {
  high: "bg-red-500 text-white",
  medium: "bg-red-500 text-white", 
  low: "bg-green-500 text-white"
};

const sentimentColors: Record<string, string> = {
  positive: "text-green-600",
  neutral: "text-gray-600",
  negative: "text-red-600"
};

const categoryIcons: Record<string, any> = {
  inquiry: MessageSquare,
  complaint: AlertCircle,
  meeting_request: Users,
  follow_up: Clock,
  feedback: TrendingUp,
  support: Shield,
  introduction: Users,
  notification: Bell,
  spam: Trash2,
  other: Mail
};

export default function EmailAgentDashboard() {
  const [status, setStatus] = useState<EmailAgentStatus | null>(null);
  const [emails, setEmails] = useState<EmailResponse[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Human-in-the-loop state
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>({});
  const [pendingEmails, setPendingEmails] = useState<EmailResponse[]>([]);

  // API calls
  interface EmailResponderResponse {
  status: string;
  message: string;
  data: any;
}

const fetchStatus = async () => {
    try {
      const data = await emailResponderApi.getStatus() as EmailResponderResponse;
      if (data.status === 'success') {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      // Set default status to prevent UI from breaking
      setStatus({
        is_running: false,
        total_runs: 0,
        emails_processed: 0,
        last_check: null,
        real_email_configured: false,
        llm_model: 'Unknown',
        email_server: 'Unknown',
        service_active: false
      });
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await emailResponderApi.getHistory() as EmailResponderResponse;
      if (data.status === 'success') {
        setEmails(data.data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setEmails([]);
    }
  };

  const runEmailProcessor = async (action: 'run_once' | 'start_background') => {
    setIsLoading(true);
    try {
      const data = await emailResponderApi.run(action) as EmailResponderResponse;
      
      if (data.status === 'success') {
        setStats(data.data.stats);
        
        // If run_once and we have responses, move them to pending for review
        if (action === 'run_once' && data.data.responses) {
          setPendingEmails(data.data.responses);
        }
        
        await fetchStatus();
        await fetchHistory();
      }
    } catch (error) {
      console.error('Failed to run email processor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Human-in-the-loop handlers
  const startEditingResponse = (emailId: string, currentResponse: string) => {
    setEditingEmailId(emailId);
    setEditedResponses(prev => ({
      ...prev,
      [emailId]: currentResponse
    }));
  };

  const saveEditedResponse = (emailId: string, newResponse: string) => {
    setEditedResponses(prev => ({
      ...prev,
      [emailId]: newResponse
    }));
  };

  const cancelEditing = (emailId: string) => {
    setEditingEmailId(null);
    setEditedResponses(prev => {
      const newState = { ...prev };
      delete newState[emailId];
      return newState;
    });
  };

  const approveResponse = async (email: EmailResponse) => {
    try {
      const finalResponse = editedResponses[email.email_id] || email.draft_response;
      
      // Call the API to send the approved response
      const data = await emailResponderApi.sendManualResponse({
        email_id: email.email_id,
        to_address: email.from,
        subject: email.subject,
        response_body: finalResponse
      }) as EmailResponderResponse;
      
      if (data.status === 'success') {
        // Move from pending to history
        const updatedEmail = {
          ...email,
          draft_response: finalResponse,
          sent: true,
          processed_at: new Date().toISOString()
        };
        
        setPendingEmails(prev => prev.filter(e => e.email_id !== email.email_id));
        setEmails(prev => [updatedEmail, ...prev]);
        
        // Clear editing state
        cancelEditing(email.email_id);
        
        // Show success message
        console.log('Response sent successfully');
      } else {
        console.error('Failed to send response:', data.message);
      }
      
    } catch (error) {
      console.error('Failed to send response:', error);
    }
  };

  const rejectResponse = (emailId: string) => {
    setPendingEmails(prev => prev.filter(e => e.email_id !== emailId));
    cancelEditing(emailId);
  };

  const stopEmailProcessor = async () => {
    setIsLoading(true);
    try {
      const data = await emailResponderApi.stop() as EmailResponderResponse;
      
      if (data.status === 'success') {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to stop email processor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStatus();
        fetchHistory();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  // Filter emails
  const filteredEmails = emails.filter(email => {
    if (selectedCategory !== 'all' && email.classification.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && email.classification.priority !== selectedPriority) return false;
    if (selectedSentiment !== 'all' && email.classification.sentiment !== selectedSentiment) return false;
    return true;
  });

  const CategoryIcon = categoryIcons[emails[0]?.classification.category] || Mail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Auto Responder</h1>
              <p className="text-sm text-gray-600">AI-powered email processing with Groq</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={fetchStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Service Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {status.is_running ? (
                      <Play className="h-4 w-4 mr-2" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-2xl font-bold">
                      {status.is_running ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <Activity className="h-5 w-5 opacity-70" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Emails Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{status.emails_processed}</span>
                  <Inbox className="h-5 w-5 opacity-70" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">AI Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">Groq</span>
                    <p className="text-xs opacity-80">{status.llm_model}</p>
                  </div>
                  <Brain className="h-5 w-5 opacity-70" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">
                      {status.real_email_configured ? 'Real' : 'Demo'}
                    </span>
                    <p className="text-xs opacity-80">{status.email_server}</p>
                  </div>
                  <Shield className="h-5 w-5 opacity-70" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => runEmailProcessor('run_once')}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Run Once
              </Button>
              <Button 
                onClick={() => runEmailProcessor('start_background')}
                disabled={isLoading || status?.is_running}
                variant="outline"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Background
              </Button>
              <Button 
                onClick={stopEmailProcessor}
                disabled={isLoading || !status?.is_running}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="inquiry">Inquiry</option>
                <option value="complaint">Complaint</option>
                <option value="meeting_request">Meeting Request</option>
                <option value="follow_up">Follow Up</option>
                <option value="feedback">Feedback</option>
                <option value="support">Support</option>
                <option value="introduction">Introduction</option>
                <option value="notification">Notification</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>

              <select 
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <select 
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Processing Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_emails}</div>
                  <div className="text-sm text-gray-600">Total Emails</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.classified}</div>
                  <div className="text-sm text-gray-600">Classified</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.responses_generated}</div>
                  <div className="text-sm text-gray-600">Responses Generated</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.responses_sent}</div>
                  <div className="text-sm text-gray-600">Responses Sent</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">By Category</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.by_category).map(([category, count]) => (
                    <Badge key={category} className={categoryColors[category] || categoryColors.other}>
                      {category}: {count}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Priority Breakdown */}
              <div>
                <h4 className="font-semibold mb-2">By Priority</h4>
                <div className="flex gap-2">
                  {Object.entries(stats.by_priority).map(([priority, count]) => (
                    <Badge key={priority} className={priorityColors[priority]}>
                      {priority}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Review - Human in the Loop */}
      {pendingEmails.length > 0 && (
        <div className="mb-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                Pending Review ({pendingEmails.length}) - Human Approval Required
              </CardTitle>
              <CardDescription>
                Review and edit AI-generated responses before sending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingEmails.map((email) => {
                  const CategoryIcon = categoryIcons[email.classification.category] || Mail;
                  return (
                  <div key={email.email_id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <CategoryIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="font-semibold text-gray-900">{email.from}</span>
                          <div className="ml-auto flex items-center space-x-2">
                            <Badge className={priorityColors[email.classification.priority]}>
                              {email.classification.priority}
                            </Badge>
                            <Badge className={categoryColors[email.classification.category]}>
                              {email.classification.category}
                            </Badge>
                          </div>
                        </div>
                        <h3 className="font-medium text-gray-800 mb-1">{email.subject}</h3>
                      </div>
                    </div>

                    {/* Editable Response Section */}
                    <div className="bg-blue-50 rounded p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">AI-Generated Response</span>
                        {editingEmailId !== email.email_id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingResponse(email.email_id, email.draft_response || '')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelEditing(email.email_id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {editingEmailId === email.email_id ? (
                        <textarea
                          className="w-full p-2 border rounded text-sm"
                          rows={4}
                          value={editedResponses[email.email_id] || ''}
                          onChange={(e) => saveEditedResponse(email.email_id, e.target.value)}
                          placeholder="Edit the response..."
                        />
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {editedResponses[email.email_id] || email.draft_response || ''}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => rejectResponse(email.email_id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveResponse(email)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve & Send
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email List */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Inbox className="h-5 w-5 mr-2" />
                Processed Emails ({filteredEmails.length})
              </div>
              <div className="text-sm text-gray-500">
                Last check: {status?.last_check ? new Date(status.last_check).toLocaleString() : 'Never'}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEmails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails processed yet. Run the email processor to see results.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEmails.map((email, index) => {
                  const CategoryIcon = categoryIcons[email.classification.category] || Mail;
                  return (
                    <div key={email.email_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <CategoryIcon className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="font-semibold text-gray-900">{email.from}</span>
                            <div className="ml-auto flex items-center space-x-2">
                              <Badge className={priorityColors[email.classification.priority]}>
                                {email.classification.priority}
                              </Badge>
                              <Badge className={categoryColors[email.classification.category]}>
                                {email.classification.category}
                              </Badge>
                              {email.sent && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sent
                                </Badge>
                              )}
                            </div>
                          </div>
                          <h3 className="font-medium text-gray-800 mb-1">{email.subject}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {email.classification.key_topics.length > 0 && (
                              <>Topics: {email.classification.key_topics.join(', ')}</>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Sentiment:</span>
                          <span className={`ml-2 text-sm font-medium ${sentimentColors[email.classification.sentiment]}`}>
                            {email.classification.sentiment}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Requires Response:</span>
                          <span className={`ml-2 text-sm font-medium ${email.classification.requires_response ? 'text-blue-600' : 'text-gray-500'}`}>
                            {email.classification.requires_response ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      {email.draft_response && (
                        <div className="bg-gray-50 rounded p-3">
                          <div className="flex items-center mb-2">
                            <SendHorizontal className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="font-medium text-gray-900">Generated Response</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {email.draft_response.length > 200 
                              ? email.draft_response.substring(0, 200) + '...'
                              : email.draft_response
                            }
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-gray-500">
                        <span>Processed: {new Date(email.processed_at).toLocaleString()}</span>
                        <span>Mode: {email.classification.mode}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
