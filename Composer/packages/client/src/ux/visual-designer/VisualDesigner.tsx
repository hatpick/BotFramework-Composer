// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { JsonEditor } from '@bfc/code-editor';
import { EditorExtension, mergePluginConfigs, PluginConfig } from '@bfc/extension-client';
import { PromptTab } from '@bfc/shared';
import { jsx } from '@emotion/core';
import formatMessage from 'format-message';
import { useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { Conversation } from '../../components/Conversation';
import { LeftRightSplit } from '../../components/Split/LeftRightSplit';
import { PropertyEditor } from '../../pages/design/PropertyEditor';
import { contentWrapper, editorContainer, editorWrapper, visualPanel } from '../../pages/design/styles';
import { VisualEditor } from '../../pages/design/VisualEditor';
import WarningMessage from '../../pages/design/WarningMessage';
import plugins from '../../plugins';
import { dispatcherState, schemasState, userSettingsState, validateDialogsSelectorFamily } from '../../recoilModel';
import { useShell } from '../../shell';
import { decodeDesignerPathToArrayPath } from '../../utils/convertUtils/designerPathEncoder';
import { getDialogData } from '../../utils/dialogUtil';
import { triggerNotSupported } from '../../utils/dialogValidator';
import { navigateTo } from '../../utils/navigation';

type Props = {
  botId: string;
  dialogId: string;
  triggerId?: string;
  viewMode: 'visual' | 'code';
};

export const VisualDesigner = (props: Props) => {
  const { viewMode, botId, dialogId, triggerId } = props;

  const userSettings = useRecoilValue(userSettingsState);
  const schemas = useRecoilValue(schemasState(botId));
  const dialogs = useRecoilValue(validateDialogsSelectorFamily(botId));

  const dialogMap = dialogs.reduce((acc, { content, id }) => ({ ...acc, [id]: content }), {});
  const dialogData = getDialogData(dialogMap, dialogId);

  const shellForFlowEditor = useShell('FlowEditor', botId);
  const shellForPropertyEditor = useShell('PropertyEditor', botId);

  const { 0: warningIsVisible, 1: setWarningIsVisible } = useState(true);

  const { updateDialog, setDesignPageLocation } = useRecoilValue(dispatcherState);

  const currentDialog = useMemo(() => {
    return dialogs.find((d) => dialogId === d.id) ?? dialogs[0];
  }, [dialogId, dialogs]);

  useEffect(() => {
    const currentDialog = dialogs.find(({ id }) => id === dialogId);

    const dialogContent = currentDialog?.content ? Object.assign({}, currentDialog.content) : null;
    if (dialogContent !== null && !dialogContent.id) {
      dialogContent.id = dialogId;
      updateDialog({ id: dialogId, content: dialogContent, projectId: botId });
    }
  }, [dialogId]);

  const getTabFromFragment = () => {
    const tab = window.location.hash.substring(1);

    if (Object.values<string>(PromptTab).includes(tab)) {
      return tab;
    }
  };

  const params = new URLSearchParams(location.search);
  const selectedTrigger = currentDialog?.triggers.find((t) => t.id === triggerId);
  const focused = decodeDesignerPathToArrayPath(dialogData, params.get('focused') ?? '');

  useEffect(() => {
    setDesignPageLocation(botId, {
      dialogId,
      selected: selectedTrigger?.id,
      focused,
      promptTab: getTabFromFragment(),
    });
  }, [dialogId, botId, selectedTrigger]);

  const withWarning = triggerNotSupported(currentDialog, selectedTrigger);

  const pluginConfig: PluginConfig = useMemo(() => {
    const sdkUISchema = schemas?.ui?.content ?? {};
    const userUISchema = schemas?.uiOverrides?.content ?? {};
    return mergePluginConfigs({ uiSchema: sdkUISchema }, plugins, { uiSchema: userUISchema });
  }, [schemas?.ui?.content, schemas?.uiOverrides?.content]);

  return (
    <div css={contentWrapper} role="main">
      <Conversation css={editorContainer}>
        <div css={editorWrapper}>
          <LeftRightSplit initialLeftGridWidth="65%" minLeftPixels={500} minRightPixels={350} pageMode={'dialogs'}>
            <div aria-label={formatMessage('Authoring canvas')} css={visualPanel} role="region">
              {viewMode === 'code' ? (
                <JsonEditor
                  key={'dialogjson'}
                  editorSettings={userSettings.codeEditor}
                  id={currentDialog.id}
                  schema={schemas.sdk.content}
                  value={currentDialog.content || undefined}
                  onChange={(data) => {
                    updateDialog({ id: currentDialog.id, content: data, projectId: botId });
                  }}
                />
              ) : withWarning ? (
                warningIsVisible && (
                  <WarningMessage
                    okText={formatMessage('Change Recognizer')}
                    onCancel={() => {
                      setWarningIsVisible(false);
                    }}
                    onOk={() => navigateTo(`/bot/${botId}/dialogs/${dialogId}`)}
                  />
                )
              ) : (
                <EditorExtension plugins={pluginConfig} projectId={botId} shell={shellForFlowEditor}>
                  <VisualEditor
                    isRemoteSkill={false}
                    openNewTriggerModal={() => {
                      // TODO
                    }}
                    onBlur={() => {}}
                    onFocus={() => {}}
                  />
                </EditorExtension>
              )}
            </div>
            <EditorExtension plugins={pluginConfig} projectId={botId} shell={shellForPropertyEditor}>
              <PropertyEditor key={`${dialogId}:${triggerId}`} />
            </EditorExtension>
          </LeftRightSplit>
        </div>
      </Conversation>
    </div>
  );
};
