// Nombre del archivo: AiModelClient.ts



// Nombre del archivo: AiModelClient.ts

import ollamaModule from 'ollama';
const ollama = (ollamaModule as any).default || ollamaModule;

/**
 * Cliente que se conecta al modelo local de Ollama y envía prompts,
 * personalizando el formato de respuesta según se requiera.
 */
export class AiModelClient {
  model: string;
  useGPU: boolean;

  /**
   * Inicializa el cliente con el modelo especificado.
   * @param model Nombre del modelo a utilizar (ej. "qwen2.5-coder:14b").
   * @param useGPU Indica si se debe usar GPU (true por defecto).
   */
  constructor(model: string = "qwen2.5:7b", useGPU: boolean = true) {
    this.model = model;
    this.useGPU = useGPU;
  }

  /**
   * Envía un prompt al modelo de Ollama y devuelve una respuesta como string plano.
   * @param prompt Texto enviado como input al modelo.
   * @param responseFormat Formato de respuesta esperado: "TEXT", "JSON" o "SCRIPT".
   * @returns Respuesta generada por el modelo como texto plano.
   */
  async sendPrompt(prompt: string, responseFormat: string = "TEXT"): Promise<string> {
    const formatInstructions: Record<string, string> = {
      "SCRIPT": "Devuelve solo el código, sin explicaciones.",
      "JSON": "Responde solo en formato JSON válido.",
      "TEXT": "Responde solo en texto plano, sin código ni formato especial."
    };

    // Validar el tipo de respuesta solicitado
    responseFormat = responseFormat.toUpperCase();
    const instruction = formatInstructions[responseFormat] || formatInstructions["TEXT"];

    const finalPrompt = `${instruction}\n\n${prompt}`;
    const options = this.useGPU ? { device: "gpu" } : {};

    try {
      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: finalPrompt }],
        options: options
      });

      if (response && response.message?.content) {
        return response.message.content.trim();
      } else {
        return "⚠️ Respuesta inesperada del modelo.";
      }
    } catch (error: any) {
      return `❌ Error al procesar el prompt: ${error.message || 'desconocido'}`;
    }
  }
}
