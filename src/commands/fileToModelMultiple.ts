// Nombre del archivo: fileToModelMultiple.ts



// Nombre del archivo: fileToModelMultiple.ts

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AiIntegration } from '../utils/AiIntegration';

/**
 * Maneja la acción de copiar múltiples archivos al modelo de IA,
 * incluyendo un prompt del usuario y un prompt base cargado desde un archivo.
 */
export async function copyToModelMultipleHandler(
  clickedUri?: vscode.Uri,
  selectedUris?: vscode.Uri[]
): Promise<void> {
  // Paso 1: Determinar archivos seleccionados
  let fileUris: vscode.Uri[] = [];
  if (selectedUris?.length) {
    fileUris = selectedUris;
  } else if (clickedUri) {
    fileUris = [clickedUri];
  } else if (vscode.window.activeTextEditor) {
    fileUris = [vscode.window.activeTextEditor.document.uri];
  } else {
    vscode.window.showErrorMessage("No se encontró ningún archivo seleccionado ni hay un editor activo.");
    return;
  }

  // Paso 2: Solicitar un prompt adicional al usuario
  const userPrompt = await vscode.window.showInputBox({
    prompt: "Escribe un prompt para la consulta al modelo:",
    placeHolder: "Ej: 'Resume el contenido de estos archivos...'",
    ignoreFocusOut: true,
  });
  if (userPrompt === undefined) {
    vscode.window.showWarningMessage("Operación cancelada.");
    return;
  }

  // Paso 3: Leer base_prompt.md desde ruta relativa
  const basePromptPath = path.join(__dirname, 'base_prompt.md');
  let basePromptContent = "";
  try {
    basePromptContent = fs.readFileSync(basePromptPath, 'utf8');
  } catch (err) {
    vscode.window.showErrorMessage("No se pudo leer el archivo base_prompt.md: " + (err as Error).message);
    return;
  }

  // Paso 4: Leer contenido de los archivos seleccionados
  let filesContent = "";
  for (const uri of fileUris) {
    try {
      const content = fs.readFileSync(uri.fsPath, 'utf8');
      const fileName = path.basename(uri.fsPath);
      filesContent += `\n\n----- Archivo: ${fileName} -----\n\n${content}`;
    } catch (err) {
      vscode.window.showWarningMessage(`No se pudo leer el archivo ${uri.fsPath}: ${(err as Error).message}`);
    }
  }

  // Paso 5: Combinar el contenido final del prompt
  const finalContent = `${userPrompt}\n\n${basePromptContent}\n\n${filesContent}`;

  // Paso 6: Guardar el prompt final como registro local
  const homeDir = os.homedir();
  const logFilePath = path.join(homeDir, "sendtomodel.md");
  const timestamp = new Date().toLocaleString();
  try {
    fs.appendFileSync(logFilePath, `\n\n--- Envío a ${timestamp} ---\n\n${finalContent}\n`, 'utf8');
    vscode.window.showInformationMessage(`📝 Prompt registrado en ${logFilePath}`);
  } catch (err) {
    vscode.window.showWarningMessage("No se pudo guardar el prompt final: " + (err as Error).message);
  }

  // Paso 7: Mostrar en consola (debug)
  console.log("Prompt final enviado al modelo:\n", finalContent);

  // Paso 8: Enviar al modelo y mostrar la respuesta
  const aiIntegration = new AiIntegration();
  aiIntegration.sendPromptToAiWithSpinner(finalContent, "plain_text", (response: any) => {
    if (response.error) {
      vscode.window.showErrorMessage(`❌ Error en AI-Model: ${response.error}`);
    } else {
      // Mostrar en OutputChannel
      const output = vscode.window.createOutputChannel("DEI Code - AI Response");
      output.clear();
      output.appendLine(response.content);
      output.show(true);

      // Copiar al portapapeles
      vscode.env.clipboard.writeText(response.content).then(
        () => console.log("✅ Respuesta copiada al portapapeles."),
        (err) => console.error("❌ Error al copiar al portapapeles:", err)
      );

      vscode.window.showInformationMessage("✅ Respuesta recibida y copiada al portapapeles.");
    }
  });
}
