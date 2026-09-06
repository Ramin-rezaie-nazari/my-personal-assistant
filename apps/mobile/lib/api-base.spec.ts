import { validateMobileApiUrl } from './api-base';

describe('validateMobileApiUrl', () => {
  it('accepts HTTPS in production', () => {
    expect(validateMobileApiUrl('https://api.example.com/', 'production')).toBe(
      'https://api.example.com',
    );
  });

  it('rejects HTTP in production', () => {
    expect(() => validateMobileApiUrl('http://api.example.com', 'production')).toThrow(
      'HTTPS',
    );
  });

  it('accepts local HTTP in development', () => {
    expect(validateMobileApiUrl('http://localhost:3000/', 'development')).toBe(
      'http://localhost:3000',
    );
  });

  it('rejects invalid URLs', () => {
    expect(() => validateMobileApiUrl('not-a-url', 'development')).toThrow('valid absolute URL');
  });
});
