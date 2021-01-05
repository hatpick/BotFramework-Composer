// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { Text } from 'office-ui-fabric-react/lib/Text';
import * as React from 'react';
import styled from '@emotion/styled';
import { IconButton } from 'office-ui-fabric-react/lib/Button';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { NeutralColors } from '@uifabric/fluent-theme';

import { Tree } from './tree/Tree';
import { TreeItemData } from './tree/types';

const Title = styled(Text)({
  textTransform: 'uppercase',
  fontSize: 12,
  fontWeight: 500,
  padding: '4px 8px',
  height: 32,
  display: 'flex',
  alignItems: 'center',
  flex: 1,
});

const ExplorerTopBar = (props: { title: string; onSearch?: (query: string) => void }) => {
  const { title, onSearch } = props;

  const { 0: mode, 1: setMode } = React.useState<'search' | 'normal'>('normal');
  return (
    <Stack>
      {mode === 'normal' ? (
        <Stack horizontal verticalAlign="center">
          <Title>{title}</Title>
          <IconButton iconProps={{ iconName: 'Search' }} onClick={() => setMode('search')} />
        </Stack>
      ) : (
        <SearchBox underlined styles={{ root: { margin: 4 } }} onEscape={() => setMode('normal')} onSearch={onSearch} />
      )}
    </Stack>
  );
};

type Props<T> = {
  root: TreeItemData<T>;
  title: string;
  selectedId: string;
  onItemClick: (item: TreeItemData<T>) => void;
  onItemDoubleClick: (item: TreeItemData<T>) => void;
  onBotStart: (botId: string) => void;
  onBotStop: (botId: string) => void;
};

export const Explorer = <T,>(props: Props<T>) => {
  const { root, title, selectedId, onItemClick, onItemDoubleClick, onBotStart, onBotStop } = props;

  return (
    <Stack verticalFill styles={{ root: { background: NeutralColors.gray20 } }}>
      <ExplorerTopBar title={title} />
      <Stack.Item grow>
        <Tree
          showActions
          root={root}
          selectedId={selectedId}
          onBotStart={onBotStart}
          onBotStop={onBotStop}
          onItemClick={onItemClick}
          onItemDoubleClick={onItemDoubleClick}
        />
      </Stack.Item>
    </Stack>
  );
};
