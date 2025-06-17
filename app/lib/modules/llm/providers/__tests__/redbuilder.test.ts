import { describe, it, expect, vi } from 'vitest';
import type { Env } from '../../../worker-configuration';
import RedBuilderProvider from '../redbuilder';

// Mock the global fetch
declare global {
  var fetch: typeof globalThis.fetch;
}

describe('RedBuilderProvider', () => {
  let provider: RedBuilderProvider;

  beforeEach(() => {
    provider = new RedBuilderProvider();
    vi.clearAllMocks();
  });

  it('should have the correct name', () => {
    expect(provider.name).toBe('RedBuilder');
  });

  it('should have the correct API key link', () => {
    expect(provider.getApiKeyLink).toBe('https://api.redbuilder.io');
  });

  it('should have the correct config keys', () => {
    expect(provider.config.baseUrlKey).toBe('REDBUILDER_API_BASE_URL');
    expect(provider.config.apiTokenKey).toBe('REDBUILDER_API_KEY');
  });

  it('should have static models defined', () => {
    expect(provider.staticModels.length).toBeGreaterThan(0);
    expect(provider.staticModels[0]).toHaveProperty('name');
    expect(provider.staticModels[0]).toHaveProperty('label');
    expect(provider.staticModels[0]).toHaveProperty('provider');
    expect(provider.staticModels[0]).toHaveProperty('maxTokenAllowed');
  });

  describe('getDynamicModels', () => {
    it('should return static models when no API key or base URL is provided', async () => {
      const models = await provider.getDynamicModels();
      expect(models).toEqual(provider.staticModels);
    });

    it('should fetch models from API when credentials are provided', async () => {
      const mockResponse = {
        models: [
          {
            id: '@cf/meta/llama-4-scout-17b-16e-instruct',
            name: 'Llama 4 Scout',
            max_tokens: 4096,
            capabilities: ['text-generation', 'image-understanding'],
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const models = await provider.getDynamicModels(
        {},
        undefined,
        {
          REDBUILDER_API_KEY: 'test-key',
          REDBUILDER_API_BASE_URL: 'https://api.redbuilder.io/v1',
        } as Env,
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.redbuilder.io/v1/models',
        {
          headers: {
            Authorization: 'Bearer test-key',
          },
        },
      );

      expect(models).toHaveLength(1);
      expect(models[0]).toEqual({
        name: '@cf/meta/llama-4-scout-17b-16e-instruct',
        label: 'Llama 4 Scout',
        provider: 'RedBuilder',
        maxTokenAllowed: 4096,
        capabilities: ['text-generation', 'image-understanding'],
      });
    });

    it('should return static models when API request fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const models = await provider.getDynamicModels(
        {},
        undefined,
        {
          REDBUILDER_API_KEY: 'test-key',
          REDBUILDER_API_BASE_URL: 'https://api.redbuilder.io/v1',
        } as Env,
      );

      expect(models).toEqual(provider.staticModels);
    });
  });

  describe('getModelInstance', () => {
    it('should throw error when no credentials are provided', () => {
      expect(() =>
        provider.getModelInstance({
          model: '@cf/meta/llama-4-scout-17b-16e-instruct',
          serverEnv: {} as Env,
        }),
      ).toThrow('Missing configuration for RedBuilder provider');
    });

    it('should return a model instance when credentials are provided', () => {
      const model = provider.getModelInstance({
        model: '@cf/meta/llama-4-scout-17b-16e-instruct',
        serverEnv: {
          REDBUILDER_API_KEY: 'test-key',
          REDBUILDER_API_BASE_URL: 'https://api.redbuilder.io/v1',
        } as Env,
      });

      expect(model).toBeDefined();
    });
  });
}); 