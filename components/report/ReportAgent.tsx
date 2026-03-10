import React, { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Upload, FileSpreadsheet, BarChart3, MessageSquare, RefreshCw, Download, Loader2, Layout, Grid, X, FileText, File, ExternalLink, Image } from 'lucide-react';
import { DataUploader } from './DataUploader';
import { VisualizationCanvas } from './VisualizationCanvas';
import { ChatPanel } from './ChatPanel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ReportData {
  filename: string;
  row_count: number;
  columns: string[];
  schema: {
    fields: Array<{
      name: string;
      dtype: string;
      category: string;
      stats?: any;
    }>;
    numeric_fields: string[];
    categorical_fields: string[];
    date_fields: string[];
  };
  visualizations: Array<{
    type: string;
    title: string;
    x_axis?: string;
    y_axis?: string;
    category_column?: string;
    value_column?: string;
    aggregation?: string;
    column?: string;
    description?: string;
  }>;
  insights: string[];
  narrative: string;
  preview: any[];
  /** Full-dataset statistics from the backend (numeric_summary, etc.) */
  analysis_results?: any;
}

type ViewMode = 'split' | 'chat' | 'canvas';

export default function ReportAgent() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [vizKey, setVizKey] = useState(0); // Force re-render key
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [knowledgeGraph, setKnowledgeGraph] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, { original: string; display: string }>>({});
  const [lastChatResponse, setLastChatResponse] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Add each file to form data
      files.forEach((file, index) => {
        formData.append('files', file);
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/report/upload-multiple`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload files');
      
      const result = await response.json();
      
      if (result.success) {
        // Persist the session ID returned by the backend
        if (result.data.session_id) {
          setSessionId(result.data.session_id);
        }

        setReportData({
          filename: result.data.files.map((f: any) => f.filename).join(', '),
          row_count: result.data.total_rows,
          columns: result.data.schema?.fields?.map((f: any) => f.name) || [],
          schema: result.data.schema,
          visualizations: result.data.visualizations || [],
          insights: result.data.insights || [],
          narrative: result.data.narrative || '',
          preview: result.data.preview || [],
          analysis_results: result.data.analysis_results || {},
        });

        // Store additional data
        setCorrelations(result.data.correlations || []);
        setKnowledgeGraph(result.data.knowledge_graph || null);
        setColumnMapping(result.data.column_mapping || {});
      } else {
        throw new Error(result.error || 'Failed to process files');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChatMessage = useCallback(async (message: string) => {
    if (!reportData) return;
    setIsLoading(true);
    setLastChatResponse(''); // Clear previous response
    
    // Extract chart type from user query
    const detectChartType = (query: string): string | null => {
      const q = query.toLowerCase();

      // Check for specific chart types in query
      if (q.includes('pie') || q.includes('donut') || q.includes('distribution')) return 'pie';
      if (q.includes('line') || q.includes('trend') || q.includes('over time') || q.includes('timeline')) return 'line';
      if (q.includes('bar') || q.includes('compare') || q.includes('comparison')) return 'bar';
      if (q.includes('kpi') || q.includes('metric') || q.includes('total') || q.includes('sum') || q.includes('count') || q.includes('average') || q.includes('avg') || q.includes('show me the')) return 'kpi';
      if (q.includes('table') || q.includes('raw data') || q.includes('data table')) return 'table';

      return null; // No specific chart type detected
    };

    // Deduplicate visualizations based on type, column, and aggregation
    const deduplicateCharts = (charts: any[]): any[] => {
      const seen = new Set<string>();
      return charts.filter(chart => {
        // Create a unique key based on type, column, x_axis, y_axis, and aggregation
        const key = [
          chart.type,
          chart.column || '',
          chart.x_axis || '',
          chart.y_axis || '',
          chart.aggregation || '',
          chart.title?.toLowerCase() || ''
        ].join('|');

        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    };
    
    try {
      // Use the enhanced chat endpoint which has access to correlations and knowledge graph
      const response = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/report/chat-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          data_context: {
            summary: { row_count: reportData.row_count, columns: reportData.columns },
            analysis: {},
            correlations: correlations,
            knowledge_graph: knowledgeGraph,
          },
          schema: reportData.schema,
          visualizations: reportData.visualizations,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const result = await response.json();

      // ── New unified response: {response, charts, action} ──────────────────
      // Get existing visualizations to check for duplicates
      const existingViz = reportData?.visualizations || [];
      const allExistingKeys = new Set(existingViz.map(v =>
        [v.type, v.column || '', v.x_axis || '', v.y_axis || '', v.aggregation || '', v.title?.toLowerCase() || ''].join('|')
      ));

      // Define messageLower early for use in fallback chart generation
      const messageLower = message.toLowerCase();

      if (result.success) {
        const responseText = result.data?.response;
        const newCharts: any[] = result.data?.charts || [];

        if (responseText) {
          setLastChatResponse(responseText);
        }

        // Always generate fallback charts if AI doesn't return useful charts
        // or combine AI charts with fallback charts
        const wantsChart = messageLower.includes('chart') ||
                          messageLower.includes('graph') ||
                          messageLower.includes('visualization') ||
                          messageLower.includes('kpi') ||
                          messageLower.includes('metric') ||
                          messageLower.includes('total') ||
                          messageLower.includes('sum') ||
                          messageLower.includes('show me');

        // If AI didn't return charts but user wants a chart, generate fallback
        let fallbackCharts: any[] = [];
        if (wantsChart && newCharts.length === 0) {
          const numericFields = reportData.schema?.numeric_fields || [];
          const categoricalFields = reportData.schema?.categorical_fields || [];
          const detectedChartType = detectChartType(message);

          const mentionedNumeric = numericFields.filter((f: string) =>
            messageLower.includes(f.toLowerCase())
          );
          const mentionedCategorical = categoricalFields.filter((f: string) =>
            messageLower.includes(f.toLowerCase())
          );

          // Find column mentioned in query for KPI (e.g., "total outstanding_debt")
          const mentionedCol = mentionedNumeric[0] || numericFields.find((f: string) =>
            messageLower.includes(f.toLowerCase().replace(/_/g, ' '))
          );

          const chartType = detectedChartType || (mentionedNumeric.length >= 2 ? 'bar' : 'bar');

          if (chartType === 'kpi' && mentionedCol) {
            const agg = messageLower.includes('average') || messageLower.includes('avg') ? 'avg' :
                        messageLower.includes('count') ? 'count' :
                        messageLower.includes('max') ? 'max' :
                        messageLower.includes('min') ? 'min' : 'sum';
            fallbackCharts = [{
              type: 'kpi',
              title: `Total ${mentionedCol}`,
              column: mentionedCol,
              aggregation: agg,
              description: `Shows ${agg} of ${mentionedCol}`,
            }];
          } else if (chartType === 'pie') {
            const catCol = mentionedCategorical[0] || categoricalFields[0];
            if (catCol) {
              fallbackCharts = [{
                type: 'pie',
                title: `Distribution by ${catCol}`,
                x_axis: catCol,
                description: `Shows distribution of ${catCol}`,
              }];
            }
          } else if (chartType === 'line') {
            const catCol = mentionedCategorical[0] || categoricalFields[0];
            const numCol = mentionedNumeric[0] || numericFields[0];
            if (catCol && numCol) {
              fallbackCharts = [{
                type: 'line',
                title: `${numCol} over ${catCol}`,
                x_axis: catCol,
                y_axis: numCol,
                aggregation: 'sum',
                description: `Trend of ${numCol} by ${catCol}`,
              }];
            }
          } else if (chartType === 'bar' && mentionedNumeric.length >= 2) {
            fallbackCharts = [{
              type: 'bar',
              title: `${mentionedNumeric[0]} vs ${mentionedNumeric[1]}`,
              x_axis: mentionedNumeric[1],
              y_axis: mentionedNumeric[0],
              aggregation: 'sum',
              description: `Comparison of ${mentionedNumeric[0]} and ${mentionedNumeric[1]}`,
            }];
          } else if (chartType === 'bar' && mentionedNumeric.length === 1 && mentionedCategorical.length >= 1) {
            fallbackCharts = [{
              type: 'bar',
              title: `${mentionedNumeric[0]} by ${mentionedCategorical[0]}`,
              x_axis: mentionedCategorical[0],
              y_axis: mentionedNumeric[0],
              aggregation: 'sum',
              description: `Analysis of ${mentionedNumeric[0]} by ${mentionedCategorical[0]}`,
            }];
          } else if (numericFields.length >= 1 && categoricalFields.length >= 1) {
            fallbackCharts = [{
              type: 'bar',
              title: `${numericFields[0]} by ${categoricalFields[0]}`,
              x_axis: categoricalFields[0],
              y_axis: numericFields[0],
              aggregation: 'sum',
              description: `Visualization of ${numericFields[0]} by ${categoricalFields[0]}`,
            }];
          } else if (numericFields.length >= 2) {
            fallbackCharts = [{
              type: 'bar',
              title: `${numericFields[0]} vs ${numericFields[1]}`,
              x_axis: numericFields[1],
              y_axis: numericFields[0],
              aggregation: 'sum',
              description: `Correlation between ${numericFields[0]} and ${numericFields[1]}`,
            }];
          }
        }

        // Combine AI charts + fallback charts, then deduplicate
        const allCharts = [...newCharts, ...fallbackCharts];
        const uniqueCharts = allCharts.filter(chart => {
          const key = [chart.type, chart.column || '', chart.x_axis || '', chart.y_axis || '', chart.aggregation || '', chart.title?.toLowerCase() || ''].join('|');
          return !allExistingKeys.has(key);
        });

        if (uniqueCharts.length > 0) {
          setReportData(prev => {
            if (!prev) return prev;
            return { ...prev, visualizations: [...prev.visualizations, ...uniqueCharts] };
          });
          setVizKey(k => k + 1);

          // Update response if we added fallback charts
          if (newCharts.length === 0 && fallbackCharts.length > 0) {
            setLastChatResponse(prev => prev || `I've created a chart based on your query. You can see it in the canvas.`);
          }
        }
      }

      // Handle both 'modification' and 'modification_result' for backward compatibility
      const modification = result.data?.modification || result.data?.modification_result;

      // Check if we need to add visualizations based on the query
      const wantsChart = messageLower.includes('chart') || 
                        messageLower.includes('graph') ||
                        messageLower.includes('visualization') ||
                        messageLower.includes('correlation') ||
                        messageLower.includes('relationship') ||
                        messageLower.includes('compare') ||
                        messageLower.includes('show me');
      
      if (result.success && modification) {
        // Extract response from the modification result
        const responseText = modification.response || result.data?.response;
        if (responseText) {
          setLastChatResponse(responseText);
        } else {
          // Generate a contextual response based on the action
          if (modification.action === 'tool_calls' && modification.tools?.length > 0) {
            const tool = modification.tools[0];
            if (tool.type === 'bar') {
              setLastChatResponse(`I've created a bar chart showing ${tool.y_axis || tool.title} by ${tool.x_axis}. This visualization helps compare values across different categories.`);
            } else if (tool.type === 'line') {
              setLastChatResponse(`I've created a line chart showing ${tool.y_axis || tool.title} over ${tool.x_axis}. This helps visualize trends over time or continuous data.`);
            } else if (tool.type === 'pie') {
              setLastChatResponse(`I've created a pie chart showing distribution by ${tool.x_axis || tool.title}. This helps understand the proportion of different categories.`);
            } else if (tool.type === 'kpi') {
              setLastChatResponse(`I've added a KPI card showing the ${tool.aggregation || 'total'} of ${tool.column || tool.title}. This provides a quick metric overview.`);
            } else if (tool.type === 'table') {
              setLastChatResponse(`I've created a data table showing ${tool.title}. You can view the raw data here.`);
            } else {
              setLastChatResponse(`I've added a new ${tool.type || 'visualization'} to the report based on your request.`);
            }
          } else {
            setLastChatResponse("I've updated the report based on your request. You can see the changes in the canvas.");
          }
        }
        
        // Handle tool_calls action (from LLM)
        if (modification.action === 'tool_calls' || modification.action === 'add') {
          const tools = modification.tools || [];
          
          if (tools.length > 0) {
            const newViz = tools.map((tool: any) => ({
              type: tool.type || 'bar',
              title: tool.title || 'New Chart',
              // Handle different column names for different chart types
              x_axis: tool.x_axis || tool.category_column,
              y_axis: tool.y_axis || tool.value_column,
              aggregation: tool.aggregation,
              column: tool.column,
              columns: tool.columns,
              limit: tool.limit,
              description: tool.description,
            }));
            
            
            setReportData(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                visualizations: [...prev.visualizations, ...newViz],
              };
            });
            
            // Force re-render of canvas
            setVizKey(k => k + 1);
          }
        }
        
        // Handle explain action - update narrative/insights
        if (modification.action === 'explain' && modification.response) {
        }
      } else if (wantsChart && result.success) {
        // If user asked for a chart but no visualization was added, create one based on the query
        // Detect chart type from query first
        const detectedChartType = detectChartType(message);
        const numericFields = reportData.schema?.numeric_fields || [];
        const categoricalFields = reportData.schema?.categorical_fields || [];
        
        // Find columns mentioned in the query
        const mentionedNumeric = numericFields.filter((f: string) => 
          messageLower.includes(f.toLowerCase())
        );
        const mentionedCategorical = categoricalFields.filter((f: string) => 
          messageLower.includes(f.toLowerCase())
        );
        
        // Determine chart type to use
        const chartType = detectedChartType || (mentionedNumeric.length >= 2 ? 'bar' : 'bar');
        
        // Create an appropriate visualization based on detected chart type
        let newViz = null;
        
        if (chartType === 'kpi') {
          // KPI - show a single metric
          const targetCol = mentionedNumeric[0] || numericFields[0];
          const agg = messageLower.includes('average') || messageLower.includes('avg') ? 'avg' :
                      messageLower.includes('count') ? 'count' :
                      messageLower.includes('max') ? 'max' :
                      messageLower.includes('min') ? 'min' : 'sum';
          newViz = [{
            type: 'kpi',
            title: targetCol ? `${agg.charAt(0).toUpperCase() + agg.slice(1)} of ${targetCol}` : 'KPI Metric',
            column: targetCol,
            aggregation: agg,
            description: `Shows ${agg} of ${targetCol}`,
          }];
        } else if (chartType === 'pie') {
          // Pie chart - distribution of categories
          const catCol = mentionedCategorical[0] || categoricalFields[0];
          if (catCol) {
            newViz = [{
              type: 'pie',
              title: `Distribution by ${catCol}`,
              x_axis: catCol,
              description: `Shows distribution of ${catCol}`,
            }];
          }
        } else if (chartType === 'line') {
          // Line chart - trends over time
          const catCol = mentionedCategorical[0] || categoricalFields[0];
          const numCol = mentionedNumeric[0] || numericFields[0];
          if (catCol && numCol) {
            newViz = [{
              type: 'line',
              title: `${numCol} over ${catCol}`,
              x_axis: catCol,
              y_axis: numCol,
              aggregation: 'sum',
              description: `Trend of ${numCol} by ${catCol}`,
            }];
          }
        } else if (chartType === 'table') {
          // Table - raw data
          newViz = [{
            type: 'table',
            title: 'Data Overview',
            description: 'Raw data from the dataset',
          }];
        } else {
          // Default to bar chart
          if (mentionedNumeric.length >= 2) {
            newViz = [{
              type: 'bar',
              title: `${mentionedNumeric[0]} vs ${mentionedNumeric[1]}`,
              x_axis: mentionedNumeric[1],
              y_axis: mentionedNumeric[0],
              aggregation: 'sum',
              description: `Comparison of ${mentionedNumeric[0]} and ${mentionedNumeric[1]}`,
            }];
          } else if (mentionedNumeric.length === 1 && mentionedCategorical.length >= 1) {
            newViz = [{
              type: 'bar',
              title: `${mentionedNumeric[0]} by ${mentionedCategorical[0]}`,
              x_axis: mentionedCategorical[0],
              y_axis: mentionedNumeric[0],
              aggregation: 'sum',
              description: `Analysis of ${mentionedNumeric[0]} by ${mentionedCategorical[0]}`,
            }];
          } else if (numericFields.length >= 1 && categoricalFields.length >= 1) {
            newViz = [{
              type: 'bar',
              title: `${numericFields[0]} by ${categoricalFields[0]}`,
              x_axis: categoricalFields[0],
              y_axis: numericFields[0],
              aggregation: 'sum',
              description: `Visualization of ${numericFields[0]} by ${categoricalFields[0]}`,
            }];
          } else if (numericFields.length >= 2) {
            newViz = [{
              type: 'bar',
              title: `${numericFields[0]} vs ${numericFields[1]}`,
              x_axis: numericFields[1],
              y_axis: numericFields[0],
              aggregation: 'sum',
              description: `Correlation between ${numericFields[0]} and ${numericFields[1]}`,
            }];
          }
        }
        
        if (newViz) {
          setReportData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              visualizations: [...prev.visualizations, ...newViz],
            };
          });
          setVizKey(k => k + 1);
          // Set contextual response based on chart type
          const chartTypeNames: Record<string, string> = {
            kpi: 'KPI card',
            pie: 'pie chart',
            line: 'line chart',
            bar: 'bar chart',
            table: 'data table',
          };
          setLastChatResponse(`I've created a ${chartTypeNames[chartType]} based on your query. You can see it in the canvas.`);
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [reportData, correlations, knowledgeGraph]);

  const handleReanalyze = useCallback(async () => {
    if (!reportData) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_GENESIS_API_URL}/api/report/analyze`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to reanalyze');
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setReportData(prev => {
          if (!prev) return prev;
          return { 
            ...prev, 
            visualizations: result.data.visualizations || prev.visualizations,
            insights: result.data.insights || prev.insights,
            narrative: result.data.narrative || prev.narrative,
          };
        });
        setVizKey(k => k + 1);
      }
    } catch (err: any) {
      console.error('Reanalyze error:', err);
      setError('Failed to regenerate report');
    } finally {
      setIsLoading(false);
    }
  }, [reportData]);

  const handleRemoveVisualization = useCallback((index: number) => {
    setReportData(prev => {
      if (!prev) return prev;
      const newViz = [...prev.visualizations];
      newViz.splice(index, 1);
      return { ...prev, visualizations: newViz };
    });
    setVizKey(k => k + 1);
  }, []);

  const handleExport = useCallback(async (format: 'html' | 'docx' | 'png') => {
    if (!reportData) return;

    // For PNG export, capture the actual rendered canvas
    if (format === 'png' && canvasContainerRef.current) {
      try {
        const canvas = await html2canvas(canvasContainerRef.current, {
          backgroundColor: '#f8fafc',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        const link = document.createElement('a');
        link.download = `${reportData.filename.replace(/\.[^/.]+$/, '')}_report.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        return;
      } catch (err) {
        console.error('Failed to capture canvas:', err);
      }
    }

    // For HTML export, use the new canvas capture method
    if (format === 'html' && canvasContainerRef.current) {
      try {
        const canvas = await html2canvas(canvasContainerRef.current, {
          backgroundColor: '#f8fafc',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportData.filename} - Data Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; margin: -24px -24px 24px -24px; }
    .header h1 { font-size: 24px; color: #0f172a; font-weight: 700; }
    .header .meta { color: #64748b; font-size: 14px; }
    .viz-capture { width: 100%; }
    .viz-capture img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>${reportData.filename}</h1>
      <div class="meta">${reportData.row_count} rows • ${reportData.columns.length} columns</div>
    </header>
    
    <div class="viz-capture">
      <img src="${imgData}" alt="Report Visualization" />
    </div>
    
    <footer class="footer">
      <p>Generated by ReportAI Agent</p>
    </footer>
  </div>
</body>
</html>`;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportData.filename.replace(/\.[^/.]+$/, '')}_report.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      } catch (err) {
        console.error('Failed to capture canvas for HTML:', err);
      }
    }

    
    // Simple markdown to HTML converter
    const parseMarkdown = (text: string): string => {
      if (!text) return '';
      let html = text
        // Escape HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Headers
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h2>$1</h2>')
        // Bold and Italic
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
      return `<p>${html}</p>`;
    };
    
    // Helper function to generate SVG bar chart
    const generateBarChartSVG = (viz: any, data: any[], maxItems: number = 8) => {
      if (!data || data.length === 0) return '';
      const chartData = data.slice(0, maxItems);
      const maxValue = Math.max(...chartData.map((d: any) => d.value || 0), 1);
      const width = 400, height = 200;
      const barWidth = (width - 60) / chartData.length;
      const chartHeight = height - 40;
      
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f8fafc"/>
        ${chartData.map((d: any, i: number) => {
          const barHeight = ((d.value || 0) / maxValue) * chartHeight;
          const x = 50 + i * barWidth;
          const y = chartHeight - barHeight + 20;
          return `<rect x="${x + 5}" y="${y}" width="${barWidth - 10}" height="${barHeight}" fill="#4f46e5" rx="4"/>
            <text x="${x + barWidth/2}" y="${chartHeight + 35}" text-anchor="middle" font-size="10" fill="#64748b">${d.name || ''}</text>
            <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="9" fill="#333">${d.value}</text>`;
        }).join('')}
        <line x1="50" y1="20" x2="50" y2="${chartHeight + 20}" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="50" y1="${chartHeight + 20}" x2="${width - 10}" y2="${chartHeight + 20}" stroke="#cbd5e1" stroke-width="1"/>
      </svg>`;
    };
    
    // Helper function to generate SVG line chart
    const generateLineChartSVG = (viz: any, data: any[], maxItems: number = 10) => {
      if (!data || data.length === 0) return '';
      const chartData = data.slice(0, maxItems);
      const maxValue = Math.max(...chartData.map((d: any) => d.value || 0), 1);
      const minValue = Math.min(...chartData.map((d: any) => d.value || 0), 0);
      const width = 400, height = 200;
      const chartHeight = height - 40;
      const chartWidth = width - 60;
      const stepX = chartWidth / Math.max(chartData.length - 1, 1);
      
      const points = chartData.map((d: any, i: number) => {
        const x = 50 + i * stepX;
        const y = chartHeight - ((d.value - minValue) / (maxValue - minValue || 1)) * chartHeight + 20;
        return `${x},${y}`;
      }).join(' ');
      
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f8fafc"/>
        ${chartData.map((d: any, i: number) => {
          const x = 50 + i * stepX;
          const y = chartHeight - ((d.value - minValue) / (maxValue - minValue || 1)) * chartHeight + 20;
          return `<circle cx="${x}" cy="${y}" r="4" fill="#4f46e5"/>
            <text x="${x}" y="${chartHeight + 35}" text-anchor="middle" font-size="9" fill="#64748b">${d.name || ''}</text>`;
        }).join('')}
        <polyline points="${points}" fill="none" stroke="#4f46e5" stroke-width="2"/>
        <line x1="50" y1="20" x2="50" y2="${chartHeight + 20}" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="50" y1="${chartHeight + 20}" x2="${width - 10}" y2="${chartHeight + 20}" stroke="#cbd5e1" stroke-width="1"/>
      </svg>`;
    };
    
    // Helper function to generate SVG pie chart
    const generatePieChartSVG = (viz: any, data: any[], maxItems: number = 6) => {
      if (!data || data.length === 0) return '';
      const chartData = data.slice(0, maxItems);
      const total = chartData.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      const width = 280, height = 220;
      const cx = width / 2 - 20, cy = height / 2 - 10, r = 60;
      const colors = ['#4f46e5', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];
      let startAngle = 0;
      
      const slices = chartData.map((d: any, i: number) => {
        const angle = ((d.value || 0) / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(startAngle + angle);
        const y2 = cy + r * Math.sin(startAngle + angle);
        const largeArc = angle > Math.PI ? 1 : 0;
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        startAngle += angle;
        const percentage = total > 0 ? ((d.value || 0) / total * 100).toFixed(1) : 0;
        return { path, color: colors[i % colors.length], name: d.name, value: d.value, percentage };
      });
      
      // Generate legend
      const legendX = width - 90;
      const legendItems = slices.map((s: any, i: number) => 
        `<rect x="${legendX}" y="${15 + i * 18}" width="12" height="12" fill="${s.color}"/>` +
        `<text x="${legendX + 16}" y="${25 + i * 18}" font-size="9" fill="#334155">${s.name ? s.name.substring(0, 10) : 'N/A'} (${s.percentage}%)</text>`
      ).join('');
      
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f8fafc"/>
        ${slices.map((s: any) => `<path d="${s.path}" fill="${s.color}"/>`).join('')}
        <circle cx="${cx}" cy="${cy}" r="25" fill="#f8fafc"/>
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#0f172a">${total.toLocaleString()}</text>
        ${legendItems}
      </svg>`;
    };
    
    // Get chart data for each visualization
    const getChartData = (viz: any) => {
      const preview = reportData.preview || [];
      if (!preview.length) return [];
      
      // Handle pie charts - use category_column or column
      if (viz.type === 'pie') {
        const categoryCol = viz.x_axis || viz.category_column || viz.column;
        if (categoryCol) {
          const grouped: Record<string, number> = {};
          preview.forEach((row: any) => {
            const key = String(row[categoryCol] || 'Unknown');
            grouped[key] = (grouped[key] || 0) + 1;
          });
          return Object.entries(grouped).map(([name, value]) => ({ name, value }));
        }
        return [];
      }
      
      // Handle bar/line charts with x_axis and y_axis
      if (viz.x_axis && viz.y_axis) {
        const grouped: Record<string, number> = {};
        preview.forEach((row: any) => {
          const key = String(row[viz.x_axis] || 'Unknown');
          const value = parseFloat(row[viz.y_axis]) || 0;
          grouped[key] = (grouped[key] || 0) + value;
        });
        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
      } else if (viz.column) {
        // Handle KPI-style data (just counts)
        const grouped: Record<string, number> = {};
        preview.forEach((row: any) => {
          const key = String(row[viz.column] || 'Unknown');
          grouped[key] = (grouped[key] || 0) + 1;
        });
        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
      }
      return [];
    };
    
    // Helper function to get visualization dimensions (same as UI)
    const getVizDimensions = (viz: any, totalOfType: number) => {
      const vizType = viz.type;
      
      // Width based on chart type and count
      const getWidth = () => {
        switch (vizType) {
          case 'kpi':
            return totalOfType <= 2 ? '50%' : totalOfType <= 4 ? '25%' : '20%';
          case 'pie':
            return totalOfType === 1 ? '33%' : '30%';
          case 'bar':
          case 'line':
            return totalOfType === 1 ? '100%' : '50%';
          case 'table':
            return '100%';
          default:
            return '50%';
        }
      };

      return { width: getWidth() };
    };

    // Group visualizations by type
    const groupedVisualizations = {
      kpi: reportData.visualizations.filter((v: any) => v.type === 'kpi'),
      pie: reportData.visualizations.filter((v: any) => v.type === 'pie'),
      bar: reportData.visualizations.filter((v: any) => v.type === 'bar'),
      line: reportData.visualizations.filter((v: any) => v.type === 'line'),
      table: reportData.visualizations.filter((v: any) => v.type === 'table'),
    };

    // Render grouped visualizations
    const renderGroupedVisualizations = () => {
      const groups = [
        { type: 'kpi', title: 'KPIs', items: groupedVisualizations.kpi },
        { type: 'pie', title: 'Pie Charts', items: groupedVisualizations.pie },
        { type: 'bar', title: 'Charts', items: [...groupedVisualizations.bar, ...groupedVisualizations.line] },
        { type: 'table', title: 'Tables', items: groupedVisualizations.table },
      ];

      return groups.filter(group => group.items.length > 0).map(group => {
        const dims = group.items.map((viz: any, idx: number) => {
          const chartData = getChartData(viz);
          const dimensions = getVizDimensions(viz, group.items.length);
          let chartSVG = '';
          
          if (viz.type === 'bar' && chartData.length > 0) {
            chartSVG = generateBarChartSVG(viz, chartData, 12);
          } else if (viz.type === 'line' && chartData.length > 0) {
            chartSVG = generateLineChartSVG(viz, chartData, 12);
          } else if (viz.type === 'pie' && chartData.length > 0) {
            chartSVG = generatePieChartSVG(viz, chartData, 8);
          } else if (viz.type === 'kpi') {
            const preview = reportData.preview || [];
            const column = viz.column || viz.y_axis;
            let kpiValue = 0;
            
            if (column && preview.length > 0) {
              const values = preview.map((row: any) => parseFloat(row[column])).filter((v: number) => !isNaN(v));
              
              if (viz.aggregation === 'avg' || viz.aggregation === 'average') {
                kpiValue = values.reduce((a: number, b: number) => a + b, 0) / values.length;
              } else if (viz.aggregation === 'min') {
                kpiValue = Math.min(...values);
              } else if (viz.aggregation === 'max') {
                kpiValue = Math.max(...values);
              } else if (viz.aggregation === 'count') {
                kpiValue = values.length;
              } else {
                kpiValue = values.reduce((a: number, b: number) => a + b, 0);
              }
            }
            
            chartSVG = `<svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
              <text x="100" y="55" text-anchor="middle" font-size="36" font-weight="bold" fill="#0f172a">${typeof kpiValue === 'number' ? kpiValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : kpiValue}</text>
            </svg>`;
          }
          
          return { viz, chartSVG, dimensions, idx };
        });

        return `
        <div class="viz-group">
          <h3 style="font-size: 16px; color: #475569; margin: 24px 0 12px; font-weight: 600;">${group.title}</h3>
          <div style="display: flex; flex-wrap: wrap; margin: -8px;">
            ${dims.map((d: any) => `
            <div style="width: ${d.dimensions.width}; padding: 8px; box-sizing: border-box;">
              <div class="viz-card" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center;">
                <h4 style="font-size: 14px; color: #0f172a; margin-bottom: 8px; font-weight: 600;">${d.viz.title}</h4>
                ${d.chartSVG ? `<div style="display: flex; justify-content: center;">${d.chartSVG}</div>` : ''}
                <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
                  ${d.viz.type === 'kpi' ? `<span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px;">${d.viz.aggregation || 'sum'}</span>` : ''}
                  ${d.viz.description ? `<p style="margin-top: 4px;">${d.viz.description}</p>` : ''}
                </div>
              </div>
            </div>
            `).join('')}
          </div>
        </div>
        `;
      }).join('');
    };
    
    try {
      setIsLoading(true);
      
      const filename = `${reportData.filename.replace(/\.[^/.]+$/, '')}_report`;
      
      if (format === 'html') {
        // Generate HTML report replicating the exact UI layout
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportData.filename} - Data Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.7; }
    .container { max-width: 100%; margin: 0 auto; padding: 24px; }
    .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; margin: -24px -24px 24px -24px; }
    .header-content { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; }
    .header h1 { font-size: 24px; color: #0f172a; font-weight: 700; }
    .header .meta { color: #64748b; font-size: 14px; }
    .section { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .section h2 { font-size: 18px; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; font-weight: 600; }
    .viz-group h3 { font-size: 14px; color: #64748b; margin: 20px 0 12px; font-weight: 600; text-transform: capitalize; }
    .viz-group:first-of-type h3 { margin-top: 0; }
    .viz-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; transition: box-shadow 0.2s; }
    .viz-card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    .viz-card h4 { font-size: 13px; color: #0f172a; margin-bottom: 8px; font-weight: 600; }
    .insights-list { list-style: none; }
    .insights-list li { padding: 12px 16px; margin-bottom: 8px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981; font-size: 14px; }
    .insights-list li strong { color: #10b981; }
    .data-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    .data-table th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    .data-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:hover { background: #f8fafc; }
    .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
    .markdown-content { font-size: 14px; line-height: 1.8; }
    .markdown-content p { margin-bottom: 12px; }
    .markdown-content strong { font-weight: 600; color: #0f172a; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="header-content">
        <div>
          <h1>${reportData.filename}</h1>
          <div class="meta">${reportData.row_count} rows • ${reportData.columns.length} columns</div>
        </div>
        <div style="color: #64748b; font-size: 12px;">
          ${reportData.visualizations.length} visualizations
        </div>
      </div>
    </header>
    
    <section class="section">
      <h2>Visualizations</h2>
      ${renderGroupedVisualizations()}
    </section>
    
    <section class="section">
      <h2>Report Summary</h2>
      <div class="markdown-content">${parseMarkdown(reportData.narrative || 'No summary available for this dataset.')}</div>
    </section>
    
    <section class="section">
      <h2>AI Insights</h2>
      <ul class="insights-list">
        ${reportData.insights.map((insight: string, idx: number) => `<li><strong>Insight ${idx + 1}:</strong> ${insight}</li>`).join('')}
      </ul>
    </section>
    
    <section class="section">
      <h2>Data Schema</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Data Type</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          ${(reportData.schema?.fields || []).map((field: any) => `
            <tr>
              <td><strong>${field.name}</strong></td>
              <td>${field.dtype}</td>
              <td>${field.category || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
    
    <section class="section">
      <h2>Data Preview</h2>
      <table class="data-table">
        <thead>
          <tr>
            ${reportData.columns.slice(0, 6).map((col: string) => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${(reportData.preview || []).slice(0, 10).map((row: any) => `
            <tr>
              ${reportData.columns.slice(0, 6).map((col: string) => `<td>${row[col] ?? '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
    
    <footer class="footer">
      <p><strong>Generated by ReportAI Agent</strong></p>
    </footer>
  </div>
</body>
</html>`;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } else if (format === 'docx') {
        // Generate Word-compatible content (keep as fallback)
        let content = `${reportData.filename} - Data Report\n`;
        content += `=${'='.repeat(40)}\n\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `Total Rows: ${reportData.row_count}\n`;
        content += `Columns: ${reportData.columns.join(', ')}\n\n`;
        content += `SUMMARY\n`;
        content += `${'='.repeat(10)}\n\n`;
        content += `${reportData.narrative}\n\n`;
        content += `AI INSIGHTS\n`;
        content += `${'='.repeat(10)}\n\n`;
        reportData.insights.forEach((insight, idx) => {
          content += `${idx + 1}. ${insight}\n`;
        });
        content += `\nVISUALIZATIONS\n`;
        content += `${'='.repeat(10)}\n\n`;
        reportData.visualizations.forEach((viz, idx) => {
          content += `${idx + 1}. ${viz.title}\n`;
          content += `   Type: ${viz.type}\n`;
          if (viz.description) content += `   Description: ${viz.description}\n`;
          content += `\n`;
        });
        content += `\n---\nGenerated by ReportAI Agent`;
        
        const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
    } catch (err: any) {
      console.error('Export error:', err);
      setError('Failed to export report');
    } finally {
      setIsLoading(false);
    }
  }, [reportData]);

  // Show upload if no data
  if (!reportData) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="h-16 border-b bg-white/80 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 mt-18">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">ReportAI Agent</h1>
              <p className="text-xs text-slate-500">Generative UI Workspace</p>
            </div>
          </div>
          <Link
            href="/report-agent-architecture"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Architecture</span>
          </Link>
        </header>
        <DataUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="h-14 border-b bg-white/80 backdrop-blur-sm px-4 flex items-center justify-between shrink-0 mt-18">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-slate-900">ReportAI Workspace</h1>
            <p className="text-xs text-slate-500">{reportData.row_count} rows</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layout className="w-3 h-3 inline mr-1" />
              Split
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'canvas' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid className="w-3 h-3 inline mr-1" />
              Canvas
            </button>
            <button
              onClick={() => setViewMode('chat')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'chat' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-3 h-3 inline mr-1" />
              Chat
            </button>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
          
          {/* Export Dropdown */}
          <div className="relative group">
            <Button variant="outline" size="sm" disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => handleExport('html')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export as HTML
              </button>
              <button
                onClick={() => handleExport('docx')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <File className="w-4 h-4" />
                Export as DOCX
              </button>
              <button
                onClick={() => handleExport('png')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Export as PNG
              </button>
            </div>
          </div>

          {/* New Analysis Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setReportData(null);
              setError(null);
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Analysis</span>
          </Button>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Content - Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Canvas Pane (Primary) */}
        {(viewMode === 'split' || viewMode === 'canvas') && (
          <div 
            ref={canvasContainerRef}
            className={`${viewMode === 'split' ? 'w-[60%]' : 'w-full'} border-r overflow-hidden`}
          >
            <VisualizationCanvas 
              key={`canvas-${vizKey}`}
              data={reportData}
              isLoading={isLoading}
              onRemoveVisualization={handleRemoveVisualization}
              correlations={correlations}
              knowledgeGraph={knowledgeGraph}
            />
          </div>
        )}

        {/* Chat Pane (Secondary) */}
        {(viewMode === 'split' || viewMode === 'chat') && (
          <div className={`${viewMode === 'split' ? 'w-[40%]' : 'w-full'} overflow-hidden`}>
            <ChatPanel 
              data={reportData}
              onSendMessage={handleChatMessage}
              isLoading={isLoading}
              lastResponse={lastChatResponse}
            />
          </div>
        )}
      </main>
    </div>
  );
}
