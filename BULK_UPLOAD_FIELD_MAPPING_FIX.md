# Bulk Upload Field Mapping Fix

## Issue
After bulk upload, leads were showing "N/A" for name, email, and contact fields in the leads table.

## Root Cause
The backend stores bulk upload data with **lowercase** field names in `customData`:
- `customData.name`
- `customData.email`  
- `customData.contact`

But the frontend `transformLeadData` function was only checking for **Title Case** names:
- `customData["First Name"]`
- `customData["Email"]`
- `customData["Phone"]`

## Solution Applied

Updated the `transformLeadData` function to support **BOTH formats** with fallback logic:

### Before:
```typescript
name: `${lead.customData?.["First Name"] || ''}`.trim() || 'N/A',
email: lead.customData?.["Email"] || 'N/A',
phone: lead.customData?.["Phone"] || 'N/A',
```

### After:
```typescript
name: lead.customData?.["First Name"] || lead.customData?.name || 'N/A',
email: lead.customData?.["Email"] || lead.customData?.email || 'N/A',
phone: lead.customData?.["Phone"] || lead.customData?.phone || lead.customData?.contact || 'N/A',
notes: lead.customData?.["Notes"] || lead.customData?.notes || '',
```

## Fallback Priority

The system now checks in this order:

**Name Field:**
1. `customData["First Name"]` (manually created leads)
2. `customData.name` (bulk uploaded leads)
3. `'N/A'` (if neither exists)

**Email Field:**
1. `customData["Email"]` (manually created leads)
2. `customData.email` (bulk uploaded leads)
3. `'N/A'` (if neither exists)

**Phone Field:**
1. `customData["Phone"]` (manually created leads)
2. `customData.phone` (bulk uploaded leads - direct phone field)
3. `customData.contact` (bulk uploaded leads - contact field)
4. `'N/A'` (if none exist)

**Notes Field:**
1. `customData["Notes"]` (manually created leads)
2. `customData.notes` (bulk uploaded leads)
3. `''` (empty string if neither exists)

## Result
✅ **Both manually created and bulk uploaded leads now display correctly**
✅ **Backward compatible with existing data**
✅ **Supports both field naming conventions**

## Files Modified
- ✅ `DeltaFrontend/src/app/(DashboardLayout)/apps/leads/page.tsx` - Leads list page (lines 660-664)
- ✅ `DeltaFrontend/src/app/(DashboardLayout)/apps/leads/[id]/page.tsx` - Lead detail page
  - Contact Information display (lines 2113, 2151, 2173)
  - Additional fields display (lines 2237, 2251, 2269, 2281, 2299, 2311)
  - Edit form initialization (lines 414-436)
  - Modal form pre-fill (lines 1288-1298, 1326-1336)
  - Sidebar summary (lines 4027, 4035, 4043, 4051)
  - Activity log old data (lines 1091-1109)
  - Activity log new data (lines 1177-1193)

## Testing
After this fix, you should see:
- ✅ Lead names displaying properly (e.g., "Sarah Williams", "Robert Johnson")
- ✅ Contact numbers displaying (e.g., "9876543213", "9876543212")
- ✅ Email addresses displaying (e.g., "sarah@example.com")
- ✅ User assignment showing correctly (e.g., "harsh" instead of "N/A")

## Note for Backend Team
Consider standardizing the field names to avoid this mismatch:
- Either use Title Case with spaces: `"First Name"`, `"Email"`, `"Phone"`
- Or use camelCase: `firstName`, `email`, `phone`
- Current mixed approach requires frontend fallback logic
