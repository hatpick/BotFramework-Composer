// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import noop from 'lodash/noop';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import * as React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

import { TreeItem } from './TreeItem';
import { TreeItemData, TreeItemKind } from './types';
import { DEFAULT_TREE_ITEM_HEIGHT, getActionMenuItems, getAllNodes, getIconName } from './util';

const noneClickableKinds: TreeItemKind[] = [
  'root',
  'bot',
  'lgGroup',
  'luGroup',
  'qnaGroup',
  'triggerGroup',
  'dialogGroup',
  'schemaGroup',
];

type Props<T> = {
  root: TreeItemData<T>;
  selectedId?: string;
  showActions?: boolean;
  defaultCollapsed?: Record<string, boolean>;
  skipRoot?: boolean;
  onItemClick?: (item: TreeItemData<T>) => void;
  onItemDoubleClick?: (item: TreeItemData<T>) => void;
  onBotStart?: (botId: string) => void;
  onBotStop?: (botId: string) => void;
  onAddDialog?: (projectId: string) => void;
  onEditManifest?: (projectId: string) => void;
  onExportZip?: (projectId: string) => void;
};

export const Tree = <T,>(props: Props<T>) => {
  const {
    root,
    selectedId = '',
    defaultCollapsed = {},
    showActions,
    onItemClick,
    onItemDoubleClick,
    onBotStart = noop,
    onBotStop = noop,
    onAddDialog = noop,
    onEditManifest = noop,
    onExportZip = noop,
    skipRoot = false,
  } = props;

  const { 0: collapsed, 1: setCollapsed } = React.useState<Record<string, boolean>>(defaultCollapsed);
  const { nodes, levels } = React.useMemo(
    () => getAllNodes<TreeItemData<any>>(root, { collapsed, skipRoot }),
    [root, collapsed]
  );
  const currentScrolledIdRef = React.useRef<string>();

  const listRef = React.useRef<List>(null);

  const selectedIdx = React.useMemo(() => {
    return nodes.findIndex((n) => n.id === selectedId);
  }, [nodes, selectedId]);

  React.useEffect(() => {
    if (currentScrolledIdRef.current !== selectedId) {
      currentScrolledIdRef.current = selectedId;
      setTimeout(() => listRef.current?.scrollToItem(selectedIdx, 'smart'), 0);
    }
  }, [selectedIdx, selectedId]);

  const onToggleCollapse = React.useCallback(
    (itemId: string, isCollapsed: boolean) => {
      setCollapsed({ ...collapsed, [itemId]: isCollapsed });
    },
    [collapsed]
  );

  const click = React.useCallback(
    (item: TreeItemData<T>) => {
      if (noneClickableKinds.includes(item.kind)) {
        onToggleCollapse(item.id, !collapsed[item.id]);
      } else {
        onItemClick?.(item);
      }
    },
    [onItemClick, onToggleCollapse]
  );

  const doubleClick = React.useCallback(
    (item: TreeItemData<T>) => {
      if (!noneClickableKinds.includes(item.kind)) {
        onItemDoubleClick?.(item);
      }
    },
    [onItemDoubleClick]
  );

  const renderIcon = React.useCallback((itemKind: TreeItemKind) => {
    const iconName = getIconName(itemKind);

    return iconName ? <Icon iconName={iconName} styles={{ root: { fontSize: 13, padding: '0 2px' } }} /> : null;
  }, []);

  const getActions = React.useCallback(
    (item: TreeItemData<any>) =>
      showActions ? getActionMenuItems(item, { onBotStart, onAddDialog, onBotStop, onEditManifest, onExportZip }) : [],
    []
  );

  const treeItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = nodes[index];
    return (
      <div key={item.id} style={style}>
        <TreeItem
          actions={getActions}
          collapsed={!!collapsed[item.id]}
          item={item}
          label={(item.data as any).label || item.id}
          level={levels[item.id] - (skipRoot ? 1 : 0)}
          selected={selectedId === item.id}
          onClick={click}
          onDoubleClick={doubleClick}
          onRenderIcon={renderIcon}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List ref={listRef} height={height} itemCount={nodes.length} itemSize={DEFAULT_TREE_ITEM_HEIGHT} width={width}>
          {treeItem}
        </List>
      )}
    </AutoSizer>
  );
};
