import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class RedBuilderProvider extends BaseProvider {
  name = 'RedBuilder';
  getApiKeyLink = 'https://api.redbuilder.io';

  config = {
    baseUrlKey: 'REDBUILDER_API_BASE_URL',
    apiTokenKey: 'REDBUILDER_API_KEY',
  };

  // Static list of available models from the RedBuilder API
  staticModels: ModelInfo[] = [
    {
      name: '@cf/meta/llama-4-scout-17b-16e-instruct',
      label: 'Llama 4 Scout (17B)',
      provider: this.name,
      maxTokenAllowed: 4096,
      capabilities: ['text-generation', 'image-understanding', 'function-calling'],
    },
    {
      name: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      label: 'Llama 3.3 70B Instruct FP8 Fast',
      provider: this.name,
      maxTokenAllowed: 4096,
      capabilities: ['text-generation', 'batch-processing', 'function-calling'],
    },
    {
      name: '@cf/meta/llama-3.1-8b-instruct-fast',
      label: 'Llama 3.1 8B Instruct Fast',
      provider: this.name,
      maxTokenAllowed: 4096,
      capabilities: ['text-generation', 'multilingual'],
    },
    {
      name: '@cf/google/gemma-3-12b-it',
      label: 'Gemma 3 12B IT',
      provider: this.name,
      maxTokenAllowed: 128000,
      capabilities: ['text-generation', 'image-understanding', 'multilingual', 'lora'],
    },
    {
      name: '@cf/mistralai/mistral-small-3.1-24b-instruct',
      label: 'Mistral Small 3.1 24B Instruct',
      provider: this.name,
      maxTokenAllowed: 128000,
      capabilities: ['text-generation', 'vision-understanding', 'function-calling'],
    },
    {
      name: '@cf/qwen/qwq-32b',
      label: 'QwQ 32B',
      provider: this.name,
      maxTokenAllowed: 4096,
      capabilities: ['text-generation', 'reasoning', 'lora'],
    },
    {
      name: '@cf/meta/llama-2-7b-chat-fp16',
      label: 'Llama 2 7B Chat FP16',
      provider: this.name,
      maxTokenAllowed: 4096,
      capabilities: ['text-generation', 'chat'],
    },
    {
      name: '@cf/meta/llama-2-7b-chat-int8',
      label: 'Llama 2 7B Chat INT8',
      provider: this.name,
      maxTokenAllowed: 4096,
      capabilities: ['text-generation', 'chat'],
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'REDBUILDER_API_BASE_URL',
      defaultApiTokenKey: 'REDBUILDER_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      return this.staticModels;
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch RedBuilder models, using static list');
        return this.staticModels;
      }

      const res = await response.json();
      return (res.models || []).map((model: any) => ({
        name: model.id,
        label: model.name || model.id,
        provider: this.name,
        maxTokenAllowed: model.max_tokens || 4096,
        capabilities: model.capabilities || [],
      }));
    } catch (error) {
      console.error('Error fetching RedBuilder models:', error);
      return this.staticModels;
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'REDBUILDER_API_BASE_URL',
      defaultApiTokenKey: 'REDBUILDER_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
} 