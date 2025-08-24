# DRIVS - Sistema de Locadora de Veículos

## Overview
DRIVS is a comprehensive vehicle rental management system designed to eliminate defaults, optimize fleet management, and increase revenue for rental companies, especially small to medium-sized ones. It automates the management of drivers, vehicles, rentals, contracts, infractions, and maintenance, replacing manual spreadsheets with a precise, automated control system. The system offers an intuitive interface and advanced functionalities, aiming to be a complete solution for vehicle rental businesses.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
DRIVS is built with a full-stack architecture prioritizing scalability, security, and a fluid user experience.

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite.
- **UI/UX Decisions**: Tailwind CSS with a custom futuristic design system featuring modern gradients. Radix UI and shadcn/ui components ensure accessibility and visual consistency. Visual elements like statistical cards, tables, and modals follow a unified standard with standardized icons, dynamic colors, and optimized spacing. It features a responsive layout with fixed headers and adaptive mobile navigation. The visual identity includes thematic vehicle icons, custom logos, and cohesive automotive-themed loading animations.
- **State Management**: React Query (`@tanstack/react-query`) for server state management, caching, and data synchronization.
- **Routing**: React Router DOM.
- **Forms**: React Hook Form with Zod for robust form validation.

### Backend Architecture
- **Framework**: Express.js with TypeScript, running on Node.js.
- **Database**: PostgreSQL (via Neon serverless) with Drizzle ORM for type-safe operations.
- **Session Management**: `connect-pg-simple` for persistent PostgreSQL-based sessions.
- **System Design**: Real-time notification system, contract status checking, and automated payment system operate in an integrated manner. Strict data isolation between rental companies is enforced with multi-layer validations (backend, frontend, cache).
- **Monitoring**: Administrative dashboard provides real-time metrics on system status, performance, and rental company data.

### Core System Features
- **Driver Management**: Registration, validation (CPF, CNH, age), and document management with specific uploads. Dynamic profile photos and icons.
- **Vehicle Management**: Detailed registration (plate, make, model, year, color, category), automatic status (available/rented), automatic calculation of fixed expenses (IPVA, insurance, tracker, financing). Dynamic icon colors based on vehicle color. Complete document management system with upload/download capabilities for vehicle documents stored in cloud object storage.
- **Rental and Contract Management**:
    - Contract creation with available drivers and vehicles.
    - Automatic recurring payments (weekly, bi-weekly, monthly) with retroactive logic.
    - Four contract statuses (open, active, canceled, closed) with automatic transitions.
    - Professional PDF contract generation with real rental company and client data, and signature fields.
    - Upload system for signed PDF contracts.
    - Renewable contracts with minimum term.
- **Financial Management and Reporting**:
    - Financial dashboard with total revenue, total expenses, net profit, and profit margin.
    - Detailed reports by vehicle and driver, including profitability.
    - Consolidation of expenses (fixed, manual, maintenance) by category and payment method.
    - Monthly evolution of revenue and expenses.
    - Comprehensive loading system with visual feedback.
- **Fleet Maintenance**:
    - Scheduling and registration of maintenance (preventive, corrective, revision) with details of workshop, values, and parts.
    - Automatic alerts for mileage and upcoming maintenance dates.
    - Integration of maintenance costs into financial reports.
- **Infraction Management**:
    - Registration of infractions with intelligent driver/vehicle selection and administrative fee calculation.
    - Automatic notifications for upcoming fine due dates.
- **Notification System**:
    - Real-time notifications (updates every 30 seconds) for expired/expiring CNHs, pending fines, open payments, and critical system announcements.
    - Dynamic header badge and notification dropdown with priority and colors.
- **Announcement System**: Display of critical announcements (warning, error) on the rental company dashboard and in the notification system, with colors and translations by type.
- **Testing and Validations**: Advanced data validations (CPF, CNH, dates), and integrity checks to prevent inconsistent data.
- **Pagination and Sorting**: Implemented in all tables and lists for improved usability and performance.
- **Automatic Trial System**: All new registrations receive a 30-day free Pro plan (20 vehicles). The system automatically assigns the trial and displays its status and remaining days.

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives and shadcn/ui.
- **Icons**: Lucide React.
- **Date Handling**: `date-fns`.
- **PDF Generation**: `jsPDF`.

### Backend Dependencies
- **Database Connection**: `@neondatabase/serverless`.
- **ORM**: `drizzle-orm`.
- **Session Management**: `connect-pg-simple`.
- **WebSockets**: `ws`.
- **Authentication**: `bcrypt`.
- **Validation**: `zod`.

### Other Integrations
- **API ViaCEP**: For automatic address lookup by CEP.
- **Recharts**: For data visualization in graphs.
- **Stripe**: For payment processing, including subscription management, webhooks, and customer portal integration. Supports a 5-tier pricing structure.