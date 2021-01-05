// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RouteComponentProps } from '@reach/router';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import * as React from 'react';
import { useRecoilValue } from 'recoil';
import styled from '@emotion/styled';

import { useBotOperations } from '../components/BotRuntimeController/useBotOperations';
import { LeftRightSplit } from '../components/Split/LeftRightSplit';
import { dispatcherState } from '../recoilModel';

import { activeDocumentIdState } from './document/documentState';
import { DocumentViewer } from './DocumentViewer';
import { Explorer } from './Explorer';
import { useBotTree } from './hooks/useBotTree';
import { TreeItemData } from './tree/types';

const Splitter = styled.div({
  height: '100%',
  width: '1px',
  boxSizing: 'border-box',
  outline: 'none',
  overflow: 'hidden',
  cursor: 'col-resize',
  marginLeft: 2,
  '&:hover': {
    background: 'transparent !important',
  },
});

const Main: React.FC<RouteComponentProps<{}>> = () => {
  const root = useBotTree<any>();
  const { startSingleBot, stopSingleBot } = useBotOperations();

  const selectedId = useRecoilValue(activeDocumentIdState);

  const { openDocument } = useRecoilValue(dispatcherState);

  const itemClick = React.useCallback((item: TreeItemData<any>) => {
    openDocument({ item, mode: 'soft' });
  }, []);

  const itemDoubleClick = React.useCallback((item: TreeItemData<any>) => {
    openDocument({ item, mode: 'hard' });
  }, []);

  const renderSplitter = React.useCallback(() => <Splitter />, []);

  return (
    <Stack horizontal verticalFill>
      <LeftRightSplit
        initialLeftGridWidth={320}
        minLeftPixels={320}
        minRightPixels={800}
        pageMode="projects"
        renderSplitter={renderSplitter}
      >
        <Explorer<any>
          root={root}
          selectedId={selectedId}
          title="project explorer"
          onBotStart={startSingleBot}
          onBotStop={stopSingleBot}
          onItemClick={itemClick}
          onItemDoubleClick={itemDoubleClick}
        />
        <DocumentViewer<any> root={root} onBotStart={startSingleBot} onBotStop={stopSingleBot} />
      </LeftRightSplit>
    </Stack>
  );
};

export default Main;
