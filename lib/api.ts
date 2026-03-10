/**
 * API client for connecting to the FastAPI backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_GENESIS_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");
const RAW_API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";
const API_PREFIX = RAW_API_PREFIX
  ? `/${RAW_API_PREFIX.replace(/^\/+|\/+$/g, "")}`
  : "";
const API_V1 = `${API_BASE_URL}${API_PREFIX}`;

interface ApiError {
  detail: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: 'API request failed'
    }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Authentication API
export const authApi = {
  login: async (email: string) => {
    const response = await fetch(`${API_V1}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_V1}/auth/logout`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  getMe: async (token: string) => {
    const response = await fetch(`${API_V1}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
};

// Catalog API
export const catalogApi = {
  getItems: async (filters?: {
    pillar?: string;
    industry?: string;
    capability?: string;
    maturity?: string;
    isFeatured?: boolean;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_V1}/catalog/items${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getItem: async (slug: string) => {
    const response = await fetch(`${API_V1}/catalog/items/${slug}`);
    return handleResponse(response);
  },

  getItemsByPillar: async (pillar: string) => {
    const response = await fetch(`${API_V1}/catalog/pillars/${pillar}`);
    return handleResponse(response);
  },

  search: async (query: string) => {
    const response = await fetch(
      `${API_V1}/catalog/search?q=${encodeURIComponent(query)}`
    );
    return handleResponse(response);
  },
};

// Demo API
export const demoApi = {
  getConfig: async (itemId: string) => {
    const response = await fetch(`${API_V1}/demos/${itemId}/config`);
    return handleResponse(response);
  },

  runDemo: async (itemId: string, data: {
    inputData?: Record<string, unknown>;
    stepId?: string;
  }) => {
    const response = await fetch(`${API_V1}/demos/${itemId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getStatus: async (itemId: string) => {
    const response = await fetch(`${API_V1}/demos/${itemId}/status`);
    return handleResponse(response);
  },
};

// Health check
export const healthApi = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  },
};

// Pharmacovigilance Intake API
export type PVIntakePayload = {
  sourceType?: string;
  // legacy / direct
  text?: string;
  rawEmail?: string;
  // EHR
  ehrData?: {
    patientId?: string;
    clinicalNotes?: string;
    hl7Message?: string;
    fhirJson?: string;
  };
  // Clinical Trial
  clinicalTrialRecord?: {
    trialId?: string;
    siteId?: string;
    subjectId?: string;
    aeDescription?: string;
    saeFormData?: string;
  };
  // Social Media
  socialMediaPost?: {
    platform?: string;
    postId?: string;
    content: string;
    authorType?: string;
    postDate?: string;
  };
  // Call Transcript
  callTranscript?: {
    callId?: string;
    transcript: string;
    callerType?: string;
    callDate?: string;
  };
  // Patient Portal
  patientPortal?: {
    patientId?: string;
    submissionDate?: string;
    symptomDescription: string;
    medications?: string[];
    condition?: string;
  };
};

export const pharmacovigilanceApi = {
  intake: async (data: PVIntakePayload, enrichDrugs = false, analyzeInteractions = false, detectDuplicates = false) => {
    const params = new URLSearchParams();
    if (enrichDrugs) params.set('enrich_drugs', 'true');
    if (analyzeInteractions) params.set('analyze_interactions', 'true');
    if (detectDuplicates) params.set('detect_duplicates', 'true');
    const qs = params.toString();
    const url = `${API_V1}/pharmacovigilance/intake${qs ? '?' + qs : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  intakeFile: async (file: File, enrichDrugs = false, analyzeInteractions = false, detectDuplicates = false) => {
    const form = new FormData();
    form.append('file', file);

    const params = new URLSearchParams();
    if (enrichDrugs) params.set('enrich_drugs', 'true');
    if (analyzeInteractions) params.set('analyze_interactions', 'true');
    if (detectDuplicates) params.set('detect_duplicates', 'true');
    const qs = params.toString();
    const url = `${API_V1}/pharmacovigilance/intake/file${qs ? '?' + qs : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      body: form,
    });
    return handleResponse(response);
  },

  enrichDrug: async (data: { drug_name: string; include_label_sections?: boolean }) => {
    const response = await fetch(`${API_V1}/pharmacovigilance/drug-enrichment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  enrichDrugsBulk: async (data: { drug_names: string[]; include_label_sections?: boolean }) => {
    const response = await fetch(`${API_V1}/pharmacovigilance/drug-enrichment/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Pharmacovigilance Batch Processing API
// ─────────────────────────────────────────────────────────────────────────────

export const pharmacovigilanceBatchApi = {
  /** Upload a multi-case file and process all detected cases. */
  processFile: async (
    file: File,
    opts: {
      enrichDrugs?: boolean;
      analyzeInteractions?: boolean;
      detectDuplicates?: boolean;
      maxConcurrent?: number;
    } = {}
  ): Promise<any> => {
    const form = new FormData();
    form.append('file', file);

    const params = new URLSearchParams();
    if (opts.enrichDrugs)         params.set('enrich_drugs', 'true');
    if (opts.analyzeInteractions) params.set('analyze_interactions', 'true');
    if (opts.detectDuplicates)    params.set('detect_duplicates', 'true');
    if (opts.maxConcurrent)       params.set('max_concurrent', String(opts.maxConcurrent));

    const qs = params.toString();
    const url = `${API_V1}/pharmacovigilance/batch/file${qs ? '?' + qs : ''}`;
    const response = await fetch(url, { method: 'POST', body: form });
    return handleResponse(response);
  },

  /** Retrieve a previously processed batch result by its batch_id. */
  getBatch: async (batchId: string): Promise<any> => {
    const response = await fetch(`${API_V1}/pharmacovigilance/batch/${batchId}`);
    return handleResponse(response);
  },

  /** Download URL for the full ZIP export (JSON + CSV + Excel + TXT + charts + PDF). */
  downloadUrl: (
    batchId: string,
    opts: { includeReport?: boolean; includeGraphs?: boolean } = {}
  ): string => {
    const params = new URLSearchParams();
    if (opts.includeReport === false) params.set('include_report', 'false');
    if (opts.includeGraphs === false) params.set('include_graphs', 'false');
    const qs = params.toString();
    return `${API_V1}/pharmacovigilance/batch/${batchId}/download${qs ? '?' + qs : ''}`;
  },

  /** Individual format export URLs. */
  exportJsonUrl:       (id: string) => `${API_V1}/pharmacovigilance/batch/${id}/export/json`,
  exportCsvUrl:        (id: string) => `${API_V1}/pharmacovigilance/batch/${id}/export/csv`,
  exportExcelUrl:      (id: string) => `${API_V1}/pharmacovigilance/batch/${id}/export/excel`,
  exportNarrativesUrl: (id: string) => `${API_V1}/pharmacovigilance/batch/${id}/export/narratives`,
  exportReportUrl:     (id: string) => `${API_V1}/pharmacovigilance/batch/${id}/export/report`,
};

