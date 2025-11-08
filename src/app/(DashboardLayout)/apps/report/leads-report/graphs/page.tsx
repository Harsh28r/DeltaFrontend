"use client";
import React, { useState, useEffect, Suspense } from "react";
import { Button, Card } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { API_ENDPOINTS } from "@/lib/config";
import { useAuth } from "@/app/context/AuthContext";

// Lazy load chart components
const StatusDistributionChart = dynamic(() => import('../components/StatusDistributionChart'), { ssr: false });
const UserPerformanceChart = dynamic(() => import('../components/UserPerformanceChart'), { ssr: false });
const TopPerformersChart = dynamic(() => import('../components/TopPerformersChart'), { ssr: false });
const StatusLineChart = dynamic(() => import('../components/StatusLineChart'), { ssr: false });
const StatusAreaChart = dynamic(() => import('../components/StatusAreaChart'), { ssr: false });
const RadialPerformanceChart = dynamic(() => import('../components/RadialPerformanceChart'), { ssr: false });
const FreshVsTotalChart = dynamic(() => import('../components/FreshVsTotalChart'), { ssr: false });
const StatusBreakdownChart = dynamic(() => import('../components/StatusBreakdownChart'), { ssr: false });

const ChartLoadingPlaceholder = () => (
  <Card>
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="ml-4 text-gray-500">Loading chart...</p>
    </div>
  </Card>
);

const LeadReportsGraphsPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.LEAD_REPORTS, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setReportData(data.data);
            console.log(data.data,'data.data');
          }
        }
      } catch (error) {
        // console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleBackToData = () => {
    router.push('/apps/report/leads-report');
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  } 

  if (!reportData) {
    return (
      <div className="w-full flex justify-center">
        <div className="w-[90%] space-y-6 mt-8">
          <Card>
            <div className="text-center py-12">
              <Icon icon="solar:graph-line-duotone" className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No data available</p>
              <Button onClick={handleBackToData} color="primary" className="mt-4">
                <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-[90%] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Reports - Visual Analytics</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Interactive charts and visualizations</p>
          </div>
          <Button onClick={handleBackToData} color="gray" size="lg">
            <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
            Back to Data View
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="text-center">
              <Icon icon="solar:chart-line-duotone" className="mx-auto text-3xl text-blue-600 dark:text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {reportData?.reportInfo?.totalLeads || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Leads</div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <div className="text-center">
              <Icon icon="solar:users-group-rounded-line-duotone" className="mx-auto text-3xl text-green-600 dark:text-green-400 mb-2" />
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reportData?.reportInfo?.totalUsers || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Users</div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <div className="text-center">
              <Icon icon="solar:document-text-line-duotone" className="mx-auto text-3xl text-purple-600 dark:text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {reportData?.availableStatuses?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Statuses</div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <div className="text-center">
              <Icon icon="solar:fire-line-duotone" className="mx-auto text-3xl text-orange-600 dark:text-orange-400 mb-2" />
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {(reportData?.userPerformance || []).reduce((sum: number, u: any) => sum + (u.freshLead || 0), 0)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Fresh Leads</div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
            <div className="text-center">
              <Icon icon="solar:chart-2-line-duotone" className="mx-auto text-3xl text-pink-600 dark:text-pink-400 mb-2" />
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {reportData?.reportInfo?.totalUsers > 0 
                  ? Math.round(reportData.reportInfo.totalLeads / reportData.reportInfo.totalUsers)
                  : 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Avg per User</div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="space-y-6">
          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <StatusDistributionChart 
              data={reportData.leadStatusSummary || []} 
              availableStatuses={reportData.availableStatuses || []}
            />
          </Suspense>

          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <UserPerformanceChart data={reportData.userPerformance || []} />
          </Suspense>

          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <TopPerformersChart data={reportData.userPerformance || []} topCount={10} />
          </Suspense>

          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <StatusLineChart data={reportData.leadStatusSummary || []} />
          </Suspense>

          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <FreshVsTotalChart data={reportData.userPerformance || []} limit={15} />
          </Suspense>

          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <StatusBreakdownChart 
              userData={reportData.userPerformance || []} 
              statuses={reportData.availableStatuses || []}
              limit={10}
            />
          </Suspense>

          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <StatusAreaChart data={reportData.leadStatusSummary || []} />
          </Suspense>

          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <RadialPerformanceChart data={reportData.userPerformance || []} topCount={5} />
          </Suspense>
        </div>

        {/* Back Button */}
        <div className="flex justify-center py-8">
          <Button onClick={handleBackToData} color="gray" size="lg">
            <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
            Back to Data View
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadReportsGraphsPage;
