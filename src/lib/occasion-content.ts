export interface OccasionContent {
  slug: string;
  titleEn: string;
  titleNl: string;
  descriptionEn: string;
  descriptionNl: string;
  heroImageUrl?: string;
  searchQueries: string[];
  color: string;
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
    titleNl: "Kerst Cadeau Ideeen",
    descriptionEn:
      "Find the perfect Christmas gifts for everyone on your list. Create a wishlist group with family and friends to coordinate gift-giving and avoid duplicate presents.",
    descriptionNl:
      "Vind de perfecte kerstcadeaus voor iedereen op je lijst. Maak een verlanglijst-groep met familie en vrienden om cadeaus te coordineren en dubbele cadeaus te voorkomen.",
    searchQueries: ["christmas", "kerst", "holiday", "gift"],
    color: "#DC2626",
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
        questionNl: "Hoe kan ik cadeaus coordineren met mijn familie?",
        answerEn:
          "Create a WishBubble group and invite your family members. Everyone can add their wishlists, and you can secretly claim gifts to avoid duplicates. Use Secret Santa mode for gift exchanges!",
        answerNl:
          "Maak een WishBubble-groep en nodig je familieleden uit. Iedereen kan hun verlanglijstjes toevoegen en je kunt in het geheim cadeaus claimen om dubbele te voorkomen. Gebruik de Secret Santa-modus voor cadeau-uitwisselingen!",
      },
      {
        questionEn: "What are popular Christmas gift categories?",
        questionNl: "Wat zijn populaire kerst-cadeaucategorieen?",
        answerEn:
          "Popular categories include electronics, toys, clothing, home decor, books, and experiences. WishBubble helps you discover what your loved ones actually want!",
        answerNl:
          "Populaire categorieen zijn elektronica, speelgoed, kleding, woondecoratie, boeken en ervaringen. WishBubble helpt je ontdekken wat je dierbaren echt willen!",
      },
    ],
  },
  birthday: {
    slug: "birthday",
    titleEn: "Birthday Gift Ideas",
    titleNl: "Verjaardag Cadeau Ideeen",
    descriptionEn:
      "Discover perfect birthday gifts for all ages. Create a birthday wishlist to share with friends and family, making gift-giving easy and ensuring you get exactly what you want.",
    descriptionNl:
      "Ontdek perfecte verjaardagscadeaus voor alle leeftijden. Maak een verjaardag-verlanglijst om te delen met vrienden en familie, zodat cadeau geven makkelijk wordt en je precies krijgt wat je wilt.",
    searchQueries: ["birthday", "verjaardag", "gift", "cadeau"],
    color: "#7C3AED",
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
        questionNl: "Wat zijn goede verjaardagscadeau-ideeen per leeftijd?",
        answerEn:
          "Gift ideas vary by age - toys and games for kids, tech and fashion for teens, experiences and home items for adults. The best approach is to ask! That's why wishlists are so helpful.",
        answerNl:
          "Cadeau-ideeen varieren per leeftijd - speelgoed en spelletjes voor kinderen, tech en mode voor tieners, ervaringen en huisartikelen voor volwassenen. De beste aanpak is om te vragen! Daarom zijn verlanglijstjes zo handig.",
      },
    ],
  },
  sinterklaas: {
    slug: "sinterklaas",
    titleEn: "Sinterklaas Gift Ideas",
    titleNl: "Sinterklaas Cadeau Ideeen",
    descriptionEn:
      "Celebrate Sinterklaas with the perfect gifts! Create wishlists for pakjesavond and coordinate with family to make this Dutch tradition extra special.",
    descriptionNl:
      "Vier Sinterklaas met de perfecte cadeaus! Maak verlanglijstjes voor pakjesavond en coordineer met familie om deze Nederlandse traditie extra speciaal te maken.",
    searchQueries: ["sinterklaas", "pakjesavond", "sint", "cadeau"],
    color: "#EA580C",
    faqs: [
      {
        questionEn: "When is Sinterklaas celebrated?",
        questionNl: "Wanneer wordt Sinterklaas gevierd?",
        answerEn:
          "Sinterklaas is celebrated on December 5th (pakjesavond) in the Netherlands, and December 6th in Belgium. Start planning your gifts early!",
        answerNl:
          "Sinterklaas wordt gevierd op 5 december (pakjesavond) in Nederland en 6 december in Belgie. Begin vroeg met het plannen van je cadeaus!",
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
    titleNl: "Bruiloft Cadeau Ideeen",
    descriptionEn:
      "Find thoughtful wedding gifts or create a wedding registry. Help the happy couple start their new life together with gifts they'll truly appreciate.",
    descriptionNl:
      "Vind doordachte bruiloftscadeaus of maak een huwelijkslijst. Help het gelukkige paar hun nieuwe leven samen te beginnen met cadeaus die ze echt waarderen.",
    searchQueries: ["wedding", "bruiloft", "huwelijk", "registry"],
    color: "#DB2777",
    faqs: [
      {
        questionEn: "How much should I spend on a wedding gift?",
        questionNl: "Hoeveel moet ik uitgeven aan een bruiloftscadeau?",
        answerEn:
          "Wedding gift budgets typically range from 50-150 euros depending on your relationship with the couple. Group gifts are a great option for bigger items!",
        answerNl:
          "Bruiloftscadeau-budgetten varieren meestal van 50-150 euro, afhankelijk van je relatie met het paar. Groepscadeaus zijn een geweldige optie voor grotere items!",
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
    titleNl: "Babyshower Cadeau Ideeen",
    descriptionEn:
      "Welcome the new arrival with perfect baby shower gifts. Create a baby registry to help parents-to-be get everything they need for their little one.",
    descriptionNl:
      "Verwelkom de nieuwe baby met perfecte babyshower cadeaus. Maak een babyregister om aanstaande ouders te helpen alles te krijgen wat ze nodig hebben voor hun kleintje.",
    searchQueries: ["baby", "shower", "newborn", "registry"],
    color: "#0EA5E9",
    faqs: [
      {
        questionEn: "What are essential baby shower gifts?",
        questionNl: "Wat zijn essentiele babyshower cadeaus?",
        answerEn:
          "Essential items include diapers, clothes, feeding supplies, a stroller, and nursery items. Check the parents' wishlist to see exactly what they need!",
        answerNl:
          "Essentiele items zijn luiers, kleding, voedingsbenodigdheden, een kinderwagen en babykamer-items. Bekijk de verlanglijst van de ouders om precies te zien wat ze nodig hebben!",
      },
    ],
  },
  graduation: {
    slug: "graduation",
    titleEn: "Graduation Gift Ideas",
    titleNl: "Afstuderen Cadeau Ideeen",
    descriptionEn:
      "Celebrate academic achievements with meaningful graduation gifts. Whether finishing high school or university, find gifts that mark this important milestone.",
    descriptionNl:
      "Vier academische prestaties met betekenisvolle afstudeercadeaus. Of het nu gaat om het afronden van de middelbare school of universiteit, vind cadeaus die deze belangrijke mijlpaal markeren.",
    searchQueries: ["graduation", "afstuderen", "diploma", "student"],
    color: "#059669",
    faqs: [
      {
        questionEn: "What are good graduation gift ideas?",
        questionNl: "Wat zijn goede afstudeercadeau-ideeen?",
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
    titleNl: "Nieuwe Woning Cadeau Ideeen",
    descriptionEn:
      "Help friends and family settle into their new home with thoughtful housewarming gifts. From practical kitchen items to decorative pieces, find the perfect present.",
    descriptionNl:
      "Help vrienden en familie zich thuis te voelen in hun nieuwe woning met doordachte huisinwijdingscadeaus. Van praktische keukenitems tot decoratieve stukken, vind het perfecte cadeau.",
    searchQueries: ["housewarming", "home", "kitchen", "decor"],
    color: "#D97706",
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
  return occasionContent[slug] || null;
};

export const getAllOccasions = (): OccasionContent[] => {
  return Object.values(occasionContent);
};

export const getOccasionSlugs = (): string[] => {
  return Object.keys(occasionContent);
};
