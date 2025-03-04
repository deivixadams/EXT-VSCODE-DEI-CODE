/**
 * @file fileUtils.ts
 * Funciones para leer y escribir archivos.
 */

import * as fs from 'fs';

export function readFileContent(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

export function writeFileContent(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, 'utf8');
}
