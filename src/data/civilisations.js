// The Universe Talks Back: civilisations that hail your black hole as it approaches.
// All hand-written and family-friendly. Numbers (how often they appear, what eating or
// sparing gives) live in CIVS in src/config.js; this file is only words.
//
// A message may start with "boon|" to promise a specific gift if you spare them
// (boon ids are in BOONS below). Without one, sparing gives a random boon.
// Slots filled in at runtime: {species} {planet} {ate} (your last meal, e.g. "a moon").
//
// Later (needs a server + AI key, see SPEC.md "Later"): live AI messages would come from
// src/systems/civs.js → messageFor(); this bank stays as the offline fallback.

// ---------------------------------------------------------------------------
// Technology levels
// ---------------------------------------------------------------------------

export const TECH_LEVELS = [
  { id: 'tribal', name: 'Stone age', minEra: 3 },
  { id: 'industrial', name: 'Industrial', minEra: 3 },
  { id: 'spacefaring', name: 'Space age', minEra: 3 },
  { id: 'empire', name: 'Star empire', minEra: 4 },
  { id: 'ancient', name: 'Ancient', minEra: 4 },
];

// ---------------------------------------------------------------------------
// Species (name, what they're like). Varied on purpose: rocks, fungi, birds, machines…
// ---------------------------------------------------------------------------

export const SPECIES = [
  { name: 'Glorpians', kind: 'jelly folk' },
  { name: 'Velari', kind: 'crystal singers' },
  { name: 'Moss-Kin', kind: 'walking moss' },
  { name: 'Thrum', kind: 'deep-voiced boulders' },
  { name: 'Quillari', kind: 'feathered scholars' },
  { name: 'Snorvak', kind: 'six-legged farmers' },
  { name: 'Lumenids', kind: 'glowing jellyfish' },
  { name: 'Pebblers', kind: 'tiny rock people' },
  { name: 'Zib-Zib', kind: 'chattering insects' },
  { name: 'Orrk', kind: 'polite giants' },
  { name: 'Mycelians', kind: 'one huge fungus' },
  { name: 'Tidewalkers', kind: 'amphibian sailors' },
  { name: 'Hummingfolk', kind: 'tiny fast flyers' },
  { name: 'Brassmind', kind: 'clockwork robots' },
  { name: 'Selk', kind: 'otter-like swimmers' },
  { name: 'Drovani', kind: 'herd beings' },
  { name: 'Ooloo', kind: 'balloon creatures' },
  { name: 'Kessari', kind: 'cat-like poets' },
  { name: 'Ferrovores', kind: 'metal-eating worms' },
  { name: 'Whisperleaf', kind: 'talking trees' },
  { name: 'Grumbaloo', kind: 'grumpy toads' },
  { name: 'Nimbari', kind: 'cloud dwellers' },
  { name: 'Sporelings', kind: 'mushroom children' },
  { name: 'Tock', kind: 'time-obsessed snails' },
  { name: 'Vashti', kind: 'six-eyed astronomers' },
  { name: 'Plinks', kind: 'bouncy blobs' },
  { name: 'Corallum', kind: 'coral cities' },
  { name: 'Ignari', kind: 'fire-born lizards' },
  { name: 'Frostlings', kind: 'ice sprites' },
  { name: 'Burrowers of Dunn', kind: 'mole engineers' },
  { name: 'Aurelians', kind: 'golden squid' },
  { name: 'Thistlefolk', kind: 'spiky gardeners' },
  { name: 'Mnemos', kind: 'living libraries' },
  { name: 'Quorvax', kind: 'hive-mind beetles' },
  { name: 'Lullabeings', kind: 'singing whales' },
  { name: 'Skerrit', kind: 'quick-witted lizards' },
  { name: 'Bloopers', kind: 'cheerful slimes' },
  { name: 'Archivists', kind: 'sentient computers' },
  { name: 'Hollowfolk', kind: 'cave dwellers' },
  { name: 'Peppernauts', kind: 'spicy plant people' },
  { name: 'Zeph', kind: 'wind spirits' },
  { name: 'Gallumphs', kind: 'clumsy mammoths' },
  { name: 'Krill Republic', kind: 'billions of tiny shrimp' },
  { name: 'Obsidians', kind: 'glassy philosophers' },
  { name: 'Wumpkins', kind: 'round fuzzy herbivores' },
  { name: 'Synthari', kind: 'uploaded minds' },
  { name: 'Ploob', kind: 'very small, very brave' },
  { name: 'Marrowind', kind: 'kite-winged travellers' },
];

