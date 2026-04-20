# Buta Shop - React + Vite Version

A modern offline-first inventory management system built with React, Vite, and PouchDB.

## Features

- **PIN-Protected Access**: 4-digit PIN lock for app security
- **Product Management**: Add, edit, and delete products with barcode support
- **Sales Tracking**: Record and track sales with cost/profit calculations
- **QR Code Scanning**: Scan barcodes for quick product lookup (requires camera access)
- **Bilingual Support**: Amharic (አማ) and English interface
- **Offline-First**: All data stored locally using PouchDB
- **Daily Reports**: Track daily revenue, profit, and transaction counts
- **Low Stock Alerts**: Get notified when inventory falls below threshold
- **Data Backup**: Export and import backup files

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open in your browser at http://localhost:5173 (or the next available port).

### Build for Production

```bash
npm build
```

The output will be in the `dist` folder.

## Project Structure

```
src/
├── components/
│   ├── PinLock.jsx          # PIN authentication screen
│   ├── Dashboard.jsx        # Main app container
│   └── tabs/
│       ├── Products.jsx     # Product management
│       ├── Scan.jsx         # QR code scanning
│       ├── Sell.jsx         # Sales interface
│       ├── Summary.jsx      # Daily summary
│       └── Reports.jsx      # Reports and settings
├── hooks/
│   ├── useTranslations.js   # Translation management
│   ├── useDatabase.js       # PouchDB operations
│   ├── useAuth.js           # PIN authentication logic
│   ├── useScanner.js        # QR code scanning logic
│   └── useSales.js          # Sales calculations
├── styles/
│   └── global.css           # Global styles
├── App.jsx                  # Root component
└── main.jsx                 # Entry point
```

## Technologies Used

- **React 19**: UI framework
- **Vite**: Build tool and dev server
- **PouchDB**: Offline database
- **HTML5-QRCode**: QR code scanning
- **Tailwind CSS**: Utility-first styling (optional)

## Key Functionalities Preserved

All original functionality from the vanilla JS version has been converted to React:

- PIN setup and verification
- Product CRUD operations
- Sales recording and calculations
- QR code scanning
- Language switching
- Data export/import
- Settings management
- Low stock alerts
- Daily summaries and reports

## Data Persistence

Data is stored using PouchDB in three databases:
- `products`: Product inventory
- `sales`: Transaction history
- `settings`: App configuration

All data is stored locally in the browser and persists between sessions.

## Browser Compatibility

Requires a modern browser with:
- LocalStorage support
- IndexedDB (for PouchDB)
- Camera access (for QR scanning)

## License

MIT
