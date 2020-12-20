// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DialogInfo, LgFile, LuFile, ITrigger, FormDialogSchema } from '@bfc/shared';
import { LanguageFileImport } from '@botframework-composer/types/src';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import * as React from 'react';
import { NeutralColors } from '@uifabric/fluent-theme';
import formatMessage from 'format-message';
import { useRecoilValue } from 'recoil';

import LgCodeEditor from '../../pages/language-generation/code-editor';
import LuCodeEditor from '../../pages/language-understanding/code-editor';
import LgTableView from '../../pages/language-generation/table-view';
import LuTableView from '../../pages/language-understanding/table-view';
import QnaCodeEditor from '../../pages/knowledge-base/code-editor';
import QnaTableView from '../../pages/knowledge-base/table-view';
import { TreeItemData } from '../tree/types';
import { VisualDesigner } from '../visual-designer/VisualDesigner';
import { VisualFormDialogSchemaEditor } from '../../pages/form-dialog/VisualFormDialogSchemaEditor';
import {
  dispatcherState,
  formDialogGenerationProgressingState,
  formDialogLibraryTemplatesState,
} from '../../recoilModel';

type Props = {
  item?: TreeItemData<any>;
  viewMode?: 'visual' | 'code';
  onToggleViewMode: (mode: 'visual' | 'code') => void;
  onGoToFile: (fileId: string) => void;
};

export const Document = (props: Props) => {
  const { item, onToggleViewMode, viewMode = 'visual', onGoToFile } = props;

  const { updateFormDialogSchema, generateFormDialog } = useRecoilValue(dispatcherState);
  const availableTemplates = useRecoilValue(formDialogLibraryTemplatesState);
  const formDialogGenerationProgressing = useRecoilValue(formDialogGenerationProgressingState);

  const renderDocument = React.useCallback(
    (item: TreeItemData<any>) => {
      switch (item.kind) {
        case 'lgImport': {
          const lgImport = item.data as LanguageFileImport;
          const dialogId = item.id.split(':lg:')[0];
          return viewMode === 'visual' ? (
            <LgTableView dialogId={dialogId} lgFileId={lgImport.id} path="/" projectId={item.botId} />
          ) : (
            <LgCodeEditor
              dialogId={dialogId}
              lgFileId={lgImport.id}
              path="/edit/*"
              projectId={item.botId}
              onGoToFile={onGoToFile}
            />
          );
        }
        case 'lg': {
          const lgFile = item.data as LgFile;
          const dialogId = item.id.split(':lg:')[0];
          return viewMode === 'visual' ? (
            <LgTableView dialogId={dialogId} lgFileId={lgFile.id} path="/" projectId={item.botId} />
          ) : (
            <LgCodeEditor
              dialogId={dialogId}
              lgFileId={lgFile.id}
              path="/edit/*"
              projectId={item.botId}
              onGoToFile={onGoToFile}
            />
          );
        }
        case 'luImport': {
          const luImport = item.data as LanguageFileImport;
          const dialogId = item.id.split(':lu:')[0];
          return viewMode === 'visual' ? (
            <LuTableView dialogId={dialogId} luFileId={luImport.id} path="/" projectId={item.botId} />
          ) : (
            <LuCodeEditor
              dialogId={dialogId}
              luFileId={luImport.id}
              path="/edit/*"
              projectId={item.botId}
              onGoToFile={onGoToFile}
            />
          );
        }
        case 'lu': {
          const luFile = item.data as LuFile;
          const dialogId = item.id.split(':lu:')[0];
          return viewMode === 'visual' ? (
            <LuTableView dialogId={dialogId} luFileId={luFile.id} path="/" projectId={item.botId} />
          ) : (
            <LuCodeEditor
              dialogId={dialogId}
              luFileId={luFile.id}
              path="/edit/*"
              projectId={item.botId}
              onGoToFile={onGoToFile}
            />
          );
        }
        case 'qna': {
          const dialogId = item.id.split(':qna:')[0];
          return viewMode === 'visual' ? (
            <QnaTableView path="/" projectId={item.botId} />
          ) : (
            <QnaCodeEditor dialogId={dialogId} path="/edit" projectId={item.botId} />
          );
        }
        case 'formDialog':
        case 'dialog': {
          const dialog = item.data as DialogInfo;
          const dialogId = dialog.id;

          return <VisualDesigner botId={item.botId} dialogId={dialogId} viewMode={viewMode} />;
        }
        case 'trigger': {
          const trigger = item.data as ITrigger;
          const dialogId = item.id.split(':trigger:')[0];

          return <VisualDesigner botId={item.botId} dialogId={dialogId} triggerId={trigger.id} viewMode={viewMode} />;
        }
        case 'schema': {
          const formDialogSchema = item.data as FormDialogSchema;
          const projectId = item.botId;

          return (
            <VisualFormDialogSchemaEditor
              generationInProgress={formDialogGenerationProgressing}
              projectId={projectId}
              schemaId={formDialogSchema.id}
              showEditor={viewMode === 'code'}
              templates={availableTemplates.filter((t) => !t.isGlobal).map((t) => t.name)}
              onChange={(id, content) => updateFormDialogSchema({ id, content, projectId })}
              onGenerate={(schemaId) => generateFormDialog({ schemaId, projectId })}
            />
          );
        }
      }

      return (
        <Stack tokens={{ padding: 8 }}>
          <code>{JSON.stringify(item.data, null, 4)}</code>
        </Stack>
      );
    },
    [viewMode]
  );

  return (
    <Stack verticalFill>
      <CommandBar
        farItems={[
          {
            key: 'toggleMode',
            title: viewMode === 'visual' ? formatMessage('View code') : formatMessage('View designer'),
            onClick: () => onToggleViewMode(viewMode === 'visual' ? 'code' : 'visual'),
            iconOnly: true,
            iconProps: { iconName: viewMode === 'visual' ? 'VisioDiagram' : 'CodeEdit' },
          },
        ]}
        items={[]}
        styles={{ root: { height: 32, margin: 0, padding: 0, fontSize: 14 } }}
      />
      <Stack
        grow
        verticalFill
        styles={{ root: { position: 'relative', borderTop: `1px solid ${NeutralColors.gray60}` } }}
      >
        {item && renderDocument(item)}
      </Stack>
    </Stack>
  );
};
