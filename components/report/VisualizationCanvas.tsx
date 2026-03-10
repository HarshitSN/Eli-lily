import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, GripVertical } from 'lucide-react';
import { toDisplayName } from '@/lib/utils';

interface Visualization {
  type: string;
  title: string;
  x_axis?: string;
  y_axis?: string;
  aggregation?: string;
  column?: string;
  description?: string;
  /** Pre-computed by backend using full dataset — use this when available */
  chart_data?: Array<{ name: string; value: number }>;
}

interface ReportData {
  filename: string;
  row_count: number;
  columns: string[];
  schema: any;
  visualizations: Visualization[];
  insights: string[];
  narrative: string;
  preview: any[];
  /** Full-dataset statistics from the backend — used for accurate KPI values */
  analysis_results?: any;
}

interface VisualizationCanvasProps {
  data: ReportData;
  isLoading: boolean;
  onRemoveVisualization?: (index: number) => void;
  correlations?: any[];
  knowledgeGraph?: any;
}

const COLORS = ['#344054', '#FFC400', '#06B6D4', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#E6EAF0'];

// Intelligent sizing helper - calculates width and height based on chart type
// Width is based on window percentage, height is based on chart type
const getVizDimensions = (viz: Visualization, chartData: any[], totalOfType: number) => {
  const dataPointCount = chartData?.length || 0;
  const vizType = viz.type;
  
  // Width based on chart type and how many of the same type exist
  // Try to fit multiple items in a row when possible
  const getWidth = () => {
    switch (vizType) {
      case 'kpi':
        // If only 1 KPI, use 20%. If multiple, try to fit 4 per row
        return totalOfType <= 2 ? 'flex-[0_0_50%]' : totalOfType <= 4 ? 'flex-[0_0_25%]' : 'flex-[0_0_20%]';
      case 'pie':
        return 'flex-[0_0_33%]'; // 1/3 of window
      case 'line':
        return 'flex-[0_0_50%]'; // Half of window
      case 'table':
        return 'flex-[0_0_100%]';
      default:
        return 'flex-[0_0_50%]';
    }
  };

  // Height based on chart type and data
  const getHeight = () => {
    switch (vizType) {
      case 'kpi':
        return 100;
      case 'pie':
        return dataPointCount > 6 ? 300 : 250;
      case 'bar':
      case 'line':
      case 'scatter':
        return dataPointCount > 8 ? 300 : 250;
      case 'table':
        return Math.min(200 + (dataPointCount * 20), 500);
      default:
        return 250;
    }
  };

  return {
    width: getWidth(),
    height: getHeight(),
    isCompact: vizType === 'kpi'
  };
};

// Custom tick formatter for wrapping long text labels with hover tooltip
const wrapText = (text: string, maxChars: number = 12) => {
  if (!text || text.length <= maxChars) return text;
  return text.slice(0, maxChars - 2) + '..';
};

// Custom tick component that shows full label on hover
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const displayText = wrapText(payload.value, 15);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={10}>
        {displayText}
        <title>{payload.value}</title>
      </text>
    </g>
  );
};

// Typewriter component for text animation
function Typewriter({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}{!isComplete && <span className="animate-pulse">▊</span>}</span>;
}

// Typewriter component that renders markdown
function TypewriterMarkdown({ content, speed = 30 }: { content: string; speed?: number }) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedLength(0);
    setIsComplete(false);
    
    const totalLength = content.length;
    let currentLength = 0;
    
    // Calculate character duration based on total length for consistent timing
    const charSpeed = Math.max(5, Math.min(speed, 30));
    const totalDuration = totalLength * charSpeed;
    const intervalTime = 20; // Update interval
    
    const timer = setInterval(() => {
      currentLength += intervalTime;
      const progress = currentLength / totalDuration;
      const newLength = Math.floor(progress * totalLength);
      
      if (newLength >= totalLength) {
        setDisplayedLength(totalLength);
        setIsComplete(true);
        clearInterval(timer);
      } else {
        setDisplayedLength(newLength);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [content, speed]);

  // Get the visible text and render as markdown
  const visibleText = content.slice(0, displayedLength);
  
  return (
    <div>
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-medium mt-2 mb-1" {...props} />,
          p: ({node, ...props}) => <p className="mb-2" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
          em: ({node, ...props}) => <em className="italic" {...props} />,
          code: ({node, ...props}) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs" {...props} />,
        }}
      >
        {visibleText}
      </ReactMarkdown>
      {!isComplete && <span className="animate-pulse text-blue-500">▊</span>}
    </div>
  );
}

