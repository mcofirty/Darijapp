/** Logique pure de l'aide à l'installation sur l'écran d'accueil (sans React ni navigateur). */

export interface Appareil {
  userAgent: string
  /** navigator.maxTouchPoints : distingue un iPad (qui se dit « Macintosh ») d'un Mac. */
  pointsDeContact: number
  /** Appli ouverte depuis l'écran d'accueil (navigator.standalone ou display-mode standalone). */
  installee: boolean
}

/** iPhone, iPod ou iPad (y compris l'iPad qui se présente comme un Mac). */
export function estAppareilApple({ userAgent, pointsDeContact }: Pick<Appareil, 'userAgent' | 'pointsDeContact'>): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true
  return /Macintosh/.test(userAgent) && pointsDeContact > 1
}

/** L'aide s'affiche sur iPhone ou iPad, dans le navigateur, tant que « Ne plus afficher » n'est pas coché. */
export function doitProposerInstallation(appareil: Appareil, masquee: boolean): boolean {
  return !masquee && !appareil.installee && estAppareilApple(appareil)
}
