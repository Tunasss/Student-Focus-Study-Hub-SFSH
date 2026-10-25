import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './ThemeProvider';
import { ThemeToggle } from './ThemeToggle';
import { THEME_KEY } from './themeContext';

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

test('switching to dark adds the .dark class and persists the choice', async () => {
  renderToggle();

  await userEvent.click(screen.getByRole('radio', { name: 'Tối' }));

  expect(document.documentElement).toHaveClass('dark');
  expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  expect(screen.getByRole('radio', { name: 'Tối' })).toHaveAttribute('aria-checked', 'true');
});

test('restores a saved light preference', () => {
  localStorage.setItem(THEME_KEY, 'light');
  renderToggle();

  expect(document.documentElement).not.toHaveClass('dark');
  expect(screen.getByRole('radio', { name: 'Sáng' })).toHaveAttribute('aria-checked', 'true');
});
