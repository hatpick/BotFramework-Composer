// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { useRecoilValue } from 'recoil';

import { dispatcherState } from '../recoilModel';

import { Command } from './dispatcher/documents';
import { DocumentGroup } from './document/DocumentGroup';
import { documentViewModeState } from './document/documentState';
import { TreeItemData } from './tree/types';

type Props<T> = {
  root: TreeItemData<T>;
  onBotStart: (botId: string) => void;
  onBotStop: (botId: string) => void;
};

export const DocumentViewer = <T,>(props: Props<T>) => {
  const { root, onBotStart } = props;

  const currentViewMode = useRecoilValue(documentViewModeState);

  const {
    activateDocument,
    closeDocument,
    openDocument,
    executeCommand,
    changeDocumentViewMode,
    gotoNextDocument,
    gotoPreviousDocument,
  } = useRecoilValue(dispatcherState);

  const onActivateDocument = React.useCallback(
    (docId: string) => {
      activateDocument({ docId });
    },
    [activateDocument]
  );

  const onCloseDocument = React.useCallback(
    (docId) => {
      closeDocument({ docId });
    },
    [closeDocument]
  );

  const onHardActivateDocument = React.useCallback(
    (docId) => {
      activateDocument({ docId, mode: 'hard' });
    },
    [activateDocument]
  );

  const onOpenDocument = React.useCallback(
    (item: TreeItemData<any>, mode: 'soft' | 'hard' = 'hard') => {
      openDocument({ item, mode });
    },
    [openDocument]
  );

  const onExecuteCommand = React.useCallback(
    (item: TreeItemData<any>) => {
      if ((item.id as Command) === 'startBotProject') {
        onBotStart(root.botId);
        return;
      }

      executeCommand({ command: item.id as Command });
    },
    [executeCommand]
  );

  const onToggleViewerMode = React.useCallback(
    (viewMode: 'visual' | 'code') => {
      changeDocumentViewMode({ viewMode });
    },
    [changeDocumentViewMode]
  );

  return (
    <DocumentGroup
      root={root}
      viewMode={currentViewMode}
      onActivateDocument={onActivateDocument}
      onCloseDocument={onCloseDocument}
      onExecuteCommand={onExecuteCommand}
      onHardActivateDocument={onHardActivateDocument}
      onNextDocument={gotoNextDocument}
      onOpenDocument={onOpenDocument}
      onPreviousDocument={gotoPreviousDocument}
      onToggleViewerMode={onToggleViewerMode}
    />
  );
};
