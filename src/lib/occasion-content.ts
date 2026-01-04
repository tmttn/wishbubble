export interface GiftIdea {
  nameEn: string;
  nameNl: string;
  descriptionEn: string;
  descriptionNl: string;
  priceRange: "€" | "€€" | "€€€";
  emoji: string;
}

export interface GiftCategory {
  nameEn: string;
  nameNl: string;
  emoji: string;
  ideas: GiftIdea[];
}

export interface ChecklistItem {
  textEn: string;
  textNl: string;
}

export interface Tip {
  titleEn: string;
  titleNl: string;
  textEn: string;
  textNl: string;
  emoji: string;
}

export interface OccasionContent {
  slug: string;
  titleEn: string;
  titleNl: string;
  descriptionEn: string;
  descriptionNl: string;
  heroImageUrl?: string;
  searchQueries: string[];
  color: string;
  gradient: string;
  icon: "tree-pine" | "cake" | "gift" | "heart" | "baby" | "graduation-cap" | "home";
  emoji: string;
  // Occasion-specific content
  tips: Tip[];
  checklist: ChecklistItem[];
  giftCategories: GiftCategory[];
  faqs: Array<{
    questionEn: string;
    questionNl: string;
    answerEn: string;
    answerNl: string;
  }>;
}

export const occasionContent: Record<string, OccasionContent> = {
  christmas: {
    slug: "christmas",
    titleEn: "Christmas Gift Ideas",
    titleNl: "Kerst Cadeau Ideeën",
    descriptionEn:
      "Find the perfect Christmas gifts for everyone on your list. Create a wishlist group with family and friends to coordinate gift-giving and avoid duplicate presents.",
    descriptionNl:
      "Vind de perfecte kerstcadeaus voor iedereen op je lijst. Maak een verlanglijst-groep met familie en vrienden om cadeaus te coördineren en dubbele cadeaus te voorkomen.",
    searchQueries: ["christmas", "kerst", "holiday", "gift"],
    color: "#DC2626",
    gradient: "from-red-600 via-red-500 to-green-600",
    icon: "tree-pine",
    emoji: "🎄",
    tips: [
      {
        titleEn: "Start Early",
        titleNl: "Begin Op Tijd",
        textEn: "Begin shopping in November to avoid sold-out items and shipping delays. Popular toys and electronics often sell out weeks before Christmas.",
        textNl: "Begin in november met shoppen om uitverkochte artikelen en leveringsvertragingen te voorkomen. Populair speelgoed en elektronica zijn vaak weken voor kerst uitverkocht.",
        emoji: "📅",
      },
      {
        titleEn: "Set a Budget",
        titleNl: "Stel een Budget",
        textEn: "Decide how much to spend per person before shopping. A €25-50 limit for extended family keeps things fair and stress-free.",
        textNl: "Bepaal hoeveel je per persoon wilt uitgeven voordat je gaat shoppen. Een limiet van €25-50 voor uitgebreide familie houdt het eerlijk en stressvrij.",
        emoji: "💰",
      },
      {
        titleEn: "Think Experiences",
        titleNl: "Denk aan Ervaringen",
        textEn: "Concert tickets, cooking classes, or spa vouchers create lasting memories. They're perfect for people who 'have everything'.",
        textNl: "Concertkaartjes, kooklessen of spa-bonnen creëren blijvende herinneringen. Perfect voor mensen die 'alles al hebben'.",
        emoji: "🎭",
      },
      {
        titleEn: "Coordinate with Family",
        titleNl: "Coördineer met Familie",
        textEn: "Use WishBubble's secret claiming feature so multiple people don't accidentally buy the same gift. No more awkward duplicate presents!",
        textNl: "Gebruik WishBubble's geheime claim-functie zodat meerdere mensen niet per ongeluk hetzelfde cadeau kopen. Geen gênante dubbele cadeaus meer!",
        emoji: "👨‍👩‍👧‍👦",
      },
    ],
    checklist: [
      { textEn: "Create a gift list for each person", textNl: "Maak een cadeaulijst voor elke persoon" },
      { textEn: "Set your total Christmas budget", textNl: "Stel je totale kerstbudget vast" },
      { textEn: "Order online gifts by December 15th", textNl: "Bestel online cadeaus voor 15 december" },
      { textEn: "Buy wrapping paper and gift tags", textNl: "Koop inpakpapier en cadeaulabels" },
      { textEn: "Plan Secret Santa with your group", textNl: "Plan Secret Santa met je groep" },
      { textEn: "Check shipping deadlines for international gifts", textNl: "Controleer verzenddeadlines voor internationale cadeaus" },
    ],
    giftCategories: [
      {
        nameEn: "Cozy Home Gifts",
        nameNl: "Gezellige Huis Cadeaus",
        emoji: "🏠",
        ideas: [
          { nameEn: "Weighted Blanket", nameNl: "Verzwaringsdeken", descriptionEn: "For the best sleep of their life", descriptionNl: "Voor de beste nachtrust ooit", priceRange: "€€", emoji: "🛋️" },
          { nameEn: "Scented Candle Set", nameNl: "Geurkaarsen Set", descriptionEn: "Create the perfect winter ambiance", descriptionNl: "Creëer de perfecte wintersfeer", priceRange: "€", emoji: "🕯️" },
          { nameEn: "Electric Blanket", nameNl: "Elektrische Deken", descriptionEn: "Warm and toasty on cold nights", descriptionNl: "Warm en behaaglijk op koude avonden", priceRange: "€€", emoji: "⚡" },
          { nameEn: "Luxury Slippers", nameNl: "Luxe Pantoffels", descriptionEn: "Sheepskin or memory foam comfort", descriptionNl: "Schapenvacht of memory foam comfort", priceRange: "€", emoji: "🥿" },
        ],
      },
      {
        nameEn: "Tech & Gadgets",
        nameNl: "Tech & Gadgets",
        emoji: "📱",
        ideas: [
          { nameEn: "Wireless Earbuds", nameNl: "Draadloze Oordopjes", descriptionEn: "AirPods, Galaxy Buds, or budget alternatives", descriptionNl: "AirPods, Galaxy Buds, of budget alternatieven", priceRange: "€€", emoji: "🎧" },
          { nameEn: "Smart Speaker", nameNl: "Slimme Speaker", descriptionEn: "Alexa, Google Home, or HomePod Mini", descriptionNl: "Alexa, Google Home, of HomePod Mini", priceRange: "€€", emoji: "🔊" },
          { nameEn: "E-reader", nameNl: "E-reader", descriptionEn: "Kindle or Kobo for book lovers", descriptionNl: "Kindle of Kobo voor boekenliefhebbers", priceRange: "€€", emoji: "📚" },
          { nameEn: "Portable Charger", nameNl: "Powerbank", descriptionEn: "Never run out of battery again", descriptionNl: "Nooit meer een lege batterij", priceRange: "€", emoji: "🔋" },
        ],
      },
      {
        nameEn: "For Foodies",
        nameNl: "Voor Fijnproevers",
        emoji: "🍽️",
        ideas: [
          { nameEn: "Gourmet Food Basket", nameNl: "Gourmet Voedselmand", descriptionEn: "Cheeses, chocolates, and specialty items", descriptionNl: "Kazen, chocolade en specialiteiten", priceRange: "€€", emoji: "🧀" },
          { nameEn: "Dutch Stroopwafels Box", nameNl: "Stroopwafels Doos", descriptionEn: "Authentic Dutch treat gift box", descriptionNl: "Authentieke Nederlandse traktatie", priceRange: "€", emoji: "🧇" },
          { nameEn: "Coffee Subscription", nameNl: "Koffie Abonnement", descriptionEn: "Monthly specialty beans delivery", descriptionNl: "Maandelijkse specialty bonen bezorging", priceRange: "€€", emoji: "☕" },
          { nameEn: "Cooking Class Voucher", nameNl: "Kookles Voucher", descriptionEn: "Learn Italian, Thai, or sushi making", descriptionNl: "Leer Italiaans, Thais of sushi maken", priceRange: "€€€", emoji: "👨‍🍳" },
        ],
      },
      {
        nameEn: "For Kids",
        nameNl: "Voor Kinderen",
        emoji: "🧸",
        ideas: [
          { nameEn: "LEGO Set", nameNl: "LEGO Set", descriptionEn: "From simple to complex builds for any age", descriptionNl: "Van simpel tot complex voor elke leeftijd", priceRange: "€€", emoji: "🧱" },
          { nameEn: "Board Game", nameNl: "Bordspel", descriptionEn: "Family game nights are the best", descriptionNl: "Familie spelavonden zijn het beste", priceRange: "€", emoji: "🎲" },
          { nameEn: "Art Supplies Kit", nameNl: "Tekenspullen Set", descriptionEn: "Crayons, markers, paints and paper", descriptionNl: "Kleurpotloden, stiften, verf en papier", priceRange: "€", emoji: "🎨" },
          { nameEn: "Kids Tablet", nameNl: "Kindertablet", descriptionEn: "Educational and entertainment in one", descriptionNl: "Educatie en entertainment in één", priceRange: "€€€", emoji: "📱" },
        ],
      },
    ],
    faqs: [
      {
        questionEn: "When should I start Christmas shopping?",
        questionNl: "Wanneer moet ik beginnen met kerstshoppen?",
        answerEn:
          "We recommend starting in early November to avoid the rush and ensure popular items are in stock. Create your WishBubble group early so everyone has time to add their wishes!",
        answerNl:
          "We raden aan om begin november te beginnen om de drukte te vermijden en ervoor te zorgen dat populaire artikelen op voorraad zijn. Maak je WishBubble-groep vroeg aan zodat iedereen tijd heeft om hun wensen toe te voegen!",
      },
      {
        questionEn: "How can I coordinate gifts with my family?",
        questionNl: "Hoe kan ik cadeaus coördineren met mijn familie?",
        answerEn:
          "Create a WishBubble group and invite your family members. Everyone can add their wishlists, and you can secretly claim gifts to avoid duplicates. Use Secret Santa mode for gift exchanges!",
        answerNl:
          "Maak een WishBubble-groep en nodig je familieleden uit. Iedereen kan hun verlanglijstjes toevoegen en je kunt in het geheim cadeaus claimen om dubbele te voorkomen. Gebruik de Secret Santa-modus voor cadeau-uitwisselingen!",
      },
      {
        questionEn: "What are popular Christmas gift categories?",
        questionNl: "Wat zijn populaire kerst-cadeaucategorieën?",
        answerEn:
          "Popular categories include electronics, toys, clothing, home decor, books, and experiences. WishBubble helps you discover what your loved ones actually want!",
        answerNl:
          "Populaire categorieën zijn elektronica, speelgoed, kleding, woondecoratie, boeken en ervaringen. WishBubble helpt je ontdekken wat je dierbaren echt willen!",
      },
    ],
  },
  birthday: {
    slug: "birthday",
    titleEn: "Birthday Gift Ideas",
    titleNl: "Verjaardag Cadeau Ideeën",
    descriptionEn:
      "Discover perfect birthday gifts for all ages. Create a birthday wishlist to share with friends and family, making gift-giving easy and ensuring you get exactly what you want.",
    descriptionNl:
      "Ontdek perfecte verjaardagscadeaus voor alle leeftijden. Maak een verjaardag-verlanglijst om te delen met vrienden en familie, zodat cadeau geven makkelijk wordt en je precies krijgt wat je wilt.",
    searchQueries: ["birthday", "verjaardag", "gift", "cadeau"],
    color: "#7C3AED",
    gradient: "from-purple-600 via-pink-500 to-rose-500",
    icon: "cake",
    emoji: "🎂",
    tips: [
      {
        titleEn: "Match Their Interests",
        titleNl: "Pas bij Hun Interesses",
        textEn: "Think about their hobbies. A gardener wants plants, not gym equipment. Pay attention to what they talk about passionately.",
        textNl: "Denk aan hun hobby's. Een tuinier wil planten, geen sportapparatuur. Let op waar ze enthousiast over praten.",
        emoji: "🎯",
      },
      {
        titleEn: "Consider Their Age",
        titleNl: "Denk aan Leeftijd",
        textEn: "A 30th birthday calls for something special. Milestone birthdays (18, 21, 30, 50) deserve extra thought and meaningful gifts.",
        textNl: "Een 30e verjaardag vraagt om iets speciaals. Mijlpaal verjaardagen (18, 21, 30, 50) verdienen extra aandacht en betekenisvolle cadeaus.",
        emoji: "🎈",
      },
      {
        titleEn: "Personalize It",
        titleNl: "Maak het Persoonlijk",
        textEn: "Engraved jewelry, custom photo books, or monogrammed items show you put extra thought into the gift.",
        textNl: "Gegraveerde sieraden, aangepaste fotoboeken of items met monogram laten zien dat je extra moeite hebt gedaan.",
        emoji: "💝",
      },
      {
        titleEn: "Group Gift Option",
        titleNl: "Groepscadeau Optie",
        textEn: "For expensive items, pool money with friends. WishBubble lets multiple people contribute to one gift.",
        textNl: "Voor dure items, leg geld samen met vrienden. Met WishBubble kunnen meerdere mensen bijdragen aan één cadeau.",
        emoji: "👥",
      },
    ],
    checklist: [
      { textEn: "Note down gift ideas when they mention them", textNl: "Noteer cadeau-ideeën wanneer ze deze noemen" },
      { textEn: "Check their wishlist for exact preferences", textNl: "Bekijk hun verlanglijst voor exacte voorkeuren" },
      { textEn: "Order gifts at least a week in advance", textNl: "Bestel cadeaus minstens een week van tevoren" },
      { textEn: "Consider including a heartfelt card", textNl: "Overweeg een persoonlijke kaart toe te voegen" },
      { textEn: "Plan the surprise or party details", textNl: "Plan de verrassing of feestdetails" },
      { textEn: "Wrap gift nicely or use a gift bag", textNl: "Pak het cadeau mooi in of gebruik een cadeautas" },
    ],
    giftCategories: [
      {
        nameEn: "Experience Gifts",
        nameNl: "Beleveniscadeaus",
        emoji: "🎪",
        ideas: [
          { nameEn: "Escape Room Voucher", nameNl: "Escape Room Voucher", descriptionEn: "Fun puzzle adventure with friends", descriptionNl: "Leuk puzzelavontuur met vrienden", priceRange: "€€", emoji: "🔐" },
          { nameEn: "Spa Day Pass", nameNl: "Spa Dagpas", descriptionEn: "Relaxation and pampering", descriptionNl: "Ontspanning en verwennerij", priceRange: "€€€", emoji: "💆" },
          { nameEn: "Concert/Event Tickets", nameNl: "Concert/Evenement Tickets", descriptionEn: "See their favorite artist live", descriptionNl: "Zie hun favoriete artiest live", priceRange: "€€€", emoji: "🎵" },
          { nameEn: "Wine Tasting Tour", nameNl: "Wijnproeverij Tour", descriptionEn: "Explore local vineyards", descriptionNl: "Ontdek lokale wijngaarden", priceRange: "€€", emoji: "🍷" },
        ],
      },
      {
        nameEn: "Personal Care",
        nameNl: "Persoonlijke Verzorging",
        emoji: "✨",
        ideas: [
          { nameEn: "Premium Skincare Set", nameNl: "Premium Huidverzorging Set", descriptionEn: "La Roche-Posay, The Ordinary, or Clinique", descriptionNl: "La Roche-Posay, The Ordinary, of Clinique", priceRange: "€€", emoji: "🧴" },
          { nameEn: "Perfume/Cologne", nameNl: "Parfum", descriptionEn: "Their signature scent or something new", descriptionNl: "Hun kenmerkende geur of iets nieuws", priceRange: "€€€", emoji: "🌸" },
          { nameEn: "Massage Gun", nameNl: "Massage Gun", descriptionEn: "For athletes and desk workers alike", descriptionNl: "Voor sporters en kantoorwerkers", priceRange: "€€", emoji: "💪" },
          { nameEn: "Electric Toothbrush", nameNl: "Elektrische Tandenborstel", descriptionEn: "Philips Sonicare or Oral-B", descriptionNl: "Philips Sonicare of Oral-B", priceRange: "€€", emoji: "🦷" },
        ],
      },
      {
        nameEn: "Fashion & Accessories",
        nameNl: "Mode & Accessoires",
        emoji: "👗",
        ideas: [
          { nameEn: "Quality Watch", nameNl: "Kwaliteitshorloge", descriptionEn: "Timeless accessory for any style", descriptionNl: "Tijdloos accessoire voor elke stijl", priceRange: "€€€", emoji: "⌚" },
          { nameEn: "Designer Sunglasses", nameNl: "Designer Zonnebril", descriptionEn: "Ray-Ban, Oakley, or Gucci", descriptionNl: "Ray-Ban, Oakley, of Gucci", priceRange: "€€€", emoji: "🕶️" },
          { nameEn: "Leather Wallet", nameNl: "Leren Portemonnee", descriptionEn: "Slim, quality leather that lasts", descriptionNl: "Slank, kwaliteitsleer dat lang meegaat", priceRange: "€€", emoji: "👛" },
          { nameEn: "Cashmere Scarf", nameNl: "Kasjmier Sjaal", descriptionEn: "Luxuriously soft and warm", descriptionNl: "Luxueus zacht en warm", priceRange: "€€", emoji: "🧣" },
        ],
      },
      {
        nameEn: "For Hobbyists",
        nameNl: "Voor Hobbyisten",
        emoji: "🎨",
        ideas: [
          { nameEn: "Camera or Lens", nameNl: "Camera of Lens", descriptionEn: "For photography enthusiasts", descriptionNl: "Voor fotografie-enthousiastelingen", priceRange: "€€€", emoji: "📷" },
          { nameEn: "Musical Instrument", nameNl: "Muziekinstrument", descriptionEn: "Guitar, keyboard, or ukulele starter kit", descriptionNl: "Gitaar, keyboard, of ukulele starterskit", priceRange: "€€", emoji: "🎸" },
          { nameEn: "Craft Supplies Kit", nameNl: "Hobby Materialen Set", descriptionEn: "Knitting, painting, or jewelry making", descriptionNl: "Breien, schilderen, of sieraden maken", priceRange: "€", emoji: "🧶" },
          { nameEn: "Gaming Accessories", nameNl: "Gaming Accessoires", descriptionEn: "Controllers, headsets, or game passes", descriptionNl: "Controllers, headsets, of game passes", priceRange: "€€", emoji: "🎮" },
        ],
      },
    ],
    faqs: [
      {
        questionEn: "How do I share my birthday wishlist?",
        questionNl: "Hoe deel ik mijn verjaardag-verlanglijst?",
        answerEn:
          "Create a birthday bubble on WishBubble, add your wishlist items, and share the link with friends and family. They can see your wishes and secretly claim items!",
        answerNl:
          "Maak een verjaardag-bubble aan op WishBubble, voeg je verlanglijst-items toe en deel de link met vrienden en familie. Zij kunnen je wensen zien en items geheim claimen!",
      },
      {
        questionEn: "What are good birthday gift ideas by age?",
        questionNl: "Wat zijn goede verjaardagscadeau-ideeën per leeftijd?",
        answerEn:
          "Gift ideas vary by age - toys and games for kids, tech and fashion for teens, experiences and home items for adults. The best approach is to ask! That's why wishlists are so helpful.",
        answerNl:
          "Cadeau-ideeën variëren per leeftijd - speelgoed en spelletjes voor kinderen, tech en mode voor tieners, ervaringen en huisartikelen voor volwassenen. De beste aanpak is om te vragen! Daarom zijn verlanglijstjes zo handig.",
      },
    ],
  },
  sinterklaas: {
    slug: "sinterklaas",
    titleEn: "Sinterklaas Gift Ideas",
    titleNl: "Sinterklaas Cadeau Ideeën",
    descriptionEn:
      "Celebrate Sinterklaas with the perfect gifts! Create wishlists for pakjesavond and coordinate with family to make this Dutch tradition extra special.",
    descriptionNl:
      "Vier Sinterklaas met de perfecte cadeaus! Maak verlanglijstjes voor pakjesavond en coördineer met familie om deze Nederlandse traditie extra speciaal te maken.",
    searchQueries: ["sinterklaas", "pakjesavond", "sint", "cadeau"],
    color: "#EA580C",
    gradient: "from-red-600 via-orange-500 to-amber-500",
    icon: "gift",
    emoji: "🎁",
    tips: [
      {
        titleEn: "Write a Surprise Poem",
        titleNl: "Schrijf een Surprisegedicht",
        textEn: "A funny poem about the recipient is traditional. Include inside jokes and gentle teasing about their quirks.",
        textNl: "Een grappig gedicht over de ontvanger is traditioneel. Voeg inside jokes en milde plagerijen over hun eigenaardigheden toe.",
        emoji: "📝",
      },
      {
        titleEn: "Create a Surprise",
        titleNl: "Maak een Surprise",
        textEn: "Hide the gift in a creative handmade wrapper that relates to their hobby or personality. The surprise is part of the fun!",
        textNl: "Verstop het cadeau in een creatieve zelfgemaakte verpakking die past bij hun hobby of persoonlijkheid. De surprise is onderdeel van het plezier!",
        emoji: "🎨",
      },
      {
        titleEn: "Do Lootjes Trekken",
        titleNl: "Doe Lootjes Trekken",
        textEn: "Draw names so everyone buys for just one person. WishBubble's Secret Santa feature makes this digital and easy!",
        textNl: "Trek lootjes zodat iedereen voor maar één persoon koopt. WishBubble's Secret Santa-functie maakt dit digitaal en makkelijk!",
        emoji: "🎫",
      },
      {
        titleEn: "Include Treats",
        titleNl: "Voeg Snoep Toe",
        textEn: "Add pepernoten, chocolate letters, and speculaas to your gift. These traditional treats complete the Sinterklaas experience.",
        textNl: "Voeg pepernoten, chocoladeletters en speculaas toe aan je cadeau. Deze traditionele traktaties maken de Sinterklaas-ervaring compleet.",
        emoji: "🍫",
      },
    ],
    checklist: [
      { textEn: "Put shoes by the fireplace (for the kids)", textNl: "Zet schoen bij de haard (voor de kinderen)" },
      { textEn: "Organize lootjes trekken with your group", textNl: "Organiseer lootjes trekken met je groep" },
      { textEn: "Buy pepernoten and chocolate letters", textNl: "Koop pepernoten en chocoladeletters" },
      { textEn: "Create or buy surprise wrapping materials", textNl: "Maak of koop surprise verpakkingsmaterialen" },
      { textEn: "Write the traditional surprise poem", textNl: "Schrijf het traditionele surprisegedicht" },
      { textEn: "Plan the pakjesavond gathering", textNl: "Plan de pakjesavond bijeenkomst" },
    ],
    giftCategories: [
      {
        nameEn: "Traditional Dutch Gifts",
        nameNl: "Traditionele Nederlandse Cadeaus",
        emoji: "🇳🇱",
        ideas: [
          { nameEn: "Chocolate Letter", nameNl: "Chocoladeletter", descriptionEn: "Their initial in delicious chocolate", descriptionNl: "Hun initiaal in heerlijke chocolade", priceRange: "€", emoji: "🍫" },
          { nameEn: "Pepernoten Gift Tin", nameNl: "Pepernoten Blik", descriptionEn: "Decorative tin filled with spiced cookies", descriptionNl: "Decoratief blik gevuld met kruidnoten", priceRange: "€", emoji: "🍪" },
          { nameEn: "Sinterklaas Speculaas", nameNl: "Sinterklaas Speculaas", descriptionEn: "Large decorative spiced cookie", descriptionNl: "Grote decoratieve speculaaspop", priceRange: "€", emoji: "👤" },
          { nameEn: "Dutch Stroopwafels", nameNl: "Stroopwafels", descriptionEn: "Authentic caramel waffle cookies", descriptionNl: "Authentieke karamel wafels", priceRange: "€", emoji: "🧇" },
        ],
      },
      {
        nameEn: "Kids Favorites",
        nameNl: "Kinderfavorieten",
        emoji: "🧒",
        ideas: [
          { nameEn: "Playmobil Set", nameNl: "Playmobil Set", descriptionEn: "Classic imaginative play toys", descriptionNl: "Klassiek fantasierijk speelgoed", priceRange: "€€", emoji: "🎠" },
          { nameEn: "Nintendo Switch Game", nameNl: "Nintendo Switch Spel", descriptionEn: "Mario, Zelda, or Pokemon", descriptionNl: "Mario, Zelda, of Pokemon", priceRange: "€€", emoji: "🎮" },
          { nameEn: "Children's Book Set", nameNl: "Kinderboeken Set", descriptionEn: "Jip en Janneke, Nijntje, or Dolfje", descriptionNl: "Jip en Janneke, Nijntje, of Dolfje", priceRange: "€", emoji: "📚" },
          { nameEn: "Building Blocks", nameNl: "Bouwblokken", descriptionEn: "LEGO, Duplo, or wooden blocks", descriptionNl: "LEGO, Duplo, of houten blokken", priceRange: "€€", emoji: "🧱" },
        ],
      },
      {
        nameEn: "Cozy Season Gifts",
        nameNl: "Gezellige Seizoen Cadeaus",
        emoji: "🧣",
        ideas: [
          { nameEn: "Warm Socks Set", nameNl: "Warme Sokken Set", descriptionEn: "Wool or fleece-lined for cold days", descriptionNl: "Wol of fleece-gevoerd voor koude dagen", priceRange: "€", emoji: "🧦" },
          { nameEn: "Hot Chocolate Kit", nameNl: "Warme Chocolademelk Kit", descriptionEn: "Premium cocoa, marshmallows, mug", descriptionNl: "Premium cacao, marshmallows, mok", priceRange: "€", emoji: "☕" },
          { nameEn: "Puzzle 1000 Pieces", nameNl: "Puzzel 1000 Stukjes", descriptionEn: "Cozy indoor activity for winter", descriptionNl: "Gezellige binnenactiviteit voor winter", priceRange: "€", emoji: "🧩" },
          { nameEn: "Board Game", nameNl: "Bordspel", descriptionEn: "Ticket to Ride, Catan, or Dutch classics", descriptionNl: "Ticket to Ride, Catan, of Nederlandse klassiekers", priceRange: "€€", emoji: "🎲" },
        ],
      },
      {
        nameEn: "Surprise Wrapping Ideas",
        nameNl: "Surprise Verpakkingsideeën",
        emoji: "🎨",
        ideas: [
          { nameEn: "Giant Shoe Box", nameNl: "Grote Schoen Doos", descriptionEn: "Hide gift inside a decorated shoe", descriptionNl: "Verstop cadeau in een versierde schoen", priceRange: "€", emoji: "👟" },
          { nameEn: "Paper Maché Creation", nameNl: "Papier-maché Creatie", descriptionEn: "Custom shape matching their hobby", descriptionNl: "Aangepaste vorm passend bij hun hobby", priceRange: "€", emoji: "🎭" },
          { nameEn: "Balloon Pop Surprise", nameNl: "Ballon Pop Verrassing", descriptionEn: "Gift hidden inside a balloon", descriptionNl: "Cadeau verstopt in een ballon", priceRange: "€", emoji: "🎈" },
          { nameEn: "Mystery Box with Clues", nameNl: "Mysterieuze Doos met Aanwijzingen", descriptionEn: "Multiple boxes leading to the gift", descriptionNl: "Meerdere dozen die leiden naar het cadeau", priceRange: "€", emoji: "📦" },
        ],
      },
    ],
    faqs: [
      {
        questionEn: "When is Sinterklaas celebrated?",
        questionNl: "Wanneer wordt Sinterklaas gevierd?",
        answerEn:
          "Sinterklaas is celebrated on December 5th (pakjesavond) in the Netherlands, and December 6th in Belgium. Start planning your gifts early!",
        answerNl:
          "Sinterklaas wordt gevierd op 5 december (pakjesavond) in Nederland en 6 december in België. Begin vroeg met het plannen van je cadeaus!",
      },
      {
        questionEn: "How does lootjes trekken (drawing names) work?",
        questionNl: "Hoe werkt lootjes trekken?",
        answerEn:
          "WishBubble's Secret Santa feature is perfect for lootjes trekken! Each person is secretly assigned someone to buy a gift for, and wishlists help you find the perfect present.",
        answerNl:
          "WishBubble's Secret Santa-functie is perfect voor lootjes trekken! Iedereen krijgt geheim iemand toegewezen om een cadeau voor te kopen, en verlanglijstjes helpen je het perfecte cadeau te vinden.",
      },
    ],
  },
  wedding: {
    slug: "wedding",
    titleEn: "Wedding Gift Ideas",
    titleNl: "Bruiloft Cadeau Ideeën",
    descriptionEn:
      "Find thoughtful wedding gifts or create a wedding registry. Help the happy couple start their new life together with gifts they'll truly appreciate.",
    descriptionNl:
      "Vind doordachte bruiloftscadeaus of maak een huwelijkslijst. Help het gelukkige paar hun nieuwe leven samen te beginnen met cadeaus die ze echt waarderen.",
    searchQueries: ["wedding", "bruiloft", "huwelijk", "registry"],
    color: "#DB2777",
    gradient: "from-rose-400 via-pink-500 to-fuchsia-500",
    icon: "heart",
    emoji: "💒",
    tips: [
      {
        titleEn: "Check the Registry",
        titleNl: "Bekijk de Huwelijkslijst",
        textEn: "Most couples create a wishlist of items they actually need. Buying from it ensures your gift is wanted and avoids duplicates.",
        textNl: "De meeste stellen maken een verlanglijst van items die ze echt nodig hebben. Kopen van de lijst zorgt ervoor dat je cadeau gewenst is en voorkomt dubbele.",
        emoji: "📋",
      },
      {
        titleEn: "Consider Group Gifts",
        titleNl: "Overweeg Groepscadeaus",
        textEn: "Pool money with other guests for big-ticket items like a KitchenAid mixer or honeymoon contribution. WishBubble makes this easy to coordinate.",
        textNl: "Leg geld samen met andere gasten voor duurdere items zoals een KitchenAid mixer of huwelijksreis bijdrage. WishBubble maakt dit makkelijk te coördineren.",
        emoji: "👥",
      },
      {
        titleEn: "Think Long-Term",
        titleNl: "Denk Langdurig",
        textEn: "Choose quality items they'll use for years: good knives, luxe bedding, or timeless home decor. Skip trendy items.",
        textNl: "Kies kwaliteitsitems die ze jaren zullen gebruiken: goede messen, luxe beddengoed, of tijdloze woondecoratie. Sla trendy items over.",
        emoji: "♾️",
      },
      {
        titleEn: "Experiences Are Welcome",
        titleNl: "Ervaringen Zijn Welkom",
        textEn: "Many couples prefer experiences over things. Consider a nice restaurant voucher, couples massage, or honeymoon activity.",
        textNl: "Veel stellen prefereren ervaringen boven spullen. Overweeg een restaurantvoucher, duo-massage, of huwelijksreis-activiteit.",
        emoji: "✈️",
      },
    ],
    checklist: [
      { textEn: "Check the couple's wedding registry/wishlist", textNl: "Bekijk de huwelijkslijst/verlanglijst van het paar" },
      { textEn: "RSVP before the deadline", textNl: "RSVP voor de deadline" },
      { textEn: "Coordinate group gifts with other guests", textNl: "Coördineer groepscadeaus met andere gasten" },
      { textEn: "Include a heartfelt card with your gift", textNl: "Voeg een hartelijke kaart toe bij je cadeau" },
      { textEn: "Ship gift directly or bring to wedding", textNl: "Verzend cadeau direct of breng naar bruiloft" },
      { textEn: "Budget €50-150 per person typically", textNl: "Budget typisch €50-150 per persoon" },
    ],
    giftCategories: [
      {
        nameEn: "Kitchen Essentials",
        nameNl: "Keuken Essentials",
        emoji: "🍳",
        ideas: [
          { nameEn: "KitchenAid Stand Mixer", nameNl: "KitchenAid Keukenmachine", descriptionEn: "The ultimate wedding gift classic", descriptionNl: "De ultieme bruiloftscadeau klassieker", priceRange: "€€€", emoji: "🎛️" },
          { nameEn: "Le Creuset Dutch Oven", nameNl: "Le Creuset Braadpan", descriptionEn: "Cast iron that lasts a lifetime", descriptionNl: "Gietijzer dat een leven lang meegaat", priceRange: "€€€", emoji: "🍲" },
          { nameEn: "Quality Knife Set", nameNl: "Kwaliteitsmessen Set", descriptionEn: "Wüsthof, Zwilling, or Global", descriptionNl: "Wüsthof, Zwilling, of Global", priceRange: "€€€", emoji: "🔪" },
          { nameEn: "Nespresso Machine", nameNl: "Nespresso Machine", descriptionEn: "Morning coffee made easy", descriptionNl: "Ochtendkoffie makkelijk gemaakt", priceRange: "€€", emoji: "☕" },
        ],
      },
      {
        nameEn: "Bedroom & Bath",
        nameNl: "Slaapkamer & Badkamer",
        emoji: "🛏️",
        ideas: [
          { nameEn: "Luxury Bedding Set", nameNl: "Luxe Beddengoed Set", descriptionEn: "Egyptian cotton or sateen sheets", descriptionNl: "Egyptisch katoen of satijnen lakens", priceRange: "€€€", emoji: "🛌" },
          { nameEn: "Fluffy Towel Set", nameNl: "Pluizige Handdoekenset", descriptionEn: "Hotel-quality Turkish cotton", descriptionNl: "Hotelkwaliteit Turks katoen", priceRange: "€€", emoji: "🛁" },
          { nameEn: "Dyson Hair Dryer", nameNl: "Dyson Haardroger", descriptionEn: "The hair dryer everyone wants", descriptionNl: "De haardroger die iedereen wil", priceRange: "€€€", emoji: "💨" },
          { nameEn: "Matching Bathrobes", nameNl: "Bijpassende Badjassen", descriptionEn: "His and hers luxury robes", descriptionNl: "Luxe badjassen voor twee", priceRange: "€€", emoji: "👘" },
        ],
      },
      {
        nameEn: "Home & Decor",
        nameNl: "Huis & Decoratie",
        emoji: "🏠",
        ideas: [
          { nameEn: "Personalized Photo Frame", nameNl: "Gepersonaliseerde Fotolijst", descriptionEn: "Engraved with wedding date", descriptionNl: "Gegraveerd met trouwdatum", priceRange: "€", emoji: "🖼️" },
          { nameEn: "Smart Home Devices", nameNl: "Smart Home Apparaten", descriptionEn: "Nest Hub, Philips Hue starter kit", descriptionNl: "Nest Hub, Philips Hue starterkit", priceRange: "€€", emoji: "🏠" },
          { nameEn: "Quality Wine Glasses", nameNl: "Kwaliteits Wijnglazen", descriptionEn: "Riedel or Schott Zwiesel crystal", descriptionNl: "Riedel of Schott Zwiesel kristal", priceRange: "€€", emoji: "🍷" },
          { nameEn: "Decorative Vase", nameNl: "Decoratieve Vaas", descriptionEn: "Beautiful centerpiece for fresh flowers", descriptionNl: "Mooi middelpunt voor verse bloemen", priceRange: "€€", emoji: "🏺" },
        ],
      },
      {
        nameEn: "Experiences",
        nameNl: "Ervaringen",
        emoji: "✈️",
        ideas: [
          { nameEn: "Honeymoon Fund", nameNl: "Huwelijksreis Bijdrage", descriptionEn: "Contribute to their dream trip", descriptionNl: "Draag bij aan hun droomreis", priceRange: "€€€", emoji: "🏝️" },
          { nameEn: "Fine Dining Voucher", nameNl: "Fine Dining Voucher", descriptionEn: "Michelin star restaurant experience", descriptionNl: "Michelin ster restaurant ervaring", priceRange: "€€€", emoji: "🍽️" },
          { nameEn: "Couples Cooking Class", nameNl: "Kookles voor Twee", descriptionEn: "Learn to cook together", descriptionNl: "Leer samen koken", priceRange: "€€", emoji: "👩‍🍳" },
          { nameEn: "Couples Spa Day", nameNl: "Duo Spa Dag", descriptionEn: "Relaxation for the newlyweds", descriptionNl: "Ontspanning voor de pasgetrouwden", priceRange: "€€€", emoji: "💆" },
        ],
      },
    ],
    faqs: [
      {
        questionEn: "How much should I spend on a wedding gift?",
        questionNl: "Hoeveel moet ik uitgeven aan een bruiloftscadeau?",
        answerEn:
          "Wedding gift budgets typically range from 50-150 euros depending on your relationship with the couple. Group gifts are a great option for bigger items!",
        answerNl:
          "Bruiloftscadeau-budgetten variëren meestal van 50-150 euro, afhankelijk van je relatie met het paar. Groepscadeaus zijn een geweldige optie voor grotere items!",
      },
      {
        questionEn: "Can couples use WishBubble as a wedding registry?",
        questionNl: "Kunnen stellen WishBubble gebruiken als huwelijkslijst?",
        answerEn:
          "Absolutely! Create a wedding bubble, add your wishlist with items you need for your new home, and share the link with your guests. They can claim gifts to avoid duplicates.",
        answerNl:
          "Absoluut! Maak een bruiloft-bubble, voeg je verlanglijst toe met items die je nodig hebt voor je nieuwe huis, en deel de link met je gasten. Zij kunnen cadeaus claimen om dubbele te voorkomen.",
      },
    ],
  },
  baby_shower: {
    slug: "baby-shower",
    titleEn: "Baby Shower Gift Ideas",
    titleNl: "Babyshower Cadeau Ideeën",
    descriptionEn:
      "Welcome the new arrival with perfect baby shower gifts. Create a baby registry to help parents-to-be get everything they need for their little one.",
    descriptionNl:
      "Verwelkom de nieuwe baby met perfecte babyshower cadeaus. Maak een babyregister om aanstaande ouders te helpen alles te krijgen wat ze nodig hebben voor hun kleintje.",
    searchQueries: ["baby", "shower", "newborn", "registry"],
    color: "#0EA5E9",
    gradient: "from-sky-400 via-cyan-400 to-teal-400",
    icon: "baby",
    emoji: "👶",
    tips: [
      {
        titleEn: "Check the Registry First",
        titleNl: "Bekijk Eerst het Register",
        textEn: "Parents carefully choose what they need. Buying from the list ensures you're giving something useful and prevents duplicates.",
        textNl: "Ouders kiezen zorgvuldig wat ze nodig hebben. Kopen van de lijst zorgt ervoor dat je iets nuttigs geeft en voorkomt dubbele.",
        emoji: "📋",
      },
      {
        titleEn: "Consider Different Sizes",
        titleNl: "Denk aan Verschillende Maten",
        textEn: "Babies outgrow newborn clothes quickly! Size 3-6 months or 6-12 months are more practical and get more use.",
        textNl: "Baby's groeien snel uit newborn kleding! Maat 3-6 maanden of 6-12 maanden zijn praktischer en worden meer gebruikt.",
        emoji: "📏",
      },
      {
        titleEn: "Gift Cards Are Welcome",
        titleNl: "Cadeaubonnen Zijn Welkom",
        textEn: "Parents might not know what they need until baby arrives. Bol.com, Baby-Dump, or Prénatal gift cards are always appreciated.",
        textNl: "Ouders weten misschien niet wat ze nodig hebben tot baby er is. Bol.com, Baby-Dump, of Prénatal cadeaubonnen worden altijd gewaardeerd.",
        emoji: "💳",
      },
      {
        titleEn: "Include Something for Parents",
        titleNl: "Voeg Iets voor Ouders Toe",
        textEn: "New parents often forget themselves. A coffee gift set, snack basket, or meal delivery voucher shows you care about them too.",
        textNl: "Nieuwe ouders vergeten vaak zichzelf. Een koffie cadeauset, snackmand, of maaltijdbezorging voucher laat zien dat je ook om hen geeft.",
        emoji: "☕",
      },
    ],
    checklist: [
      { textEn: "Check baby registry for needed items", textNl: "Bekijk babyregister voor benodigde items" },
      { textEn: "Note if they're having a boy, girl, or surprise", textNl: "Noteer of het een jongen, meisje, of verrassing is" },
      { textEn: "Consider the nursery theme/colors", textNl: "Overweeg het babykamer thema/kleuren" },
      { textEn: "Include gift receipt for returns", textNl: "Voeg bon toe voor eventueel ruilen" },
      { textEn: "Avoid heavily scented products for baby", textNl: "Vermijd sterk geurende producten voor baby" },
      { textEn: "Add a sweet card for the memory book", textNl: "Voeg een lief kaartje toe voor het geheugenboek" },
    ],
    giftCategories: [
      {
        nameEn: "Essential Gear",
        nameNl: "Essentiële Uitrusting",
        emoji: "👶",
        ideas: [
          { nameEn: "Baby Monitor", nameNl: "Babyfoon", descriptionEn: "Video or audio with night vision", descriptionNl: "Video of audio met nachtzicht", priceRange: "€€", emoji: "📹" },
          { nameEn: "Ergobaby Carrier", nameNl: "Ergobaby Draagzak", descriptionEn: "Keep baby close, hands free", descriptionNl: "Houd baby dichtbij, handen vrij", priceRange: "€€€", emoji: "🤱" },
          { nameEn: "Stroller", nameNl: "Kinderwagen", descriptionEn: "Bugaboo, Joolz, or Maxi-Cosi", descriptionNl: "Bugaboo, Joolz, of Maxi-Cosi", priceRange: "€€€", emoji: "🍼" },
          { nameEn: "Car Seat", nameNl: "Autostoeltje", descriptionEn: "Safety first for travel", descriptionNl: "Veiligheid voorop tijdens reizen", priceRange: "€€€", emoji: "🚗" },
        ],
      },
      {
        nameEn: "Nursery Must-Haves",
        nameNl: "Babykamer Must-Haves",
        emoji: "🛏️",
        ideas: [
          { nameEn: "Swaddle Blanket Set", nameNl: "Inbakerdoeken Set", descriptionEn: "Soft muslin for cozy wrapping", descriptionNl: "Zachte mousseline voor gezellig inpakken", priceRange: "€", emoji: "🧸" },
          { nameEn: "White Noise Machine", nameNl: "Witte Ruis Machine", descriptionEn: "Helps baby (and parents) sleep", descriptionNl: "Helpt baby (en ouders) slapen", priceRange: "€", emoji: "🔊" },
          { nameEn: "Diaper Changing Mat", nameNl: "Aankleedkussen", descriptionEn: "Wipe-clean and comfortable", descriptionNl: "Afwasbaar en comfortabel", priceRange: "€", emoji: "👶" },
          { nameEn: "Baby Gym Play Mat", nameNl: "Baby Gym Speelmat", descriptionEn: "Sensory development and tummy time", descriptionNl: "Zintuiglijke ontwikkeling en buiktijd", priceRange: "€€", emoji: "🧩" },
        ],
      },
      {
        nameEn: "Feeding & Bath",
        nameNl: "Voeden & Baden",
        emoji: "🍼",
        ideas: [
          { nameEn: "Philips Avent Bottles Set", nameNl: "Philips Avent Flessen Set", descriptionEn: "Anti-colic bottle starter kit", descriptionNl: "Anti-koliek flessen starterkit", priceRange: "€€", emoji: "🍼" },
          { nameEn: "Breast Pump", nameNl: "Borstkolf", descriptionEn: "Medela or Spectra for nursing moms", descriptionNl: "Medela of Spectra voor zogende moeders", priceRange: "€€€", emoji: "🤱" },
          { nameEn: "Baby Bathtub", nameNl: "Babybad", descriptionEn: "Ergonomic support for safe bathing", descriptionNl: "Ergonomische ondersteuning voor veilig baden", priceRange: "€", emoji: "🛁" },
          { nameEn: "Hooded Baby Towels", nameNl: "Baby Handdoeken met Capuchon", descriptionEn: "Cute and cozy after bath time", descriptionNl: "Schattig en gezellig na badtijd", priceRange: "€", emoji: "🐻" },
        ],
      },
      {
        nameEn: "Keepsakes & Books",
        nameNl: "Aandenken & Boeken",
        emoji: "📚",
        ideas: [
          { nameEn: "Baby Memory Book", nameNl: "Baby Geheugenboek", descriptionEn: "Record milestones and memories", descriptionNl: "Leg mijlpalen en herinneringen vast", priceRange: "€", emoji: "📖" },
          { nameEn: "Classic Children's Books", nameNl: "Klassieke Kinderboeken", descriptionEn: "Nijntje, Kikker, or Rupsje Nooitgenoeg", descriptionNl: "Nijntje, Kikker, of Rupsje Nooitgenoeg", priceRange: "€", emoji: "📚" },
          { nameEn: "Hand/Footprint Kit", nameNl: "Hand/Voetafdruk Kit", descriptionEn: "Capture tiny prints forever", descriptionNl: "Leg kleine afdrukjes voor altijd vast", priceRange: "€", emoji: "✋" },
          { nameEn: "Personalized Name Sign", nameNl: "Gepersonaliseerd Naambord", descriptionEn: "Wooden nursery wall decor", descriptionNl: "Houten babykamer wanddecoratie", priceRange: "€", emoji: "🪵" },
        ],
      },
    ],
    faqs: [
      {
        questionEn: "What are essential baby shower gifts?",
        questionNl: "Wat zijn essentiële babyshower cadeaus?",
        answerEn:
          "Essential items include diapers, clothes, feeding supplies, a stroller, and nursery items. Check the parents' wishlist to see exactly what they need!",
        answerNl:
          "Essentiële items zijn luiers, kleding, voedingsbenodigdheden, een kinderwagen en babykamer-items. Bekijk de verlanglijst van de ouders om precies te zien wat ze nodig hebben!",
      },
    ],
  },
  graduation: {
    slug: "graduation",
    titleEn: "Graduation Gift Ideas",
    titleNl: "Afstuderen Cadeau Ideeën",
    descriptionEn:
      "Celebrate academic achievements with meaningful graduation gifts. Whether finishing high school or university, find gifts that mark this important milestone.",
    descriptionNl:
      "Vier academische prestaties met betekenisvolle afstudeercadeaus. Of het nu gaat om het afronden van de middelbare school of universiteit, vind cadeaus die deze belangrijke mijlpaal markeren.",
    searchQueries: ["graduation", "afstuderen", "diploma", "student"],
    color: "#059669",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    icon: "graduation-cap",
    emoji: "🎓",
    tips: [
      {
        titleEn: "Think About Next Steps",
        titleNl: "Denk aan de Volgende Stappen",
        textEn: "Is the graduate starting a job, traveling, or continuing education? Tailor your gift to their next chapter.",
        textNl: "Begint de afgestudeerde aan een baan, gaat reizen, of studeert verder? Pas je cadeau aan op hun volgende hoofdstuk.",
        emoji: "🚀",
      },
      {
        titleEn: "Practical is Appreciated",
        titleNl: "Praktisch Wordt Gewaardeerd",
        textEn: "New grads often need professional clothes, a good laptop bag, or help setting up their first apartment.",
        textNl: "Nieuwe afgestudeerden hebben vaak professionele kleding, een goede laptoptas, of hulp bij het inrichten van hun eerste appartement nodig.",
        emoji: "💼",
      },
      {
        titleEn: "Money is Always Welcome",
        titleNl: "Geld is Altijd Welkom",
        textEn: "Cash or gift cards let them choose what they need most. Student loans, moving costs, or a trip – they'll appreciate the flexibility.",
        textNl: "Contant geld of cadeaubonnen laten hen kiezen wat ze het meest nodig hebben. Studieschuld, verhuiskosten, of een reis – ze waarderen de flexibiliteit.",
        emoji: "💰",
      },
      {
        titleEn: "Create Memories",
        titleNl: "Creëer Herinneringen",
        textEn: "A photo book of their school years, a personalized diploma frame, or a trip together makes for a meaningful gift.",
        textNl: "Een fotoboek van hun schooljaren, een gepersonaliseerde diplomalijst, of een reis samen maakt een betekenisvol cadeau.",
        emoji: "📸",
      },
    ],
    checklist: [
      { textEn: "Consider their field of study/career", textNl: "Overweeg hun studierichting/carrière" },
      { textEn: "Ask what they need for their next step", textNl: "Vraag wat ze nodig hebben voor hun volgende stap" },
      { textEn: "Include a congratulations card", textNl: "Voeg een felicitatiekaart toe" },
      { textEn: "Consider a meaningful keepsake", textNl: "Overweeg een betekenisvol aandenken" },
      { textEn: "Gift receipt for exchangeable items", textNl: "Bon voor ruilbare items" },
      { textEn: "Attend the graduation ceremony if invited", textNl: "Woon de diploma-uitreiking bij als je bent uitgenodigd" },
    ],
    giftCategories: [
      {
        nameEn: "Professional Essentials",
        nameNl: "Professionele Essentials",
        emoji: "💼",
        ideas: [
          { nameEn: "Quality Leather Bag", nameNl: "Kwaliteits Leren Tas", descriptionEn: "Briefcase or laptop bag for work", descriptionNl: "Aktetas of laptoptas voor werk", priceRange: "€€€", emoji: "💼" },
          { nameEn: "Professional Outfit", nameNl: "Professionele Outfit", descriptionEn: "Suit, blazer, or interview outfit", descriptionNl: "Pak, blazer, of sollicitatie outfit", priceRange: "€€€", emoji: "👔" },
          { nameEn: "Business Card Holder", nameNl: "Visitekaartjeshouder", descriptionEn: "Sleek metal or leather case", descriptionNl: "Strakke metalen of leren houder", priceRange: "€", emoji: "🪪" },
          { nameEn: "Quality Pen Set", nameNl: "Kwaliteits Pennenset", descriptionEn: "Montblanc, Parker, or Cross", descriptionNl: "Montblanc, Parker, of Cross", priceRange: "€€", emoji: "🖊️" },
        ],
      },
      {
        nameEn: "Tech & Gadgets",
        nameNl: "Tech & Gadgets",
        emoji: "💻",
        ideas: [
          { nameEn: "iPad or Tablet", nameNl: "iPad of Tablet", descriptionEn: "Great for work and entertainment", descriptionNl: "Geweldig voor werk en entertainment", priceRange: "€€€", emoji: "📱" },
          { nameEn: "Noise-Canceling Headphones", nameNl: "Noise-Canceling Koptelefoon", descriptionEn: "Sony, Bose, or Apple AirPods Max", descriptionNl: "Sony, Bose, of Apple AirPods Max", priceRange: "€€€", emoji: "🎧" },
          { nameEn: "External Monitor", nameNl: "Externe Monitor", descriptionEn: "Productivity boost for home office", descriptionNl: "Productiviteitsboost voor thuiskantoor", priceRange: "€€", emoji: "🖥️" },
          { nameEn: "Smart Watch", nameNl: "Smart Watch", descriptionEn: "Apple Watch or Garmin", descriptionNl: "Apple Watch of Garmin", priceRange: "€€€", emoji: "⌚" },
        ],
      },
      {
        nameEn: "First Apartment",
        nameNl: "Eerste Appartement",
        emoji: "🏠",
        ideas: [
          { nameEn: "Kitchen Starter Kit", nameNl: "Keuken Starterkit", descriptionEn: "Pots, pans, and utensils basics", descriptionNl: "Pannen, potten en keukengerei basics", priceRange: "€€", emoji: "🍳" },
          { nameEn: "Bedding Set", nameNl: "Beddengoed Set", descriptionEn: "Quality sheets and duvet cover", descriptionNl: "Kwaliteitslakens en dekbedovertrek", priceRange: "€€", emoji: "🛏️" },
          { nameEn: "Coffee Maker", nameNl: "Koffiezetapparaat", descriptionEn: "Nespresso, French press, or drip", descriptionNl: "Nespresso, French press, of filter", priceRange: "€€", emoji: "☕" },
          { nameEn: "Vacuum Cleaner", nameNl: "Stofzuiger", descriptionEn: "Dyson or robot vacuum", descriptionNl: "Dyson of robotstofzuiger", priceRange: "€€€", emoji: "🧹" },
        ],
      },
      {
        nameEn: "Experience & Travel",
        nameNl: "Ervaring & Reizen",
        emoji: "✈️",
        ideas: [
          { nameEn: "InterRail Pass", nameNl: "InterRail Pas", descriptionEn: "Explore Europe by train", descriptionNl: "Ontdek Europa per trein", priceRange: "€€€", emoji: "🚄" },
          { nameEn: "Language Course", nameNl: "Taalcursus", descriptionEn: "Babbel, Duolingo Plus, or in-person", descriptionNl: "Babbel, Duolingo Plus, of fysiek", priceRange: "€€", emoji: "🗣️" },
          { nameEn: "Quality Luggage", nameNl: "Kwaliteits Koffer", descriptionEn: "Samsonite or Away carry-on", descriptionNl: "Samsonite of Away handbagage", priceRange: "€€€", emoji: "🧳" },
          { nameEn: "Travel Gift Card", nameNl: "Reis Cadeaubon", descriptionEn: "Booking.com or Airbnb credit", descriptionNl: "Booking.com of Airbnb tegoed", priceRange: "€€€", emoji: "🎫" },
        ],
      },
    ],
    faqs: [
      {
        questionEn: "What are good graduation gift ideas?",
        questionNl: "Wat zijn goede afstudeercadeau-ideeën?",
        answerEn:
          "Popular graduation gifts include electronics, professional attire, travel experiences, and practical items for their next chapter. Money toward further education is also appreciated!",
        answerNl:
          "Populaire afstudeercadeaus zijn elektronica, professionele kleding, reiservaringen en praktische items voor hun volgende hoofdstuk. Geld voor verdere opleiding wordt ook gewaardeerd!",
      },
    ],
  },
  housewarming: {
    slug: "housewarming",
    titleEn: "Housewarming Gift Ideas",
    titleNl: "Nieuwe Woning Cadeau Ideeën",
    descriptionEn:
      "Help friends and family settle into their new home with thoughtful housewarming gifts. From practical kitchen items to decorative pieces, find the perfect present.",
    descriptionNl:
      "Help vrienden en familie zich thuis te voelen in hun nieuwe woning met doordachte huisinwijdingscadeaus. Van praktische keukenitems tot decoratieve stukken, vind het perfecte cadeau.",
    searchQueries: ["housewarming", "home", "kitchen", "decor"],
    color: "#D97706",
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    icon: "home",
    emoji: "🏠",
    tips: [
      {
        titleEn: "Know Their Style",
        titleNl: "Ken Hun Stijl",
        textEn: "Modern, rustic, minimalist? Match your gift to their decor taste. When in doubt, go neutral or ask what they need.",
        textNl: "Modern, rustiek, minimalistisch? Pas je cadeau aan bij hun interieurstijl. Bij twijfel, ga voor neutraal of vraag wat ze nodig hebben.",
        emoji: "🎨",
      },
      {
        titleEn: "Practical is Perfect",
        titleNl: "Praktisch is Perfect",
        textEn: "New homeowners often lack basics: a good toolkit, quality cutting board, or plant care kit. Ask what's missing!",
        textNl: "Nieuwe huiseigenaren missen vaak de basis: een goede gereedschapskist, kwaliteit snijplank, of plantenverzorging set. Vraag wat er mist!",
        emoji: "🔧",
      },
      {
        titleEn: "Consider Their Space",
        titleNl: "Overweeg Hun Ruimte",
        textEn: "A tiny apartment doesn't need a bulky appliance. Compact, multi-purpose items or experiences work better for small spaces.",
        textNl: "Een klein appartement heeft geen groot apparaat nodig. Compacte, multifunctionele items of ervaringen werken beter voor kleine ruimtes.",
        emoji: "📐",
      },
      {
        titleEn: "Traditional Gifts Work",
        titleNl: "Traditionele Cadeaus Werken",
        textEn: "Bread, salt, and wine are classic housewarming gifts with meaning. Add a nice card explaining the tradition!",
        textNl: "Brood, zout en wijn zijn klassieke huisinwijdingscadeaus met betekenis. Voeg een mooie kaart toe die de traditie uitlegt!",
        emoji: "🍞",
      },
    ],
    checklist: [
      { textEn: "Find out their home style/color scheme", textNl: "Ontdek hun huisstijl/kleurenschema" },
      { textEn: "Ask what they still need", textNl: "Vraag wat ze nog nodig hebben" },
      { textEn: "Consider their available space", textNl: "Overweeg hun beschikbare ruimte" },
      { textEn: "Include a housewarming card", textNl: "Voeg een huisinwijdingskaart toe" },
      { textEn: "Offer to help with moving/setup", textNl: "Bied aan te helpen met verhuizen/inrichten" },
      { textEn: "Bring gift to housewarming party", textNl: "Breng cadeau naar het huisinwijdingsfeest" },
    ],
    giftCategories: [
      {
        nameEn: "Traditional Gifts",
        nameNl: "Traditionele Cadeaus",
        emoji: "🏛️",
        ideas: [
          { nameEn: "Bread & Salt Gift Set", nameNl: "Brood & Zout Cadeauset", descriptionEn: "Traditional symbols of prosperity", descriptionNl: "Traditionele symbolen van voorspoed", priceRange: "€", emoji: "🍞" },
          { nameEn: "Wine Gift Box", nameNl: "Wijn Cadeaudoos", descriptionEn: "Quality red and white selection", descriptionNl: "Kwaliteit rood en wit selectie", priceRange: "€€", emoji: "🍷" },
          { nameEn: "Candle Set", nameNl: "Kaarsenset", descriptionEn: "Light and warmth for the new home", descriptionNl: "Licht en warmte voor het nieuwe huis", priceRange: "€", emoji: "🕯️" },
          { nameEn: "Indoor Plant", nameNl: "Kamerplant", descriptionEn: "Monstera, Fiddle Leaf, or Olive tree", descriptionNl: "Monstera, Vioolbladplant, of Olijfboom", priceRange: "€€", emoji: "🌿" },
        ],
      },
      {
        nameEn: "Kitchen Essentials",
        nameNl: "Keuken Essentials",
        emoji: "🍳",
        ideas: [
          { nameEn: "Quality Cutting Board", nameNl: "Kwaliteits Snijplank", descriptionEn: "Wooden or bamboo, built to last", descriptionNl: "Hout of bamboe, gemaakt om lang mee te gaan", priceRange: "€€", emoji: "🪵" },
          { nameEn: "Cast Iron Pan", nameNl: "Gietijzeren Pan", descriptionEn: "Le Creuset or Lodge classic", descriptionNl: "Le Creuset of Lodge klassieker", priceRange: "€€", emoji: "🍳" },
          { nameEn: "Herb Garden Kit", nameNl: "Kruidenuin Kit", descriptionEn: "Fresh basil, mint, and rosemary", descriptionNl: "Verse basilicum, munt, en rozemarijn", priceRange: "€", emoji: "🌱" },
          { nameEn: "Kitchen Towel Set", nameNl: "Theedoeken Set", descriptionEn: "Quality linen or cotton", descriptionNl: "Kwaliteits linnen of katoen", priceRange: "€", emoji: "🧻" },
        ],
      },
      {
        nameEn: "Home Comfort",
        nameNl: "Huis Comfort",
        emoji: "🛋️",
        ideas: [
          { nameEn: "Throw Blanket", nameNl: "Plaid Deken", descriptionEn: "Cozy wool or cotton for the couch", descriptionNl: "Gezellige wol of katoen voor de bank", priceRange: "€€", emoji: "🛋️" },
          { nameEn: "Doormat", nameNl: "Deurmat", descriptionEn: "Welcoming and practical", descriptionNl: "Gastvrij en praktisch", priceRange: "€", emoji: "🚪" },
          { nameEn: "Essential Oil Diffuser", nameNl: "Essentiële Olie Diffuser", descriptionEn: "Create a welcoming atmosphere", descriptionNl: "Creëer een gastvrije sfeer", priceRange: "€", emoji: "💨" },
          { nameEn: "Smart Speaker", nameNl: "Slimme Speaker", descriptionEn: "Music and smart home control", descriptionNl: "Muziek en smart home bediening", priceRange: "€€", emoji: "🔊" },
        ],
      },
      {
        nameEn: "Practical Tools",
        nameNl: "Praktische Gereedschappen",
        emoji: "🔧",
        ideas: [
          { nameEn: "Quality Toolkit", nameNl: "Kwaliteits Gereedschapskist", descriptionEn: "Hammer, screwdrivers, measuring tape", descriptionNl: "Hamer, schroevendraaiers, meetlint", priceRange: "€€", emoji: "🧰" },
          { nameEn: "Cordless Drill", nameNl: "Accuboormachine", descriptionEn: "Bosch or DeWalt essential", descriptionNl: "Bosch of DeWalt essential", priceRange: "€€", emoji: "🔧" },
          { nameEn: "First Aid Kit", nameNl: "EHBO Kit", descriptionEn: "Every home needs one", descriptionNl: "Elk huis heeft er een nodig", priceRange: "€", emoji: "🏥" },
          { nameEn: "Fire Extinguisher", nameNl: "Brandblusser", descriptionEn: "Safety first in the new home", descriptionNl: "Veiligheid voorop in het nieuwe huis", priceRange: "€", emoji: "🧯" },
        ],
      },
    ],
    faqs: [
      {
        questionEn: "What are traditional housewarming gifts?",
        questionNl: "Wat zijn traditionele huisinwijdingscadeaus?",
        answerEn:
          "Traditional gifts include bread (so you never go hungry), salt (for flavor in life), and wine (for joy and prosperity). Modern options include kitchen gadgets, plants, and home decor!",
        answerNl:
          "Traditionele cadeaus zijn brood (zodat je nooit honger hebt), zout (voor smaak in het leven) en wijn (voor vreugde en voorspoed). Moderne opties zijn keukengadgets, planten en woondecoratie!",
      },
    ],
  },
};

export const getOccasionContent = (slug: string): OccasionContent | null => {
  // Look up by slug field, not object key (e.g., "baby-shower" vs "baby_shower")
  const occasion = Object.values(occasionContent).find((o) => o.slug === slug);
  return occasion || null;
};

export const getAllOccasions = (): OccasionContent[] => {
  return Object.values(occasionContent);
};

export const getOccasionSlugs = (): string[] => {
  return Object.values(occasionContent).map((o) => o.slug);
};
