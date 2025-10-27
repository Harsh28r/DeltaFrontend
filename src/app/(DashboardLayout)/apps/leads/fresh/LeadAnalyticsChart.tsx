"use client";

import React, { useState, useMemo } from 'react';
import { Button, Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Lead {
    _id: string;
    user?: {
        _id: string;
        name: string;
    } | null;
    source?: string;
    [key: string]: any;
}

interface LeadAnalyticsChartProps {
    leads: Lead[];
}

const LeadAnalyticsChart: React.FC<LeadAnalyticsChartProps> = ({ leads }) => {
    const [activeChart, setActiveChart] = useState<'source' | 'user'>('source');

    const getLeadsBySource = useMemo(() => {
        if (!leads || !Array.isArray(leads)) {
            return [];
        }
        const sourceCounts: { [key: string]: number } = {};
        leads.forEach(lead => {
            const sourceName = lead.source || 'N/A';
            sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
        });
        return Object.entries(sourceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [leads]);

    const getLeadsByUser = useMemo(() => {
        if (!leads || !Array.isArray(leads)) {
            return [];
        }
        const userCounts: { [key: string]: number } = {};
        leads.forEach(lead => {
            const userName = lead.user?.name || 'Unassigned';
            userCounts[userName] = (userCounts[userName] || 0) + 1;
        });
        return Object.entries(userCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [leads]);

    return (
        <Card className="p-6 rounded-2xl shadow-md bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 transition hover:shadow-lg w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                    <span className={`w-2 h-6 rounded-full transition-colors ${activeChart === 'source' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                    {activeChart === 'source' ? 'Leads by Source' : 'Leads by User'}
                </h3>
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

            <div style={{ minHeight: '610px' }}>
                {activeChart === 'source' && (
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
                                        },
                                        labels: getLeadsBySource.map((s) => s.name),
                                        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'],
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
                                            y: { formatter: (val) => `${val} leads` },
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
                            {getLeadsBySource.map((s, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-gray-700 dark:text-gray-200 text-lg font-medium border-b border-gray-200 dark:border-gray-700 pb-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-5 h-5 rounded-full"
                                            style={{
                                                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'][i % 6],
                                            }}
                                        ></span>
                                        {s.name}
                                    </div>
                                    <span className="font-semibold">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeChart === 'user' && (
                    <Chart
                        options={{
                            chart: { type: 'bar', toolbar: { show: false } },
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
                                labels: { style: { fontSize: '14px', fontWeight: 500 } },
                            },
                            tooltip: {
                                y: { formatter: (val) => `${val} leads` },
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