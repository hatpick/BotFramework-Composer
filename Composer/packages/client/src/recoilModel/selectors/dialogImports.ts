// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LanguageFileImport, LgFile, LuFile, QnAFile } from '@bfc/shared';
import uniqBy from 'lodash/uniqBy';
import { selector, selectorFamily } from 'recoil';

import { getBaseName } from '../../utils/fileUtil';
import { botProjectIdsState, lgFilesState, localeState, luFilesState, qnaFilesState } from '../atoms';

// Finds all the file imports starting from a given dialog file.
export const getLanguageFileImports = <T extends LgFile | LuFile | QnAFile>(
  rootDialogId: string,
  getFile: (fileId: string) => T
): LanguageFileImport[] => {
  const imports: LanguageFileImport[] = [];

  const visitedIds: string[] = [];
  const fileIds = [rootDialogId];

  while (fileIds.length) {
    const currentId = fileIds.pop() as string;

    // If this file is already visited, then continue.
    if (visitedIds.includes(currentId)) {
      continue;
    }

    const file = getFile(currentId);
    // If file is not found or file content is empty, then continue.
    if (!file || !file.content) {
      // eslint-disable-next-line no-console
      console.warn(`Could not find language import file ${currentId}`);
      continue;
    }
    const currentImports = file.imports.map((item) => {
      return {
        displayName: item.description,
        importPath: item.path,
        id: getBaseName(item.id),
      };
    });

    visitedIds.push(currentId);
    imports.push(...currentImports);
    const newIds = currentImports.map((ci) => getBaseName(ci.id));
    fileIds.push(...newIds);
  }

  return uniqBy(imports, 'id');
};

// Returns all the lg imports referenced by a dialog file and its referenced lg files.
export const lgImportsSelectorFamily = selectorFamily<LanguageFileImport[], { projectId: string; dialogId: string }>({
  key: 'lgImports',
  get: ({ projectId, dialogId }) => ({ get }) => {
    const locale = get(localeState(projectId));

    const getFile = (fileId: string) =>
      get(lgFilesState(projectId)).find((f) => f.id === fileId || f.id === `${fileId}.${locale}`) as LgFile;

    // Have to exclude common as a special case
    return getLanguageFileImports(dialogId, getFile).filter((i) => i.id !== 'common');
  },
});

// Returns all the lu imports referenced by a dialog file and its referenced lu files.
export const luImportsSelectorFamily = selectorFamily<LanguageFileImport[], { projectId: string; dialogId: string }>({
  key: 'luImports',
  get: ({ projectId, dialogId }) => ({ get }) => {
    const locale = get(localeState(projectId));

    const getFile = (fileId: string) =>
      get(luFilesState(projectId)).find((f) => f.id === fileId || f.id === `${fileId}.${locale}`) as LuFile;

    return getLanguageFileImports(dialogId, getFile);
  },
});

export const allLgFilesSelector = selector<Record<string, LgFile[]>>({
  key: 'allLgFiles',
  get: ({ get }) =>
    get(botProjectIdsState).reduce((acc, projectId) => {
      acc[projectId] = get(lgFilesState(projectId));
      return acc;
    }, {} as Record<string, LgFile[]>),
});

export const allQnaFilesSelector = selector<Record<string, QnAFile[]>>({
  key: 'allQnaFiles',
  get: ({ get }) =>
    get(botProjectIdsState).reduce((acc, projectId) => {
      acc[projectId] = get(qnaFilesState(projectId));
      return acc;
    }, {} as Record<string, QnAFile[]>),
});

export const allLuFilesSelector = selector<Record<string, LuFile[]>>({
  key: 'allLuFiles',
  get: ({ get }) =>
    get(botProjectIdsState).reduce((acc, projectId) => {
      acc[projectId] = get(luFilesState(projectId));
      return acc;
    }, {} as Record<string, LuFile[]>),
});
