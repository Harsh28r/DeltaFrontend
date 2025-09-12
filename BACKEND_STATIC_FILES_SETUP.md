# Backend Static Files Setup

## Current Issue
Your backend is saving images to local directories but not serving them as static files, so the frontend can't display them.

## Solution
Add static file serving to your main server file.

## Step 1: Find Your Main Server File
Look for files like:
- `app.js`
- `server.js` 
- `index.js`
- `bin/www`

## Step 2: Add Static File Serving
Add these lines to your main server file:

```javascript
const express = require('express');
const app = express();

// Your existing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ADD THESE LINES FOR STATIC FILE SERVING:
// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Alternative: Serve specific directories
app.use('/uploads/channelpartners', express.static('uploads/channelpartners'));
app.use('/uploads/cpsourcing', express.static('uploads/cpsourcing'));

// Your existing routes
app.use('/api', routes);
```

## Step 3: Directory Structure
Make sure your backend has this structure:
```
your-backend/
├── uploads/
│   ├── channelpartners/
│   │   ├── 1757666859015-photo.jpg
│   │   └── 1757666859016-photo.jpg
│   └── cpsourcing/
│       ├── 1757666859015-live-selfie.jpeg
│       └── 1757671649596-live-selfie.jpeg
├── app.js (or server.js)
└── package.json
```

## Step 4: Test URLs
After adding static file serving, these URLs should work:
- `http://localhost:5000/uploads/channelpartners/1757666859015-photo.jpg`
- `http://localhost:5000/uploads/cpsourcing/1757666859015-live-selfie.jpeg`

## Step 5: Restart Your Backend
```bash
# Stop your current backend server (Ctrl+C)
# Then restart it
npm start
# or
node app.js
```

## Verification
1. Open browser and go to: `http://localhost:5000/uploads/cpsourcing/1757666859015-live-selfie.jpeg`
2. You should see the image directly
3. If it works, images will display in your frontend

## Common Issues
- **404 Error**: Check if the file path in database matches the actual file location
- **Permission Error**: Make sure the uploads directory has read permissions
- **Path Mismatch**: Ensure the static path matches the directory structure

## Your Current Multer Configuration
```javascript
// Channel Partners - saves to uploads/channelpartners/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/channelpartners';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
```

Make sure your CP Sourcing has similar configuration for `uploads/cpsourcing/` directory.
