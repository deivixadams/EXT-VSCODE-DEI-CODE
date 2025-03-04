import * as vscode from 'vscode';
import { AiModelClient } from './AiModelClient';

/**
 * Remueve las triple backticks y cualquier identificador de lenguaje de un bloque de código,
 * dejando solo el contenido puro, preservando las indentaciones internas.
 * Si no se encuentra el patrón típico, elimina los backticks al inicio y fin.
 * @param code Código retornado por el modelo.
 * @returns Código limpio sin delimitadores Markdown.
 */
function cleanCodeBlock(code: string): string {
  const regex = /^```(?:\w+)?\n([\s\S]*?)\n```$/;
  const match = code.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return code.replace(/^`+/, '').replace(/`+$/, '').trim();
}

class FileWriter {
  /**
   * Extrae un bloque JSON del texto (buscando la primera "{" y la última "}").
   * @param rawText Texto que contiene JSON.
   * @returns El substring JSON, o null si no se encontró.
   */
  extractJson(rawText: string): string | null {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return rawText.substring(start, end + 1);
    }
    return null;
  }
}

export class AiIntegration {
  private ia: AiModelClient;
  private fileWriter: FileWriter;

  constructor() {
    // Inicializa el cliente de AI-Model y el gestor de archivos.
    this.ia = new AiModelClient();
    this.fileWriter = new FileWriter();
  }

  /**
   * Envía el prompt a AI-Model de forma asíncrona y ejecuta el callback con la respuesta.
   * @param userInput Texto ingresado por el usuario.
   * @param responseType Tipo de respuesta ('plain_text', 'json', 'script').
   * @param callback Función que recibe la respuesta.
   */
  public sendPromptToAi(userInput: string, responseType: string = "plain_text", callback: (response: any) => void): void {
    (async () => {
      await this._processAiRequest(userInput, responseType, callback);
    })();
  }

  /**
   * Envía el prompt mostrando un spinner en la barra de estado hasta obtener la respuesta.
   * @param userInput Texto ingresado por el usuario.
   * @param responseType Tipo de respuesta ('plain_text', 'json', 'script').
   * @param callback Función que recibe la respuesta.
   */
  public sendPromptToAiWithSpinner(userInput: string, responseType: string = "plain_text", callback: (response: any) => void): void {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.show();

    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;
    statusBarItem.text = `Consultando AI-Model ${spinnerFrames[frameIndex]}`;

    const spinnerInterval = setInterval(() => {
      frameIndex = (frameIndex + 1) % spinnerFrames.length;
      statusBarItem.text = `Consultando AI-Model ${spinnerFrames[frameIndex]}`;
    }, 200);

    (async () => {
      await this._processAiRequest(userInput, responseType, (response: any) => {
        clearInterval(spinnerInterval);
        statusBarItem.dispose();
        callback(response);
      });
    })();
  }

  private async _processAiRequest(userInput: string, responseType: string, callback: (response: any) => void): Promise<void> {
    const prompt = `${userInput}`;
    try {
      console.info("Enviando solicitud a AI-Model...");

      const formatMap: Record<string, string> = {
        "script": "SCRIPT",
        "json": "JSON",
        "plain_text": "TEXT"
      };
      const responseFormat = formatMap[responseType.toLowerCase()] || "TEXT";

      // Llama al método sendPrompt de AiModelClient.
      const rawResponse = await this.ia.sendPrompt(prompt, responseFormat);

      if (responseFormat === "JSON") {
        const jsonResponse = this.fileWriter.extractJson(rawResponse);
        if (jsonResponse) {
          try {
            const parsedResponse = JSON.parse(jsonResponse);
            callback(parsedResponse);
            return;
          } catch (e) {
            console.error("Error al decodificar JSON:", e);
          }
        }
      } else if (responseFormat === "SCRIPT") {
        const cleanedCode = cleanCodeBlock(rawResponse);
        callback({ type: "script", content: cleanedCode });
        return;
      } else if (responseFormat === "TEXT") {
        callback({ type: "plain_text", content: rawResponse.trim() });
        return;
      }

      console.warn("AI-Model no devolvió una respuesta válida o el tipo no es compatible.");
      callback({ error: "Respuesta no válida o tipo de respuesta no soportado." });
    } catch (e: any) {
      console.error("Error en la comunicación con AI-Model:", e);
      callback({ error: `Error en la comunicación con AI-Model: ${e.message}` });
    }
  }
}
