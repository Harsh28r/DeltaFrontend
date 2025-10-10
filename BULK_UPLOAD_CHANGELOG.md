# Lead Bulk Upload - Changelog

## Latest Update

### Removed Fields
- ❌ **sourcingPersonName** / **cpSourcingName** - No longer supported
- ❌ **configuration** - Removed from template
- ❌ **budget** - Removed from template

### Added Fields
- ✅ **channelPartnerPhone** - Phone number lookup for channel partners (10 digits)

### Key Changes

#### Channel Partner Lookup Priority
The system now searches for channel partners using a priority system:
1. **First**: Search by `channelPartnerPhone` (if provided) - Exact match
2. **Second**: Search by `channelPartnerName` (if phone not found or not provided)
3. You can provide either phone, name, or both

#### Updated CSV Structure
```csv
name,contact,email,userEmail,projectName,leadSource,channelPartnerName,channelPartnerPhone,leadPriority,propertyType,fundingMode,gender
```

### Before vs After

**Before:**
```csv
name,contact,email,userEmail,projectName,leadSource,channelPartnerName,sourcingPersonName,leadPriority,propertyType,configuration,fundingMode,budget,gender
```

**After:**
```csv
name,contact,email,userEmail,projectName,leadSource,channelPartnerName,channelPartnerPhone,leadPriority,propertyType,fundingMode,gender
```

### Benefits

1. **Faster Channel Partner Matching**: Phone numbers provide exact matches
2. **Simpler Template**: Fewer optional fields to confuse users
3. **More Reliable**: Phone-first lookup reduces errors from name variations
4. **Cleaner Data**: Focused on essential lead information

### Migration Notes

If you have existing CSV files with the old format:
- Remove `sourcingPersonName`, `configuration`, and `budget` columns
- Add `channelPartnerPhone` column (leave blank if not available)
- The system will still work with just `channelPartnerName` if phone is not provided

### Example Usage

**With Phone Only:**
```csv
...,Channel Partner,,9999888866,...
```
System searches by phone and finds the channel partner.

**With Name Only:**
```csv
...,Channel Partner,ABC Realty,,...
```
System searches by name (case-insensitive).

**With Both (Recommended):**
```csv
...,Channel Partner,ABC Realty,9999888877,...
```
System tries phone first, falls back to name if needed.





