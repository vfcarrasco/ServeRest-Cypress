const { defineConfig } = require('cypress');
const dayjs = require('dayjs'); // biblioteca para formatar data/hora

// gera timestamp no formato DD-MM-AAAA_HH-mm-ss
const timestamp = dayjs().format('DD-MM-YYYY_HH-mm-ss');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',   // pasta onde os relatórios serão salvos
    overwrite: false,               // não sobrescreve relatórios anteriores
    html: true,
    json: true,
    reportFilename: `report_${timestamp}` // nome do arquivo com data/hora
  },
  e2e: {
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
});