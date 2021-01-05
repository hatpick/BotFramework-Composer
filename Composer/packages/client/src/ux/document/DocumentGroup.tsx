// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { NeutralColors } from '@uifabric/fluent-theme';
import styled from '@emotion/styled';
import formatMessage from 'format-message';
import { Callout } from 'office-ui-fabric-react/lib/Callout';
import { Breadcrumb, IBreadcrumbItem } from 'office-ui-fabric-react/lib/Breadcrumb';
import { Icon, IIconStyleProps, IIconStyles } from 'office-ui-fabric-react/lib/Icon';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import {
  IPivotItemProps,
  IPivotStyleProps,
  IPivotStyles,
  Pivot,
  PivotItem,
  PivotLinkFormat,
  PivotLinkSize,
} from 'office-ui-fabric-react/lib/Pivot';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { classNamesFunction, isMac } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';
import { useRecoilValue } from 'recoil';

import grayComposerIcon from '../../images/grayComposerIcon.svg';
import { Document } from '../document/Document';
import { QuickCommand } from '../quick/QuickCommand';
import { TreeItemData } from '../tree/types';
import { countDescendants, DEFAULT_TREE_ITEM_HEIGHT, getAllNodes, getIconColor } from '../tree/util';
import { Tree } from '../tree/Tree';

import { activeDocumentIdState, documentIdsState, documentsSelector } from './documentState';

const closeIconClassName = 'js-close-icon';

const pivotStyles = classNamesFunction<IPivotStyleProps, IPivotStyles>()({
  root: { overflowX: 'auto', backgroundColor: 'rgb(243, 243, 243)' },
  link: {
    height: 36,
    lineHeight: '36px',
    backgroundColor: NeutralColors.gray20,
    color: NeutralColors.gray130,
    margin: '0 2px 0 0',
    selectors: {
      '&:hover, &:active': { backgroundColor: NeutralColors.gray20, color: NeutralColors.gray130 },
      [`&:hover .${closeIconClassName}`]: {
        opacity: 1,
      },
    },
  },
  linkIsSelected: {
    height: 36,
    lineHeight: '36px',
    backgroundColor: NeutralColors.white,
    color: NeutralColors.gray130,
    margin: '0 2px 0 0',
    selectors: {
      '&:hover, &:active': { backgroundColor: NeutralColors.white, color: NeutralColors.gray130 },
      [`&:hover .${closeIconClassName}`]: {
        opacity: 1,
      },
      '&:before': {
        pointerEvents: 'none',
      },
    },
  },
  itemContainer: {
    flex: 1,
    selectors: { '& > div': { height: '100%' } },
  },
  text: { color: NeutralColors.gray130, fontSize: 13 },
});

const iconCustomStyle = (color: string) => ({
  selectors: {
    '& .ms-Pivot-icon': {
      color,
    },
  },
});

const closeIconStyles = classNamesFunction<IIconStyleProps, IIconStyles>()({
  root: {
    position: 'relative',
    zIndex: 1,
    fontSize: 10,
    width: 20,
    opacity: 0,
  },
});

const ShortcutKey = styled('div')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textTransform: 'uppercase',
  width: 20,
  height: 20,
  fontSize: 12,
  lineHeight: '24px',
  background: NeutralColors.gray40,
  color: NeutralColors.gray130,
  borderRadius: 4,
  borderBottom: `2px solid ${NeutralColors.gray60}`,
});

type Props = {
  viewMode: 'visual' | 'code';
  root: TreeItemData<any>;
  onOpenDocument: (item: TreeItemData<any>, mode?: 'soft' | 'hard') => void;
  onExecuteCommand: (item: TreeItemData<any>) => void;
  onActivateDocument: (docId: string) => void;
  onHardActivateDocument: (docId: string) => void;
  onCloseDocument: (docId: string, wasActive: boolean) => void;
  onToggleViewerMode: (mode: 'visual' | 'code') => void;
  onNextDocument: () => void;
  onPreviousDocument: () => void;
};

