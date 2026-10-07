/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './js/**/*.js'],
    theme: {
        extend: {
            colors: {
                csblue: '#00d2ff', // Aquele azul ciano brilhante
                csdark: '#0f0f13', // O fundo escuro principal
            }
        }
    }
};
