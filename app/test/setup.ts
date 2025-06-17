import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
process.env.REDBUILDER_API_KEY = 'test-key';
process.env.REDBUILDER_API_BASE_URL = 'https://api.redbuilder.io/v1'; 