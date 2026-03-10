"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { voiceAgentApi } from "@/lib/api";
import {
  Phone,
  PhoneCall,
  CheckCircle,
  RefreshCw,
  DollarSign,
  MessageSquare
} from "lucide-react";

interface CallResponse {
  call_id: string;
  customer_phone: string;
  customer_name: string;
  twilio_call_sid?: string;
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
  sarvam_audio_id?: string;
  telephony_call?: boolean;
  real_sarvam_api?: boolean;
  current_sentiment?: string;
  current_frustration_score?: number;
  current_toxicity_flags?: string[];
  call_quality?: {
    f_score: number;
    f_score_percent: number;
    precision_proxy: number;
    recall_proxy: number;
    quality_band: string;
    risk_flags: string[];
    next_best_actions: string[];
  };
  f_score?: number;
  risk_flags?: string[];
  next_best_actions?: string[];
  crm_case?: {
    case_id: string;
    status: string;
    priority: string;
    category: string;
    sub_category: string;
    owner_team: string;
    integration_status: string;
    sla_due_at: string;
  };
  escalation?: {
    escalated: boolean;
    reason: string;
    route_to: string;
    bridge_recommended: boolean;
    priority: string;
  };
  policy_guardrails?: {
    allowed: boolean;
    violations: string[];
    warnings: string[];
    policy_version: string;
  };
  live_escalation?: {
    should_escalate_now: boolean;
    reason: string;
    severity: string;
    route_to: string;
    metrics?: Record<string, unknown>;
  };
  handoff_state?: {
    status?: string;
    target_number?: string;
    handoff_twiml_url?: string;
    success?: boolean;
  };
  ai_governor?: {
    version?: string;
    status?: string;
    evaluated_at?: string | null;
    report_card?: {
      verdict?: string;
      summary?: string;
      explanation?: string;
      strengths?: string[];
      improvement_areas?: string[];
      recommended_actions?: string[];
      kb_assessment?: string;
      completeness_percent?: number;
    };
    workflow_completeness?: {
      coverage_percent?: number;
      missing_fields?: string[];
      enough_dialogue?: boolean;
    };
    knowledge_base?: {
      used?: boolean;
      web_rag_used?: boolean;
      reference_count?: number;
      references?: string[];
    };
    ragas?: {
      status?: string;
      sample_count?: number;
      provider?: string;
      scores?: {
        faithfulness?: number | null;
        answer_relevancy?: number | null;
        retrieval_quality_f1?: number | null;
        retrieval_f1?: number | null;
      };
      error?: string | null;
    };
  };
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

interface VoiceApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

interface HistoryPayload {
  history?: CallResponse[];
}

interface PersonasPayload {
  id: string;
  name: string;
  sector: string;
  description: string;
  icon: string;
}

interface LanguagesPayload {
  code: string;
  name: string;
  native: string;
  flag: string;
}

type CasePriority = 'low' | 'medium' | 'high' | 'critical';

interface BankingWorkflowPreset {
  id: string;
  label: string;
  issueType: string;
  product: string;
  serviceRequestType: string;
  customerIntent: string;
  notes: string;
  casePriority: CasePriority;
}

const BANKING_KB_OPTIONS: Record<
  string,
  {
    issueTypes: string[];
    products: string[];
    serviceRequests: string[];
  }
> = {
  banking_debt: {
    issueTypes: ["emi_overdue", "credit_card_due", "payment_failure", "hardship"],
    products: ["credit_card", "personal_loan", "home_loan", "auto_loan"],
    serviceRequests: ["repayment_plan", "partial_payment", "extension_request", "dispute"],
  },
  banking_fraud_desk: {
    issueTypes: ["phishing", "vishing", "smishing", "unauthorized_transaction"],
    products: ["savings_account", "current_account", "credit_card", "debit_card"],
    serviceRequests: ["block_account", "block_card", "report_fraud", "case_followup"],
  },
  banking_card_support: {
    issueTypes: ["card_declined", "unauthorized_transaction", "limit_change", "card_lost"],
    products: ["credit_card", "debit_card", "prepaid_card"],
    serviceRequests: ["raise_dispute", "replace_card", "hotlist_card", "channel_controls"],
  },
  banking_loan_advisor: {
    issueTypes: ["new_loan", "emi_query", "closure_request", "foreclosure_request"],
    products: ["personal_loan", "home_loan", "auto_loan", "business_loan"],
    serviceRequests: ["eligibility_check", "rate_query", "tenure_change", "noc_request"],
  },
  banking_retail_support: {
    issueTypes: ["transfer_pending", "kyc_update", "statement_request", "branch_support"],
    products: ["savings_account", "current_account", "upi", "imps_neft_rtgs"],
    serviceRequests: ["service_request", "status_check", "branch_appointment", "profile_update"],
  },
  banking_wealth_advisor: {
    issueTypes: ["portfolio_review", "risk_rebalance", "new_investment", "redemption_query"],
    products: ["mutual_funds", "bonds", "fd", "structured_products"],
    serviceRequests: ["advisory_callback", "suitability_review", "allocation_plan", "documentation"],
  },
};

const BANKING_WORKFLOW_PRESETS: Record<string, BankingWorkflowPreset[]> = {
  banking_debt: [
    {
      id: "collections_hardship_plan",
      label: "Collections: Hardship Plan",
      issueType: "hardship",
      product: "personal_loan",
      serviceRequestType: "repayment_plan",
      customerIntent: "Need a workable installment plan due to temporary cashflow stress",
      notes: "Offer partial payment + short extension + confirm commitment date.",
      casePriority: "high",
    },
    {
      id: "collections_due_reminder",
      label: "Collections: Due Reminder",
      issueType: "emi_overdue",
      product: "home_loan",
      serviceRequestType: "extension_request",
      customerIntent: "Wants short extension and late fee clarity",
      notes: "Focus on compliant tone and one clear next payment commitment.",
      casePriority: "medium",
    },
  ],
  banking_fraud_desk: [
    {
      id: "fraud_unauthorized_txn",
      label: "Fraud: Unauthorized Transaction",
      issueType: "unauthorized_transaction",
      product: "debit_card",
      serviceRequestType: "report_fraud",
      customerIntent: "Block exposure immediately and raise fraud case",
      notes: "Capture timeline, references, and reassure without promising outcomes.",
      casePriority: "critical",
    },
    {
      id: "fraud_phishing_case",
      label: "Fraud: Phishing Compromise",
      issueType: "phishing",
      product: "savings_account",
      serviceRequestType: "block_account",
      customerIntent: "Compromised credentials, needs immediate account safety actions",
      notes: "Guide credential reset and MFA hardening steps.",
      casePriority: "critical",
    },
  ],
  banking_card_support: [
    {
      id: "cards_chargeback_flow",
      label: "Cards: Dispute/Chargeback",
      issueType: "unauthorized_transaction",
      product: "credit_card",
      serviceRequestType: "raise_dispute",
      customerIntent: "Raise dispute and understand investigation timeline",
      notes: "Collect txn date, amount, merchant, channel. Provide case reference.",
      casePriority: "high",
    },
    {
      id: "cards_hotlist_replace",
      label: "Cards: Hotlist + Replace",
      issueType: "card_lost",
      product: "debit_card",
      serviceRequestType: "replace_card",
      customerIntent: "Card lost and wants immediate block plus replacement",
      notes: "Prioritize card controls and safe replacement workflow.",
      casePriority: "high",
    },
  ],
  banking_loan_advisor: [
    {
      id: "loan_eligibility_journey",
      label: "Loans: Eligibility Journey",
      issueType: "new_loan",
      product: "home_loan",
      serviceRequestType: "eligibility_check",
      customerIntent: "Understand eligibility, indicative rate, and documentation",
      notes: "Use ranges, avoid final sanction commitment claims.",
      casePriority: "medium",
    },
    {
      id: "loan_foreclosure_case",
      label: "Loans: Foreclosure Case",
      issueType: "foreclosure_request",
      product: "personal_loan",
      serviceRequestType: "noc_request",
      customerIntent: "Close loan and receive payoff/NOC timeline",
      notes: "Explain charges as per policy and document release ETA.",
      casePriority: "high",
    },
  ],
  banking_retail_support: [
    {
      id: "retail_transfer_pending",
      label: "Retail: Transfer Pending",
      issueType: "transfer_pending",
      product: "upi",
      serviceRequestType: "status_check",
      customerIntent: "Need transfer status and SLA escalation path",
      notes: "Capture UTR/ref number, timestamp, beneficiary status.",
      casePriority: "high",
    },
    {
      id: "retail_kyc_update",
      label: "Retail: KYC Update",
      issueType: "kyc_update",
      product: "savings_account",
      serviceRequestType: "profile_update",
      customerIntent: "Update profile and verify KYC document requirements",
      notes: "Keep branch/digital workflow instructions precise.",
      casePriority: "medium",
    },
  ],
  banking_wealth_advisor: [
    {
      id: "wealth_portfolio_review",
      label: "Wealth: Portfolio Review",
      issueType: "portfolio_review",
      product: "mutual_funds",
      serviceRequestType: "allocation_plan",
      customerIntent: "Rebalance based on goals and risk appetite",
      notes: "Discuss suitability and avoid non-contractual return guarantees.",
      casePriority: "medium",
    },
    {
      id: "wealth_risk_rebalance",
      label: "Wealth: Risk Rebalance",
      issueType: "risk_rebalance",
      product: "bonds",
      serviceRequestType: "suitability_review",
      customerIntent: "Reduce volatility and improve downside protection",
      notes: "Collect horizon/liquidity constraints before recommendations.",
      casePriority: "medium",
    },
  ],
};

export default function VoiceDashboard() {
  const router = useRouter();
  const hasAppliedUrlDefaultsRef = useRef(false);
  const [messages, setMessages] = useState<{ role: 'agent' | 'user', text: string, time: string }[]>([
    { role: 'agent', text: "Hi! I'm your AI Voice Agent. Select a persona or create your own, enter your phone number, and I'll call you. You can also add extra instructions to customize the AI's behavior.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('banking_debt');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [personas, setPersonas] = useState<{ id: string, name: string, sector: string, description: string, icon: string }[]>([]);
  const [languages, setLanguages] = useState<{ code: string, name: string, native: string, flag: string }[]>([]);
  const [issueType, setIssueType] = useState('');
  const [customerIntent, setCustomerIntent] = useState('');
  const [product, setProduct] = useState('');
  const [serviceRequestType, setServiceRequestType] = useState('');
  const [casePriority, setCasePriority] = useState<CasePriority>('medium');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calls, setCalls] = useState<CallResponse[]>([]);
  const [historyView, setHistoryView] = useState<'current' | 'past'>('current');
  const [status, setStatus] = useState<CallAgentStatus | null>(null);
  const [handoffCallId, setHandoffCallId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await voiceAgentApi.getHistory() as VoiceApiEnvelope<HistoryPayload>;
      if (data.status === 'success') {
        setCalls(data.data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setCalls([]);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await voiceAgentApi.getStatus() as VoiceApiEnvelope<CallAgentStatus>;
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
  }, []);

  const handleManualHandoff = useCallback(
    async (call: CallResponse) => {
      const callSid = call.twilio_call_sid || call.call_id;
      if (!callSid || handoffCallId === call.call_id) return;

      setHandoffCallId(call.call_id);
      try {
        const result = await voiceAgentApi.handoff({ call_sid: callSid }) as VoiceApiEnvelope<{ handoff_twiml_url?: string }>;
        const msg = {
          role: 'agent' as const,
          text: result.status === 'success'
            ? `Escalation requested for call ${callSid}. Twilio handoff initiated.`
            : `Handoff request failed for call ${callSid}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, msg]);
        await fetchHistory();
      } catch (error) {
        const errMsg = {
          role: 'agent' as const,
          text: `Handoff failed for call ${callSid}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errMsg]);
      } finally {
        setHandoffCallId(null);
      }
    },
    [fetchHistory, handoffCallId],
  );

  // Load data on mount
  useEffect(() => {
    fetchStatus();
    fetchHistory();

    const loadDropdownData = async () => {
      try {
        const personasData = await voiceAgentApi.getPersonas() as VoiceApiEnvelope<PersonasPayload[]>;
        if (personasData.status === 'success' && personasData.data) {
          setPersonas(personasData.data);
        }
      } catch (error) {
        console.error(error);
      }

      try {
        const languagesData = await voiceAgentApi.getLanguages() as VoiceApiEnvelope<LanguagesPayload[]>;
        if (languagesData.status === 'success' && languagesData.data) {
          setLanguages(languagesData.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadDropdownData();
  }, [fetchHistory, fetchStatus]);

  useEffect(() => {
    if (!router.isReady || hasAppliedUrlDefaultsRef.current) {
      return;
    }

    const personaFromUrl = router.query.persona_id;
    const languageFromUrl = router.query.language_code;

    if (typeof personaFromUrl === "string" && personaFromUrl.trim()) {
      setSelectedPersona(personaFromUrl.trim());
    }

    if (typeof languageFromUrl === "string" && languageFromUrl.trim()) {
      setSelectedLanguage(languageFromUrl.trim());
    }

    hasAppliedUrlDefaultsRef.current = true;
  }, [router.isReady, router.query.persona_id, router.query.language_code]);

  useEffect(() => {
    if (!personas.length || selectedPersona === "custom") {
      return;
    }
    const personaExists = personas.some((persona) => persona.id === selectedPersona);
    if (!personaExists) {
      setSelectedPersona(personas[0].id);
    }
  }, [personas, selectedPersona]);

  useEffect(() => {
    const hasPendingCalls = calls.some((call) => !call.completed);
    if (!hasPendingCalls) {
      return;
    }
    const interval = setInterval(() => {
      fetchHistory();
      fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [calls, fetchHistory, fetchStatus]);

  const isBankingPersona = selectedPersona.startsWith('banking_');
  const kbOptions = useMemo(
    () => BANKING_KB_OPTIONS[selectedPersona] || BANKING_KB_OPTIONS.banking_debt,
    [selectedPersona]
  );
  const personaPresets = useMemo(
    () => BANKING_WORKFLOW_PRESETS[selectedPersona] || [],
    [selectedPersona]
  );

  useEffect(() => {
    if (!isBankingPersona) {
      setIssueType('');
      setCustomerIntent('');
      setProduct('');
      setServiceRequestType('');
      setCasePriority('medium');
      setSelectedPresetId('');
      setNotes('');
      return;
    }
    const defaultPreset = personaPresets[0];
    if (defaultPreset) {
      setSelectedPresetId(defaultPreset.id);
      setIssueType(defaultPreset.issueType);
      setProduct(defaultPreset.product);
      setServiceRequestType(defaultPreset.serviceRequestType);
      setCustomerIntent(defaultPreset.customerIntent);
      setNotes(defaultPreset.notes);
      setCasePriority(defaultPreset.casePriority);
      return;
    }

    setIssueType(kbOptions.issueTypes[0] || '');
    setProduct(kbOptions.products[0] || '');
    setServiceRequestType(kbOptions.serviceRequests[0] || '');
  }, [selectedPersona, isBankingPersona, kbOptions, personaPresets]);

  const handleInitiateCall = async () => {
    if (isLoading) return;

    const phoneNumber = userPhone;
    if (!phoneNumber) {
      const errorMessage = {
        role: 'agent' as const,
        text: "Please enter your phone number first (e.g., +919667480134)",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    if (selectedPersona === 'custom' && !customPrompt.trim()) {
      const errorMessage = {
        role: 'agent' as const,
        text: "Please describe your custom persona in the text box below (e.g., 'You are a friendly travel agent helping customers book flights').",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Show what the user configured
    const personaLabel = selectedPersona === 'custom' ? '✨ Custom Persona' : (personas.find(p => p.id === selectedPersona)?.name || selectedPersona);
    const langLabel = languages.find(l => l.code === selectedLanguage)?.name || selectedLanguage;
    const kbContextSummary = isBankingPersona
      ? `\n🏛️ Issue: ${issueType || 'n/a'}\n📦 Product: ${product || 'n/a'}\n🧾 Service: ${serviceRequestType || 'n/a'}\n⚠️ Priority: ${casePriority}${selectedPresetId ? `\n🧰 Preset: ${selectedPresetId}` : ''}${customerIntent.trim() ? `\n🎯 Intent: ${customerIntent.trim()}` : ''}${notes.trim() ? `\n🗒️ Notes: ${notes.trim()}` : ''}`
      : '';
    const userMessage = {
      role: 'user' as const,
      text: `📞 Call ${phoneNumber}\n🎭 ${personaLabel}\n🌐 ${langLabel}${kbContextSummary}${customPrompt.trim() ? `\n📝 ${customPrompt.trim()}` : ''}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);

    const thinkingMessage = {
      role: 'agent' as const,
      text: `Initiating voice call to ${phoneNumber}...`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, thinkingMessage]);
    setIsLoading(true);

    try {
      const data = await voiceAgentApi.run({
        action: 'call_user',
        phone_number: phoneNumber,
        persona_id: selectedPersona,
        language_code: selectedLanguage,
        custom_prompt: customPrompt.trim() || undefined,
        issue_type: isBankingPersona ? issueType || undefined : undefined,
        customer_intent: isBankingPersona ? customerIntent.trim() || undefined : undefined,
        product: isBankingPersona ? product || undefined : undefined,
        service_request_type: isBankingPersona ? serviceRequestType || undefined : undefined,
        workflow_preset: isBankingPersona ? selectedPresetId || undefined : undefined,
        case_priority: isBankingPersona ? casePriority : undefined,
        notes: isBankingPersona ? notes.trim() || undefined : undefined,
      }) as VoiceApiEnvelope<{ calls?: CallResponse[] }>;

      if (data.status === 'success') {
        const startedCallId = data.data.calls?.[0]?.call_id;
        const resultMessage = {
          role: 'agent' as const,
          text: `✅ Call initiated with ${personaLabel}! ID: ${startedCallId || 'unknown'}. Telephony: ${data.data.calls?.[0]?.telephony_call ? 'CONNECTED' : 'ACTIVE'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, resultMessage]);
        await fetchHistory();
        await fetchStatus();

        // Poll history briefly so transcript/completion updates show without manual refresh
        if (startedCallId) {
          for (let i = 0; i < 8; i += 1) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            await fetchHistory();
            await fetchStatus();
          }
        }
      } else {
        const errorMessage = {
          role: 'agent' as const,
          text: `✗ Call failed: ${data.message || 'Unknown error'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        role: 'agent' as const,
        text: `✗ Call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  const completedCalls = calls.filter(call => call.completed).length;
  const escalatedCalls = calls.filter(call => call.escalation?.escalated).length;
  const liveAtRiskCalls = calls.filter(call => call.live_escalation?.should_escalate_now).length;
  const avgFScore = calls.length
    ? Math.round(
      (calls.reduce((sum, call) => sum + (call.call_quality?.f_score_percent ?? 0), 0) / calls.length) * 10
    ) / 10
    : 0;
  const lastCheck = status?.last_check ? new Date(status.last_check).toLocaleString() : "Never";
  const orderedCalls = useMemo(
    () =>
      [...calls].sort((a, b) => {
        const aTs = new Date(a.processed_at).getTime();
        const bTs = new Date(b.processed_at).getTime();
        if (!Number.isNaN(aTs) && !Number.isNaN(bTs)) return bTs - aTs;
        if (!Number.isNaN(aTs)) return -1;
        if (!Number.isNaN(bTs)) return 1;
        return 0;
      }),
    [calls],
  );
  const currentCall = orderedCalls[0] ? [orderedCalls[0]] : [];
  const pastCalls = orderedCalls.slice(1);
  const visibleCalls = historyView === 'current' ? currentCall : pastCalls;

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/90 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-slate-900 p-2">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">NeoVoice</h1>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span className="text-sm text-slate-600">Multi-Sector Voice AI</span>
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Panel - Chat */}
        <div className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white/90 lg:w-[420px] lg:border-b-0 lg:border-r">
          {/* Chat Header */}
          <div className="shrink-0 border-b border-slate-200 px-4 py-3">
            <h2 className="flex items-center font-semibold text-slate-900">
              <MessageSquare className="h-4 w-4 mr-2" />
              Agent Chat
            </h2>
          </div>

          {/* Messages */}
          <div className="h-44 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 sm:h-52 lg:h-60">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-lg ${message.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-900'
                  }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <p className="text-sm">Processing voice call...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 overflow-y-auto border-t border-slate-200 px-4 py-3 space-y-3">
            <input
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="Your phone number (e.g., +919667480134)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isLoading}
            />
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              disabled={isLoading}
            >
              {personas.length > 0 ? personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name} — {p.sector}
                </option>
              )) : (
                <option value="banking_debt">🏦 Banking Debt Collection — Banking & Finance</option>
              )}
              <option value="custom">✨ Create Your Own Persona</option>
            </select>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              disabled={isLoading}
            >
              {languages.length > 0 ? languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.native})
                </option>
              )) : (
                <option value="auto">🌐 Auto Detect (Auto)</option>
              )}
            </select>
            {selectedPersona === 'custom' ? (
              <p className="text-xs text-orange-600 font-medium">
                ✨ Describe your custom AI persona in the text box below. The AI will fully adopt this personality during the call.
              </p>
            ) : personas.length > 0 && (
              <p className="text-xs text-gray-500">
                {personas.find(p => p.id === selectedPersona)?.description || ''}
              </p>
            )}
            {isBankingPersona && (
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-700">Banking Knowledge Context</p>
                <select
                  value={selectedPresetId}
                  onChange={(e) => {
                    const nextPresetId = e.target.value;
                    setSelectedPresetId(nextPresetId);
                    if (nextPresetId === "custom_manual") return;
                    const preset = personaPresets.find((p) => p.id === nextPresetId);
                    if (!preset) return;
                    setIssueType(preset.issueType);
                    setProduct(preset.product);
                    setServiceRequestType(preset.serviceRequestType);
                    setCustomerIntent(preset.customerIntent);
                    setNotes(preset.notes);
                    setCasePriority(preset.casePriority);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                >
                  {personaPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                  <option value="custom_manual">Custom / Manual</option>
                </select>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                >
                  {kbOptions.issueTypes.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                >
                  {kbOptions.products.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={serviceRequestType}
                  onChange={(e) => setServiceRequestType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                >
                  {kbOptions.serviceRequests.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={casePriority}
                  onChange={(e) => setCasePriority(e.target.value as CasePriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
                <input
                  type="text"
                  value={customerIntent}
                  onChange={(e) => setCustomerIntent(e.target.value)}
                  placeholder="Customer intent (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Context notes for better KB retrieval (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {selectedPersona === 'custom' ? 'Your Custom Persona (required)' : 'Additional Instructions (optional)'}
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={selectedPersona === 'custom'
                  ? "Describe your AI persona...\n\nExample: You are a friendly travel consultant from Wanderlust Tours. Help customers plan their ideal vacation. Be enthusiastic, suggest destinations, and offer package deals."
                  : "e.g., Be more empathetic, focus on payment plans, speak casually..."
                }
                className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm ${selectedPersona === 'custom' ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                  }`}
                rows={selectedPersona === 'custom' ? 4 : 2}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleInitiateCall}
              disabled={isLoading || !userPhone.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 py-3 text-base font-semibold"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PhoneCall className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Calling...' : 'Start Call'}
            </Button>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50/60 to-white">
          {/* Stats Cards */}
          <div className="px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
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

              <Card className="border-slate-200 bg-gradient-to-r from-slate-700 to-slate-600 text-white">
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

              <Card className="border-slate-200 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900">
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

              <Card className="border-slate-200 bg-gradient-to-r from-sky-600 to-sky-500 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Avg F-Score</p>
                      <p className="text-lg font-bold">{avgFScore}%</p>
                    </div>
                    <Phone className="h-5 w-5 opacity-70" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              Escalated Calls: <span className="font-semibold text-slate-900">{escalatedCalls}</span>
              <span className="mx-2 text-slate-400">•</span>
              Live At-Risk: <span className="font-semibold text-slate-900">{liveAtRiskCalls}</span>
            </div>
          </div>

          {/* Call Results */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 sm:px-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <PhoneCall className="h-4 w-4 mr-2" />
                Call Results ({visibleCalls.length})
              </h3>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setHistoryView('current')}
                  className={`rounded-md px-3 py-1.5 transition ${historyView === 'current'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  Current Call
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryView('past')}
                  className={`rounded-md px-3 py-1.5 transition ${historyView === 'past'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  Past Calls
                </button>
              </div>
            </div>

            {visibleCalls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-16 w-16 mx-auto mb-4 text-orange-400" />
                <p className="text-gray-500">
                  {historyView === 'current'
                    ? 'No current call yet. Start a conversation to initiate a voice call.'
                    : 'No past calls yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleCalls.map((call) => (
                  <Card key={call.call_id} className="bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{call.customer_name}</h4>
                          <p className="text-sm text-gray-600">{call.customer_phone} · {new Date(call.processed_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {call.completed && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          <Badge className={call.telephony_call ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                            {call.telephony_call ? "LIVE CALL" : "SIMULATED"}
                          </Badge>
                          {(() => {
                            const sentiment = (call.current_sentiment || call.classification.sentiment || '').toLowerCase();
                            const cls =
                              sentiment.includes('negative')
                                ? 'bg-red-100 text-red-800'
                                : sentiment.includes('positive')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-800';
                            return (
                              <Badge className={cls}>
                                Sentiment: {call.current_sentiment || call.classification.sentiment}
                              </Badge>
                            );
                          })()}
                          {call.live_escalation && (
                            <Badge className={
                              call.live_escalation.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : call.live_escalation.severity === 'medium'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }>
                              LIVE: {call.live_escalation.reason.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          <Badge className={
                            call.classification.priority === 'high' ? 'bg-red-100 text-red-800' :
                              call.classification.priority === 'medium' ? 'bg-red-100 text-red-800' :
                                'bg-green-100 text-green-800'
                          }>
                            {call.classification.priority}
                          </Badge>
                          {call.call_quality?.f_score_percent !== undefined && (
                            <Badge className={
                              call.call_quality.f_score_percent >= 85 ? 'bg-emerald-100 text-emerald-800' :
                                call.call_quality.f_score_percent >= 70 ? 'bg-blue-100 text-blue-800' :
                                  call.call_quality.f_score_percent >= 50 ? 'bg-red-100 text-red-800' :
                                    'bg-red-100 text-red-800'
                            }>
                              F-Score {call.call_quality.f_score_percent}%
                            </Badge>
                          )}
                          {call.escalation?.escalated && (
                            <Badge className="bg-red-100 text-red-800">
                              ESCALATED
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">TRANSCRIPT</h5>
                        {call.transcript?.trim() ? (
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap max-h-72 overflow-y-auto">
                            {call.transcript}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-line">
                            {call.completed ? 'Transcript unavailable for this call.' : 'Live transcript is initializing...'}
                          </p>
                        )}
                        {!call.completed && (
                          <p className="mt-1 text-xs text-blue-700">
                            Live transcript updates every few seconds while the call is active.
                          </p>
                        )}
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

                      {call.sarvam_audio_id && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">VOICE AI DETAILS</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Audio ID:</span> {call.sarvam_audio_id}
                            </div>
                            <div>
                              <span className="font-medium">Telephony:</span> {call.telephony_call ? 'Connected' : 'Simulated'}
                            </div>
                          </div>
                        </div>
                      )}

                      {call.call_quality && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">CALL QUALITY</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium">Band:</span> {call.call_quality.quality_band}</div>
                            <div><span className="font-medium">F-Score:</span> {call.call_quality.f_score_percent}%</div>
                            <div><span className="font-medium">Precision Proxy:</span> {call.call_quality.precision_proxy}</div>
                            <div><span className="font-medium">Recall Proxy:</span> {call.call_quality.recall_proxy}</div>
                          </div>
                          {call.call_quality.risk_flags.length > 0 && (
                            <p className="mt-2 text-xs text-red-700">
                              Risk Flags: {call.call_quality.risk_flags.join(", ")}
                            </p>
                          )}
                          {call.call_quality.next_best_actions.length > 0 && (
                            <p className="mt-1 text-xs text-blue-700">
                              Next Actions: {call.call_quality.next_best_actions.join(", ")}
                            </p>
                          )}
                        </div>
                      )}

                      {call.ai_governor && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">AI GOVERNOR</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium">Status:</span> {call.ai_governor.status || 'pending'}</div>
                            <div><span className="font-medium">Verdict:</span> {call.ai_governor.report_card?.verdict || 'pending'}</div>
                            <div><span className="font-medium">RAGAS:</span> {call.ai_governor.ragas?.status || 'pending'}</div>
                            <div><span className="font-medium">Provider:</span> {(call.ai_governor.ragas?.provider || 'grok').toUpperCase()}</div>
                            <div><span className="font-medium">Samples:</span> {call.ai_governor.ragas?.sample_count ?? 0}</div>
                            <div><span className="font-medium">Faithfulness:</span> {call.ai_governor.ragas?.scores?.faithfulness ?? 'n/a'}</div>
                            <div><span className="font-medium">Answer Relevancy:</span> {call.ai_governor.ragas?.scores?.answer_relevancy ?? 'n/a'}</div>
                            <div><span className="font-medium">Retrieval Quality F1:</span> {call.ai_governor.ragas?.scores?.retrieval_quality_f1 ?? call.ai_governor.ragas?.scores?.retrieval_f1 ?? 'n/a'}</div>
                            <div><span className="font-medium">KB Refs:</span> {call.ai_governor.knowledge_base?.reference_count ?? 0}</div>
                          </div>
                          {call.ai_governor.report_card?.explanation && (
                            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                              <p className="font-medium text-slate-900 mb-1">Governor Explanation</p>
                              <p>{call.ai_governor.report_card.explanation}</p>
                            </div>
                          )}
                          {call.ai_governor.report_card?.strengths?.length ? (
                            <div className="mt-2 text-xs text-emerald-700">
                              <span className="font-medium">What went well:</span> {call.ai_governor.report_card.strengths.join(" | ")}
                            </div>
                          ) : null}
                          {call.ai_governor.report_card?.improvement_areas?.length ? (
                            <div className="mt-1 text-xs text-amber-700">
                              <span className="font-medium">What could improve:</span> {call.ai_governor.report_card.improvement_areas.join(" | ")}
                            </div>
                          ) : null}
                          {call.ai_governor.workflow_completeness && (
                            <div className="mt-1 text-xs text-sky-700">
                              <span className="font-medium">Workflow completeness:</span> {call.ai_governor.workflow_completeness.coverage_percent ?? 0}%
                              {call.ai_governor.workflow_completeness.missing_fields?.length
                                ? ` • Missing: ${call.ai_governor.workflow_completeness.missing_fields.join(", ")}`
                                : ''}
                            </div>
                          )}
                          {call.ai_governor.report_card?.kb_assessment && (
                            <div className="mt-1 text-xs text-violet-700">
                              <span className="font-medium">KB verification:</span> {call.ai_governor.report_card.kb_assessment}
                            </div>
                          )}
                          {call.ai_governor.ragas?.error && (
                            <p className="mt-2 text-xs text-red-700">
                              RAGAS error: {call.ai_governor.ragas.error}
                            </p>
                          )}
                        </div>
                      )}

                      {call.handoff_state && (
                        <div className="rounded bg-blue-50 p-2 text-sm text-blue-800">
                          Handoff status: {call.handoff_state.status || 'initiated'}{" "}
                          {call.handoff_state.target_number && `→ ${call.handoff_state.target_number}`}
                        </div>
                      )}

                      {call.telephony_call && !call.completed && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualHandoff(call)}
                            disabled={handoffCallId === call.call_id}
                          >
                            Escalate to human
                          </Button>
                        </div>
                      )}

                      {call.crm_case && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">CRM CASE</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium">Case ID:</span> {call.crm_case.case_id}</div>
                            <div><span className="font-medium">Owner Team:</span> {call.crm_case.owner_team}</div>
                            <div><span className="font-medium">Priority:</span> {call.crm_case.priority}</div>
                            <div><span className="font-medium">SLA Due:</span> {new Date(call.crm_case.sla_due_at).toLocaleString()}</div>
                          </div>
                        </div>
                      )}

                      {call.escalation?.escalated && (
                        <div className="rounded bg-red-50 p-2 text-sm text-red-800">
                          Escalation active: {call.escalation.reason} {"->"} {call.escalation.route_to}
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
