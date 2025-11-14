"use client";
import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import ChartWrapper from './ChartWrapper';
import { getToolbarConfig } from '@/utils/chartUtils';

interface StatusBreakdown {
  lead: number;
  updatedLead: number;
  oldLead: number;
}

interface UserPerformance {
  userName: string;
  statusBreakdown: { [statusName: string]: StatusBreakdown };
}

interface AvailableStatus {
  _id: string;
  name: string;
}

interface Props {
  userData: UserPerformance[];
  statuses: AvailableStatus[];
  limit?: number;
}

const StatusBreakdownChart: React.FC<Props> = React.memo(({ userData, statuses, limit = 10 }) => {
  const limitedUsers = useMemo(() => userData.slice(0, limit), [userData, limit]);
  const firstStatus = useMemo(() => statuses[0], [statuses]);

  const chartOptions = useMemo(() => {
    const categories = limitedUsers.map(u => String(u.userName || ''));
    const yAxisTitle = String(firstStatus?.name || 'Status') + ' - Lead Count';
    
    // Return options directly - data is already cleaned upstream
    return {
      chart: { 
        id: 'status-breakdown', 
        type: 'bar', 
        stacked: true, 
        toolbar: getToolbarConfig(true),
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        }
      },
      plotOptions: { bar: { horizontal: false, borderRadius: 4 } },
      xaxis: {
        categories: categories,
        labels: { rotate: -45, style: { fontSize: '11px' } }
      },
      yaxis: { title: { text: yAxisTitle } },
      colors: ['#10B981', '#3B82F6', '#F59E0B'],
      legend: { position: 'top' }
    };
  }, [limitedUsers, firstStatus]);

  const series = useMemo(() => {
    const statusName = firstStatus?.name || '';
    
    const newLeadsData = limitedUsers.map(u => {
      const breakdown = u.statusBreakdown[statusName];
      return Number(breakdown?.lead || 0);
    });
    
    const updatedLeadsData = limitedUsers.map(u => {
      const breakdown = u.statusBreakdown[statusName];
      return Number(breakdown?.updatedLead || 0);
    });
    
    const oldLeadsData = limitedUsers.map(u => {
      const breakdown = u.statusBreakdown[statusName];
      return Number(breakdown?.oldLead || 0);
    });
    
    return [
      { name: 'New Leads', data: newLeadsData },
      { name: 'Updated Leads', data: updatedLeadsData },
      { name: 'Old Leads', data: oldLeadsData }
    ];
  }, [limitedUsers, firstStatus]);

  if (!firstStatus) return null;

  return (
    <Card className="max-w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Status Breakdown - {firstStatus.name} (Top {limit} Users)
      </h3>
      <ChartWrapper chartId="StatusBreakdown" options={chartOptions} series={series} type="bar" height={400} />
    </Card>
  );
});

StatusBreakdownChart.displayName = 'StatusBreakdownChart';

export default StatusBreakdownChart;

