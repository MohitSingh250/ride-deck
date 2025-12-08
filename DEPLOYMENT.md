# Deployment Guide: Netlify & Render 🚀

This guide covers deploying the **RideDeck** application using **Netlify** for the Frontend and **Render** for the Backend.

## Prerequisites
1.  **GitHub Account**: Code pushed to [GitHub](https://github.com/MohitSingh250/ride-deck).
2.  **MongoDB Atlas Account**: For the database.
3.  **Render Account**: For the backend.
4.  **Netlify Account**: For the frontend.

---

## Step 1: Database Setup (MongoDB Atlas) 🍃

1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a **Cluster** (Free tier).
3.  **Database Access**: Create a user (e.g., `admin`) and password.
4.  **Network Access**: Whitelist IP `0.0.0.0/0`.
5.  **Get Connection String**:
    *   Connect > Drivers.
    *   Copy string (e.g., `mongodb+srv://admin:<password>@cluster0...`).
    *   Replace `<password>` with your actual password.

---

## Step 2: Backend Deployment (Render) 🛠️

1.  Log in to [Render](https://dashboard.render.com/).
2.  Click **"New +"** > **"Web Service"**.
3.  Connect your GitHub repo (`ride-deck`).
4.  **Settings**:
    *   **Name**: `ride-deck-api`
    *   **Root Directory**: `backend` (Critical!)
    *   **Environment**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node src/server.js`
5.  **Environment Variables**:
    *   `MONGO_URI`: (Your MongoDB connection string)
    *   `JWT_SECRET`: (A random secret string)
    *   `PORT`: `10000`
6.  Click **"Create Web Service"**.
7.  **Copy the Backend URL** once deployed (e.g., `https://ride-deck-api.onrender.com`).

---

## Step 3: Frontend Deployment (Netlify) 💎

1.  Log in to [Netlify](https://app.netlify.com/).
2.  Click **"Add new site"** > **"Import from existing project"**.
3.  Select **GitHub** and choose your repo (`ride-deck`).
4.  **Build Settings**:
    *   **Base directory**: `frontend`
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
5.  **Environment Variables** (Click "Show advanced" or go to Site Settings later):
    *   Key: `VITE_API_URL`
    *   Value: Your **Render Backend URL** (e.g., `https://ride-deck-api.onrender.com`)
    *   *Note: No trailing slash `/` at the end.*
6.  Click **"Deploy ride-deck"**.

### Important: Handling Redirects
I have already added a `_redirects` file to your `frontend/public` folder. This ensures that refreshing pages like `/login` or `/dashboard` works correctly on Netlify.

---

## Step 4: Verification ✅

1.  Open your Netlify URL (e.g., `https://ride-deck.netlify.app`).
2.  Sign up a new user.
3.  Check if data persists and you are redirected correctly.

## Troubleshooting

*   **Page Not Found on Refresh**: Ensure `frontend/public/_redirects` exists and contains `/* /index.html 200`.
*   **API Connection Error**: Check the `VITE_API_URL` in Netlify Site Settings > Environment variables. It must match your active Render URL.
