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

/** /** @type {import('tailwindcss').Config} */
import { dark } from 'daisyui/src/theming/themes';
import { defaultTheme } from 'daisyui/src/theming/themes';

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  darkMode: ["class", '[data-theme="dark"]'], // Enabling dark mode via class and data-theme attribute

  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Poppins as the default sans font
      },  
    },
  },

  plugins: [
    require("@tailwindcss/typography"), 
    require("daisyui")
  ],

  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"], // Spreading the default light theme
          primary: "#074683", // Custom primary color
          secondary: "#4CAF50", // Custom secondary color from your extension
        },

        dark: {
          ...require("daisyui/src/theming/themes")["dark"], // Spreading the default light theme
          "base-content": "#ffffff",
        },
      },
      "dark", // The default dark theme
    ],
  },
};
