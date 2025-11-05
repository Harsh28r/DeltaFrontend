"use client";
import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import ApexChartWrapper from './ApexChartWrapper';
import { getToolbarConfig } from '@/utils/chartUtils';

interface UserPerformance {
  userId: string;
  userName: string;
  totalLeads: number;
  freshLead: number;
}

interface Props {
  data: UserPerformance[];
}

const UserPerformanceChart: React.FC<Props> = ({ data }) => {
  const router = useRouter();

  // Memoize chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { categories: [], totalLeads: [], freshLeads: [], userIds: [] };
    }

    return {
      categories: data.map(u => String(u.userName || '')),
      totalLeads: data.map(u => Number(u.totalLeads || 0)),
      freshLeads: data.map(u => Number(u.freshLead || 0)),
      userIds: data.map(u => u.userId || '')
    };
  }, [data]);

  // Handle user click to navigate to report page with filter
  const handleUserClick = (userId: string, userName: string) => {
    if (userId && userId !== '') {
      const targetUrl = `/apps/report/leads-report?userId=${encodeURIComponent(userId)}`;
      router.push(targetUrl);
    }
  };

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
                
                const user = chartData.userIds[index];
                const userName = chartData.categories[index];
                if (user) {
                  handleUserClick(user, userName);
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
          
          const clickedUserId = chartData.userIds[clickedIndex];
          const clickedUserName = chartData.categories[clickedIndex];
          
          if (clickedUserId) {
            handleUserClick(clickedUserId, clickedUserName);
          }
        },
        click: (event: any, chartContext: any, config: any) => {
          if (config && config.dataPointIndex !== undefined && config.dataPointIndex >= 0) {
            const clickedIndex = config.dataPointIndex;
            const clickedUserId = chartData.userIds[clickedIndex];
            const clickedUserName = chartData.categories[clickedIndex];
            
            if (clickedUserId) {
              handleUserClick(clickedUserId, clickedUserName);
            }
          }
        },
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
  }), [chartData.categories, chartData.userIds, chartData, handleUserClick]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Icon icon="solar:users-group-rounded-line-duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Performance - Total vs Fresh Leads
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Icon icon="solar:hand-stars-line-duotone" className="text-base" />
          Click on a bar to view user
        </span>
      </div>
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
          <Icon icon="solar:info-circle-line-duotone" className="text-base flex-shrink-0" />
          <span><strong>Interactive Chart:</strong> Click any bar to view that user's leads on the report page.</span>
        </p>
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

