'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  TextInput,
  Table,
  Label,
  Select,
} from 'flowbite-react';
import {
  IconTrendingUp,
  IconUsers,
  IconCircleCheckFilled,
  IconClock,
  IconCurrencyRupee,
  IconRefresh,
  IconCalendar,
  IconChartBar,
  IconChartPie,
  IconTrophy,
  IconTarget,
} from '@tabler/icons-react';
import { API_BASE_URL } from '@/lib/config';
import { useRouter } from 'next/navigation';

// Interfaces
interface ProjectPerformance {
  _id: string;
  totalLeads: number;
  bookedLeads: number;
  activeLeads: number;
  estimatedRevenue: number;
  potentialRevenue: number;
  projectId: string;
  projectName: string;
  projectLocation: string;
  conversionRate: number;
}

interface AnalyticsData {
  success: boolean;
  data: ProjectPerformance[];
  totals: {
    totalLeads: number;
    bookedLeads: number;
    activeLeads: number;
    estimatedRevenue: number;
    potentialRevenue: number;
    overallConversionRate: number;
  };
  filters: {
    month: string;
    year: string;
  };
}

interface TopPerformer {
  _id: string;
  totalLeads: number;
  bookedLeads: number;
  activeLeads: number;
  totalRevenue: number;
  userId: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  conversionRate: number;
  averageRevenuePerBooking: number;
}

interface TopPerformersData {
  success: boolean;
  data: TopPerformer[];
  count: number;
}

interface TopSite {
  _id: string;
  totalLeads: number;
  bookedLeads: number;
  revenue: number;
  projectId: string;
  projectName: string;
  location: string;
  conversionRate: number;
}

interface TopSitesData {
  success: boolean;
  data: TopSite[];
  count: number;
}

interface CPSiteData {
  _id: string;
  totalLeads: number;
  digitalLeads: number;
  cpLeads: number;
  otherLeads: number;
  projectId: string;
  projectName: string;
  location: string;
  activeCPsCount: number;
  digitalPercentage: number;
  cpPercentage: number;
  otherPercentage: number;
}

interface CPSitePerformanceData {
  success: boolean;
  data: CPSiteData[];
  totals: {
    totalLeads: number;
    digitalLeads: number;
    cpLeads: number;
    otherLeads: number;
    digitalPercentage: number;
    cpPercentage: number;
    otherPercentage: number;
  };
}

interface TopCP {
  cpId: string;
  cpName: string;
  cpPhone: string;
  firmName: string;
  visits: number;
}

interface RecentVisit {
  date: string;
  cpName: string;
  projectName: string;
  location: {
    lat: number;
    lng: number;
  };
  notes: string;
}

interface SourcingPerformer {
  userId: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  totalVisits: number;
  uniqueCPsCount: number;
  uniqueProjectsCount: number;
  cpLeads: number;
  cpBookings: number;
  cpRevenue: number;
  visitsPerCP: string;
  leadsPerVisit: string;
  conversionRate: string;
  topCPs: TopCP[];
  recentVisits: RecentVisit[];
}

interface TopSourcingPerformersData {
  success: boolean;
  data: SourcingPerformer[];
  summary: {
    totalUsers: number;
    totalVisits: number;
    totalCPLeads: number;
    totalCPBookings: number;
    totalCPRevenue: number;
  };
  count: number;
}

