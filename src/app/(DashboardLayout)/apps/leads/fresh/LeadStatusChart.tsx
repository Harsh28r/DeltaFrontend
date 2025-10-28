"use client";

import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic'; 
import { useRouter } from 'next/navigation';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Lead {
    _id: string;
    currentStatus?: {
        _id: string;
        name: string;
    } | null;
    [key: string]: any;
}

interface LeadStatusChartProps {
    leads: Lead[];
}

const LeadStatusChart: React.FC<LeadStatusChartProps> = ({ leads }) => {
    const router = useRouter();

    const getLeadByStatus = useMemo(() => {
        if (!leads || !Array.isArray(leads)) {
            return { statuses: [], statusIds: [], counts: [] };
        }
        
        const statusMap: { [key: string]: { name: string; id: string; count: number } } = {};
        
        leads.forEach(lead => {
            const statusId = lead.currentStatus?._id || 'N/A';
            const statusName = lead.currentStatus?.name || 'N/A';
            
            if (!statusMap[statusName]) {
                statusMap[statusName] = { name: statusName, id: statusId, count: 0 };
            }
            statusMap[statusName].count++;
        });
        
        const sorted = Object.values(statusMap).sort((a, b) => b.count - a.count);
        
        return {
            statuses: sorted.map(s => s.name),
            statusIds: sorted.map(s => s.id),
            counts: sorted.map(s => s.count)
        };
    }, [leads]);

    // Handle bar click manually
    const handleBarClick = (statusId: string, statusName: string) => {
        if (statusId && statusId !== 'N/A') {
            const targetUrl = `/apps/leads?status=${encodeURIComponent(statusId)}`;
            router.push(targetUrl);
        }
    };

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            height: 550,
            toolbar: { 
                show: false 
            },
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
                                
                                const statusId = getLeadByStatus.statusIds[index];
                                const statusName = getLeadByStatus.statuses[index];
                                
                                handleBarClick(statusId, statusName);
                            });
                        });
                    }, 500);
                },
                dataPointSelection: (event: any, chartContext: any, config: any) => {
                    const clickedIndex = config.dataPointIndex;
                    if (clickedIndex === undefined || clickedIndex === -1) {
                        return;
                    }
                    
                    const clickedStatusId = getLeadByStatus.statusIds[clickedIndex];
                    const clickedStatusName = getLeadByStatus.statuses[clickedIndex];
                    
                    handleBarClick(clickedStatusId, clickedStatusName);
                },
                click: (event: any, chartContext: any, config: any) => {
                    if (config && config.dataPointIndex !== undefined && config.dataPointIndex >= 0) {
                        const clickedIndex = config.dataPointIndex;
                        const clickedStatusId = getLeadByStatus.statusIds[clickedIndex];
                        const clickedStatusName = getLeadByStatus.statuses[clickedIndex];
                        
                        handleBarClick(clickedStatusId, clickedStatusName);
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
                borderRadius: 6,
                distributed: true,
                columnWidth: '50%',
                dataLabels: {
                    position: 'top',
                },
            },
        },
        dataLabels: {
            enabled: true,
            offsetY: -25,
            style: {
                fontSize: '14px',
                fontWeight: 'bold',
                colors: ["#000"],
            },
            background: {
                enabled: true,
                foreColor: '#fff',
                padding: 6,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#D1D5DB',
            }
        },
        xaxis: {
            categories: getLeadByStatus.statuses,
            labels: {
                rotate: -45,
                style: {
                    fontSize: '12px',
                    cssClass: 'cursor-pointer'
                }
            },
        },
        yaxis: {
            title: { text: 'Number of Leads' },
        },
        colors: ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#14B8A6', '#EC4899', '#6366F1'],
        legend: { show: false },
        grid: { show: false },
        tooltip: {
            enabled: true,
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const statusName = w.globals.labels[dataPointIndex];
                const count = series[seriesIndex][dataPointIndex];
                return `<div class="px-3 py-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="font-semibold text-gray-900 dark:text-white">${statusName}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">${count} leads</div>
                    <div class="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">👆 Click to view leads</div>
                </div>`;
            }
        },
    };

    const series = [
        {
            name: 'Number of Leads',
            data: getLeadByStatus.counts,
        },
    ];
    
    return (
        <Card className="p-6 rounded-2xl shadow-md bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 transition hover:shadow-lg w-full">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-3">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                    <span className="w-2 h-6 rounded-full bg-purple-500"></span>
                    Leads by Status
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Icon icon="solar:hand-stars-line-duotone" className="text-base" />
                        Click on a bar to filter leads
                    </span>
                </div>
            </div>
            
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Icon icon="solar:info-circle-line-duotone" className="text-base flex-shrink-0" />
                    <span><strong>Interactive Chart:</strong> Click any bar to view all leads with that status on the leads page.</span>
                </p>
            </div>

            {/* Manual clickable bars as backup */}
            <div className="relative">
                <Chart
                    options={options}
                    series={series}
                    type="bar"
                    height={550}
                />
                
                {/* Invisible overlay with clickable areas - BACKUP SOLUTION */}
                <div className="absolute inset-0 pointer-events-none">
                    {getLeadByStatus.statuses.map((status, index) => (
                        <div
                            key={index}
                            className="absolute pointer-events-auto cursor-pointer"
                            style={{
                                left: `${(index / getLeadByStatus.statuses.length) * 100}%`,
                                width: `${100 / getLeadByStatus.statuses.length}%`,
                                bottom: '50px',
                                top: '0px',
                            }}
                            onClick={() => {
                                handleBarClick(getLeadByStatus.statusIds[index], status);
                            }}
                            title={`Click to view ${status} leads`}
                        />
                    ))}
                </div>
            </div>

            {/* Quick status buttons as alternative */}
            <div className="mt-4 flex flex-wrap gap-2">
                {getLeadByStatus.statuses.map((status, index) => (
                    <button
                        key={index}
                        onClick={() => handleBarClick(getLeadByStatus.statusIds[index], status)}
                        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    >
                        <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: options.colors![index % options.colors!.length] }}
                        />
                        {status}
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                            {getLeadByStatus.counts[index]}
                        </span>
                    </button>
                ))}
            </div>
        </Card>
    );
};

export default LeadStatusChart;