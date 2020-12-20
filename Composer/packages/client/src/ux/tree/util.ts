// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BotInProject, DialogInfo } from '@bfc/shared';
import formatMessage from 'format-message';

import { BotStatus } from '../../constants';

import { TreeItemAction, TreeItemData, TreeItemKind } from './types';

export const DEFAULT_TREE_ITEM_HEIGHT = 24;

export const DEFAULT_INDENTATION_PADDING = (DEFAULT_TREE_ITEM_HEIGHT * 2) / 3;

export const countDescendants = <T extends { id: string; children?: T[] }>(
  node: T,
  collapsed: Record<string, boolean>
) => {
  let sum = 0;
  for (const n of (node?.children ?? []).filter((c) => !collapsed[c.id])) {
    sum += countDescendants(n, collapsed);
  }

  sum += node.children?.length ?? 0;
  return sum;
};

const getPath = <T extends { id: string; children?: T[]; data: { label: string } }>(
  item: T,
  parents: Record<string, T>
) => {
  const path: string[] = [];
  let currentItem = item;
  if (currentItem) {
    while (currentItem) {
      path.push(currentItem.data.label);
      currentItem = parents[currentItem.id];
      while (currentItem && currentItem.data.label.indexOf('Group') !== -1) {
        currentItem = parents[currentItem.id];
      }
    }
  }
  return path.reverse().join('/');
};

export const getAllNodes = <T extends { id: string; children?: T[]; data: { label: string } }>(
  root: T,
  options?: Partial<{ collapsed: Record<string, boolean>; skipRoot: boolean }>
): {
  nodes: T[];
  levels: Record<string, number>;
  parents: Record<string, T>;
  paths: Record<string, string>;
  descendantCount: Record<string, number>;
} => {
  const nodes: T[] = [];
  const levels: Record<string, number> = {};
  const parents: Record<string, T> = {};
  const paths: Record<string, string> = {};
  const descendantCount: Record<string, number> = {};

  const addNode = (node: T, parent: T | null, level = 0) => {
    if (!options?.skipRoot || node.id !== root.id) {
      nodes.push(node);
    }
    levels[node.id] = level;
    if (parent) {
      parents[node.id] = parent;
    }
    paths[node.id] = getPath(node, parents);
    if (options?.collapsed?.[node.id]) return;
    if (node?.children?.length) {
      node.children.forEach((n) => addNode(n, node, level + 1));
    }
  };

  const countHelper = (node: T) => {
    let sum = 0;
    for (const n of node?.children ?? []) {
      sum += countHelper(n);
    }

    descendantCount[node.id] = sum + (node.children?.length ?? 0);
    return descendantCount[node.id];
  };

  addNode(root, null);
  countHelper(root);

  return { nodes, levels, parents, paths, descendantCount };
};

export const getIconName = (kind: TreeItemKind) => {
  let iconName = '';
  switch (kind) {
    case 'trigger':
      iconName = 'LightningBolt';
      break;
    case 'dialog':
      iconName = 'Org';
      break;
    case 'formDialog':
      iconName = 'Table';
      break;
    case 'bot':
      iconName = 'CubeShape';
      break;
    case 'lg':
    case 'lgImport':
      iconName = 'Robot';
      break;
    case 'lu':
    case 'luImport':
      iconName = 'People';
      break;
    case 'qna':
      iconName = 'Chat';
      break;
    case 'schema':
      iconName = 'OfficeFormsLogo';
      break;
    // case 'schemaGroup':
    //   iconName = 'FormLibrary';
    //   break;
    // case 'lgGroup':
    //   iconName = 'ChatBot';
    //   break;
    // case 'qnaGroup':
    //   iconName = 'OfficeChat';
    //   break;
    // case 'luGroup':
    //   iconName = 'Group';
    //   break;
  }

  return iconName;
};

export const getActionMenuItems = (
  item: TreeItemData<any>,
  callbacks: {
    onBotStart: (botId: string) => void;
    onBotStop: (botId: string) => void;
    onAddDialog: (projectId: string) => void;
    onEditManifest: (projectId: string) => void;
    onExportZip: (projectId: string) => void;
  }
): TreeItemAction<any, TreeItemData<any>>[] => {
  const { onAddDialog, onBotStart, onBotStop, onEditManifest, onExportZip } = callbacks;

  const actions: TreeItemAction<any, TreeItemData<any>>[] = [];
  switch (item.kind) {
    case 'bot': {
      const bot = item.data as BotInProject;
      const isRunning = bot.buildEssentials.status === BotStatus.connected;

      actions.push(
        {
          kind: 'normal',
          label: isRunning ? formatMessage('Stop bot') : formatMessage('Start bot'),
          icon: isRunning ? 'CircleStopSolid' : 'TriangleSolidRight12',
          onClick: () => (isRunning ? onBotStop(bot.projectId) : onBotStart(bot.projectId)),
          showAsAction: true,
        },
        {
          kind: 'normal',
          label: formatMessage('Add a dialog'),
          icon: 'Add',
          onClick: () => onAddDialog(bot.projectId),
        },
        {
          kind: 'separator',
        },
        {
          kind: 'normal',
          label: formatMessage('Create/edit skill manifest'),
          onClick: () => onEditManifest(bot.projectId),
        },
        {
          kind: 'normal',
          label: formatMessage('Export this bot as .zip'),
          onClick: () => onExportZip(bot.projectId),
        },
        {
          kind: 'normal',
          label: formatMessage('Settings'),
          onClick: () => {
            //TODO
          },
        }
      );
      break;
    }
    case 'formDialog':
    case 'dialog': {
      const dialog = item.data as DialogInfo;
      actions.push(
        {
          kind: 'normal',
          label: formatMessage('Add trigger'),
          icon: 'Add',
          onClick: () => {},
        },
        {
          kind: 'normal',
          label: formatMessage('Add knowledge base'),
          icon: 'Add',
          onClick: () => {},
        }
      );

      if (dialog.isFormDialog) {
        actions.push(
          { kind: 'separator' },
          {
            kind: 'normal',
            label: formatMessage('Remove dialog'),
            icon: 'Delete',
            onClick: () => {},
          },
          {
            kind: 'normal',
            label: formatMessage('Edit schema'),
            icon: 'Edit',
            onClick: () => {},
          }
        );
      }
      break;
    }
    case 'trigger': {
      actions.push({
        kind: 'normal',
        label: formatMessage('Remove dialog'),
        icon: 'Delete',
        onClick: () => {},
      });
      break;
    }
    case 'schema': {
      actions.push({
        kind: 'normal',
        label: formatMessage('Remove schema'),
        icon: 'Delete',
        onClick: () => {},
      });
      break;
    }
  }
  return actions;
};
