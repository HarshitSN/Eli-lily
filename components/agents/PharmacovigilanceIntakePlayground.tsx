import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { pharmacovigilanceApi, type PVIntakePayload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PharmacovigilanceBatchPlayground } from "@/components/agents/PharmacovigilanceBatchPlayground";

type Mode =
  | "text"
  | "rawEmail"
  | "ehr"
  | "clinicalTrial"
  | "socialMedia"
  | "callTranscript"
  | "patientPortal"
  | "file";

type HistoryEntry = {
  id: string;
  timestamp: number;
  mode: Mode;
  channel: string;
  drugs: string[];
  aes: string[];
  result: any;
};

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const SOURCE_TO_MODE: Record<string, Mode> = {
  text: "text",
  email: "rawEmail",
  ehr: "ehr",
  clinical_trial: "clinicalTrial",
  social_media: "socialMedia",
  call_transcript: "callTranscript",
  patient_portal: "patientPortal",
  file: "file",
};

// ── Sample content per channel ──────────────────────────────────────────────

const SAMPLE_TEXT = `Patient: 45-year-old male (approx 80 kg). Started DrugX 100 mg oral daily on 2024-01-01 for hypertension.
On 2024-01-05 developed severe headache and dizziness; visited ER but not admitted. DrugX stopped on 2024-01-06.
Outcome: improving. Reporter: Dr. Jane Doe, USA.`;

const SAMPLE_EMAIL = `From: reporter@example.com
To: pv@company.com
Subject: Suspected adverse event with DrugX

Hello,

I would like to report an adverse event. A 45-year-old male on DrugX 100 mg daily developed severe headache and dizziness on 2024-01-05.
Drug was discontinued. Patient is improving. Reporter is Dr. Jane Doe (USA).

Regards,
Jane Doe`;

const SAMPLE_EHR_NOTES = `Discharge Summary – PAT-00123
Patient: Male, 52 years, 78 kg
Diagnosis: Hypertension (ICD-10: I10)
Medications on admission: Lisinopril 10 mg oral OD
Event: Three days after initiation of Lisinopril the patient presented with angioedema of the lips and tongue.
Drug discontinued; antihistamine administered. Resolved within 24 hours.
Outcome: Recovered fully. Reporter: Dr. A. Patel, Cardiology, City Hospital, UK.`;

const SAMPLE_TRIAL_AE = `Clinical Trial: NCT04567890
Site: SITE-042  Subject: SUBJ-0017
Adverse Event: Grade 3 hepatotoxicity (elevated ALT 8× ULN) observed on Day 28 of treatment with
investigational compound ZX-100 (100 mg BID). Onset date: 2024-03-15.
Action taken: dose reduced to 50 mg BID. ALT normalised by Day 42.
Outcome: Recovered. SAE classification: Serious – medically significant.`;

const SAMPLE_SOCIAL = `just wanted to warn everyone – i started taking Metformin about 2 weeks ago for my diabetes and
ever since i've been having really bad stomach cramps and throwing up almost every day. spoke to my
pharmacist and she thinks it might be the meds. still on it but really struggling. anyone else?`;

const SAMPLE_TRANSCRIPT = `Agent: Good afternoon, XYZ Pharmaceuticals safety line, how can I help you?
Caller: Hi, yes, I'm calling about my husband. He's been taking Warfarin for about a month now and
yesterday he had a really bad nosebleed that wouldn't stop for like two hours. We had to go to the ER.
Agent: I'm sorry to hear that. What dose is he on?
Caller: 5 milligrams a day. He's 68, weighs about 85 kilos.
Agent: And what was the outcome?
Caller: They packed his nose and he was sent home. He's okay now but really shaken up.
Agent: Thank you. Can I take his patient ID or initials?
Caller: Just J.B. is fine.`;

const SAMPLE_PORTAL = `I have been taking Atorvastatin 20 mg for about 6 weeks and I'm getting muscle pain in my legs –
it's really bad in the mornings. My doctor said it could be the medication. I am 61 years old, female,
and I also take Metformin 500 mg twice a day for Type 2 Diabetes. The muscle pain started around
10 days after I began Atorvastatin.`;

// ── Channel badge styles ─────────────────────────────────────────────────────

