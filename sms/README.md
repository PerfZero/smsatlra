# Atlas Safe - Savings Management System

A React-based application for managing Hajj and Umrah savings, package selection, and trip planning.

## Features

- User authentication with IIN and phone number
- Savings tracking and progress visualization
- Package selection with different tiers
- Real-time balance updates
- Estimated completion time calculation
- Modern, responsive UI

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sms
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the development server:
```bash
npm start
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Login using your IIN and phone number
2. View your current savings and progress
3. Select a package that suits your needs
4. Track your savings progress
5. Submit application when target amount is reached

## Project Structure

```
src/
  ├── components/
  │   ├── Auth/
  │   │   └── Login.tsx
  │   └── Save/
  │       ├── SaveDashboard.tsx
  │       └── PackageSelection.tsx
  ├── store/
  │   ├── index.ts
  │   └── slices/
  │       └── userSlice.ts
  ├── types/
  │   └── index.ts
  ├── App.tsx
  └── index.tsx
```

## Technologies Used

- React
- TypeScript
- Redux Toolkit
- Material-UI
- React Router
- Formik & Yup
- Axios

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
