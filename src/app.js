let evolutionIds = [];
let speciesInEvolution = [];

function setContent(markup) {
  let element = document.querySelector('.tab-content');
  element.innerHTML = markup;
}

function toggleLoader(isVisible) {
  let element = document.querySelector('.loader');
  if (isVisible) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}

function processError(error) {
  document.querySelector('.error-text').classList.remove('hidden');
  toggleLoader(false);
  console.error(error)
}

function isArrayEqual(array1, array2) {
  return JSON.stringify(array1) === JSON.stringify(array2);
}

function shuffleArray(array) {
  const shuffledArray = [...array];
  do {
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffledArray[i];
      shuffledArray[i] = shuffledArray[j];
      shuffledArray[j] = temp;
    }
  }
  while (isArrayEqual(array, shuffledArray));
  return shuffledArray;
}

async function fetchData(url, cb) {
  document.querySelector('.error-text').classList.add('hidden');
  toggleLoader(true);
  try {
    const response = await fetch(url);
    toggleLoader(false);
    if (response.ok) {
      const result = await response.json();
      return cb(result);
    }
    throw Error(response.statusText);
  } catch (err) {
    processError(err);
  }
}

function updateOnlineStatus() {
  let color;
  const offlineMessageElement = document.querySelector('.offline-message');
  if(!navigator.onLine) {
    color = '#9c979a';
    offlineMessageElement.classList.remove('hidden')
  } else {
    color = '#FF742B';
    offlineMessageElement.classList.add('hidden')
  }
  document.querySelector('html').style.setProperty("--primary-color", color);
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

const getHigherLevelSpecies = (speciesList) => {
  if (Array.isArray(speciesList) && speciesList.length) {
    return [speciesList[0].species].concat(getHigherLevelSpecies(speciesList[0].evolves_to || []));
  } else {
    return [];
  }
};

const getSpecies = (evolution) => {
  const item = evolution.chain;
  const higherLevelSpecies = getHigherLevelSpecies(item.evolves_to);
  if (higherLevelSpecies.length < 1) {
    fetchEvolutionChain();
    return [];
  }
  return [item.species].concat(higherLevelSpecies);
};

function fetchPokemon(name) {
  const nodes = Array.prototype.slice.call(document.querySelectorAll('.result-wrapper .tabs'));
  nodes.forEach(node => {
    node.classList.remove('tab-selected');
  });
  document.querySelector(`.result-wrapper #${name}`).classList.add('tab-selected');
  fetchData(`/api/pokemon/species/${name}`, renderResults)
}

function fetchSelectedPokemon(event) {
  fetchPokemon(event.target.id);
}

function showResults() {
  document.querySelector('.game-area').classList.add('hidden');
  document.querySelector('.result-wrapper').classList.remove('hidden');
  const element = document.querySelector('.result-wrapper');
  const tabHeaderElement = document.createElement('DIV');
  tabHeaderElement.setAttribute('class', 'tab-headers align-center');
  const tabContentElement = document.createElement('DIV');
  tabContentElement.setAttribute('class', 'tab-content');
  speciesInEvolution.map(item => {
    const id = getId(item.url);
    const name = item.name;
    const img = document.createElement('IMG');
    img.setAttribute('src', `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`);
    img.setAttribute('id', name);
    img.setAttribute('title', name);
    img.setAttribute('alt', name);
    img.setAttribute('onclick', 'fetchSelectedPokemon(event)');
    img.setAttribute('class', 'tabs cursor-pointer');
    tabHeaderElement.append(img);
  });
  element.append(tabHeaderElement);
  element.append(tabContentElement);
  const firstElement = document.querySelector('.tab-headers .tabs');
  firstElement.classList.add('tab-selected');
  fetchPokemon(firstElement.id);
}

function showHint() {
  document.querySelector('.order-error-text').classList.remove('hidden');
}

function validateResults() {
  const nodes = Array.prototype.slice.call(document.querySelectorAll('.pokemon-name'));
  const receivedResult = nodes.map(node => node.textContent.toLowerCase());
  const expectedResult = speciesInEvolution.map(item => item.name.toLowerCase());

  if (isArrayEqual(expectedResult, receivedResult)) {
    showResults();
  } else {
    showHint();
  }
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData('id', ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  const droppedElement = ev.target;
  const draggedElement = document.getElementById(ev.dataTransfer.getData('id'));
  const draggedElementProps = {
    textContent: draggedElement.textContent
  };
  const droppedElementProps = {
    textContent: droppedElement.textContent
  };

  draggedElement.firstChild.textContent = droppedElementProps.textContent;
  droppedElement.firstChild.textContent = draggedElementProps.textContent;
  validateResults();
}

function renderTemplate(species) {
  if (species.length) {
    const element = document.querySelector('.game-area');
    const pokemonElement = document.createElement('DIV');
    pokemonElement.setAttribute('class', 'capitalize align-center flex-column');
    const radomSpeciesOrder = shuffleArray(species);
    radomSpeciesOrder.forEach((item, index) => {
      const name = item.name;
      const containerElement = document.createElement('DIV');
      containerElement.setAttribute('class', 'vertical-center align-center pokemon-container');
      const titleElement = document.createElement('DIV');
      titleElement.textContent = name;
      containerElement.setAttribute('id', index);
      containerElement.setAttribute('draggable', 'true');
      containerElement.setAttribute('ondragstart', 'drag(event)');
      containerElement.setAttribute('ondrop', 'drop(event)');
      containerElement.setAttribute('ondragover', 'allowDrop(event)');
      titleElement.setAttribute('class', 'pokemon-name align-center vertical-center custom-border-style cursor-move');
      containerElement.appendChild(titleElement);
      pokemonElement.appendChild(containerElement);
    });
    element.appendChild(pokemonElement);
  }
}

function processChain(response) {
  speciesInEvolution = getSpecies(response);
  renderTemplate(speciesInEvolution);
}

function getId(url) {
  return url.match(/(\/)\d+/)[0].replace('/', '');
}

function processEvolutionIds(response) {
  const chainList = response.results;
  return chainList.map(item => {
    return getId(item.url);
  });
}

async function getEvolutionIds() {
  if (!evolutionIds.length) {
    evolutionIds = await fetchData('/api/pokemon/evolution-chain', processEvolutionIds);
  }
  return evolutionIds;
}

async function fetchEvolutionChain() {
  const allEvolutionIds = await getEvolutionIds();
  if (allEvolutionIds) {
    const idToFetch = getRandomItem(allEvolutionIds);
    fetchData(`/api/pokemon/evolution-chain/?evolutionId=${idToFetch}`, processChain)
  }
}


function init() {
  // Injecting SW
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }
  // Injecting SW

  // Network connection indicator
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
  // Network connection indicator

  //fetch evolution
  fetchEvolutionChain();
  //fetch evolution

  //Add to Home Screen
  let deferredPrompt;

  const btnAddToHome = document.getElementById('addToHome');
  btnAddToHome.addEventListener('click', (e) => {
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
        // hide our user interface that shows our A2HS button
        btnAddToHome.classList.add('hidden');
      });
  });


  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;

    btnAddToHome.classList.remove('hidden');
  });
  //Add to Home Screen
}

