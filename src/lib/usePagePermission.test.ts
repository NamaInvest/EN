/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { usePagePermission } from './usePagePermission';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('usePagePermission Hook', () => {
  let pushMock: jest.Mock;

  beforeEach(() => {
    pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    localStorage.clear();
  });

  it('should redirect to login if no user is found', () => {
    renderHook(() => usePagePermission('pos'));
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('should allow access to any module for admin or owner', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'admin' }));
    const { result } = renderHook(() => usePagePermission('restricted_module'));
    
    expect(result.current).toBe(true);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('should block and redirect if user has no permissions at all', () => {
    localStorage.setItem('user', JSON.stringify({ id: 2, role: 'cashier', permissions: [] }));
    const { result } = renderHook(() => usePagePermission('pos'));
    
    expect(result.current).toBe(false);
    expect(pushMock).toHaveBeenCalledWith('/dashboard?reason=no_permissions');
  });

  it('should allow access if user has the specific module permission', () => {
    localStorage.setItem('user', JSON.stringify({
      id: 3, 
      role: 'cashier', 
      permissions: [{ module: 'pos' }, { module: 'sales' }]
    }));
    
    const { result } = renderHook(() => usePagePermission('pos'));
    
    expect(result.current).toBe(true);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('should block access if user does not have the specific module permission', () => {
    localStorage.setItem('user', JSON.stringify({
      id: 4, 
      role: 'accountant', 
      permissions: [{ module: 'reports' }, { module: 'purchases' }]
    }));
    
    const { result } = renderHook(() => usePagePermission('pos'));
    
    expect(result.current).toBe(false);
    expect(pushMock).toHaveBeenCalledWith('/dashboard?reason=no_access');
  });
});