// Data Table with Filter and Sort capabilities
interface DataTableProps {
  data: any[];
  columns: string[];
  height: number;
}

function DataTable({ data, columns, height }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data) return [];
    
    let result = [...data];
    
    // Apply filters
    Object.entries(filters).forEach(([col, value]) => {
      if (value.trim()) {
        result = result.filter(row => {
          const cellValue = String(row[col] || '').toLowerCase();
          return cellValue.includes(value.toLowerCase());
        });
      }
    });
    
    // Apply sort
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        // Try numeric comparison first
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // Fall back to string comparison
        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
      });
    }
    
    return result;
  }, [data, filters, sortColumn, sortDirection]);
  
  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };
  
  const handleFilterChange = (col: string, value: string) => {
    setFilters(prev => ({ ...prev, [col]: value }));
  };
  
  const clearFilters = () => {
    setFilters({});
    setSortColumn(null);
    setSortDirection('asc');
  };
  
  const maxRows = Math.max(5, Math.floor(height / 32));
  
  return (
    <div className="flex flex-col h-full">
      {/* Table controls */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-2 py-1 text-xs rounded border ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <span className="text-xs text-slate-500">
          {processedData.length} / {data.length} rows
        </span>
        {Object.values(filters).some(v => v) && (
          <button
            onClick={clearFilters}
            className="px-2 py-1 text-xs rounded border bg-red-50 border-red-200 text-red-600"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              {columns.map((col: string) => (
                <th key={col} className="px-2 py-1.5 text-left font-medium text-slate-600 border-b">
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort(col)}
                  >
                    <span>{toDisplayName(col)}</span>
                    {sortColumn === col && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  {showFilters && (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters[col] || ''}
                      onChange={(e) => handleFilterChange(col, e.target.value)}
                      className="w-full mt-1 px-1 py-0.5 text-xs border border-slate-200 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.slice(0, maxRows).map((row: any, rowIdx: number) => (
              <tr key={rowIdx} className="border-t hover:bg-slate-50">
                {columns.map((col: string) => (
                  <td key={col} className="px-2 py-1.5">{row[col] !== undefined ? String(row[col]) : '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {processedData.length === 0 && (
          <div className="text-center py-4 text-slate-400">
            No matching rows found
          </div>
        )}
      </div>
    </div>
  );
}

// D3.js Force-Directed Knowledge Graph Visualization
interface KnowledgeGraphVizProps {
  nodes: any[];
  edges: any[];
  width?: number;
  height?: number;
}

function KnowledgeGraphViz({ nodes, edges, width = 600, height = 350 }: KnowledgeGraphVizProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Color palette for different node types
  const typeColors: Record<string, string> = {
    'entity': '#3B82F6',
    'concept': '#10B981',
    'category': '#F59E0B',
    'metric': '#EF4444',
    'dimension': '#8B5CF6',
    'default': '#6B7280'
  };
  
  const getNodeColor = (type: string) => typeColors[type?.toLowerCase()] || typeColors['default'];
  
  // Calculate node radius based on text length
  const getNodeRadius = (label: string) => {
    const charWidth = 5;
    const minRadius = 18;
    const maxRadius = 45;
    const textWidth = (label?.length || 0) * charWidth;
    return Math.min(Math.max(textWidth / 2 + 10, minRadius), maxRadius);
  };
  
  // Get text label from node
  const getNodeLabel = (node: any) => {
    return node.label || node.name || node.id || '';
  };
  
  // Get connected node IDs for a given node
  const getConnectedNodeIds = (nodeId: string, edgeList: any[]) => {
    const connected = new Set<string>();
    edgeList.forEach((e: any) => {
      const source = e.source?.id || e.source;
      const target = e.target?.id || e.target;
      if (source === nodeId) connected.add(target);
      if (target === nodeId) connected.add(source);
    });
    return connected;
  };
  
  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    const g = svg.append('g');
    
    // Prepare graph data - ensure each node has an ID
    const graphNodes = nodes.map((n: any, idx: number) => ({
      ...n,
      id: n.id || n.name || n.label || `node_${idx}`,
      radius: getNodeRadius(getNodeLabel(n))
    }));
    
    const nodeIdMap = new Map(graphNodes.map(n => [n.id, n]));
    
    // Prepare edges - ensure from/to reference valid node IDs
    const graphEdges = edges
      .filter((e: any) => {
        const fromId = e.from || e.source || e.from_id || e.source_id;
        const toId = e.to || e.target || e.to_id || e.target_id;
        return fromId && toId;
      })
      .map((e: any) => ({
        ...e,
        source: e.from || e.source || e.from_id || e.source_id,
        target: e.to || e.target || e.to_id || e.target_id
      }));
    
    // Filter edges to only include those where both nodes exist
    const validEdges = graphEdges.filter((e: any) => 
      nodeIdMap.has(e.source) && nodeIdMap.has(e.target)
    );
    
    // Get connected nodes for selected node
    const connectedNodeIds = selectedNode ? getConnectedNodeIds(selectedNode, validEdges) : new Set<string>();
    
    // If no valid edges, create a simple radial layout
    if (validEdges.length === 0) {
      // Just display nodes in a circle
      const angleStep = (2 * Math.PI) / graphNodes.length;
      const radius = Math.min(width, height) / 3;
      graphNodes.forEach((n: any, i: number) => {
        n.x = width / 2 + radius * Math.cos(i * angleStep);
        n.y = height / 2 + radius * Math.sin(i * angleStep);
      });
    }
    
    // Create force simulation with dynamic collision radius
    const simulation = d3.forceSimulation(graphNodes)
      .force('link', validEdges.length > 0 ? d3.forceLink(validEdges).id((d: any) => d.id).distance(100) : d3.forceX(0).strength(0))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 5));
    
    // Draw edges (lines) - only if we have valid edges
    let link: any, linkLabel: any;
    if (validEdges.length > 0) {
      link = g.append('g')
        .attr('class', 'edges')
        .selectAll('line')
        .data(validEdges)
        .join('line')
        .attr('stroke', (d: any) => {
          const sourceId = d.source?.id || d.source;
          const targetId = d.target?.id || d.target;
          if (selectedNode && (sourceId === selectedNode || targetId === selectedNode)) {
            return '#F59E0B'; // Highlight color for connected edges
          }
          return '#94A3B8';
        })
        .attr('stroke-width', (d: any) => {
          const sourceId = d.source?.id || d.source;
          const targetId = d.target?.id || d.target;
          if (selectedNode && (sourceId === selectedNode || targetId === selectedNode)) {
            return 3; // Thicker for connected edges
          }
          return 1.5;
        })
        .attr('stroke-opacity', (d: any) => {
          const sourceId = d.source?.id || d.source;
          const targetId = d.target?.id || d.target;
          if (selectedNode && (sourceId === selectedNode || targetId === selectedNode)) {
            return 1;
          }
          return selectedNode ? 0.2 : 0.6; // Dim when node selected
        });
      
      // Draw edge labels
      linkLabel = g.append('g')
        .attr('class', 'edge-labels')
        .selectAll('text')
        .data(validEdges)
        .join('text')
        .attr('font-size', '9px')
        .attr('fill', '#64748B')
        .attr('text-anchor', 'middle')
        .attr('opacity', (d: any) => {
          const sourceId = d.source?.id || d.source;
          const targetId = d.target?.id || d.target;
          if (selectedNode && (sourceId === selectedNode || targetId === selectedNode)) {
            return 1;
          }
          return selectedNode ? 0.1 : 1;
        })
        .text((d: any) => d.label || '');
    }
    
    // Draw nodes (circles)
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphNodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation();
        setSelectedNode(selectedNode === d.id ? null : d.id);
      })
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);
    
    // Node circles - with dynamic sizing
    node.append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => {
        const isConnected = connectedNodeIds.has(d.id);
        const isSelected = selectedNode === d.id;
        if (isSelected) return '#1E40AF'; // Darker blue for selected
        if (isConnected) return getNodeColor(d.type); // Normal color for connected
        if (selectedNode) return '#D1D5DB'; // Gray for unconnected when something selected
        return getNodeColor(d.type);
      })
      .attr('stroke', (d: any) => {
        const isConnected = connectedNodeIds.has(d.id);
        const isSelected = selectedNode === d.id;
        if (isSelected || isConnected) return '#F59E0B'; // Orange ring for connected/selected
        return '#fff';
      })
      .attr('stroke-width', (d: any) => {
        const isConnected = connectedNodeIds.has(d.id);
        const isSelected = selectedNode === d.id;
        if (isSelected || isConnected) return 3;
        return 2;
      })
      .attr('opacity', (d: any) => {
        if (selectedNode && d.id !== selectedNode && !connectedNodeIds.has(d.id)) {
          return 0.3; // Dim unconnected nodes
        }
        return 1;
      });
    
    // Node labels - with text wrapping for long labels
    node.append('text')
      .attr('dy', (d: any) => d.radius > 25 ? 5 : 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', (d: any) => d.radius > 35 ? '11px' : '10px')
      .attr('fill', '#fff')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text((d: any) => {
        const label = getNodeLabel(d);
        // Truncate based on radius
        const maxChars = Math.floor(d.radius / 4.5);
        return label.length > maxChars ? label.slice(0, maxChars - 2) + '..' : label;
      });
    
    // Tooltip on hover
    node.append('title')
      .text((d: any) => `${getNodeLabel(d)} (${d.type})\nClick to highlight connections`);
    
    // Click on background to deselect
    svg.on('click', () => {
      setSelectedNode(null);
    });
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      if (validEdges.length > 0 && link) {
        link
          .attr('x1', (d: any) => d.source?.x ?? 0)
          .attr('y1', (d: any) => d.source?.y ?? 0)
          .attr('x2', (d: any) => d.target?.x ?? 0)
          .attr('y2', (d: any) => d.target?.y ?? 0);
        
        if (linkLabel) {
          linkLabel
            .attr('x', (d: any) => ((d.source?.x ?? 0) + (d.target?.x ?? 0)) / 2)
            .attr('y', (d: any) => ((d.source?.y ?? 0) + (d.target?.y ?? 0)) / 2);
        }
      }
      
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, selectedNode]);
  
  if (!nodes.length) return null;
  
  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {/* Selection hint */}
      {selectedNode && (
        <div className="absolute top-2 left-2 z-10 bg-white/90 px-2 py-1 rounded text-xs text-indigo-700 shadow">
          Click background to clear selection
        </div>
      )}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)', borderRadius: '8px' }}
      />
    </div>
  );
}

