'use client';

import { Sidebar } from '@src/components/Sidebar';
import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { ReactNode, useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className={flex({ height: '100vh', width: '100vw' })}>
      <aside
        className={flex({
          width: isMenuOpen ? '250px' : '80px',
          bg: 'aside',
          borderRight: '1px solid',
          borderColor: 'text',
          p: '1rem',
          flexDir: 'column',
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
            top: '1.25rem',
            right: isMenuOpen ? '1rem' : '1.5rem',
            zIndex: 1000,
            p: '0.5rem',
            bg: 'transparent',
            border: '1px solid',
            borderColor: 'border.primary',
            borderRadius: '6px',
            color: 'text.secondary',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            _hover: {
              bg: 'background.secondary',
              color: 'text.primary',
            },
          })}
        >
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>
        <div className={css({ mt: '2.5rem', display: isMenuOpen ? 'block' : 'none', h: '100%' })}>
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
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}
