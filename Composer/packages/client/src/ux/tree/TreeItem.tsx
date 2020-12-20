// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import styled from '@emotion/styled';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { DefaultPalette } from '@uifabric/styling';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { NeutralColors } from '@uifabric/fluent-theme';
import { IconButton, IButtonStyles, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { classNamesFunction } from 'office-ui-fabric-react/lib/Utilities';
import { IContextualMenuItem, ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';

import { TreeItemAction, TreeItemActionNormal, TreeItemData, TreeItemKind } from './types';
import { DEFAULT_INDENTATION_PADDING, DEFAULT_TREE_ITEM_HEIGHT } from './util';

const expandIconWidth = 16;
const jsActionClassName = 'js-actions';

const Root = styled(Stack)<{
  selected: boolean;
  clickable: boolean;
  level: number;
}>(
  {
    height: DEFAULT_TREE_ITEM_HEIGHT,
    userSelect: 'none',
    position: 'relative',
    zIndex: 0,
  },
  (props) => ({
    cursor: props.clickable ? 'pointer' : 'auto',
    [`&:hover .${jsActionClassName}`]: {
      display: 'flex',
    },
    ...(props.selected
      ? {
          color: DefaultPalette.white,
        }
      : {}),
    ...(props.clickable && !props.selected
      ? {
          '&:hover': {
            '&:before': {
              content: '""',
              position: 'absolute',
              height: DEFAULT_TREE_ITEM_HEIGHT,
              lineHeight: `${DEFAULT_TREE_ITEM_HEIGHT}px`,
              width: '100%',
              left: 0,
              background: NeutralColors.gray40,
              zIndex: -1,
            },
          },
        }
      : {}),
    ...(props.selected
      ? {
          '&:before': {
            content: '""',
            position: 'absolute',
            height: DEFAULT_TREE_ITEM_HEIGHT,
            lineHeight: `${DEFAULT_TREE_ITEM_HEIGHT}px`,
            width: '100%',
            left: 0,
            background: DefaultPalette.accent,
            zIndex: -1,
          },
        }
      : {}),
  })
);

const Content = styled(Stack)<{
  width: string;
}>({ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, (props) => ({
  width: props.width,
}));

const Actions = styled(Stack)<{ menuOpen: boolean }>({ display: 'none' }, (props) => ({
  display: props.menuOpen ? 'flex' : 'none',
}));

const LabelRoot = styled('div')({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
  fontSize: 12,
  padding: '0 4px',
  height: DEFAULT_TREE_ITEM_HEIGHT,
  lineHeight: `${DEFAULT_TREE_ITEM_HEIGHT}px`,
});

const classNames = classNamesFunction<IButtonProps, IButtonStyles>();
const menuButtonItemStyle = (selected: boolean) =>
  classNames({
    root: {
      background: 'transparent',
      height: DEFAULT_TREE_ITEM_HEIGHT,
      width: DEFAULT_TREE_ITEM_HEIGHT,
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 12,
    },
    rootHovered: {
      background: 'transparent',
    },
    rootPressed: { background: 'transparent' },
    icon: {
      fontSize: 10,
      color: selected ? NeutralColors.white : NeutralColors.black,
    },
  });

type Props<T> = {
  item: TreeItemData<T>;
  level: number;
  collapsed?: boolean;
  selected?: boolean;
  label?: string;
  actions?: TreeItemAction<T, TreeItemData<T>>[] | ((item: TreeItemData<T>) => TreeItemAction<T, TreeItemData<T>>[]);
  onToggleCollapse?: (itemId: string, collapsed: boolean) => void;
  onClick?: (item: TreeItemData<T>) => void;
  onDoubleClick?: (item: TreeItemData<T>) => void;
  onRenderLabel?: (item: TreeItemData<T>) => React.ReactNode;
  onRenderIcon?: (itemKind: TreeItemKind) => React.ReactNode;
};

const TreeItemComponent = <T,>(props: Props<T>) => {
  const {
    item,
    label,
    onClick,
    onDoubleClick,
    onRenderIcon,
    onRenderLabel,
    onToggleCollapse,
    level,
    collapsed = false,
    selected = false,
    actions: defaultActions = [],
  } = props;

  const paddingLeft = level * DEFAULT_INDENTATION_PADDING;

  const { 0: menuOpen, 1: setMenuOpen } = React.useState(false);

  const click = React.useCallback(() => {
    onClick?.(item);
  }, [onClick, item]);

  const doubleClick = React.useCallback(() => {
    onDoubleClick?.(item);
  }, [onDoubleClick, item]);

  const toggleCollapsed = React.useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e.stopPropagation();
      onToggleCollapse?.(item.id, !collapsed);
    },
    [collapsed, onToggleCollapse, item.id]
  );

  const isCollapsible = !!item.children?.length;

  const actions = typeof defaultActions === 'function' ? defaultActions(item) : defaultActions;
  const actionMenuItems = actions.filter((a) => a.kind === 'normal' && a.showAsAction) as TreeItemActionNormal<
    T,
    TreeItemData<T>
  >[];
  const overflowMenuItems = actions.filter((a) => a.kind === 'separator' || !a.showAsAction);

  return (
    <Root
      horizontal
      clickable={!!onClick}
      level={level}
      selected={selected}
      style={{ paddingLeft }}
      title={label}
      verticalAlign="center"
      onClick={click}
      onDoubleClick={doubleClick}
    >
      {isCollapsible ? (
        <Icon
          iconName={collapsed ? 'CaretSolidRight' : 'CaretSolidDown'}
          styles={{
            root: {
              height: DEFAULT_TREE_ITEM_HEIGHT,
              width: DEFAULT_TREE_ITEM_HEIGHT,
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 10,
              transition: 'background 250ms ease',
              selectors: {
                '&:hover': { background: NeutralColors.gray70 },
                '&:before': {
                  content: '""',
                },
              },
            },
          }}
          onClick={toggleCollapsed}
        />
      ) : (
        <div style={{ width: DEFAULT_TREE_ITEM_HEIGHT / 3, height: DEFAULT_TREE_ITEM_HEIGHT / 3 }} />
      )}
      <Content
        horizontal
        verticalAlign="center"
        width={`calc(100% - ${paddingLeft + (isCollapsible ? expandIconWidth : 0)}px)`}
      >
        {onRenderIcon?.(item.kind)}
        <LabelRoot>{onRenderLabel?.(item) ?? label}</LabelRoot>
        {actions?.length && (
          <Actions horizontal className={jsActionClassName} menuOpen={menuOpen} verticalAlign="center">
            {actionMenuItems.map((am, idx) => (
              <IconButton
                key={`menu-item-${idx}`}
                ariaLabel={am.label as string}
                iconProps={{ iconName: am.icon as string }}
                styles={menuButtonItemStyle(selected)}
                title={am.label as string}
                onClick={() => am.onClick(item)}
              />
            ))}
            <IconButton
              data={{ selected }}
              iconProps={{ iconName: 'MoreVertical' }}
              menuProps={{
                onMenuDismissed: () => setMenuOpen(false),
                onMenuOpened: () => setMenuOpen(true),
                items: overflowMenuItems.map<IContextualMenuItem>((am, idx) =>
                  am.kind === 'normal'
                    ? {
                        key: `menu-item-${idx}`,
                        text: am.label as string,
                        onClick: () => am.onClick(item),
                        iconProps: { iconName: am.icon as string, styles: { root: { fontSize: 10 } } },
                        itemType: ContextualMenuItemType.Normal,
                        style: { fontSize: 12, height: 32 },
                        title: am.label as string,
                        ariaLabel: am.label as string,
                      }
                    : { key: `divider-${idx}`, itemType: ContextualMenuItemType.Divider }
                ),
              }}
              styles={menuButtonItemStyle(selected)}
              onRenderMenuIcon={() => null}
            />
          </Actions>
        )}
      </Content>
    </Root>
  );
};

export const TreeItem = React.memo(TreeItemComponent) as typeof TreeItemComponent;
