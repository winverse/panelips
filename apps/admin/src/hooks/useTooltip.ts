import React, { useMemo } from 'react';
import { Tooltip } from 'react-tooltip';

interface UseTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface UseTooltipReturn {
  tooltipId: string;
  tooltipProps: {
    'data-tooltip-id': string;
    'data-tooltip-content': string;
  };
  TooltipComponent: () => React.JSX.Element;
}

export function useTooltip({ content, position = 'top' }: UseTooltipProps): UseTooltipReturn {
  const tooltipId = useMemo(() => `tooltip-${Math.random().toString(36).substr(2, 9)}`, []);

  const tooltipProps = {
    'data-tooltip-id': tooltipId,
    'data-tooltip-content': content,
  };

  const TooltipComponent = () =>
    React.createElement(Tooltip, {
      id: tooltipId,
      place: position,
      style: {
        backgroundColor: 'var(--colors-neutral-800)',
        color: 'var(--colors-white)',
        fontSize: '0.75rem',
        fontWeight: '500',
        borderRadius: '6px',
        padding: '0.375rem 0.75rem',
        zIndex: 1000,
      },
    });

  return {
    tooltipId,
    tooltipProps,
    TooltipComponent,
  };
}
