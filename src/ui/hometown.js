// Feed Your Hometown: search a bundled list of cities and countries (Natural Earth, public
// domain), then watch your black hole swallow the one you pick. Cities and countries only,
// never addresses: what you type is only matched against the list, never shown or sent.

import { mount, on, escapeHtml, toast } from './dom.js';
import { ICONS } from './icons.js';
import { HOMETOWN } from '../config.js';
import * as flow from '../flow.js';

let data = null; // { CITIES, COUNTRIES, LAND } once loaded

/** The place lists are big, so they load only when this screen opens. */
async function loadData() {
  if (!data) {
    const [places, land] = await Promise.all([import('../data/places.js'), import('../data/land.js')]);
    data = { CITIES: places.CITIES, COUNTRIES: places.COUNTRIES, LAND: land.LAND };
  }
  return data;
}

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Best matches: exact, then starts-with, then contains; countries first on ties. */
export function searchPlaces(query, d) {
  const q = norm(query);
  if (q.length < HOMETOWN.minChars) return [];
  const out = [];
  const seen = new Set();
  const add = (p) => {
    const key = `${p.kind}:${p.name}:${p.country}`;
    if (!seen.has(key) && out.length < HOMETOWN.maxResults) {
      seen.add(key);
      out.push(p);
    }
  };
  const countries = d.COUNTRIES.map(([name, lat, lon]) => ({ kind: 'country', name, country: '', lat, lon, n: norm(name) }));
  for (const pass of ['exact', 'start', 'contains']) {
    const test = (n) => (pass === 'exact' ? n === q : pass === 'start' ? n.startsWith(q) : n.includes(q));
    for (const c of countries) if (test(c.n)) add(c);
    for (const [name, country, lat, lon] of d.CITIES) {
      if (out.length >= HOMETOWN.maxResults) break;
      if (test(norm(name))) add({ kind: 'city', name, country, lat, lon });
    }
  }
  return out;
}

export function renderHometownPicker() {
  const node = mount(
    'screen',
    `<div class="screen scroll fade-in hometown-screen">
      <div class="topbar"><button class="back" data-act="back">${ICONS.back} Return</button><span class="chip"><i class="dot"></i>What if…?</span></div>
      <div class="display" style="margin:12px 0 0">Feed your hometown</div>
      <div class="label">Type a city or country. Your black hole does the rest.</div>
      <input class="place-input" type="text" inputmode="search" autocomplete="off" autocapitalize="words" spellcheck="false" maxlength="40" placeholder="e.g. Kathmandu" aria-label="City or country">
      <div class="place-results stack"><div class="label muted loading">Loading the world…</div></div>
      <div class="label muted hometown-note">Cities and countries only, from Natural Earth (public domain). Nothing you type leaves your device.</div>
    </div>`,
  );
  const input = node.querySelector('.place-input');
  const results = node.querySelector('.place-results');
  let list = [];
  const render = () => {
    if (!data) return;
    list = searchPlaces(input.value, data);
    results.innerHTML = list.length
      ? list
          .map(
            (p, i) => `<button class="scenario place" data-place="${i}"><div><div class="head">${escapeHtml(p.name)}</div><div class="desc">${p.kind === 'country' ? 'Country' : escapeHtml(p.country)}</div></div><span class="go">Feed ${ICONS.arrow}</span></button>`,
          )
          .join('')
      : `<div class="label muted">${input.value.trim().length >= HOMETOWN.minChars ? 'No match. Try a nearby big city, or your country.' : 'Start typing…'}</div>`;
  };
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && list[0]) start(list[0]);
  });
  const start = (p) => {
    input.blur();
    flow.startScenario('hometown', { place: { kind: p.kind, name: p.name, country: p.country, lat: p.lat, lon: p.lon }, land: data.LAND });
  };
  results.addEventListener('click', (e) => {
    const b = e.target.closest('[data-place]');
    if (b) start(list[+b.dataset.place]);
  });
  on(node, { '[data-act=back]': () => flow.goMenu('sandbox') });
  loadData()
    .then(() => {
      render();
      setTimeout(() => input.focus(), 50);
    })
    .catch(() => {
      results.innerHTML = '<div class="label danger">Could not load the map. Check your connection and try again.</div>';
      toast('Could not load the map');
    });
}
