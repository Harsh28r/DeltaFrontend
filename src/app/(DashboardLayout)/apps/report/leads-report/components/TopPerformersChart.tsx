"use client";
import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import ApexChartWrapper from './ApexChartWrapper';
import { getColorsForCount, getToolbarConfig } from '@/utils/chartUtils';

interface UserPerformance {
  userName: string;
  totalLeads: number;
}

interface Props {
  data: UserPerformance[];
  topCount?: number;
}

const TopPerformersChart: React.FC<Props> = ({ data, topCount = 10 }) => {
  // Memoize top performers calculation
  const topPerformers = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    return [...data].sort((a, b) => b.totalLeads - a.totalLeads).slice(0, topCount);
  }, [data, topCount]);

  // Memoize chart data
  const chartData = useMemo(() => {
    if (topPerformers.length === 0) {
      return { categories: [], values: [] };
    }

    return {
      categories: topPerformers.map(u => String(u.userName || '')),
      values: topPerformers.map(u => Number(u.totalLeads || 0))
    };
  }, [topPerformers]);

  // Memoize dynamic colors - different color for each user
  const dynamicColors = useMemo(() => {
    return getColorsForCount(topPerformers.length);
  }, [topPerformers.length]);

  // Memoize chart options with zoom and dynamic colors
  const chartOptions = useMemo(() => ({
    chart: { 
      id: 'top-performers', 
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
        horizontal: true, 
        borderRadius: 4, 
        dataLabels: { position: 'top' },
        distributed: true // This enables different colors for each bar
      } 
    },
    dataLabels: { 
      enabled: true, 
      offsetX: 30, 
      style: { fontSize: '12px', colors: ['#fff'] } 
    },
    xaxis: { 
      categories: chartData.categories,
      title: { text: 'Total Leads' }
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px' }
      }
    },
    colors: dynamicColors,
    legend: { show: false }, // Hide legend since each bar has different color
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " leads";
        }
      }
    }
  }), [chartData.categories, dynamicColors]);

  // Memoize series data
  const series = useMemo(() => [
    { name: 'Total Leads', data: chartData.values }
  ], [chartData.values]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Icon icon="solar:cup-star-line-duotone" className="text-2xl text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top {topCount} Performers (By Total Leads)
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
        <Icon icon="solar:cup-star-line-duotone" className="text-2xl text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top {topCount} Performers (By Total Leads)
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

export default React.memo(TopPerformersChart);

