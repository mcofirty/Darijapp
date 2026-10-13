// Textes lus par la voix Jamal : le latin de chaque mot écrit en arabe vocalisé (src/data/vocaliser.ts),
// pour qu'il soit dit comme on le parle et non en arabe standard. Écrit scripts/voix.json, lu par generate_audio.py.
//
//   npm run voix               # régénère scripts/voix.json
//   node scripts/voix.mjs --verifier   # échoue si scripts/voix.json n'est pas à jour (lancé par les tests)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { vocaliser } from '../src/data/vocaliser.ts'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const donnees = join(racine, 'src', 'data')
const lire = (chemin) => JSON.parse(readFileSync(chemin, 'utf8'))

/** Toutes les entrées qui ont un MP3 : mots, exemples, mots des paires de sons, phrases du marchand. */
const entrees = []
for (const fichier of readdirSync(donnees).filter((f) => f.endsWith('.json')).sort()) {
  for (const mot of lire(join(donnees, fichier))) {
    entrees.push(mot)
    if (mot.exemple?.audio) entrees.push(mot.exemple)
  }
}
entrees.push(...lire(join(donnees, 'sons', 'paires.json')).mots)
for (const article of lire(join(donnees, 'jeux', 'marchandage.json')).articles) entrees.push(...article.prix)

const textes = {}
let vocalises = 0
for (const { latin, arabe, audio } of entrees) {
  if (!audio) continue
  const texte = vocaliser(latin, arabe)
  if (texte) {
    textes[audio] = texte
    vocalises++
  }
}
const contenu = JSON.stringify(textes, null, 1) + '\n'
const cible = join(racine, 'scripts', 'voix.json')

if (process.argv.includes('--verifier')) {
  let actuel = ''
  try {
    actuel = readFileSync(cible, 'utf8')
  } catch {}
  if (actuel !== contenu) {
    console.error('scripts/voix.json n’est pas à jour : lance « npm run voix ».')
    process.exit(1)
  }
} else {
  writeFileSync(cible, contenu)
  console.log(`${vocalises} textes écrits pour la voix sur ${entrees.filter((e) => e.audio).length}.`)
}
