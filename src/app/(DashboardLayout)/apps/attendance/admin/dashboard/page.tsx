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
  Label,
  Modal,
} from 'flowbite-react';
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconRefresh,
  IconClock,
  IconMapPin,
  IconSearch,
  IconLogin,
  IconLogout,
  IconCalendar,
  IconUserPlus,
  IconNotes,
} from '@tabler/icons-react';
import { getLiveDashboard } from '@/app/api/attendance/attendanceService';
import type { LiveDashboard } from '@/app/(DashboardLayout)/types/attendance';
import {
  formatHours,
  getStatusColor,
  getStatusText,
  formatDateForAPI,
} from '@/utils/attendanceUtils';
import { API_BASE_URL } from '@/lib/config';
import Link from 'next/link';
import Image from 'next/image';

const LiveDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<LiveDashboard | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'checked-in' | 'checked-out' | 'absent'>('checked-in');
  const [selectedDate, setSelectedDate] = useState(formatDateForAPI(new Date()));
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [selectedManualEntry, setSelectedManualEntry] = useState<{
    userName: string;
    createdBy: string;
    reason: string;
    notes: string;
  } | null>(null);

  // Fetch live dashboard
  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const data = await getLiveDashboard(selectedDate);
      
      // Debug: Log selfie data
      if (data.checkedInUsers.length > 0 || data.checkedOutUsers.length > 0) {
        console.log('Dashboard data received:', {
          checkedInCount: data.checkedInUsers.length,
          checkedOutCount: data.checkedOutUsers.length,
          apiBaseUrl: API_BASE_URL
        });
        
        if (data.checkedInUsers[0]) {
          console.log('Sample Check-In User:', {
            name: data.checkedInUsers[0].user.name,
            rawSelfie: data.checkedInUsers[0].checkInSelfie
          });
        }
        
        if (data.checkedOutUsers[0]) {
          console.log('Sample Check-Out User:', {
            name: data.checkedOutUsers[0].user.name,
            rawCheckInSelfie: data.checkedOutUsers[0].checkInSelfie,
            rawCheckOutSelfie: data.checkedOutUsers[0].checkOutSelfie
          });
        }
      }
      
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds (only for today's data)
  useEffect(() => {
    fetchDashboard();
    
    // Only auto-refresh if viewing today's data
    const isToday = selectedDate === formatDateForAPI(new Date());
    if (isToday) {
      const interval = setInterval(() => fetchDashboard(true), 30000);
      return () => clearInterval(interval);
    }
  }, [selectedDate]);

  // Quick date selectors
  const setToday = () => {
    setSelectedDate(formatDateForAPI(new Date()));
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(formatDateForAPI(yesterday));
  };

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

  // Show manual entry details
  const showManualEntryDetails = (item: any) => {
    setSelectedManualEntry({
      userName: item.user?.name || 'Unknown User',
      createdBy: typeof item.manualEntryBy === 'object' && item.manualEntryBy?.name
        ? item.manualEntryBy.name
        : typeof item.manualEntryBy === 'string'
        ? item.manualEntryBy
        : 'Unknown',
      reason: item.manualEntryReason || 'No reason provided',
      notes: item.notes || 'No notes',
    });
    setShowManualEntryModal(true);
  };

  // Helper function to convert path to backend API URL
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return null;

    // Normalize Windows paths to POSIX-style
    let normalizedPath = imagePath.replace(/\\/g, '/');

    // Strip absolute path prefixes if present
    const attendanceIndex = normalizedPath.toLowerCase().indexOf('attendance/selfies/');
    if (attendanceIndex !== -1) {
      normalizedPath = normalizedPath.substring(attendanceIndex);
    }

    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      return normalizedPath;
    }

    if (normalizedPath.includes('/')) {
      return `${API_BASE_URL}/api/attendance/selfie/${encodeURIComponent(normalizedPath)}`;
    }

    return `${API_BASE_URL}/api/attendance/selfie/${normalizedPath}`;
  };

  const getLocationLabel = (location: any) => {
    if (!location) return 'Location unavailable';

    if (typeof location === 'string') {
      const trimmed = location.trim();
      if (!trimmed) return 'Location unavailable';

      if (trimmed.toLowerCase().startsWith('gps:')) {
        const coords = trimmed.substring(4).split(',').map((part) => parseFloat(part));
        if (coords.length === 2 && coords.every((value) => !Number.isNaN(value))) {
          return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
        }
      }

      return trimmed;
    }

    const address = location.address || location.formattedAddress;
    if (address && typeof address === 'string' && address.trim()) {
      return address.trim();
    }

    const placeName = location.placeName || location.name;
    if (placeName && typeof placeName === 'string' && placeName.trim()) {
      return placeName.trim();
    }

    const { latitude, longitude, lat, lng } = location;
    const resolvedLat = typeof latitude === 'number' ? latitude : lat;
    const resolvedLng = typeof longitude === 'number' ? longitude : lng;

    if (typeof resolvedLat === 'number' && typeof resolvedLng === 'number') {
      return `${resolvedLat.toFixed(4)}, ${resolvedLng.toFixed(4)}`;
    }

    return 'Location unavailable';
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
            Real-time monitoring of all users
            {selectedDate === formatDateForAPI(new Date()) && ` · ${new Date().toLocaleTimeString('en-US')}`}
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

      {/* Date Filter */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="dateFilter" className="mb-2">
              Select Date
            </Label>
            <TextInput
              id="dateFilter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              icon={() => <IconCalendar size={20} />}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              color="light"
              onClick={setToday}
              disabled={selectedDate === formatDateForAPI(new Date())}
            >
              Today
            </Button>
            <Button
              size="sm"
              color="light"
              onClick={setYesterday}
            >
              Yesterday
            </Button>
          </div>
        </div>
        {selectedDate && (
          <div className={`mt-3 p-3 rounded-lg border ${
            selectedDate === formatDateForAPI(new Date())
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCalendar size={18} className={
                  selectedDate === formatDateForAPI(new Date())
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400'
                } />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedDate === formatDateForAPI(new Date()) ? 'Live Data - ' : 'Historical Data - '}
                  <span className={`font-bold ${
                    selectedDate === formatDateForAPI(new Date())
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </span>
              </div>
              {selectedDate === formatDateForAPI(new Date()) && (
                <Badge color="success" size="sm">
                  Auto-refreshing
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      {dashboard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Link href="/apps/users">
              <Card 
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Total Users</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-white">
                      {dashboard.summary.totalUsers}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Click to view all users</p>
                  </div>
                  <IconUsers size={40} className="text-blue-600 dark:text-blue-300" />
                </div>
              </Card>
            </Link>

            {/* Checked In */}
            <Card 
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab('checked-in')}
            >
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
            <Card 
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab('checked-out')}
            >
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
            <Card 
              className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 border-red-200 dark:border-red-700 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab('absent')}
            >
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
          </div>

          {/* Search Bar */}
          <Card>
            <TextInput
              placeholder="Search by name or email..."
              icon={() => <IconSearch size={20} />}
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
                      <Table.HeadCell>Selfie</Table.HeadCell>
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
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.user.name}</span>
                                {item.isManualEntry && (
                                  <Badge 
                                    color="warning" 
                                    size="xs" 
                                    title="Click to view manual entry details"
                                    className="cursor-pointer hover:bg-yellow-300 transition-colors"
                                    onClick={() => showManualEntryDetails(item)}
                                  >
                                    Manual
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{item.user.email}</div>
                              {item.user.role && (
                                <Badge color="blue" size="xs" className="mt-1">
                                  {item.user.role}
                                </Badge>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            {(() => {
                              const imageUrl = getImageUrl(item.checkInSelfie);
                              return imageUrl ? (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-500">
                                  <img
                                    src={imageUrl}
                                    alt="Check-in selfie"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                    onError={(e) => {
                                      console.error('Failed to load image:', imageUrl);
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-red-500">Failed</span>';
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">No photo</span>
                              );
                            })()}
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
                                {getLocationLabel(item.checkInLocation || item.checkInAddress)}
                              </span>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="font-semibold">
                            {formatHours(item.hoursWorked)}
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color="success">Working</Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color="purple">{item.workLocations}</Badge>
                          </Table.Cell>
                          <Table.Cell>
                            {(() => {
                              const userId = item.user?._id || (item.user as any)?.id;
                              return userId ? (
                                <Link href={`/apps/attendance/admin/user-detail/${userId}`}>
                                  <Button size="xs" color="light">
                                    View
                                  </Button>
                                </Link>
                              ) : (
                                <Button size="xs" color="light" disabled>
                                  No ID
                                </Button>
                              );
                            })()}
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
                      <Table.HeadCell>Selfies</Table.HeadCell>
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
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.user.name}</span>
                                {item.isManualEntry && (
                                  <Badge 
                                    color="warning" 
                                    size="xs" 
                                    title="Click to view manual entry details"
                                    className="cursor-pointer hover:bg-yellow-300 transition-colors"
                                    onClick={() => showManualEntryDetails(item)}
                                  >
                                    Manual
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{item.user.email}</div>
                              {item.user.role && (
                                <Badge color="blue" size="xs" className="mt-1">
                                  {item.user.role}
                                </Badge>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex gap-2">
                              {/* Check-In Selfie */}
                              {(() => {
                                const checkInUrl = getImageUrl(item.checkInSelfie);
                                return checkInUrl ? (
                                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-500">
                                    <img
                                      src={checkInUrl}
                                      alt="Check-in"
                                      title="Check-in selfie"
                                      className="w-full h-full object-cover cursor-pointer"
                                      onClick={() => window.open(checkInUrl, '_blank')}
                                      onError={(e) => {
                                        console.error('Failed to load check-in image:', checkInUrl);
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-red-500">❌</span>';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">In</span>
                                  </div>
                                );
                              })()}
                              {/* Check-Out Selfie */}
                              {(() => {
                                const checkOutUrl = getImageUrl(item.checkOutSelfie);
                                return checkOutUrl ? (
                                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-500">
                                    <img
                                      src={checkOutUrl}
                                      alt="Check-out"
                                      title="Check-out selfie"
                                      className="w-full h-full object-cover cursor-pointer"
                                      onClick={() => window.open(checkOutUrl, '_blank')}
                                      onError={(e) => {
                                        console.error('Failed to load check-out image:', checkOutUrl);
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-red-500">❌</span>';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">Out</span>
                                  </div>
                                );
                              })()}
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
                                {getLocationLabel(item.checkOutLocation || item.checkOutAddress)}
                              </span>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            {(() => {
                              const userId = item.user?._id || (item.user as any)?.id;
                              return userId ? (
                                <Link href={`/apps/attendance/admin/user-detail/${userId}`}>
                                  <Button size="xs" color="light">
                                    View
                                  </Button>
                                </Link>
                              ) : (
                                <Button size="xs" color="light" disabled>
                                  No ID
                                </Button>
                              );
                            })()}
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
                      {filterUsers(dashboard.absentUsers).map((user, index) => {
                        const userId = user._id || (user as any).id;
                        if (!userId) {
                          console.warn('Absent user without ID:', user);
                        }
                        return (
                          <Table.Row key={userId || `user-${index}`} className="bg-white dark:bg-gray-800">
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
                              {userId ? (
                                <Link href={`/apps/attendance/admin/user-detail/${userId}`}>
                                  <Button size="xs" color="light">
                                    View
                                  </Button>
                                </Link>
                              ) : (
                                <Button size="xs" color="light" disabled>
                                  No ID
                                </Button>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Manual Entry Details Modal */}
      <Modal
        show={showManualEntryModal}
        onClose={() => setShowManualEntryModal(false)}
        size="md"
      >
        <Modal.Header>
          Manual Entry Details
        </Modal.Header>
        <Modal.Body>
          {selectedManualEntry && (
            <div className="space-y-4">
              {/* User Name */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-1">
                  <IconUserCheck size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    User
                  </span>
                </div>
                <p className="text-base font-semibold text-gray-900 dark:text-white ml-6">
                  {selectedManualEntry.userName}
                </p>
              </div>

              {/* Created By */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-1">
                  <IconUserPlus size={18} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Created By
                  </span>
                </div>
                <p className="text-base font-semibold text-gray-900 dark:text-white ml-6">
                  {selectedManualEntry.createdBy}
                </p>
              </div>

              {/* Reason */}
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                <div className="flex items-center gap-2 mb-1">
                  <IconNotes size={18} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason
                  </span>
                </div>
                <p className="text-base text-gray-900 dark:text-white ml-6">
                  {selectedManualEntry.reason}
                </p>
              </div>

              {/* Notes */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-1">
                  <IconNotes size={18} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </span>
                </div>
                <p className="text-base text-gray-900 dark:text-white ml-6">
                  {selectedManualEntry.notes}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setShowManualEntryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LiveDashboardPage;


