// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';

import TableView from '../../../src/pages/knowledge-base/table-view';
import CodeEditor from '../../../src/pages/knowledge-base/code-editor';
import { renderWithRecoil } from '../../testUtils';
import {
  localeState,
  dialogsState,
  qnaFilesState,
  settingsState,
  schemasState,
  dispatcherState,
  currentProjectIdState,
} from '../../../src/recoilModel';
import mockProjectResponse from '../../../src/recoilModel/dispatchers/__tests__/mocks/mockProjectResponse.json';

const initialContent = `
# ?question
\`\`\`
answer
\`\`\`
`;

const state = {
  projectId: 'test',
  dialogs: [{ id: '1' }, { id: '2' }],
  locale: 'en-us',
  qnaFiles: [
    {
      id: 'a.en-us',
      content: initialContent,
      qnaSections: [
        {
          Questions: [{ content: 'question', id: 1 }],
          Answer: 'answer',
          uuid: 1,
        },
      ],
    },
  ],
  settings: {
    defaultLanguage: 'en-us',
    languages: ['en-us', 'fr-fr'],
  },
};

const updateQnAFileMock = jest.fn();

const initRecoilState = ({ set }) => {
  set(currentProjectIdState, state.projectId);
  set(localeState(state.projectId), state.locale);
  set(dialogsState(state.projectId), state.dialogs);
  set(qnaFilesState(state.projectId), state.qnaFiles);
  set(settingsState(state.projectId), state.settings);
  set(schemasState(state.projectId), mockProjectResponse.schemas);
  set(dispatcherState, {
    updateQnAFile: updateQnAFileMock,
  });
};

describe('QnA page all up view', () => {
  it('should render QnA page table view', () => {
    const { getByText, getByTestId } = renderWithRecoil(
      <TableView dialogId={'a'} projectId={state.projectId} />,
      initRecoilState
    );
    getByTestId('table-view');
    getByText('question (1)');
    getByText('answer');
  });

  it('should render QnA page code editor', () => {
    renderWithRecoil(<CodeEditor dialogId={'a'} projectId={state.projectId} />, initRecoilState);
  });
});
