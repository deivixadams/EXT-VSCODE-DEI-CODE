import ollamaModule from 'ollama';
const ollama = (ollamaModule as any).default || ollamaModule;

export class AiModelClient {
  model: string;
  useGPU: boolean;

  /**
   * Inicializa el cliente con el modelo especificado y la opción de usar GPU.
   * @param model Nombre del modelo a utilizar (por defecto "qwen2.5-coder:14b").
   * @param useGPU Indica si se debe usar GPU (por defecto true).
   */
  constructor(model: string = "qwen2.5-coder:14b", useGPU: boolean = true) {
    this.model = model;
    this.useGPU = useGPU;
  }

  /**
   * Envía el prompt al modelo de Ollama y retorna la respuesta.
   * @param prompt El prompt a enviar.
   * @param responseFormat Formato de respuesta esperado ("TEXT", "JSON" o "SCRIPT").
   * @returns La respuesta del modelo como string.
   */
  async sendPrompt(prompt: string, responseFormat: string = "TEXT"): Promise<string> {
    const formatInstructions: Record<string, string> = {
      "SCRIPT": "Devuelve solo el código, sin explicaciones.",
      "JSON": "Responde solo en formato JSON válido.",
      "TEXT": "Responde solo en texto plano, sin código ni formato especial."
    };

    responseFormat = responseFormat.toUpperCase();
    if (!formatInstructions[responseFormat]) {
      responseFormat = "TEXT";
    }

    const promptWithFormat = `${formatInstructions[responseFormat]}\n\n${prompt}`;
    const options = this.useGPU ? { device: "gpu" } : {};

    try {
      // Llama al modelo a través de la API de Ollama
      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: promptWithFormat }],
        options: options
      });
      if (response && response.message && response.message.content) {
        return response.message.content.trim();
      } else {
        return "⚠️ Respuesta inesperada del modelo.";
      }
    } catch (error: any) {
      return `❌ Error al procesar el prompt: ${error.message}`;
    }
  }
}
