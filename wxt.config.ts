import { defineConfig } from 'wxt';
import tsconfigPaths from 'vite-tsconfig-paths';

// INSTÄLLNING - Byt till 'firefox' eller 'edge' vid behov
export default defineConfig({
  extensionApi: 'chrome',

  // INSTÄLLNING - Manifest-version (använd 3 för Chrome MV3)
  manifest: {
    name: 'FormTrace',
    short_name: 'FormTrace',
    description:
      'FormTrace helps developers, QA testers and support teams understand why forms fail — directly in the browser.',
    version: '1.0.0',

    // INSTÄLLNING - Lägg till fler permissions om nätverksinspelning kräver det
    permissions: ['activeTab', 'storage', 'scripting'],

    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['page-network-probe.js'],
        matches: ['<all_urls>']
      }
    ],

    action: {
      default_popup: 'popup/index.html',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },

    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
  },

  vite: () => ({
    plugins: [tsconfigPaths()],
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
  }),
});
