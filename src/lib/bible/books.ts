// The 66 books of the (Protestant) Bible, in order, with names in English, French and Portuguese.
// Summaries never contain the book's own name, so they can be used as quiz clues.

export type Lang = "en" | "fr" | "pt";
export type Testament = "OT" | "NT";
export type SectionId = "law" | "history" | "poetry" | "major" | "minor" | "gospels" | "paul" | "general";

export type Section = {
  id: SectionId;
  testament: Testament;
  /** English name; also the translation key. */
  name: string;
  emoji: string;
  color: string;
};

export const SECTIONS: Section[] = [
  { id: "law", testament: "OT", name: "The Law", emoji: "📜", color: "#f59e0b" },
  { id: "history", testament: "OT", name: "History", emoji: "🏰", color: "#ef4444" },
  { id: "poetry", testament: "OT", name: "Poetry & Wisdom", emoji: "🎵", color: "#ec4899" },
  { id: "major", testament: "OT", name: "Major Prophets", emoji: "🔥", color: "#a855f7" },
  { id: "minor", testament: "OT", name: "Minor Prophets", emoji: "📯", color: "#6366f1" },
  { id: "gospels", testament: "NT", name: "Gospels & Acts", emoji: "✝️", color: "#10b981" },
  { id: "paul", testament: "NT", name: "Paul's Letters", emoji: "✉️", color: "#0ea5e9" },
  { id: "general", testament: "NT", name: "Other Letters & Revelation", emoji: "🌈", color: "#eab308" },
];

export const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]));

export type Book = {
  id: string;
  /** 1–66 */
  order: number;
  testament: Testament;
  section: SectionId;
  chapters: number;
  emoji: string;
  names: Record<Lang, string>;
  summary: Record<Lang, string>;
};

type Row = [id: string, en: string, fr: string, pt: string, chapters: number, emoji: string, sumEn: string, sumFr: string, sumPt: string];

