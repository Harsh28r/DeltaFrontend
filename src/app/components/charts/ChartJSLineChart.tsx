"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Tick
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartJSLineChart = ({ options, data }: { options: any; data: any }) => {
  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px]">
      <Line options={options} data={data} />
    </div>
  );
};

export default ChartJSLineChart;
