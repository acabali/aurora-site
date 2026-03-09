export const providers = {
  anthropic: {
    enabled: Boolean(process.env.ANTHROPIC_API_KEY),
    model: 'claude-sonnet-4-6',
  },
  jules: {
    enabled: Boolean(process.env.JULES_API_KEY),
    baseUrl: 'https://developers.google.com/jules/api',
  },
} as const;
