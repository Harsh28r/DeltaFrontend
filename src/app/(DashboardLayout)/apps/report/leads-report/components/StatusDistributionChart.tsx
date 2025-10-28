"use client";
import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import { Icon } from '@iconify/react';
import ApexChartWrapper from './ApexChartWrapper';
import { getColorsForCount } from '@/utils/chartUtils';

interface StatusDistributionChartProps {
  data: Array<{
    statusName: string;
    count: number;
  }>;
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { series: [], labels: [] };
    }

    return {
      series: data.map(item => item.count),
      labels: data.map(item => item.statusName)
    };
  }, [data]);

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
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " leads";
        }
      }
    }
  }), [chartData.labels, dynamicColors]);

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
      <div className="flex items-center gap-3 mb-4">
        <Icon icon="solar:chart-2-line-duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Status Distribution
        </h3>
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

