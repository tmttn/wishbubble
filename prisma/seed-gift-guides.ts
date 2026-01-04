import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Database connection string not found. Set POSTGRES_URL or DATABASE_URL.");
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

interface GiftGuideData {
  slug: string;
  titleEn: string;
  titleNl: string;
  descriptionEn: string;
  descriptionNl: string;
  contentEn: string;
  contentNl: string;
  keywordsEn: string[];
  keywordsNl: string[];
  category: string;
  searchQuery?: string;
  priceMin?: number;
  priceMax?: number;
  featuredImage?: string;
  sortOrder: number;
  isPublished: boolean;
  publishedAt: Date;
}

const giftGuides: GiftGuideData[] = [
  // ========== BY OCCASION ==========
  {
    slug: "christmas-gift-ideas",
    titleEn: "Christmas Gift Ideas",
    titleNl: "Kerst Cadeau Ideeën",
    descriptionEn:
      "Discover the perfect Christmas gifts for everyone on your list. From thoughtful presents to luxurious surprises, find inspiration for the holiday season.",
    descriptionNl:
      "Ontdek de perfecte kerstcadeaus voor iedereen op je lijst. Van doordachte geschenken tot luxueuze verrassingen, vind inspiratie voor de feestdagen.",
    contentEn: `<h2>Make This Christmas Magical</h2>
<p>Christmas is the season of giving, and finding the perfect gift can make all the difference. Whether you're shopping for family, friends, or colleagues, we've curated a selection of gifts that are sure to delight.</p>

<h3>Gift Ideas for Everyone</h3>
<p>From cozy blankets and festive decorations to the latest tech gadgets and gourmet treats, there's something for everyone on your list.</p>

<ul>
  <li><strong>For the home:</strong> Scented candles, throws, and decorative items</li>
  <li><strong>For tech lovers:</strong> Smart devices, accessories, and gadgets</li>
  <li><strong>For foodies:</strong> Gourmet hampers, kitchen tools, and recipe books</li>
  <li><strong>For wellness:</strong> Spa sets, yoga accessories, and self-care products</li>
</ul>

<h3>Tips for Christmas Shopping</h3>
<p>Start early to avoid the rush, set a budget for each person, and don't forget to wrap your gifts beautifully to add that extra touch of magic.</p>

<blockquote>
  <p>The best gift you can give someone is your time and thoughtfulness. Choose something that shows you care.</p>
</blockquote>`,
    contentNl: `<h2>Maak Deze Kerst Magisch</h2>
<p>Kerst is het seizoen van geven, en het vinden van het perfecte cadeau kan het verschil maken. Of je nu winkelt voor familie, vrienden of collega's, we hebben een selectie van cadeaus samengesteld die zeker zullen verrassen.</p>

<h3>Cadeau Ideeën voor Iedereen</h3>
<p>Van gezellige dekens en feestelijke decoraties tot de nieuwste tech gadgets en gastronomische lekkernijen, er is iets voor iedereen op je lijst.</p>

<ul>
  <li><strong>Voor thuis:</strong> Geurkaarsen, plaids en decoratieve items</li>
  <li><strong>Voor tech liefhebbers:</strong> Slimme apparaten, accessoires en gadgets</li>
  <li><strong>Voor foodies:</strong> Gastronomische pakketten, keukentools en kookboeken</li>
  <li><strong>Voor wellness:</strong> Spa sets, yoga accessoires en zelfzorg producten</li>
</ul>

<h3>Tips voor Kerstinkopen</h3>
<p>Begin vroeg om de drukte te vermijden, stel een budget in voor elke persoon, en vergeet niet je cadeaus mooi in te pakken voor die extra vleugje magie.</p>

<blockquote>
  <p>Het beste cadeau dat je iemand kunt geven is je tijd en aandacht. Kies iets dat laat zien dat je geeft.</p>
</blockquote>`,
    keywordsEn: ["christmas", "gifts", "holiday", "presents", "xmas", "festive", "december"],
    keywordsNl: ["kerst", "cadeaus", "vakantie", "geschenken", "feestelijk", "december"],
    category: "occasion",
    searchQuery: "christmas gift",
    sortOrder: 1,
    isPublished: true,
    publishedAt: new Date(),
  },
  {
    slug: "birthday-gift-guide",
    titleEn: "Birthday Gift Guide",
    titleNl: "Verjaardagscadeau Gids",
    descriptionEn:
      "Find thoughtful birthday gift ideas for all ages. From milestone celebrations to everyday surprises, discover the perfect present.",
    descriptionNl:
      "Vind doordachte verjaardagscadeau ideeën voor alle leeftijden. Van mijlpaal vieringen tot alledaagse verrassingen, ontdek het perfecte geschenk.",
    contentEn: `<h2>Celebrate Their Special Day</h2>
<p>Birthdays are a wonderful opportunity to show someone how much they mean to you. Whether it's a milestone birthday or just another year to celebrate, the right gift can make the day unforgettable.</p>

<h3>Gift Ideas by Interest</h3>
<p>Consider what the birthday person loves most - their hobbies, passions, and dreams.</p>

<ul>
  <li><strong>For book lovers:</strong> Best-selling novels, bookmarks, or e-readers</li>
  <li><strong>For adventurers:</strong> Travel accessories, experience vouchers, or outdoor gear</li>
  <li><strong>For creatives:</strong> Art supplies, craft kits, or photography equipment</li>
  <li><strong>For music fans:</strong> Concert tickets, vinyl records, or headphones</li>
</ul>

<h3>Making It Personal</h3>
<p>Add a personal touch with a handwritten card, custom engraving, or a photo album of shared memories. It's often the thought that counts most.</p>`,
    contentNl: `<h2>Vier Hun Speciale Dag</h2>
<p>Verjaardagen zijn een geweldige kans om iemand te laten zien hoeveel ze voor je betekenen. Of het nu een mijlpaal verjaardag is of gewoon weer een jaar om te vieren, het juiste cadeau kan de dag onvergetelijk maken.</p>

<h3>Cadeau Ideeën per Interesse</h3>
<p>Denk na over wat de jarige het meest leuk vindt - hun hobby's, passies en dromen.</p>

<ul>
  <li><strong>Voor boekenliefhebbers:</strong> Bestsellers, boekenleggers of e-readers</li>
  <li><strong>Voor avonturiers:</strong> Reisaccessoires, belevingsbonnen of outdoor gear</li>
  <li><strong>Voor creatievelingen:</strong> Kunstbenodigdheden, knutselpakketten of foto-apparatuur</li>
  <li><strong>Voor muziekfans:</strong> Concertkaartjes, vinyl platen of koptelefoons</li>
</ul>

<h3>Maak Het Persoonlijk</h3>
<p>Voeg een persoonlijk tintje toe met een handgeschreven kaart, gegraveerde tekst of een fotoalbum met gedeelde herinneringen. Het is vaak het gebaar dat het meest telt.</p>`,
    keywordsEn: ["birthday", "gifts", "presents", "celebration", "party"],
    keywordsNl: ["verjaardag", "cadeaus", "geschenken", "viering", "feest"],
    category: "occasion",
    searchQuery: "birthday",
    sortOrder: 2,
    isPublished: true,
    publishedAt: new Date(),
  },
  {
    slug: "wedding-gift-ideas",
    titleEn: "Wedding Gift Ideas",
    titleNl: "Huwelijkscadeau Ideeën",
    descriptionEn:
      "Discover elegant and meaningful wedding gifts for the happy couple. From traditional presents to modern registry items.",
    descriptionNl:
      "Ontdek elegante en betekenisvolle huwelijkscadeaus voor het gelukkige paar. Van traditionele geschenken tot moderne cadeaulijst items.",
    contentEn: `<h2>Celebrate Love with the Perfect Gift</h2>
<p>A wedding is one of life's most special occasions, and finding the right gift for the newlyweds is a beautiful way to celebrate their love story.</p>

<h3>Classic Wedding Gifts</h3>
<ul>
  <li><strong>For the home:</strong> Quality kitchen appliances, elegant dinnerware, or luxury bedding</li>
  <li><strong>Experiences:</strong> Restaurant vouchers, spa days, or travel credits</li>
  <li><strong>Sentimental:</strong> Personalized photo frames, custom artwork, or memory books</li>
  <li><strong>Practical:</strong> Smart home devices, quality cookware, or premium tools</li>
</ul>

<h3>Gift Etiquette Tips</h3>
<p>Check the couple's registry first, send your gift on time, and include a heartfelt card with your best wishes for their future together.</p>`,
    contentNl: `<h2>Vier Liefde met het Perfecte Cadeau</h2>
<p>Een bruiloft is een van de meest speciale gelegenheden in het leven, en het vinden van het juiste cadeau voor het pasgetrouwde stel is een mooie manier om hun liefdesverhaal te vieren.</p>

<h3>Klassieke Huwelijkscadeaus</h3>
<ul>
  <li><strong>Voor thuis:</strong> Kwaliteits keukenapparatuur, elegant serviesgoed of luxe beddengoed</li>
  <li><strong>Ervaringen:</strong> Restaurant vouchers, spa dagen of reistegoed</li>
  <li><strong>Sentimenteel:</strong> Gepersonaliseerde fotolijsten, custom kunstwerken of herinneringenboeken</li>
  <li><strong>Praktisch:</strong> Smart home apparaten, kwaliteits kookgerei of premium gereedschap</li>
</ul>

<h3>Cadeau Etiquette Tips</h3>
<p>Bekijk eerst de cadeaulijst van het paar, stuur je cadeau op tijd, en voeg een hartelijke kaart toe met je beste wensen voor hun toekomst samen.</p>`,
    keywordsEn: ["wedding", "marriage", "gifts", "newlyweds", "bridal", "registry"],
    keywordsNl: ["bruiloft", "huwelijk", "cadeaus", "pasgetrouwd", "bruids", "cadeaulijst"],
    category: "occasion",
    searchQuery: "wedding",
    sortOrder: 3,
    isPublished: true,
    publishedAt: new Date(),
  },
  {
    slug: "valentines-day-gifts",
    titleEn: "Valentine's Day Gift Ideas",
    titleNl: "Valentijnsdag Cadeau Ideeën",
    descriptionEn:
      "Express your love with romantic Valentine's Day gifts. Find the perfect present to make February 14th unforgettable.",
    descriptionNl:
      "Uit je liefde met romantische Valentijnsdag cadeaus. Vind het perfecte geschenk om 14 februari onvergetelijk te maken.",
    contentEn: `<h2>Show Your Love</h2>
<p>Valentine's Day is the perfect occasion to express your feelings and show that special someone how much they mean to you.</p>

<h3>Romantic Gift Ideas</h3>
<ul>
  <li><strong>Classic romance:</strong> Flowers, chocolates, and heartfelt cards</li>
  <li><strong>Jewelry:</strong> Elegant necklaces, bracelets, or rings</li>
  <li><strong>Experiences:</strong> Romantic dinners, couples spa, or weekend getaways</li>
  <li><strong>Personalized:</strong> Custom photo books, engraved items, or star maps</li>
</ul>

<h3>Beyond the Material</h3>
<p>Remember, the best Valentine's gift is your time and attention. Plan something special that creates lasting memories together.</p>`,
    contentNl: `<h2>Toon Je Liefde</h2>
<p>Valentijnsdag is de perfecte gelegenheid om je gevoelens te uiten en die speciale persoon te laten zien hoeveel ze voor je betekenen.</p>

<h3>Romantische Cadeau Ideeën</h3>
<ul>
  <li><strong>Klassiek romantisch:</strong> Bloemen, chocolade en hartelijke kaarten</li>
  <li><strong>Sieraden:</strong> Elegante kettingen, armbanden of ringen</li>
  <li><strong>Ervaringen:</strong> Romantische diners, koppels spa of weekendjes weg</li>
  <li><strong>Gepersonaliseerd:</strong> Custom fotoboeken, gegraveerde items of sterrenkaarten</li>
</ul>

<h3>Meer dan Materieel</h3>
<p>Onthoud, het beste Valentijnscadeau is je tijd en aandacht. Plan iets speciaals dat samen blijvende herinneringen creëert.</p>`,
    keywordsEn: ["valentine", "love", "romantic", "gifts", "february", "couple"],
    keywordsNl: ["valentijn", "liefde", "romantisch", "cadeaus", "februari", "koppel"],
    category: "occasion",
    searchQuery: "valentine romantic love",
    sortOrder: 4,
    isPublished: true,
    publishedAt: new Date(),
  },

  // ========== BY BUDGET ==========
  {
    slug: "gifts-under-25",
    titleEn: "Gifts Under €25",
    titleNl: "Cadeaus Onder €25",
    descriptionEn:
      "Thoughtful gifts that won't break the bank. Discover affordable presents that show you care without overspending.",
    descriptionNl:
      "Doordachte cadeaus die de bank niet breken. Ontdek betaalbare geschenken die laten zien dat je geeft zonder te veel uit te geven.",
    contentEn: `<h2>Great Gifts on a Budget</h2>
<p>Finding a meaningful gift doesn't have to be expensive. These affordable options are perfect for any occasion while being kind to your wallet.</p>

<h3>Budget-Friendly Ideas</h3>
<ul>
  <li><strong>Books:</strong> Bestsellers, journals, or beautiful coffee table books</li>
  <li><strong>Self-care:</strong> Bath bombs, face masks, or scented candles</li>
  <li><strong>Kitchen:</strong> Quality cooking tools, fun mugs, or recipe books</li>
  <li><strong>Entertainment:</strong> Card games, puzzles, or streaming subscriptions</li>
</ul>

<h3>Make It Special</h3>
<p>A thoughtfully wrapped small gift with a heartfelt card often means more than an expensive item chosen without care.</p>`,
    contentNl: `<h2>Geweldige Cadeaus voor een Budget</h2>
<p>Het vinden van een betekenisvol cadeau hoeft niet duur te zijn. Deze betaalbare opties zijn perfect voor elke gelegenheid en vriendelijk voor je portemonnee.</p>

<h3>Budgetvriendelijke Ideeën</h3>
<ul>
  <li><strong>Boeken:</strong> Bestsellers, dagboeken of mooie koffietafelboeken</li>
  <li><strong>Zelfzorg:</strong> Badbommen, gezichtsmaskers of geurkaarsen</li>
  <li><strong>Keuken:</strong> Kwaliteits kookgerei, leuke mokken of kookboeken</li>
  <li><strong>Entertainment:</strong> Kaartspellen, puzzels of streaming abonnementen</li>
</ul>

<h3>Maak Het Speciaal</h3>
<p>Een doordacht ingepakt klein cadeau met een hartelijke kaart betekent vaak meer dan een duur item dat zonder zorg is gekozen.</p>`,
    keywordsEn: ["budget", "affordable", "cheap", "under 25", "inexpensive"],
    keywordsNl: ["budget", "betaalbaar", "goedkoop", "onder 25", "voordelig"],
    category: "budget",
    priceMax: 25,
    sortOrder: 10,
    isPublished: true,
    publishedAt: new Date(),
  },
  {
    slug: "gifts-under-50",
    titleEn: "Gifts Under €50",
    titleNl: "Cadeaus Onder €50",
    descriptionEn:
      "Quality gifts at a mid-range price point. Find presents that balance value and meaningfulness perfectly.",
    descriptionNl:
      "Kwaliteitscadeaus voor een gemiddelde prijs. Vind geschenken die waarde en betekenis perfect balanceren.",
    contentEn: `<h2>Mid-Range Magic</h2>
<p>With a budget of €50, you can find some truly wonderful gifts that feel special without being extravagant.</p>

<h3>Popular Choices</h3>
<ul>
  <li><strong>Tech accessories:</strong> Wireless chargers, quality earbuds, or smart plugs</li>
  <li><strong>Home items:</strong> Designer candles, quality throws, or decorative pieces</li>
  <li><strong>Fashion:</strong> Wallets, scarves, or quality accessories</li>
  <li><strong>Experiences:</strong> Class vouchers, spa treatments, or dining credits</li>
</ul>

<h3>Getting More Value</h3>
<p>Look for sales, compare prices, and consider gift sets that offer multiple items at a better combined value.</p>`,
    contentNl: `<h2>Middenklasse Magie</h2>
<p>Met een budget van €50 kun je echt geweldige cadeaus vinden die speciaal aanvoelen zonder extravagant te zijn.</p>

<h3>Populaire Keuzes</h3>
<ul>
  <li><strong>Tech accessoires:</strong> Draadloze opladers, kwaliteits oordopjes of slimme stekkers</li>
  <li><strong>Huisartikelen:</strong> Designer kaarsen, kwaliteits plaids of decoratieve stukken</li>
  <li><strong>Mode:</strong> Portemonnees, sjaals of kwaliteits accessoires</li>
  <li><strong>Ervaringen:</strong> Cursusvouchers, spa behandelingen of dinertegoeden</li>
</ul>

<h3>Meer Waarde Krijgen</h3>
<p>Zoek naar uitverkoop, vergelijk prijzen en overweeg cadeausets die meerdere items bieden voor een betere gecombineerde waarde.</p>`,
    keywordsEn: ["mid-range", "50 euro", "quality", "moderate"],
    keywordsNl: ["middenbereik", "50 euro", "kwaliteit", "gematigd"],
    category: "budget",
    priceMin: 25,
    priceMax: 50,
    sortOrder: 11,
    isPublished: true,
    publishedAt: new Date(),
  },
  {
    slug: "luxury-gifts",
    titleEn: "Luxury Gift Ideas",
    titleNl: "Luxe Cadeau Ideeën",
    descriptionEn:
      "Premium gifts for special occasions. When you want to give something truly extraordinary and memorable.",
    descriptionNl:
      "Premium cadeaus voor speciale gelegenheden. Wanneer je iets echt buitengewoons en memorabels wilt geven.",
    contentEn: `<h2>Treat Them to Something Special</h2>
<p>Sometimes only the best will do. These luxury gift ideas are perfect for milestone occasions, special people, or when you simply want to make a grand gesture.</p>

<h3>Premium Gift Categories</h3>
<ul>
  <li><strong>Technology:</strong> Latest smartphones, premium headphones, or smart watches</li>
  <li><strong>Fashion:</strong> Designer bags, luxury watches, or fine jewelry</li>
  <li><strong>Experiences:</strong> Luxury travel packages, fine dining experiences, or VIP events</li>
  <li><strong>Home:</strong> High-end appliances, designer furniture, or premium electronics</li>
</ul>

<h3>Making Luxury Meaningful</h3>
<p>The most impactful luxury gifts are those that align with the recipient's dreams and desires. Take time to understand what would truly make them happy.</p>`,
    contentNl: `<h2>Trakteer Ze op Iets Speciaals</h2>
<p>Soms is alleen het beste goed genoeg. Deze luxe cadeau-ideeën zijn perfect voor mijlpaal gelegenheden, speciale mensen of wanneer je gewoon een groots gebaar wilt maken.</p>

<h3>Premium Cadeau Categorieën</h3>
<ul>
  <li><strong>Technologie:</strong> Nieuwste smartphones, premium koptelefoons of slimme horloges</li>
  <li><strong>Mode:</strong> Designer tassen, luxe horloges of fijne sieraden</li>
  <li><strong>Ervaringen:</strong> Luxe reispakketten, fine dining ervaringen of VIP evenementen</li>
  <li><strong>Thuis:</strong> High-end apparaten, designer meubels of premium elektronica</li>
</ul>

<h3>Luxe Betekenisvol Maken</h3>
<p>De meest impactvolle luxe cadeaus zijn die aansluiten bij de dromen en wensen van de ontvanger. Neem de tijd om te begrijpen wat hen echt gelukkig zou maken.</p>`,
    keywordsEn: ["luxury", "premium", "high-end", "special", "expensive", "designer"],
    keywordsNl: ["luxe", "premium", "high-end", "speciaal", "duur", "designer"],
    category: "budget",
    priceMin: 100,
    sortOrder: 12,
    isPublished: true,
    publishedAt: new Date(),
  },

  // ========== BY RECIPIENT ==========
  {
    slug: "gifts-for-him",
    titleEn: "Gifts for Him",
    titleNl: "Cadeaus voor Hem",
    descriptionEn:
      "Thoughtful gift ideas for the men in your life. From practical presents to fun surprises for boyfriends, husbands, fathers, and friends.",
    descriptionNl:
      "Doordachte cadeau-ideeën voor de mannen in je leven. Van praktische geschenken tot leuke verrassingen voor vrienden, echtgenoten, vaders en vrienden.",
    contentEn: `<h2>For the Special Men in Your Life</h2>
<p>Finding the right gift for him can be challenging, but with these ideas, you're sure to find something he'll love.</p>

<h3>Gift Ideas by Interest</h3>
<ul>
  <li><strong>Tech enthusiast:</strong> Gadgets, smart home devices, or gaming accessories</li>
  <li><strong>Outdoorsman:</strong> Camping gear, sports equipment, or adventure experiences</li>
  <li><strong>Style-conscious:</strong> Quality watches, leather goods, or grooming sets</li>
  <li><strong>Hobbyist:</strong> Tools, craft supplies, or specialty equipment</li>
</ul>

<h3>Personal Touch</h3>
<p>Consider personalizing with initials, choosing his favorite brand, or selecting something related to a shared memory or inside joke.</p>`,
    contentNl: `<h2>Voor de Speciale Mannen in Je Leven</h2>
<p>Het juiste cadeau voor hem vinden kan uitdagend zijn, maar met deze ideeën vind je zeker iets dat hij geweldig zal vinden.</p>

<h3>Cadeau Ideeën per Interesse</h3>
<ul>
  <li><strong>Tech liefhebber:</strong> Gadgets, smart home apparaten of gaming accessoires</li>
  <li><strong>Buitenmens:</strong> Kampeeruitrusting, sportartikelen of avontuurlijke ervaringen</li>
  <li><strong>Stijlbewust:</strong> Kwaliteitshorloges, lederen artikelen of verzorgingssets</li>
  <li><strong>Hobbyist:</strong> Gereedschap, knutselbenodigdheden of specialistische uitrusting</li>
</ul>

<h3>Persoonlijk Tintje</h3>
<p>Overweeg personalisatie met initialen, kies zijn favoriete merk of selecteer iets gerelateerd aan een gedeelde herinnering of inside joke.</p>`,
    keywordsEn: ["men", "him", "boyfriend", "husband", "father", "dad", "brother", "male"],
    keywordsNl: ["mannen", "hem", "vriend", "echtgenoot", "vader", "papa", "broer", "man"],
    category: "recipient",
    searchQuery: "men",
    sortOrder: 20,
    isPublished: true,
    publishedAt: new Date(),
  },
  {
    slug: "gifts-for-her",
    titleEn: "Gifts for Her",
    titleNl: "Cadeaus voor Haar",
    descriptionEn:
      "Beautiful gift ideas for the women in your life. From elegant presents to thoughtful surprises for girlfriends, wives, mothers, and friends.",
    descriptionNl:
      "Mooie cadeau-ideeën voor de vrouwen in je leven. Van elegante geschenken tot doordachte verrassingen voor vriendinnen, echtgenotes, moeders en vriendinnen.",
    contentEn: `<h2>For the Special Women in Your Life</h2>
<p>Show the women in your life how much they mean to you with these thoughtfully chosen gift ideas.</p>

<h3>Gift Ideas by Interest</h3>
<ul>
  <li><strong>Beauty lover:</strong> Skincare sets, makeup palettes, or perfumes</li>
  <li><strong>Fashion forward:</strong> Jewelry, handbags, or designer accessories</li>
  <li><strong>Wellness focused:</strong> Spa experiences, yoga equipment, or aromatherapy</li>
  <li><strong>Creative soul:</strong> Art supplies, craft kits, or DIY experiences</li>
</ul>

<h3>Making It Memorable</h3>
<p>Add flowers, a handwritten note, or plan a special way to present your gift for an extra touch of thoughtfulness.</p>`,
    contentNl: `<h2>Voor de Speciale Vrouwen in Je Leven</h2>
<p>Laat de vrouwen in je leven zien hoeveel ze voor je betekenen met deze doordacht gekozen cadeau-ideeën.</p>

<h3>Cadeau Ideeën per Interesse</h3>
<ul>
  <li><strong>Beauty liefhebber:</strong> Skincare sets, make-up paletten of parfums</li>
  <li><strong>Mode bewust:</strong> Sieraden, handtassen of designer accessoires</li>
  <li><strong>Wellness gericht:</strong> Spa ervaringen, yoga uitrusting of aromatherapie</li>
  <li><strong>Creatieve ziel:</strong> Kunstbenodigdheden, knutselpakketten of DIY ervaringen</li>
</ul>

<h3>Maak Het Memorabel</h3>
<p>Voeg bloemen toe, een handgeschreven briefje of plan een speciale manier om je cadeau te presenteren voor een extra vleugje attentie.</p>`,
    keywordsEn: ["women", "her", "girlfriend", "wife", "mother", "mom", "sister", "female"],
    keywordsNl: ["vrouwen", "haar", "vriendin", "echtgenote", "moeder", "mama", "zus", "vrouw"],
    category: "recipient",
    searchQuery: "women",
    sortOrder: 21,
    isPublished: true,
    publishedAt: new Date(),
  },
  {
    slug: "gifts-for-kids",
    titleEn: "Gifts for Kids",
    titleNl: "Cadeaus voor Kinderen",
    descriptionEn:
      "Fun and educational gift ideas for children of all ages. From toys and games to creative kits and learning tools.",
    descriptionNl:
      "Leuke en educatieve cadeau-ideeën voor kinderen van alle leeftijden. Van speelgoed en spelletjes tot creatieve pakketten en leermiddelen.",
    contentEn: `<h2>Bring Joy to Little Ones</h2>
<p>Finding the perfect gift for children combines fun with age-appropriate learning and development opportunities.</p>

<h3>Gift Ideas by Age Group</h3>
<ul>
  <li><strong>Toddlers (1-3):</strong> Building blocks, musical toys, or soft plushies</li>
  <li><strong>Preschoolers (4-5):</strong> Art supplies, dress-up costumes, or educational games</li>
  <li><strong>School age (6-10):</strong> LEGO sets, science kits, or board games</li>
  <li><strong>Tweens (11-12):</strong> Tech gadgets, creative hobbies, or sports equipment</li>
</ul>

<h3>Gift-Giving Tips</h3>
<p>Consider the child's interests, check age recommendations, and opt for gifts that encourage creativity and learning alongside fun.</p>`,
    contentNl: `<h2>Breng Vreugde aan de Kleintjes</h2>
<p>Het perfecte cadeau voor kinderen vinden combineert plezier met leeftijdsgeschikte leer- en ontwikkelingsmogelijkheden.</p>

<h3>Cadeau Ideeën per Leeftijdsgroep</h3>
<ul>
  <li><strong>Peuters (1-3):</strong> Bouwblokken, muzikaal speelgoed of zachte knuffels</li>
  <li><strong>Kleuters (4-5):</strong> Kunstbenodigdheden, verkleedkleding of educatieve spelletjes</li>
  <li><strong>Schoolgaand (6-10):</strong> LEGO sets, wetenschapskits of bordspellen</li>
  <li><strong>Tieners (11-12):</strong> Tech gadgets, creatieve hobby's of sportuitrusting</li>
</ul>

<h3>Cadeau Tips</h3>
<p>Houd rekening met de interesses van het kind, controleer leeftijdsaanbevelingen en kies cadeaus die creativiteit en leren aanmoedigen naast plezier.</p>`,
    keywordsEn: ["kids", "children", "toys", "games", "educational", "boys", "girls"],
    keywordsNl: ["kinderen", "speelgoed", "spelletjes", "educatief", "jongens", "meisjes"],
    category: "recipient",
    searchQuery: "kids toys",
    sortOrder: 22,
    isPublished: true,
    publishedAt: new Date(),
  },
  {
    slug: "gifts-for-parents",
    titleEn: "Gifts for Parents",
    titleNl: "Cadeaus voor Ouders",
    descriptionEn:
      "Show appreciation for mom and dad with meaningful gifts. Perfect for birthdays, holidays, or just to say thank you.",
    descriptionNl:
      "Toon waardering voor mama en papa met betekenisvolle cadeaus. Perfect voor verjaardagen, feestdagen of gewoon om dankje te zeggen.",
    contentEn: `<h2>Thank You, Mom and Dad</h2>
<p>Parents give so much, and finding a gift that shows your appreciation can be incredibly meaningful for both of you.</p>

<h3>Gift Ideas for Parents</h3>
<ul>
  <li><strong>Experiences together:</strong> Restaurant vouchers, theater tickets, or day trips</li>
  <li><strong>Home comforts:</strong> Quality kitchen items, cozy blankets, or garden tools</li>
  <li><strong>Memory keepers:</strong> Photo books, custom artwork, or family tree prints</li>
  <li><strong>Relaxation:</strong> Spa vouchers, comfortable loungewear, or massage devices</li>
</ul>

<h3>The Best Gift</h3>
<p>Often, what parents appreciate most is your time. Consider planning a special visit or activity to share together.</p>`,
    contentNl: `<h2>Bedankt, Mama en Papa</h2>
<p>Ouders geven zoveel, en een cadeau vinden dat je waardering toont kan ongelooflijk betekenisvol zijn voor jullie beiden.</p>

<h3>Cadeau Ideeën voor Ouders</h3>
<ul>
  <li><strong>Ervaringen samen:</strong> Restaurant vouchers, theaterkaartjes of dagtrips</li>
  <li><strong>Thuis comfort:</strong> Kwaliteits keukenartikelen, gezellige dekens of tuingereedschap</li>
  <li><strong>Herinnering bewaarders:</strong> Fotoboeken, custom kunstwerken of stamboom prints</li>
  <li><strong>Ontspanning:</strong> Spa vouchers, comfortabele loungewear of massage apparaten</li>
</ul>

<h3>Het Beste Cadeau</h3>
<p>Vaak waarderen ouders je tijd het meest. Overweeg een speciaal bezoek of activiteit te plannen om samen te delen.</p>`,
    keywordsEn: ["parents", "mom", "dad", "mother", "father", "family"],
    keywordsNl: ["ouders", "mama", "papa", "moeder", "vader", "familie"],
    category: "recipient",
    searchQuery: "parents family",
    sortOrder: 23,
    isPublished: true,
    publishedAt: new Date(),
  },
];

