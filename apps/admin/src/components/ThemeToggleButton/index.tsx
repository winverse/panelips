'use client';

import { useTheme } from '@src/providers/themeProvider';
import { css } from '@styled-system/css';
import { FaMoon, FaSun } from 'react-icons/fa';

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={css({
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
      })}
    >
      {theme === 'light' ? <FaMoon /> : <FaSun />}
    </button>
  );
};
