# Backend Setup for Image Serving

## Issue
Images are being saved locally but not displaying in the frontend because the backend is not configured to serve static files.

## Solution
Add static file serving to your backend server.

### For Express.js Backend:

Add this line to your main server file (usually `app.js` or `server.js`):

```javascript
// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));
```

### Complete Example:

```javascript
const express = require('express');
const app = express();

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Your other routes
app.use('/api', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Directory Structure:
```
your-backend/
├── uploads/
│   └── cpsourcing/
│       ├── 1757666859015-live-selfie.jpeg
│       └── 1757671649596-live-selfie.jpeg
├── app.js (or server.js)
└── package.json
```

### Testing:
After adding the static file serving:

1. Restart your backend server
2. Test the URL: `http://localhost:5000/uploads/cpsourcing/1757666859015-live-selfie.jpeg`
3. The image should load directly in the browser
4. Images should now display in the frontend

### Alternative Solutions:

1. **Use a CDN** (like Cloudinary, AWS S3)
2. **Base64 encode images** and store in database
3. **Use a file upload service** (like Multer with proper serving)

### Current Image URLs:
- Frontend generates: `http://localhost:5000/uploads/cpsourcing/1757666859015-live-selfie.jpeg`
- Backend should serve from: `./uploads/cpsourcing/1757666859015-live-selfie.jpeg`