// Planet names are built from these syllables (e.g. "Vel-Tora IV").
export const PLANET_SYLLABLES = [
  ['Ka', 'Vel', 'Zor', 'Mi', 'Tau', 'Ny', 'Or', 'Que', 'Lu', 'Ser', 'Dra', 'Pho', 'Xi', 'Bel', 'Ru', 'Ash', 'Em', 'Ty'],
  ['ra', 'lon', 'tis', 'mar', 'vex', 'dor', 'lia', 'nos', 'thys', 'gar', 'mus', 'phi', 'ren', 'zul', 'bek', 'ova'],
  ['', '', '', ' Prime', ' II', ' III', ' IV', ' VII', ' Minor', ' b', ' c'],
];

// ---------------------------------------------------------------------------
// What sparing a civilisation can give you (numbers in CIVS.boons in config.js)
// ---------------------------------------------------------------------------

export const BOONS = {
  map: { name: 'Star map', desc: 'They mark a feast of food on your scanner.' },
  neutron: { name: 'Hidden neutron star', desc: 'They reveal a super-dense neutron star: a huge meal.' },
  shield: { name: 'Deflector gift', desc: 'Your next 2 hits cost no mass.' },
  fuel: { name: 'Fuel offering', desc: 'They feed you a cloud of gas: +6% mass.' },
  stardust: { name: 'Stardust tribute', desc: 'A gift of Stardust.' },
  gravity: { name: 'Gravity tuning', desc: '+15% pull range for the rest of the run.' },
  escort: { name: 'Honour guard', desc: 'Rival black holes keep away for 40 s.' },
};

// ---------------------------------------------------------------------------
// Moods. Which moods appear depends on tech level and on your reputation:
// eat civilisations and the rest grow scared or hostile; spare them and word spreads.
// ---------------------------------------------------------------------------

export const MOODS = {
  worship: { label: 'Worshipping' },
  pleading: { label: 'Pleading' },
  bargaining: { label: 'Bargaining' },
  defiant: { label: 'Defiant' },
  curious: { label: 'Curious' },
  bureaucratic: { label: 'Bureaucratic' },
  philosophical: { label: 'Philosophical' },
  cheerful: { label: 'Cheerful' },
  terrified: { label: 'Terrified' }, // more likely after you eat civilisations
  hostile: { label: 'Hostile' }, // only after you eat civilisations: they shoot back
  hopeful: { label: 'Hopeful' }, // only after you spare civilisations: they've heard of your mercy
};

// ---------------------------------------------------------------------------
// The messages: MESSAGES[tech][mood] = [text, …]
// ---------------------------------------------------------------------------

