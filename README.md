# UNS Simulator

A web-based MQTT broker simulator for testing and development purposes.

## Features

- User authentication and authorization
- MQTT broker management (add, edit, delete)
- Real-time broker status monitoring
- MQTT topic tree and message viewer
- Schema import/export (JSON)
- Dark/Light theme support
- Responsive design

## Tech Stack

### Frontend

- React with TypeScript
- Redux Toolkit for state management
- GraphQL with graphql-request
- TailwindCSS for styling
- React Router for navigation

### Backend

- Node.js with TypeScript
- Apollo Server for GraphQL
- MongoDB with Mongoose
- JWT authentication

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB installed and running
- npm or yarn
- (Optional) MQTT broker (e.g., Mosquitto) for local MQTT/WebSocket testing

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/uns-simulator.git
cd uns-simulator
```

2. Install dependencies:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables:

Create `.env` files in both client and server directories:

```bash
# server/.env
MONGODB_URI=mongodb://localhost:27017/uns-simulator
JWT_SECRET=your_jwt_secret
PORT=4000

# client/.env
VITE_API_URL=http://localhost:4000/graphql
```

4. Start the development servers:

```bash
# Start backend (from server directory)
npm run dev

# Start frontend (from client directory)
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- GraphQL Playground: http://localhost:4000/graphql

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
    │   └── index.ts       # Server entry point
    └── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
