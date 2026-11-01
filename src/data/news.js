// Galactic News: pre-written, family-friendly headlines about your deeds.
// NEWS[trigger] = [template, …]. Slots: {species} {planet} {object} {rival} {era} {words}
// {synergy} {power} {n} {city}. The ticker (src/systems/news.js) picks one at random and
// fills the slots; FILLER[eraId] runs when nothing has happened for a while.

export const NEWS = {
  civEaten: [
    'BREAKING: Black hole eats {planet}, claims it was "mostly crust"',
    '{species} last seen waving; experts say waving "did not help"',
    'Galactic Council condemns snack-sized planet incident',
    '{planet} delisted from all star maps, effective immediately',
    'Witnesses: "It just went slurp, and {planet} was gone"',
    'Insurance companies refuse to cover planets near "that hole"',
    '{species} final broadcast: "{words}"',
    'Local black hole has "no regrets", reports nobody who asked',
    'Neighbours of {planet} quietly start building rockets',
    'Opinion: Should we really be living on planets at all?',
    'Black hole\'s approval rating among planets drops to 0%',
    'Sources confirm {planet} now "part of something bigger"',
    'Galactic Tourism Board removes {planet} from brochure',
    'Breaking: {species} history successfully uploaded to probe seconds before the end',
  ],
  civSpared: [
    'MIRACLE: Black hole spares {planet}; {species} declare holiday',
    '{species} name their capital after "the kind void"',
    'Black hole shows mercy, astronomers baffled',
    'Survey: 9 in 10 {species} now describe black holes as "actually quite nice"',
    '{planet} sends thank-you card the size of a continent',
    'Heart-warming: black hole lets {planet} go with just a wave',
    'Galactic Council praises black hole for "excellent table manners"',
    'Mercy spreads! Nearby worlds start saying nice things about the void',
    '{species} composer writes 9-hour symphony about being spared',
    'Experts: sparing {planet} was "the right call", "very classy"',
  ],
  civHostile: [
    'War! {species} open fire on approaching black hole',
    'Planetary Defence of {planet}: "We will not go quietly"',
    '{species} missiles bounce off event horizon; generals "disappointed"',
  ],
  missileHit: [
    'Direct hit! {species} missile tickles black hole',
    'Black hole hit by missile, reports "a slight itch"',
  ],
  civFled: [
    '{species} move entire planet away; neighbours call it "very sensible"',
    'Breaking: {planet} spotted fleeing at record speed',
  ],
  bigSwallow: [
    'BREAKING: Local black hole eats {object}, claims it was "mostly rings"',
    'Black hole swallows {object} in one bite; scientists "not even surprised any more"',
    '{object} reported missing; last seen near a very round shadow',
    'Astronomers update charts: {object} no longer applicable',
    'Exclusive: {object} "went in sideways", say eyewitnesses',
    'Spaghettified! {object} stretched into noodle, then gone',
    'Black hole eats {object}, asks if there is dessert',
  ],
  rivalEaten: [
    'Black hole merger! {rival} eaten; gravitational waves felt across the galaxy',
    '{rival} defeated in black-hole-eat-black-hole showdown',
    'Chirp! Detectors ring as {rival} vanishes into a bigger hole',
    '{rival}\'s fan club in mourning',
  ],
  quasar: [
    'QUASAR IGNITES! Black hole now brighter than an entire galaxy',
    'Astronomers 12 billion light-years away will see this. Eventually.',
    'Quasar alert: sunglasses recommended across the sector',
    'Black hole "showing off again", say neighbouring galaxies',
  ],
  synergy: [
    'Scientists stunned as black hole unlocks "{synergy}"',
    'New trick! Black hole debuts {synergy}; critics call it "a bit much"',
    'Physics journals rush to explain {synergy}',
  ],
  power: [
    'Black hole learns {power}; the galaxy is nervous',
    'Experts: {power} makes the black hole "considerably more alarming"',
  ],
  milestone: [
    'Black hole passes {words}; celebrations held nowhere',
    'Milestone: black hole now weighs {words}, still hungry',
  ],
  era: {
    2: [
      'FIRST STARS SWITCH ON: Universe "much less gloomy now"',
      'Breaking: light invented. Darkness "considering its options"',
    ],
    3: [
      'Galaxies form! Rival black holes spotted in the neighbourhood',
      'Life appears on rocky worlds; first newspapers (this one) begin printing',
    ],
    4: [
      'QUASAR SEASON BEGINS: food everywhere, appetite unlimited',
      'Galaxy crowded, warm, and full of snacks, say experts',
    ],
    5: [
      'The stars are going out. Galactic News to cut back on printing',
      'Far Future: last bakery in the universe closes its doors',
    ],
  },
  dawnClose: [
    'Tiny black hole nearly evaporates; everyone holds breath (there is no one yet)',
  ],
  // Cosmic events (Session E)
  supernova: [
    'KABOOM: Star goes supernova, black hole immediately starts snacking',
    'Supernova outshines entire galaxy for a week; black hole unimpressed',
    'Star explodes, scatters iron and gold; black hole eats the gold',
  ],
  tidal: [
    'Star wanders too close, gets turned into spaghetti',
    'Tidal disruption! Star stretched into glowing noodle and slurped',
  ],
  wanderer: [
    'ROGUE BLACK HOLE races through sector at 1,000 km/s, leaves new stars behind',
    'Runaway black hole spotted; astronomers say it "has places to be"',
  ],
  wormhole: [
    'Wormhole opens (theoretically); black hole takes shortcut',
    'Physicists: "Wormholes might not exist." Black hole: "Too late."',
  ],
  whitehole: [
    'White hole spits out matter, refuses to explain itself (hypothetical)',
    'Reverse black hole spotted; everything comes OUT? Scientists sceptical',
  ],
  darkMatter: [
    'Invisible dark matter found, eaten; nobody saw a thing',
    'Dark matter clump vanishes; physicists "had not even found it yet"',
  ],
  merger: [
    'Gravitational waves detected! LIGO-style detectors go "chirp"',
  ],
  // Feed Your Hometown (Session D)
  hometown: [
    'BREAKING: {city} swallowed by black hole. Residents "would like a word"',
    '{city} now officially inside a black hole; mayor promises "a full inquiry"',
    'Black hole visits {city}, does not leave a review',
  ],
};

