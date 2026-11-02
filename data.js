/* NIGHTQUILL — artwork collection
   Full images: assets/art/<slug>.webp
   Grid images: assets/thumbs/<slug>.webp
*/
const NQ_ARTWORKS = [
  {
    slug: "tales-cover",
    title: "Tales & Feathers",
    category: "covers",
    label: "Book Cover",
    desc: "A sunlit kitchen, a visiting angel and a story about the wings we grow.",
    accent: "#f3b36b",
    w: 1014,
    h: 1534
  },
  {
    slug: "comic-deep",
    title: "What Is This?",
    category: "comics",
    label: "Comic Art",
    desc: "A first descent into a blue world, where something enormous is waiting.",
    accent: "#5ec8ff",
    w: 1440,
    h: 1800
  },
  {
    slug: "garmi",
    title: "Garmi Mubarak",
    category: "illustration",
    label: "Editorial Illustration",
    desc: "A love letter to summer heat, shared humour and everyday endurance.",
    accent: "#ff9a4d",
    w: 1350,
    h: 1687
  },
  {
    slug: "anemone",
    title: "Anemone",
    category: "covers",
    label: "Book Cover",
    desc: "A story about letting go, wrapped in ocean light and bioluminescent blues.",
    accent: "#55e6d0",
    w: 1440,
    h: 1800
  },
  {
    slug: "warrior",
    title: "Golden Hour",
    category: "illustration",
    label: "Character Illustration",
    desc: "A heroine forged in gold, rainbow light and the wind at her back.",
    accent: "#ffcf6e",
    w: 1053,
    h: 1600
  },
  {
    slug: "comic-bloom",
    title: "In Bloom",
    category: "comics",
    label: "Comic Art",
    desc: "A quiet comic about growing things, small rituals and the flowers we carry.",
    accent: "#ff8fa8",
    w: 1349,
    h: 1687
  },
  {
    slug: "sisters-cover",
    title: "Sisters of the Snake",
    category: "covers",
    label: "Book Cover",
    desc: "Jewel-toned sisterhood, serpents and starlight, framed in gold.",
    accent: "#ff9b5f",
    w: 954,
    h: 1440
  },
  {
    slug: "rainy",
    title: "After the Rain",
    category: "illustration",
    label: "Atmospheric Illustration",
    desc: "A lone cabin, a rising river and a forest holding its breath.",
    accent: "#6fd6a8",
    w: 3277,
    h: 4096
  },
  {
    slug: "comic-tide",
    title: "Undertow",
    category: "comics",
    label: "Comic Art",
    desc: "Black-and-white manga poetry, suspended between water and memory.",
    accent: "#cfd4e6",
    w: 1440,
    h: 1800
  },
  {
    slug: "fundamentally",
    title: "Fundamentally",
    category: "covers",
    label: "Book Cover",
    desc: "Graphic portraiture and electric typography for a novel about love, faith and freedom.",
    accent: "#ff6d9e",
    w: 1440,
    h: 1800
  },
  {
    slug: "moonlit",
    title: "Moonlit",
    category: "illustration",
    label: "Personal Illustration",
    desc: "A midnight meditation on solitude, stars and the stories we carry.",
    accent: "#42d6c4",
    w: 1440,
    h: 1800
  },
  {
    slug: "lucen",
    title: "The Lucen",
    category: "comics",
    label: "Comic Art",
    desc: "Ink, motion and a rooftop chase under a paper moon.",
    accent: "#d7d9e2",
    w: 1500,
    h: 1500
  },
  {
    slug: "ravenspire",
    title: "RavenSpire",
    category: "covers",
    label: "Game Key Art",
    desc: "A crimson king, a fabled desert city and key art built for a dark fantasy world.",
    accent: "#ff6a4d",
    w: 1000,
    h: 1403
  },
  {
    slug: "wildflower",
    title: "Wildflower",
    category: "illustration",
    label: "Editorial Illustration",
    desc: "A sun-drunk afternoon in a field that never ends.",
    accent: "#c6ef72",
    w: 3276,
    h: 4096
  },
  {
    slug: "comic-light",
    title: "Everything Is So Bright",
    category: "comics",
    label: "Comic Art",
    desc: "Scale, silence and the strange intimacy of swimming beside a giant.",
    accent: "#63c8ff",
    w: 1440,
    h: 1800
  },
  {
    slug: "going-dark-cover",
    title: "Going Dark",
    category: "covers",
    label: "Book Cover",
    desc: "Neon noir for a story about the selves we create online.",
    accent: "#ff4f9a",
    w: 1440,
    h: 1800
  },
  {
    slug: "character-sheet",
    title: "The Wanderer",
    category: "characters",
    label: "Character Design",
    desc: "A wanderer's wardrobe, built for a world of dust, thorns and long roads.",
    accent: "#c9a06e",
    w: 900,
    h: 850
  },
  {
    slug: "comic-cat",
    title: "Small Comforts",
    category: "comics",
    label: "Comic Art",
    desc: "A black-and-white interlude about cats, mistakes and waiting.",
    accent: "#d8d5e8",
    w: 1440,
    h: 1800
  },
  {
    slug: "tales-art",
    title: "Tales & Feathers — Key Art",
    category: "illustration",
    label: "Cover Illustration",
    desc: "The full painting behind the cover, glowing with late-afternoon light.",
    accent: "#f6c07a",
    w: 1440,
    h: 1800
  },
  {
    slug: "comic-burst",
    title: "An Explosion?",
    category: "comics",
    label: "Comic Art",
    desc: "Bubbles, breach and a burst of light at the edge of the deep.",
    accent: "#59b8ff",
    w: 1440,
    h: 1800
  },
  {
    slug: "banishing",
    title: "A Banishing of Kings",
    category: "covers",
    label: "Special Edition",
    desc: "A fully illustrated special edition: gilded linework, painted edges and a world in flame.",
    accent: "#e7c27c",
    w: 554,
    h: 411
  },
  {
    slug: "moose",
    title: "First Snow",
    category: "illustration",
    label: "Wildlife Illustration",
    desc: "A moose in a hush of winter light, painted in falling snow.",
    accent: "#a7d8f6",
    w: 3015,
    h: 3834
  },
  {
    slug: "comic-pattern",
    title: "Bloom Theory",
    category: "comics",
    label: "Comic Art",
    desc: "A graphic meditation on pattern, perception and the pull of the tide.",
    accent: "#60c4ff",
    w: 1440,
    h: 1800
  },
  {
    slug: "sisters-art",
    title: "Sisters of the Snake — Key Art",
    category: "illustration",
    label: "Cover Illustration",
    desc: "A jewel-box portrait of two sisters bound by fate and a serpent's promise.",
    accent: "#ff9d5c",
    w: 954,
    h: 1440
  },
  {
    slug: "hollow-king",
    title: "The Hollow King",
    category: "characters",
    label: "Creature Design",
    desc: "A creature of bone, root and violet fire, born for a darker world.",
    accent: "#b388ff",
    w: 922,
    h: 1152
  },
  {
    slug: "comic-gaze",
    title: "What's This Feeling?",
    category: "comics",
    label: "Comic Art",
    desc: "A close-up study of wonder, drawn in ink and negative space.",
    accent: "#d8d5e8",
    w: 1440,
    h: 1800
  },
  {
    slug: "going-dark-art",
    title: "Going Dark — Key Art",
    category: "illustration",
    label: "Key Art",
    desc: "Neon portraiture for a psychological thriller about life online.",
    accent: "#ff4f9a",
    w: 1440,
    h: 1794
  },
  {
    slug: "comic-dive",
    title: "The Descent",
    category: "comics",
    label: "Comic Art",
    desc: "A diver, a dark current and the long way down.",
    accent: "#d8d5e8",
    w: 1440,
    h: 1800
  }
];

const NQ_CATEGORIES = {
  all: { label: "All Work" },
  covers: { label: "Covers" },
  comics: { label: "Comics" },
  illustration: { label: "Illustration" },
  characters: { label: "Characters" }
};

const NQ_FEATURED = [
  "tales-cover",
  "anemone",
  "sisters-cover",
  "ravenspire",
  "fundamentally",
  "going-dark-cover"
];

/* Expose the manifest for the interaction layer (classic scripts keep
   top-level const bindings out of the window object). */
window.NQ_ARTWORKS = NQ_ARTWORKS;
window.NQ_CATEGORIES = NQ_CATEGORIES;
window.NQ_FEATURED = NQ_FEATURED;
