# One Piece Availability Monitor

A Chrome extension that monitors product pages for availability and automatically adds items to cart when they become available. Built for Square Online stores but works with other e-commerce sites.

## Features

- **Automatic Monitoring**: Continuously refreshes a product page at configurable intervals (0.5s - 1 hour)
- **Availability Detection**: Detects product status (available, out of stock, or not found)
- **Auto Add-to-Cart**: When a product becomes available:
  - Selects product variants (dropdowns or radio buttons)
  - Sets the desired quantity
  - Clicks the "Add to Cart" button
  - Navigates to checkout
- **Desktop Notifications**: Alerts you when a product becomes available
- **Real Browser Tab**: Uses an actual browser tab for detection (avoids bot detection)

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone git@github.com:bryanhuang-doordash/one-piece-availability-monitor.git
   cd one-piece-availability-monitor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder

## Usage

1. Click the extension icon in Chrome
2. Enter the product URL you want to monitor
3. Set the refresh interval (in seconds)
4. Set the desired quantity
5. Click "Start Monitoring"

The extension will open a new tab and continuously check for availability. When the product becomes available, it will:
1. Auto-select the preferred variant (prioritizes "Booster Display" or "24 Packs" options)
2. Set the quantity
3. Add to cart
4. Navigate to checkout
5. Send a desktop notification

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development build with watch mode
npm run dev
```

## Project Structure

```
src/
├── background/       # Service worker (tab management, scheduling)
├── content/          # Content script (page detection, cart actions)
├── popup/            # React UI (configuration form)
└── shared/           # Shared types and constants
```

## Tech Stack

- TypeScript
- React (popup UI)
- Vite (build tool)
- Chrome Extension Manifest V3
