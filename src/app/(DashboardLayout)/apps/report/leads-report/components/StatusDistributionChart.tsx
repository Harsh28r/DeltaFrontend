"use client";
import React, { useMemo, useCallback } from 'react';
import { Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import ApexChartWrapper from './ApexChartWrapper';
import { getColorsForCount } from '@/utils/chartUtils';

interface StatusDistributionChartProps {
  data: Array<{
    statusName: string;
    count: number;
  }>;
  availableStatuses?: Array<{
    _id: string;
    name: string;
    isFinalStatus: boolean;
    isDefaultStatus: boolean;
  }>;
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data, availableStatuses }) => {
  const router = useRouter();

  // Create a map of status names to IDs
  const statusNameToId = useMemo(() => {
    if (!availableStatuses) return {};
    const map: { [key: string]: string } = {};
    availableStatuses.forEach(status => {
      map[status.name] = status._id;
    });
    return map;
  }, [availableStatuses]);

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { series: [], labels: [], statusIds: [] };
    }

    return {
      series: data.map(item => item.count),
      labels: data.map(item => item.statusName),
      statusIds: data.map(item => statusNameToId[item.statusName] || '')
    };
  }, [data, statusNameToId]);

  // Handle status click to navigate to report page with filter
  const handleStatusClick = useCallback((statusId: string, statusName: string) => {
    if (statusId && statusId !== '') {
      const targetUrl = `/apps/report/leads-report?statusId=${encodeURIComponent(statusId)}`;
      router.push(targetUrl);
    }
  }, [router]);

  // Memoize dynamic colors based on number of statuses
  const dynamicColors = useMemo(() => {
    return getColorsForCount(chartData.labels.length);
  }, [chartData.labels.length]);

  // Memoize chart options
  const chartOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const clickedIndex = config.dataPointIndex;
          if (clickedIndex === undefined || clickedIndex === -1) {
            return;
          }
          
          const clickedStatusId = chartData.statusIds[clickedIndex];
          const clickedStatusName = chartData.labels[clickedIndex];
          
          if (clickedStatusId) {
            handleStatusClick(clickedStatusId, clickedStatusName);
          }
        },
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
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
    labels: chartData.labels,
    colors: dynamicColors,
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    legend: {
      position: 'right',
      offsetY: 0,
      height: 230,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Leads',
              fontSize: '16px',
              fontWeight: 600,
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%";
      }
    }
  }), [chartData.labels, chartData.statusIds, dynamicColors, handleStatusClick]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Icon icon="solar:chart-2-line-duotone" className="text-2xl text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Status Distribution
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
          <Icon icon="solar:chart-2-line-duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Status Distribution
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Icon icon="solar:hand-stars-line-duotone" className="text-base" />
          Click on chart to filter users
        </span>
      </div>
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
          <Icon icon="solar:info-circle-line-duotone" className="text-base flex-shrink-0" />
          <span><strong>Interactive Chart:</strong> Click any segment to view users with leads in that status on the report page.</span>
        </p>
      </div>
      <ApexChartWrapper
        options={chartOptions}
        series={chartData.series}
        type="donut"
        height={400}
      />
    </Card>
  );
};

export default React.memo(StatusDistributionChart);

