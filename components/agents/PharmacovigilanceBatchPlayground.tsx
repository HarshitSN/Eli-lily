/**
 * PharmacovigilanceBatchPlayground
 * Handles multi-case file upload, batch processing, analytics display,
 * and all download/export actions for the PV Batch endpoint.
 */
"use client";

import { Fragment, useCallback, useRef, useState } from "react";
import { pharmacovigilanceBatchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ────────────────────────────────────────────────────────────────────

interface AgeGroupDistribution {
  pediatric: number;
  young_adult: number;
  middle_aged: number;
  elderly: number;
  unknown: number;
}

interface GenderDistribution {
  male: number;
  female: number;
  unknown: number;
}

interface DrugEventPair {
  drug: string;
  event: string;
  count: number;
}

interface BatchSummary {
  total_cases: number;
  successful_cases: number;
  failed_cases: number;
  serious_cases: number;
  non_serious_cases: number;
  valid_cases: number;
  top_suspect_drugs: { name: string; count: number }[];
  top_adverse_events: { term: string; count: number }[];
  age_distribution: AgeGroupDistribution;
  gender_distribution: GenderDistribution;
  drug_event_pairs: DrugEventPair[];
  completeness_stats: { avg: number; min: number; max: number };
  signal_indicators: string[];
}

interface CaseResult {
  case_index: number;
  case_id: string;
  case_text_snippet: string;
  processing_error?: string;
  result: {
    success: boolean;
    caseReferenceId: string;
    narrative: string;
    intakeSource: string;
    extractedData: {
      patient: { age?: number; sex?: string; weight?: number };
      suspectDrugs: { drugName: string }[];
      adverseEvents: { term: string; seriousness?: string }[];
    };
    validation: {
      isValid: boolean;
      isSerious: boolean;
      completenessPercentage: number;
      missingMandatoryFields: string[];
    };
  };
}

interface BatchResult {
  batch_id: string;
  filename: string;
  file_type: string;
  total_cases_detected: number;
  cases: CaseResult[];
  summary: BatchSummary;
  processing_time_seconds: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt", "csv", "json", "eml"];
const ALLOWED_ACCEPT = ".pdf,.docx,.txt,.csv,.json,.eml";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "red" | "orange" | "gray";
}) {
  const ring: Record<string, string> = {
    blue:   "border-blue-200 bg-blue-50",
    green:  "border-green-200 bg-green-50",
    red:    "border-red-200 bg-red-50",
    orange: "border-orange-200 bg-orange-50",
    gray:   "border-gray-200 bg-gray-50",
  };
  const text: Record<string, string> = {
    blue:   "text-blue-700",
    green:  "text-green-700",
    red:    "text-red-700",
    orange: "text-orange-700",
    gray:   "text-gray-700",
  };
  return (
    <div className={`border rounded-xl p-4 ${ring[color]}`}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-2xl font-bold ${text[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FreqBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-36 truncate text-gray-700 shrink-0" title={label}>
        {label}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-blue-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-500 shrink-0">{count}</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function PharmacovigilanceBatchPlayground() {
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options
  const [enrichDrugs, setEnrichDrugs] = useState(false);
  const [analyzeInteractions, setAnalyzeInteractions] = useState(false);
  const [detectDuplicates, setDetectDuplicates] = useState(false);
  const [maxConcurrent, setMaxConcurrent] = useState(5);
  const [includeReport, setIncludeReport] = useState(true);
  const [includeGraphs, setIncludeGraphs] = useState(true);

  // Result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [expandedCase, setExpandedCase] = useState<number | null>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const acceptFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      acceptFile(e.dataTransfer.files?.[0]);
    },
    [acceptFile]
  );

  // ── Batch processing ───────────────────────────────────────────────────────

  const runBatch = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setExpandedCase(null);
    try {
      const res = await pharmacovigilanceBatchApi.processFile(file, {
        enrichDrugs,
        analyzeInteractions,
        detectDuplicates,
        maxConcurrent,
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? "Batch processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Download helper ────────────────────────────────────────────────────────

  const triggerDownload = (url: string, name?: string) => {
    const a = document.createElement("a");
    a.href = url;
    if (name) a.download = name;
    a.click();
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const maxDrugCount =
    result ? Math.max(...result.summary.top_suspect_drugs.map((d) => d.count), 1) : 1;
  const maxAECount =
    result ? Math.max(...result.summary.top_adverse_events.map((e) => e.count), 1) : 1;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Upload card ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            Upload Multi-Case File
          </CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload a file containing one or more adverse-event cases.
            Supported formats: PDF, DOCX, TXT, CSV, JSON, EML.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-8 px-4 cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : file
                ? "border-green-400 bg-green-50"
                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_ACCEPT}
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            {file ? (
              <>
                <span className="text-2xl">📄</span>
                <p className="text-sm font-semibold text-green-700">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB · Click to change
                </p>
              </>
            ) : (
              <>
                <span className="text-3xl text-gray-300">⬆</span>
                <p className="text-sm text-gray-500">
                  Drag & drop or <span className="text-blue-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-400">PDF · DOCX · TXT · CSV · JSON · EML</p>
              </>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                { id: "enrich", label: "Enrich Drugs", checked: enrichDrugs, onChange: setEnrichDrugs },
                { id: "interact", label: "Drug Interactions", checked: analyzeInteractions, onChange: setAnalyzeInteractions },
                { id: "dup", label: "Detect Duplicates", checked: detectDuplicates, onChange: setDetectDuplicates },
              ] as const
            ).map(({ id, label, checked, onChange }) => (
              <label
                key={id}
                className="flex items-center gap-2 text-xs cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <span className="text-gray-700 shrink-0">Concurrency:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={maxConcurrent}
                onChange={(e) => setMaxConcurrent(Math.min(20, Math.max(1, +e.target.value)))}
                className="w-12 border border-gray-300 rounded px-1.5 py-0.5 text-xs"
              />
            </label>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button
            onClick={runBatch}
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span> Processing batch…
              </span>
            ) : (
              "Process Batch"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Results ── */}
      {result && (
        <>
          {/* Summary stats */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Batch Summary&nbsp;
                <span className="font-normal text-gray-400 text-xs">
                  {result.batch_id} · {result.processing_time_seconds}s
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Total Cases"      value={result.summary.total_cases}      color="blue" />
              <StatCard label="Successful"       value={result.summary.successful_cases} color="green" />
              <StatCard label="Failed"           value={result.summary.failed_cases}     color="red" />
              <StatCard label="Serious"          value={result.summary.serious_cases}    color="red" />
              <StatCard label="Valid (ICH E2B)"  value={result.summary.valid_cases}      color="green" />
              <StatCard
                label="Avg. Completeness"
                value={`${result.summary.completeness_stats?.avg?.toFixed(0) ?? "—"}%`}
                sub={`min ${result.summary.completeness_stats?.min?.toFixed(0) ?? "—"}% · max ${result.summary.completeness_stats?.max?.toFixed(0) ?? "—"}%`}
                color="orange"
              />
            </div>
          </div>

          {/* Analytics row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Drugs */}
            {result.summary.top_suspect_drugs.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Top Suspect Drugs
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {result.summary.top_suspect_drugs.slice(0, 8).map((d) => (
                    <FreqBar key={d.name} label={d.name} count={d.count} max={maxDrugCount} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top Adverse Events */}
            {result.summary.top_adverse_events.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Top Adverse Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {result.summary.top_adverse_events.slice(0, 8).map((e) => (
                    <FreqBar key={e.term} label={e.term} count={e.count} max={maxAECount} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Demographics + Signals row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Demographics */}
            <Card className="border-border/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Patient Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div>
                  <p className="text-[11px] text-gray-500 font-medium mb-1">Gender</p>
                  <div className="flex gap-2 text-xs">
                    {Object.entries(result.summary.gender_distribution).map(([k, v]) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                      >
                        {k.charAt(0).toUpperCase() + k.slice(1)}: <b>{v as number}</b>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium mb-1">Age Groups</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      ["Pediatric (0–17)", result.summary.age_distribution.pediatric],
                      ["Young Adult (18–39)", result.summary.age_distribution.young_adult],
                      ["Middle-Aged (40–64)", result.summary.age_distribution.middle_aged],
                      ["Elderly (65+)", result.summary.age_distribution.elderly],
                      ["Age NR", result.summary.age_distribution.unknown],
                    ].map(([label, val]) => (
                      <span key={label as string} className="text-gray-600">
                        {label}: <b>{val as number}</b>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Signals */}
            {result.summary.signal_indicators.length > 0 && (
              <Card className="border-red-100 bg-red-50/30">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    Safety Signal Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1.5">
                  {result.summary.signal_indicators.map((sig, i) => (
                    <div
                      key={i}
                      className="flex gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5"
                    >
                      <span className="shrink-0">⚠</span>
                      <span>{sig}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Drug-Event pairs */}
          {result.summary.drug_event_pairs.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Drug–Adverse Event Co-occurrences (top 10)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">Drug</th>
                        <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">Adverse Event</th>
                        <th className="text-right py-1.5 text-gray-500 font-medium">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.summary.drug_event_pairs.slice(0, 10).map((p, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="py-1.5 pr-3 text-gray-700 max-w-[180px] truncate">
                            {p.drug}
                          </td>
                          <td className="py-1.5 pr-3 text-gray-700 max-w-[220px] truncate">
                            {p.event}
                          </td>
                          <td className="py-1.5 text-right font-semibold text-blue-700">
                            {p.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case table */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Individual Cases ({result.cases.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["#", "Case ID", "Age / Sex", "Drugs", "Adverse Events", "Serious", "Valid", "Complete%", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left py-2 px-2 text-gray-500 font-medium first:pl-3"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.cases.map((c) => {
                      const ed = c.result.extractedData;
                      const val = c.result.validation;
                      const drugs = (ed?.suspectDrugs || [])
                        .map((d) => d.drugName)
                        .filter(Boolean)
                        .join(", ");
                      const aes = (ed?.adverseEvents || [])
                        .map((e) => e.term)
                        .filter(Boolean)
                        .join(", ");
                      const isExpanded = expandedCase === c.case_index;

                      return (
                        <Fragment key={c.case_index}>
                          <tr
                            className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50/40 transition-colors ${
                              !c.result.success ? "bg-red-50/40" : ""
                            } ${isExpanded ? "bg-blue-50/60" : ""}`}
                            onClick={() =>
                              setExpandedCase(isExpanded ? null : c.case_index)
                            }
                          >
                            <td className="py-2 pl-3 pr-2 font-medium text-gray-500">
                              {c.case_index}
                            </td>
                            <td className="py-2 px-2 font-mono text-blue-700">{c.case_id}</td>
                            <td className="py-2 px-2 text-gray-600">
                              {ed?.patient?.age ?? "—"} / {ed?.patient?.sex ?? "—"}
                            </td>
                            <td
                              className="py-2 px-2 max-w-[160px] truncate text-gray-700"
                              title={drugs}
                            >
                              {drugs || "—"}
                            </td>
                            <td
                              className="py-2 px-2 max-w-[180px] truncate text-gray-700"
                              title={aes}
                            >
                              {aes || "—"}
                            </td>
                            <td className="py-2 px-2">
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                  val.isSerious
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {val.isSerious ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                  val.isValid
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {val.isValid ? "✓" : "✗"}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-gray-600">
                              {val.completenessPercentage?.toFixed(0)}%
                            </td>
                            <td className="py-2 px-2 text-gray-400">{isExpanded ? "▲" : "▼"}</td>
                          </tr>

                          {/* Expanded case detail */}
                          {isExpanded && (
                            <tr className="bg-blue-50/30">
                              <td colSpan={9} className="px-4 py-3">
                                {c.processing_error ? (
                                  <p className="text-xs text-red-600">
                                    Error: {c.processing_error}
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {c.result.narrative && (
                                      <div>
                                        <p className="text-[11px] font-semibold text-gray-500 mb-1">
                                          CIOMS Narrative
                                        </p>
                                        <p className="text-xs text-gray-700 leading-relaxed bg-white rounded-lg border border-blue-100 p-3">
                                          {c.result.narrative}
                                        </p>
                                      </div>
                                    )}
                                    {val.missingMandatoryFields?.length > 0 && (
                                      <p className="text-[11px] text-red-700">
                                        Missing: {val.missingMandatoryFields.join(", ")}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Downloads */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Export & Download
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {/* ZIP options */}
              <div className="flex flex-wrap gap-3 items-center">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeReport}
                    onChange={(e) => setIncludeReport(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Include PDF report</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGraphs}
                    onChange={(e) => setIncludeGraphs(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Include charts</span>
                </label>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() =>
                    triggerDownload(
                      pharmacovigilanceBatchApi.downloadUrl(result.batch_id, {
                        includeReport,
                        includeGraphs,
                      }),
                      `${result.batch_id}_export.zip`
                    )
                  }
                >
                  ⬇ Download Full ZIP
                </Button>
              </div>

              {/* Individual formats */}
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "JSON",
                    color: "bg-gray-100 hover:bg-gray-200 text-gray-700",
                    url: pharmacovigilanceBatchApi.exportJsonUrl(result.batch_id),
                    name: "cases_processed.json",
                  },
                  {
                    label: "CSV",
                    color: "bg-green-100 hover:bg-green-200 text-green-800",
                    url: pharmacovigilanceBatchApi.exportCsvUrl(result.batch_id),
                    name: "cases_processed.csv",
                  },
                  {
                    label: "Excel",
                    color: "bg-emerald-100 hover:bg-emerald-200 text-emerald-800",
                    url: pharmacovigilanceBatchApi.exportExcelUrl(result.batch_id),
                    name: "cases_processed.xlsx",
                  },
                  {
                    label: "CIOMS Narratives",
                    color: "bg-purple-100 hover:bg-purple-200 text-purple-800",
                    url: pharmacovigilanceBatchApi.exportNarrativesUrl(result.batch_id),
                    name: "cioms_narratives.txt",
                  },
                  {
                    label: "PDF Report",
                    color: "bg-red-100 hover:bg-red-200 text-red-800",
                    url: pharmacovigilanceBatchApi.exportReportUrl(result.batch_id),
                    name: "pv_summary_report.pdf",
                  },
                ].map(({ label, color, url, name }) => (
                  <button
                    key={label}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${color}`}
                    onClick={() => triggerDownload(url, name)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
