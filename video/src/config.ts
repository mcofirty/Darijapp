/**
 * Tout ce qui se modifie facilement : couleurs, textes, durées.
 * Les durées sont en secondes ; la vidéo est à 30 images par seconde.
 */

export const FORMAT = {
  largeur: 1080,
  hauteur: 1920,
  fps: 30,
};

// Couleurs de l'interface de Darijaapp (direction « Playful Premium »).
export const COULEURS = {
  fond: "#F2F2F7", // fond groupé d'iOS
  carte: "#FFFFFF",
  texte: "#111111",
  texte2: "rgba(60, 60, 67, 0.62)",
  texte3: "rgba(60, 60, 67, 0.28)",
  separateur: "rgba(60, 60, 67, 0.14)",
  accent: "#C93A26", // corail : couleur principale
  accentClair: "#F0654C",
  accentDoux: "rgba(201, 58, 38, 0.10)",
  energie: "#F5A524", // XP, série, récompenses
  energieDoux: "rgba(245, 165, 36, 0.16)",
  vert: "#0B7A50", // réussites
  vertVif: "#12A06A",
  vertDoux: "rgba(18, 160, 106, 0.12)",
  rouge: "#D93A4A",
};

export const POLICE = "Inter";

// Durée de chaque scène, en secondes (total : 45 s).
export const DUREES = {
  accroche: 4,
  probleme: 6,
  revelation: 5,
  demo: 17,
  benefices: 8,
  appel: 5,
};

export const TEXTES = {
  nom: "Darijaapp",

  accroche: {
    question: "Pourquoi le darija semble si difficile ?",
    sousTitre: "Tu n'es pas le seul.",
  },

  probleme: {
    titre: "Apprendre seul, c'est épuisant",
    taches: [
      "Des listes de mots interminables",
      "Des manuels en arabe classique",
      "Aucune pratique à l'oral",
    ],
    conclusion: "Résultat : tu abandonnes.",
  },

  revelation: {
    promesse: "Parle darija, 5 minutes par jour.",
  },

  demo: {
    titreApp: "Session du jour",
    demande: "Comment commander un thé ?",
    reponseLatin: "3tini atay 3afak",
    reponseArabe: "عطيني أتاي عافاك",
    reponseFr: "Donne-moi du thé, s'il te plaît",
    etapes: [
      { titre: "Écoute la voix marocaine", detail: "Voix de Jamal, au ralenti" },
      { titre: "Répète au micro", detail: "Les sons 3, 7 et 9 du darija" },
      { titre: "Prononciation validée", detail: "Score : 86 / 100" },
    ],
    titreTableau: "Tes progrès",
    indicateurs: [
      { label: "Série", valeur: 12, suffixe: " jours" },
      { label: "XP gagnés", valeur: 1240, suffixe: "" },
      { label: "Mots retenus", valeur: 300, suffixe: "" },
    ],
    jauges: [
      { label: "Salutations", pourcentage: 92 },
      { label: "Au souk", pourcentage: 74 },
      { label: "En taxi", pourcentage: 58 },
    ],
  },

  benefices: {
    titre: "Pourquoi ça marche",
    cartes: [
      { titre: "Ludique", texte: "5 minutes, zéro prise de tête" },
      { titre: "Un vrai jeu", texte: "XP, séries, quêtes et badges" },
      { titre: "Apprentissage", texte: "Répétition espacée et prononciation" },
    ],
    chiffre: 1682,
    chiffreLabel: "mots et expressions du quotidien",
  },

  appel: {
    phrase: "Télécharge l'application",
    sousPhrase: "Gratuite, hors ligne, sans compte.",
    bouton: "Commencer gratuitement",
    url: "mcofirty.github.io/Darijapp",
  },
};
