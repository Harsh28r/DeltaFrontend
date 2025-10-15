'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  TextInput,
  Textarea,
  Label,
  Spinner,
  Alert,
  Select,
  Badge,
} from 'flowbite-react';
import {
  IconCalendar,
  IconClock,
  IconUserPlus,
  IconDeviceFloppy,
  IconInfoCircle,
  IconNotes,
} from '@tabler/icons-react';
import { createManualEntry, getAllAttendance } from '@/app/api/attendance/attendanceService';
import type { Attendance } from '@/app/(DashboardLayout)/types/attendance';
import { API_BASE_URL } from '@/lib/config';
import Link from 'next/link';

interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
}

const ManualEntryPage = () => {
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [manualEntries, setManualEntries] = useState<Attendance[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    date: '',
    checkInTime: '',
    checkOutTime: '',
    notes: '',
    reason: '',
  });

  // Fetch all users
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





  

  // Fetch recent manual entries
  const fetchManualEntries = async () => {
    try {
      setEntriesLoading(true);
      const response = await getAllAttendance({
        limit: 10,
        page: 1,
      });
      // Filter to show only manual entries
      const manualOnly = response.attendance.filter(record => record.isManualEntry);
      setManualEntries(manualOnly);
    } catch (err: any) {
      console.error('Failed to fetch manual entries:', err);
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchManualEntries();
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today }));
  }, []);

  // Handle form input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.userId) {
      setError('Please select a user');
      return false;
    }
    if (!formData.date) {
      setError('Please select a date');
      return false;
    }
    if (!formData.checkInTime) {
      setError('Please enter check-in time');
      return false;
    }
    if (!formData.reason.trim()) {
      setError('Please provide a reason for manual entry');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Convert date and time to ISO format
      const checkInDateTime = new Date(`${formData.date}T${formData.checkInTime}`).toISOString();
      const checkOutDateTime = formData.checkOutTime
        ? new Date(`${formData.date}T${formData.checkOutTime}`).toISOString()
        : undefined;

      await createManualEntry({
        userId: formData.userId,
        date: formData.date,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        notes: formData.notes || undefined,
        reason: formData.reason,
      });

      setSuccess('Manual attendance entry created successfully!');
      
      // Refresh manual entries list
      fetchManualEntries();
      
      // Reset form
      setFormData({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '',
        checkOutTime: '',
        notes: '',
        reason: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create manual entry');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      userId: '',
      date: new Date().toISOString().split('T')[0],
      checkInTime: '',
      checkOutTime: '',
      notes: '',
      reason: '',
    });
    setError('');
    setSuccess('');
    setUserSearchQuery('');
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!userSearchQuery.trim()) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/apps/attendance/admin/dashboard">
          <Button color="light" size="sm" className="mb-2">
            ← Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Manual Attendance Entry</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create attendance records manually for users who couldn't check-in
        </p>
      </div>

      {/* Alert Messages */}
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

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <IconUserPlus size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Important Notes</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
              <li>Manual entries are clearly marked in the system</li>
              <li>Provide a clear reason for creating a manual entry</li>
              <li>Manual entries do not include location data</li>
              <li>Your admin account will be recorded as the creator</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Form Card */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="userId">
                Select User <span className="text-red-500">*</span>
              </Label>
              {!usersLoading && users.length > 0 && (
                <Badge color="info" size="sm">
                  {users.length} {users.length === 1 ? 'user' : 'users'} available
                </Badge>
              )}
            </div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-gray-500">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <Alert color="warning">
                No users found. Please ensure users exist in the system.
              </Alert>
            ) : (
              <>
                {/* Search Users */}
                <TextInput
                  placeholder="Search users by name, email, or role..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <Select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select User ({filteredUsers.length} available) --</option>
                  {filteredUsers.length === 0 ? (
                    <option disabled>No users match your search</option>
                  ) : (
                    filteredUsers.map(user => {
                      const userId = user.id || user._id;
                      return (
                        <option key={userId} value={userId}>
                          {user.name} - {user.email} {user.role ? `(${user.role})` : ''}
                        </option>
                      );
                    })
                  )}
                </Select>
                {userSearchQuery && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing {filteredUsers.length} of {users.length} users
                  </p>
                )}
              </>
            )}
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">
              Date <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              icon={() => <IconCalendar size={20} />}
              required
            />
          </div>

          {/* Check-In Time */}
          <div>
            <Label htmlFor="checkInTime">
              Check-In Time <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="checkInTime"
              name="checkInTime"
              type="time"
              value={formData.checkInTime}
              onChange={handleChange}
              icon={() => <IconClock size={20} />}
              required
              helperText="Enter the time when the user started work"
            />
          </div>

          {/* Check-Out Time */}
          <div>
            <Label htmlFor="checkOutTime">
              Check-Out Time <span className="text-gray-500">(Optional)</span>
            </Label>
            <TextInput
              id="checkOutTime"
              name="checkOutTime"
              type="time"
              value={formData.checkOutTime}
              onChange={handleChange}
              icon={() => <IconClock size={20} />}
              helperText="Leave empty if user is still working or hasn't checked out"
            />
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">
              Reason for Manual Entry <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={3}
              required
              placeholder="e.g., System issue prevented automatic check-in, User forgot to check-in, Network connectivity problem..."
              helperText="Provide a clear reason why you are creating this manual entry"
            />
          </div>

          {/* Comments/Notes */}
          <div>
            <Label htmlFor="notes" className="flex items-center gap-2">
              <IconNotes size={18} />
              Comments/Notes <span className="text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add any comments or additional information about this attendance record..."
              helperText="This comment will be visible in the attendance records"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <Button
              type="submit"
              color="success"
              disabled={loading || usersLoading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="mr-2" size={18} />
                  Create Manual Entry
                </>
              )}
            </Button>
            <Button
              type="button"
              color="light"
              onClick={handleReset}
              disabled={loading}
              className="flex-1"
            >
              Reset Form
            </Button>
          </div>
        </form>
      </Card>

      {/* Warning Card */}
      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
        <div className="flex items-start space-x-3">
          <div className="text-orange-600 text-2xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">Data Accuracy</h3>
            <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
              Manual entries should only be used when absolutely necessary. Ensure all information is
              accurate as these records are permanent and will be included in reports and analytics.
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Manual Entries */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <IconInfoCircle size={24} className="text-blue-600" />
            Recent Manual Entries
          </h3>
          <Badge color="info">{manualEntries.length} entries</Badge>
        </div>

        {entriesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : manualEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No manual entries found
          </div>
        ) : (
          <div className="space-y-4">
            {manualEntries.map((entry) => (
              <div
                key={entry._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">
                        {typeof entry.user === 'object' ? entry.user.name : 'Unknown User'}
                      </h4>
                      <Badge color="warning" size="sm">Manual Entry</Badge>
                    </div>
                    
                    {/* Email */}
                    {typeof entry.user === 'object' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {entry.user.email}
                      </p>
                    )}

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="text-sm">
                        <span className="text-gray-500">Date:</span>{' '}
                        <span className="font-medium">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Check-In:</span>{' '}
                        <span className="font-medium">
                          {entry.checkInTime
                            ? new Date(entry.checkInTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Check-Out:</span>{' '}
                        <span className="font-medium">
                          {entry.checkOutTime
                            ? new Date(entry.checkOutTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Created By */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <IconUserPlus size={16} className="text-blue-600" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Created by:{' '}
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {typeof entry.manualEntryBy === 'object' && entry.manualEntryBy?.name
                              ? entry.manualEntryBy.name
                              : typeof entry.manualEntryBy === 'string'
                              ? entry.manualEntryBy
                              : 'Unknown'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    {entry.manualEntryReason && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-3">
                        <div className="text-sm">
                          <span className="font-semibold text-yellow-800 dark:text-yellow-300">Reason:</span>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">
                            {entry.manualEntryReason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Comments/Notes */}
                    {(entry.checkIn?.notes || entry.checkOut?.notes) && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="flex items-start gap-2 text-sm">
                          <IconNotes size={16} className="text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold text-green-800 dark:text-green-300">Comments:</span>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              {entry.checkIn?.notes || entry.checkOut?.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Entry Date */}
                  <div className="text-xs text-gray-400 ml-4">
                    {new Date(entry.createdAt || entry.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManualEntryPage;





