// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import styled from '@emotion/styled';
import Fuse from 'fuse.js';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { DefaultPalette } from '@uifabric/styling';
import { NeutralColors } from '@uifabric/fluent-theme';
import startCase from 'lodash/startCase';

import { useBotTree } from '../hooks/useBotTree';
import { TreeItemData, TreeItemKind } from '../tree/types';
import { getAllNodes, getIconColor, getIconName } from '../tree/util';
import { availableCommands } from '../dispatcher/documents';

import { QuickView } from './QuickView';

const ItemText = styled(Text)({
  fontSize: 12,
});

const ITEM_HEIGHT = 24;
type TreeItemDataWithPath<T> = TreeItemData<T> & { path: string[] };

const scope: TreeItemKind[] = ['trigger', 'lg', 'lu', 'qna', 'dialog', 'schema', 'formDialog', 'lgImport', 'luImport'];
const navKeys = ['ArrowDown', 'ArrowUp'];

const commands: TreeItemDataWithPath<any>[] = availableCommands.map<TreeItemDataWithPath<any>>((ac) => ({
  id: ac,
  data: { label: `> ${startCase(ac)}` },
  kind: 'command',
  botId: '',
  path: [],
}));

const renderMatch = (
  match: Fuse.FuseResultMatch,
  segmentIndex: number,
  styles: {
    normalStyle: React.CSSProperties;
    matchedStyle: React.CSSProperties;
  }
): JSX.Element => {
  let firstIndex = 0;
  const lastIndex = match.value?.length;

  const items = match.indices.map((m, spanIndex) => {
    const firstSpan = <span style={styles.normalStyle}>{match.value?.slice(firstIndex, m[0])}</span>;
    const secondSpan = <span style={styles.matchedStyle}>{match.value?.slice(m[0], m[1] + 1)}</span>;

    firstIndex = m[1] + 1;
    return (
      <React.Fragment key={`segment-${segmentIndex}-span-${spanIndex}`}>
        {firstSpan}
        {secondSpan}
      </React.Fragment>
    );
  });

  items.push(
    <span key={`segment-${segmentIndex}-span-final`} style={styles.normalStyle}>
      {match.value?.slice(firstIndex, lastIndex)}
    </span>
  );

  return <React.Fragment key={`segment-${segmentIndex}`}>{items}</React.Fragment>;
};

const renderLabel = (
  matches: readonly Fuse.FuseResultMatch[],
  styles: { normalStyle: React.CSSProperties; matchedStyle: React.CSSProperties }
): JSX.Element => {
  return <ItemText styles={{ root: { fontSize: 12 } }}>{matches.map((m, i) => renderMatch(m, i, styles))}</ItemText>;
};

type QuickCommandItemProps = {
  path: string;
  selected: boolean;
  style: React.CSSProperties;
  onSelectItem: (item: Fuse.FuseResult<TreeItemDataWithPath<any>>) => void;
  item: Fuse.FuseResult<TreeItemDataWithPath<any>>;
};

const QuickCommandItem = React.memo((props: QuickCommandItemProps) => {
  const { selected, onSelectItem, item, style } = props;

  const iconName = getIconName(item.item.kind);
  const iconColor = getIconColor(item.item.kind);

  const nameMatches = item.matches?.filter((m) => m.key === 'data.label');
  const pathMatches = item.matches?.filter((m) => m.key === 'path');

  const slicedPath: { kind: 'match' | 'string'; data: string[] | Fuse.FuseResultMatch[] }[] = pathMatches?.length
    ? pathMatches.reduce((acc, pm, idx) => {
        if (pm?.refIndex) {
          const startIdx = Math.max(idx - 1, 0);
          acc.push({ kind: 'string', data: item.item.path.slice(startIdx, pm.refIndex) });
          acc.push({ kind: 'match', data: [pm] });
          if (idx === pathMatches.length - 1 && pm.refIndex < item.item.path.length - 1) {
            acc.push({ kind: 'string', data: item.item.path.slice(pm.refIndex + 1) });
          }
        }
        return acc;
      }, [] as { kind: 'match' | 'string'; data: string[] | Fuse.FuseResultMatch[] }[])
    : [{ kind: 'string', data: item.item.path }];

  return (
    <Stack
      horizontal
      style={style}
      styles={{
        root: {
          background: selected ? DefaultPalette.themeLighter : DefaultPalette.white,
          cursor: 'pointer',
          selectors: { '&:hover': { background: NeutralColors.gray20 } },
        },
      }}
      tokens={{ childrenGap: 8, padding: '0 8px' }}
      verticalAlign="center"
      onClick={() => onSelectItem(item)}
    >
      {iconName ? <Icon iconName={iconName} styles={{ root: { fontSize: 12, color: iconColor } }} /> : null}
      <Stack horizontal styles={{ root: { overflowX: 'hidden' } }} tokens={{ childrenGap: 8 }} verticalAlign="center">
        {nameMatches?.length ? (
          renderLabel(nameMatches, {
            matchedStyle: { color: DefaultPalette.accent, fontWeight: 'bold' },
            normalStyle: {},
          })
        ) : (
          <ItemText>{item.item.data.label}</ItemText>
        )}
        <Stack.Item
          styles={{
            root: {
              flex: 1,
              overflowX: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: -1,
              color: NeutralColors.gray70,
            },
          }}
        >
          {pathMatches?.length ? (
            slicedPath?.reduce((acc, p, idx) => {
              if (p.kind === 'string') {
                acc.push(<ItemText styles={{ root: { color: NeutralColors.gray70 } }}>{p.data.join('/')}</ItemText>);
              } else {
                acc.push(
                  <ItemText styles={{ root: { color: NeutralColors.gray70 } }}>/</ItemText>,
                  renderLabel(p.data as Fuse.FuseResultMatch[], {
                    matchedStyle: { color: DefaultPalette.accent },
                    normalStyle: { color: NeutralColors.gray70 },
                  })
                );

                if (idx !== slicedPath.length - 1) {
                  acc.push(<ItemText styles={{ root: { color: NeutralColors.gray70 } }}>/</ItemText>);
                }
              }
              return acc;
            }, [] as React.ReactNode[])
          ) : (
            <ItemText styles={{ root: { color: NeutralColors.gray70 } }}>{item.item.path}</ItemText>
          )}
        </Stack.Item>
      </Stack>
    </Stack>
  );
});

