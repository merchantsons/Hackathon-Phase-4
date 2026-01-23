# Todo Application Frontend

React + TypeScript + Vite frontend for the Todo Application.

## Project Structure

```
frontend/
├── src/              # Source code
├── index.html        # HTML entry point
├── package.json      # Dependencies
├── vite.config.ts    # Vite configuration
└── tsconfig.json     # TypeScript configuration
```

## Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```env
VITE_BACKEND_API_URL=http://localhost:8000
VITE_API_URL=http://localhost:3001
```

3. Start development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Environment Variables

- `VITE_BACKEND_API_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_API_URL` - Chat API URL (default: http://localhost:3001)
