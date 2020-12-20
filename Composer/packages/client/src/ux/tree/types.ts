// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export type TreeItemKind =
  | 'root'
  | 'bot'
  | 'dialogGroup'
  | 'dialog'
  | 'formDialog'
  | 'triggerGroup'
  | 'trigger'
  | 'luGroup'
  | 'lu'
  | 'luImport'
  | 'lgGroup'
  | 'lg'
  | 'lgImport'
  | 'qna'
  | 'qnaGroup'
  | 'schemaGroup'
  | 'schema'
  | 'command';

export type TreeItemData<T> = {
  id: string;
  botId: string;
  data: T;
  kind: TreeItemKind;
  children?: TreeItemData<T>[];
};

export type TreeItemActionSeparator = { kind: 'separator' };

export type TreeItemActionNormal<T, P extends TreeItemData<T>> = {
  kind: 'normal';
  label: React.ReactNode;
  onClick: (item: P) => void;
  icon?: React.ReactNode;
  showAsAction?: boolean;
  onRender?: (item: P) => void;
};

export type TreeItemAction<T, P extends TreeItemData<T>> = TreeItemActionSeparator | TreeItemActionNormal<T, P>;
