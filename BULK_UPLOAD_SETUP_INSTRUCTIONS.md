# Lead Bulk Upload - Setup Instructions

## Prerequisites

Before using bulk upload, ensure these lead sources exist in your system:

### Required Lead Sources

Navigate to **Lead Sources** page (`/apps/lead-sources` or `/apps/lead-management`) and create:

1. **Website** - For leads coming from your website
2. **Referral** - For leads from referrals
3. **Channel Partner** - For leads from channel partners (usually already exists)

### How to Create Lead Sources

1. Go to: `/apps/lead-sources` or `/apps/lead-management`
2. Click **"Add Lead Source"** button
3. Enter the name (e.g., "Website", "Referral")
4. Click **"Create"**

## Common Lead Sources Examples

Here are common lead sources you might want to create:

- **Website** - Direct website inquiries
- **Referral** - Customer referrals
- **Channel Partner** - Partner-sourced leads
- **Social Media** - Facebook, Instagram, etc.
- **Walk-in** - Direct office visits
- **Call Center** - Phone inquiries
- **Email Campaign** - Marketing emails
- **Online Ads** - Google Ads, Facebook Ads
- **Trade Show** - Events and exhibitions
- **Cold Call** - Outbound calling

## Troubleshooting Bulk Upload Errors

### Error: "Lead source not found: 'Website'"

**Solution:** Create the lead source "Website" in your system first.

1. Go to Lead Sources management
2. Add "Website" as a new lead source
3. Try the bulk upload again

### Error: "Project not found: 'Project Name'"

**Solution:** Ensure the project name in your CSV exactly matches an existing project name (case-insensitive).

### Error: "Channel partner not found"

**Solution:** If using `channelPartnerName`, ensure the channel partner exists. If using `channelPartnerPhone`, ensure the phone number matches exactly (10 digits).

### Error: "User not found: 'email@example.com'"

**Solution:** Ensure the user email exists in your system and the user has access to the project.

## Best Practices

1. **Create all lead sources BEFORE bulk upload**
2. **Use exact names** - Lead source names must match exactly (case-insensitive)
3. **Test with 1-2 rows first** - Verify everything works before uploading large files
4. **Check error messages** - They tell you exactly what's missing

## Quick Setup Checklist

- [ ] Create lead source: "Website"
- [ ] Create lead source: "Referral"  
- [ ] Verify "Channel Partner" lead source exists
- [ ] Verify all projects mentioned in CSV exist
- [ ] Verify all user emails in CSV are registered
- [ ] Download and check the template
- [ ] Test upload with 2-3 sample rows
- [ ] Review any errors before full upload