// Email Responder API
export const emailResponderApi = {
  run: async (action: 'run_once' | 'start_background') => {
    const response = await fetch(`${API_V1}/email-responder/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    return handleResponse(response);
  },

  stop: async () => {
    const response = await fetch(`${API_V1}/email-responder/stop`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  getStatus: async () => {
    const response = await fetch(`${API_V1}/email-responder/status`);
    return handleResponse(response);
  },

  health: async () => {
    const response = await fetch(`${API_V1}/email-responder/health`);
    return handleResponse(response);
  },

  sendManualResponse: async (data: {
    email_id: string;
    to_address: string;
    subject: string;
    response_body: string;
  }) => {
    const response = await fetch(`${API_V1}/email-responder/send-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  configure: async (config: {
    response_tone?: 'professional' | 'friendly' | 'formal';
    auto_send?: boolean;
    check_interval?: number;
  }) => {
    const response = await fetch(`${API_V1}/email-responder/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return handleResponse(response);
  },

  getHistory: async () => {
    const response = await fetch(`${API_V1}/email-responder/history`);
    return handleResponse(response);
  },
};

// Credentials API
export const credentialsApi = {
  getRequirements: async (agentId: string) => {
    const response = await fetch(`${API_V1}/credentials/${agentId}/requirements`);
    return handleResponse(response);
  },

  save: async (agentId: string, credentials: Record<string, string>) => {
    const response = await fetch(`${API_V1}/credentials/${agentId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  getStatus: async (agentId: string) => {
    const response = await fetch(`${API_V1}/credentials/${agentId}/status`);
    return handleResponse(response);
  },
};

// Banking Voice API
export const bankingVoiceApi = {
  // Email agent style methods
  run: async (action: 'run_once' | 'start_background' | { action: string, phone_number?: string }) => {
    const response = await fetch(`${API_V1}/banking-voice/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    return handleResponse(response);
  },

  stop: async () => {
    const response = await fetch(`${API_V1}/banking-voice/stop`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  getStatus: async () => {
    const response = await fetch(`${API_V1}/banking-voice/status`);
    return handleResponse(response);
  },

  getHistory: async () => {
    const response = await fetch(`${API_V1}/banking-voice/history`);
    return handleResponse(response);
  },
};

// Voice Agent API
export const voiceAgentApi = {
  run: async (
    action:
      | 'run_once'
      | 'start_background'
      | {
          action: string;
          phone_number?: string;
          persona_id?: string;
          language_code?: string;
          custom_prompt?: string;
          issue_type?: string;
          customer_intent?: string;
          product?: string;
          service_request_type?: string;
          workflow_preset?: string;
          case_priority?: 'low' | 'medium' | 'high' | 'critical';
          notes?: string;
          query?: string;
          intent?: string;
          customer_message?: string;
        }
  ) => {
    const response = await fetch(`${API_V1}/voice-agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    return handleResponse(response);
  },

  stop: async () => {
    const response = await fetch(`${API_V1}/voice-agent/stop`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  getStatus: async () => {
    const response = await fetch(`${API_V1}/voice-agent/status`);
    return handleResponse(response);
  },

  getHistory: async () => {
    const response = await fetch(`${API_V1}/voice-agent/history`);
    return handleResponse(response);
  },

  getPersonas: async () => {
    const response = await fetch(`${API_V1}/voice-agent/personas`);
    return handleResponse(response);
  },

  getLanguages: async () => {
    const response = await fetch(`${API_V1}/voice-agent/languages`);
    return handleResponse(response);
  },

  getCases: async () => {
    const response = await fetch(`${API_V1}/voice-agent/cases`);
    return handleResponse(response);
  },

  getConnectivity: async () => {
    const response = await fetch(`${API_V1}/voice-agent/connectivity`);
    return handleResponse(response);
  },

  handoff: async (payload: { call_sid: string; target_number?: string }) => {
    const response = await fetch(`${API_V1}/voice-agent/handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};
