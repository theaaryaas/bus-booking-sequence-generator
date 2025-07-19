# Deployment Guide

This guide will help you deploy the Bus Booking Sequence Generator to GitHub, Render (backend), and Vercel (frontend).

## Prerequisites

- GitHub account
- Render account (free tier available)
- Vercel account (free tier available)
- Git installed on your local machine

## Step 1: Upload to GitHub

### 1.1 Initialize Git Repository

```bash
# Navigate to your project directory
cd busBookingPreference

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Bus Booking Sequence Generator"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., `bus-booking-sequence-generator`)
4. Make it public or private as per your preference
5. Don't initialize with README (since we already have one)
6. Click "Create repository"
7. Follow the commands shown in step 1.1

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to [Render](https://render.com) and sign up
2. Connect your GitHub account

### 2.2 Deploy Backend Service

1. In Render dashboard, click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `bus-booking-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

4. Click "Create Web Service"
5. Wait for deployment to complete
6. Copy the generated URL (e.g., `https://bus-booking-backend.onrender.com`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to [Vercel](https://vercel.com) and sign up
2. Connect your GitHub account

### 3.2 Deploy Frontend

1. In Vercel dashboard, click "New Project"
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

4. Add Environment Variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://bus-booking-backend.onrender.com`)

5. Click "Deploy"
6. Wait for deployment to complete
7. Copy the generated URL (e.g., `https://bus-booking-frontend.vercel.app`)

## Step 4: Update Configuration (if needed)

### 4.1 Update CORS in Backend

If you encounter CORS issues, update the server configuration:

```javascript
// In server/index.js
app.use(cors({
  origin: ['https://your-frontend-url.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

### 4.2 Update Environment Variables

Make sure your environment variables are correctly set:

**Vercel (Frontend)**:
- `REACT_APP_API_URL`: Your Render backend URL

**Render (Backend)**:
- `NODE_ENV`: `production`
- `PORT`: `10000` (or let Render assign automatically)

## Step 5: Test Your Deployment

1. Visit your Vercel frontend URL
2. Test file upload functionality
3. Test manual input functionality
4. Verify that the API calls are working correctly

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure your backend CORS configuration includes your frontend URL
   - Check that the API URL is correctly set in environment variables

2. **Build Failures**:
   - Check that all dependencies are properly listed in package.json
   - Verify that the build commands are correct

3. **API Connection Issues**:
   - Verify the API URL is correct in your frontend environment variables
   - Check that your backend is running and accessible

4. **File Upload Issues**:
   - Ensure your backend has proper file upload handling
   - Check file size limits and supported formats

### Debugging

1. **Check Logs**:
   - Render: Go to your service dashboard and check the logs
   - Vercel: Go to your project dashboard and check the function logs

2. **Test Locally**:
   - Test your application locally first to ensure it works
   - Use the same environment variables locally

3. **API Testing**:
   - Use tools like Postman to test your API endpoints directly
   - Verify that your backend endpoints are working correctly

## Maintenance

### Updates

1. Make changes to your code
2. Commit and push to GitHub
3. Render and Vercel will automatically redeploy

### Monitoring

1. **Render**: Monitor your service usage and logs
2. **Vercel**: Check your project analytics and performance
3. **GitHub**: Keep your repository updated and secure

## Cost Considerations

- **Render Free Tier**: 750 hours/month, 512MB RAM
- **Vercel Free Tier**: Unlimited deployments, 100GB bandwidth
- **GitHub Free Tier**: Unlimited public repositories

For production use, consider upgrading to paid plans for better performance and support.

## Security Notes

1. Never commit sensitive information like API keys
2. Use environment variables for configuration
3. Regularly update dependencies
4. Monitor your application for security issues

## Support

If you encounter issues:

1. Check the documentation for each platform
2. Review the logs for error messages
3. Test locally to isolate issues
4. Consider reaching out to the platform support teams 