// When nothing has happened for a while. Keyed by era id.
export const FILLER = {
  1: [
    'Galactic News will begin as soon as someone invents news',
    'Weather: foggy. Forecast: foggy for another 100 million years',
    'Universe 50 million years old, still has no stars; critics unimpressed',
    'Hydrogen remains the most popular element for the fifth million year running',
  ],
  2: [
    'First stars are huge, hot and short-lived; "live fast", they say',
    'Light pollution complaints filed by the darkness',
    'Heavy elements in short supply; stars working overtime',
    'Scientists predict planets "any billion years now"',
  ],
  3: [
    'Spiral arms are in fashion this aeon',
    'Rival black holes "just here for the food", sources say',
    'Comet sighting causes 3-day festival on 200 worlds',
    'Opinion: Are black holes just misunderstood?',
    'Local planet invents sandwich; galaxy-wide craze expected',
    'Astronomers baffled: "Why does that black hole keep chasing gas clouds?"',
    'Survey: 74% of planets would prefer not to be eaten',
  ],
  4: [
    'Galaxy feeding frenzy continues; black holes report "excellent appetite"',
    'Quasar light pollution reaches all-time high',
    'Gas giants advised to stay indoors',
    'Galactic Council debates "eating limits"; motion fails',
    'Star sales slump as black holes hog the market',
  ],
  5: [
    'Last red dwarfs dimming; universe switching to energy-saving mode',
    'Galactic News reduced to one page to save energy',
    'Final star party ends early; no one left to clean up',
    'Temperature of the universe: very, very cold. Bring a jumper',
  ],
};
