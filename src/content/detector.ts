// Content script that runs after page DOM is ready
// Detects product availability state on Square Online store pages
// Uses polling to wait for dynamically loaded content

type PageStatus = 'available' | 'out_of_stock' | 'not_found';
type ClickResult = 'clicked' | 'click_failed' | 'button_not_found';

interface OptionChoice {
  text: string;
  select: () => void;
}

function getPreferredOptionIndex(options: OptionChoice[]): number {
  // Priority 1: Booster Display
  const boosterIdx = options.findIndex(opt =>
    opt.text.toLowerCase().includes('booster display')
  );
  if (boosterIdx !== -1) return boosterIdx;

  // Priority 2: 24 Packs
  const packsIdx = options.findIndex(opt =>
    opt.text.toLowerCase().includes('24 packs')
  );
  if (packsIdx !== -1) return packsIdx;

  // Fallback: Last option
  return options.length - 1;
}

function selectFromDropdown(): boolean {
  const selects = document.querySelectorAll('select');
  for (const select of selects) {
    const options = Array.from(select.options);
    if (options.length <= 1) continue;

    const choices: OptionChoice[] = options.map(opt => ({
      text: opt.text,
      select: () => {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }));

    const idx = getPreferredOptionIndex(choices);
    if (idx >= 0) {
      choices[idx].select();
      return true;
    }
  }
  return false;
}

function selectFromRadioButtons(): boolean {
  // Find radio button groups - look for inputs with type="radio"
  const radios = document.querySelectorAll('input[type="radio"]');
  if (radios.length === 0) return false;

  // Group radios by name attribute
  const groups = new Map<string, HTMLInputElement[]>();
  radios.forEach(radio => {
    const input = radio as HTMLInputElement;
    const name = input.name || 'default';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(input);
  });

  // Process the first group with multiple options (likely product variant)
  for (const [, radioInputs] of groups) {
    if (radioInputs.length <= 1) continue;

    const choices: OptionChoice[] = radioInputs.map(input => {
      // Get label text - check for associated label or parent label
      const label = document.querySelector(`label[for="${input.id}"]`) ||
                    input.closest('label');
      const text = label?.textContent?.trim() || input.value || '';

      return {
        text,
        select: () => {
          input.click();
        }
      };
    });

    const idx = getPreferredOptionIndex(choices);
    if (idx >= 0) {
      choices[idx].select();
      return true;
    }
  }
  return false;
}

function findAndSelectOption(): boolean {
  // Try dropdown first
  if (selectFromDropdown()) {
    return true;
  }
  // Then try radio buttons
  if (selectFromRadioButtons()) {
    return true;
  }
  return false;
}

function simulateClick(element: HTMLElement): void {
  // Dispatch full mouse event sequence for Vue.js compatibility
  const events = ['mousedown', 'mouseup', 'click'];

  for (const eventType of events) {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0,
      buttons: eventType === 'mousedown' ? 1 : 0,
    });
    element.dispatchEvent(event);
  }
}

function findIncrementButton(): HTMLButtonElement | null {
  // Strategy 1: aria-label containing "increment"
  const byAriaLabel = document.querySelector('button[aria-label*="ncrement" i]');
  if (byAriaLabel) return byAriaLabel as HTMLButtonElement;

  // Strategy 2: Button with plus icon (SVG with + path)
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    const svg = btn.querySelector('svg');
    if (svg) {
      const pathD = svg.querySelector('path')?.getAttribute('d') || '';
      // Plus icon typically has horizontal and vertical lines
      if (pathD.includes('v') && pathD.includes('h') && pathD.includes('V') && pathD.includes('H')) {
        return btn as HTMLButtonElement;
      }
    }
  }

  // Strategy 3: Button near spinbutton role element
  const spinbutton = document.querySelector('[role="spinbutton"]');
  if (spinbutton) {
    const parent = spinbutton.parentElement;
    if (parent) {
      const siblingButtons = parent.querySelectorAll('button');
      // Increment is usually the second/last button
      if (siblingButtons.length >= 2) {
        return siblingButtons[siblingButtons.length - 1] as HTMLButtonElement;
      }
    }
  }

  return null;
}

function getCurrentQuantity(): number {
  // Strategy 1: spinbutton role with aria-valuenow
  const spinbutton = document.querySelector('[role="spinbutton"]');
  if (spinbutton) {
    const val = spinbutton.getAttribute('aria-valuenow');
    if (val) return parseInt(val, 10) || 1;
    // Fallback: text content
    const text = spinbutton.textContent?.trim();
    if (text) return parseInt(text, 10) || 1;
  }

  // Strategy 2: Input with type number near quantity-related elements
  const qtyInput = document.querySelector('input[type="number"]');
  if (qtyInput) {
    return parseInt((qtyInput as HTMLInputElement).value, 10) || 1;
  }

  return 1; // Default
}

