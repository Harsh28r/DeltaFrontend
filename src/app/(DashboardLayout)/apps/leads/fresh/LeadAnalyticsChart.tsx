"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button, Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';
import { API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Lead {
    _id: string;
    user?: {
        _id: string;
        name: string;
    } | null;
    source?: string;
    leadSource?: {
        _id: string;
        name: string;
    } | null;
    [key: string]: any;
}

interface LeadSource {
    _id: string;
    name: string;
}

interface LeadAnalyticsChartProps {
    leads: Lead[];
}

const LeadAnalyticsChart: React.FC<LeadAnalyticsChartProps> = ({ leads }) => {
    const { token } = useAuth();
    const router = useRouter();
    const [activeChart, setActiveChart] = useState<'source' | 'user'>('source');
    const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
    const [loadingLeadSources, setLoadingLeadSources] = useState(true);

    // Fetch lead sources from API
    useEffect(() => {
        const fetchLeadSources = async () => {
            if (!token) return;
            
            try {
                setLoadingLeadSources(true);
                const response = await fetch(`${API_BASE_URL}/api/lead-sources`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    // Handle both possible response formats
                    const sources = data.leadSources || data || [];
                    setLeadSources(sources);
                } else {
                    console.error('Failed to fetch lead sources:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching lead sources:', error);
            } finally {
                setLoadingLeadSources(false);
            }
        };

        fetchLeadSources();
    }, [token]);

    const getLeadsBySource = useMemo(() => {
        if (!leads || !Array.isArray(leads) || leadSources.length === 0) {
            return [];
        }
        
        const sourceCounts: { [key: string]: { id: string; count: number } } = {};
        
        // Initialize all lead sources with 0 count
        leadSources.forEach(source => {
            sourceCounts[source.name] = { id: source._id, count: 0 };
        });
        
        // Count leads for each source
        leads.forEach(lead => {
            // Try to get source name and ID from different possible fields
            let sourceName = '';
            let sourceId = '';
            
            // Check if lead has leadSource object
            if (lead.leadSource?.name) {
                sourceName = lead.leadSource.name;
                sourceId = lead.leadSource._id;
            } 
            // Check if lead has source string that might contain the source name
            else if (lead.source) {
                // Extract source name from the source string
                // Handle cases like "Channel Partner: ABC" or just "Website"
                const sourceStr = lead.source;
                
                // Try to match with any of the lead sources
                const matchedSource = leadSources.find(src => 
                    sourceStr.toLowerCase().includes(src.name.toLowerCase())
                );
                
                if (matchedSource) {
                    sourceName = matchedSource.name;
                    sourceId = matchedSource._id;
                } else {
                    sourceName = sourceStr;
                    sourceId = ''; // No ID for unmatched sources
                }
            }
            
            if (sourceName) {
                // If the source name exists in our counts, increment it
                if (sourceName in sourceCounts) {
                    sourceCounts[sourceName].count += 1;
                } else {
                    // If it's a new source not in the API list, add it
                    sourceCounts[sourceName] = { id: sourceId, count: 1 };
                }
            } else {
                // Handle leads without a source
                if ('Unknown' in sourceCounts) {
                    sourceCounts['Unknown'].count += 1;
                } else {
                    sourceCounts['Unknown'] = { id: '', count: 1 };
                }
            }
        });
        
        // Convert to array and filter out sources with 0 count
        return Object.entries(sourceCounts)
            .filter(([_, data]) => data.count > 0)
            .map(([name, data]) => ({ name, id: data.id, count: data.count }))
            .sort((a, b) => b.count - a.count); // Sort by count descending
    }, [leads, leadSources]);

    const getLeadsByUser = useMemo(() => {
        if (!leads || !Array.isArray(leads)) {
            return [];
        }
        const userCounts: { [key: string]: { id: string; count: number } } = {};
        leads.forEach(lead => {
            const userName = lead.user?.name || 'Unassigned';
            const userId = lead.user?._id || 'unassigned';
            
            if (!userCounts[userName]) {
                userCounts[userName] = { id: userId, count: 0 };
            }
            userCounts[userName].count += 1;
        });
        return Object.entries(userCounts)
            .map(([name, data]) => ({ name, id: data.id, count: data.count }))
            .sort((a, b) => b.count - a.count);
    }, [leads]);

    // Handle source click to navigate to all-leads page with filter
    const navigateToLeads = (params: Record<string, string>) => {
        const query = new URLSearchParams(params);
        router.push(`/apps/leads?${query.toString()}`);
    };

    const handleSourceClick = (sourceId: string, sourceName: string) => {
        const params: Record<string, string> = {
            fromDashboard: 'crm',
            filterMode: 'current',
        };

        if (sourceId && sourceId !== '') {
            params.source = sourceId;
        }
        if (sourceName) {
            params.sourceName = sourceName;
        }

        navigateToLeads(params);
    };

    // Handle user click to navigate to all-leads page with user filter
    const handleUserClick = (userId: string, userName: string) => {
        const params: Record<string, string> = {
            fromDashboard: 'crm',
            filterMode: 'current',
        };

        if (userId && userId !== '') {
            params.userId = userId;
        }
        if (userName) {
            params.userName = userName;
        }

        navigateToLeads(params);
    };

    return (
        <Card className="p-6 rounded-2xl shadow-md bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 transition hover:shadow-lg w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className={`w-2 h-6 rounded-full transition-colors ${activeChart === 'source' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        {activeChart === 'source' ? 'Leads by Source Category' : 'Leads by User'}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 ml-5">
                        <Icon icon="solar:hand-stars-line-duotone" className="text-base" />
                        {activeChart === 'source' ? 'Click on chart or legend to filter leads' : 'Click on a bar to filter leads'}
                    </span>
                </div>
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Button
                        color={activeChart === 'source' ? 'primary' : 'gray'}
                        size="sm"
                        onClick={() => setActiveChart('source')}
                        className="transition-all"
                    >
                        <Icon icon="solar:pie-chart-2-line-duotone" className="mr-2" />
                        By Source
                    </Button>
                    <Button
                        color={activeChart === 'user' ? 'primary' : 'gray'}
                        size="sm"
                        onClick={() => setActiveChart('user')}
                        className="transition-all"
                    >
                        <Icon icon="solar:user-speak-rounded-line-duotone" className="mr-2" />
                        By User
                    </Button>
                </div>
            </div>
            
            {activeChart === 'source' && (
                <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                        <Icon icon="solar:info-circle-line-duotone" className="text-base flex-shrink-0" />
                        <span><strong>Interactive Chart:</strong> Click any segment to view all leads from that source on the leads page.</span>
                    </p>
                </div>
            )}
            
            {activeChart === 'user' && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        <Icon icon="solar:info-circle-line-duotone" className="text-base flex-shrink-0" />
                        <span><strong>Interactive Chart:</strong> Click any bar to view all leads assigned to that user on the leads page.</span>
                    </p>
                </div>
            )}

            <div style={{ minHeight: '610px' }}>
                {activeChart === 'source' && (
                    <>
                        {loadingLeadSources ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-center">
                                    <Icon icon="solar:loading-line-duotone" className="text-4xl animate-spin mx-auto mb-4 text-blue-600" />
                                    <p className="text-gray-600 dark:text-gray-400">Loading lead sources...</p>
                                </div>
                            </div>
                        ) : getLeadsBySource.length === 0 ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-center">
                                    <Icon icon="solar:chart-line-duotone" className="text-4xl mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-600 dark:text-gray-400">No lead source data available</p>
                                </div>
                            </div>
                        ) : (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-10 w-full">
                        {/* Donut Chart */}
                        <div className="flex-[1.5] flex justify-center items-center">
                            <div style={{ width: '600px', height: '600px', maxWidth: '100%' }}>
                                <Chart
                                    options={{
                                        chart: {
                                            type: 'donut',
                                            toolbar: { show: false },
                                            animations: { enabled: true },
                                            events: {
                                                dataPointSelection: (event: any, chartContext: any, config: any) => {
                                                    const clickedIndex = config.dataPointIndex;
                                                    if (clickedIndex === undefined || clickedIndex === -1) {
                                                        return;
                                                    }
                                                    
                                                    const clickedSource = getLeadsBySource[clickedIndex];
                                                    if (clickedSource) {
                                                        handleSourceClick(clickedSource.id, clickedSource.name);
                                                    }
                                                },
                                            },
                                        },
                                        states: {
                                            normal: {
                                                filter: {
                                                    type: 'none',
                                                }
                                            },
                                            hover: {
                                                filter: {
                                                    type: 'lighten',
                                                    value: 0.15,
                                                }
                                            },
                                            active: {
                                                allowMultipleDataPointsSelection: false,
                                                filter: {
                                                    type: 'darken',
                                                    value: 0.35,
                                                }
                                            },
                                        },
                                        labels: getLeadsBySource.map((s) => s.name),
                                        colors: getLeadsBySource.map((s, index) => {
                                            // Generate dynamic colors for each source
                                            const colors = [
                                                '#8B5CF6', // Purple
                                                '#10B981', // Green
                                                '#3B82F6', // Blue
                                                '#F59E0B', // Orange
                                                '#14B8A6', // Teal
                                                '#EF4444', // Red
                                                '#EC4899', // Pink
                                                '#6366F1', // Indigo
                                                '#F97316', // Orange-red
                                                '#06B6D4', // Cyan
                                                '#8B5A00', // Brown
                                                '#6B7280', // Gray
                                                '#84CC16', // Lime
                                                '#A855F7', // Purple-light
                                                '#0EA5E9', // Sky blue
                                                '#F43F5E', // Rose
                                                '#22C55E', // Green-light
                                                '#FACC15', // Yellow
                                                '#9333EA', // Violet
                                                '#FB923C', // Orange-light
                                            ];
                                            return colors[index % colors.length];
                                        }),
                                        legend: { show: false },
                                        dataLabels: {
                                            enabled: true,
                                            style: {
                                                colors: ['#fff'],
                                                fontSize: '18px',
                                                fontWeight: 600,
                                            },
                                            dropShadow: { enabled: true, top: 1, left: 1, blur: 3, opacity: 0.6 },
                                            formatter: function (val, opts) {
                                                const count = opts.w.globals.series[opts.seriesIndex];
                                                return `${count}`;
                                            },
                                        },
                                        plotOptions: {
                                            pie: {
                                                expandOnClick: false,
                                                donut: {
                                                    size: '70%',
                                                    labels: {
                                                        show: true,
                                                        total: {
                                                            show: true,
                                                            label: 'Total Leads',
                                                            fontSize: '22px',
                                                            fontWeight: 700,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        tooltip: {
                                            theme: 'dark',
                                            y: { formatter: (val) => `${val}` },
                                        },
                                        responsive: [
                                            {
                                                breakpoint: 1024,
                                                options: { chart: { height: 500 } },
                                            },
                                            {
                                                breakpoint: 768,
                                                options: { chart: { height: 400 } },
                                            },
                                        ],
                                    }}
                                    series={getLeadsBySource.map((s) => s.count)}
                                    type="donut"
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        </div>

                        {/* Scrollable Legend */}
                        <div
                            className="flex-[0.8] flex flex-col justify-start gap-4 w-full lg:w-1/3 overflow-y-auto pr-3"
                            style={{ maxHeight: '600px' }}
                        >
                            {getLeadsBySource.map((s, i) => {
                                // Generate dynamic colors (same as chart colors)
                                const getDynamicColor = (index: number) => {
                                    const colors = [
                                        '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#14B8A6',
                                        '#EF4444', '#EC4899', '#6366F1', '#F97316', '#06B6D4',
                                        '#8B5A00', '#6B7280', '#84CC16', '#A855F7', '#0EA5E9',
                                        '#F43F5E', '#22C55E', '#FACC15', '#9333EA', '#FB923C',
                                    ];
                                    return colors[index % colors.length];
                                };
                                
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleSourceClick(s.id, s.name)}
                                        className="flex items-center justify-between text-gray-700 dark:text-gray-200 text-lg font-medium border-b border-gray-200 dark:border-gray-700 pb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                                        title={`Click to view ${s.name} leads`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="w-5 h-5 rounded-full shadow-sm"
                                                style={{
                                                    backgroundColor: getDynamicColor(i),
                                                }}
                                            ></span>
                                            <span className="font-semibold">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xl">{s.count}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                ({((s.count / leads.length) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                        )}
                    </>
                )}

                {activeChart === 'user' && (
                    <Chart
                        options={{
                            chart: { 
                                type: 'bar', 
                                toolbar: { show: false },
                                events: {
                                    mounted: (chartContext: any) => {
                                        // Add click listeners to all bars after mount
                                        setTimeout(() => {
                                            const bars = document.querySelectorAll('.apexcharts-bar-area');
                                            
                                            bars.forEach((bar, index) => {
                                                bar.setAttribute('style', 'cursor: pointer !important;');
                                                
                                                bar.addEventListener('click', (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    
                                                    const user = getLeadsByUser[index];
                                                    if (user) {
                                                        handleUserClick(user.id, user.name);
                                                    }
                                                });
                                            });
                                        }, 500);
                                    },
                                    dataPointSelection: (event: any, chartContext: any, config: any) => {
                                        const clickedIndex = config.dataPointIndex;
                                        if (clickedIndex === undefined || clickedIndex === -1) {
                                            return;
                                        }
                                        
                                        const clickedUser = getLeadsByUser[clickedIndex];
                                        if (clickedUser) {
                                            handleUserClick(clickedUser.id, clickedUser.name);
                                        }
                                    },
                                    click: (event: any, chartContext: any, config: any) => {
                                        if (config && config.dataPointIndex !== undefined && config.dataPointIndex >= 0) {
                                            const clickedIndex = config.dataPointIndex;
                                            const clickedUser = getLeadsByUser[clickedIndex];
                                            
                                            if (clickedUser) {
                                                handleUserClick(clickedUser.id, clickedUser.name);
                                            }
                                        }
                                    },
                                },
                            },
                            states: {
                                normal: {
                                    filter: {
                                        type: 'none',
                                    }
                                },
                                hover: {
                                    filter: {
                                        type: 'lighten',
                                        value: 0.15,
                                    }
                                },
                                active: {
                                    allowMultipleDataPointsSelection: false,
                                    filter: {
                                        type: 'darken',
                                        value: 0.35,
                                    }
                                },
                            },
                            plotOptions: {
                                bar: {
                                    borderRadius: 8,
                                    horizontal: true,
                                    distributed: true,
                                    barHeight: '70%',
                                },
                            },
                            dataLabels: { enabled: false },
                            xaxis: {
                                categories: getLeadsByUser.map((u) => u.name),
                                title: {
                                    text: 'Number of Leads',
                                    style: { color: '#9CA3AF', fontSize: '13px' },
                                },
                            },
                            yaxis: {
                                title: {
                                    text: 'Users',
                                    style: { color: '#9CA3AF', fontSize: '13px' },
                                },
                                labels: { 
                                    style: { 
                                        fontSize: '14px', 
                                        fontWeight: 500,
                                        cssClass: 'cursor-pointer' 
                                    } 
                                },
                            },
                            tooltip: {
                                enabled: true,
                                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                                    const userName = w.globals.labels[dataPointIndex];
                                    const count = series[seriesIndex][dataPointIndex];
                                    return `<div class="px-3 py-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div class="font-semibold text-gray-900 dark:text-white">${userName}</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">${count} leads</div>
                                        <div class="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">👆 Click to view leads</div>
                                    </div>`;
                                }
                            },
                            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'],
                            grid: {
                                borderColor: 'rgba(156,163,175,0.2)',
                                strokeDashArray: 4,
                            },
                        }}
                        series={[{ name: 'Leads', data: getLeadsByUser.map((u) => u.count) }]}
                        type="bar"
                        width="100%"
                        height="600px"
                    />
                )}
            </div>
        </Card>
    );
};

export default LeadAnalyticsChart;