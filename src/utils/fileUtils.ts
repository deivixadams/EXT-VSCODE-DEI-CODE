/**
 * @file fileUtils.ts
 * Funciones para leer y escribir archivos.
*/


import * as vscode from 'vscode';
import * as fs from 'fs';

export function readFileContent(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

export function writeFileContent(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, 'utf8');
}


/**
 * Obtiene la lista final de archivos seleccionados.
 * - Si hay múltiples archivos seleccionados (selectedUris), se devuelven tal cual.
 * - Si solo hay un clic (clickedUri), se devuelve como arreglo único.
 * - Si no hay nada, se devuelve el archivo activo del editor.
 */
export async function getSelectedFileUris(
  clickedUri?: vscode.Uri,
  selectedUris?: vscode.Uri[]
): Promise<vscode.Uri[]> {
  if (selectedUris && selectedUris.length > 0) {
    return selectedUris;
  } else if (clickedUri) {
    return [clickedUri];
  } else if (vscode.window.activeTextEditor) {
    return [vscode.window.activeTextEditor.document.uri];
  } else {
    // Opción avanzada: pedir archivo si no hay ninguno
    vscode.window.showWarningMessage('No hay archivos seleccionados ni editor activo.');
    return [];
  }
}
