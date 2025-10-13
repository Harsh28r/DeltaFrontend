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
} from 'flowbite-react';
import {
  IconCalendar,
  IconClock,
  IconUserPlus,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { createManualEntry } from '@/app/api/attendance/attendanceService';
import { API_BASE_URL } from '@/lib/config';
import Link from 'next/link';

interface User {
  _id: string;
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
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
  };

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
            <Label htmlFor="userId">
              Select User <span className="text-red-500">*</span>
            </Label>
            {usersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <Select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
              >
                <option value="">-- Select User --</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email}) {user.role ? `- ${user.role}` : ''}
                  </option>
                ))}
              </Select>
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

          {/* Notes */}
          <div>
            <Label htmlFor="notes">
              Additional Notes <span className="text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional information about this attendance record..."
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
    </div>
  );
};

export default ManualEntryPage;





