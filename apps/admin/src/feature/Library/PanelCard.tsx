import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { MdPerson, MdSchool, MdWork } from 'react-icons/md';
import type { Panel } from './types';

interface PanelCardProps {
  panels: Panel[];
}

export function PanelCard({ panels }: PanelCardProps) {
  if (!panels || panels.length === 0) {
    return null;
  }

  return (
    <div
      className={css({
        p: '1.5rem',
        bg: 'purple.50',
        border: '1px solid',
        borderColor: 'purple.200',
        borderRadius: '12px',
        mb: '1rem',
      })}
    >
      <div className={flex({ alignItems: 'center', gap: '0.5rem', mb: '1rem' })}>
        <MdPerson className={css({ color: 'purple.600', fontSize: '1.2rem' })} />
        <h3
          className={css({
            fontSize: '1.2rem',
            fontWeight: '700',
            color: 'purple.800',
            m: 0,
          })}
        >
          패널리스트 ({panels.length}명)
        </h3>
      </div>

      <div className={css({ display: 'grid', gap: '1rem' })}>
        {panels.map((panel, index) => (
          <div
            key={`${panel.name}-${panel.position}-${index}`}
            className={css({
              p: '1rem',
              bg: 'white',
              border: '1px solid',
              borderColor: 'purple.100',
              borderRadius: '8px',
            })}
          >
            <div className={flex({ alignItems: 'center', gap: '0.5rem', mb: '0.75rem' })}>
              <h4
                className={css({
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'text.primary',
                  m: 0,
                })}
              >
                {panel.name}
              </h4>
              <span
                className={css({
                  px: '0.5rem',
                  py: '0.125rem',
                  bg: 'purple.100',
                  color: 'purple.700',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                })}
              >
                {panel.position}
              </span>
            </div>

            {panel.affiliation && (panel.affiliation.ko || panel.affiliation.en) && (
              <div className={flex({ alignItems: 'center', gap: '0.5rem', mb: '0.5rem' })}>
                <MdWork className={css({ color: 'purple.500', fontSize: '1rem' })} />
                <span className={css({ fontSize: '0.9rem', color: 'text.secondary' })}>
                  {panel.affiliation.ko || panel.affiliation.en}
                  {panel.affiliation.ko &&
                    panel.affiliation.en &&
                    panel.affiliation.ko !== panel.affiliation.en && (
                      <span className={css({ color: 'text.tertiary', ml: '0.5rem' })}>
                        ({panel.affiliation.en})
                      </span>
                    )}
                </span>
              </div>
            )}

            {panel.expertise && panel.expertise.length > 0 && (
              <div className={flex({ alignItems: 'flex-start', gap: '0.5rem' })}>
                <MdSchool
                  className={css({ color: 'purple.500', fontSize: '1rem', mt: '0.125rem' })}
                />
                <div>
                  <span
                    className={css({
                      fontSize: '0.85rem',
                      color: 'text.secondary',
                      fontWeight: '500',
                    })}
                  >
                    전문분야:
                  </span>
                  <div className={flex({ gap: '0.5rem', flexWrap: 'wrap', mt: '0.25rem' })}>
                    {panel.expertise.map((field) => (
                      <span
                        key={field}
                        className={css({
                          px: '0.5rem',
                          py: '0.125rem',
                          bg: 'purple.50',
                          color: 'purple.600',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: '1px solid',
                          borderColor: 'purple.200',
                        })}
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
