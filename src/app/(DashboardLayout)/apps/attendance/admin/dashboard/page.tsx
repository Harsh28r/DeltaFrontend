'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  TextInput,
  Table,
} from 'flowbite-react';
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconCoffee,
  IconRefresh,
  IconClock,
  IconMapPin,
  IconSearch,
  IconLogin,
  IconLogout,
} from '@tabler/icons-react';
import { getLiveDashboard } from '@/app/api/attendance/attendanceService';
import type { LiveDashboard } from '@/app/(DashboardLayout)/types/attendance';
import {
  formatHours,
  getStatusColor,
  getStatusText,
} from '@/utils/attendanceUtils';
import Link from 'next/link';

const LiveDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<LiveDashboard | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'checked-in' | 'checked-out' | 'absent'>('checked-in');

  // Fetch live dashboard
  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const data = await getLiveDashboard();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter users based on search query
  const filterUsers = (users: any[]) => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (item) =>
        item.user?.name?.toLowerCase().includes(query) ||
        item.user?.email?.toLowerCase().includes(query) ||
        item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Attendance Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of all users · {new Date().toLocaleTimeString('en-US')}
          </p>
        </div>
        <Button
          color="light"
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? <Spinner size="sm" className="mr-2" /> : <IconRefresh className="mr-2" size={16} />}
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {dashboard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Users */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-white">
                    {dashboard.summary.totalUsers}
                  </p>
                </div>
                <IconUsers size={40} className="text-blue-600 dark:text-blue-300" />
              </div>
            </Card>

            {/* Checked In */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-300">Checked In</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-white">
                    {dashboard.summary.checkedIn}
                  </p>
                </div>
                <IconUserCheck size={40} className="text-green-600 dark:text-green-300" />
              </div>
              <div className="mt-2">
                <div className="text-xs text-green-600 dark:text-green-300">
                  {((dashboard.summary.checkedIn / dashboard.summary.totalUsers) * 100).toFixed(1)}%
                </div>
              </div>
            </Card>

            {/* Checked Out */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Checked Out</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {dashboard.summary.checkedOut}
                  </p>
                </div>
                <IconLogout size={40} className="text-gray-600 dark:text-gray-300" />
              </div>
            </Card>

            {/* Absent */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 border-red-200 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-300">Absent</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-white">
                    {dashboard.summary.absent}
                  </p>
                </div>
                <IconUserX size={40} className="text-red-600 dark:text-red-300" />
              </div>
            </Card>

            {/* On Break */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-300">On Break</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-white">
                    {dashboard.summary.onBreak}
                  </p>
                </div>
                <IconCoffee size={40} className="text-orange-600 dark:text-orange-300" />
              </div>
            </Card>
          </div>

          {/* Search Bar */}
          <Card>
            <TextInput
              placeholder="Search by name or email..."
              icon={IconSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Card>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'checked-in'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('checked-in')}
            >
              Checked In ({dashboard.checkedInUsers.length})
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'checked-out'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('checked-out')}
            >
              Checked Out ({dashboard.checkedOutUsers.length})
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'absent'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('absent')}
            >
              Absent ({dashboard.absentUsers.length})
            </button>
          </div>

          {/* Checked In Users */}
          {activeTab === 'checked-in' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <IconUserCheck className="mr-2 text-green-600" size={24} />
                Checked In Users
              </h3>
              {filterUsers(dashboard.checkedInUsers).length === 0 ? (
                <div className="text-center py-8 text-gray-500">No checked-in users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table hoverable>
                    <Table.Head>
                      <Table.HeadCell>User</Table.HeadCell>
                      <Table.HeadCell>Check-In Time</Table.HeadCell>
                      <Table.HeadCell>Location</Table.HeadCell>
                      <Table.HeadCell>Hours Worked</Table.HeadCell>
                      <Table.HeadCell>Status</Table.HeadCell>
                      <Table.HeadCell>Work Locations</Table.HeadCell>
                      <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                      {filterUsers(dashboard.checkedInUsers).map((item) => (
                        <Table.Row key={item.user._id} className="bg-white dark:bg-gray-800">
                          <Table.Cell>
                            <div>
                              <div className="font-medium">{item.user.name}</div>
                              <div className="text-sm text-gray-500">{item.user.email}</div>
                              {item.user.role && (
                                <Badge color="blue" size="xs" className="mt-1">
                                  {item.user.role}
                                </Badge>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center space-x-2">
                              <IconLogin size={16} className="text-green-600" />
                              <span>
                                {new Date(item.checkInTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-start space-x-1 max-w-xs">
                              <IconMapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {item.checkInLocation.address}
                              </span>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="font-semibold">
                            {formatHours(item.hoursWorked)}
                          </Table.Cell>
                          <Table.Cell>
                            {item.isOnBreak ? (
                              <Badge color="warning">On Break</Badge>
                            ) : (
                              <Badge color="success">Working</Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color="purple">{item.workLocations}</Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Link href={`/apps/attendance/admin/user-detail/${item.user._id}`}>
                              <Button size="xs" color="light">
                                View
                              </Button>
                            </Link>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              )}
            </Card>
          )}

          {/* Checked Out Users */}
          {activeTab === 'checked-out' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <IconLogout className="mr-2 text-gray-600" size={24} />
                Checked Out Users
              </h3>
              {filterUsers(dashboard.checkedOutUsers).length === 0 ? (
                <div className="text-center py-8 text-gray-500">No checked-out users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table hoverable>
                    <Table.Head>
                      <Table.HeadCell>User</Table.HeadCell>
                      <Table.HeadCell>Check-In</Table.HeadCell>
                      <Table.HeadCell>Check-Out</Table.HeadCell>
                      <Table.HeadCell>Total Hours</Table.HeadCell>
                      <Table.HeadCell>Location</Table.HeadCell>
                      <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                      {filterUsers(dashboard.checkedOutUsers).map((item) => (
                        <Table.Row key={item.user._id} className="bg-white dark:bg-gray-800">
                          <Table.Cell>
                            <div>
                              <div className="font-medium">{item.user.name}</div>
                              <div className="text-sm text-gray-500">{item.user.email}</div>
                              {item.user.role && (
                                <Badge color="blue" size="xs" className="mt-1">
                                  {item.user.role}
                                </Badge>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            {new Date(item.checkInTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Table.Cell>
                          <Table.Cell>
                            {new Date(item.checkOutTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Table.Cell>
                          <Table.Cell className="font-semibold text-green-600">
                            {formatHours(item.totalHours)}
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-start space-x-1 max-w-xs">
                              <IconMapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {item.checkOutLocation.address}
                              </span>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <Link href={`/apps/attendance/admin/user-detail/${item.user._id}`}>
                              <Button size="xs" color="light">
                                View
                              </Button>
                            </Link>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              )}
            </Card>
          )}

          {/* Absent Users */}
          {activeTab === 'absent' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <IconUserX className="mr-2 text-red-600" size={24} />
                Absent Users
              </h3>
              {filterUsers(dashboard.absentUsers).length === 0 ? (
                <div className="text-center py-8 text-gray-500">No absent users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table hoverable>
                    <Table.Head>
                      <Table.HeadCell>Name</Table.HeadCell>
                      <Table.HeadCell>Email</Table.HeadCell>
                      <Table.HeadCell>Mobile</Table.HeadCell>
                      <Table.HeadCell>Role</Table.HeadCell>
                      <Table.HeadCell>Level</Table.HeadCell>
                      <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                      {filterUsers(dashboard.absentUsers).map((user) => (
                        <Table.Row key={user._id} className="bg-white dark:bg-gray-800">
                          <Table.Cell className="font-medium">{user.name}</Table.Cell>
                          <Table.Cell>{user.email}</Table.Cell>
                          <Table.Cell>{user.mobile || '-'}</Table.Cell>
                          <Table.Cell>
                            {user.role ? (
                              <Badge color="blue">{user.role}</Badge>
                            ) : (
                              '-'
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {user.level ? `Level ${user.level}` : '-'}
                          </Table.Cell>
                          <Table.Cell>
                            <Link href={`/apps/attendance/admin/user-detail/${user._id}`}>
                              <Button size="xs" color="light">
                                View
                              </Button>
                            </Link>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default LiveDashboardPage;

