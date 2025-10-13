'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  TextInput,
  Label,
  Spinner,
  Alert,
  Timeline,
} from 'flowbite-react';
import {
  IconCalendar,
  IconMapPin,
  IconLogin,
  IconLogout,
  IconBriefcase,
  IconUser,
} from '@tabler/icons-react';
import { getUserLocationHistory } from '@/app/api/attendance/attendanceService';
import type { LocationHistoryResponse, LocationHistoryItem } from '@/app/(DashboardLayout)/types/attendance';
import { formatDateForAPI, formatCoordinates } from '@/utils/attendanceUtils';
import Link from 'next/link';

const LocationHistoryPage = ({ params }: { params: Promise<{ userId: string }> }) => {
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [locationHistory, setLocationHistory] = useState<LocationHistoryResponse | null>(null);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Unwrap params (Next.js 15+ async params)
  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  // Set default date to today
  useEffect(() => {
    const today = formatDateForAPI(new Date());
    setSelectedDate(today);
  }, []);

  // Fetch location history
  const fetchLocationHistory = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError('');
      const response = await getUserLocationHistory(userId, {
        date: selectedDate || undefined,
      });
      setLocationHistory(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch location history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate && userId) {
      fetchLocationHistory();
    }
  }, [selectedDate, userId]);

  // Get icon for location type
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'check-in':
        return IconLogin;
      case 'check-out':
        return IconLogout;
      case 'work-location':
        return IconBriefcase;
      default:
        return IconMapPin;
    }
  };

  // Get badge color for location type
  const getLocationBadgeColor = (type: string): 'success' | 'failure' | 'purple' | 'gray' => {
    switch (type) {
      case 'check-in':
        return 'success';
      case 'check-out':
        return 'failure';
      case 'work-location':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Get location type label
  const getLocationTypeLabel = (type: string): string => {
    switch (type) {
      case 'check-in':
        return 'Check-In';
      case 'check-out':
        return 'Check-Out';
      case 'work-location':
        return 'Work Location';
      default:
        return type;
    }
  };

  if (loading && !locationHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div>
        {userId && (
          <Link href={`/apps/attendance/admin/user-detail/${userId}`}>
            <Button color="light" size="sm" className="mb-2">
              ← Back to User Details
            </Button>
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Location History</h1>
        <p className="text-gray-600 dark:text-gray-400">Track user's location movements</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {locationHistory && (
        <>
          {/* User Info Card */}
          <Card>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <IconUser size={24} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{locationHistory.user.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{locationHistory.user.email}</p>
                {locationHistory.user.mobile && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{locationHistory.user.mobile}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Date Filter */}
          <Card>
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <Label htmlFor="dateFilter">Select Date</Label>
                <TextInput
                  id="dateFilter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <Button onClick={fetchLocationHistory} disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Load History'}
              </Button>
            </div>

            {/* Quick Date Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                size="xs"
                color="light"
                onClick={() => setSelectedDate(formatDateForAPI(new Date()))}
              >
                Today
              </Button>
              <Button
                size="xs"
                color="light"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(formatDateForAPI(yesterday));
                }}
              >
                Yesterday
              </Button>
            </div>
          </Card>

          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Locations Tracked</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {locationHistory.totalLocations}
                </p>
              </div>
              <IconMapPin size={48} className="text-blue-600 dark:text-blue-300" />
            </div>
          </Card>

          {/* Location Timeline */}
          {locationHistory.totalLocations === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No location history found for the selected date
              </div>
            </Card>
          ) : (
            <Card>
              <h3 className="text-lg font-semibold mb-6">Location Timeline</h3>
              <Timeline>
                {locationHistory.locationHistory.map((location, index) => {
                  const IconComponent = getLocationIcon(location.type);
                  return (
                  <Timeline.Item key={index}>
                    <Timeline.Point icon={IconComponent as any} />
                    <Timeline.Content>
                      <Timeline.Time>
                        {new Date(location.time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </Timeline.Time>
                      <Timeline.Title>
                        <div className="flex items-center space-x-2">
                          <span>{getLocationTypeLabel(location.type)}</span>
                          <Badge color={getLocationBadgeColor(location.type)} size="sm">
                            {getLocationTypeLabel(location.type)}
                          </Badge>
                        </div>
                      </Timeline.Title>
                      <Timeline.Body>
                        <div className="space-y-2">
                          {/* Address */}
                          <div className="flex items-start space-x-2">
                            <IconMapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {location.address}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCoordinates(location.latitude, location.longitude)}
                              </p>
                              {location.accuracy && (
                                <p className="text-xs text-gray-400">
                                  Accuracy: {location.accuracy.toFixed(0)}m
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Activity (for work locations) */}
                          {location.activity && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                Activity: {location.activity}
                              </p>
                            </div>
                          )}

                          {/* Notes */}
                          {location.notes && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {location.notes}
                              </p>
                            </div>
                          )}

                          {/* View on Map Button */}
                          <Button
                            size="xs"
                            color="light"
                            onClick={() => {
                              const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                              window.open(mapUrl, '_blank');
                            }}
                          >
                            <IconMapPin size={14} className="mr-1" />
                            View on Google Maps
                          </Button>
                        </div>
                      </Timeline.Body>
                    </Timeline.Content>
                  </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>
          )}

          {/* Map View Card (Simple Link) */}
          {locationHistory.totalLocations > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    View All Locations on Map
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Visualize the entire route for this day
                  </p>
                </div>
                <Button
                  color="success"
                  onClick={() => {
                    // Create URL with multiple markers
                    const markers = locationHistory.locationHistory
                      .map((loc, idx) => `&markers=color:blue%7Clabel:${idx + 1}%7C${loc.latitude},${loc.longitude}`)
                      .join('');
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${locationHistory.locationHistory[0].latitude},${locationHistory.locationHistory[0].longitude}${markers}`;
                    window.open(mapUrl, '_blank');
                  }}
                >
                  <IconMapPin className="mr-2" size={16} />
                  Open in Google Maps
                </Button>
              </div>
            </Card>
          )}

          {/* Statistics Grid */}
          {locationHistory.totalLocations > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20">
                <div className="text-center">
                  <IconLogin size={32} className="mx-auto text-green-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Check-Ins</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-white">
                    {locationHistory.locationHistory.filter(l => l.type === 'check-in').length}
                  </p>
                </div>
              </Card>

              <Card className="bg-red-50 dark:bg-red-900/20">
                <div className="text-center">
                  <IconLogout size={32} className="mx-auto text-red-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Check-Outs</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-white">
                    {locationHistory.locationHistory.filter(l => l.type === 'check-out').length}
                  </p>
                </div>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/20">
                <div className="text-center">
                  <IconBriefcase size={32} className="mx-auto text-purple-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Work Locations</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-white">
                    {locationHistory.locationHistory.filter(l => l.type === 'work-location').length}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocationHistoryPage;

