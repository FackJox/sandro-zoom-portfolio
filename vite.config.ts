import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: ['styled-system']
		}
	},
	ssr: {
		// GSAP is CommonJS - bundle it during SSR build to avoid ESM import issues
		noExternal: ['gsap']
	}
});