export const MESSAGES = {
  // ---- Stone age: they think you're a god, a monster or the weather ----
  tribal: {
    worship: [
      'The Hungry Star has come! Bring the shiny rocks! Bring ALL the shiny rocks!',
      'O great dark sky-mouth, we dance for you. Please enjoy the dance and not the village.',
      'Our elders say you are the hole the sun fell into. We made you a hat.',
      'Sky-hole! We named a goat after you. He is a good goat.',
      'We painted you on the cave wall. We gave you a smile. Please match the painting.',
      'Every night we hum to the dark circle. Tonight we hum louder.',
      'Great Swallower, accept this basket of berries. It is the good berries.',
      'The shaman says if we bang the drums, you go away. We are banging the drums.',
      'We have built you a tower of stones so you can see us better. Please only look.',
      'Mighty Void, the children drew you. You have many teeth in the drawings. Do you have teeth?',
      'map|We have marked the bright gathering-place of stars on our stone. Spare us and follow the marks.',
      'fuel|We burned our sweetest smoke for you. Breathe it in, Sky-mouth, and go in peace.',
      'O Dark One, our corn grows well this year. You may look at the corn.',
    ],
    pleading: [
      'Please do not eat the village. We only just finished the roof.',
      'Sky-monster, we are very small and taste of mud. Truly. Mostly mud.',
      'The hunters are not home yet. Could you come back after supper? Or never?',
      'We have one fire, two goats and a song. You can have the song.',
      'Grandmother says you are hungry. Grandmother is also hungry. Please eat elsewhere.',
      'We did nothing wrong! Except Torvo. Torvo knows what he did.',
      'Our whole world fits on one hill. Surely you want a bigger snack?',
      'stardust|Take our shiny stones, all of them, and leave our hill in peace.',
    ],
    bargaining: [
      'map|Spare us, Sky-mouth, and the stargazers will show you where the stars sleep in a heap.',
      'fuel|We will roll our biggest smoke-pot into your mouth. It is a very good smoke-pot.',
      'stardust|We give you our sacred glittering dust. It took forever to collect. Please.',
      'gravity|Our wise one knows the song that makes the sky pull harder. Spare us and she will sing it.',
      'shield|Spare us and we will paint the protecting circles on your sky. They really work. Probably.',
      'We trade you one mountain. Not that one. The small one. Deal?',
    ],
    defiant: [
      'We are not afraid of the dark! (We are a little bit afraid of the dark.)',
      'Our spears are pointy and our hearts are brave. Go away, sky-hole!',
      'The tribe has voted: you are NOT allowed to eat us. Majority decision.',
      'Come closer and our best thrower will throw our best rock at you.',
      'We shout at storms and the storms leave. Now we shout at you. AAAAH!',
    ],
    curious: [
      'Why are you so round? Are you a hole or a ball? The elders argue.',
      'What is it like inside you? Is it warm? Do you have a fire in there?',
      'We threw a stick at you and it did not come back. Where did the stick go?',
      'You eat the light itself! How do you do that? Teach us. Then go.',
      'Are you lonely up there, big dark one? We have a spare blanket.',
    ],
    cheerful: [
      'Hello, sky-friend! We are having a feast! You are not invited, but hello!',
      'Look, the children are waving at you! Wave back! Do you have hands?',
      'Big round shadow, you are very pretty when you sparkle like that.',
      'We made up a song about you. It goes: dooom, dooom, dooom. It is catchy.',
    ],
    philosophical: [
      'Our oldest one says: everything returns to the dark in the end. She did not mean today.',
      'If a hungry star eats a world and no one sees, did it eat? We will see. Please do not.',
      'We count the stars each night. Each night, there are a few less. Is that you?',
    ],
    terrified: [
      'It is the one that ate the {species}! Run to the caves! RUN TO THE CAVES!',
      'The storytellers said you would come. We hoped the storytellers were making it up.',
      'Hide the goats! Hide the children! Hide the other goats!',
      'Sky-mouth ate a whole world! The drums say so! Everyone is very upset!',
      'We saw you swallow {ate}. We are much smaller than {ate}. Please notice that.',
    ],
    hopeful: [
      'The wind brings stories of a kind Sky-mouth who spares worlds. Are you that one?',
      'Our neighbours say you let them live. We made you a necklace of thanks in advance.',
      'They say the Dark One has mercy. We are dancing the mercy dance, just in case.',
    ],
  },

  // ---- Industrial: smokestacks, newspapers, committees ----
  industrial: {
    pleading: [
      'This is the Mayor speaking. Please do not consume the city. We have a parade on Tuesday.',
      'We have only just invented the telephone. Give us a chance to call someone.',
      'Our factories are dirty but our hearts are clean. Please, not today.',
      'We are a small planet with big dreams and a very fragile railway.',
      'Sir or Madam Black Hole: our trains finally run on time. Please do not ruin this.',
      'Please reconsider. Our football team has finally reached the final.',
      'The Royal Society begs you to wait. We are THIS close to inventing the light bulb.',
      'We have so much coal left to shovel. Please let us shovel it.',
    ],
    bargaining: [
      'fuel|We offer the entire output of our gas works, delivered straight into your disk.',
      'stardust|The Treasury will pay any price. We have gold. Also brass. Mostly brass.',
      'map|Our observatory has charted a feast of stars nearby. The map is yours if we live.',
      'neutron|Our astronomers found a strange, heavy star that blinks. Spare us and we will say where.',
      'gravity|Our engineers have a gravitational trick or two. Spare us and we will tune your pull.',
      'Would you accept a strongly worded letter instead of our planet? We have lots of letters.',
      'We offer you a lifetime supply of steam. It is very hot. You will love it.',
    ],
    defiant: [
      'Attention, celestial intruder: our steam cannons are aimed at you. They are not very good, but they are aimed.',
      'The Empire of Gears does not negotiate with holes!',
      'We have hats, we have honour, and we have a great many cannons. Back off.',
      'Our newspaper has called you a "menace". That is our strongest word.',
      'Prepare for a firm and disapproving response from the Ministry of Defence!',
    ],
    bureaucratic: [
      'Please fill out Form 77-B, Application to Devour a Planet, in triplicate.',
      'Your request to eat us has been received. Expected processing time: 400 years.',
      'The Committee for Approaching Doom will meet next Thursday. Please hover until then.',
      'Black holes must register at the Customs Office before entering planetary orbit.',
      'We regret to inform you that eating this planet is against zoning regulations.',
      'Please take a numbered ticket. Now serving number three.',
      'The Department of Sky Matters is closed for lunch. Kindly circle back later.',
    ],
    curious: [
      'Our scientists would love to measure you. Could you hold still? And far away?',
      'Fascinating! You bend light like a lens! Our professor fainted with excitement.',
      'Is it true that time slows down near you? Our watchmakers have questions.',
      'We have pointed every telescope at you. You are on the front page of every paper.',
      'We have so many questions. Question one: please do not eat us. Question two: how?',
    ],
    cheerful: [
      'Good evening from {planet}! The whole town has come out to see you. Smile!',
      'Our brass band will now play a welcome song. Please do not eat the brass band.',
      'Ahoy, Black Hole! We named a new biscuit after you. It is round and very dark.',
      'Today is a holiday in your honour! Everyone gets the day off to watch you approach.',
    ],
    philosophical: [
      'Our poets say you are the full stop at the end of the universe. Not yet, please.',
      'We built clocks to measure time. Now time measures us. You understand, surely.',
      'Is a black hole lonely? Our philosophers have been debating it for three hours.',
    ],
    terrified: [
      'EXTRA! EXTRA! BLACK HOLE ATE THE {species}! EVERYONE PANIC IN AN ORDERLY FASHION!',
      'The stock market has crashed. Also the bridge. Mostly from all the running.',
      'We saw you eat {ate}. Our scientists screamed. Then our accountants screamed.',
      'The radio says you swallowed a whole civilisation. We are turning the radio off.',
      'Evacuate! Evacuate to… actually, where do you evacuate a planet to?',
    ],
    hostile: [
      'You ate the {species}! Steam cannons, FIRE!',
      'This is for our neighbours! Launch the rockets! All of them! Even the wobbly one!',
      'We know what you did. Our artillery knows too. FIRE!',
      'The Ministry of Defence has finally approved a response. Missiles away!',
    ],
    hopeful: [
      'Our papers report a gentle black hole that spares worlds. Please be that one.',
      'They say you showed mercy to others. We have printed a thank-you card, just in case.',
      'Word of your kindness has spread by telegraph. We would like to be next in line for it.',
    ],
  },

  // ---- Space age: rockets, satellites, scientists ----
  spacefaring: {
    pleading: [
      'Mission Control to Black Hole: please hold. We are uploading our entire history to a probe.',
      'Give us ten minutes. Our astronauts are still on the Moon. They forgot their keys.',
      'We just launched our first space telescope. It is pointed at you. It is very scared.',
      'Please. We finally landed a rover on our neighbour planet. It is having such a nice time.',
      'We are a young civilisation. We have only been to space three times. Please let there be a fourth.',
      'Our scientists calculate we have 4 minutes left. Our scientists would like more minutes.',
      'Ten billion of us live here. Most of us are lovely. Some of us are just okay. Spare the lovely ones?',
      'Could you possibly eat our moon instead? It is mostly dust. We will not miss it. Much.',
    ],
    bargaining: [
      'neutron|Our gravity detectors found a hidden neutron star nearby. Spare us and it is all yours.',
      'map|We have mapped a dense cloud of stars your way. Spare us and we will light the route.',
      'shield|We will fit you with a deflector array. Nothing will hurt you for a while. Deal?',
      'gravity|Our physicists can retune your gravity well. Bigger pull, same you. Spare us.',
      'fuel|We will dump our entire fuel reserve into your accretion disk. That is a lot of fuel.',
      'escort|Our fleet will escort you and keep rival black holes away. Spare us and we fly for you.',
      'stardust|We will send you our national treasury. It is digital. It is still worth something.',
      'Offer: one free subscription to our streaming service. It has 4 million shows.',
    ],
    defiant: [
      'This is Planetary Defence. You are entering protected space. Turn back immediately.',
      'Our shields are up and our scientists are not impressed by your event horizon.',
      'You do not frighten us, singularity. We have studied you. We have equations.',
      'We have prepared a strongly worded press release AND a laser. Choose wisely.',
      'Final warning: we are very good at physics and we are VERY annoyed.',
    ],
    curious: [
      'Hi! We are measuring your spin. Could you spin a little slower? For science?',
      'Our probe crossed your photon sphere and sent back the most beautiful picture.',
      'Question from a schoolchild: "What happens to the things you eat?" She would like a real answer.',
      'Is it true information is never destroyed? Our physicists have bet lunch on it.',
      'We just heard you! Your merger ripples made our detectors go wobble-wobble-chirp.',
      'Your accretion disk is gorgeous. Seriously. Can we name a colour after it?',
      'Our biggest computer predicts we have a 2% chance. Our biggest computer is often wrong.',
    ],
    bureaucratic: [
      'Your approach vector has not been filed with Orbital Traffic Control. Please hold.',
      'We have scheduled an emergency meeting to discuss scheduling an emergency meeting.',
      'Per Interplanetary Treaty 4.2, black holes must yield to inhabited worlds.',
      'Your eating privileges have been suspended pending review.',
      'Please rate your experience of approaching our planet from 1 to 5 stars.',
    ],
    cheerful: [
      'Hey there, big guy! Our whole planet is livestreaming you. Say hi to the chat!',
      'Welcome to {planet}! Population: nervous. Gift shop: open.',
      'Our kids think you are the coolest thing in the sky. Do not prove them wrong.',
      'Fun fact: we have 60,000 photos of you now. Your good side is all of them.',
      'Our astronauts are waving from the space station. They have made you a banner.',
    ],
    philosophical: [
      'We looked up for a million years wondering if we were alone. Of all the answers…',
      'Our ancestors feared the dark. We studied it. And now, the dark has come to study us.',
      'Everything we ever were is in this little blue dot. Please be gentle with it.',
      'Our poets say you are not a monster, just very, very hungry. We are trying to understand.',
    ],
    terrified: [
      'ALERT: object that consumed the {species} is approaching. This is not a drill.',
      'We watched you eat {ate} live. Our ratings went up. Our hopes went down.',
      'Everyone, to the arks! Wait, we did not build arks. Why did nobody build arks?',
      'Scientists confirm: we are smaller than everything you have eaten so far. Please do not check.',
      'Our planetary alarm has been ringing for an hour. Someone please turn it off.',
    ],
    hostile: [
      'You devoured the {species}. Planetary Defence is authorised to fire. Missiles away!',
      'You will not take us like you took the others. Launching everything!',
      'Our missiles cannot hurt you much. But they can annoy you. Firing!',
      'For the {species}! Fire at will! Will, please fire!',
    ],
    hopeful: [
      'We have heard that you spared other worlds. We would like very much to be one of them.',
      'Our scouts report a merciful black hole. Our whole planet is crossing its fingers.',
      'Social media says you are kind now. Is that true? Please let that be true.',
    ],
  },

  // ---- Star empires: proud, grand, a bit pompous ----
  empire: {
    defiant: [
      'I am Empress Vexa of a thousand suns. You will NOT dine on my home world.',
      'The Imperial Fleet is assembled. Turn around, or be turned around.',
      'Our empire has swallowed stars of its own. Do not mistake us for prey.',
      'You face the Grand Armada of {planet}. We have never lost. We have never tried this, either.',
      'We are a civilisation of ten thousand worlds. You are… one hole. Leave.',
      'By Imperial decree, you are hereby banished from this sector.',
    ],
    bargaining: [
      'escort|The Empire offers you an honour guard. No rival will dare approach you.',
      'neutron|Our imperial cartographers know where a neutron star hides. Spare our capital and it is yours.',
      'map|Spare us and the Imperial Star Atlas is yours: a feast of worlds awaits.',
      'shield|Accept our Imperial deflector seal. Your enemies\' blows will glance away.',
      'gravity|Our gravitic engineers will amplify your pull. A gift between equals.',
      'stardust|The Imperial Treasury opens its vaults to you. Take it, and take nothing else.',
      'Let us be reasonable. You take three of our moons. We keep the planet. Everyone wins.',
    ],
    bureaucratic: [
      'The Imperial Senate is debating your approach. Debate expected to conclude in 30 years.',
      'You require a permit from all 412 Imperial ministries to enter this system.',
      'Please hold. Your call is important to the Empire.',
      'Black hole visits are by appointment only. The next appointment is in the year 9000.',
    ],
    pleading: [
      'Even an empire can kneel. We kneel. Spare the capital, mighty one.',
      'Our empire took 50,000 years to build. Please do not finish it in 5 seconds.',
      'Take the outer colonies if you must, but leave our home. It is where our mothers live.',
    ],
    curious: [
      'Our imperial scientists have studied a thousand black holes. You are the most interesting.',
      'We have catalogued your feeding patterns. You eat… a lot. Fascinating.',
      'The Emperor wishes to know: do you have a name? He has prepared a title for you.',
    ],
    cheerful: [
      'The Empire salutes you, mighty void! There will be fireworks. Please do not eat them.',
      'Our capital is having a festival in your honour. Admire it. Do not eat it.',
    ],
    philosophical: [
      'Empires rise and fall. We had hoped ours would fall more slowly than this.',
      'We conquered the stars and thought ourselves great. You are a lesson in perspective.',
      'Every empire believes it is forever. We are learning otherwise. Quickly.',
    ],
    terrified: [
      'The Emperor has hidden under the throne. He says hello.',
      'You devoured the {species}. The Senate has stopped debating and started packing.',
      'Abandon the capital! Save the crown jewels! Save the Emperor\'s cat!',
    ],
    hostile: [
      'You ate the {species}. The Imperial Fleet will make you regret it. FIRE!',
      'Battle stations! The monster that devours worlds is here!',
      'All batteries: fire on the singularity! Make it remember us!',
      'Revenge for {species}! Launch the Imperial torpedoes!',
    ],
    hopeful: [
      'The Empire has heard of your mercy. We would be honoured to receive it too.',
      'Other worlds speak of you with gratitude. The Empire wishes to be your friend.',
    ],
  },

  // ---- Ancient: post-biological, very old, very calm ----
  ancient: {
    philosophical: [
      'We have watched a billion years pass. We will watch this, too.',
      'We were old when your first star was born. Come, little one. Let us talk.',
      'Matter, energy, memory. All return to the dark. We simply ask: not yet.',
      'We uploaded ourselves into the crust of this world. Eating it would be… rude.',
      'In the end, all things fall into something. We had hoped to fall into it slowly.',
      'We remember when the universe was young and full of light. Do you?',
      'You are what stars become when they forget how to shine.',
    ],
    curious: [
      'Interesting. You have grown fast. Have you considered growing slower?',
      'We have been waiting for a black hole like you for ten million years. Hello.',
      'Tell us, devourer: what does the inside of time feel like?',
      'We have studied black holes since before your galaxy formed. You are a fine example.',
      'We would like to send a probe across your horizon. It volunteered.',
    ],
    bargaining: [
      'neutron|We know where the dead stars hide. Spare us, and we will show you a neutron star.',
      'gravity|We can teach your gravity a new shape. Spare us and learn.',
      'map|Our memory holds every star in this sector. Spare us and we will light the way to a feast.',
      'shield|We will wrap you in an old, old field. Blows will slide from you like rain.',
      'escort|Our silent ships will herd the other black holes away from you. A fair trade.',
      'stardust|Take our archive of stardust, gathered over an aeon. We will gather more.',
    ],
    cheerful: [
      'Hello, young one! It has been a while since anyone visited.',
      'Oh, how lovely! A black hole! We have not seen one this close in an age.',
    ],
    bureaucratic: [
      'Your request has been forwarded to the Council of Elders. They meet every 10,000 years.',
      'The Archive notes your arrival. The Archive notes everything. The Archive is watching.',
    ],
    pleading: [
      'We are the last of the First Ones. Please let something from that era remain.',
      'Our world is a library of a hundred lost civilisations. Do not close the book.',
    ],
    defiant: [
      'We have seen stars die and galaxies collide. You do not frighten us. Not much.',
      'Turn aside, child. We are older than your hunger.',
    ],
    terrified: [
      'For the first time in an aeon… we feel fear. You ate the {species}.',
      'The Archive has never recorded something like you. The Archive is upset.',
    ],
    hostile: [
      'You ended the {species}. The Ancients will not allow it again. Defence lattice: fire.',
      'Old weapons, unused for an age. You have woken them.',
    ],
    hopeful: [
      'Word of your mercy has reached even us. Perhaps the young can learn after all.',
      'We have heard you spare those who ask. We are asking.',
    ],
  },
};

