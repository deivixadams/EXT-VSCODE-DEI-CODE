/**
 * @file searchCommands.ts
 * Comandos relacionados con la búsqueda de contenido en Google.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { readFileContent } from '../utils/fileUtils';
import { blinkStatusBarMessage } from '../utils/statusBarUtils';

export async function copyToGoogleHandler(uri?: vscode.Uri) {
  try {
    if (!uri) {
        vscode.window.setStatusBarMessage(
            '❌ Debe seleccionar un archivo.',
                4000 // El mensaje desaparece después de 4 segundos
        );
      return;
    }
    const filePath = uri.fsPath;
    const content = readFileContent(filePath);

    // Tomar las primeras 10 palabras
    const query = encodeURIComponent(content.split(/\s+/).slice(0, 50).join(' '));
    const googleSearchUrl = `https://www.google.com/search?q=${query}`;

    vscode.env.openExternal(vscode.Uri.parse(googleSearchUrl));
    
    //vscode.window.showInformationMessage(`🌍 Buscando en Google: ${query}`);


    vscode.window.setStatusBarMessage(
      `🌍 Buscando en Google: ${query}`,
        4000 // El mensaje desaparece después de 4 segundos
    );

  } catch (error) {
    //vscode.window.showErrorMessage(`❌ Error en la búsqueda: ${(error as Error).message}`);

    vscode.window.setStatusBarMessage(
      `❌ Error en la búsqueda: ${(error as Error).message}`,
        4000 // El mensaje desaparece después de 4 segundos
    );

  }
}
