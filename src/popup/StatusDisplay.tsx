import React from 'react';
import { MonitorState } from '../shared/types';

interface Props {
  state: MonitorState;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #ddd',
  },
  title: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '6px 12px',
    fontSize: '13px',
  },
  label: {
    color: '#666',
  },
  value: {
    color: '#333',
    fontWeight: 500,
  },
  success: {
    color: '#4CAF50',
    fontWeight: 600,
  },
  waiting: {
    color: '#ff9800',
    fontWeight: 500,
  },
  error: {
    color: '#f44336',
    fontSize: '12px',
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
  },
  successBanner: {
    marginTop: '8px',
    padding: '10px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    color: '#2e7d32',
    fontWeight: 600,
    textAlign: 'center' as const,
  },
  addedToCartBanner: {
    marginTop: '8px',
    padding: '10px',
    backgroundColor: '#c8e6c9',
    borderRadius: '4px',
    color: '#1b5e20',
    fontWeight: 600,
    textAlign: 'center' as const,
  },
  outOfStockBanner: {
    marginTop: '8px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    color: '#c62828',
    fontWeight: 600,
    textAlign: 'center' as const,
  },
  waitingBanner: {
    marginTop: '8px',
    padding: '10px',
    backgroundColor: '#fff3e0',
    borderRadius: '4px',
    color: '#e65100',
    fontWeight: 500,
    textAlign: 'center' as const,
  },
};

export default function StatusDisplay({ state }: Props) {
  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusText = (): string => {
    if (state.navigatedToCheckout) {
      return 'SUCCESS - Ready for Checkout!';
    }
    if (state.addedToCart) {
      return 'SUCCESS - Added to Cart!';
    }
    if (state.successDetected) {
      return 'SUCCESS - Product Available!';
    }
    if (state.lastError === 'out_of_stock') {
      return 'Out of Stock';
    }
    if (state.lastError === 'not_found') {
      return 'Not found (refreshing...)';
    }
    return 'Checking...';
  };

  const getStatusStyle = (): React.CSSProperties => {
    if (state.successDetected) {
      return styles.success;
    }
    if (state.lastError === 'out_of_stock') {
      return { color: '#c62828', fontWeight: 600 };
    }
    if (state.lastError === 'not_found') {
      return styles.waiting;
    }
    return styles.value;
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>Monitoring Status</div>
      <div style={styles.statusGrid}>
        <span style={styles.label}>Status:</span>
        <span style={getStatusStyle()}>
          {getStatusText()}
        </span>

        <span style={styles.label}>Last Check:</span>
        <span style={styles.value}>{formatTime(state.lastRefreshTime)}</span>

        <span style={styles.label}>Attempts:</span>
        <span style={styles.value}>{state.attemptCount}</span>
      </div>

      {state.navigatedToCheckout && (
        <div style={styles.addedToCartBanner}>
          You're on the checkout page. Complete your purchase!
        </div>
      )}

      {state.addedToCart && !state.navigatedToCheckout && (
        <div style={styles.addedToCartBanner}>
          Item added to cart! Navigating to checkout...
        </div>
      )}

      {state.successDetected && !state.addedToCart && state.clickAttempted && (
        <div style={styles.successBanner}>
          Product available but auto-click failed.
        </div>
      )}

      {state.successDetected && !state.addedToCart && !state.clickAttempted && (
        <div style={styles.successBanner}>
          Product has "Add to Cart" button!
        </div>
      )}

      {!state.successDetected && state.lastError === 'out_of_stock' && (
        <div style={styles.outOfStockBanner}>
          Product exists but is out of stock.
        </div>
      )}

      {!state.successDetected && state.lastError === 'not_found' && (
        <div style={styles.waitingBanner}>
          Page shows 404/not found - will keep checking...
        </div>
      )}
    </div>
  );
}
