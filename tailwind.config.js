// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     "./src/**/*.{js,jsx,ts,tsx}",
//     "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js"
//   ],
//   darkMode: ["class", '[data-theme="dark"]'],
//   theme: {
//     extend: {},
//   },

//   plugins: [require("@tailwindcss/typography"), require("daisyui")], 


//   theme: {
//     extend: {
//       fontFamily: {
//         sans: ['Poppins', ...tailwind_theme.fontFamily.sans],
//         mono: ['Victor Mono', ...tailwind_theme.fontFamily.mono],
//         // or name them
//         // 'victor-mono': ['Victor Mono'],
//         // poppins: ['Poppins'],
//       },
//     },
//   },
  
//   daisyui: {
//     themes: [
//       {
//         light: {
//           ...require("daisyui/src/theming/themes")["light"],
//           primary: "#074683",
//         }
//       },

//       "dark"],

//   },

// }

/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js"
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Define Poppins as the default sans font
      },
    },
  },

  plugins: [require("@tailwindcss/typography"), require("daisyui")],

  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#074683",
        }
      },
      "dark",
    ],
  },
};
  