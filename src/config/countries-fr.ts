/**
 * French versions of the francophone country pages (/fr/afrique/<slug>).
 * Written in French (not machine-translated word for word); same factual
 * rules as countries.ts: Expervia is based in Lagos, with no offices,
 * partners or clients claimed in these countries. Have a native speaker
 * review before major campaigns.
 */
import type { Country } from "@/config/countries";
import { getCountry } from "@/config/countries";

const LIVRAISON = (inName: string, villes: string) =>
  `Nous accompagnons les organisations ${inName} depuis notre siège de Lagos, au Nigeria. L'essentiel du travail se fait à distance, à vos heures de bureau, et nos consultants se déplacent à ${villes} pour les ateliers, les mises en production et tout ce qui doit se faire sur place.`;

/** French content, keyed by the English slug of the country. */
type FrCountry = Omit<Country, "slug" | "frSlug" | "region" | "iso"> & {
  /** Region label shown in the hero eyebrow. */
  regionFr: string;
};

const FR: Record<string, FrCountry> = {
  "cote-divoire": {
    name: "Côte d'Ivoire",
    inName: "en Côte d'Ivoire",
    regionFr: "Afrique de l'Ouest",
    hubs: ["Abidjan", "Yamoussoukro"],
    currency: "Franc CFA (XOF)",
    timeZone: "Temps universel (UTC+0)",
    title: "IA, cloud et cybersécurité en Côte d'Ivoire",
    description:
      "Expervia aide les organisations d'Abidjan et de toute la Côte d'Ivoire à adopter le cloud, l'IA et la cybersécurité sur Microsoft et Huawei, depuis Lagos.",
    headline:
      "IA, cloud et cybersécurité pour les organisations en Côte d'Ivoire",
    intro:
      "La Côte d'Ivoire compte parmi les économies les plus dynamiques d'Afrique de l'Ouest, et Abidjan est une place financière majeure de l'Afrique francophone. Expervia aide les organisations ivoiriennes à se moderniser avec un cloud sécurisé, des données mieux exploitées et une IA utile.",
    context: [
      {
        title: "Le carrefour de l'Afrique de l'Ouest francophone",
        body: "Abidjan accueille les sièges régionaux de banques, d'opérateurs télécoms et de groupes internationaux présents dans toute la zone UEMOA.",
      },
      {
        title: "Une adoption numérique rapide",
        body: "Le mobile money et la banque digitale progressent vite, et les clients attendent des services sûrs et disponibles en permanence.",
      },
      {
        title: "Des données protégées depuis 2013",
        body: "La loi ivoirienne encadre les données personnelles depuis 2013, sous le contrôle de l'ARTCI.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Migration vers le cloud pour les banques, les opérateurs et les entreprises qui servent la zone UEMOA.",
      },
      {
        key: "cybersecurity",
        why: "Sécurité et protection des données alignées sur la loi ivoirienne et les attentes de la BCEAO.",
      },
      {
        key: "data",
        why: "Analytique et reporting pour piloter des activités régionales.",
      },
    ],
    industries: [
      "Banque et microfinance",
      "Télécommunications",
      "Agro-industrie (cacao, café)",
      "Énergie",
      "Secteur public",
    ],
    compliance:
      "Nous concevons nos solutions en tenant compte de la loi n° 2013-450 relative à la protection des données à caractère personnel, des déclarations et autorisations auprès de l'ARTCI, et des exigences de la BCEAO pour les établissements financiers.",
    delivery: LIVRAISON("en Côte d'Ivoire", "Abidjan"),
    faqs: [
      {
        question: "Travaillez-vous en français ?",
        answer:
          "Oui. Nous accompagnons les équipes francophones, et cette page existe aussi en anglais.",
      },
      {
        question: "Comment se déroulent vos projets à Abidjan ?",
        answer:
          "Nous travaillons à distance depuis Lagos (une heure de décalage) et nous nous déplaçons à Abidjan pour les ateliers, les mises en production et les interventions sur site.",
      },
      {
        question: "Quelles réglementations prenez-vous en compte ?",
        answer:
          "La loi n° 2013-450 sur la protection des données personnelles et les règles de la BCEAO pour les établissements financiers, en lien avec votre équipe conformité.",
      },
    ],
  },
  senegal: {
    name: "Sénégal",
    inName: "au Sénégal",
    regionFr: "Afrique de l'Ouest",
    hubs: ["Dakar", "Diamniadio"],
    currency: "Franc CFA (XOF)",
    timeZone: "Temps universel (UTC+0)",
    title: "IA, cloud et cybersécurité au Sénégal",
    description:
      "Expervia accompagne les organisations de Dakar et de tout le Sénégal avec un cloud sécurisé, Microsoft 365, l'IA et la donnée, depuis Lagos.",
    headline: "IA, cloud et cybersécurité pour les organisations au Sénégal",
    intro:
      "Le Sénégal a fait de Dakar un pôle numérique pour l'Afrique de l'Ouest, avec une bonne connectivité et un écosystème de start-up en pleine croissance. Expervia aide les organisations sénégalaises à bâtir des fondations cloud solides et une IA concrète.",
    context: [
      {
        title: "Un pôle numérique régional",
        body: "Les investissements dans la connectivité, les centres de données et la zone de Diamniadio renforcent le rôle numérique de Dakar.",
      },
      {
        title: "Un écosystème de start-up actif",
        body: "Les fintechs et les services numériques se développent aux côtés des banques et des opérateurs établis.",
      },
      {
        title: "Une protection des données ancienne",
        body: "Le Sénégal encadre les données personnelles depuis 2008, avec la CDP comme autorité de contrôle.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Cloud et infrastructure hybride pour les entreprises et les institutions publiques.",
      },
      {
        key: "microsoft",
        why: "Microsoft 365 et collaboration sécurisée pour des équipes francophones et anglophones.",
      },
      {
        key: "cybersecurity",
        why: "Mesures de sécurité alignées sur les attentes de la CDP et de la BCEAO.",
      },
    ],
    industries: [
      "Banque et fintech",
      "Télécommunications",
      "Secteur public",
      "Pêche et agriculture",
      "Énergie",
    ],
    compliance:
      "Nous concevons nos solutions en tenant compte de la loi n° 2008-12 sur la protection des données à caractère personnel, des déclarations auprès de la Commission de Protection des Données Personnelles (CDP) et des règles de la BCEAO pour les établissements financiers.",
    delivery: LIVRAISON("au Sénégal", "Dakar"),
    faqs: [
      {
        question: "Pouvez-vous accompagner des équipes francophones à Dakar ?",
        answer:
          "Oui. Nous travaillons avec des équipes francophones, et cette page existe aussi en anglais.",
      },
      {
        question: "Comment intervenez-vous au Sénégal ?",
        answer:
          "Nous travaillons à distance depuis Lagos et nous nous déplaçons à Dakar pour les ateliers, les mises en production et le support sur place.",
      },
      {
        question: "Tenez-vous compte de la loi sénégalaise sur les données ?",
        answer:
          "Oui. Nous intégrons la loi n° 2008-12 et les exigences de la CDP, et nous vous aidons à préparer les déclarations.",
      },
    ],
  },
  cameroon: {
    name: "Cameroun",
    inName: "au Cameroun",
    regionFr: "Afrique centrale",
    hubs: ["Douala", "Yaoundé"],
    currency: "Franc CFA (XAF)",
    timeZone: "Heure d'Afrique de l'Ouest (UTC+1)",
    title: "IA, cloud et cybersécurité au Cameroun",
    description:
      "Expervia aide les organisations de Douala, Yaoundé et de tout le Cameroun à adopter le cloud, l'IA et la donnée, en français ou en anglais, depuis Lagos.",
    headline: "IA, cloud et cybersécurité pour les organisations au Cameroun",
    intro:
      "Le Cameroun est la première économie d'Afrique centrale et un pays officiellement bilingue, avec Douala comme capitale économique et Yaoundé comme siège des institutions. Expervia accompagne les organisations camerounaises en français et en anglais.",
    context: [
      {
        title: "Le moteur économique de l'Afrique centrale",
        body: "Le port de Douala et ses entreprises desservent l'ensemble de la zone CEMAC.",
      },
      {
        title: "Un pays bilingue",
        body: "Les équipes travaillent souvent en français et en anglais : les solutions et les formations doivent fonctionner dans les deux langues.",
      },
      {
        title: "Le même fuseau horaire que Lagos",
        body: "Le Cameroun partage l'heure d'Afrique de l'Ouest avec le Nigeria, ce qui facilite le travail au quotidien.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Cloud et infrastructure hybride pour gagner en résilience et réduire les coûts.",
      },
      {
        key: "cybersecurity",
        why: "Mesures de sécurité alignées sur les lois camerounaises sur la cybersécurité et les données personnelles.",
      },
      {
        key: "microsoft",
        why: "Microsoft 365 et outils collaboratifs pour des organisations bilingues.",
      },
    ],
    industries: [
      "Banque et microfinance",
      "Télécommunications",
      "Logistique et ports",
      "Agriculture et forêt",
      "Secteur public",
    ],
    compliance:
      "Nous concevons nos solutions en tenant compte de la loi de 2010 sur la cybersécurité et la cybercriminalité, de la loi de 2024 sur la protection des données à caractère personnel et des attentes de la COBAC pour les établissements financiers.",
    delivery: LIVRAISON("au Cameroun", "Douala et Yaoundé"),
    faqs: [
      {
        question: "Travaillez-vous en français et en anglais ?",
        answer:
          "Oui. Le Cameroun est bilingue et nous accompagnons les équipes dans les deux langues. Cette page existe aussi en anglais.",
      },
      {
        question: "Votre équipe de Lagos est-elle proche du Cameroun ?",
        answer:
          "Très proche : nous avons le même fuseau horaire, et Douala n'est qu'à un court vol de Lagos pour les interventions sur site.",
      },
      {
        question: "Quels secteurs accompagnez-vous au Cameroun ?",
        answer:
          "Entre autres la banque, les télécoms, la logistique, l'agriculture et le secteur public.",
      },
    ],
  },
  morocco: {
    name: "Maroc",
    inName: "au Maroc",
    regionFr: "Afrique du Nord",
    hubs: ["Casablanca", "Rabat", "Tanger"],
    currency: "Dirham marocain (MAD)",
    timeZone: "Heure du Maroc (UTC+1)",
    title: "IA, cloud et cybersécurité au Maroc",
    description:
      "Expervia accompagne les organisations de Casablanca, Rabat et de tout le Maroc avec le cloud, l'IA, la donnée et les solutions Microsoft, depuis Lagos.",
    headline: "IA, cloud et cybersécurité pour les organisations au Maroc",
    intro:
      "Le Maroc est une passerelle entre l'Afrique et l'Europe, avec Casablanca Finance City et une solide base industrielle. Expervia aide les organisations marocaines, et celles qui se développent en Afrique subsaharienne, à bâtir un cloud, une donnée et une IA sûrs.",
    context: [
      {
        title: "Une porte d'entrée vers l'Afrique",
        body: "De nombreuses banques, assurances et opérateurs marocains sont présents en Afrique subsaharienne et ont besoin de plateformes qui fonctionnent par-delà les frontières.",
      },
      {
        title: "Une base industrielle et automobile",
        body: "L'industrie autour de Tanger et de Kénitra stimule la demande en données, IoT et analytique.",
      },
      {
        title: "Une protection des données mature",
        body: "La loi 09-08 et la CNDP encadrent les données personnelles depuis plus de dix ans.",
      },
    ],
    priorities: [
      {
        key: "data",
        why: "Plateformes de données et analytique pour les banques, les assureurs et les industriels.",
      },
      {
        key: "cloud",
        why: "Architecture cloud qui respecte les règles de la CNDP sur les transferts de données.",
      },
      {
        key: "ai",
        why: "IA et automatisation pour la relation client et les opérations.",
      },
    ],
    industries: [
      "Banque et assurance",
      "Automobile et industrie",
      "Télécommunications",
      "Tourisme",
      "Secteur public",
    ],
    compliance:
      "Nous concevons nos solutions en tenant compte de la loi 09-08 relative à la protection des données à caractère personnel, des déclarations et autorisations de transfert auprès de la CNDP, et des exigences de Bank Al-Maghrib pour les établissements financiers.",
    delivery: LIVRAISON("au Maroc", "Casablanca et Rabat"),
    faqs: [
      {
        question: "Accompagnez-vous des équipes francophones au Maroc ?",
        answer:
          "Oui. Nous travaillons avec des équipes francophones, et cette page existe aussi en anglais.",
      },
      {
        question:
          "Pouvez-vous aider une entreprise marocaine qui se développe en Afrique subsaharienne ?",
        answer:
          "Oui. Depuis Lagos, nous connaissons bien les marchés d'Afrique de l'Ouest et pouvons concevoir des plateformes adaptées à l'ensemble de vos activités africaines.",
      },
      {
        question:
          "Tenez-vous compte des règles de la CNDP sur les transferts ?",
        answer:
          "Oui. La loi 09-08 et les règles de transfert de la CNDP font partie de nos critères de conception pour le cloud et la donnée.",
      },
    ],
  },
  "dr-congo": {
    name: "RD Congo",
    inName: "en RDC",
    regionFr: "Afrique centrale",
    hubs: ["Kinshasa", "Lubumbashi"],
    currency: "Franc congolais (CDF)",
    timeZone: "Heure d'Afrique de l'Ouest à Kinshasa (UTC+1)",
    title: "IA, cloud et cybersécurité en RD Congo",
    description:
      "Expervia aide les organisations de Kinshasa, Lubumbashi et de toute la RDC à bâtir un cloud sûr, Microsoft 365 et une meilleure exploitation des données.",
    headline: "IA, cloud et cybersécurité pour les organisations en RD Congo",
    intro:
      "La République démocratique du Congo est l'un des plus grands marchés d'Afrique, avec d'importants secteurs miniers, télécoms et bancaires et une économie numérique en pleine croissance. Expervia aide les organisations congolaises à bâtir des fondations informatiques fiables et sécurisées.",
    context: [
      {
        title: "Une économie portée par les ressources",
        body: "Les mines du sud et les services à Kinshasa exigent des systèmes d'exploitation et de reporting fiables.",
      },
      {
        title: "Une connectivité qui progresse",
        body: "L'extension des réseaux mobiles et de la fibre ouvre la voie au cloud et à la banque digitale.",
      },
      {
        title: "Un nouveau Code du numérique",
        body: "Le Code du numérique de 2023 fixe des règles sur les transactions électroniques, la cybersécurité et les données personnelles.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Infrastructure hybride et cloud conçue pour une connectivité variable et une forte résilience.",
      },
      {
        key: "microsoft",
        why: "Microsoft 365 et collaboration sécurisée pour des équipes et des sites dispersés.",
      },
      {
        key: "cybersecurity",
        why: "Fondations de sécurité pour les banques, les opérateurs et les sociétés minières.",
      },
    ],
    industries: [
      "Mines",
      "Télécommunications",
      "Banque",
      "ONG et humanitaire",
      "Secteur public",
    ],
    compliance:
      "Nous concevons nos solutions en tenant compte du Code du numérique de 2023, notamment de ses dispositions sur la cybersécurité et les données personnelles, en lien avec vos conseillers juridiques.",
    delivery: LIVRAISON("en RDC", "Kinshasa et Lubumbashi"),
    faqs: [
      {
        question: "Travaillez-vous en français en RDC ?",
        answer:
          "Oui. Nous accompagnons les équipes francophones, et cette page existe aussi en anglais.",
      },
      {
        question: "Pouvez-vous concevoir pour une connectivité instable ?",
        answer:
          "Oui. Nous concevons des architectures hybrides, tolérantes aux coupures, pour les sites où la connexion varie, comme les mines et les bureaux éloignés.",
      },
      {
        question: "Comment se déroulent vos projets à Kinshasa ?",
        answer:
          "Nous travaillons à distance depuis Lagos (même fuseau horaire que Kinshasa) et nous nous déplaçons quand un projet l'exige.",
      },
    ],
  },
};

export type FrPage = {
  /** The localized country, ready for CountryLanding. */
  c: Country;
  regionFr: string;
  /** English slug, for the English alternate. */
  enSlug: string;
};

/** All French country pages, in the same order as COUNTRIES. */
export const FR_PAGES: FrPage[] = Object.entries(FR).map(([enSlug, fr]) => {
  const en = getCountry(enSlug);
  if (!en?.frSlug) throw new Error(`No English page with frSlug for ${enSlug}`);
  const { regionFr, ...content } = fr;
  return {
    enSlug,
    regionFr,
    c: {
      ...content,
      slug: en.frSlug,
      frSlug: en.frSlug,
      region: en.region,
      iso: en.iso,
    },
  };
});

export function getFrPage(frSlug: string): FrPage | undefined {
  return FR_PAGES.find((p) => p.c.slug === frSlug);
}