// CP Site Performance Component
const CPSitePerformance = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CPSitePerformanceData | null>(null);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2025');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/cp-site-wise-performance?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  if (loading) return <Spinner size="lg" />;
  if (error) return <Alert color="failure">{error}</Alert>;
  if (!data) return null;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <IconChartPie className="mr-2 text-purple-600" size={24} />
          CP Site Performance
        </h3>
        <div className="flex gap-2">
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </Select>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map(year => (
              <option key={year.value} value={year.value}>{year.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.totals.totalLeads}</div>
          <div className="text-sm text-blue-600">Total Leads</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.totals.digitalLeads}</div>
          <div className="text-sm text-green-600">Digital Leads</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{data.totals.cpLeads}</div>
          <div className="text-sm text-purple-600">CP Leads</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{data.totals.otherLeads}</div>
          <div className="text-sm text-orange-600">Other Leads</div>
        </div>
      </div>

      {/* 3D Pie Charts for each project */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {data.data.map((project) => {
          const total = project.totalLeads;
          const digitalAngle = (project.digitalLeads / total) * 360;
          const cpAngle = (project.cpLeads / total) * 360;
          const otherAngle = (project.otherLeads / total) * 360;
          
          let currentAngle = 0;
          const radius = 60;
          const centerX = 80;
          const centerY = 80;

          return (
            <div key={project._id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-center">{project.projectName}</h4>
              <div className="flex justify-center">
                <svg width="160" height="160" className="transform rotate-0" style={{ perspective: '1000px' }}>
                  <defs>
                    <linearGradient id={`digital-${project._id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id={`cp-${project._id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <linearGradient id={`other-${project._id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <filter id={`shadow-${project._id}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
                    </filter>
                  </defs>
                  
                  {/* Digital Leads */}
                  {digitalAngle > 0 && (
                    <path
                      d={`M ${centerX} ${centerY} L ${centerX + radius * Math.cos((currentAngle * Math.PI) / 180)} ${centerY + radius * Math.sin((currentAngle * Math.PI) / 180)} A ${radius} ${radius} 0 ${digitalAngle > 180 ? 1 : 0} 1 ${centerX + radius * Math.cos(((currentAngle + digitalAngle) * Math.PI) / 180)} ${centerY + radius * Math.sin(((currentAngle + digitalAngle) * Math.PI) / 180)} Z`}
                      fill={`url(#digital-${project._id})`}
                      filter={`url(#shadow-${project._id})`}
                      style={{ transform: 'translateZ(10px)' }}
                    />
                  )}
                  {currentAngle += digitalAngle}
                  
                  {/* CP Leads */}
                  {cpAngle > 0 && (
                    <path
                      d={`M ${centerX} ${centerY} L ${centerX + radius * Math.cos((currentAngle * Math.PI) / 180)} ${centerY + radius * Math.sin((currentAngle * Math.PI) / 180)} A ${radius} ${radius} 0 ${cpAngle > 180 ? 1 : 0} 1 ${centerX + radius * Math.cos(((currentAngle + cpAngle) * Math.PI) / 180)} ${centerY + radius * Math.sin(((currentAngle + cpAngle) * Math.PI) / 180)} Z`}
                      fill={`url(#cp-${project._id})`}
                      filter={`url(#shadow-${project._id})`}
                      style={{ transform: 'translateZ(5px)' }}
                    />
                  )}
                  {currentAngle += cpAngle}
                  
                  {/* Other Leads */}
                  {otherAngle > 0 && (
                    <path
                      d={`M ${centerX} ${centerY} L ${centerX + radius * Math.cos((currentAngle * Math.PI) / 180)} ${centerY + radius * Math.sin((currentAngle * Math.PI) / 180)} A ${radius} ${radius} 0 ${otherAngle > 180 ? 1 : 0} 1 ${centerX + radius * Math.cos(((currentAngle + otherAngle) * Math.PI) / 180)} ${centerY + radius * Math.sin(((currentAngle + otherAngle) * Math.PI) / 180)} Z`}
                      fill={`url(#other-${project._id})`}
                      filter={`url(#shadow-${project._id})`}
                      style={{ transform: 'translateZ(0px)' }}
                    />
                  )}
                </svg>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Digital: {project.digitalLeads}
                  </span>
                  <span className="font-medium">{project.digitalPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    CP: {project.cpLeads}
                  </span>
                  <span className="font-medium">{project.cpPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    Other: {project.otherLeads}
                  </span>
                  <span className="font-medium">{project.otherPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell>Project</Table.HeadCell>
            <Table.HeadCell>Location</Table.HeadCell>
            <Table.HeadCell>Total Leads</Table.HeadCell>
            <Table.HeadCell>Digital</Table.HeadCell>
            <Table.HeadCell>CP</Table.HeadCell>
            <Table.HeadCell>Other</Table.HeadCell>
            <Table.HeadCell>Active CPs</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {data.data.map((project) => (
              <Table.Row key={project._id}>
                <Table.Cell className="font-medium">{project.projectName}</Table.Cell>
                <Table.Cell>{project.location}</Table.Cell>
                <Table.Cell><Badge color="blue">{project.totalLeads}</Badge></Table.Cell>
                <Table.Cell><Badge color="success">{project.digitalLeads}</Badge></Table.Cell>
                <Table.Cell><Badge color="purple">{project.cpLeads}</Badge></Table.Cell>
                <Table.Cell><Badge color="warning">{project.otherLeads}</Badge></Table.Cell>
                <Table.Cell><Badge color="info">{project.activeCPsCount}</Badge></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Card>
  );
};

// Top Performing Sites Component
const TopPerformingSites = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TopSitesData | null>(null);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2025');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/top-performing-sites?month=${selectedMonth}&year=${selectedYear}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const getMaxBookedLeads = () => {
    if (!data || !data.data || data.data.length === 0) return 1;
    return Math.max(...data.data.map(site => site.bookedLeads || 0), 1);
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <Alert color="failure">{error}</Alert>;
  if (!data) return null;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <IconTarget className="mr-2 text-green-600" size={24} />
          Top Performing Sites
        </h3>
        <div className="flex gap-2">
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </Select>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map(year => (
              <option key={year.value} value={year.value}>{year.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Vertical Bar Chart with X-Y Coordinates */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          {/* Chart Title */}
          <div className="text-center mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Booked Leads by Project</h4>
          </div>
          
          {/* Chart Container with Axes */}
          <div className="relative">
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-2 h-80 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
              {(() => {
                const maxBookedLeads = getMaxBookedLeads();
                const steps = 5;
                const stepValue = Math.ceil(maxBookedLeads / steps);
                return Array.from({ length: steps + 1 }, (_, i) => {
                  const value = stepValue * (steps - i); // Reverse the order so 0 is at bottom
                  return (
                    <div key={i} className="flex items-center">
                      <div className="w-2 h-px bg-gray-300 dark:bg-gray-600 mr-2"></div>
                      <span className="font-medium">{value}</span>
                    </div>
                  );
                });
              })()}
            </div>
            
            {/* Chart Area */}
            <div className="ml-8 mr-4 mt-2">
              {/* Grid Lines */}
              <div className="absolute inset-0 ml-8 mr-4">
                {(() => {
                  const maxBookedLeads = getMaxBookedLeads();
                  const steps = 5;
                  const stepValue = Math.ceil(maxBookedLeads / steps);
                  return Array.from({ length: steps + 1 }, (_, i) => {
                    const percentage = (i / steps) * 100;
                    return (
                      <div
                        key={i}
                        className="absolute w-full border-t border-gray-200 dark:border-gray-600"
                        style={{ top: `${100 - percentage}%` }}
                      ></div>
                    );
                  });
                })()}
              </div>
              
              {/* Bars */}
              <div className="flex items-end justify-center h-80 space-x-6 relative z-10">
                {data.data.map((site, index) => {
                  const maxBookedLeads = getMaxBookedLeads();
                  const steps = 5;
                  const stepValue = Math.ceil(maxBookedLeads / steps);
                  const maxValue = stepValue * steps;
                  
                  // Calculate the exact position based on Y-axis scale
                  // If Y-axis shows 0, 1, 2, 3, 4, 5 and we have 1 booked lead, bar should touch the "1" line
                  const exactPercentage = ((site.bookedLeads || 0) / maxValue) * 100;
                  
  return (
                    <div key={site._id} className="flex flex-col items-center w-24">
                      {/* Bar Container */}
                      <div className="w-16 h-64 flex flex-col justify-end relative">
                        {/* Booked Leads Bar */}
                        <div 
                          className="w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-500 relative shadow-md hover:shadow-lg"
                          style={{ height: `${Math.max(exactPercentage, 1)}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow whitespace-nowrap">
                            {site.bookedLeads}
                          </div>
                        </div>
                      </div>
                      
                      {/* Project Name and Stats */}
                      <div className="mt-3 text-center">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-20" title={site.projectName}>
                          {site.projectName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {site.totalLeads} total
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                          {site.conversionRate.toFixed(1)}%
                        </div>
                      </div>
        </div>
                  );
                })}
        </div>
        </div>
            
            {/* X-Axis Label */}
            <div className="text-center mt-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Projects</span>
        </div>
        </div>
          
          {/* Chart Legend */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg border">
              <div className="w-4 h-4 bg-gradient-to-t from-green-500 to-green-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Booked Leads</span>
        </div>
        </div>
        </div>
        </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell>Rank</Table.HeadCell>
            <Table.HeadCell>Project</Table.HeadCell>
            <Table.HeadCell>Location</Table.HeadCell>
            <Table.HeadCell>Total Leads</Table.HeadCell>
            <Table.HeadCell>Booked</Table.HeadCell>
            <Table.HeadCell>Conversion Rate</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {data.data.map((site, index) => (
              <Table.Row key={site._id}>
                <Table.Cell>
                  <div className="flex items-center justify-center">
                    {index === 0 && <span className="text-3xl">🥇</span>}
                    {index === 1 && <span className="text-3xl">🥈</span>}
                    {index === 2 && <span className="text-3xl">🥉</span>}
                    {index > 2 && (
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full shadow-md">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="font-medium">{site.projectName}</Table.Cell>
                <Table.Cell>{site.location}</Table.Cell>
                <Table.Cell><Badge color="blue">{site.totalLeads}</Badge></Table.Cell>
                <Table.Cell><Badge color="success">{site.bookedLeads}</Badge></Table.Cell>
                <Table.Cell><Badge color="warning">{site.conversionRate.toFixed(1)}%</Badge></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        </div>
    </Card>
  );
};

// Top Sourcing Performers Component
const TopSourcingPerformers = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TopSourcingPerformersData | null>(null);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2025');
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/top-sourcing-performers?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const handleUserClick = (userId: string) => {
    router.push(`/apps/users/${userId}`);
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <Alert color="failure">{error}</Alert>;
  if (!data) return null;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <IconUsers className="mr-2 text-indigo-600" size={24} />
          Top Sourcing Performers
        </h3>
        <div className="flex gap-2">
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </Select>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map(year => (
              <option key={year.value} value={year.value}>{year.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.summary.totalUsers}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.summary.totalVisits}</div>
          <div className="text-sm text-green-600">Total Visits</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{data.summary.totalCPLeads}</div>
          <div className="text-sm text-purple-600">CP Leads</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{data.summary.totalCPBookings}</div>
          <div className="text-sm text-orange-600">CP Bookings</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">₹{data.summary.totalCPRevenue}</div>
          <div className="text-sm text-red-600">CP Revenue</div>
        </div>
      </div> */}

      <div className="overflow-x-auto">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell>Rank</Table.HeadCell>
            <Table.HeadCell>CP Name</Table.HeadCell>
            <Table.HeadCell>Firm Name</Table.HeadCell>
            <Table.HeadCell>Phone</Table.HeadCell>
            <Table.HeadCell>Total Visits</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {(() => {
              // Flatten all CPs from all performers and sort by visits
              const allCPs = data.data.flatMap(performer => 
                performer.topCPs.map(cp => ({
                  ...cp,
                  performerName: performer.userName
                }))
              );
              
              // Sort by visits (descending) and remove duplicates by CP ID
              const uniqueCPs = allCPs.reduce((acc, cp) => {
                const existing = acc.find(item => item.cpId === cp.cpId);
                if (!existing || cp.visits > existing.visits) {
                  if (existing) {
                    const index = acc.findIndex(item => item.cpId === cp.cpId);
                    acc[index] = cp;
                  } else {
                    acc.push(cp);
                  }
                }
                return acc;
              }, [] as (TopCP & { performerName: string })[]);
              
              // Sort by visits descending
              uniqueCPs.sort((a, b) => b.visits - a.visits);
              
              return uniqueCPs.map((cp, index) => (
                <Table.Row key={`${cp.cpId}-${index}`}>
                  <Table.Cell>
                    <div className="flex items-center justify-center">
                      {index === 0 && <span className="text-3xl">🥇</span>}
                      {index === 1 && <span className="text-3xl">🥈</span>}
                      {index === 2 && <span className="text-3xl">🥉</span>}
                      {index > 2 && (
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full shadow-md">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="font-medium">{cp.cpName}</Table.Cell>
                  <Table.Cell>{cp.firmName}</Table.Cell>
                  <Table.Cell>{cp.cpPhone}</Table.Cell>
                  <Table.Cell><Badge color="blue">{cp.visits}</Badge></Table.Cell>
                </Table.Row>
              ));
            })()}
          </Table.Body>
        </Table>
      </div>
    </Card>
  );
};

// Top Booking Performers Component
const TopBookingPerformers = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TopPerformersData | null>(null);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2025');
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/top-booking-performers?month=${selectedMonth}&year=${selectedYear}&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const handleUserClick = (userId: string) => {
    router.push(`/apps/users/${userId}`);
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <Alert color="failure">{error}</Alert>;
  if (!data) return null;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <IconTrophy className="mr-2 text-yellow-600" size={24} />
          Top 5 Booking Performers
        </h3>
        <div className="flex gap-2">
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </Select>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map(year => (
              <option key={year.value} value={year.value}>{year.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell>Rank</Table.HeadCell>
            <Table.HeadCell>User</Table.HeadCell>
            <Table.HeadCell>Email</Table.HeadCell>
            {/* <Table.HeadCell>Total Leads</Table.HeadCell> */}
            <Table.HeadCell>Booked</Table.HeadCell>
            {/* <Table.HeadCell>Active</Table.HeadCell> */}
            {/* <Table.HeadCell>Conversion Rate</Table.HeadCell> */}
          </Table.Head>
          <Table.Body>
            {data.data.map((performer, index) => (
              <Table.Row 
                key={performer._id} 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => handleUserClick(performer.userId)}
              >
                <Table.Cell>
                  <div className="flex items-center justify-center">
                    {index === 0 && <span className="text-3xl">🥇</span>}
                    {index === 1 && <span className="text-3xl">🥈</span>}
                    {index === 2 && <span className="text-3xl">🥉</span>}
                    {index > 2 && (
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full shadow-md">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="font-medium">{performer.userName}</Table.Cell>
                <Table.Cell>{performer.userEmail}</Table.Cell>
                {/* <Table.Cell><Badge color="blue">{performer.totalLeads}</Badge></Table.Cell> */}
                <Table.Cell><Badge color="success">{performer.bookedLeads}</Badge></Table.Cell>
                {/* <Table.Cell><Badge color="warning">{performer.activeLeads}</Badge></Table.Cell> */}
                {/* <Table.Cell><Badge color="purple">{performer.conversionRate.toFixed(1)}%</Badge></Table.Cell> */}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Card>
  );
};

// Main Analytics Dashboard
const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-xl text-purple-100 mb-4">Advanced Performance Analytics & Insights</p>
            <div className="flex items-center space-x-6 text-purple-100">
              <div className="flex items-center space-x-2">
                <IconTrendingUp className="text-xl" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center space-x-2">
                <IconChartPie className="text-xl" />
                <span>3D Visualizations</span>
              </div>
              <div className="flex items-center space-x-2">
                <IconTrophy className="text-xl" />
                <span>Performance Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Components */}
      <TopPerformingSites />
      <CPSitePerformance />
      <TopSourcingPerformers />
      <TopBookingPerformers />
    </div>
  );
};

export default AnalyticsDashboard;