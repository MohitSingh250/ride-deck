# RideDeck

RideDeck is a comprehensive ride-sharing platform built with the MERN stack (MongoDB, Express, React, Node.js). It features real-time ride tracking, separate dashboards for riders, drivers, and admins, and a robust backend to manage users, rides, and payments.

## Features

### 🚗 For Riders
- **Book Rides**: Easy-to-use interface to book rides with pickup and dropoff locations.
- **Real-time Tracking**: Track your driver in real-time on an interactive map.
- **Ride History**: View past rides and trip details.
- **Wallet**: Manage payments and view transaction history.
- **SOS**: Emergency alert system for safety.

### 🚕 For Drivers
- **Driver Dashboard**: Manage ride requests and view earnings.
- **Real-time Navigation**: Integrated map for navigation to pickup and dropoff points.
- **Status Toggle**: Go online/offline to accept or stop receiving ride requests.
- **Ride Management**: Accept, start, and complete rides.

### 👑 For Admins
- **Admin Dashboard**: Comprehensive overview of platform activity.
- **User Management**: Manage riders and drivers.
- **Ride Monitoring**: View active rides and history.
- **Analytics**: Visual insights into revenue and user growth.

### ⚡ Core Features
- **Real-time Communication**: Powered by Socket.io for instant updates.
- **Geolocation**: Accurate location services using Leaflet and OpenStreetMap.
- **Secure Authentication**: JWT-based authentication for secure access.
- **Responsive Design**: Fully responsive UI built with Tailwind CSS.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Leaflet, Socket.io Client
- **Backend**: Node.js, Express, MongoDB, Socket.io, JWT
- **Tools**: ESLint, Nodemon

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ride-deck
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/ridedeck  # Or your MongoDB Atlas URI
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory (optional, defaults to localhost):
```env
VITE_API_URL=http://localhost:5001
```

Start the frontend development server:
```bash
npm run dev
```

## Running the Application

1. Ensure MongoDB is running.
2. Start the backend server (`npm run dev` in `backend`).
3. Start the frontend server (`npm run dev` in `frontend`).
4. Open your browser and navigate to `http://localhost:5173`.

## API Documentation

The backend exposes the following main API routes:

- `/api/auth`: Authentication (Login, Signup)
- `/api/users`: User management
- `/api/rides`: Ride booking and management
- `/api/driver`: Driver-specific operations
- `/api/admin`: Admin dashboard data
- `/api/wallet`: Wallet and transaction management

