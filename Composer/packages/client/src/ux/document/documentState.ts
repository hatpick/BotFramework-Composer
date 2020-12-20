// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { atom, atomFamily, selector } from 'recoil';

import { TreeItemData } from '../tree/types';

type DocumentParams = any;

export type DocumentKind = 'lu' | 'lg' | 'qna' | 'dialog' | 'trigger' | 'none';

export type Document = {
  id: string;
  botId: string;
  kind: DocumentKind;
  title: string;
  activationMode: 'soft' | 'hard';
  icon: string;
  params: DocumentParams;
  item?: TreeItemData<any>;
};

export const documentViewModeState = atom<'visual' | 'code'>({
  key: 'documentViewModeState',
  default: 'code',
});

export const documentIdsState = atom<string[]>({
  key: 'documentIdsState',
  default: [],
});

export const documentsState = atomFamily<Document, string>({
  key: 'documentsState',
  default: (id) => ({
    botId: '',
    id,
    title: 'Untitled',
    activationMode: 'soft',
    kind: 'none',
    icon: '',
    params: {},
    content: {},
  }),
});

export const mruDocumentIdsState = atom<string[]>({
  key: 'mruDocumentsState',
  default: [],
});

export const documentsSelector = selector<Record<string, Document>>({
  key: 'documentsSelector',
  get: ({ get }) => {
    return get(documentIdsState).reduce((acc, docId) => {
      acc[docId] = get(documentsState(docId));
      return acc;
    }, {} as Record<string, Document>);
  },
});

export const activeDocumentIdState = atom({
  key: 'activeDocumentIdState',
  default: '',
});

export const activeDocumentSelector = selector<Document>({
  key: 'activeDocumentSelector',
  get: ({ get }) => {
    return get(documentsState(get(activeDocumentIdState)));
  },
});

export const nextDocumentIdSelector = selector<string>({
  key: 'nextDocumentSelector',
  get: ({ get }) => {
    const activeDocumentId = get(activeDocumentIdState);
    const documentIds = get(documentIdsState);
    const activeIdx = documentIds.findIndex((documentId) => documentId === activeDocumentId);

    if (activeIdx < 0) {
      return '';
    }

    const nextIdx = (activeIdx + 1) % documentIds.length;
    return documentIds[nextIdx];
  },
});

export const previousDocumentIdSelector = selector<string>({
  key: 'previousDocumentSelector',
  get: ({ get }) => {
    const activeDocumentId = get(activeDocumentIdState);
    const documentIds = get(documentIdsState);
    const activeIdx = documentIds.findIndex((documentId) => documentId === activeDocumentId);

    const count = documentIds.length;
    let prevIdx = activeIdx - 1;
    if (prevIdx < 0) {
      prevIdx += count;
    }

    return documentIds[prevIdx];
  },
});
