// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RouteComponentProps } from '@reach/router';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import * as React from 'react';
import { useRecoilValue } from 'recoil';

import { useBotOperations } from '../components/BotRuntimeController/useBotOperations';
import { LeftRightSplit } from '../components/Split/LeftRightSplit';
import { dispatcherState } from '../recoilModel';

import { activeDocumentIdState } from './document/documentState';
import { DocumentViewer } from './DocumentViewer';
import { Explorer } from './Explorer';
import { useBotTree } from './hooks/useBotTree';
import { TreeItemData } from './tree/types';

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

  return (
    <Stack horizontal verticalFill>
      <LeftRightSplit initialLeftGridWidth={320} minLeftPixels={320} minRightPixels={800} pageMode="projects">
        <Explorer<any>
          root={root}
          selectedId={selectedId}
          title="project explorer"
          onBotStart={startSingleBot}
          onBotStop={stopSingleBot}
          onItemClick={itemClick}
          onItemDoubleClick={itemDoubleClick}
        />
        <DocumentViewer<any> root={root} />
      </LeftRightSplit>
    </Stack>
  );
};

export default Main;
