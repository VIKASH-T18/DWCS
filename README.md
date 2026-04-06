# Digital Workflow Control System (DWCS)

## Project Overview
DWCS is a comprehensive platform designed for academic and professional use to manage complex business workflows. It allows users to define custom workflow steps, assign tasks to team members, and track real-time progress through various stages of completion.

## Features
- **Role-Based Access Control (RBAC)**: Admin, Manager, and Employee roles.
- **Dynamic Workflow Definition**: Create multi-step approval processes.
- **Real-time Task Tracking**: Monitor assignments and statuses.
- **Secure Authentication**: JWT-based login and session management.

## Tech Stack
- **Frontend**: React.js, Context API
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT, Bcrypt

## Deployment & Performance
### Deployment Guide
1. **Frontend (Vercel)**:
   - Connect GitHub repo.
   - Set Build Command: `npm run build`.
   - Set Output Directory: `dist`.
2. **Backend (Render/Heroku)**:
   - Set environment variables ($JWT_SECRET, $MONGODB_URI).
   - Start Command: `npm start`.
3. **Database (MongoDB Atlas)**:
   - Create a free cluster.
   - Whitelist "0.0.0.0/0" for acadmic testing or specific IPs for production.
   - Use the connection string in your backend `.env`.

### Performance Optimizations
- **Code Splitting**: Used Vite's default dynamic imports.
- **Stateless Auth**: JWT eliminates session storage overhead on the server.
- **Indexing**: User email and username fields are indexed in MongoDB for O(1) lookups.
- **Minification**: Production builds are minified and optimized for speed.

## Testing
Run `npm test` in the `server` directory to execute unit tests for the Authentication system.

---
*Created for Academic Evaluation - DWCS v1.0*
