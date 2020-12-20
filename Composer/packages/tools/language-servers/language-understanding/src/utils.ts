// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TextDocument, Range, Position, DiagnosticSeverity, Diagnostic } from 'vscode-languageserver-types';
import { offsetRange } from '@bfc/indexers';
import { DiagnosticSeverity as BFDiagnosticSeverity, Diagnostic as BFDiagnostic } from '@bfc/shared';

export interface LUOption {
  projectId: string;
  fileId: string;
  sectionId: string;
  luFeatures: any;
}

export interface Template {
  name: string;
  parameters?: string[];
  body: string;
}

export interface LUDocument {
  uri: string;
  projectId?: string;
  fileId?: string;
  sectionId?: string;
  luFeatures: any;
  index: () => any;
}

export declare type LUImportResolverDelegate = (
  source: string,
  resourceId: string
) => {
  content: string;
  id: string;
};

const severityMap = {
  [BFDiagnosticSeverity.Error]: DiagnosticSeverity.Error,
  [BFDiagnosticSeverity.Hint]: DiagnosticSeverity.Hint,
  [BFDiagnosticSeverity.Information]: DiagnosticSeverity.Information,
  [BFDiagnosticSeverity.Warning]: DiagnosticSeverity.Warning,
};

export function convertSeverity(severity: BFDiagnosticSeverity): DiagnosticSeverity {
  return severityMap[severity];
}

export function generageDiagnostic(message: string, severity: DiagnosticSeverity, document: TextDocument): Diagnostic {
  return {
    severity,
    range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    message,
    source: document.uri,
  };
}

export function convertDiagnostics(lgDiags: BFDiagnostic[] = [], document: TextDocument, offset = 0): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const defaultRange = Range.create(Position.create(0, 0), Position.create(0, 0));
  lgDiags.forEach((diag) => {
    const range = diag.range ? offsetRange(diag.range, 1 + offset) : defaultRange;
    const diagnostic: Diagnostic = {
      severity: convertSeverity(diag.severity),
      range,
      message: diag.message,
      source: document.uri,
    };
    diagnostics.push(diagnostic);
  });
  return diagnostics;
}

export function getRangeAtPosition(document: TextDocument, position: Position): Range | undefined {
  const text = document.getText();
  const line = position.line;
  const pos = position.character;
  const lineText = text.split('\n')[line];
  let match: RegExpMatchArray | null;
  const wordDefinition = /[a-zA-Z0-9_/.-]+/g;
  while ((match = wordDefinition.exec(lineText))) {
    const matchIndex = match.index || 0;
    if (matchIndex > pos) {
      return undefined;
    } else if (wordDefinition.lastIndex >= pos) {
      return Range.create(line, matchIndex, line, wordDefinition.lastIndex);
    }
  }

  return undefined;
}