export function VisualizationCanvas({ data, isLoading, onRemoveVisualization, correlations = [], knowledgeGraph = null }: VisualizationCanvasProps) {
  const [vizKey, setVizKey] = useState(0); // Controls animation on data change
  const [visibleCharts, setVisibleCharts] = useState<number[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true); // Track first load for typewriter
  const canvasRef = useRef<HTMLDivElement>(null);
  const prevVizLengthRef = useRef(data.visualizations.length);

  // Trigger animations when visualization data changes
  useEffect(() => {
    // Start fresh
    setVisibleCharts([]);
    setShowInsights(false);
    setVizKey(k => k + 1);
    setIsFirstLoad(true);
    
    // Sequential animations
    setTimeout(() => setShowInsights(true), 300);
    
    data.visualizations.forEach((_, idx) => {
      setTimeout(() => {
        setVisibleCharts(prev => [...prev, idx]);
      }, 500 + idx * 150); // 150ms delay between each chart
    });
    
    // Disable first load mode after animations
    setTimeout(() => setIsFirstLoad(false), 2000);
  }, [data.visualizations.length, data.filename]);
  
  // Auto-scroll to bottom when new visualizations are added
  useEffect(() => {
    const currentVizLength = data.visualizations.length;
    const prevVizLength = prevVizLengthRef.current;
    
    // Only scroll if a new visualization was added (not on initial load)
    if (currentVizLength > prevVizLength && canvasRef.current) {
      // Delay scroll slightly to allow the new chart to render
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.scrollTo({
            top: canvasRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
    
    // Update the ref for next comparison
    prevVizLengthRef.current = currentVizLength;
  }, [data.visualizations.length]);
  
  // Compute chart data for a specific visualization
  const getChartData = (viz: Visualization) => {
    // Use backend pre-computed data (full dataset) when available
    if (viz.chart_data && viz.chart_data.length > 0) {
      return viz.chart_data.map(d => ({ name: toDisplayName(d.name), value: d.value }));
    }

    // Fallback: compute from preview rows (max 20 rows — approximate for large datasets)
    if (!data.preview || data.preview.length === 0) return [];

    // Get ALL unique columns from ALL preview rows (handles multi-file scenarios)
    const allColumnsSet = new Set<string>();
    data.preview.forEach((row: any) => {
      Object.keys(row).forEach(key => {
        if (key !== '_source_file') allColumnsSet.add(key);
      });
    });
    const availableColumns = Array.from(allColumnsSet);

    let xField = viz.x_axis || viz.column;
    let yField = viz.y_axis || viz.column;

    // Auto-detect fields when not specified
    if (!xField && !yField && availableColumns.length > 0) {
      const firstRow = data.preview[0];
      for (const col of availableColumns) {
        const val = firstRow[col];
        if (typeof val === 'string' && !xField) xField = col;
        else if (typeof val === 'number' && !yField) yField = col;
        if (xField && yField) break;
      }
      if (!xField) xField = availableColumns[0];
      if (!yField) yField = availableColumns[1] || availableColumns[0];
    }

    // Resolve xField via partial match if exact not found
    if (!xField || !availableColumns.includes(xField)) {
      const match = availableColumns.find(c =>
        (viz.x_axis && c.toLowerCase().includes(viz.x_axis.toLowerCase())) ||
        (viz.column && c.toLowerCase().includes(viz.column.toLowerCase()))
      );
      xField = match || availableColumns[0];
    }

    // Resolve yField via partial match if exact not found
    if (!yField || !availableColumns.includes(yField)) {
      const match = availableColumns.find(c =>
        (viz.y_axis && c.toLowerCase().includes(viz.y_axis.toLowerCase())) ||
        (viz.column && c.toLowerCase().includes(viz.column.toLowerCase()))
      );
      if (match) {
        yField = match;
      } else {
        const numericCol = availableColumns.find(c => {
          const sampleVal = data.preview.find((row: any) => row[c] !== undefined && row[c] !== null)?.[c];
          return typeof sampleVal === 'number';
        });
        yField = numericCol || availableColumns[1] || availableColumns[0];
      }
    }

    // Group by xField, collecting all yField values
    const grouped: Record<string, number[]> = {};
    data.preview.forEach((row: any) => {
      if (!xField) return;
      const xVal = row[xField as keyof typeof row];
      if (xVal === undefined || xVal === null) return;
      const key = String(xVal).slice(0, 30);
      if (!grouped[key]) grouped[key] = [];
      if (yField && yField !== xField) {
        const yVal = row[yField as keyof typeof row];
        if (yVal !== undefined && yVal !== null) grouped[key].push(Number(yVal) || 0);
      } else {
        grouped[key].push(1);
      }
    });

    // Fallback: count occurrences if nothing grouped
    if (Object.keys(grouped).length === 0 && xField) {
      data.preview.forEach((row: any) => {
        const xVal = row[xField as keyof typeof row];
        if (xVal !== undefined && xVal !== null) {
          const key = String(xVal).slice(0, 30);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(1);
        }
      });
    }

    const aggregation = viz.aggregation || 'sum';
    return Object.entries(grouped).map(([name, vals]) => {
      let value: number;
      if (!vals.length) value = 0;
      else if (aggregation === 'avg') value = vals.reduce((a, b) => a + b, 0) / vals.length;
      else if (aggregation === 'count') value = vals.length;
      else if (aggregation === 'min') value = Math.min(...vals);
      else if (aggregation === 'max') value = Math.max(...vals);
      else value = vals.reduce((a, b) => a + b, 0); // sum
      return { name: toDisplayName(name), value };
    }).slice(0, 15);
  };

  const kpiData = React.useMemo(() => {
    // Pre-computed full-dataset stats keyed by column name
    const numericSummary: Record<string, any> =
      data.analysis_results?.statistics?.numeric_summary || {};

    return data.visualizations
      .filter(v => v.type === 'kpi')
      .map(viz => {
        const col = viz.column || viz.y_axis || '';
        const aggregation = viz.aggregation || 'sum';
        const colStats = numericSummary[col];

        let value: number;

        if (colStats) {
          // Use pre-computed full-dataset stats (accurate for any dataset size)
          switch (aggregation) {
            case 'avg':   value = colStats.mean  ?? 0; break;
            case 'min':   value = colStats.min   ?? 0; break;
            case 'max':   value = colStats.max   ?? 0; break;
            case 'count': value = colStats.non_null_count ?? data.row_count ?? 0; break;
            case 'sum':
            default:      value = colStats.sum   ?? 0; break;
          }
        } else if (aggregation === 'count') {
          // Count of rows — always available
          value = data.row_count ?? 0;
        } else {
          // Fallback: compute from preview rows (will be approximate for large datasets)
          const nums = (data.preview || []).map((row: any) => Number(row[col]) || 0);
          switch (aggregation) {
            case 'avg':   value = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; break;
            case 'min':   value = nums.length ? Math.min(...nums) : 0; break;
            case 'max':   value = nums.length ? Math.max(...nums) : 0; break;
            case 'sum':
            default:      value = nums.reduce((a, b) => a + b, 0); break;
          }
        }

        return { title: viz.title, value, column: col, aggregation };
      });
  }, [data]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-2" key={vizKey} ref={canvasRef}>
      {/* Report Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{data.row_count} rows • {data.columns.length} columns</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {data.visualizations.length} visualizations
            </span>
          </div>
        </div>
      </div>

      {/* Visualizations Grid - FIRST */}
      <div className="p-4">
        {/* Group visualizations by type: KPI -> Pie -> Bar/Line -> Table */}
        {(['kpi', 'pie', 'bar', 'line', 'scatter', 'table'] as const).map((vizType) => {
          const filteredViz = data.visualizations.filter(v => v.type === vizType);
          if (filteredViz.length === 0) return null;
          
          return (
            <div key={vizType} className="mb-6">
              <h3 className="text-sm font-semibold text-slate-600 mb-3 capitalize">
                {vizType === 'bar' || vizType === 'line' ? 'Charts' : `${vizType}s`}
              </h3>
              <div className="flex flex-wrap -mx-2 gap-y-3">
                {filteredViz.map((viz, idx) => {
                  const originalIdx = data.visualizations.indexOf(viz);
                  const chartData = getChartData(viz);
                  const dimensions = getVizDimensions(viz, chartData, filteredViz.length);
                  
                  return (
                  <div key={originalIdx} className={`${dimensions.width} px-2`} style={{ minHeight: dimensions.height }}>
                  <Card 
                    className={`bg-white group relative hover:shadow-lg transition-all h-full ${viz.type === 'kpi' ? 'border-0 shadow-none' : ''} ${
                      visibleCharts.includes(originalIdx) 
                        ? 'animate-fade-in' 
                        : 'opacity-0'
                    }`}
                    style={{ 
                      animationDelay: `${originalIdx * 100}ms`,
                      minHeight: dimensions.height 
                    }}
                  >
                    {onRemoveVisualization && (
                      <button
                        onClick={() => onRemoveVisualization(originalIdx)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    
                    <CardHeader className={`pb-2 ${dimensions.isCompact ? 'py-2' : ''}`}>
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                        <CardTitle className={dimensions.isCompact ? 'text-xs' : 'text-sm'}>{toDisplayName(viz.title)}</CardTitle>
                      </div>
                      {viz.description && !dimensions.isCompact && (
                        <p className="text-xs text-slate-500">{viz.description}</p>
                      )}
                    </CardHeader>
                    
                    <CardContent className={dimensions.isCompact ? 'py-1' : ''}>
                      {viz.type === 'bar' && chartData.length > 0 && (
                        <ResponsiveContainer width="100%" height={Math.max(dimensions.height - 80, 150)}>
                          <BarChart data={chartData.slice(0, 15)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} height={35} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {chartData.slice(0, 15).map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}

                      {viz.type === 'line' && chartData.length > 0 && (
                        <ResponsiveContainer width="100%" height={Math.max(dimensions.height - 80, 150)}>
                          <LineChart data={chartData.slice(0, 15)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} height={35} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0] }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}

                      {viz.type === 'pie' && chartData.length > 0 && (
                        <ResponsiveContainer width="100%" height={Math.max(dimensions.height - 80, 150)}>
                          <PieChart>
                            <Pie
                              data={chartData.slice(0, 6)}
                              cx="50%"
                              cy="50%"
                              innerRadius="30%"
                              outerRadius="60%"
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                              label={false}
                            >
                              {chartData.slice(0, 6).map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '9px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}

                      {viz.type === 'scatter' && (() => {
                        // Scatter needs raw (x, y) points, not aggregated
                        const scatterData = data.preview?.slice(0, 200).map((row: any) => ({
                          x: Number(row[viz.x_axis || '']) || 0,
                          y: Number(row[viz.y_axis || '']) || 0,
                        })) || [];
                        return (
                          <ResponsiveContainer width="100%" height={Math.max(dimensions.height - 80, 150)}>
                            <ScatterChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="x" name={viz.x_axis} tick={{ fontSize: 10 }} />
                              <YAxis dataKey="y" name={viz.y_axis} tick={{ fontSize: 10 }} />
                              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                              <Scatter data={scatterData} fill={COLORS[5]} />
                            </ScatterChart>
                          </ResponsiveContainer>
                        );
                      })()}

                      {viz.type === 'table' && (
                        <DataTable 
                          data={data.preview} 
                          columns={data.columns.slice(0, 6)} 
                          height={dimensions.height - 80}
                        />
                      )}

                      {viz.type === 'kpi' && (() => {
                        const kpi = kpiData.find(k => k.title === viz.title);
                        const formatted = kpi
                          ? kpi.value.toLocaleString(undefined, {
                              maximumFractionDigits: kpi.aggregation === 'avg' ? 2 : 0
                            })
                          : '—';
                        return (
                          <div className="flex flex-col items-center justify-center h-full gap-1">
                            <p className="text-5xl font-bold text-slate-900">{formatted}</p>
                            {kpi?.aggregation && (
                              <p className="text-xs text-slate-400 uppercase tracking-wide">
                                {kpi.aggregation === 'avg' ? 'Average' :
                                 kpi.aggregation === 'count' ? 'Count' :
                                 kpi.aggregation === 'min' ? 'Minimum' :
                                 kpi.aggregation === 'max' ? 'Maximum' : 'Total'}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {data.visualizations.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">No visualizations yet</p>
          <p className="text-xs">Use the chat to add charts</p>
        </div>
      )}

      {/* Knowledge Graph Display - ABOVE ReportAI Insights */}
      {showInsights && knowledgeGraph && knowledgeGraph.nodes && knowledgeGraph.nodes.length > 0 && (
        <div className="px-4 pb-4 animate-fade-in flex gap-4" style={{ animationDelay: '150ms' }}>
          <div className="flex-1">
            <Card className="bg-indigo-50 border-indigo-100 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-indigo-900">
                  Knowledge Graph ({knowledgeGraph.metadata?.total_nodes || 0} nodes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <KnowledgeGraphViz 
                  nodes={knowledgeGraph.nodes} 
                  edges={knowledgeGraph.edges || []}
                  width={380}
                  height={260}
                />
              </CardContent>
            </Card>
          </div>
          <div className="flex-1">
            <Card className="bg-indigo-50 border-indigo-100 h-full">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-indigo-700 mb-2">Node Types</p>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(knowledgeGraph.nodes.map((n: any) => n.type))].slice(0, 6).map((type: any) => (
                      <span key={type} className="px-2 py-1 bg-white rounded text-xs font-medium text-indigo-700 border border-indigo-200">{type}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-700 mb-2">Relationships</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {knowledgeGraph.edges?.slice(0, 8).map((edge: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-indigo-800 bg-white/50 rounded px-2 py-1">
                        <span className="font-medium truncate">{edge.from}</span>
                        <span className="text-indigo-400">→</span>
                        <span className="truncate">{edge.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-indigo-500 italic">Click node to highlight connections</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Insights - Markdown with Typewriter */}
      {showInsights && data.insights && data.insights.length > 0 && (
        <div className="p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle className="text-base bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  ReportAI Insights
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isFirstLoad ? (
                <div className="prose prose-sm max-w-none prose-emerald">
                  <TypewriterMarkdown content={data.insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n\n')} speed={15} />
                </div>
              ) : (
                <div className="grid gap-3">
                  {data.insights.map((insight: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-emerald-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-emerald-900 prose prose-sm prose-emerald max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({node, ...props}) => <p className="mb-0 text-emerald-800 leading-relaxed" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-emerald-700" {...props} />,
                            code: ({node, ...props}) => <code className="bg-emerald-50 px-2 py-1 rounded text-xs font-mono text-emerald-700 border border-emerald-200" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-none pl-0 mb-0 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-0 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="mb-0 text-emerald-800 flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span><span className="flex-1">{props.children}</span></li>,
                          }}
                        >
                          {insight}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Correlations Display */}
      {showInsights && correlations && correlations.length > 0 && (
        <div className="px-4 pb-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Card className="bg-purple-50 border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-900">Data Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {correlations.filter((c: any) => c.type !== 'cross_file').slice(0, 5).map((corr: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      corr.strength === 'strong' ? 'bg-red-100 text-red-700' : 
                      corr.strength === 'moderate' ? 'bg-red-100 text-red-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {corr.strength}
                    </span>
                    <span className="text-sm text-purple-800">
                      {toDisplayName(corr.column1)} ↔ {toDisplayName(corr.column2)}
                    </span>
                    <span className="text-xs text-purple-600">
                      {corr.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Summary - LAST */}
      <div className="p-4">
        <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <CardTitle className="text-base bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Report Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Show typewriter effect on first load */}
            {isFirstLoad ? (
              <div className="prose prose-sm max-w-none prose-slate">
                <TypewriterMarkdown content={data.narrative} speed={10} />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none prose-slate">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-slate-800 border-b border-slate-200 pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-3 mb-2 text-slate-700 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>{props.children}</h2>,
                    h3: ({node, ...props}) => <h3 className="text-base font-medium mt-2 mb-1 text-slate-600" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 text-slate-600 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-none pl-0 mb-3 space-y-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1 text-slate-600 flex items-start gap-2"><span className="text-slate-400 mt-1">•</span><span className="flex-1">{props.children}</span></li>,
                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-slate-500" {...props} />,
                    code: ({node, ...props}) => <code className="bg-gradient-to-r from-slate-100 to-slate-50 px-2 py-1 rounded text-xs font-mono text-slate-700 border border-slate-200" {...props} />,
                  }}
                >
                  {data.narrative}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 16v-4m4 4V8m4 8v-8" />
    </svg>
  );
}
