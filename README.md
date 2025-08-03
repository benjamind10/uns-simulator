# UNS Simulator

A web-based MQTT broker simulator for testing, development, and educational purposes.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **User Authentication & Authorization**  
  Secure login and role-based access.
- **MQTT Broker Management**  
  Add, edit, delete, and monitor brokers in real time.
- **Real-Time Broker Status Monitoring**  
  See which brokers are online and their connection status.
- **MQTT Topic Tree & Message Viewer**  
  Explore topics, view live messages, and filter by topic.
- **Schema Import/Export (JSON)**  
  Easily manage and share simulation schemas.
- **Simulator Profiles**  
  Create, edit, and run multiple simulation profiles.
- **Simulation Control Widget**  
  Floating widget for controlling simulations from anywhere in the app.
- **Metrics Dashboard**  
  View running simulations, broker status, and more.
- **Dark/Light Theme Support**  
  Switch between themes for comfortable viewing.
- **Responsive Design**  
  Works on desktops, tablets, and mobile devices.

---

## Tech Stack

### Frontend

- **React** (TypeScript)
- **Redux Toolkit** (state management)
- **GraphQL** (graphql-request)
- **TailwindCSS** (styling)
- **React Router** (navigation)

### Backend

- **Node.js** (TypeScript)
- **Apollo Server** (GraphQL API)
- **MongoDB** (Mongoose ODM)
- **JWT** (authentication)

---

## Screenshots

> _Add screenshots or GIFs here to showcase the UI and features!_

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB installed and running
- npm or yarn
- (Optional) MQTT broker (e.g., Mosquitto) for local MQTT/WebSocket testing

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/uns-simulator.git
   cd uns-simulator
   ```

2. **Install dependencies:**

   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

3. **Set up environment variables:**

   Create `.env` files in both client and server directories:

   ```bash
   # server/.env
   MONGODB_URI=mongodb://localhost:27017/uns-simulator
   JWT_SECRET=your_jwt_secret
   PORT=4000

   # client/.env
   VITE_API_URL=http://localhost:4000/graphql
   ```

4. **Start the development servers:**

   ```bash
   # Backend (from server directory)
   npm run dev

   # Frontend (from client directory)
   npm run dev
   ```

5. **Access the application:**

   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:4000](http://localhost:4000)
   - GraphQL Playground: [http://localhost:4000/graphql](http://localhost:4000/graphql)

---

## Usage

- **Login/Register:**  
  Create an account or log in to access broker and simulation features.
- **Add Brokers:**  
  Add MQTT brokers and monitor their status.
- **Create Schemas:**  
  Define schemas for your simulated data.
- **Create Simulator Profiles:**  
  Set up simulation profiles, configure node settings, and start/stop simulations.
- **Explore MQTT Topics:**  
  Use the MQTT Explorer to view live messages and topic trees.
- **Control Simulations:**  
  Use the floating widget to start, stop, pause, or resume simulations from any page.
- **Dashboard:**  
  View metrics such as brokers online, total schemas, simulator profiles, and running simulations.

---

## Project Structure

```
uns-simulator/
├── client/                # Frontend React application
│   ├── src/
│   │   ├── api/           # GraphQL API calls
│   │   ├── components/    # Reusable React components
│   │   ├── layout/        # Layouts for private routes
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store configuration
│   │   └── types/         # TypeScript type definitions
│   └── package.json
│
└── server/                # Backend Node.js application
    ├── src/
    │   ├── graphql/       # GraphQL schemas and resolvers
    │   ├── models/        # Mongoose models
    │   ├── simulation/    # Simulation engine and logic
    │   └── index.ts       # Server entry point
    └── package.json
```

---

## Troubleshooting

- **MongoDB Connection Issues:**  
  Ensure MongoDB is running and the URI in `.env` is correct.
- **Port Conflicts:**  
  Change the `PORT` in `.env` if 4000 is in use.
- **GraphQL Errors:**  
  Check backend logs for resolver or schema issues.
- **MQTT Broker Issues:**  
  Verify broker settings and network connectivity.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- [Mosquitto MQTT Broker](https://mosquitto.org/)
- [Apollo GraphQL](https://www.apollographql.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
