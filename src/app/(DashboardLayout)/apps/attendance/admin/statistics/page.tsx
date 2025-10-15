'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  TextInput,
  Label,
  Spinner,
  Alert,
  Select,
  Progress,
} from 'flowbite-react';
import {
  IconCalendar,
  IconUsers,
  IconClock,
  IconMapPin,
  IconFileDownload,
  IconChartBar,
} from '@tabler/icons-react';
import { getAttendanceStats } from '@/app/api/attendance/attendanceService';
import { API_BASE_URL } from '@/lib/config';
import type { AttendanceStats } from '@/app/(DashboardLayout)/types/attendance';
import { formatHours, formatDuration, formatDateForAPI } from '@/utils/attendanceUtils';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
}

const StatisticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [error, setError] = useState('');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(formatDateForAPI(thirtyDaysAgo));
    setEndDate(formatDateForAPI(today));
  }, []);

  // Fetch users
  const fetchUsers = async (): Promise<void> => {
    try {
      setUsersLoading(true);
      
      // Try to get token from multiple possible storage locations
      const token = localStorage.getItem('auth_token') || 
                    sessionStorage.getItem('auth_token') || 
                    localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/permissions/all-users`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('Users API response:', data);
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };



  //fech all users 
  

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAttendanceStats({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        userId: selectedUserId || undefined,
      });
      setStats(response.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchStats();
    }
  }, [startDate, endDate, selectedUserId]);

  // Handle filter apply
  const handleApplyFilters = () => {
    fetchStats();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(formatDateForAPI(thirtyDaysAgo));
    setEndDate(formatDateForAPI(today));
    setSelectedUserId('');
    fetchStats();
  };

  // Handle quick date ranges
  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    
    setStartDate(formatDateForAPI(pastDate));
    setEndDate(formatDateForAPI(today));
  };

  // Calculate percentage
  const getPercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/apps/attendance/admin/dashboard">
            <Button color="light" size="sm" className="mb-2">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Statistics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive attendance analytics and insights
          </p>
        </div>
        <Button color="light">
          <IconFileDownload className="mr-2" size={16} />
          Export Report
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters Card */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <IconChartBar className="mr-2" size={20} />
          Report Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <TextInput
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              icon={() => <IconCalendar size={20} />}
            />
          </div>

          {/* End Date */}
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <TextInput
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              icon={() => <IconCalendar size={20} />}
            />
          </div>

          {/* User Filter */}
          <div>
            <Label htmlFor="userId">Filter by User (Optional)</Label>
            <Select
              id="userId"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={usersLoading}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <Button onClick={handleApplyFilters} className="w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Apply Filters'}
            </Button>
          </div>
        </div>

        {/* Quick Date Ranges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="xs" color="light" onClick={() => setQuickDateRange(7)}>
            Last 7 Days
          </Button>
          <Button size="xs" color="light" onClick={() => setQuickDateRange(30)}>
            Last 30 Days
          </Button>
          <Button size="xs" color="light" onClick={() => setQuickDateRange(90)}>
            Last 90 Days
          </Button>
          <Button size="xs" color="light" onClick={handleResetFilters}>
            Reset
          </Button>
        </div>
      </Card>

      {/* Statistics */}
      {loading && !stats ? (
        <div className="flex justify-center py-12">
          <Spinner size="xl" />
        </div>
      ) : stats ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Total Records</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-white">
                    {stats.totalRecords}
                  </p>
                </div>
                <IconUsers size={40} className="text-blue-600 dark:text-blue-300" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-300">Total Hours</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-white">
                    {formatHours(parseFloat(stats.totalHours))}
                  </p>
                </div>
                <IconClock size={40} className="text-green-600 dark:text-green-300" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Avg Hours/Day</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-white">
                    {formatHours(parseFloat(stats.avgHoursPerDay))}
                  </p>
                </div>
                <IconChartBar size={40} className="text-purple-600 dark:text-purple-300" />
              </div>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card>
            <h3 className="text-lg font-semibold mb-6">Attendance Status Breakdown</h3>
            <div className="space-y-6">
              {/* Checked In */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Checked In</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {stats.statusBreakdown.checkedIn} ({getPercentage(stats.statusBreakdown.checkedIn, stats.totalRecords).toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  progress={getPercentage(stats.statusBreakdown.checkedIn, stats.totalRecords)}
                  color="blue"
                  size="lg"
                />
              </div>

              {/* Checked Out */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Checked Out</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {stats.statusBreakdown.checkedOut} ({getPercentage(stats.statusBreakdown.checkedOut, stats.totalRecords).toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  progress={getPercentage(stats.statusBreakdown.checkedOut, stats.totalRecords)}
                  color="green"
                  size="lg"
                />
              </div>

              {/* Absent */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Absent</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {stats.statusBreakdown.absent} ({getPercentage(stats.statusBreakdown.absent, stats.totalRecords).toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  progress={getPercentage(stats.statusBreakdown.absent, stats.totalRecords)}
                  color="red"
                  size="lg"
                />
              </div>

              {/* On Leave */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">On Leave</span>
                  </div>
                  <span className="text-sm font-semibold text-yellow-600">
                    {stats.statusBreakdown.onLeave} ({getPercentage(stats.statusBreakdown.onLeave, stats.totalRecords).toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  progress={getPercentage(stats.statusBreakdown.onLeave, stats.totalRecords)}
                  color="yellow"
                  size="lg"
                />
              </div>
            </div>
          </Card>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Work Locations */}
            <Card className="bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-300 mb-2">
                    Total Work Locations
                  </p>
                  <p className="text-4xl font-bold text-purple-900 dark:text-white">
                    {stats.totalWorkLocations}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-300 mt-2">
                    Avg {(stats.totalWorkLocations / (stats.totalRecords || 1)).toFixed(1)} per attendance
                  </p>
                </div>
                <IconMapPin size={48} className="text-purple-600 dark:text-purple-300" />
              </div>
            </Card>

            {/* Manual Entries */}
            <Card className="bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-300 mb-2">
                    Manual Entries
                  </p>
                  <p className="text-4xl font-bold text-orange-900 dark:text-white">
                    {stats.manualEntries}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-300 mt-2">
                    {getPercentage(stats.manualEntries, stats.totalRecords).toFixed(1)}% of total records
                  </p>
                </div>
                <IconUsers size={48} className="text-orange-600 dark:text-orange-300" />
              </div>
            </Card>
          </div>

          {/* Date Range Info */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="text-center">
              <IconCalendar size={32} className="mx-auto text-indigo-600 dark:text-indigo-300 mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Period</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {new Date(startDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                to{' '}
                {new Date(endDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {selectedUserId && (
                <p className="text-sm text-indigo-600 dark:text-indigo-300 mt-1">
                  Filtered for: {users.find(u => u._id === selectedUserId)?.name}
                </p>
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default StatisticsPage;





