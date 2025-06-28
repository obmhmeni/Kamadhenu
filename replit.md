# KaamDhenu Bot - E-commerce & Order Management System

## Overview

KaamDhenu Bot is a comprehensive e-commerce and order management system built as a full-stack web application. The system appears to be designed for managing products, orders, payments, and users across different districts in India, with support for Telegram bot integration for order processing and SMS-based payment confirmations.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and bundling
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Validation**: Zod schemas shared between frontend and backend
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Database Schema
The system uses the following main entities:
- **Products**: Items with quantity, price, district, category, and unique numbers
- **Orders**: Customer orders with payment/delivery status tracking
- **Users**: Telegram users with roles and district assignments
- **Roles**: Role-based access control (admin, district_head, worker)
- **Transactions**: Payment tracking and SMS processing
- **UserInfo**: Extended user profile information
- **Settings**: System configuration parameters

### User Management & Authentication
- Mock authentication system using localStorage for demo purposes
- Role-based access control with three main roles:
  - Admin: Full system access
  - District Head: District-specific management
  - Worker: Limited operational access
- Default admin user pre-configured for demonstration

### Product Management
- District-based product organization
- Category-based classification
- Stock level monitoring with configurable thresholds
- Unique numbering system for product variants
- Real-time inventory tracking

### Order Processing
- Multi-step order workflow (Processing → Shipped → Delivered)
- Payment status tracking (Pending → Paid → Failed)
- SMS-based payment confirmation system
- Order assignment to suppliers based on product location

### Payment System
- SMS parsing for payment confirmations
- Automatic order status updates based on payment messages
- Support for multiple phone number validation
- Integration with Indian banking SMS formats

## Data Flow

1. **Product Creation**: Users with appropriate roles can add products to their districts
2. **Order Placement**: Customers create orders through the web interface
3. **Payment Processing**: SMS messages are parsed to confirm payments and update order status
4. **Order Fulfillment**: District heads and workers manage order delivery status
5. **User Management**: Admins can assign roles and manage user permissions

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Hook Form)
- TanStack React Query for data fetching
- Wouter for routing
- Drizzle ORM with PostgreSQL adapter

### UI/UX Libraries
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Lucide React for icons
- Class Variance Authority for component variants

### Development Tools
- TypeScript for type safety
- Vite for development server and building
- ESBuild for server bundling
- Replit-specific development plugins

### Database & Infrastructure
- Neon Database for serverless PostgreSQL
- Drizzle Kit for database migrations
- Better SQLite3 for local development (based on attached files)

## Deployment Strategy

### Development
- Vite development server with HMR
- Concurrent client and server development
- File-based routing structure
- Environment-based configuration

### Production Build
- Client: Vite build process generating optimized static files
- Server: ESBuild bundling for Node.js deployment
- Database: Drizzle migrations for schema management
- Static asset serving through Express

### Environment Configuration
- Database URL configuration through environment variables
- Development vs production build differentiation
- Replit-specific deployment optimizations

## Changelog
- June 28, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.