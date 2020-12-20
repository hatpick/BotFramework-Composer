// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/* eslint-disable react-hooks/rules-of-hooks */

import { navigate } from '@reach/router';
import { CallbackInterface, useRecoilCallback } from 'recoil';

import { rootBotProjectIdSelector } from '../../recoilModel';
import {
  activeDocumentIdState,
  documentIdsState,
  DocumentKind,
  documentsSelector,
  documentsState,
  documentViewModeState,
  mruDocumentIdsState,
  nextDocumentIdSelector,
  previousDocumentIdSelector,
} from '../document/documentState';
import { TreeItemData } from '../tree/types';
import { getIconName } from '../tree/util';

export const availableCommands = ['showAppSettings', 'showBotSettings'] as const;
export type Command = typeof availableCommands[number];

export const documentDispatcher = () => {
  const activateDocument = useRecoilCallback(
    ({ set, reset, snapshot }: CallbackInterface) => async ({
      docId,
      mode = 'soft',
    }: {
      docId: string;
      mode?: 'soft' | 'hard';
    }) => {
      const documentIds = await snapshot.getPromise(documentIdsState);
      const documents = await snapshot.getPromise(documentsSelector);

      const softDocumentId = Object.keys(documents).find((id) => documents[id].activationMode === 'soft');
      const softDocumentIdx = documentIds.findIndex((id) => id === softDocumentId);

      if (!documentIds.includes(docId)) {
        // doc is not already open
        if (softDocumentId) {
          // a soft doc is open
          reset(documentsState(softDocumentId));
          set(documentIdsState, (docIds) => {
            const newDocIds = docIds.slice();
            newDocIds.splice(softDocumentIdx, 1, docId);
            return newDocIds;
          });
        } else {
          // no soft doc is open
          set(documentIdsState, (docIds) => [...docIds, docId]);
        }
      }

      set(mruDocumentIdsState, (docIds) => {
        let newDocIds = docIds.slice();

        const foundIdx = newDocIds.findIndex((id) => id === docId);
        if (foundIdx !== -1) {
          newDocIds.splice(foundIdx, 1);
        }

        newDocIds = newDocIds.filter((id) => id !== softDocumentId);
        newDocIds.unshift(docId);
        return newDocIds;
      });

      set(activeDocumentIdState, docId);
      if (mode === 'hard') {
        set(documentsState(docId), (doc) => ({ ...doc, activationMode: mode }));
      }
    }
  );

  const executeCommand = useRecoilCallback(
    ({ snapshot }: CallbackInterface) => async ({ command }: { command: Command }) => {
      const projectId = await snapshot.getPromise(rootBotProjectIdSelector);
      switch (command) {
        case 'showAppSettings':
          navigate(`/settings`);
          break;
        case 'showBotSettings':
          navigate(`/bot/${projectId}/botProjectsSettings`);
          break;
      }
    }
  );

  const openDocument = useRecoilCallback(
    ({ set, snapshot }: CallbackInterface) => async ({
      item,
      mode = 'soft',
    }: {
      item: TreeItemData<any>;
      mode?: 'soft' | 'hard';
    }) => {
      const docId = item.id;
      const document = await snapshot.getPromise(documentsState(docId));
      if (!document.botId) {
        set(documentsState(docId), (document) => ({
          ...document,
          botId: item.botId,
          icon: getIconName(item.kind),
          kind: item.kind as DocumentKind,
          title: item.data.label,
          activationMode: mode,
          item,
        }));
      }

      set(documentsState(docId), (document) => ({ ...document, mode }));

      activateDocument({ docId, mode });
    }
  );

  const closeDocument = useRecoilCallback(
    ({ set, reset, snapshot }: CallbackInterface) => async ({ docId }: { docId: string }) => {
      const mruDocumentIds = await snapshot.getPromise(mruDocumentIdsState);
      const newMruDocumentIds = mruDocumentIds.filter((id) => id !== docId);
      reset(documentsState(docId));
      set(documentIdsState, (ids) => ids.filter((id) => id !== docId));
      set(mruDocumentIdsState, newMruDocumentIds);

      if (newMruDocumentIds.length) {
        activateDocument({ docId: newMruDocumentIds[0] });
      } else {
        reset(activeDocumentIdState);
      }
    }
  );

  const changeDocumentViewMode = useRecoilCallback(
    ({ set }: CallbackInterface) => ({ viewMode }: { viewMode: 'visual' | 'code' }) => {
      set(documentViewModeState, viewMode);
    }
  );

  const gotoNextDocument = useRecoilCallback(({ snapshot }: CallbackInterface) => async () => {
    const nextId = await snapshot.getPromise(nextDocumentIdSelector);
    activateDocument({ docId: nextId });
  });

  const gotoPreviousDocument = useRecoilCallback(({ snapshot }: CallbackInterface) => async () => {
    const prevId = await snapshot.getPromise(previousDocumentIdSelector);
    activateDocument({ docId: prevId });
  });

  return {
    changeDocumentViewMode,
    openDocument,
    activateDocument,
    closeDocument,
    executeCommand,
    gotoNextDocument,
    gotoPreviousDocument,
  };
};
