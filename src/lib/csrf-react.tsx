// 🛡️ CSRF React Hooks - Protecting forms the React way
// "I eated the purple berries!" - Ralph, on trusting user input
//
// ╭────────────────────────────────────────────────────────────╮
// │  CSRF REACT INTEGRATION                                     │
// │  • Context provider for CSRF token                          │
// │  • useCsrf() hook for easy access                          │
// │  • Hidden input component for forms                         │
// ╰────────────────────────────────────────────────────────────╯
//
// Usage:
//   1. Wrap your app with <CsrfProvider> (done in __root.tsx)
//   2. Use the useCsrf() hook in your forms
//   3. Include <CsrfInput /> in your forms, or use the token directly
//
// Example:
//   const { token, headers } = useCsrf();
//   // For fetch: fetch('/api', { headers: { ...headers } })
//   // For forms: <form><CsrfInput /></form>

import { createContext, useContext } from 'react';
import { CSRF_HEADER_NAME, getClientCsrfToken } from './csrf'; // Client-safe imports

// ═══════════════════════════════════════════════════════════
// CONTEXT & PROVIDER
// ═══════════════════════════════════════════════════════════

type CsrfContextType = {
  token: string | null;
};

const CsrfContext = createContext<CsrfContextType>({ token: null });

/**
 * Provider for CSRF token context.
 * Wraps your app to make the token available everywhere.
 */
export function CsrfProvider({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken: string | null;
}) {
  return (
    <CsrfContext.Provider value={{ token: initialToken }}>
      {children}
    </CsrfContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Hook to access the CSRF token and related utilities.
 *
 * @returns Object with:
 *   - token: The CSRF token string
 *   - headers: Object with X-CSRF-Token header for fetch requests
 *   - inputProps: Props for a hidden input element
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { token, headers } = useCsrf();
 *
 *   const handleSubmit = async (data) => {
 *     await fetch('/api/action', {
 *       method: 'POST',
 *       headers: { ...headers, 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ ...data, csrfToken: token }),
 *     });
 *   };
 *
 *   return <form onSubmit={handleSubmit}><CsrfInput /></form>;
 * }
 * ```
 */
export function useCsrf() {
  const context = useContext(CsrfContext);

  // On client, try to get from cookie if context is empty
  // (handles edge cases where context might not be set)
  const token = context.token || (typeof window !== 'undefined' ? getClientCsrfToken() : null);

  return {
    token,
    // Ready-to-use headers object for fetch requests
    headers: token ? { [CSRF_HEADER_NAME]: token } : {},
    // Props for hidden input element
    inputProps: {
      type: 'hidden' as const,
      name: 'csrfToken',
      value: token || '',
    },
  };
}

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

/**
 * Hidden input component for CSRF token in forms.
 *
 * @example
 * ```tsx
 * <form>
 *   <CsrfInput />
 *   <input type="text" name="email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
export function CsrfInput() {
  const { inputProps } = useCsrf();
  return <input {...inputProps} />;
}

/**
 * Get headers with CSRF token for use in server function calls.
 * Use this when you need to include the token in a createServerFn call.
 *
 * @example
 * ```tsx
 * const { token } = useCsrf();
 *
 * const result = await myServerFn({
 *   data: formData,
 *   csrfToken: token,
 * });
 * ```
 */
export function useCsrfToken(): string | null {
  const { token } = useCsrf();
  return token;
}
