'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  Table,
  TextInput,
  Label,
  Spinner,
  Alert,
} from 'flowbite-react';
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconCoffee,
  IconLogin,
  IconLogout,
  IconUser,
  IconMail,
  IconPhone,
  IconBriefcase,
} from '@tabler/icons-react';
import { getUserAttendanceDetail } from '@/app/api/attendance/attendanceService';
import type {
  UserAttendanceDetailResponse,
  UserAttendanceStats,
  Attendance,
  Pagination,
} from '@/app/(DashboardLayout)/types/attendance';
import {
  formatHours,
  formatDuration,
  getStatusColor,
  getStatusText,
  formatDateForAPI,
} from '@/utils/attendanceUtils';
import Link from 'next/link';

const UserAttendanceDetailPage = ({ params }: { params: { userId: string } }) => {
  const [loading, setLoading] = useState(true);
  const [userDetail, setUserDetail] = useState<UserAttendanceDetailResponse | null>(null);
  const [error, setError] = useState('');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(formatDateForAPI(thirtyDaysAgo));
    setEndDate(formatDateForAPI(today));
  }, []);

  // Fetch user attendance detail
  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUserAttendanceDetail(params.userId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 30,
      });
      setUserDetail(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user attendance details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchUserDetail();
    }
  }, [currentPage, startDate, endDate]);

  // Handle filter apply
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchUserDetail();
  };

  // Handle quick date ranges
  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    
    setStartDate(formatDateForAPI(pastDate));
    setEndDate(formatDateForAPI(today));
  };

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading && !userDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error && !userDetail) {
    return (
      <div className="p-6">
        <Alert color="failure">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/apps/attendance/admin/dashboard">
            <Button color="light" size="sm" className="mb-2">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attendance Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">View detailed attendance information</p>
        </div>
        <Link href={`/apps/attendance/admin/location-history/${params.userId}`}>
          <Button color="purple">
            <IconMapPin className="mr-2" size={16} />
            View Location History
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {userDetail && (
        <>
          {/* User Info Card */}
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <IconUser size={32} className="text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{userDetail.user.name}</h2>
                  <div className="flex flex-col space-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <IconMail size={16} />
                      <span>{userDetail.user.email}</span>
                    </div>
                    {userDetail.user.mobile && (
                      <div className="flex items-center space-x-2">
                        <IconPhone size={16} />
                        <span>{userDetail.user.mobile}</span>
                      </div>
                    )}
                    {userDetail.user.role && (
                      <div className="flex items-center space-x-2">
                        <IconBriefcase size={16} />
                        <Badge color="blue">{userDetail.user.role}</Badge>
                        {userDetail.user.level && (
                          <Badge color="gray">Level {userDetail.user.level}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <div className="text-center">
                <p className="text-sm text-blue-600 dark:text-blue-300">Total Days</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-white">
                  {userDetail.stats.totalDays}
                </p>
              </div>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20">
              <div className="text-center">
                <p className="text-sm text-green-600 dark:text-green-300">Total Hours</p>
                <p className="text-3xl font-bold text-green-900 dark:text-white">
                  {formatHours(userDetail.stats.totalHours)}
                </p>
              </div>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20">
              <div className="text-center">
                <p className="text-sm text-purple-600 dark:text-purple-300">Avg Hours/Day</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-white">
                  {formatHours(userDetail.stats.avgHoursPerDay)}
                </p>
              </div>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20">
              <div className="text-center">
                <p className="text-sm text-orange-600 dark:text-orange-300">Total Breaks</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-white">
                  {formatDuration(userDetail.stats.totalBreakTime)}
                </p>
              </div>
            </Card>

            <Card className="bg-teal-50 dark:bg-teal-900/20">
              <div className="text-center">
                <p className="text-sm text-teal-600 dark:text-teal-300">Checked In Days</p>
                <p className="text-3xl font-bold text-teal-900 dark:text-white">
                  {userDetail.stats.checkedInDays}
                </p>
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-900/20">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Checked Out Days</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userDetail.stats.checkedOutDays}
                </p>
              </div>
            </Card>

            <Card className="bg-pink-50 dark:bg-pink-900/20">
              <div className="text-center">
                <p className="text-sm text-pink-600 dark:text-pink-300">Work Locations</p>
                <p className="text-3xl font-bold text-pink-900 dark:text-white">
                  {userDetail.stats.workLocationCount}
                </p>
              </div>
            </Card>

            <Card className="bg-indigo-50 dark:bg-indigo-900/20">
              <div className="text-center">
                <p className="text-sm text-indigo-600 dark:text-indigo-300">Attendance Rate</p>
                <p className="text-3xl font-bold text-indigo-900 dark:text-white">
                  {((userDetail.stats.checkedOutDays / userDetail.stats.totalDays) * 100).toFixed(1)}%
                </p>
              </div>
            </Card>
          </div>

          {/* Filters Card */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Date */}
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <TextInput
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  icon={IconCalendar}
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
                  icon={IconCalendar}
                />
              </div>

              {/* Apply Button */}
              <div className="flex items-end">
                <Button onClick={handleApplyFilters} className="w-full">
                  Apply Filters
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
            </div>
          </Card>

          {/* Attendance History Table */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Attendance History</h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="xl" />
              </div>
            ) : userDetail.attendance.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No attendance records found for the selected period
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table hoverable>
                    <Table.Head>
                      <Table.HeadCell>Date</Table.HeadCell>
                      <Table.HeadCell>Check-In</Table.HeadCell>
                      <Table.HeadCell>Check-Out</Table.HeadCell>
                      <Table.HeadCell>Total Hours</Table.HeadCell>
                      <Table.HeadCell>Break Time</Table.HeadCell>
                      <Table.HeadCell>Status</Table.HeadCell>
                      <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                      {userDetail.attendance.map((record) => (
                        <React.Fragment key={record._id}>
                          <Table.Row className="bg-white dark:bg-gray-800">
                            <Table.Cell className="font-medium">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Table.Cell>
                            <Table.Cell>
                              {record.checkInTime || record.checkIn?.time ? (
                                <div className="flex items-center space-x-2">
                                  <IconLogin size={16} className="text-green-600" />
                                  <span>
                                    {new Date(record.checkInTime || record.checkIn!.time).toLocaleTimeString(
                                      'en-US',
                                      {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {record.checkOutTime || record.checkOut?.time ? (
                                <div className="flex items-center space-x-2">
                                  <IconLogout size={16} className="text-red-600" />
                                  <span>
                                    {new Date(
                                      record.checkOutTime || record.checkOut!.time
                                    ).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </Table.Cell>
                            <Table.Cell className="font-semibold">
                              {formatHours(record.totalHours)}
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center space-x-1">
                                <IconCoffee size={16} className="text-orange-600" />
                                <span>{formatDuration(record.totalBreakTime)}</span>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge color={getStatusColor(record.status)}>
                                {getStatusText(record.status)}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Button
                                size="xs"
                                color="light"
                                onClick={() => toggleRowExpansion(record._id)}
                              >
                                {expandedRow === record._id ? 'Hide' : 'Details'}
                              </Button>
                            </Table.Cell>
                          </Table.Row>

                          {/* Expanded Row - Same as in my-history page */}
                          {expandedRow === record._id && (
                            <Table.Row>
                              <Table.Cell colSpan={7} className="bg-gray-50 dark:bg-gray-900">
                                <div className="p-4 space-y-4">
                                  {/* Locations, Breaks, Work Locations - same structure as before */}
                                  {(record.checkInLocation || record.checkIn?.location) && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Check-In Location</h4>
                                      <div className="text-sm text-gray-600">
                                        {(record.checkInLocation || record.checkIn?.location)?.address}
                                      </div>
                                    </div>
                                  )}

                                  {(record.checkOutLocation || record.checkOut?.location) && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Check-Out Location</h4>
                                      <div className="text-sm text-gray-600">
                                        {(record.checkOutLocation || record.checkOut?.location)?.address}
                                      </div>
                                    </div>
                                  )}

                                  {record.breaks && record.breaks.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Breaks ({record.breaks.length})</h4>
                                      {record.breaks.map((b, i) => (
                                        <div key={i} className="text-sm">
                                          {b.reason} - {formatDuration(b.duration || 0)}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {record.workLocations && record.workLocations.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Work Locations ({record.workLocations.length})</h4>
                                      {record.workLocations.map((loc, i) => (
                                        <div key={i} className="text-sm">
                                          {loc.activity} - {loc.location.address}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </Table.Cell>
                            </Table.Row>
                          )}
                        </React.Fragment>
                      ))}
                    </Table.Body>
                  </Table>
                </div>

                {/* Pagination */}
                {userDetail.pagination && userDetail.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {(userDetail.pagination.page - 1) * userDetail.pagination.limit + 1} to{' '}
                      {Math.min(userDetail.pagination.page * userDetail.pagination.limit, userDetail.pagination.total)} of {userDetail.pagination.total}{' '}
                      records
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        color="light"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center px-3">
                        Page {userDetail.pagination.page} of {userDetail.pagination.totalPages}
                      </div>
                      <Button
                        size="sm"
                        color="light"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === userDetail.pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default UserAttendanceDetailPage;

