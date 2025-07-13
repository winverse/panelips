import { css } from '@styled-system/css';
import Link from 'next/link';
import {
  MdArrowForward,
  MdBolt,
  MdDashboard,
  MdInsights,
  MdPeople,
  MdSearch,
  MdTv,
} from 'react-icons/md';

export function Sidebar() {
  const regularMenuItems = [
    { id: 'channels', label: '채널 관리', href: '/', icon: MdTv },
    { id: 'panels', label: '패널 관리', href: '/panels', icon: MdDashboard },
    { id: 'library', label: '자료실', href: '/library', icon: MdSearch },
  ];

  const apiMenuItem = { id: 'trpc-panel', label: 'API', href: '/api/panel', icon: MdBolt };

  return (
    <nav
      className={css({
        bg: 'background.secondary',
        h: '100%',
        w: '100%',
        p: '1rem',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'border.primary',
        display: 'flex',
        flexDirection: 'column',
      })}
    >
      {/* Logo Section */}
      <div
        className={css({
          mt: '0.5rem',
          mb: '1.5rem',
          pb: '1rem',
          borderBottom: '1px solid',
          borderColor: 'border.primary',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          pr: '3rem', // Add right padding to avoid X button overlap
        })}
      >
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '1.5rem',
            color: 'primary.600',
          })}
        >
          <MdPeople />
          <MdInsights />
        </div>
        <h1
          className={css({
            fontSize: '1.4rem',
            fontWeight: '700',
            color: 'text.primary',
            m: 0,
            letterSpacing: '-0.025em',
          })}
        >
          Panelips
        </h1>
      </div>

      <ul
        className={css({
          listStyle: 'none',
          p: 0,
          m: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        })}
      >
        {regularMenuItems.map((item) => (
          <li
            className={css({
              w: '100%',
            })}
            key={item.id}
          >
            <Link
              href={item.href}
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                p: '0.75rem 1rem',
                color: 'text.secondary',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bg: 'primary.50',
                  color: 'primary.700',
                },
              })}
            >
              <span
                className={css({
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  w: '24px',
                  h: '24px',
                })}
              >
                <item.icon />
              </span>
              <span>{item.label}</span>
              <span
                className={css({
                  ml: 'auto',
                  fontSize: '0.8rem',
                  opacity: 0.5,
                })}
              >
                <MdArrowForward />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div
        className={css({
          mt: 'auto',
          mb: '1rem',
        })}
      >
        <Link
          href={apiMenuItem.href}
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            p: '0.75rem 1rem',
            color: 'text.secondary',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            border: '1px solid',
            borderColor: 'border.primary',
            '&:hover': {
              bg: 'primary.50',
              color: 'primary.700',
            },
          })}
        >
          <span
            className={css({
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              w: '24px',
              h: '24px',
            })}
          >
            <apiMenuItem.icon />
          </span>
          <span>{apiMenuItem.label}</span>
          <span
            className={css({
              ml: 'auto',
              fontSize: '0.8rem',
              opacity: 0.5,
            })}
          >
            <MdArrowForward />
          </span>
        </Link>
      </div>

      <div
        className={css({
          pt: '1rem',
          borderTop: '1px solid',
          borderColor: 'border.primary',
          textAlign: 'center',
        })}
      >
        <p
          className={css({
            color: 'text.muted',
            fontSize: '0.75rem',
            m: 0,
          })}
        >
          Admin Panel v1.0
        </p>
      </div>
    </nav>
  );
}
