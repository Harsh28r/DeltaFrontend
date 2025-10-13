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
import Link from 'next/link';

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
  const [breakReason, setBreakReason] = useState('');
  const [workActivity, setWorkActivity] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showWorkLocationModal, setShowWorkLocationModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'checkin' | 'checkout'>('checkin');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
      let errorMessage = 'Failed to fetch attendance status.';
      
      // Handle specific error types
      if (err.message?.includes('JSON')) {
        errorMessage = 'Backend server error. Please check if the attendance API endpoint is configured correctly.';
      } else if (err.message?.includes('fetch')) {
        errorMessage = 'Cannot connect to backend. Please ensure the server is running.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Set a default status so UI can still render
      setAttendanceStatus({
        status: 'not-checked-in',
        attendance: null,
        canCheckIn: true,
        canCheckOut: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get location on component mount
  useEffect(() => {
    fetchAttendanceStatus();
    getLocation();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

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
      setError(err.message || 'Failed to get location. Please enable location access.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Start camera for selfie
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setError('Failed to access camera. Please allow camera permission.');
      setShowCameraModal(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Capture selfie from video
  const captureSelfie = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedSelfie(imageData);
        stopCamera();
        
        // Capture location immediately when photo is taken
        try {
          setLocationLoading(true);
          const location = await getCurrentLocation();
          const address = await reverseGeocode(location.latitude, location.longitude);
          setCurrentLocation({
            ...location,
            address,
          });
          setSuccess('Photo and location captured successfully!');
        } catch (err: any) {
          setError('Location captured failed. Please enable location access.');
        } finally {
          setLocationLoading(false);
        }
      }
    }
  };

  // Open camera modal for check-in/check-out
  const openCameraForAction = (type: 'checkin' | 'checkout') => {
    setActionType(type);
    setCapturedSelfie(null);
    setShowCameraModal(true);
    setTimeout(() => startCamera(), 100);
  };

  // Close camera modal
  const closeCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setCapturedSelfie(null);
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!currentLocation) {
      setError('Please enable location access');
      return;
    }

    if (!capturedSelfie) {
      setError('Please capture a selfie first');
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
        selfie: capturedSelfie,
        platform: getPlatformInfo(),
      });
      setSuccess('Checked in successfully!');
      setCapturedSelfie(null);
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

    if (!capturedSelfie) {
      setError('Please capture a selfie first');
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
        selfie: capturedSelfie,
      });
      setSuccess('Checked out successfully!');
      setCapturedSelfie(null);
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
    const checkInTime = attendanceStatus?.attendance?.checkInTime || attendanceStatus?.attendance?.checkIn?.time;
    if (!checkInTime) return 0;
    const checkInDate = new Date(checkInTime);
    const now = new Date();
    const diff = now.getTime() - checkInDate.getTime();
    return diff / (1000 * 60 * 60);
  };

  const breakControl = attendanceStatus?.attendance
    ? canTakeBreak(attendanceStatus.attendance.status, attendanceStatus.attendance.isOnBreak || false)
    : { canStart: false, canEnd: false };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        <Link href="/apps/attendance/my-history">
          <Button color="light">
            <IconClock className="mr-2" size={16} />
            View History
          </Button>
        </Link>
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
              {(attendanceStatus.attendance.checkInTime || attendanceStatus.attendance.checkIn?.time) && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Working for {formatHours(getHoursWorked())}
                </div>
              )}
            </div>

            {/* Status Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(attendanceStatus.attendance.checkInTime || attendanceStatus.attendance.checkIn?.time) && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <IconLogin className="text-green-600 dark:text-green-400" size={24} />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Check-In Time</div>
                    <div className="font-semibold">
                      {new Date(
                        attendanceStatus.attendance.checkInTime || attendanceStatus.attendance.checkIn!.time
                      ).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )}

              {(attendanceStatus.attendance.checkOutTime || attendanceStatus.attendance.checkOut?.time) && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <IconLogout className="text-red-600 dark:text-red-400" size={24} />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Check-Out Time</div>
                    <div className="font-semibold">
                      {new Date(
                        attendanceStatus.attendance.checkOutTime || attendanceStatus.attendance.checkOut!.time
                      ).toLocaleTimeString('en-US', {
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

            {/* Check-in Location */}
            {attendanceStatus.attendance.checkIn?.location && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-2">
                  <IconMapPinFilled className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-In Location</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Lat: {attendanceStatus.attendance.checkIn.location.coordinates[1]?.toFixed(4)}, 
                      Lng: {attendanceStatus.attendance.checkIn.location.coordinates[0]?.toFixed(4)}
                    </div>
                    {attendanceStatus.attendance.checkIn.location.accuracy && (
                      <div className="text-xs text-gray-500 mt-1">
                        Accuracy: {attendanceStatus.attendance.checkIn.location.accuracy}m
                      </div>
                    )}
                  </div>
                  <Button
                    size="xs"
                    color="light"
                    onClick={() => {
                      const coords = attendanceStatus.attendance!.checkIn!.location.coordinates;
                      const url = `https://www.google.com/maps?q=${coords[1]},${coords[0]}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <IconMapPin size={14} className="mr-1" />
                    View on Map
                  </Button>
                </div>
              </div>
            )}

            {/* Work Locations Summary */}
            {attendanceStatus.attendance.workLocations && attendanceStatus.attendance.workLocations.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconMapPin className="text-purple-600" size={18} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Work Locations Today
                    </span>
                  </div>
                  <Badge color="purple">{attendanceStatus.attendance.workLocations.length}</Badge>
                </div>
                <div className="space-y-2">
                  {attendanceStatus.attendance.workLocations.slice(0, 3).map((loc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                      <span className="font-medium">{loc.activity}</span>
                      <span className="text-gray-500">
                        {new Date(loc.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {attendanceStatus.attendance.workLocations.length > 3 && (
                    <div className="text-xs text-center text-gray-500">
                      +{attendanceStatus.attendance.workLocations.length - 3} more locations
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Breaks Summary */}
            {attendanceStatus.attendance.breaks && attendanceStatus.attendance.breaks.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconCoffee className="text-orange-600" size={18} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Breaks Today
                    </span>
                  </div>
                  <Badge color="orange">{attendanceStatus.attendance.breaks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {attendanceStatus.attendance.breaks.map((breakItem, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                      <span className="font-medium">{breakItem.reason}</span>
                      <span className="text-gray-500">
                        {breakItem.duration ? formatDuration(breakItem.duration) : 'Ongoing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* Captured Selfie Preview */}
      {capturedSelfie && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={capturedSelfie}
                alt="Captured selfie"
                className="w-24 h-24 rounded-lg object-cover border-2 border-green-500"
              />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Selfie Captured ✓</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ready to proceed with attendance</p>
              </div>
            </div>
            <Button
              size="sm"
              color="light"
              onClick={() => openCameraForAction(actionType)}
            >
              <IconCamera className="mr-1" size={16} />
              Retake
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attendanceStatus?.canCheckIn && !capturedSelfie && (
          <Button
            size="xl"
            color="success"
            onClick={() => openCameraForAction('checkin')}
            disabled={actionLoading || !currentLocation}
          >
            <IconCamera className="mr-2" size={20} />
            Take Selfie & Check In
          </Button>
        )}

        {attendanceStatus?.canCheckIn && capturedSelfie && (
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
            Confirm Check In
          </Button>
        )}

        {attendanceStatus?.canCheckOut && !capturedSelfie && (
          <Button
            size="xl"
            color="failure"
            onClick={() => openCameraForAction('checkout')}
            disabled={actionLoading || !currentLocation}
          >
            <IconCamera className="mr-2" size={20} />
            Take Selfie & Check Out
          </Button>
        )}

        {attendanceStatus?.canCheckOut && capturedSelfie && (
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
            Confirm Check Out
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

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl m-4">
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    {actionType === 'checkin' ? 'Check-In Selfie' : 'Check-Out Selfie'}
                  </h3>
                  <Button size="sm" color="light" onClick={closeCameraModal}>
                    Close
                  </Button>
                </div>

                {/* Camera View */}
                {!capturedSelfie && (
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-auto max-h-[60vh] object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <Button
                        size="lg"
                        color="success"
                        onClick={captureSelfie}
                        disabled={!cameraStream}
                        className="rounded-full"
                      >
                        <IconCamera size={24} className="mr-2" />
                        Capture Photo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Captured Photo Preview */}
                {capturedSelfie && (
                  <div className="space-y-4">
                    <img
                      src={capturedSelfie}
                      alt="Captured selfie"
                      className="w-full h-auto max-h-[60vh] rounded-lg object-cover"
                    />
                    <div className="flex space-x-2">
                      <Button
                        color="success"
                        onClick={() => {
                          setShowCameraModal(false);
                          if (actionType === 'checkin') {
                            // handleCheckIn will be called when user clicks confirm button
                          } else {
                            // handleCheckOut will be called when user clicks confirm button
                          }
                        }}
                        className="flex-1"
                      >
                        <IconCamera size={18} className="mr-2" />
                        Use This Photo
                      </Button>
                      <Button
                        color="light"
                        onClick={() => {
                          setCapturedSelfie(null);
                          setTimeout(() => startCamera(), 100);
                        }}
                        className="flex-1"
                      >
                        <IconRefresh size={18} className="mr-2" />
                        Retake
                      </Button>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Instructions:</strong> Position your face within the frame and click "Capture Photo"
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default CheckInPage;

