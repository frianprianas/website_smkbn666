/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-blue': '#e0f2fe', // sky-100
                'brand-white': '#ffffff',
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(to bottom right, #e0f2fe, #ffffff)',
            }
        },
    },
    plugins: [],
}
