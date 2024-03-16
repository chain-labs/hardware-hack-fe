import type { Config } from "tailwindcss";
const defaultTheme = require("tailwindcss/defaultTheme");
import {
    BACKGROUND_MEDIA_DESKTOP,
    BACKGROUND_MEDIA_MOBILE,
} from "./src/constants";
import { BG_GRADIENT } from "./src/copy";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "url-bg": `url('${BACKGROUND_MEDIA_DESKTOP}')`,
                "url-bg-mob": `url('${BACKGROUND_MEDIA_MOBILE}')`,
                "gradient-url": `url('${BG_GRADIENT}')`,
            },
            fontFamily: {
                SpaceGrotesk: [
                    '"Space Grotesk"',
                    ...defaultTheme.fontFamily.serif,
                ],
            },
            colors: {
                "black-text": "#293748",
                "slate-prime": "#E2E7FF",
            },
            keyframes: {
                "spin-element-md": {
                    "0%": { transform: "translate(-50%, 40%) rotate(0deg)" },
                    "50%": { transform: "translate(-50%, 40%) rotate(180deg)" },
                    "100%": {
                        transform: "translate(-50%, 40%) rotate(360deg)",
                    },
                },
                "spin-element": {
                    "0%": { transform: "translate(-50%, 55%) rotate(0deg)" },
                    "50%": { transform: "translate(-50%, 55%) rotate(180deg)" },
                    "100%": {
                        transform: "translate(-50%, 55%) rotate(360deg)",
                    },
                },
                "throw-up": {
                    "0%": { transform: "translate(0, 0)" },
                    "100%": { transform: "translate(0, -1000px)" },
                },
            },
            animation: {
                "spin-element-md": "spin-element-md 120s linear infinite",
                "spin-element": "spin-element 120s linear infinite",
                "throw-up": "throw-up 3s 2s ease-out forwards",
            },
        },
    },
    plugins: [],
};
export default config;
