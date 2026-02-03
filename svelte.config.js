import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			'$lib': 'src/lib',
			'$lib/*': 'src/lib/*',
			'$experience': 'src/experience',
			'$experience/*': 'src/experience/*',
			'$styled': 'styled-system',
			'$styled/*': 'styled-system/*',
			'svelte-scrollytelling': 'src/lib/index.ts',
			'svelte-scrollytelling/*': 'src/lib/*'
		}
	}
};

export default config;
