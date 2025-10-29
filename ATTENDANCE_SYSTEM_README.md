# 🕒 Attendance Tracking System

Complete GPS-based attendance tracking system with real-time monitoring, break management, and comprehensive reporting.

## 📋 Table of Contents

- [Features](#features)
- [System Overview](#system-overview)
- [User Features](#user-features)
- [Admin Features](#admin-features)
- [File Structure](#file-structure)
- [Navigation](#navigation)
- [How to Use](#how-to-use)
- [API Integration](#api-integration)
- [Technical Details](#technical-details)

---

## ✨ Features

### For Users:
- ✅ **GPS Check-In/Check-Out** with location tracking
- ✅ **Break Management** (start/end breaks with reasons)
- ✅ **Work Location Tracking** (client visits, site visits)
- ✅ **Personal Attendance History** with detailed records
- ✅ **Real-time Location Capture** with accuracy tracking
- ✅ **Optional Selfie Upload** for verification
- ✅ **Notes & Comments** for each check-in/out

### For Administrators:
- ✅ **Live Dashboard** showing real-time status of all users
- ✅ **Comprehensive Attendance Records** with advanced filtering
- ✅ **User-Specific Attendance Details** with statistics
- ✅ **Location History Tracking** with timeline view
- ✅ **Manual Entry Creation** for missed attendance
- ✅ **Statistics & Reports** with visual analytics
- ✅ **Auto-refresh** every 30 seconds on live dashboard
- ✅ **Export Capabilities** (planned feature)

---

## 🏗️ System Overview

The attendance tracking system consists of **6 main pages** divided into user-facing and admin-facing features:

### User Pages:
1. **Check-In/Out Page** - Daily attendance management
2. **My History** - Personal attendance records

### Admin Pages:
3. **Live Dashboard** - Real-time monitoring
4. **All Attendance** - Complete attendance records with filters
5. **User Detail** - Individual user's attendance history
6. **Location History** - GPS tracking timeline
7. **Manual Entry** - Create attendance records manually
8. **Statistics** - Analytics and reports

---

## 👤 User Features

### 1. Check-In/Check-Out Page
**Path:** `/apps/attendance/check-in`

**Functionality:**
- **Current Status Display:**
  - Shows current date and time
  - Displays check-in time and hours worked
  - Break time tracking
  - On-break indicator

- **GPS Location Capture:**
  - Automatic location detection
  - Address reverse geocoding
  - Accuracy indicator (in meters)
  - Manual location refresh

- **Check-In:**
  - One-click check-in with GPS location
  - Optional notes field
  - Platform detection (mobile/desktop)
  - Timestamp recording

- **Check-Out:**
  - One-click check-out with GPS location
  - Automatic hours calculation
  - Optional notes field

- **Break Management:**
  - Start Break: Record reason for break
  - End Break: Automatic duration calculation
  - On-break status indicator

- **Work Location Tracking:**
  - Add work locations during the day
  - Record activity type (client meeting, site visit, etc.)
  - Optional notes for each location
  - GPS coordinates and address

### 2. My Attendance History
**Path:** `/apps/attendance/my-history`

**Functionality:**
- **Date Range Filters:**
  - Custom start and end dates
  - Quick filters: Last 7/30/90 days
  - Date picker integration

- **Attendance Records Table:**
  - Date, check-in time, check-out time
  - Total hours worked
  - Break time
  - Status badges (Checked In, Checked Out)

- **Expandable Details:**
  - Check-in/out locations with addresses
  - All breaks with durations
  - All work locations with activities
  - Notes and comments

- **Pagination:**
  - 30 records per page
  - Page navigation
  - Total records count

---

## 👨‍💼 Admin Features

### 3. Live Dashboard (Admin)
**Path:** `/apps/attendance/admin/dashboard`

**Functionality:**
- **Real-Time Summary Cards:**
  - Total Users
  - Checked In (with percentage)
  - Checked Out
  - Absent
  - On Break

- **Auto-Refresh:**
  - Refreshes every 30 seconds
  - Manual refresh button
  - Loading indicator

- **Tabbed View:**
  - **Checked In Users:**
    - User info (name, email, role)
    - Check-in time and location
    - Hours worked
    - Work locations count
    - On-break status
  
  - **Checked Out Users:**
    - Check-in and check-out times
    - Total hours worked
    - Final location
  
  - **Absent Users:**
    - User details
    - Role and level information

- **Search Functionality:**
  - Real-time search by name or email
  - Works across all tabs

- **Quick Actions:**
  - View detailed user attendance
  - Direct links to user detail pages

### 4. All Attendance Records (Admin)
**Path:** `/apps/attendance/admin/all-attendance`

**Functionality:**
- **Summary Cards:**
  - Total records, checked in, checked out, absent counts

- **Advanced Filters:**
  - Specific date filter
  - Date range (start and end)
  - Status filter (checked-in, checked-out, absent, on-leave)
  - Quick date buttons (Today, Yesterday)

- **Search:**
  - Filter by user name or email

- **Attendance Table:**
  - User information with role badges
  - Date and time information
  - Hours worked and break time
  - Status indicators
  - Manual entry badges

- **Expandable Details:**
  - Check-in/out locations with maps
  - Complete break history
  - Work locations timeline
  - Manual entry information

- **Pagination:**
  - 50 records per page
  - Page navigation
  - Record counts

### 5. User Attendance Detail (Admin)
**Path:** `/apps/attendance/admin/user-detail/[userId]`

**Functionality:**
- **User Profile Card:**
  - Name, email, mobile
  - Role and level badges

- **Statistics Cards:**
  - Total days worked
  - Total hours
  - Average hours per day
  - Total break time
  - Checked in/out days count
  - Work locations count
  - Attendance rate percentage

- **Date Range Filters:**
  - Custom date ranges
  - Quick filters (7/30/90 days)

- **Attendance History:**
  - Complete record with all details
  - Expandable rows for locations and breaks
  - Pagination support

- **Quick Navigation:**
  - Back to dashboard
  - View location history

### 6. Location History (Admin)
**Path:** `/apps/attendance/admin/location-history/[userId]`

**Functionality:**
- **User Information:**
  - Basic user details

- **Date Filter:**
  - Select specific date
  - Quick buttons (Today, Yesterday)

- **Location Timeline:**
  - Chronological timeline view
  - Different icons for check-in, check-out, work locations
  - Timestamps for each location
  - Full address with GPS coordinates
  - Accuracy indicators
  - Activity details for work locations
  - Notes and comments

- **Map Integration:**
  - View individual locations on Google Maps
  - View all locations on map with markers
  - Route visualization

- **Statistics:**
  - Total locations tracked
  - Count of check-ins
  - Count of check-outs
  - Count of work locations

### 7. Manual Entry (Admin)
**Path:** `/apps/attendance/admin/manual-entry`

**Functionality:**
- **User Selection:**
  - Dropdown list of all users
  - Search by name, email, or role

- **Entry Form:**
  - Date picker
  - Check-in time (required)
  - Check-out time (optional)
  - Reason for manual entry (required)
  - Additional notes (optional)

- **Validation:**
  - Required field checking
  - Date and time validation
  - Automatic time conversion to ISO format

- **Tracking:**
  - Records admin who created the entry
  - Timestamps creation
  - Clear manual entry indicator in records

- **Important Notes:**
  - Manual entries don't include location data
  - Clearly marked in the system
  - Permanent records
  - Should only be used when necessary

### 8. Statistics & Reports (Admin)
**Path:** `/apps/attendance/admin/statistics`

**Functionality:**
- **Date Range Filters:**
  - Custom start and end dates
  - Quick filters (7/30/90 days)
  - User-specific filtering

- **Overview Cards:**
  - Total attendance records
  - Total hours worked
  - Average hours per day
  - Total break time

- **Status Breakdown:**
  - Visual progress bars
  - Percentage calculations
  - Checked In count
  - Checked Out count
  - Absent count
  - On Leave count

- **Additional Stats:**
  - Total work locations
  - Average locations per attendance
  - Manual entries count and percentage

- **Report Period:**
  - Clear date range display
  - User filter indicator

---

## 📁 File Structure

```
DeltaFrontend/
├── src/
│   ├── app/
│   │   ├── (DashboardLayout)/
│   │   │   ├── apps/
│   │   │   │   └── attendance/
│   │   │   │       ├── check-in/
│   │   │   │       │   └── page.tsx              # User check-in/out page
│   │   │   │       ├── my-history/
│   │   │   │       │   └── page.tsx              # User attendance history
│   │   │   │       └── admin/
│   │   │   │           ├── dashboard/
│   │   │   │           │   └── page.tsx          # Live admin dashboard
│   │   │   │           ├── all-attendance/
│   │   │   │           │   └── page.tsx          # All attendance records
│   │   │   │           ├── user-detail/
│   │   │   │           │   └── [userId]/
│   │   │   │           │       └── page.tsx      # User-specific details
│   │   │   │           ├── location-history/
│   │   │   │           │   └── [userId]/
│   │   │   │           │       └── page.tsx      # Location timeline
│   │   │   │           ├── manual-entry/
│   │   │   │           │   └── page.tsx          # Manual entry form
│   │   │   │           └── statistics/
│   │   │   │               └── page.tsx          # Statistics & reports
│   │   │   └── types/
│   │   │       └── attendance.ts                 # TypeScript interfaces
│   │   └── api/
│   │       └── attendance/
│   │           └── attendanceService.ts          # API service functions
│   └── utils/
│       └── attendanceUtils.ts                    # Utility functions
└── ATTENDANCE_SYSTEM_README.md                   # This file
```

---

## 🧭 Navigation

The attendance system is integrated into the sidebar navigation:

**Sidebar Menu Structure:**
```
Attendance
├── Check-In/Out           → /apps/attendance/check-in
├── My History             → /apps/attendance/my-history
├── Live Dashboard         → /apps/attendance/admin/dashboard
├── All Attendance         → /apps/attendance/admin/all-attendance
├── Statistics             → /apps/attendance/admin/statistics
└── Manual Entry           → /apps/attendance/admin/manual-entry
```

**Icon:** `solar:clock-circle-line-duotone`

---

## 📖 How to Use

### For Users:

#### Daily Check-In:
1. Navigate to **Attendance > Check-In/Out**
2. Ensure location permissions are enabled
3. Wait for location to be detected
4. Click **"Check In"** button
5. Optionally add notes about your day

#### Taking a Break:
1. Go to **Attendance > Check-In/Out** (must be checked in)
2. Click **"Start Break"**
3. Enter reason (e.g., "Lunch break")
4. Click **"Start Break"**
5. When done, click **"End Break"**

#### Adding Work Location:
1. Visit client/site location
2. Go to **Attendance > Check-In/Out**
3. Click **"Add Work Location"**
4. Enter activity (e.g., "Client meeting")
5. Add optional notes
6. Click **"Add Location"**

#### Checking Out:
1. At end of day, go to **Attendance > Check-In/Out**
2. Click **"Check Out"** button
3. Optionally add notes about day's work
4. Review total hours worked

#### Viewing History:
1. Navigate to **Attendance > My History**
2. Select date range
3. Click **"Apply Filters"**
4. Click **"Details"** on any record for full information

### For Administrators:

#### Monitoring Real-Time:
1. Navigate to **Attendance > Live Dashboard**
2. View summary cards for quick overview
3. Use tabs to switch between views
4. Use search to find specific users
5. Dashboard auto-refreshes every 30 seconds

#### Viewing All Records:
1. Go to **Attendance > All Attendance**
2. Set date filters as needed
3. Select status filter if required
4. Click **"Apply Filters"**
5. Click **"Details"** for expandable information
6. Use pagination for large datasets

#### Viewing User Details:
1. From live dashboard or all attendance page
2. Click **"View"** button on any user
3. Review statistics cards
4. Set date range for history
5. Click **"View Location History"** for GPS tracking

#### Creating Manual Entry:
1. Navigate to **Attendance > Manual Entry**
2. Select user from dropdown
3. Choose date
4. Enter check-in time (required)
5. Enter check-out time (optional)
6. Provide clear reason for manual entry
7. Add any additional notes
8. Click **"Create Manual Entry"**

#### Viewing Statistics:
1. Go to **Attendance > Statistics**
2. Set date range
3. Optionally filter by specific user
4. Click **"Apply Filters"**
5. Review all metrics and breakdowns
6. Use quick date filters for common periods

---

## 🔌 API Integration

### Base URL Configuration
Set in `DeltaFrontend/src/lib/config.ts`:
```typescript
export const API_BASE_URL = 'https://your-api-url.com/api';
```

### Authentication
All API calls include JWT token from localStorage:
```typescript
const token = localStorage.getItem('token');
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### User Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/attendance/check-in` | POST | Check in with GPS location |
| `/attendance/check-out` | POST | Check out with GPS location |
| `/attendance/status` | GET | Get current attendance status |
| `/attendance/break/start` | POST | Start a break |
| `/attendance/break/end` | POST | End current break |
| `/attendance/work-location` | POST | Add work location |
| `/attendance/my-history` | GET | Get personal attendance history |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/attendance/admin/live` | GET | Get live dashboard data |
| `/attendance/admin/all` | GET | Get all attendance records |
| `/attendance/admin/user/:userId` | GET | Get user-specific details |
| `/attendance/admin/location-history/:userId` | GET | Get location history |
| `/attendance/admin/stats` | GET | Get attendance statistics |
| `/attendance/admin/manual-entry` | POST | Create manual entry |
| `/attendance/admin/:attendanceId` | PUT | Update attendance record |
| `/attendance/admin/:attendanceId` | DELETE | Delete attendance record |

### Example API Call
```typescript
import { checkIn } from '@/app/api/attendance/attendanceService';

const handleCheckIn = async () => {
  const location = await getCurrentLocation();
  const address = await reverseGeocode(location.latitude, location.longitude);
  
  await checkIn({
    latitude: location.latitude,
    longitude: location.longitude,
    address: address,
    accuracy: location.accuracy,
    notes: 'Starting my day',
    platform: 'desktop'
  });
};
```

---

## 🛠️ Technical Details

### Technologies Used:
- **React 18+** with Next.js 14+
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Flowbite React** for UI components
- **Tabler Icons** for icon library
- **Browser Geolocation API** for GPS tracking
- **OpenStreetMap Nominatim** for reverse geocoding (free, no API key)

### Key Features:

#### GPS Location Tracking:
```typescript
// High accuracy location capture
navigator.geolocation.getCurrentPosition(
  callback,
  errorCallback,
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
);
```

#### Reverse Geocoding:
```typescript
// Convert coordinates to address
const address = await reverseGeocode(latitude, longitude);
// Uses OpenStreetMap Nominatim API (free)
```

#### Auto-Refresh:
```typescript
// Live dashboard refreshes every 30 seconds
useEffect(() => {
  const interval = setInterval(() => fetchDashboard(true), 30000);
  return () => clearInterval(interval);
}, []);
```

#### Time Calculations:
```typescript
// Automatic hours calculation
const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
const activeWorkTime = hours - (breakTime / 60);
```

### Data Structures:

#### Attendance Interface:
```typescript
interface Attendance {
  _id: string;
  user: UserBasic;
  date: string;
  checkIn: CheckInOut;
  checkOut: CheckInOut;
  totalHours: number;
  activeWorkTime: number;
  status: 'checked-in' | 'checked-out' | 'absent' | 'on-leave';
  breaks: Break[];
  totalBreakTime: number;
  workLocations: WorkLocation[];
  isManualEntry: boolean;
  manualEntryBy?: UserBasic;
  manualEntryReason?: string;
}
```

### Utility Functions:
- `formatHours()` - Convert decimal hours to "Xh Ym" format
- `formatDuration()` - Convert minutes to "Xh Ym" format
- `getStatusColor()` - Get Flowbite color for status badges
- `reverseGeocode()` - Convert GPS to address
- `getCurrentLocation()` - Get user's GPS location
- `calculateDistance()` - Calculate distance between coordinates
- `isToday()` - Check if date is today
- `getDateRange()` - Get date range for filters

---

## 🎨 UI/UX Features

### Color Coding:
- **Green** - Check-In, Success, Checked Out
- **Red** - Check-Out, Absent, Failure
- **Blue** - General info, Checked In
- **Orange** - Breaks, On Break, Warning
- **Purple** - Work Locations
- **Gray** - Neutral, Inactive

### Icons:
- ⏰ **Clock** - Time related
- 📍 **Map Pin** - Location related
- ➡️ **Login** - Check-in
- ⬅️ **Logout** - Check-out
- ☕ **Coffee** - Breaks
- 💼 **Briefcase** - Work locations
- 👤 **User** - User profiles
- 📊 **Chart** - Statistics

### Responsive Design:
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly buttons
- Optimized for both desktop and mobile use

### Accessibility:
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Clear error messages
- Loading indicators

---

## 🔒 Security & Privacy

### Data Protection:
- JWT token authentication required for all endpoints
- Location data encrypted in transit
- No location data stored for manual entries
- Clear audit trail for manual entries

### Privacy Features:
- Users can only view their own attendance
- Admins have full access (permission-based)
- Location accuracy displayed to users
- Optional selfie capture (not required)

### Permissions:
- Browser geolocation permission required
- Clear prompts for location access
- Graceful handling of denied permissions
- Manual location refresh option

---

## 📝 Best Practices

### For Users:
1. **Enable Location:** Always allow location access for accurate tracking
2. **Check-In Early:** Check in at the start of your work day
3. **Record Breaks:** Start and end breaks properly
4. **Add Work Locations:** Record all client visits and site visits
5. **Notes Are Helpful:** Add notes to provide context
6. **Check-Out:** Don't forget to check out at end of day

### For Administrators:
1. **Monitor Regularly:** Check live dashboard throughout the day
2. **Manual Entries:** Use only when absolutely necessary
3. **Provide Clear Reasons:** Always explain manual entries
4. **Review Statistics:** Regularly review attendance patterns
5. **Verify Locations:** Check location history for accuracy
6. **Export Data:** Regularly export for backup (when feature is available)

---

## 🚀 Future Enhancements (Planned)

- ✨ Geofencing (check-in only within office radius)
- ✨ Face recognition for selfie verification
- ✨ Shift management and scheduling
- ✨ Leave management integration
- ✨ Overtime calculation
- ✨ Attendance policies and rules
- ✨ Email notifications for missed check-ins
- ✨ Mobile app for easier access
- ✨ Offline mode with sync
- ✨ Advanced analytics and insights
- ✨ CSV/PDF export functionality
- ✨ Custom report builder
- ✨ Integration with payroll systems

---

## 🆘 Troubleshooting

### Location Not Working:
1. Check browser location permissions
2. Try manual refresh button
3. Ensure GPS is enabled on device
4. Check internet connectivity

### Check-In Failing:
1. Verify you're not already checked in
2. Check if you checked out yesterday
3. Ensure location is detected
4. Contact admin if issue persists

### Data Not Loading:
1. Check internet connection
2. Verify you're logged in
3. Try refreshing the page
4. Clear browser cache if needed

### Manual Entry Issues:
1. Ensure all required fields are filled
2. Check date and time format
3. Provide clear reason
4. Contact system admin if needed

---

## 📞 Support

For technical issues or questions:
- Contact your system administrator
- Refer to the API documentation
- Check browser console for errors
- Review this README for guidance

---

## 📄 License

This attendance tracking system is part of the Delta CRM project.

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Developed By:** Delta CRM Team




















