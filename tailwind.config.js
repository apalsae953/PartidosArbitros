/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './legal.html', './src/**/*.{js,jsx}'],
  // Los estilos hover solo se aplican con ratón; en móvil no se quedan "pegados" tras tocar
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        // Salida rápida y frenada suave: da sensación de respuesta inmediata
        salida: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        resaltar: {
          '0%': { backgroundColor: 'rgb(209 250 229)' },
          '100%': { backgroundColor: 'rgb(255 255 255 / 0)' },
        },
      },
      animation: {
        resaltar: 'resaltar 1.8s cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
};
