const favicon = require('serve-favicon');
const express = require('express'),
  app = express(),
  dist = 'dist';

const PORT = process.env.PORT || 5000;

const Pokedex = require('pokedex-promise-v2');
const P = new Pokedex({
  // cacheLimit: 0
});

app.use(express.static(dist));

app.use(favicon(__dirname + '/dist/images/icons/icon-72x72.png'));

app.get('/', (request, response) => {
  response.sendFile(`${__dirname}/${dist}/index.html`);
});

app.get('/api/pokemon/species/:name', (request, response) => {
  const name = request.params.name;
  P.resource(`/api/v2/pokemon-species/${name}`).then(function (result) {
    response.send(result);
  }).catch(function (error) {
    response.status(500).send(error.code);
  });
});

app.get('/api/pokemon/evolution-chain/', (request, response) => {
  const evolutionChainId = request.query.evolutionId;
  const promiseRequest = evolutionChainId ? P.getEvolutionChainById(evolutionChainId) : P.getEvolutionChainsList();
  promiseRequest
    .then(function (result) {
      response.send(result);
    }).catch(function (error) {
    response.status(500).send(error.code);
  });
});

const server = app.listen(PORT, function () {
  console.log(`Your app is listening on port ${server.address().port}`);
});

server.setTimeout(5000);
