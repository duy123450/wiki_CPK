import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// A simple component that might render user input
const UserComment = ({ comment }) => {
  // React escapes by default, but let's test it
  return <div data-testid="comment-body">{comment}</div>;
};

describe('XSS Prevention', () => {
  it('escapes malicious script tags', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    render(<UserComment comment={maliciousInput} />);
    
    const element = screen.getByTestId('comment-body');
    // Ensure the raw HTML is rendered as text, not evaluated
    expect(element.textContent).toBe(maliciousInput);
    // Ensure no script element was actually injected into the DOM
    expect(element.querySelector('script')).toBeNull();
  });
});
