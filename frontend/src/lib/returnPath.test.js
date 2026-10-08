// returnPath.test.js
// The open-redirect guard. Every rejected case below is a way people have
// really turned a "return to" parameter into a jump to another site.

import { describe, it, expect } from 'vitest';
import { safeReturnPath, authPath } from './returnPath.js';

describe('safeReturnPath', () => {
  it('accepts paths inside the app, with their query and hash', () => {
    for (const path of ['/app', '/invite/3f9a1c', '/app/64656d6f/schedule?week=2026-03-02', '/app#team']) {
      expect(safeReturnPath(path)).toBe(path);
    }
  });

  it('rejects other sites, however they are written', () => {
    const attempts = [
      '//evil.example',
      '//evil.example/invite/abc',
      '///evil.example',
      '/\\evil.example',
      '\\\\evil.example',
      'https://evil.example',
      'http://localhost:5173/app',
      'javascript:alert(1)',
      'evil.example',
      'app/schedule',
    ];
    for (const path of attempts) expect(safeReturnPath(path)).toBeNull();
  });

  it('rejects the characters browsers strip before reading a URL', () => {
    for (const path of ['/\t/evil.example', '/\n/evil.example', '/\r/evil.example', ' /app', '/app\u0000']) {
      expect(safeReturnPath(path)).toBeNull();
    }
  });

  it('rejects anything that is not a string', () => {
    for (const value of [undefined, null, '', 42, {}, ['/app']]) expect(safeReturnPath(value)).toBeNull();
  });
});

describe('authPath', () => {
  it('carries a safe destination and the email along', () => {
    expect(authPath('/login', { next: '/invite/abc', email: 'nurse@example.com' })).toBe(
      '/login?next=%2Finvite%2Fabc&email=nurse%40example.com',
    );
  });

  it('drops an unsafe destination instead of passing it on', () => {
    expect(authPath('/register', { next: '//evil.example', email: 'a@b.co' })).toBe('/register?email=a%40b.co');
    expect(authPath('/login', { next: 'https://evil.example' })).toBe('/login');
  });
});