// Gentle "last words" when you eat a civilisation (shown as the label and in the news).
export const LAST_WORDS = [
  'Well, that was a short history.',
  'Tell the {species} we said… oh.',
  'Worth a try!',
  'We should have built the arks.',
  'At least we got a good photo.',
  'I knew we should have moved.',
  'Was it the parade? It was the parade.',
  'Please rate your meal!',
  'Goodbye, cruel universe! Hello, crueller hole!',
  'Note to self: do not wave at black holes.',
  'Our probe got away! Our history lives on!',
  'At least we are part of something bigger now.',
  'This is fine.',
  'Form 77-B was never approved!',
  'We will be famous in the Galactic News.',
  'Tastes like coal, probably.',
  'Next time, read the warning signs.',
  'Long live the {species}! For about two more seconds!',
  'We regret nothing. Except this.',
  'Somebody tell the goats.',
  'Hope you like the brass band.',
  'Our stock price did not survive either.',
  'Everything we were is now… a little bit of mass.',
  'It was nice being a planet.',
  'Do not forget us! Seriously, you have a very good memory now.',
  'Sending one last signal: GOODBYYYyyyy…',
  'Spaghetti! We are spaghetti!',
  'On the bright side, we were very sparkly at the end.',
];

// What spared civilisations say back.
export const THANKS = [
  'Thank you, gentle giant! We will tell the whole galaxy.',
  'You spared us! We are renaming our capital after you.',
  'The children are cheering! Please, take this gift.',
  'We will remember this for a thousand years.',
  'The Mayor has fainted with relief. Here is your gift.',
  'Mercy from a black hole! Nobody will believe us.',
  'Our poets will write about this forever. Mostly good things.',
  'Thank you! Please come again! Actually, please do not.',
  'A deal is a deal. Here you go.',
  'We knew you were nice. We did not know, but we hoped.',
  'Our thanks, and our gift. Safe travels, devourer.',
  'The whole planet is waving at you!',
  'A black hole with a heart. Who knew?',
  'We have declared today a holiday in your honour.',
  'Our ancestors would be amazed. Our accountants are also amazed.',
  'The Archive records your kindness.',
  'Thank you. Go well, little star-eater.',
  'Long live the merciful void!',
  'We will build a statue of you. A very round one.',
  'Our scientists were right! Black holes CAN be polite!',
];

