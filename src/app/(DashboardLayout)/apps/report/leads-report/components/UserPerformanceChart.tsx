"use client";
import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import ApexChartWrapper from './ApexChartWrapper';
import { getToolbarConfig } from '@/utils/chartUtils';

interface UserPerformance {
  userName: string;
  totalLeads: number;
  freshLead: number;
}

interface Props {
  data: UserPerformance[];
}

const UserPerformanceChart: React.FC<Props> = ({ data }) => {
  // Memoize chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { categories: [], totalLeads: [], freshLeads: [] };
    }

    return {
      categories: data.map(u => String(u.userName || '')),
      totalLeads: data.map(u => Number(u.totalLeads || 0)),
      freshLeads: data.map(u => Number(u.freshLead || 0))
    };
  }, [data]);

  // Memoize chart options with zoom enabled
  const chartOptions = useMemo(() => ({
    chart: { 
      id: 'user-performance', 
      type: 'bar', 
      toolbar: getToolbarConfig(true),
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    plotOptions: { 
      bar: { 
        horizontal: false, 
        columnWidth: '55%', 
        borderRadius: 4 
      } 
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData.categories,
      labels: { rotate: -45, style: { fontSize: '12px' } }
    },
    yaxis: { title: { text: 'Number of Leads' } },
    colors: ['#3B82F6', '#10B981'],
    legend: { position: 'top' },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val: number) {
          return val + " leads";
        }
      }
    }
  }), [chartData.categories]);

  // Memoize series data
  const series = useMemo(() => [
    { name: 'Total Leads', data: chartData.totalLeads },
    { name: 'Fresh Leads', data: chartData.freshLeads }
  ], [chartData.totalLeads, chartData.freshLeads]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Icon icon="solar:users-group-rounded-line-duotone" className="text-2xl text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Performance - Total vs Fresh Leads
          </h3>
        </div>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Icon icon="solar:users-group-rounded-line-duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          User Performance - Total vs Fresh Leads
        </h3>
      </div>
      <ApexChartWrapper
        options={chartOptions}
        series={series}
        type="bar"
        height={400}
      />
    </Card>
  );
};

export default React.memo(UserPerformanceChart);

