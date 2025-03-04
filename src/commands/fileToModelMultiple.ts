import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AiIntegration } from '../utils/AiIntegration';

export async function copyToModelMultipleHandler(
  clickedUri?: vscode.Uri,
  selectedUris?: vscode.Uri[]
): Promise<void> {
  // Usamos los archivos seleccionados que ya se han pasado como argumentos (menú contextual)
  // o, si no existen, usamos el archivo activo.
  let fileUris: vscode.Uri[] = [];
  if (selectedUris && selectedUris.length > 0) {
    fileUris = selectedUris;
  } else if (clickedUri) {
    fileUris = [clickedUri];
  } else {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      fileUris = [activeEditor.document.uri];
    } else {
      vscode.window.showErrorMessage("No se encontró ningún archivo seleccionado ni hay un editor activo.");
      return;
    }
  }

  // Solicita al usuario un prompt adicional para la consulta.
  const userPrompt = await vscode.window.showInputBox({
    prompt: "Escribe un prompt para la consulta al modelo:",
    placeHolder: "Ej: 'Resume el contenido de estos archivos...'"
  });
  if (userPrompt === undefined) {
    vscode.window.showWarningMessage("Operación cancelada.");
    return;
  }

  // Lee el contenido del archivo base_prompt.md (ruta fija).
  const basePromptPath = "E:\\DEV\\EXTENSION_VSC\\DEI-CODE-v3\\src\\commands\\base_prompt.md";
  let basePromptContent = "";
  try {
    basePromptContent = fs.readFileSync(basePromptPath, 'utf8');
  } catch (err) {
    vscode.window.showErrorMessage("No se pudo leer el archivo base_prompt.md: " + (err as Error).message);
    return;
  }

  // Lee el contenido de cada archivo seleccionado.
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

  // Construye el contenido final: prompt del usuario + base_prompt + contenidos de archivos.
  const finalContent = `${userPrompt}\n\n${basePromptContent}\n\n${filesContent}`;

  // Guarda el prompt final en un archivo "sendtomodel.md" en el directorio del usuario activo.
  const homeDir = os.homedir();
  const logFilePath = path.join(homeDir, "sendtomodel.md");
  const now = new Date().toLocaleString();
  try {
    fs.appendFileSync(logFilePath, `\n\n--- Envío a ${now} ---\n\n${finalContent}\n`, 'utf8');
    vscode.window.showInformationMessage(`El prompt final se ha registrado en sendtomodel.md en ${homeDir}`);
  } catch (err) {
    vscode.window.showWarningMessage("No se pudo guardar el prompt final en sendtomodel.md: " + (err as Error).message);
  }

  // Muestra el prompt final en la consola (para depuración)
  console.log("Prompt final enviado al modelo:\n", finalContent);

  // Envía el contenido final al modelo usando AiIntegration (con spinner)
  const aiIntegration = new AiIntegration();
  aiIntegration.sendPromptToAiWithSpinner(finalContent, "plain_text", (response: any) => {
    if (response.error) {
      vscode.window.showErrorMessage(`Error en AI-Model: ${response.error}`);
    } else {
      vscode.window.showInformationMessage(`Respuesta de AI-Model: ${response.content}`);
      // Copia la respuesta al portapapeles
      vscode.env.clipboard.writeText(response.content).then(
        () => console.log("Respuesta copiada al portapapeles."),
        (err) => console.error("Error copiando al portapapeles:", err)
      );
    }
  });
}
//Prueba2