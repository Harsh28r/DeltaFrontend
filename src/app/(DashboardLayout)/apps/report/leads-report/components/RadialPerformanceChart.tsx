"use client";
import { useMemo } from "react";
import { Card } from 'flowbite-react';
import ChartWrapper from './ChartWrapper';

interface UserPerformance {
  userName: string;
  totalLeads: number;
}

interface Props {
  data: UserPerformance[];
  topCount?: number;
}

export default function RadialPerformanceChart({ data, topCount = 5 }: Props) {
  const top5Users = useMemo(() => 
    [...data].sort((a, b) => b.totalLeads - a.totalLeads).slice(0, topCount),
    [data, topCount]
  );
  
  const maxLeads = useMemo(() => Math.max(...top5Users.map(u => u.totalLeads)), [top5Users]);

  const options = useMemo(() => {
    const labels = top5Users.map(u => String(u.userName || ''));
    
    // Return options directly - data is already cleaned upstream
    return {
      chart: { id: 'radial-performance', type: 'radialBar', toolbar: { show: true } },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: 0,
          endAngle: 270,
          hollow: { margin: 5, size: '30%', background: 'transparent' },
          dataLabels: { name: { show: true, fontSize: '14px' }, value: { show: true, fontSize: '16px' } },
          track: { show: true }
        }
      },
      colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'],
      labels: labels,
      legend: {
        show: true,
        floating: true,
        fontSize: '14px',
        position: 'left',
        offsetX: 10,
        offsetY: 15,
        labels: { useSeriesColors: true }
      }
    };
  }, [top5Users]);

  const series = useMemo(() => {
    const cleanData = top5Users.map(u => {
      const percentage = Math.round((Number(u.totalLeads || 0) / maxLeads) * 100);
      return Number(percentage);
    });
    return cleanData;
  }, [top5Users, maxLeads]);

  return (
    <Card className="max-w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top {topCount} Users - Performance Rate
      </h3>
      <ChartWrapper chartId="RadialPerformance" options={options} series={series} type="radialBar" height={400} />
    </Card>
  );
}
