/**
 * @file fileCommands.ts
 * Comandos relacionados con la edición y manipulación de archivos.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { writeFileContent, readFileContent } from '../utils/fileUtils';
import { getCommentPrefix } from '../utils/commentUtils'; // ✅ Ruta corregida
import { blinkStatusBarMessage } from '../utils/statusBarUtils';

/**
 * Sobrescribe el archivo seleccionado con el contenido del portapapeles.
 */
/**
 * Sobrescribe el archivo seleccionado con el contenido del portapapeles
 * e inserta automáticamente un comentario con el nombre y la extensión.
 */
/**
 * Sobrescribe el archivo seleccionado con el contenido del portapapeles,
 * previa confirmación del usuario, e inserta un comentario con el nombre y la extensión.
 */

export async function overwriteFileHandler(
  clickedUri?: vscode.Uri,
  selectedUris?: vscode.Uri[]
) {
  try {
    // 🔍 Obtener la lista de archivos a sobrescribir
    let fileUris: vscode.Uri[] = [];

    if (selectedUris && selectedUris.length > 0) {
      fileUris = selectedUris; // Caso: selección múltiple
    } else if (clickedUri) {
      fileUris = [clickedUri]; // Caso: un solo archivo clickeado
    } else {
      // Caso: intentar obtener el archivo activo en el editor
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        fileUris = [activeEditor.document.uri];
      }
    }

    // 🚨 Si no hay archivos seleccionados, mostrar un mensaje y salir
    if (fileUris.length === 0) {
      blinkStatusBarMessage(`⚠️ No se seleccionó ningún archivo.`);
      return;
    }

    // 📋 Obtener el contenido del portapapeles
    const clipboardContent = await vscode.env.clipboard.readText();
    if (!clipboardContent) {
      blinkStatusBarMessage(`⚠️ El portapapeles está vacío.`);
      return;
    }

    // 🔄 Procesar cada archivo seleccionado
    for (const uri of fileUris) {
      const filePath = uri.fsPath;
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath);
      const baseName = path.basename(fileName, fileExtension); // Nombre sin extensión
      const commentPrefix = getCommentPrefix(fileExtension);

      // 🔹 Leer el contenido actual del archivo para contar líneas
      const currentFileContent = await readFileContent(filePath);
      const currentFileLines = currentFileContent
        ? currentFileContent.split('\n').length
        : 0;
      const clipboardLines = clipboardContent.split('\n').length;

      // 📌 Confirmación del usuario antes de sobrescribir
      const msg = `⚠️ ¿Desea sobrescribir "${fileName}" (${currentFileLines} líneas) con el contenido del portapapeles (${clipboardLines} líneas)?`;
      const answer = await vscode.window.showInformationMessage(
        msg,
        { modal: true },
        'Sí',
        'No'
      );

      if (answer !== 'Sí') {
        blinkStatusBarMessage(`⚠️ La operación fue cancelada.`);
        continue; // No sobrescribe este archivo, pero sigue con los demás
      }

      // 📝 Construir el comentario con el nombre del archivo
      const commentHeader = `${commentPrefix} Nombre del archivo: ${baseName}${fileExtension}\n\n\n\n`;

      // 📝 Fusionar el comentario con el contenido del portapapeles
      const newContent = `${commentHeader}${clipboardContent}`;

      // ✍️ Sobrescribir el archivo con el nuevo contenido
      await writeFileContent(filePath, newContent);

      // ✅ Mostrar mensaje en la barra de estado
      blinkStatusBarMessage(`✅ Archivo "${fileName}" sobrescrito con éxito.`);
      console.log(`✅ Archivo sobrescrito: ${filePath}`);
    }
  } catch (error) {
    blinkStatusBarMessage(`❌ Error al sobrescribir archivo: ${(error as Error).message}`);
  }
}



/**
 * Inserta un comentario con el nombre del archivo y dos líneas en blanco.
 */
export async function insertFileNameCommentHandler() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    //vscode.window.showErrorMessage('❌ No hay un editor activo.');
    blinkStatusBarMessage(`❌ No hay un editor activo.`);
    return;
  }

  const document = editor.document;
  const fileName = path.basename(document.fileName);
  const fileExtension = path.extname(document.fileName);
  const baseName = path.basename(fileName, fileExtension); // Obtiene el nombre sin la extensión
  const commentPrefix = getCommentPrefix(fileExtension);

  // Se construye el snippet con el prefijo correcto y el formato solicitado
  const snippetString = `${commentPrefix} Nombre del archivo: ${baseName}${fileExtension}\n\n`;
  const snippet = new vscode.SnippetString(snippetString);

  // Inserta el comentario al inicio del archivo (posición 0,0)
  const position = new vscode.Position(0, 0);
  editor.insertSnippet(snippet, position).then(() => {
    document.save(); // Guarda automáticamente después de la inserción
  });
}
