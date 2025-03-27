# AgriBridge - Agricultural Marketplace Platform

AgriBridge is a comprehensive agricultural marketplace platform that facilitates seamless interactions between farmers, buyers, middlemen, and transporters through role-specific digital interfaces.

## Overview

AgriBridge connects various stakeholders in the agricultural supply chain, enabling:

- **Farmers** to list and sell their agricultural products
- **Buyers** to browse products and place bids
- **Middlemen** to facilitate transactions between farmers and buyers
- **Transporters** to offer logistics services for product delivery

The platform streamlines the agricultural supply chain by creating direct connections between stakeholders, eliminating inefficiencies, and providing transparency in transactions.

## Features

### User Roles and Authentication

- Multi-role authentication system (farmer, buyer, middleman, transporter, admin)
- Role-specific dashboards and functionality
- Secure login and registration

### Farmer Features

- Create and manage product listings
- Review and respond to bids
- Request transport services
- Manage farm profile and certifications
- Verification system for trusted selling

### Buyer Features

- Browse available agricultural products
- Place bids on products
- Request transport for purchased products
- Message farmers directly

### Transporter Features

- View available transport requests
- Accept transport jobs
- Update delivery status
- Manage transport schedule

### Communication System

- In-app messaging between users
- Notifications for new bids, accepted offers, and delivery updates

## Technology Stack

### Frontend

- **React**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Component library for a consistent design system
- **TanStack Query**: Data fetching and state management
- **React Hook Form**: Form handling with validation
- **Wouter**: Lightweight routing library
- **Zod**: Schema validation for forms and data

### Backend

- **Node.js**: JavaScript runtime for the server
- **Express**: Web framework for handling API requests
- **PostgreSQL**: Database for persistent storage
- **Drizzle ORM**: Type-safe database toolkit
- **Passport.js**: Authentication middleware
- **WebSockets**: Real-time communication (for messaging)

## Project Structure

```
agriBridge/
├── client/                   # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── bids/         # Bid-related components
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   ├── layout/       # Layout components (header, footer)
│   │   │   ├── messages/     # Messaging components
│   │   │   ├── products/     # Product-related components
│   │   │   ├── transport/    # Transport-related components
│   │   │   └── ui/           # Shadcn UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── pages/            # Page components
│   │   └── App.tsx           # Main application component
├── server/                   # Backend Express application
│   ├── auth.ts               # Authentication setup
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes
│   ├── seed-data.ts          # Database seeding
│   ├── storage.ts            # Data storage interface
│   └── vite.ts               # Vite configuration for the server
├── shared/                   # Shared code between client and server
│   └── schema.ts             # Database schema and types
├── drizzle.config.ts         # Drizzle ORM configuration
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Database Schema

The application uses the following data models:

### Users

Represents all users of the platform with role-specific fields:

- Core fields: id, username, password, fullName, email, phone, role, location
- Farmer-specific fields: farmName, farmBio, farmAddress, verificationId, certifications

### Products

Agricultural products listed by farmers:

- Core fields: id, farmerId, name, category, description, quantity, unit, price, currency, location
- Status tracking: active, sold, expired

### Bids

Offers made by buyers on products:

- Core fields: id, productId, buyerId, amount, quantity, message
- Status tracking: pending, accepted, rejected, countered

### Transport Requests

Logistics requests for product delivery:

- Core fields: id, productId, requesterId, transporterId, pickupLocation, deliveryLocation, quantity, date
- Status tracking: pending, accepted, in_transit, delivered

### Messages

Communication between users:

- Core fields: id, senderId, receiverId, content, read, createdAt

## Getting Started

### Prerequisites

- Node.js (v20.x or higher)
- npm (v10.x or higher)
- PostgreSQL (v16.x)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/agriBridge.git
   cd agriBridge
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     DATABASE_URL=postgresql://user:password@localhost:5432/agriBridge
     SESSION_SECRET=your_session_secret
     ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:5000](http://localhost:5000) in your browser to see the application.

## Development

### Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the production application
- `npm run start`: Start the production server
- `npm run db:migrate`: Run database migrations
- `npm run db:seed`: Seed the database with initial data

## API Endpoints

The API is organized around RESTful resources:

### Authentication

- `POST /api/register`: Register a new user
- `POST /api/login`: Login a user
- `GET /api/logout`: Logout a user
- `GET /api/user`: Get the current user

### Products

- `GET /api/products`: List all products
- `GET /api/products/:id`: Get a specific product
- `POST /api/products`: Create a new product (farmer only)
- `PATCH /api/products/:id`: Update a product (owner only)
- `GET /api/user/products`: Get products owned by the current user

### Bids

- `POST /api/bids`: Place a bid on a product (buyer/middleman only)
- `GET /api/products/:id/bids`: Get bids for a specific product
- `GET /api/user/bids`: Get bids placed by the current user
- `PATCH /api/bids/:id/status`: Update bid status (farmer only)

### Transport

- `POST /api/transport`: Create a transport request
- `GET /api/transport/requester`: Get transport requests created by the current user
- `GET /api/transport/transporter`: Get transport requests assigned to the current user (transporter only)
- `GET /api/transport/available`: Get available transport requests (transporter only)
- `PATCH /api/transport/:id/status`: Update transport request status

### Messages

- `POST /api/messages`: Send a message
- `GET /api/messages/:userId`: Get messages between the current user and another user
- `GET /api/messages/unread`: Get unread messages for the current user
- `PATCH /api/messages/:id/read`: Mark a message as read

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.