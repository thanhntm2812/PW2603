//  Automatic screenshots on failure:

// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    // Take screenshot on failure
    screenshot: 'only-on-failure',
  },
};

export default config;
