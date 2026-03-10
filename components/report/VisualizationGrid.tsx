import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Visualization {
  type: string;
  title: string;
  x_axis?: string;
  y_axis?: string;
  aggregation?: string;
  column?: string;
  description?: string;
}

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
  visualizations: Visualization[];
  insights: string[];
  narrative: string;
  preview: any[];
}

interface VisualizationGridProps {
  data: ReportData;
  isLoading: boolean;
}

// Color palette for charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// Wrap text helper
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

export function VisualizationGrid({ data, isLoading }: VisualizationGridProps) {
  // Process data for charts
  const chartData = useMemo(() => {
    if (!data.preview || data.preview.length === 0) return [];
    
    // Group data by x_axis for bar/line charts
    const grouped: Record<string, number> = {};
    
    data.visualizations.forEach(viz => {
      if ((viz.type === 'bar' || viz.type === 'line' || viz.type === 'pie') && viz.x_axis && viz.y_axis) {
        data.preview.forEach((row: any) => {
          const xVal = row[viz.x_axis as keyof typeof row];
          const yVal = row[viz.y_axis as keyof typeof row];
          if (xVal && yVal !== undefined && yVal !== null) {
            if (!grouped[xVal]) grouped[xVal] = 0;
            grouped[xVal] += Number(yVal) || 0;
          }
        });
      }
    });
    
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [data]);

  // Get KPI data
  const kpiData = useMemo(() => {
    return data.visualizations
      .filter(v => v.type === 'kpi')
      .map(viz => {
        const numericField = viz.column || viz.y_axis;
        const values = data.preview?.map((row: any) => Number(row[numericField as keyof typeof row]) || 0) || [];
        const sum = values.reduce((a: number, b: number) => a + b, 0);
        
        return {
          title: viz.title,
          value: sum,
          column: numericField,
        };
      });
  }, [data]);

  // Get table columns
  const tableColumns = useMemo(() => {
    return data.columns?.slice(0, 6) || [];
  }, [data]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Narrative Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-900">Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none prose-slate">
              <ReactMarkdown>{data.narrative}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {kpiData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpiData.map((kpi, idx) => (
              <Card key={idx} className="bg-white">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 font-medium">{kpi.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {kpi.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Insights Section */}
        {data.insights && data.insights.length > 0 && (
          <Card className="bg-emerald-50 border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-emerald-900">ReportAI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-emerald-800">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.visualizations.map((viz, idx) => (
            <Card key={idx} className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{viz.title}</CardTitle>
                {viz.description && (
                  <p className="text-xs text-slate-500">{viz.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {viz.type === 'bar' && (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={<CustomXAxisTick />}
                        interval={0}
                        height={35}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {viz.type === 'line' && (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={<CustomXAxisTick />}
                        interval={0}
                        height={35}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {viz.type === 'pie' && (
                  <ResponsiveContainer width="100%" height={250}>
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
                        {chartData.slice(0, 6).map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {viz.type === 'table' && (
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          {tableColumns.map((col: string) => (
                            <th key={col} className="px-3 py-2 text-left font-medium text-xs text-slate-600 border-b">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data.preview as any[])?.slice(0, 10).map((row: any, rowIdx: number) => (
                          <tr key={rowIdx} className="border-b hover:bg-slate-50">
                            {tableColumns.map((col: string) => (
                              <td key={col} className="px-3 py-2 text-xs">
                                {row[col] !== undefined ? String(row[col]) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Info */}
        <Card className="bg-slate-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                <strong>{data.filename}</strong>
              </span>
              <span>
                {data.row_count} rows × {data.columns?.length || 0} columns
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
