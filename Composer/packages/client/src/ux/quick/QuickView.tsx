// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import styled from '@emotion/styled';
import { DefaultPalette } from '@uifabric/styling';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const Root = styled('div')({
  position: 'fixed',
  width: 500,
  overflowY: 'auto',
  overflowX: 'hidden',
  maxHeight: 400,
  top: 80,
  left: '50%',
  transform: 'translateX(-50%)',
  boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
  zIndex: 1000,
});

type Props = React.PropsWithChildren<{
  open: boolean;
  onDismiss: () => void;
}>;

const QuickViewContent = (props: React.PropsWithChildren<{}>) => {
  return ReactDOM.createPortal(<Root>{props.children}</Root>, document.body);
};

export const QuickView = (props: Props) => {
  const { open, onDismiss } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    const clickHandler = (e: MouseEvent) => {
      if (e.target instanceof Node && !containerRef.current?.contains(e.target as Node)) {
        onDismiss();
      }
    };

    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('click', clickHandler);

    return () => {
      document.removeEventListener('keydown', keydownHandler);
      document.removeEventListener('click', clickHandler);
    };
  }, []);

  return open ? (
    <div ref={containerRef} style={{ background: DefaultPalette.white }}>
      <QuickViewContent>{props.children}</QuickViewContent>
    </div>
  ) : null;
};