const DATA: [SectionId, Row[]][] = [
  ["law", [
    ["gen", "Genesis", "Genèse", "Gênesis", 50, "🌍", "God creates the world; Noah's ark; Abraham's family", "Dieu crée le monde ; l'arche de Noé ; la famille d'Abraham", "Deus cria o mundo; a arca de Noé; a família de Abraão"],
    ["exo", "Exodus", "Exode", "Êxodo", 40, "🌊", "Moses leads Israel out of Egypt and receives the Ten Commandments", "Moïse fait sortir Israël d'Égypte et reçoit les dix commandements", "Moisés tira Israel do Egito e recebe os Dez Mandamentos"],
    ["lev", "Leviticus", "Lévitique", "Levítico", 27, "🐑", "Rules for worship, offerings and being holy", "Les règles du culte, des offrandes et de la sainteté", "Regras para a adoração, as ofertas e a santidade"],
    ["num", "Numbers", "Nombres", "Números", 36, "🏕️", "Israel is counted and wanders 40 years in the desert", "Israël est compté et erre 40 ans dans le désert", "Israel é contado e vagueia 40 anos no deserto"],
    ["deu", "Deuteronomy", "Deutéronome", "Deuteronômio", 34, "🗣️", "Moses' last speeches before Israel enters the Promised Land", "Les derniers discours de Moïse avant la Terre promise", "Os últimos discursos de Moisés antes da Terra Prometida"],
  ]],
  ["history", [
    ["jos", "Joshua", "Josué", "Josué", 24, "🎺", "The walls of Jericho fall and Israel enters Canaan", "Les murailles de Jéricho tombent et Israël entre en Canaan", "As muralhas de Jericó caem e Israel entra em Canaã"],
    ["jdg", "Judges", "Juges", "Juízes", 21, "⚖️", "Heroes like Gideon, Deborah and Samson rescue Israel", "Des héros comme Gédéon, Débora et Samson sauvent Israël", "Heróis como Gideão, Débora e Sansão salvam Israel"],
    ["rut", "Ruth", "Ruth", "Rute", 4, "🌾", "A loyal young widow gathers grain and finds a new family", "Une jeune veuve fidèle glane du blé et trouve une famille", "Uma jovem viúva fiel colhe trigo e encontra uma família"],
    ["1sa", "1 Samuel", "1 Samuel", "1 Samuel", 31, "🪨", "Israel gets its first king, Saul, and young David beats Goliath", "Israël reçoit son premier roi, Saül, et le jeune David bat Goliath", "Israel recebe seu primeiro rei, Saul, e o jovem Davi vence Golias"],
    ["2sa", "2 Samuel", "2 Samuel", "2 Samuel", 24, "🎶", "David rules over all Israel", "David règne sur tout Israël", "Davi reina sobre todo Israel"],
    ["1ki", "1 Kings", "1 Rois", "1 Reis", 22, "🏛️", "Wise Solomon builds the Temple; Elijah on Mount Carmel", "Le sage Salomon bâtit le Temple ; Élie au mont Carmel", "O sábio Salomão constrói o Templo; Elias no monte Carmelo"],
    ["2ki", "2 Kings", "2 Rois", "2 Reis", 25, "🐎", "Elisha's miracles, then Israel and Judah are taken into exile", "Les miracles d'Élisée, puis Israël et Juda sont emmenés en exil", "Os milagres de Eliseu, depois Israel e Judá vão para o exílio"],
    ["1ch", "1 Chronicles", "1 Chroniques", "1 Crônicas", 29, "🌳", "Family trees, and the story of David told again", "Des arbres généalogiques, et l'histoire de David racontée à nouveau", "Árvores genealógicas, e a história de Davi contada de novo"],
    ["2ch", "2 Chronicles", "2 Chroniques", "2 Crônicas", 36, "🕍", "Judah's rulers, from Solomon to the exile", "Les souverains de Juda, de Salomon à l'exil", "Os governantes de Judá, de Salomão ao exílio"],
    ["ezr", "Ezra", "Esdras", "Esdras", 10, "🔨", "The exiles return home and rebuild the Temple", "Les exilés rentrent et rebâtissent le Temple", "Os exilados voltam e reconstroem o Templo"],
    ["neh", "Nehemiah", "Néhémie", "Neemias", 13, "🧱", "Jerusalem's walls are rebuilt in just 52 days", "Les murailles de Jérusalem sont rebâties en 52 jours", "Os muros de Jerusalém são reconstruídos em 52 dias"],
    ["est", "Esther", "Esther", "Ester", 10, "👸", "A brave Jewish queen saves her people", "Une reine juive courageuse sauve son peuple", "Uma rainha judia corajosa salva seu povo"],
  ]],
  ["poetry", [
    ["job", "Job", "Job", "Jó", 42, "🌪️", "A good man loses everything but keeps trusting God", "Un homme juste perd tout mais garde confiance en Dieu", "Um homem justo perde tudo, mas continua confiando em Deus"],
    ["psa", "Psalms", "Psaumes", "Salmos", 150, "🎵", "150 songs and prayers, like “The Lord is my shepherd”", "150 chants et prières, comme « L'Éternel est mon berger »", "150 cânticos e orações, como «O Senhor é o meu pastor»"],
    ["pro", "Proverbs", "Proverbes", "Provérbios", 31, "🦉", "Short wise sayings for everyday life", "De courtes paroles de sagesse pour la vie de tous les jours", "Ditos sábios e curtos para o dia a dia"],
    ["ecc", "Ecclesiastes", "Ecclésiaste", "Eclesiastes", 12, "⏳", "“A time for everything”: what really matters in life", "« Un temps pour tout » : ce qui compte vraiment dans la vie", "«Tudo tem o seu tempo»: o que realmente importa na vida"],
    ["sng", "Song of Songs", "Cantique des cantiques", "Cântico dos Cânticos", 8, "🌹", "A beautiful poem about love", "Un beau poème sur l'amour", "Um belo poema sobre o amor"],
  ]],
  ["major", [
    ["isa", "Isaiah", "Ésaïe", "Isaías", 66, "🕊️", "Big promises of a coming Savior, the Prince of Peace", "De grandes promesses d'un Sauveur, le Prince de la paix", "Grandes promessas de um Salvador, o Príncipe da Paz"],
    ["jer", "Jeremiah", "Jérémie", "Jeremias", 52, "😢", "The “weeping prophet” warns Jerusalem", "Le « prophète qui pleure » avertit Jérusalem", "O «profeta chorão» adverte Jerusalém"],
    ["lam", "Lamentations", "Lamentations", "Lamentações", 5, "💧", "Sad poems after Jerusalem is destroyed", "Des poèmes tristes après la destruction de Jérusalem", "Poemas tristes depois da destruição de Jerusalém"],
    ["ezk", "Ezekiel", "Ézéchiel", "Ezequiel", 48, "🦴", "Visions of wheels, and dry bones that come back to life", "Des visions de roues, et des os desséchés qui reprennent vie", "Visões de rodas, e ossos secos que voltam à vida"],
    ["dan", "Daniel", "Daniel", "Daniel", 12, "🦁", "The lions' den, a fiery furnace and dreams of the future", "La fosse aux lions, la fournaise ardente et des rêves de l'avenir", "A cova dos leões, a fornalha ardente e sonhos do futuro"],
  ]],
  ["minor", [
    ["hos", "Hosea", "Osée", "Oseias", 14, "💍", "God's love stays faithful, like a husband who forgives", "L'amour fidèle de Dieu, comme un mari qui pardonne", "O amor fiel de Deus, como um marido que perdoa"],
    ["joe", "Joel", "Joël", "Joel", 3, "🦗", "A swarm of locusts and the promise of God's Spirit", "Une nuée de sauterelles et la promesse de l'Esprit de Dieu", "Uma nuvem de gafanhotos e a promessa do Espírito de Deus"],
    ["amo", "Amos", "Amos", "Amós", 9, "🧺", "A shepherd prophet: “Let justice roll on like a river”", "Un berger prophète : « Que la justice coule comme un fleuve »", "Um profeta pastor: «Corra a justiça como um rio»"],
    ["oba", "Obadiah", "Abdias", "Obadias", 1, "⛰️", "The shortest Old Testament book: a warning to Edom", "Le plus court livre de l'Ancien Testament : un avertissement à Édom", "O livro mais curto do Antigo Testamento: um aviso a Edom"],
    ["jon", "Jonah", "Jonas", "Jonas", 4, "🐋", "A prophet runs away and is swallowed by a great fish", "Un prophète s'enfuit et est avalé par un grand poisson", "Um profeta foge e é engolido por um grande peixe"],
    ["mic", "Micah", "Michée", "Miqueias", 7, "🌟", "Promises the Savior will be born in Bethlehem", "Annonce que le Sauveur naîtra à Bethléem", "Anuncia que o Salvador nascerá em Belém"],
    ["nah", "Nahum", "Nahum", "Naum", 3, "🏚️", "The fall of Nineveh, the cruel city", "La chute de Ninive, la ville cruelle", "A queda de Nínive, a cidade cruel"],
    ["hab", "Habakkuk", "Habacuc", "Habacuque", 3, "🗼", "A prophet asks God hard questions and learns to trust", "Un prophète pose à Dieu des questions difficiles et apprend la confiance", "Um profeta faz perguntas difíceis a Deus e aprende a confiar"],
    ["zep", "Zephaniah", "Sophonie", "Sofonias", 3, "🎉", "The day of the Lord is coming, and God sings over his people", "Le jour du Seigneur vient, et Dieu chante sur son peuple", "O dia do Senhor vem, e Deus canta sobre o seu povo"],
    ["hag", "Haggai", "Aggée", "Ageu", 2, "🏗️", "“Get back to work and finish God's house!”", "« Remettez-vous au travail et finissez la maison de Dieu ! »", "«Voltem ao trabalho e terminem a casa de Deus!»"],
    ["zec", "Zechariah", "Zacharie", "Zacarias", 14, "🫏", "Visions, and a king who comes riding on a donkey", "Des visions, et un roi qui vient monté sur un âne", "Visões, e um rei que vem montado num jumento"],
    ["mal", "Malachi", "Malachie", "Malaquias", 4, "🌅", "The last Old Testament book: a messenger is coming", "Le dernier livre de l'Ancien Testament : un messager va venir", "O último livro do Antigo Testamento: um mensageiro virá"],
  ]],
  ["gospels", [
    ["mat", "Matthew", "Matthieu", "Mateus", 28, "👑", "Jesus the promised King, and the Sermon on the Mount", "Jésus, le Roi promis, et le Sermon sur la montagne", "Jesus, o Rei prometido, e o Sermão do Monte"],
    ["mrk", "Mark", "Marc", "Marcos", 16, "🏃", "The shortest, fastest-moving story of Jesus", "Le récit le plus court et le plus rapide de la vie de Jésus", "O relato mais curto e rápido da vida de Jesus"],
    ["luk", "Luke", "Luc", "Lucas", 24, "🩺", "A doctor tells of baby Jesus in the manger and the lost son", "Un médecin raconte Jésus dans la crèche et le fils perdu", "Um médico conta sobre Jesus na manjedoura e o filho pródigo"],
    ["jhn", "John", "Jean", "João", 21, "💡", "“For God so loved the world…”: Jesus is the light", "« Car Dieu a tant aimé le monde… » : Jésus est la lumière", "«Porque Deus amou o mundo de tal maneira…»: Jesus é a luz"],
    ["act", "Acts", "Actes", "Atos", 28, "🌬️", "The Holy Spirit comes and the church spreads with Peter and Paul", "Le Saint-Esprit vient et l'Église grandit avec Pierre et Paul", "O Espírito Santo vem e a igreja cresce com Pedro e Paulo"],
  ]],
  ["paul", [
    ["rom", "Romans", "Romains", "Romanos", 16, "🏟️", "Paul explains how we are saved by faith", "Paul explique que nous sommes sauvés par la foi", "Paulo explica que somos salvos pela fé"],
    ["1co", "1 Corinthians", "1 Corinthiens", "1 Coríntios", 16, "❤️", "“Love is patient, love is kind”, and one body with many parts", "« L'amour est patient, il est plein de bonté », et un seul corps aux nombreux membres", "«O amor é paciente, o amor é bondoso», e um só corpo com muitos membros"],
    ["2co", "2 Corinthians", "2 Corinthiens", "2 Coríntios", 13, "🏺", "Strength in weakness: treasure in jars of clay", "La force dans la faiblesse : un trésor dans des vases de terre", "A força na fraqueza: um tesouro em vasos de barro"],
    ["gal", "Galatians", "Galates", "Gálatas", 6, "🍇", "Free in Christ, and the fruit of the Spirit", "Libres en Christ, et le fruit de l'Esprit", "Livres em Cristo, e o fruto do Espírito"],
    ["eph", "Ephesians", "Éphésiens", "Efésios", 6, "🛡️", "Put on the whole armor of God", "Revêtez toutes les armes de Dieu", "Revistam-se de toda a armadura de Deus"],
    ["php", "Philippians", "Philippiens", "Filipenses", 4, "😊", "A joyful letter from prison: “Rejoice in the Lord always”", "Une lettre joyeuse écrite en prison : « Réjouissez-vous toujours »", "Uma carta alegre escrita na prisão: «Alegrem-se sempre»"],
    ["col", "Colossians", "Colossiens", "Colossenses", 4, "🌱", "Jesus is above everything; grow deep roots in him", "Jésus est au-dessus de tout ; soyez enracinés en lui", "Jesus está acima de tudo; estejam enraizados nele"],
    ["1th", "1 Thessalonians", "1 Thessaloniciens", "1 Tessalonicenses", 5, "☁️", "Jesus will come back: encouragement for a young church", "Jésus reviendra : un encouragement pour une jeune Église", "Jesus voltará: um encorajamento para uma igreja jovem"],
    ["2th", "2 Thessalonians", "2 Thessaloniciens", "2 Tessalonicenses", 3, "⏰", "Keep working and don't be fooled while you wait for Jesus", "Continuez à travailler et ne soyez pas trompés en attendant Jésus", "Continuem trabalhando e não sejam enganados enquanto esperam Jesus"],
    ["1ti", "1 Timothy", "1 Timothée", "1 Timóteo", 6, "🧑‍🏫", "“Don't let anyone look down on you because you are young”", "« Que personne ne méprise ta jeunesse »", "«Ninguém despreze a tua mocidade»"],
    ["2ti", "2 Timothy", "2 Timothée", "2 Timóteo", 4, "🏁", "Paul's last letter: “I have finished the race”", "La dernière lettre de Paul : « J'ai achevé la course »", "A última carta de Paulo: «Acabei a carreira»"],
    ["tit", "Titus", "Tite", "Tito", 3, "🏝️", "Paul helps a young leader organize the churches on Crete", "Paul aide un jeune responsable à organiser les Églises de Crète", "Paulo ajuda um jovem líder a organizar as igrejas de Creta"],
    ["phm", "Philemon", "Philémon", "Filemom", 1, "🤝", "Paul asks a friend to forgive his runaway slave, Onesimus", "Paul demande à un ami de pardonner à son esclave en fuite, Onésime", "Paulo pede a um amigo que perdoe seu escravo fugitivo, Onésimo"],
  ]],
  ["general", [
    ["heb", "Hebrews", "Hébreux", "Hebreus", 13, "🏆", "Jesus is greater than all, and the heroes of faith", "Jésus est plus grand que tout, et les héros de la foi", "Jesus é maior que tudo, e os heróis da fé"],
    ["jas", "James", "Jacques", "Tiago", 5, "👅", "Faith in action, and taming the tongue", "La foi en action, et dompter sa langue", "A fé em ação, e domar a língua"],
    ["1pe", "1 Peter", "1 Pierre", "1 Pedro", 5, "⚓", "Hope and courage when life is hard", "Espérance et courage quand la vie est difficile", "Esperança e coragem quando a vida é difícil"],
    ["2pe", "2 Peter", "2 Pierre", "2 Pedro", 3, "⚠️", "Grow in faith and watch out for false teachers", "Grandissez dans la foi et méfiez-vous des faux docteurs", "Cresçam na fé e cuidado com os falsos mestres"],
    ["1jn", "1 John", "1 Jean", "1 João", 5, "💛", "“God is love”, so love one another", "« Dieu est amour », alors aimez-vous les uns les autres", "«Deus é amor», então amem-se uns aos outros"],
    ["2jn", "2 John", "2 Jean", "2 João", 1, "💌", "A short note: walk in truth and love", "Un petit mot : marchez dans la vérité et l'amour", "Um bilhete curto: andem na verdade e no amor"],
    ["3jn", "3 John", "3 Jean", "3 João", 1, "🏠", "A thank-you for welcoming traveling teachers", "Un merci pour avoir accueilli des prédicateurs en voyage", "Um agradecimento por receber os pregadores viajantes"],
    ["jud", "Jude", "Jude", "Judas", 1, "✋", "Stand firm for the faith", "Combattez pour la foi", "Batalhem pela fé"],
    ["rev", "Revelation", "Apocalypse", "Apocalipse", 22, "🌈", "Visions of the end: Jesus wins and makes everything new", "Des visions de la fin : Jésus est vainqueur et fait toutes choses nouvelles", "Visões do fim: Jesus vence e faz novas todas as coisas"],
  ]],
];

