// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import normalizeUrl from 'normalize-url';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { CancellationToken, MessageConnection } from 'vscode-ws-jsonrpc';
import {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  createConnection,
  LanguageClientOptions,
  ProvideDefinitionSignature,
} from 'monaco-languageclient';
import { TextDocument, Position, Location } from 'vscode';

export function createUrl(server: { [key: string]: string } | string): string {
  if (typeof server === 'string') {
    return normalizeUrl(server).replace(/^http/, 'ws');
  }
  const { host, hostname = location.hostname, port = location.port, path = '/' } = server;
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const endHost = host || `${hostname}:${port}`;
  return normalizeUrl(`${protocol}://${endHost}/${path}`);
}

export function createWebSocket(url: string): WebSocket {
  const socketOptions = {
    constructor: WebSocket,
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 10000,
    maxRetries: 500,
    debug: false,
  };
  return new ReconnectingWebSocket(url, [], socketOptions);
}

export function createLanguageClient(
  name: string,
  documentSelector: LanguageClientOptions['documentSelector'],
  connection: MessageConnection,
  onGoToFile?: (fileId: string) => void
): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name,
    clientOptions: {
      // use a language id as a document selector
      documentSelector,
      // disable the default error handler
      errorHandler: {
        error: () => ErrorAction.Continue,
        closed: () => CloseAction.DoNotRestart,
      },
      middleware: {
        provideDefinition: async (
          document: TextDocument,
          position: Position,
          token: CancellationToken,
          next: ProvideDefinitionSignature
        ) => {
          const result = await next(document, position, token);

          if (result) {
            onGoToFile?.((result as Location).uri.toString());
          }

          return null;
        },
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(createConnection(connection, errorHandler, closeHandler));
      },
    },
  });
}

export async function SendRequestWithRetry(
  languageClient: MonacoLanguageClient,
  method: string,
  data: any,
  interval = 1000
) {
  let sendTimer;

  const send = (data) => {
    try {
      languageClient.sendRequest(method, data);
      if (sendTimer) clearInterval(sendTimer);
    } catch (error) {
      sendTimer = setTimeout(() => {
        send(data);
      }, interval);
    }
  };
  if (languageClient) {
    await languageClient.onReady();
    send(data);
  }
}
