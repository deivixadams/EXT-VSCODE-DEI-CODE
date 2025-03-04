import { AiIntegration } from './AiIntegration';

const aiIntegration = new AiIntegration();

aiIntegration.sendPromptToAiWithSpinner("Hola, ¿cómo estás?", "plain_text", (response) => {
  if (response.error) {
    console.error("Error:", response.error);
  } else {
    console.log("Respuesta de AI-Model:", response);
  }
});
