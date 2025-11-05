
export interface DateTimeInfo {
  iso: string;
  formatted: string;
  date: string;
  time: string;
  relative: string;
  timestamp: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Reminder {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  relatedType: "task" | "lead" | "other";
  relatedId: string;
  userId: User;
  status: "pending" | "sent" | "completed" | "cancelled";
  createdAt: string;
}

export interface RemindersResponse {
  reminders: Reminder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  summary: {
    total: number;
    type: string;
  };
}

export interface CreateReminderRequest {
  title: string;
  description: string;
  dateTime: string;
  relatedType: "task" | "lead" | "other";
  relatedId: string;
  userId: string;
  status: "pending" | "sent" | "completed" | "cancelled";
}

export interface UpdateReminderRequest extends CreateReminderRequest {
  _id: string;
}

export type ReminderStatus = "pending" | "sent" | "completed" | "cancelled";

export interface ReminderStatusOption {
  value: ReminderStatus;
  label: string;
  color: "yellow" | "blue" | "green" | "red";
}

// Legacy exports for backward compatibility
export type FollowUp = Reminder;
export type FollowUpsResponse = RemindersResponse;
export type CreateFollowUpRequest = CreateReminderRequest;
export type UpdateFollowUpRequest = UpdateReminderRequest;
export type FollowUpStatus = ReminderStatus;
export type FollowUpStatusOption = ReminderStatusOption;