// When a civilisation flees instead of talking (you've eaten too many).
export const FLEEING = [
  'They have seen you coming. Engines to full! They\'re running!',
  'The {species} are moving their whole planet away from you!',
  'No message. Just a lot of rockets, very fast, the other way.',
  'They\'ve fired their planetary engines and are fleeing!',
];

// ---------------------------------------------------------------------------
// More messages (merged into MESSAGES below), so repeat runs stay fresh.
// ---------------------------------------------------------------------------

const MORE = {
  tribal: {
    worship: [
      'The moss-priests have rolled out the welcome moss. It is our finest moss.',
      'We have carved your likeness into the mountain. It took nine summers. Please admire it from far away.',
      'Great Eater of Light, the singing stones sing only for you tonight.',
      'We offer you our loudest drummer. Not to eat. Just to listen to.',
      'stardust|Glittering sky-sand, gathered by a hundred hands. For you, Dark One.',
    ],
    pleading: [
      'We are only mushrooms. Very small, very soft mushrooms. Hardly a snack.',
      'Please, the tree-folk have only just learned to walk. Let them practise.',
      'Our burrows are deep but not that deep. Please be gentle.',
      'Spare us and we promise to stop throwing rocks at the moon.',
    ],
    bargaining: [
      'escort|Our sky-whistle calls the great beasts away. We will whistle the other dark ones from you.',
      'neutron|The old songs speak of a tiny heavy star that spins and blinks. We know where it sings.',
    ],
    curious: [
      'Is it true you eat light? What does light taste like? Is it sweet?',
      'You are the biggest thing we have ever seen. Even bigger than Big Grul, and Big Grul is very big.',
      'We saw you eat {ate}. Was it tasty? Asking for the elders.',
    ],
    cheerful: [
      'The fire is warm and the stew is ready. Wave if you are friendly!',
      'Hello, sky-circle! We are celebrating the first frost. Would you like a snowball?',
    ],
    defiant: [
      'The crystal folk do not bend! We will glitter at you defiantly!',
      'Our chief has challenged you to a staring contest. She never loses.',
    ],
  },
  industrial: {
    pleading: [
      'Our whole planet has signed a petition. 3 billion signatures. Please read it.',
      'This is the BBC of {planet}. We interrupt this broadcast to beg.',
      'We have just discovered electricity. Please let us enjoy it a bit longer.',
      'Our mushroom-city glows at night. It would be a shame to switch it off.',
    ],
    bargaining: [
      'shield|Our iron-works will cast you a deflector plate as big as a continent.',
      'escort|We will send our airship navy to shoo away the other black holes. It is a brave navy.',
      'Would you consider eating our neighbour planet instead? It is bigger. And frankly, rude.',
    ],
    curious: [
      'Our clockwork computer has calculated your mass. It overheated. Then it calculated again.',
      'Your gravity is pulling our tides sideways. The fishermen have complaints.',
      'Is it true you were once a star? You have let yourself go a bit.',
    ],
    cheerful: [
      'Splendid evening! The whole of {planet} is on the rooftops, waving handkerchiefs.',
      'Our zoo has named its newest baby hippo after you. She is very round.',
    ],
    bureaucratic: [
      'Your arrival has been minuted. Please initial here, here and here.',
      'The Ministry of Unusual Weather would like to classify you. Are you weather?',
      'Planet-eating requires a licence. Do you have a licence? We thought not.',
    ],
    defiant: [
      'The Steam Parliament has voted 312 to 4 against being eaten.',
      'Our mechanical knights are polished and ready. They squeak, but they are ready.',
    ],
    philosophical: [
      'Our scientists say we are made of stardust. It seems you would like it back.',
      'A hundred years of progress, and the universe still has the last word.',
    ],
  },
  spacefaring: {
    pleading: [
      'Our crystal choir has one more song to finish. It is 40 minutes long. Please wait.',
      'Our robots are so close to understanding jokes. Let them get one joke.',
      'Please do not eat us. We have just cured the common cold. Big week for us.',
      'Our ocean is home to the only singing whales in this galaxy. Please, for the whales.',
    ],
    bargaining: [
      'neutron|Our pulsar timing array spotted a neutron star nearby. Spare us and get its coordinates.',
      'map|Our survey satellites found a nebula packed with food. It is all yours if we live.',
      'shield|We will beam our planetary shield onto you instead. You will barely notice hits.',
      'fuel|We can redirect an entire gas cloud into your mouth. It is the deal of the century.',
      'gravity|We have a gravity-wave amplifier. Spare us and your pull will be legendary.',
    ],
    curious: [
      'Our scientists want to know: is your inside bigger than your outside?',
      'We measured your event horizon. Congratulations, you have grown since breakfast.',
      'We are broadcasting your feeding live in 4K. Viewers want to know your favourite food.',
      'Our probes see you spinning at nearly the speed of light. Does that make you dizzy?',
      'Can you hear us? Radio waves bend around you. Our signal took the scenic route.',
    ],
    cheerful: [
      'Our whole planet is doing a wave! A real one, around the equator!',
      'We have 3D-printed you a tiny statue. It is the most popular toy this year.',
      'Hi from the {species}! We are big fans. Huge fans. Please do not eat your fans.',
    ],
    defiant: [
      'You are entering a no-eating zone. Our robots will escort you out.',
      'Our planetary engines are warmed up. We will move the whole world if we have to.',
    ],
    bureaucratic: [
      'Error 404: permission to eat planet not found.',
      'Your approach has been logged as a ticket. Priority: medium.',
      'This planet is a protected nature reserve. No feeding the black holes. No black holes feeding.',
    ],
    philosophical: [
      'We sent a golden record into space. If you find it, play track 7. It is our favourite.',
      'From up here, our borders are invisible. From your side, so is everything.',
    ],
    terrified: [
      'We tracked your path. Seven worlds. Seven. We are number eight, aren\'t we.',
      'You ate {ate} like it was a snack. We are… less than a snack.',
    ],
  },
  empire: {
    defiant: [
      'The Crystal Throne bows to no one. Not even to gravity.',
      'Our admirals have seen worse. They have not, actually, but they are very confident.',
      'Your hunger ends here. The Iron Fleet has arrived.',
    ],
    bargaining: [
      'fuel|The Empire will open its gas mines to you. A river of fuel, flowing into your disk.',
      'Take the Duke\'s planet instead. Nobody likes the Duke.',
    ],
    pleading: [
      'The Empress\'s cat lives on this planet. The cat is beloved. Please.',
      'We will abdicate! We will apologise! We will do anything!',
    ],
    curious: [
      'Your mass has been entered into the Imperial Book of Records. You are now in first place.',
      'The Imperial Academy wishes to award you an honorary degree. In devouring.',
    ],
    bureaucratic: [
      'The Imperial Department of Doom requests you take a number and wait in the nebula.',
      'Approach denied. Reason: the Emperor is napping.',
    ],
    cheerful: [
      'Trumpets! Banners! The Empire welcomes the great dark guest!',
    ],
    philosophical: [
      'We named a thousand stars after ourselves. Now one is coming to name us.',
    ],
  },
  ancient: {
    philosophical: [
      'Every atom of our world was once inside a star. Some of it will now be inside you. Fair.',
      'The universe is mostly empty. You are trying to make it more so.',
      'We have counted every second since the first stars. We would like to keep counting.',
      'Long ago, we were afraid of you. Then we understood you. Now we are afraid again.',
    ],
    curious: [
      'Your spin is lovely. Have you ever measured it? We have. It is 0.9.',
      'We have watched 4,000 black holes grow. You are the fastest. Slow down a little?',
      'Do you dream, devourer? We think you dream of light.',
    ],
    cheerful: [
      'Ah, a visitor! Come in! Not literally. Hover nearby.',
    ],
    pleading: [
      'Our minds live in this crystal planet. Every facet is a memory. Leave us our memories.',
    ],
    bargaining: [
      'fuel|We will unravel a gas giant for you, strand by strand.',
    ],
    defiant: [
      'We have outlived nine of your kind. We intend to outlive you.',
    ],
  },
};

for (const [tech, moods] of Object.entries(MORE)) {
  for (const [mood, list] of Object.entries(moods)) (MESSAGES[tech][mood] ??= []).push(...list);
}
