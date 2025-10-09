# Lead Bulk Upload Guide

## Overview
This guide explains how to bulk upload leads using CSV or Excel files.

## Supported File Formats
- CSV (.csv)
- Excel (.xls, .xlsx)

## Required Fields
- **name** OR (**firstName** AND **lastName**) - Lead's full name or separate first/last name
- **projectName** OR **projectId** - Project associated with the lead

## Optional Fields

### User Assignment
- **userEmail** - Email address of the user to assign the lead to (system will find user by email)
- **userId** - MongoDB ObjectId of the user (24-character hex string)
- If neither is provided, the lead will be assigned to the current logged-in user

### Project Assignment
- **projectName** - Name of the project (case-insensitive search)
- **projectId** - MongoDB ObjectId of the project (24-character hex string)

### Lead Source
- **leadSource** OR **leadSourceName** - Name of the lead source (e.g., "Website", "Referral", "Channel Partner")
- **leadSourceId** - MongoDB ObjectId of the lead source
- If not provided, defaults to "Channel Partner"

### Channel Partner (when lead source is "Channel Partner")
- **channelPartnerName** OR **Channel Partner Name** - Name of the channel partner (case-insensitive search)
- **channelPartnerPhone** OR **Channel Partner Phone** OR **Channel Partner Number** - Phone number of the channel partner (exact match, 10 digits)
- **channelPartnerId** - MongoDB ObjectId of the channel partner
- Note: System will first try to find by phone number (if provided), then by name. You can provide either phone or name or both.

### Lead Contact Information
- **phone** OR **contact** - Lead's phone number
- **email** - Lead's email address

### Additional Lead Information
- **leadPriority** OR **priority** OR **Lead Priority** - Priority level (e.g., "High", "Medium", "Low")
- **propertyType** OR **Property Type** - Type of property (e.g., "Residential", "Commercial")
- **fundingMode** OR **Funding Mode** - How the lead plans to fund (e.g., "Home Loan", "Cash", "Bank Finance")
- **gender** OR **Gender** - Lead's gender

## Column Name Variations
The system supports multiple variations of column names (case-insensitive):

| Field | Accepted Column Names |
|-------|----------------------|
| User Email | userEmail, UserEmail, User Email, email_id, Email ID |
| Project Name | projectName, ProjectName, Project Name |
| Project ID | projectId, ProjectId |
| Channel Partner Name | channelPartnerName, ChannelPartnerName, Channel Partner Name, Channel Partner |
| Channel Partner Phone | channelPartnerPhone, ChannelPartnerPhone, Channel Partner Phone, Channel Partner Number |
| Lead Priority | leadPriority, LeadPriority, Lead Priority, priority, Priority |
| Property Type | propertyType, PropertyType, Property Type |
| Funding Mode | fundingMode, FundingMode, Funding Mode |
| Gender | gender, Gender |

## Smart Detection Features

### 1. **Auto Name Resolution**
- System automatically searches for projects and channel partners by name
- All name searches are case-insensitive
- If a channel partner is not found, a clear error message is provided

### 2. **Channel Partner Lookup Priority**
- If `channelPartnerPhone` is provided, system searches by phone number FIRST (exact match)
- If not found by phone or no phone provided, system searches by `channelPartnerName`
- You can provide either phone, name, or both for best results

### 3. **User Email Lookup**
- Provide user email instead of MongoDB ObjectId
- System finds the user and assigns the lead automatically

### 4. **Flexible Input**
- If an ID field contains a name instead of a MongoDB ObjectId, the system treats it as a name field
- Example: If `channelPartnerId` contains "ABC Realty" (not a 24-char hex), it's treated as `channelPartnerName`

### 5. **Custom Data Storage**
- All additional fields are automatically stored in the lead's `customData` field
- Any unmapped columns in your CSV/Excel will also be added to `customData`

## Sample CSV Format

```csv
name,contact,email,userEmail,projectName,leadSource,channelPartnerName,channelPartnerPhone,leadPriority,propertyType,fundingMode,gender
John Doe,9876543210,john@example.com,sales@company.com,Skyline Towers,Website,,,High,Residential,Home Loan,Male
Jane Smith,9876543211,jane@example.com,sales@company.com,Green Valley,Referral,,,Medium,Commercial,Cash,Female
Robert Johnson,9876543212,robert@example.com,manager@company.com,Ocean View,Channel Partner,ABC Realty,9999888877,Low,Residential,Bank Finance,Male
Sarah Williams,9876543213,sarah@example.com,sales@company.com,Skyline Towers,Channel Partner,,9999888866,High,Residential,Home Loan,Female
```

**Note:** In the last row, only phone number is provided for channel partner (no name). System will find the channel partner by phone number.

## Error Handling
- The system validates each row independently
- If a row has errors, it will be skipped and reported in the response
- Valid rows will be imported successfully
- Response includes:
  - Total rows processed
  - Number of successful imports
  - Number of failed imports
  - Detailed error messages for each failed row

## API Endpoint
```
POST /api/leads/bulk-upload
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: CSV or Excel file (max 10MB)

**Response:**
```json
{
  "message": "Bulk upload completed",
  "summary": {
    "totalRows": 100,
    "successful": 95,
    "failed": 5
  },
  "insertedLeadIds": ["64abc123...", "64abc124..."],
  "errors": [
    {
      "row": 10,
      "data": {...},
      "error": "Project not found: 'Invalid Project'"
    }
  ]
}
```

## Best Practices

1. **Use Names Instead of IDs**: For better readability, use names (projectName, channelPartnerName, etc.) instead of MongoDB ObjectIds
2. **Use Phone Numbers for Channel Partners**: When possible, include channelPartnerPhone for accurate matching
3. **Validate Email Addresses**: Ensure userEmail entries are valid email addresses in your system
4. **Test with Small Files First**: Upload a small sample file (5-10 rows) to verify column mapping
5. **Check Error Messages**: Review error messages for failed rows to correct data issues
6. **Standardize Values**: Use consistent values for dropdowns (e.g., always "High", "Medium", "Low" for priority)

## Prerequisites

Before using bulk upload, ensure:
- All **lead sources** mentioned in your CSV exist in the system (Website, Referral, Channel Partner, etc.)
- All **projects** mentioned exist and are active
- All **user emails** are registered in the system
- **Channel partners** exist (if using Channel Partner lead source)

**To create lead sources:** Navigate to Lead Sources page (`/apps/lead-sources`) and add the sources you need.

See `BULK_UPLOAD_SETUP_INSTRUCTIONS.md` for detailed setup steps.

## Notes
- All uploaded leads will be assigned the default lead status
- Channel partners referenced in uploads will be marked as active
- Lead activities are automatically logged for all created leads
- Notifications are sent to assigned users and superadmins