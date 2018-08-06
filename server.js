const favicon = require('serve-favicon');
const fs = require('fs');
const express = require('express'),
  app = express(),
  dist = 'dist';

const PORT = process.env.PORT || 5000;

const Pokedex = require('pokedex-promise-v2');
const P = new Pokedex({
  // cacheLimit: 0
  timeout: 3000 // 3s
});

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

const cachedEvolutionList = [1, 2, 3];

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
    const resourceLocation = `./mock/species/${name}.json`;
    if(!fs.existsSync(resourceLocation)) {
      return response.status(500).send(error.code);
    }
    return response.send(fs.readFileSync(resourceLocation));
  });
});

app.get('/api/pokemon/evolution-chain/', (request, response) => {
  const evolutionChainId = request.query.evolutionId;
  const promiseRequest = evolutionChainId ? P.getEvolutionChainById(evolutionChainId) : P.getEvolutionChainsList();
  promiseRequest
    .then(function (result) {
      response.send(result);
    }).catch(function () {
    if(evolutionChainId) {
      return response.send(fs.readFileSync(`./mock/evolution-chain/${getRandomItem(cachedEvolutionList)}.json`));
    }
    return response.send(fs.readFileSync('./mock/evolution-chain-index.json'));
  });
});

const server = app.listen(PORT, function () {
  console.log(`Your app is listening on port ${server.address().port}`);
});

server.setTimeout(5000);