export const BOOKS: Book[] = DATA.flatMap(([section, rows]) =>
  rows.map(([id, en, fr, pt, chapters, emoji, sumEn, sumFr, sumPt]) => ({
    id,
    order: 0,
    testament: SECTION_BY_ID.get(section)!.testament,
    section,
    chapters,
    emoji,
    names: { en, fr, pt },
    summary: { en: sumEn, fr: sumFr, pt: sumPt },
  })),
).map((b, i) => ({ ...b, order: i + 1 }));

export const BOOK_BY_ID = new Map(BOOKS.map((b) => [b.id, b]));

/** What a game covers: the whole Bible, one testament, or one section. */
export type Scope = "all" | Testament | SectionId;

export const SCOPES: Scope[] = ["all", "OT", "NT", ...SECTIONS.map((s) => s.id)];

export function inScope(b: Book, scope: Scope) {
  return scope === "all" || b.testament === scope || b.section === scope;
}

export function booksIn(scope: Scope) {
  return BOOKS.filter((b) => inScope(b, scope));
}

export function sectionOf(b: Book) {
  return SECTION_BY_ID.get(b.section)!;
}

export function bookName(b: Book, lang: Lang) {
  return b.names[lang];
}

/** Lowercase, no accents, no spaces or punctuation; "I Samuel", "1er Rois" and "1º Reis" become "1samuel", "1rois", "1reis". */
export function normalizeName(s: string) {
  const plain = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^(iii|ii|i)\s+/, (m) => `${m.trim().length} `)
    .replace(/^(first|second|third)\s+/, (m) => `${["first", "second", "third"].indexOf(m.trim()) + 1} `)
    .replace(/^(\d)\s*(er|re|ere|e|st|nd|rd|o|a|º|ª)?\s+/, "$1 ");
  return plain.replace(/[^a-z0-9]/g, "");
}

// Other common spellings players might type.
const ALIASES: Record<string, string[]> = {
  psa: ["Psalm", "Salmo", "Psaume"],
  sng: ["Song of Solomon", "Canticles", "Cantares", "Cântico de Salomão", "Cantiques", "Cantique"],
  rev: ["Revelations", "Apocalipsis"],
  ecc: ["Qohelet", "Qoheleth", "Eclesiaste"],
  jud: ["Judas"],
  isa: ["Esaie", "Isaie"],
  phm: ["Filemon", "Filémon"],
  hab: ["Habacuque", "Habakuk"],
};

/** Every accepted spelling of a book, normalized. Names in any of the three languages count. */
export function acceptedNames(b: Book) {
  return new Set([...Object.values(b.names), ...(ALIASES[b.id] ?? [])].map(normalizeName));
}

/** The book a typed name refers to, if any. */
export function findBook(input: string): Book | undefined {
  const n = normalizeName(input);
  if (!n) return undefined;
  return BOOKS.find((b) => acceptedNames(b).has(n));
}
