export interface Son {
  /** Graphie latine utilisée dans les mots. */
  latin: string
  arabe: string
  explication: string
  /** Mot exemple du module « Les sons du darija ». */
  exemple: { latin: string; arabe: string; fr: string }
}

/** Sons du darija absents du français, dans l'ordre du cahier des charges. */
export const SONS: Son[] = [
  {
    latin: '3',
    arabe: 'ع',
    explication: "Un « a » serré au fond de la gorge, comme si on l'étranglait légèrement.",
    exemple: { latin: '3afak', arabe: 'عافاك', fr: "s'il te plaît" },
  },
  {
    latin: '7',
    arabe: 'ح',
    explication: 'Un souffle chaud et sourd venu de la gorge, comme pour embuer des lunettes. Sans raclement.',
    exemple: { latin: '7ut', arabe: 'حوت', fr: 'poisson' },
  },
  {
    latin: '9',
    arabe: 'ق',
    explication: 'Un « k » tiré très au fond de la gorge, presque dans la glotte.',
    exemple: { latin: '9ahwa', arabe: 'قهوة', fr: 'café' },
  },
  {
    latin: 'kh',
    arabe: 'خ',
    explication: 'Un raclement de gorge, comme la jota espagnole ou le « ch » de « Bach ».',
    exemple: { latin: 'khobz', arabe: 'خبز', fr: 'pain' },
  },
  {
    latin: 'gh',
    arabe: 'غ',
    explication: 'Un « r » grasseyé à la parisienne, bien appuyé au fond de la gorge.',
    exemple: { latin: 'ghali', arabe: 'غالي', fr: 'cher' },
  },
  {
    latin: 'ch',
    arabe: 'ش',
    explication: 'Comme le « ch » de « chat ».',
    exemple: { latin: 'chokran', arabe: 'شكرا', fr: 'merci' },
  },
]

/** Sons particuliers présents dans un mot écrit en latin, sans doublon, dans l'ordre de SONS. */
export function sonsDuMot(latin: string): Son[] {
  const texte = latin.toLowerCase()
  return SONS.filter((s) => texte.includes(s.latin))
}