const CHANNEL_BADGES: Record<Mode, { label: string; color: string }> = {
  text:           { label: "Plain Text",      color: "bg-gray-100 text-gray-700 border-gray-200" },
  rawEmail:       { label: "Email",           color: "bg-blue-100 text-blue-700 border-blue-200" },
  ehr:            { label: "EHR",             color: "bg-teal-100 text-teal-700 border-teal-200" },
  clinicalTrial:  { label: "Clinical Trial",  color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  socialMedia:    { label: "Social Media",    color: "bg-pink-100 text-pink-700 border-pink-200" },
  callTranscript: { label: "Call Transcript", color: "bg-orange-100 text-orange-700 border-orange-200" },
  patientPortal:  { label: "Patient Portal",  color: "bg-purple-100 text-purple-700 border-purple-200" },
  file:           { label: "File Upload",     color: "bg-red-100 text-red-700 border-red-200" },
};

const CLASSIFICATION_STYLES: Record<string, string> = {
  "Highly Probable Duplicate": "bg-red-100 text-red-700 border-red-200",
  "Possible Duplicate":        "bg-red-100 text-red-700 border-red-200",
  "Not Duplicate":             "bg-green-100 text-green-700 border-green-200",
};

export function PharmacovigilanceIntakePlayground() {
  const [viewMode, setViewMode] = useState<"single" | "batch">("single");
  const [mode, setMode] = useState<Mode>("text");

  // Per-channel state
  const [text, setText]                   = useState(SAMPLE_TEXT);
  const [rawEmail, setRawEmail]           = useState(SAMPLE_EMAIL);
  const [file, setFile]                   = useState<File | null>(null);

  // EHR
  const [ehrPatientId, setEhrPatientId]   = useState("");
  const [ehrNotes, setEhrNotes]           = useState(SAMPLE_EHR_NOTES);
  const [hl7Message, setHl7Message]       = useState("");
  const [fhirJson, setFhirJson]           = useState("");

  // Clinical Trial
  const [trialId, setTrialId]             = useState("NCT04567890");
  const [siteId, setSiteId]               = useState("SITE-042");
  const [subjectId, setSubjectId]         = useState("SUBJ-0017");
  const [aeDescription, setAeDescription] = useState(SAMPLE_TRIAL_AE);

  // Social Media
  const [smPlatform, setSmPlatform]       = useState("reddit");
  const [smContent, setSmContent]         = useState(SAMPLE_SOCIAL);
  const [smAuthorType, setSmAuthorType]   = useState("patient");
  const [smPostDate, setSmPostDate]       = useState("");

  // Call Transcript
  const [callId, setCallId]               = useState("");
  const [transcript, setTranscript]       = useState(SAMPLE_TRANSCRIPT);
  const [callerType, setCallerType]       = useState("caregiver");
  const [callDate, setCallDate]           = useState("");

  // Patient Portal
  const [ppPatientId, setPpPatientId]     = useState("");
  const [ppDate, setPpDate]               = useState("");
  const [ppSymptoms, setPpSymptoms]       = useState(SAMPLE_PORTAL);
  const [ppMeds, setPpMeds]               = useState("Atorvastatin 20mg, Metformin 500mg");
  const [ppCondition, setPpCondition]     = useState("Type 2 Diabetes, Hyperlipidemia");

  // Options
  const [enrichDrugs, setEnrichDrugs]               = useState(false);
  const [analyzeInteractions, setAnalyzeInteractions] = useState(false);
  const [detectDuplicates, setDetectDuplicates]       = useState(false);
  const [isRunning, setIsRunning]             = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [result, setResult]                   = useState<any | null>(null);

  // Case history (persisted in localStorage)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("pv-case-history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const saveToHistory = (res: any, currentMode: Mode) => {
    const entry: HistoryEntry = {
      id: res.caseReferenceId || res.case_reference_id || `PV-${Date.now()}`,
      timestamp: Date.now(),
      mode: currentMode,
      channel: res.intakeSource || currentMode,
      drugs: (res.extractedData?.suspectDrugs || [])
        .map((d: any) => d.drugName || d.drug_name)
        .filter(Boolean),
      aes: (res.extractedData?.adverseEvents || [])
        .map((e: any) => e.meddraTerm || e.meddra_term || e.term)
        .filter(Boolean),
      result: res,
    };
    setHistory((prev) => {
      const updated = [entry, ...prev.filter((h) => h.id !== entry.id)].slice(0, 30);
      try { localStorage.setItem("pv-case-history", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem("pv-case-history"); } catch {}
  };

  const canRun = useMemo(() => {
    if (isRunning) return false;
    switch (mode) {
      case "file":           return Boolean(file);
      case "rawEmail":       return rawEmail.trim().length > 0;
      case "ehr":            return (ehrNotes || hl7Message || fhirJson).trim().length > 0;
      case "clinicalTrial":  return aeDescription.trim().length > 0;
      case "socialMedia":    return smContent.trim().length > 0;
      case "callTranscript": return transcript.trim().length > 0;
      case "patientPortal":  return ppSymptoms.trim().length > 0;
      default:               return text.trim().length > 0;
    }
  }, [isRunning, mode, file, rawEmail, ehrNotes, hl7Message, fhirJson,
      aeDescription, smContent, transcript, ppSymptoms, text]);

  const buildPayload = (): PVIntakePayload => {
    switch (mode) {
      case "rawEmail":
        return { sourceType: "email", rawEmail };
      case "ehr":
        return {
          sourceType: "ehr",
          ehrData: {
            patientId: ehrPatientId || undefined,
            clinicalNotes: ehrNotes || undefined,
            hl7Message: hl7Message || undefined,
            fhirJson: fhirJson || undefined,
          },
        };
      case "clinicalTrial":
        return {
          sourceType: "clinical_trial",
          clinicalTrialRecord: {
            trialId: trialId || undefined,
            siteId: siteId || undefined,
            subjectId: subjectId || undefined,
            aeDescription,
          },
        };
      case "socialMedia":
        return {
          sourceType: "social_media",
          socialMediaPost: {
            platform: smPlatform || undefined,
            content: smContent,
            authorType: smAuthorType || undefined,
            postDate: smPostDate || undefined,
          },
        };
      case "callTranscript":
        return {
          sourceType: "call_transcript",
          callTranscript: {
            callId: callId || undefined,
            transcript,
            callerType: callerType || undefined,
            callDate: callDate || undefined,
          },
        };
      case "patientPortal":
        return {
          sourceType: "patient_portal",
          patientPortal: {
            patientId: ppPatientId || undefined,
            submissionDate: ppDate || undefined,
            symptomDescription: ppSymptoms,
            medications: ppMeds ? ppMeds.split(",").map((m) => m.trim()).filter(Boolean) : undefined,
            condition: ppCondition || undefined,
          },
        };
      default:
        return { sourceType: "text", text };
    }
  };

  const run = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      if (mode === "file") {
        if (!file) throw new Error("Please choose a file to upload.");
        const res = await pharmacovigilanceApi.intakeFile(file, enrichDrugs, analyzeInteractions, detectDuplicates);
        setResult(res);
        saveToHistory(res, mode);
        return;
      }
      const res = await pharmacovigilanceApi.intake(buildPayload(), enrichDrugs, analyzeInteractions, detectDuplicates);
      setResult(res);
      saveToHistory(res, mode);
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const caseId = result.caseReferenceId || result.case_reference_id || "PV-UNKNOWN";
    const ed = result.extractedData || {};
    const patient = ed.patient || {};
    const reporter = ed.reporter || {};
    const drugs: any[] = ed.suspectDrugs || [];
    const aes: any[] = ed.adverseEvents || [];
    const val = result.validation || {};
    const now = new Date().toLocaleString();

    const esc = (s: any) => String(s ?? "—").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

    const drugsRows = drugs.length
      ? drugs.map(d => `<tr><td>${esc(d.drugName)}</td><td>${esc(d.dosage)}</td><td>${esc(d.route)}</td><td>${esc(d.drugIndication)}</td><td>${esc(d.startDate)}</td></tr>`).join("")
      : `<tr><td colspan="5" style="color:#888">None extracted</td></tr>`;

    const aeRows = aes.length
      ? aes.map(e => `<tr><td>${esc(e.term)}</td><td>${esc(e.meddraTerm)}</td><td>${esc(e.meddraCode)}</td><td>${esc(e.seriousness)}</td><td>${esc(e.outcome)}</td></tr>`).join("")
      : `<tr><td colspan="5" style="color:#888">None extracted</td></tr>`;

    const missingFields = (val.missingMandatoryFields || []).map((f: string) => `<li>${esc(f)}</li>`).join("");
    const warnings = (val.warnings || []).map((w: string) => `<li>${esc(w)}</li>`).join("");

    const interactionSection = result.drugInteractionAnalysis ? (() => {
      const ia = result.drugInteractionAnalysis;
      const ixRows = (ia.interactionsFound || []).map((r: any) =>
        `<tr><td>${esc(r.drug1)}</td><td>${esc(r.drug2)}</td><td>${esc(r.severity)}</td><td>${esc(r.description)}</td></tr>`
      ).join("") || `<tr><td colspan="4" style="color:#888">No interactions detected</td></tr>`;
      return `<h2>Drug Interaction Analysis</h2>
        <p><strong>Risk summary:</strong> ${esc(ia.riskSummary)}</p>
        <table><thead><tr><th>Drug 1</th><th>Drug 2</th><th>Severity</th><th>Description</th></tr></thead><tbody>${ixRows}</tbody></table>`;
    })() : "";

    const enrichSection = result.drugEnrichments?.length ? (() => {
      const rows = result.drugEnrichments.map((e: any) =>
        `<tr><td>${esc(e.drug_name)}</td><td>${e.success ? "Found" : "Not found"}</td><td>${esc(e.enriched?.brand_name)}</td><td>${esc(e.enriched?.atc_code)}</td><td>${esc(e.enriched?.therapeutic_class)}</td></tr>`
      ).join("");
      return `<h2>Drug Enrichments</h2>
        <table><thead><tr><th>Drug</th><th>Status</th><th>Brand</th><th>ATC</th><th>Class</th></tr></thead><tbody>${rows}</tbody></table>`;
    })() : "";

    const dupSection = result.duplicateAnalysis ? (() => {
      const da = result.duplicateAnalysis;
      return `<h2>Duplicate Detection</h2>
        <p><strong>Result:</strong> ${da.overallDuplicateFlag ? "⚠ Duplicate Detected" : "✓ No Duplicate"} &nbsp; <strong>Confidence:</strong> ${((da.confidence || 0) * 100).toFixed(0)}%</p>`;
    })() : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PV Case Report – ${caseId}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 40px; line-height: 1.5; }
  h1 { font-size: 20px; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; color: #1d4ed8; }
  h2 { font-size: 15px; margin-top: 28px; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th { background: #f3f4f6; text-align: left; padding: 6px 8px; border: 1px solid #d1d5db; }
  td { padding: 5px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
  .meta-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; }
  .meta-item .label { color: #6b7280; font-size: 11px; }
  .meta-item .value { font-weight: 600; }
  .narrative { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 14px; white-space: pre-wrap; font-size: 13px; line-height: 1.7; margin-top: 8px; }
  .badge { display:inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-valid { background:#d1fae5; color:#065f46; }
  .badge-invalid { background:#fee2e2; color:#991b1b; }
  ul { margin: 4px 0; padding-left: 20px; }
  .footer { margin-top: 40px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>Pharmacovigilance Case Report</h1>
<div class="meta">
  <div class="meta-item"><div class="label">Case Reference ID</div><div class="value">${esc(caseId)}</div></div>
  <div class="meta-item"><div class="label">Intake Source</div><div class="value">${esc(result.intakeSource || "—").replace(/_/g," ")}</div></div>
  <div class="meta-item"><div class="label">Validity</div><div class="value"><span class="badge ${val.isValid ? "badge-valid" : "badge-invalid"}">${val.isValid ? "Valid" : "Invalid"}</span></div></div>
  <div class="meta-item"><div class="label">Completeness</div><div class="value">${esc(val.completenessPercentage?.toFixed(1))}%</div></div>
</div>

<h2>Patient Information</h2>
<table><tbody>
  <tr><th>Patient ID</th><td>${esc(patient.patientId)}</td><th>Age</th><td>${patient.age ? `${patient.age} ${patient.ageUnit || "year"}(s)` : "—"}</td></tr>
  <tr><th>Sex</th><td>${{"M":"Male","F":"Female","U":"Unknown"}[patient.sex as string] || esc(patient.sex)}</td><th>Weight</th><td>${patient.weight ? `${patient.weight} kg` : "—"}</td></tr>
</tbody></table>

<h2>Reporter Information</h2>
<table><tbody>
  <tr><th>Name</th><td>${esc(reporter.reporterName)}</td><th>Organisation</th><td>${esc(reporter.reporterOrganization)}</td></tr>
  <tr><th>Country</th><td>${esc(reporter.reporterCountry)}</td><th>Qualification</th><td>${esc(reporter.reporterQualification)}</td></tr>
</tbody></table>

<h2>Suspect Drug(s)</h2>
<table><thead><tr><th>Drug Name</th><th>Dosage</th><th>Route</th><th>Indication</th><th>Start Date</th></tr></thead>
<tbody>${drugsRows}</tbody></table>

<h2>Adverse Event(s)</h2>
<table><thead><tr><th>Term</th><th>MedDRA PT</th><th>MedDRA Code</th><th>Seriousness</th><th>Outcome</th></tr></thead>
<tbody>${aeRows}</tbody></table>

<h2>Validation</h2>
${missingFields ? `<p><strong>Missing mandatory fields:</strong></p><ul>${missingFields}</ul>` : "<p>All mandatory fields present.</p>"}
${warnings ? `<p><strong>Warnings:</strong></p><ul>${warnings}</ul>` : ""}

<h2>CIOMS-Style Narrative</h2>
<div class="narrative">${esc(result.narrative || "—")}</div>

${enrichSection}
${interactionSection}
${dupSection}

<div class="footer">Generated by Pharmacovigilance Agent &nbsp;·&nbsp; ${now}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${caseId}-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const badge = CHANNEL_BADGES[mode];

  const activeId = result?.caseReferenceId || result?.case_reference_id;

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pharmacovigilance Agent
        </h1>
        <p className="text-gray-600">
          Submit an adverse event report from any channel and review extracted ICH E2B-style fields,
          validation, and a CIOMS-style narrative.
        </p>
      </div>

      {/* ── Top-level mode switcher ── */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1 gap-1">
          <button
            onClick={() => setViewMode("single")}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === "single"
                ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Single Case Intake
          </button>
          <button
            onClick={() => setViewMode("batch")}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === "batch"
                ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Batch Processing
          </button>
        </div>
      </div>

      {/* ── Batch mode ── */}
      {viewMode === "batch" && (
        <div className="max-w-5xl mx-auto">
          <PharmacovigilanceBatchPlayground />
        </div>
      )}

      {/* ── Single-case mode ── */}
      {viewMode === "single" && <div className="flex gap-4 items-start">
        {/* ── History sidebar ── */}
        <aside className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-200 ${sidebarOpen ? "w-52" : "w-9"}`}>
          {sidebarOpen ? (
            <Card className="border-border/60 flex flex-col sticky top-[120px] max-h-[calc(100vh-148px)]">
              <CardHeader className="p-3 pb-2 flex flex-row items-center gap-1.5">
                <CardTitle className="text-sm font-semibold flex-1">
                  History
                  {history.length > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">({history.length})</span>
                  )}
                </CardTitle>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-gray-700 hover:bg-gray-100 text-xs"
                  title="Collapse history"
                >
                  ◀
                </button>
              </CardHeader>
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1 py-3 text-center leading-relaxed">
                    No cases yet.<br />Run an intake to see history here.
                  </p>
                ) : (
                  history.map((entry) => {
                    const entryMode = SOURCE_TO_MODE[entry.channel] || entry.mode;
                    const badgeStyle = CHANNEL_BADGES[entryMode]?.color || "bg-gray-100 text-gray-700 border-gray-200";
                    const isActive = activeId === entry.id;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => setResult(entry.result)}
                        className={`w-full text-left rounded-lg border p-2 text-xs transition-colors hover:bg-blue-50 hover:border-blue-200 ${
                          isActive ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200" : "bg-white border-border/60"
                        }`}
                      >
                        <div className="font-semibold text-gray-900 truncate text-[11px]">{entry.id}</div>
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full border mt-1 ${badgeStyle}`}>
                          {CHANNEL_BADGES[entryMode]?.label || entry.channel.replace(/_/g, " ")}
                        </span>
                        {entry.drugs.length > 0 && (
                          <div className="text-muted-foreground mt-1 truncate text-[10px]">
                            💊 {entry.drugs.slice(0, 2).join(", ")}{entry.drugs.length > 2 ? " +more" : ""}
                          </div>
                        )}
                        {entry.aes.length > 0 && (
                          <div className="text-muted-foreground truncate text-[10px]">
                            ⚠ {entry.aes.slice(0, 2).join(", ")}{entry.aes.length > 2 ? " +more" : ""}
                          </div>
                        )}
                        <div className="text-muted-foreground mt-1 text-[10px]">
                          {formatRelativeTime(entry.timestamp)}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {history.length > 0 && (
                <div className="p-2 border-t">
                  <button
                    onClick={clearHistory}
                    className="text-[11px] text-red-500 hover:text-red-700 w-full text-center py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </Card>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 rounded-lg border border-border/60 bg-white flex items-center justify-center text-xs text-muted-foreground hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm"
                title={`Show history (${history.length} case${history.length !== 1 ? "s" : ""})`}
              >
                ▶
              </button>
              {history.length > 0 && (
                <span className="text-[10px] text-muted-foreground [writing-mode:vertical-lr] rotate-180 select-none">
                  {history.length} case{history.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Input panel ── */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Input
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              {/* Row 1 */}
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="rawEmail">Email</TabsTrigger>
                <TabsTrigger value="ehr">EHR</TabsTrigger>
                <TabsTrigger value="clinicalTrial">Trial</TabsTrigger>
              </TabsList>
              {/* Row 2 */}
              <TabsList className="grid grid-cols-4 w-full mt-1">
                <TabsTrigger value="socialMedia">Social</TabsTrigger>
                <TabsTrigger value="callTranscript">Call</TabsTrigger>
                <TabsTrigger value="patientPortal">Portal</TabsTrigger>
                <TabsTrigger value="file">File</TabsTrigger>
              </TabsList>

              {/* ── Text ── */}
              <TabsContent value="text" className="mt-4 space-y-2">
                <Label>Adverse event report (plain text)</Label>
                <textarea
                  value={text}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                  className="w-full min-h-[240px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Paste an adverse event report…"
                />
                <div className="text-xs text-muted-foreground">
                  Include patient age/sex, suspect drug(s), and event term(s) for best completeness.
                </div>
              </TabsContent>

              {/* ── Email ── */}
              <TabsContent value="rawEmail" className="mt-4 space-y-2">
                <Label>Raw email (headers + body, or body only)</Label>
                <textarea
                  value={rawEmail}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRawEmail(e.target.value)}
                  className="w-full min-h-[240px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Paste raw email content…"
                />
                <div className="text-xs text-muted-foreground">
                  Supports forwarded HCP/consumer emails and safety mailbox submissions.
                </div>
              </TabsContent>

              {/* ── EHR ── */}
              <TabsContent value="ehr" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Patient ID (optional)</Label>
                    <Input
                      value={ehrPatientId}
                      onChange={(e) => setEhrPatientId(e.target.value)}
                      placeholder="PAT-00123"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Clinical Notes / Discharge Summary</Label>
                  <textarea
                    value={ehrNotes}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEhrNotes(e.target.value)}
                    className="w-full min-h-[160px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Paste clinical notes, discharge summary…"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">HL7 v2 Message (optional)</Label>
                  <textarea
                    value={hl7Message}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHl7Message(e.target.value)}
                    className="w-full min-h-[60px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-mono"
                    placeholder="MSH|…&#10;PID|…"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">FHIR Bundle JSON (optional)</Label>
                  <textarea
                    value={fhirJson}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFhirJson(e.target.value)}
                    className="w-full min-h-[60px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-mono"
                    placeholder='{"resourceType":"Bundle",…}'
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Structured medical data from hospital EHR systems — enables high-precision signal detection.
                </div>
              </TabsContent>

              {/* ── Clinical Trial ── */}
              <TabsContent value="clinicalTrial" className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Trial ID</Label>
                    <Input value={trialId} onChange={(e) => setTrialId(e.target.value)} placeholder="NCT…" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Site ID</Label>
                    <Input value={siteId} onChange={(e) => setSiteId(e.target.value)} placeholder="SITE-042" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subject ID</Label>
                    <Input value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="SUBJ-0017" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SAE / AE Description</Label>
                  <textarea
                    value={aeDescription}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAeDescription(e.target.value)}
                    className="w-full min-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Describe the serious adverse event…"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Structured SAE reporting from clinical trial sites — automatically mapped to ICH E2B fields.
                </div>
              </TabsContent>

              {/* ── Social Media ── */}
              <TabsContent value="socialMedia" className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Platform</Label>
                    <Input value={smPlatform} onChange={(e) => setSmPlatform(e.target.value)} placeholder="twitter, reddit…" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Author type</Label>
                    <Input value={smAuthorType} onChange={(e) => setSmAuthorType(e.target.value)} placeholder="patient, caregiver…" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Post date</Label>
                    <Input type="date" value={smPostDate} onChange={(e) => setSmPostDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Post content</Label>
                  <textarea
                    value={smContent}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSmContent(e.target.value)}
                    className="w-full min-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    placeholder="Paste social media post text…"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Lay/informal language is normalised to MedDRA terms for signal detection.
                </div>
              </TabsContent>

              {/* ── Call Transcript ── */}
              <TabsContent value="callTranscript" className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Call ID</Label>
                    <Input value={callId} onChange={(e) => setCallId(e.target.value)} placeholder="CALL-00192" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Caller type</Label>
                    <Input value={callerType} onChange={(e) => setCallerType(e.target.value)} placeholder="patient, caregiver, hcp" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Call date</Label>
                    <Input type="date" value={callDate} onChange={(e) => setCallDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Call transcript (voice-to-text)</Label>
                  <textarea
                    value={transcript}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTranscript(e.target.value)}
                    className="w-full min-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Paste call transcript with speaker turns…"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Voice-to-text AE extraction from call centre conversations.
                </div>
              </TabsContent>

              {/* ── Patient Portal ── */}
              <TabsContent value="patientPortal" className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Patient ID</Label>
                    <Input value={ppPatientId} onChange={(e) => setPpPatientId(e.target.value)} placeholder="PAT-0092" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Submission date</Label>
                    <Input type="date" value={ppDate} onChange={(e) => setPpDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Medications (comma-separated)</Label>
                  <Input
                    value={ppMeds}
                    onChange={(e) => setPpMeds(e.target.value)}
                    placeholder="Atorvastatin 20mg, Metformin 500mg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Underlying condition</Label>
                  <Input value={ppCondition} onChange={(e) => setPpCondition(e.target.value)} placeholder="e.g. Type 2 Diabetes" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Symptom description</Label>
                  <textarea
                    value={ppSymptoms}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPpSymptoms(e.target.value)}
                    className="w-full min-h-[160px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Describe what the patient experienced…"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Direct patient reporting via patient portals — enables real-world evidence capture.
                </div>
              </TabsContent>

              {/* ── File ── */}
              <TabsContent value="file" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Upload file (PDF / DOCX / TXT / EML)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.docx,.txt,.eml"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
                  />
                  {file && (
                    <div className="text-xs text-muted-foreground">
                      Selected: <span className="font-medium">{file.name}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Options */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  id="enrich-drugs"
                  type="checkbox"
                  checked={enrichDrugs}
                  onChange={(e) => setEnrichDrugs(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="enrich-drugs" className="text-sm cursor-pointer select-none">
                  Enrich suspect drugs (FDA label intelligence)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="analyze-interactions"
                  type="checkbox"
                  checked={analyzeInteractions}
                  onChange={(e) => setAnalyzeInteractions(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="analyze-interactions" className="text-sm cursor-pointer select-none">
                  Analyze drug interactions (RxNorm)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="detect-duplicates"
                  type="checkbox"
                  checked={detectDuplicates}
                  onChange={(e) => setDetectDuplicates(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="detect-duplicates" className="text-sm cursor-pointer select-none">
                  Detect duplicates (ICSR deduplication)
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button onClick={run} disabled={!canRun} className="font-semibold">
                {isRunning ? "Running…" : "Try"}
              </Button>
              <div className="text-xs text-muted-foreground">
                Backend: <span className="font-medium">Set <code>NEXT_PUBLIC_API_URL</code> (defaults to <code>http://localhost:8000</code>)</span>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Output panel ── */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <CardTitle className="text-lg flex-1">Output</CardTitle>
            {result && (
              <button
                onClick={downloadReport}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-400 bg-red-400 hover:bg-red-500 hover:border-red-500 transition-colors shadow-sm text-black"
                title="Download as HTML report (printable as PDF)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download Report
              </button>
            )}
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-sm text-muted-foreground">
                Run the agent to see the JSON response here.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Case ref + source badge */}
                <div className="rounded-lg border bg-secondary/10 p-3 flex items-center gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Case Reference ID</div>
                    <div className="font-semibold">{result.caseReferenceId || result.case_reference_id || "—"}</div>
                  </div>
                  {result.intakeSource && (
                    <div className="ml-auto">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        CHANNEL_BADGES[result.intakeSource.replace("_", "") as Mode]?.color ||
                        "bg-gray-100 text-gray-700 border-gray-200"
                      }`}>
                        {result.intakeSource.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Source metadata */}
                {result.sourceMetadata && Object.keys(result.sourceMetadata).length > 0 && (
                  <div className="rounded-lg border bg-white">
                    <div className="px-3 py-2 border-b text-sm font-medium">Source Metadata</div>
                    <div className="p-3 flex flex-wrap gap-2">
                      {Object.entries(result.sourceMetadata).map(([k, v]) => (
                        <span key={k} className="text-xs bg-gray-100 rounded px-2 py-0.5">
                          <span className="text-muted-foreground">{k}: </span>
                          <span className="font-medium">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Narrative */}
                <div className="rounded-lg border bg-white">
                  <div className="px-3 py-2 border-b text-sm font-medium">Narrative</div>
                  <div className="p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.narrative || "—"}
                  </div>
                </div>

                {/* Drug enrichments */}
                {result.drugEnrichments && result.drugEnrichments.length > 0 && (
                  <div className="rounded-lg border bg-white">
                    <div className="px-3 py-2 border-b text-sm font-medium">Drug Enrichments</div>
                    <div className="p-3 space-y-3">
                      {result.drugEnrichments.map((enr: any, i: number) => (
                        <div key={i} className={`rounded-lg border p-3 text-sm ${enr.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${enr.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {enr.success ? "Found" : "Not found"}
                            </span>
                            <span className="font-medium">{enr.drug_name}</span>
                            {enr.source_used && <span className="ml-auto text-xs text-muted-foreground">{enr.source_used}</span>}
                          </div>
                          {enr.enriched && (
                            <div className="space-y-1 text-xs text-gray-700">
                              {enr.enriched.brand_name && <div><span className="text-muted-foreground">Brand: </span>{enr.enriched.brand_name}</div>}
                              {enr.enriched.substance_name && <div><span className="text-muted-foreground">Substance: </span>{enr.enriched.substance_name}</div>}
                              {enr.enriched.atc_code && <div><span className="text-muted-foreground">ATC: </span>{enr.enriched.atc_code}</div>}
                              {enr.enriched.therapeutic_class && <div><span className="text-muted-foreground">Class: </span>{enr.enriched.therapeutic_class}</div>}
                              {enr.enriched.black_box_warnings?.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded p-1 mt-1">
                                  <span className="text-red-600 font-semibold">⚠ Black Box: </span>
                                  {enr.enriched.black_box_warnings.slice(0, 1).join("; ")}
                                  {enr.enriched.black_box_warnings.length > 1 ? "…" : ""}
                                </div>
                              )}
                              {enr.enriched.indications?.length > 0 && (
                                <div><span className="text-muted-foreground">Indications: </span>{enr.enriched.indications.slice(0, 2).join("; ")}{enr.enriched.indications.length > 2 ? "…" : ""}</div>
                              )}
                              {enr.enriched.adverse_reactions?.length > 0 && (
                                <div><span className="text-muted-foreground">Known reactions: </span>{enr.enriched.adverse_reactions.slice(0, 2).join("; ")}{enr.enriched.adverse_reactions.length > 2 ? "…" : ""}</div>
                              )}
                              {enr.enriched.pubmed_references?.length > 0 && (
                                <div className="pt-1">
                                  <span className="text-muted-foreground">Literature: </span>
                                  {enr.enriched.pubmed_references.slice(0, 2).map((ref: any) => (
                                    <a key={ref.pmid} href={ref.url} target="_blank" rel="noreferrer" className="block text-blue-600 hover:underline truncate">{ref.title}</a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {!enr.success && enr.message && (
                            <div className="text-xs text-muted-foreground mt-1">{enr.message}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drug interaction analysis */}
                {result.drugInteractionAnalysis && (
                  <div className="rounded-lg border bg-white">
                    <div className="px-3 py-2 border-b text-sm font-medium flex items-center gap-2">
                      Drug Interaction Analysis
                      {result.drugInteractionAnalysis.highSeverityCount > 0 ? (
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">
                          {result.drugInteractionAnalysis.highSeverityCount} High Severity
                        </span>
                      ) : result.drugInteractionAnalysis.interactionsFound?.length > 0 ? (
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">
                          {result.drugInteractionAnalysis.interactionsFound.length} Found
                        </span>
                      ) : (
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200">
                          None Detected
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-3">
                      <p className="text-sm text-gray-700">{result.drugInteractionAnalysis.riskSummary}</p>

                      {result.drugInteractionAnalysis.drugsUnresolved?.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Could not resolve: {result.drugInteractionAnalysis.drugsUnresolved.join(", ")}
                        </div>
                      )}

                      {result.drugInteractionAnalysis.interactionsFound?.length > 0 && (
                        <div className="space-y-2">
                          {result.drugInteractionAnalysis.interactionsFound.map((rec: any, i: number) => {
                            const sevColor =
                              rec.severity === "contraindicated" ? "bg-red-100 text-red-700 border-red-200" :
                              rec.severity === "major"           ? "bg-orange-100 text-orange-700 border-orange-200" :
                              rec.severity === "moderate"        ? "bg-red-100 text-red-700 border-red-200" :
                              rec.severity === "minor"           ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                                   "bg-gray-100 text-gray-700 border-gray-200";
                            return (
                              <div key={i} className="rounded-lg border bg-gray-50 p-3 text-xs space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-semibold px-2 py-0.5 rounded-full border ${sevColor}`}>
                                    {rec.severity}
                                  </span>
                                  <span className="font-medium text-sm">{rec.drug1}</span>
                                  <span className="text-muted-foreground">↔</span>
                                  <span className="font-medium text-sm">{rec.drug2}</span>
                                  {rec.source && (
                                    <span className="ml-auto text-muted-foreground">{rec.source}</span>
                                  )}
                                </div>
                                <p className="text-gray-700 leading-relaxed">{rec.description}</p>
                                {rec.aeLink && (
                                  <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1 text-orange-700">
                                    Reported AE match: <span className="font-semibold">{rec.aeLink}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {result.drugInteractionAnalysis.aeInteractionFlags?.length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">AE-interaction flags: </span>
                          {result.drugInteractionAnalysis.aeInteractionFlags.map((flag: string, i: number) => (
                            <span key={i} className="inline-block bg-orange-100 text-orange-700 rounded px-1.5 py-0.5 mr-1">{flag}</span>
                          ))}
                        </div>
                      )}

                      {result.drugInteractionAnalysis.sourcesUsed?.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Sources: {result.drugInteractionAnalysis.sourcesUsed.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Duplicate detection */}
                {result.duplicateAnalysis && (
                  <div className="rounded-lg border bg-white">
                    <div className="px-3 py-2 border-b text-sm font-medium flex items-center gap-2">
                      Duplicate Detection
                      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        result.duplicateAnalysis.overallDuplicateFlag
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-green-100 text-green-700 border-green-200"
                      }`}>
                        {result.duplicateAnalysis.overallDuplicateFlag ? "Duplicate Detected" : "No Duplicate"}
                      </span>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Confidence: <span className="font-semibold text-gray-800">{(result.duplicateAnalysis.confidence * 100).toFixed(0)}%</span></span>
                        <span>Matches checked: <span className="font-semibold text-gray-800">{result.duplicateAnalysis.duplicateAnalysis?.length ?? 0}</span></span>
                      </div>
                      {result.duplicateAnalysis.duplicateAnalysis?.length > 0 ? (
                        <div className="space-y-2">
                          {result.duplicateAnalysis.duplicateAnalysis.map((match: any, i: number) => (
                            <div key={i} className="rounded-lg border bg-gray-50 p-3 text-xs space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold px-2 py-0.5 rounded-full border text-xs ${CLASSIFICATION_STYLES[match.classification] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                                  {match.classification}
                                </span>
                                <span className="font-medium text-sm">{match.matchedCaseId}</span>
                                <span className="ml-auto font-semibold text-gray-800">Score: {(match.finalScore * 100).toFixed(0)}%</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-muted-foreground">
                                <span>Semantic: <span className="text-gray-700 font-medium">{(match.embeddingSimilarity * 100).toFixed(0)}%</span></span>
                                <span>Structured: <span className="text-gray-700 font-medium">{(match.structuredMatchScore * 100).toFixed(0)}%</span></span>
                              </div>
                              {match.matchingFields && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {match.matchingFields.same_drug && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Same drug</span>}
                                  {match.matchingFields.same_meddra_pt && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Same MedDRA PT</span>}
                                  {match.matchingFields.gender_match && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Gender match</span>}
                                  {match.matchingFields.age_close && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Age close</span>}
                                  {match.matchingFields.date_proximity && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Date proximity</span>}
                                  {match.matchingFields.same_country && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">Same country</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No historical cases to compare against yet.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Full JSON */}
                <div className="rounded-lg border bg-white">
                  <div className="px-3 py-2 border-b text-sm font-medium">Full JSON</div>
                  <pre className="p-3 text-xs overflow-auto max-h-[360px]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </div>{/* end main content */}
      </div>}{/* end single-case mode */}
    </div>
  );
}
