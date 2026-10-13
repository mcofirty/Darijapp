/**
 * Alignement temporel dynamique (DTW) : aligne deux suites de trames prononcées
 * à des vitesses différentes et renvoie la distance moyenne le long du meilleur chemin.
 */

function distance(a: Float64Array, b: Float64Array): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2
  return Math.sqrt(s)
}

export interface Alignement {
  /** Distance moyenne par pas du chemin. */
  moyenne: number
  /** Distance locale le long du chemin, dans l'ordre de la référence. */
  locales: number[]
}

/**
 * DTW avec pas symétriques (diagonale, horizontal, vertical) ; `largeur` limite l'écart
 * entre les deux temps (bande de Sakoe-Chiba, en part de la plus longue suite).
 */
export function dtw(ref: Float64Array[], essai: Float64Array[], largeur = 0.4): Alignement {
  const n = ref.length
  const m = essai.length
  if (n === 0 || m === 0) return { moyenne: Infinity, locales: [] }
  const bande = Math.max(Math.abs(n - m), Math.ceil(largeur * Math.max(n, m)))
  const cout = new Float64Array((n + 1) * (m + 1)).fill(Infinity)
  const pas = new Uint8Array((n + 1) * (m + 1))
  const ix = (i: number, j: number) => i * (m + 1) + j
  cout[0] = 0
  for (let i = 1; i <= n; i++) {
    // Le centre de la bande suit la diagonale du rectangle n × m.
    const centre = Math.round((i * m) / n)
    for (let j = Math.max(1, centre - bande); j <= Math.min(m, centre + bande); j++) {
      const d = distance(ref[i - 1], essai[j - 1])
      const diag = cout[ix(i - 1, j - 1)]
      const haut = cout[ix(i - 1, j)]
      const gauche = cout[ix(i, j - 1)]
      // La diagonale compte double (pondération symétrique) : rester sur place n'est pas gratuit.
      let meilleur = diag + 2 * d
      let p = 0
      if (haut + d < meilleur) {
        meilleur = haut + d
        p = 1
      }
      if (gauche + d < meilleur) {
        meilleur = gauche + d
        p = 2
      }
      cout[ix(i, j)] = meilleur
      pas[ix(i, j)] = p
    }
  }
  // Remonte le chemin pour connaître la distance en chaque point de la référence.
  const locales = Array.from({ length: n }, () => 0)
  const comptes = Array.from({ length: n }, () => 0)
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    locales[i - 1] += distance(ref[i - 1], essai[j - 1])
    comptes[i - 1]++
    const p = pas[ix(i, j)]
    if (p === 0) {
      i--
      j--
    } else if (p === 1) i--
    else j--
  }
  return { moyenne: cout[ix(n, m)] / (n + m), locales: locales.map((v, k) => v / Math.max(1, comptes[k])) }
}
