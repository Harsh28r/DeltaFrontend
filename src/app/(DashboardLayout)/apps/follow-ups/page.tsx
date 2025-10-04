"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select, Toast } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";
import { 
  Reminder, 
  RemindersResponse, 
  CreateReminderRequest, 
  ReminderStatusOption 
} from "../../types/follow-ups";

const FollowUpsPage = () => {
  const { token } = useAuth();
  const { socket, connected, subscribeToReminders } = useWebSocket();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20
  });
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'thisWeek' | 'thisMonth'>('all');

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dateTime: "",
    relatedType: "lead" as "task" | "lead" | "other",
    relatedId: "",
    userId: "",
    status: "pending" as "pending" | "sent" | "completed" | "cancelled"
  });

  const statusOptions: ReminderStatusOption[] = [
    { value: "pending", label: "Pending", color: "yellow" },
    { value: "sent", label: "Sent", color: "blue" },
    { value: "completed", label: "Completed", color: "green" },
    { value: "cancelled", label: "Cancelled", color: "red" }
  ];

  const relatedTypeOptions = [
    { value: "lead", label: "Lead" },
    { value: "task", label: "Task" },
    { value: "other", label: "Other" }
  ];

  const dateFilterOptions = [
    { value: "all", label: "All Reminders", icon: "solar:calendar-line-duotone" },
    { value: "today", label: "Today", icon: "solar:calendar-mark-line-duotone" },
    { value: "tomorrow", label: "Tomorrow", icon: "solar:calendar-add-line-duotone" },
    { value: "thisWeek", label: "This Week", icon: "solar:calendar-minimalistic-line-duotone" },
    { value: "thisMonth", label: "This Month", icon: "solar:calendar-date-line-duotone" }
  ];

  useEffect(() => {
    if (token) {
      fetchReminders();
      // Subscribe to reminders when component mounts
      subscribeToReminders();
    }
  }, [token, subscribeToReminders]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket) {
      console.log('🔌 No socket available for reminders page');
      return;
    }

    console.log('🔌 Setting up reminder event listeners');

    // Listen for new reminder created
    socket.on('reminder-created', (data) => {
      console.log('🆕 New reminder created:', data);
      setReminders(prev => {
        const newReminders = [data.reminder, ...prev];
        console.log('📝 Updated reminders list:', newReminders);
        return newReminders;
      });
      setToastMessage({ type: 'success', message: 'New reminder created!' });
    });

    // Listen for reminder updates
    socket.on('reminder-updated', (data) => {
      console.log('✏️ Reminder updated:', data);
      setReminders(prev => {
        const updatedReminders = prev.map(reminder =>
          reminder._id === data.reminder._id ? data.reminder : reminder
        );
        console.log('📝 Updated reminders list:', updatedReminders);
        return updatedReminders;
      });
      setToastMessage({ type: 'success', message: 'Reminder updated!' });
    });

    // Listen for reminder deletion
    socket.on('reminder-deleted', (data) => {
      console.log('🗑️ Reminder deleted:', data);
      setReminders(prev => {
        const filteredReminders = prev.filter(reminder => reminder._id !== data.reminderId);
        console.log('📝 Updated reminders list:', filteredReminders);
        return filteredReminders;
      });
      setToastMessage({ type: 'success', message: 'Reminder deleted!' });
    });

    // Listen for reminder status changes
    socket.on('reminder-status-changed', (data) => {
      console.log('🔄 Reminder status changed:', data);
      setReminders(prev => {
        const updatedReminders = prev.map(reminder =>
          reminder._id === data.reminder._id ? data.reminder : reminder
        );
        console.log('📝 Updated reminders list:', updatedReminders);
        return updatedReminders;
      });
      setToastMessage({ type: 'success', message: 'Reminder status updated!' });
    });

    // Listen for general notifications
    socket.on('notification', (data) => {
      console.log('🔔 Notification received:', data);
      if (data.type === 'reminder') {
        setToastMessage({ type: 'success', message: data.message });
      }
    });

    // Listen for any reminder-related events
    socket.on('reminder', (data) => {
      console.log('🔔 Reminder event received:', data);
      setToastMessage({ type: 'success', message: 'Reminder notification received!' });
    });

    // Cleanup event listeners
    return () => {
      console.log('🧹 Cleaning up reminder event listeners');
      socket.off('reminder-created');
      socket.off('reminder-updated');
      socket.off('reminder-deleted');
      socket.off('reminder-status-changed');
      socket.off('notification');
      socket.off('reminder');
    };
  }, [socket]);

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.REMINDERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data: RemindersResponse = await response.json();
        setReminders(data.reminders || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 20
        });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      setAlertMessage({ type: 'error', message: 'Failed to fetch reminders' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setAlertMessage({ type: 'error', message: 'Please enter a title' });
      return;
    }
    
    if (!formData.description.trim()) {
      setAlertMessage({ type: 'error', message: 'Please enter a description' });
      return;
    }

    if (!formData.dateTime) {
      setAlertMessage({ type: 'error', message: 'Please select a date and time' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const reminderData: CreateReminderRequest = {
        title: formData.title,
        description: formData.description,
        dateTime: new Date(formData.dateTime).toISOString(),
        relatedType: formData.relatedType,
        relatedId: formData.relatedId,
        userId: formData.userId,
        status: formData.status
      };

      if (editingReminder) {
        // Update reminder
        const response = await fetch(API_ENDPOINTS.UPDATE_REMINDER(editingReminder._id), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reminderData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setReminders(prev => prev.map(reminder => 
          reminder._id === editingReminder._id ? data.reminder || data : reminder
        ));
        setAlertMessage({ type: 'success', message: 'Reminder updated successfully!' });
      } else {
        // Create reminder
        const response = await fetch(API_ENDPOINTS.CREATE_REMINDER, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reminderData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setReminders(prev => [...prev, data.reminder || data]);
        setAlertMessage({ type: 'success', message: 'Reminder created successfully!' });
      }

      createRefreshEvent();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving reminder:", error);
      setAlertMessage({ type: 'error', message: 'Failed to save reminder' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_REMINDER(id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setReminders(prev => prev.filter(reminder => reminder._id !== id));
      setAlertMessage({ type: 'success', message: 'Reminder deleted successfully!' });
      createRefreshEvent();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      setAlertMessage({ type: 'error', message: 'Failed to delete reminder' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReminder(null);
    setFormData({
      title: "",
      description: "",
      dateTime: "",
      relatedType: "lead",
      relatedId: "",
      userId: "",
      status: "pending"
    });
  };

  const handleAddNew = () => {
    setEditingReminder(null);
    setFormData({
      title: "",
      description: "",
      dateTime: "",
      relatedType: "lead",
      relatedId: "",
      userId: "",
      status: "pending"
    });
    setIsModalOpen(true);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description,
      dateTime: reminder.dateTime,
      relatedType: reminder.relatedType,
      relatedId: reminder.relatedId,
      userId: reminder.userId._id,
      status: reminder.status
    });
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    const getIcon = (status: string) => {
      switch (status) {
        case 'pending': return 'solar:clock-circle-line-duotone';
        case 'sent': return 'solar:check-circle-line-duotone';
        case 'completed': return 'solar:checkmark-circle-line-duotone';
        case 'cancelled': return 'solar:close-circle-line-duotone';
        default: return 'solar:clock-circle-line-duotone';
      }
    };
    
    return (
      <Badge color={statusOption?.color as any} size="sm">
        <Icon icon={getIcon(status)} className="mr-1" />
        {statusOption?.label}
      </Badge>
    );
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter reminders based on date filter
  const getFilteredReminders = () => {
    if (dateFilter === 'all') {
      return reminders;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.dateTime);
      const reminderDateOnly = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());

      switch (dateFilter) {
        case 'today':
          return reminderDateOnly.getTime() === today.getTime();
        case 'tomorrow':
          return reminderDateOnly.getTime() === tomorrow.getTime();
        case 'thisWeek':
          return reminderDateOnly >= startOfWeek && reminderDateOnly <= endOfWeek;
        case 'thisMonth':
          return reminderDateOnly >= startOfMonth && reminderDateOnly <= endOfMonth;
        default:
          return true;
      }
    });
  };

  const filteredReminders = getFilteredReminders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40"></div>
        
        <div className="relative z-10 px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="text-white">
                <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Reminders
                </h1>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
                  Manage and track all your reminder activities with leads and prospects
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                    <Icon icon="solar:calendar-line-duotone" className="text-2xl" />
                    <span className="font-semibold">
                      {dateFilter === 'all' ? pagination.totalItems : filteredReminders.length} 
                      {dateFilter === 'all' ? ' Total' : ` ${dateFilterOptions.find(opt => opt.value === dateFilter)?.label}`} Reminders
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                    <Icon icon="solar:clock-circle-line-duotone" className="text-2xl" />
                    <span className="font-semibold">{filteredReminders.filter(r => r.status === 'pending').length} Pending</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                    <Icon icon="solar:check-circle-line-duotone" className="text-2xl" />
                    <span className="font-semibold">{filteredReminders.filter(r => r.status === 'completed').length} Completed</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleAddNew} 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                >
                  <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                  Add Reminder
                </Button>
                <Button 
                  onClick={() => {
                    console.log('🧪 Testing WebSocket connection...');
                    console.log('Socket:', socket);
                    console.log('Connected:', connected);
                    if (socket) {
                      console.log('Socket ID:', socket.id);
                      console.log('Socket connected:', socket.connected);
                      // Test emit
                      socket.emit('test-event', { message: 'Hello from frontend!' });
                    }
                  }}
                  color="light" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                >
                  <Icon icon="solar:settings-line-duotone" className="mr-2" />
                  Test WebSocket
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-12 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Alert Messages */}
          {alertMessage && (
            <Alert
              color={alertMessage.type === 'success' ? 'success' : 'failure'}
              onDismiss={() => setAlertMessage(null)}
            >
              {alertMessage.message}
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Total Follow-ups Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4">
                      <Icon icon="solar:calendar-line-duotone" className="text-3xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {dateFilter === 'all' ? pagination.totalItems : filteredReminders.length}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {dateFilter === 'all' ? 'Total' : dateFilterOptions.find(opt => opt.value === dateFilter)?.label} Reminders
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">All Time</div>
                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                      <Icon icon="solar:chart-line-duotone" className="mr-1" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Follow-ups Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="p-3 bg-yellow-500/10 rounded-xl w-fit mb-4">
                      <Icon icon="solar:clock-circle-line-duotone" className="text-3xl text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {filteredReminders.filter(r => r.status === 'pending').length}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Pending
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Awaiting Action</div>
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                      <Icon icon="solar:clock-circle-line-duotone" className="mr-1" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Follow-ups Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="p-3 bg-green-500/10 rounded-xl w-fit mb-4">
                      <Icon icon="solar:check-circle-line-duotone" className="text-3xl text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {filteredReminders.filter(r => r.status === 'completed').length}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Completed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Success Rate</div>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <Icon icon="solar:check-circle-line-duotone" className="mr-1" />
                      <span className="text-sm font-medium">Done</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-ups Table */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Icon icon="solar:calendar-line-duotone" className="text-2xl text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Reminders</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your reminder activities</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Date Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:filter-line-duotone" className="text-gray-500" />
                    <Select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as any)}
                      className="min-w-[150px] bg-white dark:bg-gray-700"
                    >
                      {dateFilterOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-500/10 rounded-full px-4 py-2">
                    <Icon icon="solar:calendar-line-duotone" className="text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {filteredReminders.length} Reminder{filteredReminders.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredReminders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Icon icon="solar:calendar-line-duotone" className="text-3xl text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {dateFilter === 'all' ? 'No Reminders' : `No Reminders for ${dateFilterOptions.find(opt => opt.value === dateFilter)?.label}`}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {dateFilter === 'all' 
                        ? 'Get started by creating your first reminder' 
                        : 'Try changing the filter or create a new reminder'
                      }
                    </p>
                    <Button onClick={handleAddNew} color="purple" size="sm">
                      <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                      Create First Reminder
                    </Button>
                  </div>
                ) : (
                  filteredReminders.map((reminder) => (
                    <div key={reminder._id} className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-600/30 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Icon icon="solar:calendar-line-duotone" className="text-xl text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{reminder.title}</h4>
                              {getStatusBadge(reminder.status)}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{reminder.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:clock-circle-line-duotone" className="text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  <strong>Scheduled:</strong> {formatDateTime(reminder.dateTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:user-line-duotone" className="text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  <strong>Assigned to:</strong> {reminder.userId.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:target-line-duotone" className="text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  <strong>{reminder.relatedType.charAt(0).toUpperCase() + reminder.relatedType.slice(1)} ID:</strong> {reminder.relatedId}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:calendar-add-line-duotone" className="text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  <strong>Created:</strong> {formatDateTime(reminder.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="info"
                            onClick={() => handleEdit(reminder)}
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            <Icon icon="solar:pen-line-duotone" className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => handleDelete(reminder._id)}
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal show={isModalOpen} onClose={handleCloseModal} size="4xl">
        <Modal.Header>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
              <Icon icon="solar:calendar-line-duotone" className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your reminder activities</p>
            </div>
          </div>
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body className="max-h-[80vh] overflow-y-auto bg-gray-50 dark:bg-gray-800">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-300 dark:border-purple-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg mr-3">
                    <Icon icon="solar:calendar-line-duotone" className="text-purple-600 dark:text-purple-400 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title" value="Title *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="title"
                      type="text"
                      placeholder="Enter reminder title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full mt-2 bg-white dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status" value="Status *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full mt-2 bg-white dark:bg-gray-700"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="mt-6">
                  <Label htmlFor="description" value="Description *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <textarea
                      id="description"
                      placeholder="Enter reminder description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
              </div>

              {/* Date and Time */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-300 dark:border-blue-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                    <Icon icon="solar:clock-circle-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Date & Time</h3>
                </div>
                
                <div>
                  <Label htmlFor="dateTime" value="Scheduled Date & Time *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                  <TextInput
                    id="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                    required
                    className="w-full mt-2 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Assignment */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-300 dark:border-green-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg mr-3">
                    <Icon icon="solar:user-line-duotone" className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Assignment</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="userId" value="User ID *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="userId"
                      type="text"
                      placeholder="Enter user ID..."
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      required
                      className="w-full mt-2 bg-white dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="relatedType" value="Related Type *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <Select
                      id="relatedType"
                      value={formData.relatedType}
                      onChange={(e) => setFormData({ ...formData, relatedType: e.target.value as any })}
                      required
                      className="w-full mt-2 bg-white dark:bg-gray-700"
                    >
                      {relatedTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="mt-6">
                  <Label htmlFor="relatedId" value="Related ID *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                  <TextInput
                    id="relatedId"
                    type="text"
                    placeholder="Enter related ID..."
                    value={formData.relatedId}
                    onChange={(e) => setFormData({ ...formData, relatedId: e.target.value })}
                    required
                    className="w-full mt-2 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Icon icon="solar:check-circle-line-duotone" className="mr-2" />
              )}
              {editingReminder ? 'Update' : 'Create'} Reminder
            </Button>
            <Button color="gray" onClick={handleCloseModal} className="w-full sm:w-auto">
              <Icon icon="solar:close-circle-line-duotone" className="mr-2" />
              Cancel
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Toast>
            <div className="flex items-center">
              <Icon 
                icon={toastMessage.type === 'success' ? 'solar:check-circle-line-duotone' : 
                      toastMessage.type === 'error' ? 'solar:close-circle-line-duotone' : 
                      'solar:info-circle-line-duotone'} 
                className={`text-lg mr-2 ${
                  toastMessage.type === 'success' ? 'text-green-500' : 
                  toastMessage.type === 'error' ? 'text-red-500' : 
                  'text-blue-500'
                }`} 
              />
              <div className="ml-3 text-sm font-normal">
                {toastMessage.message}
              </div>
            </div>
            <Toast.Toggle onDismiss={() => setToastMessage(null)} />
          </Toast>
        </div>
      )}
    </div>
  );
};

export default FollowUpsPage;
