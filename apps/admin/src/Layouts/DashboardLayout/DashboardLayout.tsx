'use client';

import { Sidebar } from '@src/components/Sidebar';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { ReactNode, useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className={flex({ height: '100vh', width: '100vw' })}>
      <aside
        className={css({
          width: isMenuOpen ? '250px' : '80px',
          bg: 'aside',
          borderRight: '1px solid',
          borderColor: 'text',
          p: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          transition: 'width 0.3s ease',
          position: 'relative',
        })}
      >
        <button
          type="button"
          onClick={toggleMenu}
          className={css({
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 1000,
          })}
        >
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>
        <div className={css({ mt: '3rem', display: isMenuOpen ? 'block' : 'none' })}>
          <Sidebar />
        </div>
      </aside>
      <main
        className={css({
          flexGrow: 1,
          p: '1rem',
          overflowY: 'auto',
          bg: 'main',
        })}
      >
        {children}
      </main>
    </div>
  );
}
