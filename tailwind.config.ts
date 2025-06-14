import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],

    theme: {
        extend: {}
    },

    plugins: [require("@catppuccin/tailwindcss")({
        prefix: "catp",
        defaultFlavour: "macchiato",
    })],
} satisfies Config;
