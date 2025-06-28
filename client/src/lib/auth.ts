// Mock authentication - in a real app this would integrate with your auth system
export interface AuthUser {
  telegramId: string;
  name: string;
  roles: string[];
  district?: string;
}

// For demo purposes, using localStorage to simulate authentication
const CURRENT_USER_KEY = 'kaamdhenu_current_user';

export function getCurrentUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function hasRole(user: AuthUser | null, role: string): boolean {
  return user?.roles.includes(role) || user?.roles.includes('admin') || false;
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'admin');
}

export function isDistrictHead(user: AuthUser | null): boolean {
  return hasRole(user, 'district_head');
}

export function isWorker(user: AuthUser | null): boolean {
  return hasRole(user, 'worker');
}

// Initialize default user for demo
if (!getCurrentUser()) {
  setCurrentUser({
    telegramId: '6338398272',
    name: 'Harshit Sharma',
    roles: ['admin'],
    district: 'SouthDelhi'
  });
}
