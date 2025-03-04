// Este archivo contiene los comandos relacionados con el portapapeles.
//file name: src/commands/clipboardCommands.ts


import * as vscode from 'vscode';
import * as path from 'path';
import { readFileContent } from '../utils/fileUtils';
import { blinkStatusBarMessage } from '../utils/statusBarUtils';

/**
 * Maneja la copia al portapapeles:
 * - Si existen varios archivos seleccionados, usamos SOLO esos (selectedUris).
 * - Si no, y existe clickedUri, usamos ese.
 * - Si no hay nada, usamos el editor activo (o pedimos un archivo manualmente).
 */
export async function copyToClipboardHandler(
  clickedUri?: vscode.Uri,
  selectedUris?: vscode.Uri[]
) {
  try {
    // 1) Pedir al usuario un texto libre (si así lo deseas)
    const userPrompt = await vscode.window.showInputBox({
      prompt: 'Escribe un texto o prompt para la IA (opcional):',
      placeHolder: 'Ej: "Resume el contenido de estos archivos..."',
      ignoreFocusOut: true
    });

    // 2) Determinar la lista final de URIs
    //    Si selectedUris tiene archivos, ignoramos clickedUri
    let fileUris: vscode.Uri[] = [];
    
    if (selectedUris && selectedUris.length > 0) {
      // Caso: selección múltiple
      fileUris = selectedUris;  // Usamos exactamente la selección
    } else if (clickedUri) {
      // Caso: un solo archivo clickeado
      fileUris = [clickedUri];
    } else {
      // Caso: no se seleccionó nada en Explorer => usar editor activo
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        fileUris = [activeEditor.document.uri];
      } else {
        // O lanzar un showOpenDialog, etc. Opcional
        //vscode.window.showWarningMessage('No se seleccionó ningún archivo ni hay editor activo.');
        blinkStatusBarMessage( 'No se seleccionó ningún archivo ni hay editor activo.');
        return;
      }
    }

    if (fileUris.length === 0) {
      //vscode.window.showWarningMessage('No hay archivos para copiar.');
      blinkStatusBarMessage( '✅ No hay archivos para copiar.');
      return;
    }

    // 3) Construir el texto a copiar
    let finalText = '';
    if (userPrompt && userPrompt.trim().length > 0) {
      finalText += userPrompt + '\n\n'; // Insertamos el texto del usuario
    }

    fileUris.forEach(uri => {
      const filePath = uri.fsPath;
      const fileName = path.basename(filePath);
      const content = readFileContent(filePath);

      finalText += '---------------------------------\n';
      //finalText += `${fileName}\n\n`;
      finalText += `${content}\n`;
    });

    finalText += '---------------------------------\n';

    // 4) Copiar al portapapeles
    await vscode.env.clipboard.writeText(finalText);

   /*
    vscode.window.setStatusBarMessage(
          `✅ Contenido copiado: ${fileUris.length} archivo(s) agregado(s) al portapapeles!`,
          4000 // El mensaje desaparece después de 4 segundos
      );*/

  blinkStatusBarMessage(`✅ Contenido copiado: ${fileUris.length} archivo(s) agregado(s) al portapapeles!`);

  } catch (error) {
    vscode.window.showErrorMessage(`❌ Error al copiar contenido: ${(error as Error).message}`);
  }
}
