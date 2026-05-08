import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, BarChart2, Shield, Building2, TrendingUp, AlertTriangle, Download, Lock
} from 'lucide-react';
import API from '@/lib/api';
import { UserButton } from '@clerk/clerk-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { toast } from 'sonner';

export const Route = createFileRoute('/org/dashboard')({ component: OrgDashboard });

// --- Mock Data ---
const DEPARTMENTS = [
  { id: 'dept_1', name: 'Engineering', members: 45, avgMood: 6.8, sessions: 12 },
  { id: 'dept_2', name: 'Sales', members: 18, avgMood: 5.2, sessions: 8, burnoutRisk: true },
  { id: 'dept_3', name: 'HR', members: 8, avgMood: 7.1, sessions: 5 }, // n < 10, hidden
  { id: 'dept_4', name: 'Operations', members: 27, avgMood: 6.2, sessions: 9 },
  { id: 'dept_5', name: 'Marketing', members: 12, avgMood: 7.5, sessions: 4 },
  { id: 'dept_6', name: 'Legal', members: 4, avgMood: 6.0, sessions: 1 }, // n < 10, hidden
];

const MOOD_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  mood: parseFloat((6.0 + Math.sin(i / 3) * 1.5 + Math.random() * 0.5).toFixed(1)),
}));

const USERS = [
  { id: 'u1', name: 'Aarav Patel', email: 'aarav@company.com', dept: 'Engineering', status: 'Active' },
  { id: 'u2', name: 'Diya Sharma', email: 'diya@company.com', dept: 'Sales', status: 'Active' },
  { id: 'u3', name: 'Vihaan Singh', email: 'vihaan@company.com', dept: 'HR', status: 'Pending' },
  { id: 'u4', name: 'Ananya Gupta', email: 'ananya@company.com', dept: 'Engineering', status: 'Active' },
  { id: 'u5', name: 'Advik Kumar', email: 'advik@company.com', dept: 'Operations', status: 'Inactive' },
];

function DepartmentHeatmap({ data }: { data: typeof DEPARTMENTS }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = Math.max(300, data.length * 40) - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yLabels = data.map(d => d.name);
    const xLabels = ['Avg Mood', 'Sessions', 'Engagement %'];

    const matrix = data.flatMap(d => {
      const isVisible = d.members >= 10;
      return [
        { dept: d.name, metric: 'Avg Mood', value: d.avgMood, visible: isVisible },
        { dept: d.name, metric: 'Sessions', value: d.sessions, visible: isVisible },
        { dept: d.name, metric: 'Engagement %', value: (d.members / 50 * 100), visible: isVisible }
      ]
    });

    const x = d3.scaleBand().range([0, width]).domain(xLabels).padding(0.05);
    const y = d3.scaleBand().range([height, 0]).domain(yLabels).padding(0.05);

    // Color scales
    const colorMood = d3.scaleSequential(d3.interpolateRdYlGn).domain([4, 9]);
    const colorSessions = d3.scaleSequential(d3.interpolateBlues).domain([0, 20]);
    const colorEngagement = d3.scaleSequential(d3.interpolatePurples).domain([0, 100]);

    svg.append('g')
      .style('font-size', 12)
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain').remove();

    svg.append('g')
      .style('font-size', 12)
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain').remove();

    svg.selectAll()
      .data(matrix, function(d: any) { return d.dept + ':' + d.metric; })
      .join('rect')
      .attr('x', (d: any) => x(d.metric)!)
      .attr('y', (d: any) => y(d.dept)!)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', (d: any) => {
        if (!d.visible) return '#f1f5f9'; // slate-100 for n<10
        if (d.metric === 'Avg Mood') return colorMood(d.value);
        if (d.metric === 'Sessions') return colorSessions(d.value);
        if (d.metric === 'Engagement %') return colorEngagement(d.value);
        return '#fff';
      })
      .style('stroke', (d: any) => !d.visible ? '#e2e8f0' : 'none')
      .style('opacity', 0.9);

    // Text overlay
    svg.selectAll()
      .data(matrix)
      .join('text')
      .attr('x', (d: any) => x(d.metric)! + x.bandwidth() / 2)
      .attr('y', (d: any) => y(d.dept)! + y.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('fill', (d: any) => {
        if (!d.visible) return '#94a3b8';
        if (d.metric === 'Avg Mood' && d.value < 6) return '#fff';
        if (d.metric === 'Avg Mood') return '#0f172a';
        return '#fff';
      })
      .style('font-size', '13px')
      .style('font-weight', '600')
      .text((d: any) => {
        if (!d.visible) return 'n < 10 (Hidden)';
        if (d.metric === 'Avg Mood') return d.value.toFixed(1);
        if (d.metric === 'Sessions') return d.value.toString();
        if (d.metric === 'Engagement %') return `${d.value.toFixed(0)}%`;
        return '';
      });

  }, [data]);

  return (
    <div className="overflow-x-auto w-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}

function OrgDashboard() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  // Identify burnout risks
  const burnoutDepts = DEPARTMENTS.filter(d => d.burnoutRisk && d.members >= 10);

  const handleDownloadPdf = () => {
    // html2canvas does not support modern CSS color spaces like oklch.
    // Instead, we use the browser's native print-to-PDF functionality which supports all modern CSS.
    toast.success('Opening print dialog. Please save as PDF.', { id: 'pdf-toast' });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const overviewMetrics = [
    { label: 'Active Users', value: 87, sub: 'of 120 seats', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Avg Team Mood', value: '6.4', sub: 'Last 30 days', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Engagement', value: '72%', sub: 'Weekly active', icon: BarChart2, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Crisis Alerts', value: 2, sub: 'Anonymised flags', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Org Admin Portal</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Shield className="size-3" /> Minimum 10 users per department required for aggregates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              <Download className="size-4" />
              ESG Report
            </button>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{ elements: { userButtonAvatarBox: "size-8" } }}
            />
          </div>
        </div>
      </header>

      {/* The content to be captured in PDF */}
      <div id="dashboard-content" className="max-w-6xl mx-auto px-4 py-8 space-y-8 bg-slate-50">
        
        {/* Burnout Alert Banner */}
        {burnoutDepts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900">Burnout Risk Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                {burnoutDepts.map(d => `${d.name} dept stress +23% this week`).join(' · ')}. 
                Consider enabling mandatory mental health days or providing 1-on-1 interventions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {overviewMetrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className={`grid size-10 place-items-center rounded-xl mb-3 ${m.color}`}>
                <m.icon className="size-5" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{m.value}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{m.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* 30-Day Trend & Heatmap Row */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Recharts Trend Line */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="font-bold text-slate-900">30-Day Team Mood Trend</h2>
              <p className="text-xs text-slate-500">Aggregate mood fluctuations across all active users</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOOD_DATA} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} minTickGap={30} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Line type="monotone" dataKey="mood" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* D3 Heatmap */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-4">
              <h2 className="font-bold text-slate-900">Department Heatmap</h2>
              <p className="text-xs text-slate-500">Visualizing wellness metrics. (n &lt; 10 filtered for privacy)</p>
            </div>
            <DepartmentHeatmap data={DEPARTMENTS} />
          </div>

        </div>

        {/* Seat Management Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Seat Management</h2>
            <p className="text-xs text-slate-500 mt-1">Manage active platform licenses. No individual wellness data is shown.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">Employee</th>
                  <th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {USERS.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {user.dept}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'Active' ? 'bg-green-100 text-green-800' :
                        user.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
            Showing {USERS.length} users. 87 of 120 seats used.
          </div>
        </div>

      </div>
    </div>
  );
}
