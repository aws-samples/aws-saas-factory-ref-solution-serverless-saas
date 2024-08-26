import { defineConfig } from 'cypress';

export default defineConfig({
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  e2e: {
    supportFile: false,
  },
});
