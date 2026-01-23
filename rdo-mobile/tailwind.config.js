/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                rdo: {
                    accent: '#e11d48', // Rose-600
                },
                dark: {
                    900: '#1a1a1a',
                }
            },
        },
    },
    plugins: [],
}
