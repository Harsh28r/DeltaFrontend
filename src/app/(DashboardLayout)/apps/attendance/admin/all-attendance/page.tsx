'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  Table,
  TextInput,
  Label,
  Select,
  Spinner,
  Alert,
  Modal,
} from 'flowbite-react';
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconSearch,
  IconLogin,
  IconLogout,
  IconFilter,
  IconDownload,
  IconUserPlus,
  IconNotes,
  IconUserCheck,
} from '@tabler/icons-react';
import { getAllAttendance } from '@/app/api/attendance/attendanceService';
import type { Attendance, Pagination } from '@/app/(DashboardLayout)/types/attendance';
import {
  formatHours,
  formatDuration,
  getStatusColor,
  getStatusText,
  formatDateForAPI,
} from '@/utils/attendanceUtils';
import Link from 'next/link';

const AllAttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [selectedManualEntry, setSelectedManualEntry] = useState<{
    userName: string;
    createdBy: string;
    reason: string;
    notes: string;
  } | null>(null);

  // Fetch attendance records
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllAttendance({
        date: dateFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit: 50,
      });
      setAttendance(response.attendance);
      setPagination(response.pagination);
      setSummary(response.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentPage]);

  // Handle filter apply
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchAttendance();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setDateFilter('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setSearchQuery('');
    setCurrentPage(1);
    fetchAttendance();
  };

  // Set quick date filter
  const setTodayFilter = () => {
    const today = formatDateForAPI(new Date());
    setDateFilter(today);
    setStartDate('');
    setEndDate('');
  };

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Show manual entry details
  const showManualEntryDetails = (record: Attendance) => {
    const userName = typeof record.user === 'object' ? record.user.name : 'Unknown User';
    const createdBy = typeof record.manualEntryBy === 'object' && record.manualEntryBy?.name
      ? record.manualEntryBy.name
      : typeof record.manualEntryBy === 'string'
      ? record.manualEntryBy
      : 'Unknown';
    
    setSelectedManualEntry({
      userName,
      createdBy,
      reason: record.manualEntryReason || 'No reason provided',
      notes: (record.checkIn?.notes || record.checkOut?.notes) || 'No notes',
    });
    setShowManualEntryModal(true);
  };

  // Filter attendance based on search query
  const filteredAttendance = attendance.filter((record) => {
    if (searchQuery.trim() === '') return true;
    if (typeof record.user === 'string') return false;
    return (
      record.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Attendance Records</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage attendance for all users</p>
        </div>
        <Button
          color="light"
          onClick={() => setShowFilters(!showFilters)}
        >
          <IconFilter className="mr-2" size={16} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-600 dark:text-blue-300">Total Records</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-white">{summary.total}</p>
            </div>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
            <div className="text-center">
              <p className="text-sm text-green-600 dark:text-green-300">Checked In</p>
              <p className="text-3xl font-bold text-green-900 dark:text-white">{summary.checkedIn}</p>
            </div>
          </Card>
          <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">Checked Out</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.checkedOut}</p>
            </div>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-300">Absent</p>
              <p className="text-3xl font-bold text-red-900 dark:text-white">{summary.absent}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Specific Date */}
            <div>
              <Label htmlFor="dateFilter">Specific Date</Label>
              <TextInput
                id="dateFilter"
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setStartDate('');
                  setEndDate('');
                }}
                icon={() => <IconCalendar size={20} />}
              />
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <TextInput
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateFilter('');
                }}
                icon={() => <IconCalendar size={20} />}
                disabled={!!dateFilter}
              />
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <TextInput
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateFilter('');
                }}
                icon={() => <IconCalendar size={20} />}

                disabled={!!dateFilter}
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="statusFilter">Status</Label>
              <Select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
                <option value="absent">Absent</option>
                <option value="on-leave">On Leave</option>
              </Select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="xs" color="light" onClick={setTodayFilter}>
              Today
            </Button>
            <Button
              size="xs"
              color="light"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setDateFilter(formatDateForAPI(yesterday));
                setStartDate('');
                setEndDate('');
              }}
            >
              Yesterday
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mt-4">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button color="light" onClick={handleResetFilters} className="flex-1">
              Reset
            </Button>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <Card>
        <TextInput
          placeholder="Search by user name or email..."
          icon={() => <IconSearch size={20} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Attendance Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="xl" />
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No attendance records found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell>User</Table.HeadCell>
                  <Table.HeadCell>Date</Table.HeadCell>
                  <Table.HeadCell>Check-In</Table.HeadCell>
                  <Table.HeadCell>Check-Out</Table.HeadCell>
                  <Table.HeadCell>Total Hours</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {filteredAttendance.map((record) => (
                    <React.Fragment key={record._id}>
                      <Table.Row className="bg-white dark:bg-gray-800">
                        <Table.Cell>
                          <div>
                            <div className="font-medium">
                              {typeof record.user === 'object' ? record.user.name : 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {typeof record.user === 'object' ? record.user.email : '-'}
                            </div>
                            {typeof record.user === 'object' && record.user.role && (
                              <Badge color="blue" size="xs" className="mt-1">
                                {record.user.role}
                              </Badge>
                            )}
                            {record.isManualEntry && (
                              <Badge 
                                color="warning" 
                                size="xs" 
                                className="mt-1 ml-1 cursor-pointer hover:bg-yellow-300 transition-colors"
                                title="Click to view manual entry details"
                                onClick={() => showManualEntryDetails(record)}
                              >
                                Manual Entry
                              </Badge>
                            )}
                          </div>
                        </Table.Cell>
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
                          <Badge color={getStatusColor(record.status)}>
                            {getStatusText(record.status)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex space-x-2">
                            <Button
                              size="xs"
                              color="light"
                              onClick={() => toggleRowExpansion(record._id)}
                            >
                              {expandedRow === record._id ? 'Hide' : 'Details'}
                            </Button>
                            {(typeof record.user === 'object' && record.user?._id) || typeof record.user === 'string' ? (
                              <Link href={`/apps/attendance/admin/user-detail/${typeof record.user === 'object' ? record.user._id : record.user}`}>
                                <Button size="xs" color="light">
                                  User
                                </Button>
                              </Link>
                            ) : (
                              <Button size="xs" color="light" disabled>
                                User
                              </Button>
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>

                      {/* Expanded Row Details */}
                      {expandedRow === record._id && (
                        <Table.Row>
                          <Table.Cell colSpan={7} className="bg-gray-50 dark:bg-gray-900">
                            <div className="p-4 space-y-4">
                              {/* Locations */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Check-In Location */}
                                {(record.checkInLocation || record.checkIn?.location) && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center">
                                      <IconLogin size={18} className="mr-2 text-green-600" />
                                      Check-In Location
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <IconMapPin size={16} className="inline mr-1" />
                                      {(record.checkInLocation || record.checkIn?.location)?.address}
                                    </div>
                                    {record.checkIn?.notes && (
                                      <div className="text-sm text-gray-500 mt-1">
                                        Note: {record.checkIn.notes}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Check-Out Location */}
                                {(record.checkOutLocation || record.checkOut?.location) && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center">
                                      <IconLogout size={18} className="mr-2 text-red-600" />
                                      Check-Out Location
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <IconMapPin size={16} className="inline mr-1" />
                                      {(record.checkOutLocation || record.checkOut?.location)?.address}
                                    </div>
                                    {record.checkOut?.notes && (
                                      <div className="text-sm text-gray-500 mt-1">
                                        Note: {record.checkOut.notes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Work Locations */}
                              {record.workLocations && record.workLocations.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center">
                                    <IconMapPin size={18} className="mr-2 text-purple-600" />
                                    Work Locations ({record.workLocations.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {record.workLocations.map((location, index) => (
                                      <div
                                        key={index}
                                        className="text-sm bg-white dark:bg-gray-800 p-2 rounded"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="font-medium">{location.activity}</div>
                                            <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                              <IconMapPin size={14} className="inline mr-1" />
                                              {location.location.address}
                                            </div>
                                            {location.notes && (
                                              <div className="text-gray-500 text-xs mt-1">{location.notes}</div>
                                            )}
                                          </div>
                                          <span className="text-xs text-gray-500">
                                            {new Date(location.time).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Manual Entry Info */}
                              {record.isManualEntry && (
                                <Alert color="warning">
                                  <div className="text-sm">
                                    This is a manual entry
                                    {record.manualEntryBy && (
                                      <>
                                        {' '}created by{' '}
                                        <span className="font-semibold">
                                          {typeof record.manualEntryBy === 'object' && record.manualEntryBy.name 
                                            ? record.manualEntryBy.name 
                                            : typeof record.manualEntryBy === 'string' 
                                            ? record.manualEntryBy 
                                            : 'Unknown'}
                                        </span>
                                      </>
                                    )}
                                    {record.manualEntryReason && (
                                      <>
                                        <br />
                                        Reason: {record.manualEntryReason}
                                      </>
                                    )}
                                  </div>
                                </Alert>
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
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
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
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <Button
                    size="sm"
                    color="light"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

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

export default AllAttendancePage;





