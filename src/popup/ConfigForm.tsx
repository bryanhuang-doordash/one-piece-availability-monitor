import React, { useState } from 'react';
import { ExtensionConfig } from '../shared/types';
import { INTERVAL_BOUNDS, QUANTITY_BOUNDS } from '../shared/constants';

interface Props {
  config: ExtensionConfig;
  isMonitoring: boolean;
  onStart: (config: ExtensionConfig) => void;
  onStop: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#666',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  button: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  stopButton: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

export default function ConfigForm({ config, isMonitoring, onStart, onStop }: Props) {
  const [url, setUrl] = useState(config.url);
  const [intervalStr, setIntervalStr] = useState(String(config.intervalSeconds));
  const [quantityStr, setQuantityStr] = useState(String(config.quantity));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const intervalSeconds = parseFloat(intervalStr) || INTERVAL_BOUNDS.DEFAULT;
    const quantity = parseInt(quantityStr, 10) || QUANTITY_BOUNDS.DEFAULT;
    onStart({ url: url.trim(), intervalSeconds, quantity });
  };

  const isValidUrl = url.trim().length > 0;

  return (
    <form style={styles.form} onSubmit={handleSubmit}>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>URL to Monitor</label>
        <input
          type="url"
          style={styles.input}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/product"
          disabled={isMonitoring}
          required
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Check Interval (seconds)</label>
        <input
          type="number"
          style={styles.input}
          min={INTERVAL_BOUNDS.MIN}
          max={INTERVAL_BOUNDS.MAX}
          step="0.1"
          value={intervalStr}
          onChange={(e) => setIntervalStr(e.target.value)}
          onBlur={() => {
            const val = parseFloat(intervalStr);
            if (isNaN(val) || val < INTERVAL_BOUNDS.MIN) {
              setIntervalStr(String(INTERVAL_BOUNDS.MIN));
            } else if (val > INTERVAL_BOUNDS.MAX) {
              setIntervalStr(String(INTERVAL_BOUNDS.MAX));
            }
          }}
          disabled={isMonitoring}
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Quantity</label>
        <input
          type="number"
          style={styles.input}
          min={QUANTITY_BOUNDS.MIN}
          max={QUANTITY_BOUNDS.MAX}
          step="1"
          value={quantityStr}
          onChange={(e) => setQuantityStr(e.target.value)}
          onBlur={() => {
            const val = parseInt(quantityStr, 10);
            if (isNaN(val) || val < QUANTITY_BOUNDS.MIN) {
              setQuantityStr(String(QUANTITY_BOUNDS.MIN));
            } else if (val > QUANTITY_BOUNDS.MAX) {
              setQuantityStr(String(QUANTITY_BOUNDS.MAX));
            }
          }}
          disabled={isMonitoring}
        />
      </div>

      <div style={styles.buttonGroup}>
        {!isMonitoring ? (
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(isValidUrl ? styles.startButton : styles.disabledButton),
            }}
            disabled={!isValidUrl}
          >
            Start Monitoring
          </button>
        ) : (
          <button
            type="button"
            style={{ ...styles.button, ...styles.stopButton }}
            onClick={onStop}
          >
            Stop Monitoring
          </button>
        )}
      </div>
    </form>
  );
}
