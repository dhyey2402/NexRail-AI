/**
 * Abstracted token storage to handle JWTs securely.
 * 
 * TRADEOFF NOTE (MVP):
 * We are currently using localStorage to persist the JWT token.
 * This is convenient for the initial MVP.
 * However, this exposes the token to Cross-Site Scripting (XSS) attacks.
 * In a production environment, this implementation should be swapped out for
 * Secure, HttpOnly cookies.
 */

const TOKEN_KEY = 'railwise_admin_auth_token'

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export const clearToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}
