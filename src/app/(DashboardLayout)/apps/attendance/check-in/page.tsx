'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Textarea, Label, Spinner, Progress } from 'flowbite-react';
import {
  IconMapPin,
  IconClock,
  IconLogin,
  IconLogout,
  IconCoffee,
  IconMapPinFilled,
  IconCamera,
  IconRefresh,
} from '@tabler/icons-react';
import {
  getAttendanceStatus,
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  addWorkLocation,
} from '@/app/api/attendance/attendanceService';
import type { AttendanceStatus as AttendanceStatusType } from '@/app/(DashboardLayout)/types/attendance';
import {
  getCurrentLocation,
  reverseGeocode,
  getPlatformInfo,
  getStatusColor,
  getStatusText,
  formatHours,
  formatDuration,
  canTakeBreak,
  getTimeGreeting,
} from '@/utils/attendanceUtils';

const CheckInPage = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatusType | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [breakReason, setBreakReason] = useState('');
  const [workActivity, setWorkActivity] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showWorkLocationModal, setShowWorkLocationModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch attendance status
  const fetchAttendanceStatus = async () => {
    try {
      setLoading(true);
      const status = await getAttendanceStatus();
      setAttendanceStatus(status);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance status');
    } finally {
      setLoading(false);
    }
  };

  // Get location on component mount
  useEffect(() => {
    fetchAttendanceStatus();
    getLocation();
  }, []);

  // Get current location
  const getLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      const address = await reverseGeocode(location.latitude, location.longitude);
      setCurrentLocation({
        ...location,
        address,
      });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!currentLocation) {
      setError('Please enable location access');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await checkIn({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: currentLocation.address,
        accuracy: currentLocation.accuracy,
        notes: notes || undefined,
        platform: getPlatformInfo(),
      });
      setSuccess('Checked in successfully!');
      setNotes('');
      await fetchAttendanceStatus();
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!currentLocation) {
      setError('Please enable location access');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await checkOut({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: currentLocation.address,
        accuracy: currentLocation.accuracy,
        notes: notes || undefined,
      });
      setSuccess('Checked out successfully!');
      setNotes('');
      await fetchAttendanceStatus();
    } catch (err: any) {
      setError(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle start break
  const handleStartBreak = async () => {
    if (!breakReason.trim()) {
      setError('Please enter a reason for the break');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await startBreak({ reason: breakReason });
      setSuccess('Break started');
      setBreakReason('');
      setShowBreakModal(false);
      await fetchAttendanceStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to start break');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle end break
  const handleEndBreak = async () => {
    try {
      setActionLoading(true);
      setError('');
      await endBreak();
      setSuccess('Break ended');
      await fetchAttendanceStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to end break');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle add work location
  const handleAddWorkLocation = async () => {
    if (!currentLocation) {
      setError('Please enable location access');
      return;
    }

    if (!workActivity.trim()) {
      setError('Please enter an activity');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await addWorkLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: currentLocation.address,
        activity: workActivity,
        notes: workNotes || undefined,
      });
      setSuccess('Work location added');
      setWorkActivity('');
      setWorkNotes('');
      setShowWorkLocationModal(false);
      await fetchAttendanceStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to add work location');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate hours worked
  const getHoursWorked = () => {
    if (!attendanceStatus?.attendance?.checkInTime) return 0;
    const checkInTime = new Date(attendanceStatus.attendance.checkInTime);
    const now = new Date();
    const diff = now.getTime() - checkInTime.getTime();
    return diff / (1000 * 60 * 60);
  };

  const breakControl = attendanceStatus?.attendance
    ? canTakeBreak(attendanceStatus.attendance.status, attendanceStatus.attendance.isOnBreak || false)
    : { canStart: false, canEnd: false };

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getTimeGreeting()}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert color="success" onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Current Status Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Current Status</h2>
          <Badge color={getStatusColor(attendanceStatus?.status || 'absent')} size="lg">
            {getStatusText(attendanceStatus?.status || 'Not Checked In')}
          </Badge>
        </div>

        {attendanceStatus?.attendance && (
          <div className="space-y-4">
            {/* Time Display */}
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
              {attendanceStatus.attendance.checkInTime && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Working for {formatHours(getHoursWorked())}
                </div>
              )}
            </div>

            {/* Status Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attendanceStatus.attendance.checkInTime && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <IconLogin className="text-green-600 dark:text-green-400" size={24} />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Check-In Time</div>
                    <div className="font-semibold">
                      {new Date(attendanceStatus.attendance.checkInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )}

              {attendanceStatus.attendance.checkOutTime && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <IconLogout className="text-red-600 dark:text-red-400" size={24} />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Check-Out Time</div>
                    <div className="font-semibold">
                      {new Date(attendanceStatus.attendance.checkOutTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <IconClock className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                  <div className="font-semibold">{formatHours(attendanceStatus.attendance.totalHours)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <IconCoffee className="text-orange-600 dark:text-orange-400" size={24} />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Break Time</div>
                  <div className="font-semibold">
                    {formatDuration(attendanceStatus.attendance.totalBreakTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* On Break Indicator */}
            {attendanceStatus.attendance.isOnBreak && (
              <Alert color="warning">
                <div className="flex items-center">
                  <IconCoffee className="mr-2" size={20} />
                  You are currently on a break
                </div>
              </Alert>
            )}
          </div>
        )}

        {!attendanceStatus?.attendance && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            You have not checked in today
          </div>
        )}
      </Card>

      {/* Location Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Current Location</h2>
          <Button
            color="light"
            size="sm"
            onClick={getLocation}
            disabled={locationLoading}
          >
            {locationLoading ? <Spinner size="sm" /> : <IconRefresh size={16} />}
          </Button>
        </div>

        {currentLocation ? (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <IconMapPinFilled className="text-red-500 mt-1 flex-shrink-0" size={20} />
              <div className="flex-1">
                <div className="font-medium">{currentLocation.address}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Accuracy: {currentLocation.accuracy.toFixed(0)}m
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            {locationLoading ? 'Getting location...' : 'Location not available'}
          </div>
        )}
      </Card>

      {/* Notes Input */}
      {(attendanceStatus?.canCheckIn || attendanceStatus?.canCheckOut) && (
        <Card>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attendanceStatus?.canCheckIn && (
          <Button
            size="xl"
            color="success"
            onClick={handleCheckIn}
            disabled={actionLoading || !currentLocation}
          >
            {actionLoading ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <IconLogin className="mr-2" size={20} />
            )}
            Check In
          </Button>
        )}

        {attendanceStatus?.canCheckOut && (
          <Button
            size="xl"
            color="failure"
            onClick={handleCheckOut}
            disabled={actionLoading || !currentLocation}
          >
            {actionLoading ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <IconLogout className="mr-2" size={20} />
            )}
            Check Out
          </Button>
        )}

        {attendanceStatus?.status === 'checked-in' && (
          <>
            {breakControl.canStart && (
              <Button
                size="xl"
                color="warning"
                onClick={() => setShowBreakModal(true)}
                disabled={actionLoading}
              >
                <IconCoffee className="mr-2" size={20} />
                Start Break
              </Button>
            )}

            {breakControl.canEnd && (
              <Button
                size="xl"
                color="info"
                onClick={handleEndBreak}
                disabled={actionLoading}
              >
                <IconCoffee className="mr-2" size={20} />
                End Break
              </Button>
            )}

            <Button
              size="xl"
              color="purple"
              onClick={() => setShowWorkLocationModal(true)}
              disabled={actionLoading || !currentLocation}
            >
              <IconMapPin className="mr-2" size={20} />
              Add Work Location
            </Button>
          </>
        )}
      </div>

      {/* Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <h3 className="text-xl font-semibold mb-4">Start Break</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="breakReason">Reason *</Label>
                <Textarea
                  id="breakReason"
                  placeholder="Lunch break, Tea break, etc."
                  value={breakReason}
                  onChange={(e) => setBreakReason(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  color="warning"
                  onClick={handleStartBreak}
                  disabled={actionLoading || !breakReason.trim()}
                  className="flex-1"
                >
                  {actionLoading ? <Spinner size="sm" /> : 'Start Break'}
                </Button>
                <Button
                  color="light"
                  onClick={() => setShowBreakModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Work Location Modal */}
      {showWorkLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <h3 className="text-xl font-semibold mb-4">Add Work Location</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="workActivity">Activity *</Label>
                <Textarea
                  id="workActivity"
                  placeholder="Client meeting, Site visit, etc."
                  value={workActivity}
                  onChange={(e) => setWorkActivity(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="workNotes">Notes (Optional)</Label>
                <Textarea
                  id="workNotes"
                  placeholder="Additional details..."
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  rows={2}
                />
              </div>
              {currentLocation && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <IconMapPin size={16} className="inline mr-1" />
                  {currentLocation.address}
                </div>
              )}
              <div className="flex space-x-2">
                <Button
                  color="purple"
                  onClick={handleAddWorkLocation}
                  disabled={actionLoading || !workActivity.trim()}
                  className="flex-1"
                >
                  {actionLoading ? <Spinner size="sm" /> : 'Add Location'}
                </Button>
                <Button
                  color="light"
                  onClick={() => setShowWorkLocationModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;

