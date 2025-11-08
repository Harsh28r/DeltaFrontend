"use client";
import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import ChartWrapper from './ChartWrapper';
import { getToolbarConfig } from '@/utils/chartUtils';

interface UserPerformance {
  userName: string;
  totalLeads: number;
  freshLead: number;
}

interface Props {
  data: UserPerformance[];
  limit?: number;
}

const FreshVsTotalChart: React.FC<Props> = React.memo(({ data, limit = 15 }) => {
  const limitedData = useMemo(() => data.slice(0, limit), [data, limit]);

  const chartOptions = useMemo(() => {
    const categories = limitedData.map(u => String(u.userName || ''));
    
    // Return options directly - data is already cleaned upstream
    return {
      chart: { 
        id: 'fresh-vs-total', 
        type: 'bar', 
        toolbar: getToolbarConfig(true),
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        }
      },
      plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: categories,
        labels: { rotate: -45, style: { fontSize: '11px' } }
      },
      yaxis: { title: { text: 'Number of Leads' } },
      colors: ['#3B82F6', '#10B981'],
      legend: { position: 'top' }
    };
  }, [limitedData]);

  const series = useMemo(() => {
    const totalLeadsData = limitedData.map(u => Number(u.totalLeads || 0));
    const freshLeadsData = limitedData.map(u => Number(u.freshLead || 0));
    return [
      { name: 'Total Leads', data: totalLeadsData },
      { name: 'Fresh Leads', data: freshLeadsData }
    ];
  }, [limitedData]);

  return (
    <Card className="max-w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Fresh vs Total Leads (Top {limit} Users)
      </h3>
      <ChartWrapper chartId="FreshVsTotal" options={chartOptions} series={series} type="bar" height={400} />
    </Card>
  );
});

FreshVsTotalChart.displayName = 'FreshVsTotalChart';

export default FreshVsTotalChart;

