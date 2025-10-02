import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'vhree.js',
  description: 'Vue 3 bindings for Three.js',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Vhree', link: '/components/vhree' },
      { text: 'VCamera', link: '/components/vcamera' },
      { text: 'VMesh', link: '/components/vmesh' },
    ],

    sidebar: [
      {
        text: 'Components',
        items: [
          { text: 'Vhree', link: '/components/vhree' },
          { text: 'VCamera', link: '/components/vcamera' },
          { text: 'VMesh', link: '/components/vmesh' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/aifedev/vhree.js' },
    ],
  },
})
