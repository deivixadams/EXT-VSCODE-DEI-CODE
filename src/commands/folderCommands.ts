/**
 * @file folderCommands.ts
 * Comandos relacionados con carpetas y la vista de archivos.
 */

import * as vscode from 'vscode';
import { blinkStatusBarMessage } from '../utils/statusBarUtils';

/**
 * Generar Aplicaciones (simulación).
 */
export async function generateAppsHandler() {
  //vscode.window.showInformationMessage('⚙️ Generando aplicaciones (simulación).');
  blinkStatusBarMessage(`⚙️ Generando aplicaciones (simulación).`);
}

/**
 * Abre un cuadro de diálogo para seleccionar una carpeta y luego
 * la abre en una nueva ventana de VS Code.
 */
export async function openDirectoryHandler() {
  try {
    const folders = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Abrir carpeta'
    });
    if (!folders || folders.length === 0) {
      vscode.window.showWarningMessage('No se seleccionó ninguna carpeta.');
      return;
    }
    await vscode.commands.executeCommand('vscode.openFolder', folders[0], true);
  } catch (error) {
    vscode.window.showErrorMessage(`❌ Error al abrir directorio: ${(error as Error).message}`);
  }
}

/**
 * Contrae todos los nodos del árbol de archivos.
 */
export async function collapseAllNodesHandler() {
  try {
    await vscode.commands.executeCommand('workbench.files.action.collapseExplorerFolders');
    vscode.window.showInformationMessage('🔽 Árbol de archivos contraído.');
  } catch (error) {
    vscode.window.showErrorMessage(`❌ Error al contraer nodos: ${(error as Error).message}`);
  }
}

/**
 * Expande todos los nodos del árbol de archivos (si es compatible).
 */
export async function expandAllNodesHandler() {
  try {
    await vscode.commands.executeCommand('list.expandAll');
    vscode.window.showInformationMessage('🔼 Árbol de archivos expandido (si es compatible).');
  } catch (error) {
    vscode.window.showErrorMessage(`❌ Error al expandir nodos: ${(error as Error).message}`);
  }
}
