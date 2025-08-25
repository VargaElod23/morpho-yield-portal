// Suppress development warnings that don't affect functionality
// This should be imported early in the app lifecycle

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  // List of warning patterns to suppress
  const suppressedWarnings = [
    'Lit is in dev mode',
    'Loading multiple versions is not recommended',
    'WalletConnect Core is already initialized',
    'Multiple versions of Lit loaded',
    'This is probably a mistake and can lead to unexpected behavior',
    'Init() was called 2 times'
  ];

  function shouldSuppress(message: string): boolean {
    return suppressedWarnings.some(pattern => message.includes(pattern));
  }

  // Override console methods
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (shouldSuppress(message)) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (shouldSuppress(message)) {
      return;
    }
    originalError.apply(console, args);
  };

  console.log = (...args) => {
    const message = args[0]?.toString() || '';
    if (shouldSuppress(message)) {
      return;
    }
    originalLog.apply(console, args);
  };

  // Restore original methods in case they're needed
  (window as any).__originalConsole = {
    warn: originalWarn,
    error: originalError,
    log: originalLog,
  };
}