type Props<T> = {
  open: boolean;
  defaultQuery?: string;
  onDismiss: () => void;
  onSelectItem: (item: TreeItemData<T>) => void;
  onExecuteCommand: (item: TreeItemData<T>) => void;
};

export const QuickCommand = <T,>(props: Props<T>) => {
  const { open, defaultQuery = '', onDismiss, onSelectItem, onExecuteCommand } = props;

  const { 0: selectedIdx, 1: setSelectedIdx } = React.useState(0);
  const listRef = React.useRef<List>(null);

  const root = useBotTree();
  const { nodes, paths } = React.useMemo(() => getAllNodes<TreeItemData<any>>(root), [root]);
  const searchableNodes = React.useMemo(
    () => nodes.map<TreeItemDataWithPath<any>>((n) => ({ ...n, path: paths[n.id].split('/') })),
    [nodes, paths]
  );

  const { 0: query, 1: setQuery } = React.useState(defaultQuery);

  React.useEffect(() => setQuery(defaultQuery), [defaultQuery]);

  const fuse = React.useMemo(
    () =>
      new Fuse(query.startsWith('>') ? commands : searchableNodes.filter((n) => scope.includes(n.kind)), {
        includeScore: true,
        includeMatches: true,
        isCaseSensitive: false,
        useExtendedSearch: true,
        findAllMatches: true,
        keys: ['path', 'data.label'],
      }),
    [searchableNodes, query]
  );

  const items = React.useMemo(() => {
    return query ? fuse.search(query) : [];
  }, [query, fuse]);

  const dismiss = React.useCallback(() => {
    setQuery('');
    setSelectedIdx(0);
    onDismiss();
  }, [onDismiss]);

  const selectItem = (result: Fuse.FuseResult<TreeItemDataWithPath<any>>) => {
    if (result.item.kind === 'command') {
      onExecuteCommand(result.item);
    } else {
      onSelectItem(result.item);
    }

    dismiss();
  };

  React.useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (navKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();

        const newSelectedIdx =
          e.key === 'ArrowDown'
            ? (selectedIdx + 1) % items.length
            : selectedIdx - 1 < 0
            ? selectedIdx - 1 + items.length
            : selectedIdx - 1;

        setSelectedIdx(newSelectedIdx);
        listRef.current?.scrollToItem(newSelectedIdx, 'smart');
      } else if (e.key === 'Enter' && items[selectedIdx].item) {
        selectItem(items[selectedIdx]);
      }
    };

    document.addEventListener('keydown', keydownHandler);

    return () => {
      document.removeEventListener('keydown', keydownHandler);
    };
  }, [items, selectedIdx]);

  React.useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    const itemPath = paths[item.item.id];

    return (
      <QuickCommandItem
        key={item.item.id}
        item={item}
        path={itemPath}
        selected={selectedIdx === index}
        style={style}
        onSelectItem={selectItem}
      />
    );
  };

  return (
    <QuickView open={open} onDismiss={dismiss}>
      <Stack styles={{ root: { background: DefaultPalette.white } }} tokens={{ padding: 4 }}>
        <SearchBox
          autoFocus
          disableAnimation
          autoComplete="off"
          value={query}
          onChange={(e, value) => setQuery(value || '')}
        />
      </Stack>
      <Stack styles={{ root: { height: Math.min(items.length, 15) * ITEM_HEIGHT } }}>
        <AutoSizer>
          {({ height, width }) => (
            <List ref={listRef} height={height} itemCount={items.length} itemSize={ITEM_HEIGHT} width={width}>
              {row}
            </List>
          )}
        </AutoSizer>
      </Stack>
    </QuickView>
  );
};