async function waitForQuantityChange(expectedQty: number, timeoutMs: number = 500): Promise<number> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const currentQty = getCurrentQuantity();
    if (currentQty >= expectedQty) {
      return currentQty;
    }
    await new Promise(r => setTimeout(r, 50)); // Poll every 50ms
  }
  return getCurrentQuantity(); // Return whatever we have after timeout
}

async function setQuantity(targetQuantity: number): Promise<boolean> {
  if (targetQuantity <= 1) return true; // Default is usually 1

  const incrementButton = findIncrementButton();
  if (!incrementButton) return false;

  let currentQty = getCurrentQuantity();
  const maxAttempts = targetQuantity * 2; // Safety limit
  let attempts = 0;

  while (currentQty < targetQuantity && attempts < maxAttempts) {
    const expectedQty = currentQty + 1;
    simulateClick(incrementButton);

    // Wait for quantity to actually change (poll with timeout)
    currentQty = await waitForQuantityChange(expectedQty, 500);
    attempts++;
  }

  return currentQty >= targetQuantity;
}

async function getTargetQuantity(): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('monitor_config', (result) => {
      const config = result.monitor_config;
      resolve(config?.quantity || 1);
    });
  });
}

function findCartButton(): HTMLButtonElement | null {
  // Square Online available product button
  const byAction = document.querySelector('button[data-action*="addToCart"]');
  if (byAction) return byAction as HTMLButtonElement;

  // Square Online out-of-stock button (different attribute)
  const byDdAction = document.querySelector('button[data-dd-action-name="add-to-cart"]');
  if (byDdAction) return byDdAction as HTMLButtonElement;

  // Square Online primary button class
  const byPrimaryClass = document.querySelector('button.btn-fill-primary-lg');
  if (byPrimaryClass) return byPrimaryClass as HTMLButtonElement;

  // Square Online cart-button class
  const byCartClass = document.querySelector('button.cart-button');
  if (byCartClass) return byCartClass as HTMLButtonElement;

  // Fallback: Text content matching
  const allButtons = document.querySelectorAll('button');
  for (const button of allButtons) {
    const text = button.textContent?.toLowerCase() || '';
    if (text.includes('add to cart') || text.includes('out of stock')) {
      return button as HTMLButtonElement;
    }
  }

  return null;
}

function checkPageAvailability(): PageStatus {
  const bodyText = document.body?.innerText?.toLowerCase() || '';

  // Check for 404 / not found page first
  if (bodyText.includes('404') || bodyText.includes('page not found')) {
    return 'not_found';
  }

  // Look for cart button using multiple selectors
  const cartBtn = findCartButton();
  if (cartBtn) {
    const btnText = cartBtn.textContent?.toLowerCase() || '';
    const isDisabled = cartBtn.disabled || cartBtn.getAttribute('aria-disabled') === 'true';

    // Check if button indicates out of stock
    if (isDisabled || btnText.includes('out of stock') || btnText.includes('sold out')) {
      return 'out_of_stock';
    }
    return 'available';
  }

  // Check for out of stock indicators in page text
  if (bodyText.includes('out of stock') || bodyText.includes('sold out')) {
    return 'out_of_stock';
  }

  return 'not_found';
}

function isPageLoaded(): boolean {
  const bodyText = document.body?.innerText?.toLowerCase() || '';

  // Page is loaded if we find the cart button
  if (findCartButton()) {
    return true;
  }

  // Or if we see explicit error/stock text
  return bodyText.includes('404') ||
         bodyText.includes('page not found') ||
         bodyText.includes('out of stock') ||
         bodyText.includes('sold out');
}

function waitForPageLoad(maxWaitMs: number, intervalMs: number): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      if (isPageLoaded() || Date.now() - startTime >= maxWaitMs) {
        resolve();
        return;
      }
      setTimeout(check, intervalMs);
    };

    check();
  });
}

function clickCartButton(): ClickResult {
  const button = findCartButton();
  if (!button) return 'button_not_found';

  if (button.disabled || button.getAttribute('aria-disabled') === 'true') {
    return 'click_failed';
  }

  try {
    // Use simulateClick for Vue.js compatibility (same as increment button)
    simulateClick(button);
    return 'clicked';
  } catch {
    return 'click_failed';
  }
}

async function main() {
  await waitForPageLoad(5000, 500);

  const status = checkPageAvailability();

  let clickResult: ClickResult | undefined;
  if (status === 'available') {
    // 1. Select option if present (dropdown or radio buttons)
    const optionSelected = findAndSelectOption();
    if (optionSelected) {
      // Wait for page to update after selection
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 2. Set quantity
    const targetQuantity = await getTargetQuantity();
    if (targetQuantity > 1) {
      await setQuantity(targetQuantity);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 3. Click add to cart
    clickResult = clickCartButton();
  }

  chrome.runtime.sendMessage({
    type: 'PAGE_STATUS',
    status,
    clickResult,
  });
}

main();
