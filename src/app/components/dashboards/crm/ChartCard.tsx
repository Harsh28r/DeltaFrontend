"use client";
import React from "react";
import { Card } from "flowbite-react";
import { Icon } from "@iconify/react";

interface ChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

interface ChartCardProps {
  title: string;
  icon: string;
  data: ChartData[];
  type?: 'bar' | 'pie' | 'line';
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  icon, 
  data, 
  type = 'bar',
  className = "" 
}) => {
  const getMaxValue = () => {
    return Math.max(...data.map(item => item.value));
  };

  const getColor = (index: number, defaultColor?: string) => {
    if (defaultColor) return defaultColor;
    
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
    ];
    
    return colors[index % colors.length];
  };

  const renderBarChart = () => {
    const maxValue = getMaxValue();
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.name}
              </span>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.value}
                </span>
                {item.percentage && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                    ({item.percentage}%)
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: getColor(index, item.color)
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const startAngle = (cumulativePercentage / 100) * 360;
          const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
          cumulativePercentage += percentage;

          return (
            <div key={index} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getColor(index, item.color) }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.value}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLineChart = () => {
    const maxValue = getMaxValue();
    const minValue = Math.min(...data.map(item => item.value));
    const range = maxValue - minValue;

    return (
      <div className="space-y-3">
        <div className="h-32 flex items-end space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${((item.value - minValue) / range) * 100}%`,
                  backgroundColor: getColor(index, item.color),
                  minHeight: '4px'
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div className="font-medium text-gray-900 dark:text-white">{item.value}</div>
              <div className="truncate max-w-16">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <Icon icon={icon} className="text-xl text-gray-600 dark:text-gray-400" />
      </div>
      {renderChart()}
    </Card>
  );
};

export default ChartCard;
