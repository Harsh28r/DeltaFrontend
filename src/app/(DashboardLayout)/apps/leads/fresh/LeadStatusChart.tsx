"use client";

import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';

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
    const getLeadByStatus = useMemo(() => {
        if (!leads || !Array.isArray(leads)) {
            return [];
        }
        const statusCounts: { [key: string]: number } = {};
        leads.forEach(lead => {
            const statusName = lead.currentStatus?.name || 'N/A';
            statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
        });
        return Object.entries(statusCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [leads]);

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            height: 550,
            toolbar: { show: false },
            animations: { enabled: true },
        },
        plotOptions: {
            bar: {
                distributed: true,
                borderRadius: 8,
                columnWidth: '60%',
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
                colors: ["black"],
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
            categories: getLeadByStatus.map((s) => s.name),
            position: 'bottom',
        },
        yaxis: {
            title: { text: "Number of Leads" }
        },
        colors: ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#14B8A6', '#EC4899', '#6366F1'],
        legend: { show: false },
        grid: { show: false },
    };

    return (
        <Card className="p-6 rounded-2xl shadow-md bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 transition hover:shadow-lg w-full">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
                <span className="w-2 h-6 rounded-full bg-purple-500"></span>
                Leads by Status
            </h3>
            <Chart
                options={chartOptions}
                series={[{ name: 'Leads', data: getLeadByStatus.map((s) => s.count) }]}
                type="bar"
                width="100%"
                height="550px"
            />
        </Card>
    );
};

export default LeadStatusChart;