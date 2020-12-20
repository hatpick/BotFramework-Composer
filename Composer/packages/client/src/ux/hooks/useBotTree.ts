// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { extractSchemaProperties, groupTriggersByPropertyReference } from '@bfc/indexers';
import { BotInProject, DialogInfo, FormDialogSchema, ITrigger, LanguageFileImport } from '@bfc/shared';
import * as React from 'react';
import { useRecoilValue } from 'recoil';

import {
  allLgFilesSelector,
  allLuFilesSelector,
  allQnaFilesSelector,
  botProjectSpaceSelector,
  jsonSchemaFilesByProjectIdSelector,
} from '../../recoilModel';
import { getFriendlyName } from '../../utils/dialogUtil';
import { TreeItemData } from '../tree/types';

type AugmentedBotInProject = BotInProject & {
  lgImports: Record<string, LanguageFileImport[]>;
  luImports: Record<string, LanguageFileImport[]>;
  formDialogSchemas: FormDialogSchema[];
};

const getTriggerName = (trigger: ITrigger) => {
  return trigger.displayName || getFriendlyName({ $kind: trigger.type });
};

export const useBotTree = <T>(): TreeItemData<T> => {
  const projectCollection = useRecoilValue<AugmentedBotInProject[]>(botProjectSpaceSelector);
  const jsonSchemaFilesByProjectId = useRecoilValue(jsonSchemaFilesByProjectIdSelector);
  const allLuFiles = useRecoilValue(allLuFilesSelector);
  const allLgFiles = useRecoilValue(allLgFilesSelector);
  const allQnaFiles = useRecoilValue(allQnaFilesSelector);
  const locale = 'en-us';

  const getFormDialogTriggers = React.useCallback(
    (botId: string, dialog: DialogInfo) => {
      const jsonSchemaFiles = jsonSchemaFilesByProjectId[botId];
      const dialogSchemaProperties = extractSchemaProperties(dialog, jsonSchemaFiles);
      const groupedTriggers = groupTriggersByPropertyReference(dialog, { validProperties: dialogSchemaProperties });

      const propertyItems = Object.keys(groupedTriggers).map<TreeItemData<any>>((p) => ({
        id: `${dialog.id}:property:${p}`,
        botId,
        data: { label: p },
        kind: 'triggerGroup',
        children: groupedTriggers[p].map<TreeItemData<any>>((t) => ({
          id: `${dialog.id}:trigger:${t.id}`,
          botId,
          data: { ...t, label: getTriggerName(t) },
          kind: 'trigger',
        })),
      }));

      return propertyItems;
    },
    [jsonSchemaFilesByProjectId]
  );

  const getDialogTriggers = React.useCallback(
    (botId: string, dialog: DialogInfo) => {
      return dialog.isFormDialog
        ? getFormDialogTriggers(botId, dialog)
        : dialog.triggers.map<TreeItemData<any>>((t) => ({
            id: `${dialog.id}:trigger:${t.id}`,
            botId,
            data: { ...t, label: getTriggerName(t) },
            kind: 'trigger',
          }));
    },
    [getFormDialogTriggers]
  );

  const getDialogLuFiles = React.useCallback(
    (bot: AugmentedBotInProject, dialog: DialogInfo) => {
      if (dialog.isFormDialog) {
        return [
          ...allLuFiles[bot.projectId]
            .filter((luFile) => luFile.id === dialog.id || luFile.id === `${dialog.id}.${locale}`)
            .map<TreeItemData<any>>((luFile) => ({
              botId: bot.projectId,
              kind: 'lu',
              data: { ...luFile, label: luFile.id },
              id: `${dialog.id}:lu:${luFile.id}`,
            })),
          ...bot.luImports[dialog.id].map<TreeItemData<any>>((luImport) => ({
            botId: bot.projectId,
            kind: 'luImport',
            data: { ...luImport, label: luImport.displayName },
            id: `${dialog.id}:lu:${luImport.id}`,
          })),
        ];
      } else {
        return allLuFiles[bot.projectId]
          .filter((luFile) => luFile.id.startsWith(dialog.id))
          .map<TreeItemData<any>>((luFile) => ({
            botId: bot.projectId,
            kind: 'lu',
            data: { ...luFile, label: luFile.id },
            id: `${dialog.id}:lu:${luFile.id}`,
          }));
      }
    },
    [allLuFiles]
  );

  const getDialogQnaFiles = React.useCallback(
    (bot: AugmentedBotInProject, dialog: DialogInfo) => {
      return allQnaFiles[bot.projectId]
        .filter((qnaFile) => qnaFile.id.startsWith(dialog.id))
        .map<TreeItemData<any>>((qnaFile) => ({
          botId: bot.projectId,
          kind: 'qna',
          data: { ...qnaFile, label: qnaFile.id },
          id: `${dialog.id}:qna:${qnaFile.id}`,
        }));
    },
    [allQnaFiles]
  );

  const getDialogLgFiles = React.useCallback(
    (bot: AugmentedBotInProject, dialog: DialogInfo) => {
      if (dialog.isFormDialog) {
        return [
          ...allLgFiles[bot.projectId]
            .filter((lgFile) => lgFile.id === dialog.id || lgFile.id === `${dialog.id}.${locale}`)
            .map<TreeItemData<any>>((lgFile) => ({
              botId: bot.projectId,
              kind: 'lg',
              data: { ...lgFile, label: lgFile.id },
              id: `${dialog.id}:lg:${lgFile.id}`,
            })),
          ...bot.lgImports[dialog.id].map<TreeItemData<any>>((lgImport) => ({
            botId: bot.projectId,
            kind: 'lgImport',
            data: { ...lgImport, label: lgImport.displayName },
            id: `${dialog.id}:lg:${lgImport.id}`,
          })),
        ];
      } else {
        return allLgFiles[bot.projectId]
          .filter((lgFile) => lgFile.id.startsWith('common') || lgFile.id.startsWith(dialog.id))
          .map<TreeItemData<any>>((lgFile) => ({
            botId: bot.projectId,
            kind: 'lg',
            data: { ...lgFile, label: lgFile.id },
            id: `${dialog.id}:lg:${lgFile.id}`,
          }));
      }
    },
    [allLgFiles]
  );

  const getBotDialogItems = React.useCallback((bot: AugmentedBotInProject) => {
    return bot.dialogs.map<TreeItemData<any>>((d) => {
      const lgFiles = getDialogLgFiles(bot, d);
      const luFiles = getDialogLuFiles(bot, d);
      const qnaFiles = getDialogQnaFiles(bot, d);
      const triggers = getDialogTriggers(bot.projectId, d);

      const children: TreeItemData<any>[] = [];

      if (triggers.length) {
        children.push({
          id: `triggerGroup:${d.id}`,
          botId: bot.projectId,
          data: { label: 'triggers' },
          kind: 'triggerGroup',
          children: triggers,
        });
      }

      if (qnaFiles.length) {
        children.push({
          id: `qnaGroup:${d.id}`,
          botId: bot.projectId,
          data: { label: 'knowledge base' },
          kind: 'qnaGroup',
          children: qnaFiles,
        });
      }

      if (lgFiles.length) {
        children.push({
          id: `lgGroup:${d.id}`,
          botId: bot.projectId,
          data: { label: 'language generation' },
          kind: 'lgGroup',
          children: lgFiles,
        });
      }

      if (luFiles.length) {
        children.push({
          id: `luGroup:${d.id}`,
          botId: bot.projectId,
          data: { label: 'language understanding' },
          kind: 'luGroup',
          children: luFiles,
        });
      }

      return {
        id: `${d.isFormDialog ? 'formDialog' : 'dialog'}:${d.id}`,
        botId: bot.projectId,
        data: { ...d, label: d.displayName },
        kind: d.isFormDialog ? 'formDialog' : 'dialog',
        children,
      };
    });
  }, []);

  const getFormDialogSchemaItems = React.useCallback(
    (bot: AugmentedBotInProject) => {
      return bot.formDialogSchemas.map<TreeItemData<any>>((fd) => ({
        botId: bot.projectId,
        id: `schema:${fd.id}`,
        kind: 'schema',
        data: { ...fd, label: fd.id },
      }));
    },
    [getDialogLgFiles, getDialogLuFiles, getFormDialogTriggers]
  );

  const getBotItems = React.useCallback(
    (bot: AugmentedBotInProject): TreeItemData<any> => {
      const schemas = getFormDialogSchemaItems(bot);
      const dialogs = getBotDialogItems(bot);

      const children: TreeItemData<any>[] = [];

      if (schemas.length) {
        children.push({
          id: `schemaGroup:${bot.projectId}`,
          botId: bot.projectId,
          data: { label: 'schemas' },
          kind: 'schemaGroup',
          children: schemas,
        });
      }

      if (dialogs.length) {
        children.push({
          id: `dialogGroup:${bot.projectId}`,
          botId: bot.projectId,
          data: { label: 'dialogs' },
          kind: 'dialogGroup',
          children: dialogs,
        });
      }

      return {
        id: `bot:${bot.projectId}`,
        botId: bot.projectId,
        data: { ...bot, label: bot.name },
        kind: 'bot',
        children,
      };
    },
    [getFormDialogSchemaItems, getBotDialogItems]
  );

  const root: TreeItemData<any> = React.useMemo(
    () => ({
      id: 'root',
      botId: 'root',
      children: projectCollection.map(getBotItems),
      data: { label: 'Solution' },
      kind: 'root',
    }),
    [projectCollection]
  );

  return root;
};
