import { css } from '@styled-system/css';
import { flex } from '@styled-system/patterns';
import { ReactNode, useEffect } from 'react';
import { MdClose } from 'react-icons/md';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1024px' },
    full: { maxWidth: '95vw' },
  };

  return (
    <div
      className={css({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        p: '1rem',
      })}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClose();
        }
      }}
    >
      <div
        className={css({
          bg: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid',
          borderColor: 'border.primary',
          display: 'flex',
          flexDirection: 'column',
          ...sizeStyles[size],
          width: '100%',
        })}
        role="document"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        {title && (
          <div
            className={flex({
              justifyContent: 'space-between',
              alignItems: 'center',
              p: '1.5rem',
              borderBottom: '1px solid',
              borderColor: 'border.primary',
            })}
          >
            <h2
              className={css({
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'text.primary',
                m: 0,
              })}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={css({
                p: '0.5rem',
                bg: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: 'text.secondary',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                _hover: {
                  bg: 'gray.100',
                  color: 'text.primary',
                },
              })}
            >
              <MdClose size={24} />
            </button>
          </div>
        )}

        {/* 컨텐츠 */}
        <div
          className={css({
            flex: 1,
            overflowY: 'auto',
            p: title ? '1.5rem' : '2rem',
            maxHeight: 'calc(90vh - 120px)',
          })}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
