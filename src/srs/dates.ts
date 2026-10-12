/** Dates au format « AAAA-MM-JJ », en heure locale (le jour change à minuit chez l'utilisateur). */

export function dateLocale(d: Date = new Date()): string {
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

export function ajouterJours(date: string, jours: number): string {
  const [a, m, j] = date.split('-').map(Number)
  return dateLocale(new Date(a, m - 1, j + jours))
}
