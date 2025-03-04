
//file name: src/commands/index.ts

import { copyToClipboardHandler } from './clipboardCommands';
import { overwriteFileHandler, insertFileNameCommentHandler } from './fileCommands';
import { copyToGoogleHandler } from './searchCommands';
import { generateAppsHandler, openDirectoryHandler, collapseAllNodesHandler, expandAllNodesHandler } from './folderCommands';
import { copyToModelMultipleHandler } from './fileToModelMultiple'; // Importa el nuevo handler

// Definición de interfaz para mantener ordenado
interface CommandDefinition {
  name: string;
  callback: (...args: any[]) => any;
}

export const COMMANDS: CommandDefinition[] = [
  {
    name: 'ai-prog.copyToClipboard',
    callback: copyToClipboardHandler,
  },
  {
    name: 'ai-prog.copyToModel',
    callback: copyToModelMultipleHandler,  // Usar el nuevo handler
  },
  {
    name: 'ai-prog.overwriteFile',
    callback: overwriteFileHandler,
  },
  {
    name: 'ai-prog.copyToGoogle',
    callback: copyToGoogleHandler,
  },
  {
    name: 'ai-prog.insertFileNameComment',
    callback: insertFileNameCommentHandler,
  },
  {
    name: 'ai-prog.generateApps',
    callback: generateAppsHandler,
  },
  {
    name: 'ai-prog.openDirectory',
    callback: openDirectoryHandler,
  },
  {
    name: 'ai-prog.collapseAllNodes',
    callback: collapseAllNodesHandler,
  },
  {
    name: 'ai-prog.expandAllNodes',
    callback: expandAllNodesHandler,
  }
  // NOTA: El comando "ai-prog.copyToClipboard" se registra aparte.
];
