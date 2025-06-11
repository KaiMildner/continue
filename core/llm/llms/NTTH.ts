import { LLMOptions } from "../../index.js";
import { BaseLLM } from "../index.js";

interface IModel {
  provider: string;
  type: string;
  name: string;
  version: string;
  deploymentName: string;
  createdAt: string;
  updatedAt: string;
  keyName: string;
  capabilities: string[];
  classification: string;
  providerPriority: number;
  priority: number;
  id: string;
}

class NTTH extends BaseLLM {
  static token?: string;
  static providerName = "ntth";
  models?: IModel[];
  static defaultOptions: Partial<LLMOptions> = {
    apiBase: "https://api.ntth.ai/v1",
    model: "GPT-4o",
  };

  constructor(options: LLMOptions) {
    super(options);

    if (options.model === "AUTODETECT") {
      return;
    }
  }

  async login() {
    let endpoint = this.apiBase + "auth/appLogin";
    let body = JSON.stringify({
      id: this.apiId,
      secret: this.apiSecret,
    });

    try {
      const response = await this.fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Couldn't login to NTTH. Please check your API ID and secret.",
        );
      }
      const data = await response.json();
      NTTH.token = data.token;
    } catch (error) {
      throw new Error(
        `Login failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async listModels(): Promise<string[]> {
    const headers: Record<string, string> = {};

    if (!NTTH.token) {
      await this.login();
    }

    headers.Authorization = `Bearer ${NTTH.token}`;

    const response = await this.fetch(this.apiBase + "chat/models", {
      method: "GET",
      headers: headers,
    });

    const data = await response.json();

    if (response.ok) {
      this.models = data;
      return data.map(
        (model: any) =>
          model.provider + ": " + model.name + " (" + model.version + ")",
      );
    } else {
      throw new Error("Failed to list NTTH models.");
    }
  }
}

export default NTTH;