export const DocumentGroup = (props: Props) => {
  const {
    viewMode,
    root,
    onActivateDocument,
    onHardActivateDocument,
    onCloseDocument,
    onToggleViewerMode,
    onOpenDocument,
    onExecuteCommand,
  } = props;

  const { parents, nodes, levels } = getAllNodes<TreeItemData<any>>(root);

  const { 0: defaultQuery, 1: setDefaultQuery } = React.useState('');

  const documentIds = useRecoilValue(documentIdsState);
  const activeDocumentId = useRecoilValue(activeDocumentIdState);
  const documents = useRecoilValue(documentsSelector);

  const currentPath = React.useMemo(() => {
    let currentItem = nodes.find((n) => n.id === activeDocumentId);
    if (currentItem) {
      const path: TreeItemData<any>[] = [];
      while (currentItem) {
        path.push(currentItem);
        currentItem = parents[currentItem.id];
      }

      return path.reverse();
    }

    return [];
  }, [activeDocumentId, nodes, parents]);

  const { 0: quickCommandOpen, 1: setQuickCommandOpen } = React.useState(false);

  const close = React.useCallback(
    (documentId: string, active: boolean) => {
      onCloseDocument(documentId, active);
    },
    [onCloseDocument]
  );

  const open = React.useCallback(
    (item: TreeItemData<any>, mode: 'soft' | 'hard' = 'hard') => {
      onOpenDocument(item, mode);
    },
    [onOpenDocument]
  );

  React.useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (((isMac() && e.metaKey) || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setDefaultQuery(e.shiftKey ? '>' : '');
        setQuickCommandOpen(true);
      }
    };

    document.addEventListener('keydown', keydownHandler);

    return () => document.removeEventListener('keydown', keydownHandler);
  });

  const hardActivate = React.useCallback(
    (documentId: string) => {
      onHardActivateDocument(documentId);
    },
    [onHardActivateDocument]
  );

  const activate = React.useCallback(
    (documentId: string) => {
      onActivateDocument(documentId);
    },
    [onActivateDocument]
  );

  const renderItemLink = React.useCallback(
    (
      linkProps?: IPivotItemProps,
      defaultRender?: (linkProps?: IPivotItemProps) => JSX.Element | null
    ): JSX.Element | null => {
      const documentId = linkProps?.itemKey || '';
      const active = documentId === activeDocumentId;
      const mode = documents[documentId]?.activationMode;
      const iconColor = getIconColor(documents[documentId].item?.kind);

      return (
        <Stack
          horizontal
          tokens={{ childrenGap: 8 }}
          verticalAlign="center"
          onClick={() => activate(documentId)}
          onDoubleClick={() => hardActivate(documentId)}
        >
          <Stack.Item
            grow
            styles={{ root: { fontStyle: mode === 'soft' ? 'italic' : 'normal', ...iconCustomStyle(iconColor) } }}
          >
            {defaultRender?.(linkProps)}
          </Stack.Item>
          <Icon
            className={closeIconClassName}
            iconName="ChromeClose"
            styles={closeIconStyles}
            onClick={(e) => {
              e.stopPropagation();
              close(documentId, active);
            }}
          />
        </Stack>
      );
    },
    [documents]
  );

  const { 0: activeBreadcrumbItem, 1: setActiveBreadcrumb } = React.useState<TreeItemData<any> | null>(null);

  const breadcrumbCalloutContent = React.useMemo(() => {
    if (activeBreadcrumbItem) {
      const parent = parents[activeBreadcrumbItem.id] ?? activeBreadcrumbItem;

      const { nodes } = getAllNodes(parent);
      const collapsed = nodes.reduce((acc, n) => {
        acc[n.id] = !currentPath.find((p) => p.id === n.id);
        return acc;
      }, {} as Record<string, boolean>);

      collapsed[parent.id] = false;
      const count = countDescendants(parent, collapsed);

      return (
        <div
          style={{
            width: 300,
            height: Math.min(count * DEFAULT_TREE_ITEM_HEIGHT, 300),
          }}
        >
          <Tree
            skipRoot
            defaultCollapsed={collapsed}
            root={parent}
            selectedId={activeDocumentId}
            onItemClick={(item) => {
              open(item, 'soft');
              setActiveBreadcrumb(null);
            }}
          />
        </div>
      );
    }
    return null;
  }, [nodes, activeBreadcrumbItem, parents, levels, currentPath, open]);

  const renderBreadcrumbItem = React.useCallback(
    (itemProps?: IBreadcrumbItem, defaultRender?: (itemProps?: IBreadcrumbItem) => JSX.Element | null): JSX.Element => {
      return (
        <div id={`breadcrumb-item-${itemProps?.key.replace(/\.|:|\[|\]/g, '-')}`}>{defaultRender?.(itemProps)}</div>
      );
    },
    []
  );

  const gotoFile = React.useCallback(
    (fileId: string) => {
      const item = nodes.find((n) => n.id.includes(fileId));
      if (item) {
        onOpenDocument(item, 'soft');
      }
    },
    [nodes]
  );

  return (
    <>
      <Stack
        verticalFill
        styles={{ root: { backgroundColor: !documentIds.length ? NeutralColors.white : 'transparent' } }}
      >
        {documentIds.length ? (
          <Pivot
            linkFormat={PivotLinkFormat.tabs}
            linkSize={PivotLinkSize.normal}
            selectedKey={activeDocumentId}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={pivotStyles}
          >
            {documentIds.map((documentId) => (
              <PivotItem
                key={documentId}
                headerText={documents[documentId].title}
                itemIcon={documents[documentId].icon ?? 'FileCode'}
                itemKey={documentId}
                onRenderItemLink={renderItemLink}
              >
                <Stack verticalFill>
                  {activeDocumentId && (
                    <Breadcrumb
                      items={currentPath.map<IBreadcrumbItem>((p) => ({
                        key: p.id,
                        text: p.data.label,
                        onClick: () => setActiveBreadcrumb(p),
                        isCurrentItem: activeDocumentId === p.id,
                      }))}
                      styles={{
                        root: { marginTop: 2 },
                        itemLink: { fontSize: 12, height: 20, lineHeight: '20px' },
                        chevron: { fontSize: 9 },
                      }}
                      tooltipHostProps={{ content: undefined }}
                      onRenderItem={renderBreadcrumbItem}
                    />
                  )}
                  <Document
                    item={documents[documentId].item}
                    viewMode={viewMode}
                    onGoToFile={gotoFile}
                    onToggleViewMode={onToggleViewerMode}
                  />
                </Stack>
              </PivotItem>
            ))}
          </Pivot>
        ) : (
          <Stack verticalFill horizontalAlign="center" tokens={{ childrenGap: 24 }} verticalAlign="center">
            <Image
              maximizeFrame
              shouldFadeIn
              alt={formatMessage('bot framework composer icon gray')}
              height={240}
              imageFit={ImageFit.contain}
              src={grayComposerIcon}
              width={240}
            />

            <table style={{ width: 300, borderSpacing: '12px 6px' }}>
              <tbody>
                <tr>
                  <td align="right" style={{ width: '50%' }}>
                    <Text styles={{ root: { fontSize: 12 } }}>{formatMessage('Show all commands')}</Text>
                  </td>
                  <td>
                    <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                      <ShortcutKey>{isMac() ? '⇧' : 'shift'}</ShortcutKey>
                      <ShortcutKey>{isMac() ? '⌘' : 'ctrl'}</ShortcutKey>
                      <ShortcutKey>p</ShortcutKey>
                    </Stack>
                  </td>
                </tr>
                <tr>
                  <td align="right" style={{ width: '50%' }}>
                    <Text styles={{ root: { fontSize: 12 } }}>{formatMessage('Go to asset')}</Text>
                  </td>
                  <td>
                    <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                      <ShortcutKey>{isMac() ? '⌘' : 'ctrl'}</ShortcutKey>
                      <ShortcutKey>p</ShortcutKey>
                    </Stack>
                  </td>
                </tr>
              </tbody>
            </table>
          </Stack>
        )}
      </Stack>
      {quickCommandOpen && (
        <QuickCommand
          defaultQuery={defaultQuery}
          open={quickCommandOpen}
          onDismiss={() => setQuickCommandOpen(false)}
          onExecuteCommand={onExecuteCommand}
          onSelectItem={open}
        />
      )}
      {activeBreadcrumbItem && (
        <Callout
          calloutWidth={300}
          gapSpace={8}
          hidden={false}
          isBeakVisible={false}
          styles={{ root: { backgroundColor: NeutralColors.white } }}
          target={`#breadcrumb-item-${activeBreadcrumbItem.id.replace(/\.|:|\[|\]/g, '-')}`}
          onDismiss={() => setActiveBreadcrumb(null)}
        >
          {breadcrumbCalloutContent}
        </Callout>
      )}
    </>
  );
};
