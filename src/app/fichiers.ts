/**
 * Donne un fichier à l'utilisateur : feuille de partage de l'iPhone (Enregistrer dans Fichiers, AirDrop…)
 * quand elle accepte les fichiers, sinon téléchargement classique. Renvoie false si le partage est annulé.
 */
export async function donnerFichier(nom: string, type: string, contenu: string, partager = true): Promise<boolean> {
  const fichier = new File([contenu], nom, { type })
  if (partager && navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier] })
      return true
    } catch (e) {
      // Partage annulé par l'utilisateur : rien d'autre à faire.
      if (e instanceof DOMException && e.name === 'AbortError') return false
    }
  }
  const url = URL.createObjectURL(fichier)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.append(lien)
  lien.click()
  lien.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return true
}

/** Fait choisir un fichier à l'utilisateur et renvoie son texte (null si rien n'est choisi). */
export function choisirFichier(accepte: string): Promise<string | null> {
  return new Promise((resolve) => {
    const champ = document.createElement('input')
    champ.type = 'file'
    champ.accept = accepte
    champ.onchange = () => {
      const f = champ.files?.[0]
      if (!f) resolve(null)
      else void f.text().then(resolve)
    }
    champ.click()
  })
}
