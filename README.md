# Chiya Mantralaya Management System

A production-ready restaurant management application built with React, TypeScript, and Supabase for Chiya Mantralaya. Features comprehensive role-based access control, real-time order tracking, payment processing, and financial reporting.

## Features

### Authentication & Authorization
- Email/password authentication via Supabase Auth
- Two-tier role system: Admin and Employee
- Employee verification workflow (employees must be verified by admin before accessing the app)
- Secure session management

### Employee Management (Admin Only)
- View all registered employees
- Verify/revoke employee access with audit logging
- Real-time verification status updates

### Menu Management (Admin Only)
- Create, edit, and delete menu items
- Organize items by categories
- Toggle item availability
- Set prices with validation

### Table Management (Admin Only)
- Add and remove tables
- Real-time table status (empty/occupied)
- Automatic status updates when orders are placed/completed

### Order Management
- **Employees**: Create and edit their own orders (before delivery)
- **Admins**: Full control over all orders at any stage
- Real-time order status tracking (taken → prepared → delivered → paid)
- Multi-item orders with quantity management
- Automatic total calculation

### Payment Processing (Admin Only)
- Atomic payment transactions (all-or-nothing)
- Cash and online payment methods
- QR code display for online payments
- Server-side validation and processing
- Automatic table release after payment

### Expense Tracking (Admin Only)
- Record business expenses
- View expense history with timestamps
- Daily expense totals

### Revenue & Profit Reports (Admin Only)
- Daily revenue breakdown (cash vs online)
- Real-time expense tracking
- Net profit calculation
- Order count and average order value
- Export reports to CSV
- Server-side calculations for accuracy

### Security & Data Integrity
- Row Level Security (RLS) on all tables
- Server-side RPC functions for critical operations
- Atomic database transactions
- Input validation (client and server-side)
- Audit logging for critical actions

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Build Tool**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chiya-mantralaya-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

### Database Setup

The database migrations have already been applied to your Supabase project. The schema includes:

1. **Tables**:
   - `profiles` - User profiles with role and verification status
   - `menu_items` - Restaurant menu items
   - `cafe_tables` - Table management
   - `orders` - Customer orders
   - `payments` - Payment records
   - `expenses` - Business expenses
   - `daily_revenue` - Revenue aggregates
   - `audit_logs` - Action audit trail

2. **RLS Policies**: All tables have Row Level Security enabled with appropriate access controls

3. **RPC Functions**:
   - `verify_employee` - Admin verification of employees
   - `confirm_payment` - Atomic payment processing
   - `edit_order` - Order editing with permissions
   - `add_expense` - Expense recording
   - `get_daily_summary` - Revenue/expense summary

### Creating the First Admin User

Since all new registrations create employees by default, you'll need to manually create the first admin:

1. Register a new account through the app
2. Go to your Supabase project → Table Editor → `profiles`
3. Find your user record and change:
   - `role` from `employee` to `admin`
   - `verified` from `false` to `true`
4. Sign out and sign back in

### Running the Application

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm run preview
```

## Usage Guide

### For Employees

1. **Registration**: Create an account with email and password
2. **Verification**: Wait for admin verification (you'll see a waiting screen)
3. **Taking Orders**:
   - Select a table
   - Add menu items with quantities
   - Submit the order
4. **Order Status**: Update orders through preparation stages
5. **Editing Orders**: Edit your own orders before they're delivered

### For Admins

1. **Employee Management**:
   - View all registered employees
   - Verify new employees to grant access
   - Revoke access if needed

2. **Menu Management**:
   - Add new items with prices and categories
   - Edit existing items
   - Toggle availability
   - Delete items

3. **Table Management**:
   - Add tables with unique numbers
   - View real-time table status
   - Remove tables when needed

4. **Order Management**:
   - View all orders in real-time
   - Edit any order (except paid ones)
   - Update order status
   - Process payments

5. **Payment Processing**:
   - Select cash or online payment
   - For online: show QR code to customer
   - Confirm payment received
   - System automatically updates revenue and frees table

6. **Expense Tracking**:
   - Record daily expenses
   - View expense history
   - See daily expense totals

7. **Revenue Reports**:
   - View daily revenue breakdown
   - See cash vs online revenue
   - Track expenses
   - Calculate net profit
   - Export reports to CSV

## Key Design Decisions

### Security First
- All critical operations use server-side RPC functions
- RLS policies enforce role-based access at the database level
- No sensitive operations happen client-side

### Atomic Transactions
- Payment processing is atomic (all-or-nothing)
- Prevents partial updates and data inconsistency
- Server-side validation on all financial operations

### Employee Verification
- New employees cannot access the system until verified
- Prevents unauthorized access
- Admin has full control over employee access

### Order Editing Rules
- Employees can only edit their own orders
- Orders cannot be edited once delivered or paid
- Admins have override capability for all non-paid orders
- Prevents unauthorized modifications

### Real-time Updates
- Order status changes reflected immediately
- Table status updates in real-time
- Employee verification triggers instant access

## File Structure

```
src/
├── components/
│   ├── Navigation.tsx          # Main navigation component
│   ├── Toast.tsx               # Toast notification system
│   ├── OrderModal.tsx          # Order creation/editing modal
│   └── PaymentModal.tsx        # Payment processing modal
├── contexts/
│   └── AuthContext.tsx         # Authentication context
├── lib/
│   └── supabase.ts             # Supabase client and types
├── pages/
│   ├── admin/
│   │   ├── EmployeeManagement.tsx
│   │   ├── MenuManagement.tsx
│   │   ├── TableManagement.tsx
│   │   ├── ExpenseManagement.tsx
│   │   └── RevenueReport.tsx
│   ├── AwaitingVerification.tsx
│   ├── Login.tsx
│   ├── Orders.tsx
│   └── Register.tsx
├── App.tsx                     # Main app component
└── main.tsx                    # App entry point
```

## Environment Variables

Required environment variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

## Deployment

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Deploy to Vercel/Netlify

1. Connect your repository
2. Set environment variables
3. Build command: `npm run build`
4. Output directory: `dist`

## Troubleshooting

### "User profile not found" error
- Ensure the profile was created after registration
- Check that the user ID matches between auth.users and profiles table

### Payment processing fails
- Verify the order status is "delivered"
- Check RLS policies allow the admin to access the order
- Ensure RPC function permissions are correct

### Employee can't access after verification
- Have the employee sign out and sign back in
- Check the `verified` field is `true` in the database

## Future Enhancements

- Multi-location support
- Inventory management
- Kitchen display system
- Customer-facing ordering interface
- Advanced analytics and reporting
- Email notifications for employee verification
- SMS notifications for order status
- Integration with payment gateways

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