function renderResults(item) {
  const name = item.name;
  const predecessor = item.evolves_from_species;
  const knowMoreUrl = `https://bulbapedia.bulbagarden.net/wiki/${name}`;
  const markup = `<div class="pokemon__card align-center flex-wrap-row">
    <div class="pokemon__section pokemon__section__image align-center flex-column">

        <img class="custom-border-style"
             src=${`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id}.png`}
             alt=${name} title=${name}/>
        <h2 class="pokemon__name capitalize">
            ${name}
        </h2>
    </div>
    <div class="pokemon__section pokemon__section__stats">
        <p class="capitalize pokemon__stats"><label>Color: </label><span>${item.color.name}</span></p>
        <p class="capitalize pokemon__stats"><label>Predecessor:</label><span> ${predecessor ? predecessor.name : 'NA'}</span></p>
        <p class="capitalize pokemon__stats"><label>Capture rate:</label><span> ${item.capture_rate}</span></p>
        <p class="capitalize pokemon__stats"><label>Growth rate:</label><span> ${item.growth_rate.name}</span></p>
        <p class="capitalize pokemon__stats"><label>Know More:</label><span> <a target="_blank" href=${knowMoreUrl}>${name}</span></p>
    </div>
</div>
`;
  setContent(markup);
}

init();