async function main() {
  console.log("Seeding gift guides...\n");

  let created = 0;
  let updated = 0;

  for (const guide of giftGuides) {
    const result = await prisma.giftGuide.upsert({
      where: { slug: guide.slug },
      update: {
        titleEn: guide.titleEn,
        titleNl: guide.titleNl,
        descriptionEn: guide.descriptionEn,
        descriptionNl: guide.descriptionNl,
        contentEn: guide.contentEn,
        contentNl: guide.contentNl,
        keywordsEn: guide.keywordsEn,
        keywordsNl: guide.keywordsNl,
        category: guide.category,
        priceMin: guide.priceMin ?? null,
        priceMax: guide.priceMax ?? null,
        searchQuery: guide.searchQuery ?? null,
        featuredImage: guide.featuredImage ?? null,
        sortOrder: guide.sortOrder,
        isPublished: guide.isPublished,
        publishedAt: guide.publishedAt,
      },
      create: {
        slug: guide.slug,
        titleEn: guide.titleEn,
        titleNl: guide.titleNl,
        descriptionEn: guide.descriptionEn,
        descriptionNl: guide.descriptionNl,
        contentEn: guide.contentEn,
        contentNl: guide.contentNl,
        keywordsEn: guide.keywordsEn,
        keywordsNl: guide.keywordsNl,
        category: guide.category,
        priceMin: guide.priceMin ?? null,
        priceMax: guide.priceMax ?? null,
        searchQuery: guide.searchQuery ?? null,
        featuredImage: guide.featuredImage ?? null,
        sortOrder: guide.sortOrder,
        isPublished: guide.isPublished,
        publishedAt: guide.publishedAt,
      },
    });

    // Check if it was created or updated by checking createdAt vs updatedAt
    const isNew =
      result.createdAt.getTime() === result.updatedAt.getTime() ||
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;

    if (isNew) {
      created++;
      console.log(`  ✓ Created: ${guide.slug}`);
    } else {
      updated++;
      console.log(`  ↻ Updated: ${guide.slug}`);
    }
  }

  console.log(`\nDone! Created ${created}, Updated ${updated} gift guides.`);
}

main()
  .catch((e) => {
    console.error("Error seeding gift guides:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
