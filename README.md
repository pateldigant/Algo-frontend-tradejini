# Nifty Dashboard (Algo-frontend-tradejini)

A modern React + Vite dashboard for live Nifty option chain and trading positions, designed for fast, real-time updates and a clean UI.

## Features
- Live Option Chain with ATM and strike range controls
- Real-time positions with PnL, LTP, and square-off actions
- Polling interval and strike range adjustable from UI
- Responsive, mobile-friendly design
- Built with React, Vite, Bootstrap, and Tailwind CSS

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Installation
```bash
git clone https://github.com/pateldigant/Algo-frontend-tradejini.git
cd nifty-dashboard
npm install
```

### Running the App
```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### Backend API
This frontend expects a backend running at `http://localhost:8000` with endpoints:
- `/api/latest` (option chain data)
- `/api/enriched-positions` (positions data)
- `/api/squareoff` (POST for square-off)

## Scripts
- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run preview` – Preview production build

## Folder Structure
```
public/           # Static assets
src/
  components/     # Reusable React components
  pages/          # Main pages (Dashboard)
  App.jsx         # App entry
  main.jsx        # Vite entry
```

## Contributing
Pull requests welcome! For major changes, please open an issue first.

## License
[MIT](LICENSE)
