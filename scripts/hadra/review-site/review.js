/* Avis locaux de test, indépendants de l'application et sans déclenchement de déploiement. */
(() => {
  const data = window.HADRA_REVIEW
  const el = id => document.getElementById(id)
  const storageKey = `darija-hadra-review-${data.review_id}`
  let state = { votes: {}, notes: {}, decision: 'pending' }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (saved && typeof saved.votes === 'object' && typeof saved.notes === 'object') state = saved
  } catch { el('storage-message').textContent = 'La sauvegarde locale est indisponible ; vous pouvez télécharger votre avis.' }
  let position = 0
  let visible = data.entries
  const players = [el('before'), el('after')]
  const persist = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)) }
    catch { el('storage-message').textContent = 'Téléchargez votre avis pour le conserver.' }
  }
  const summary = () => {
    const count = data.entries.filter(entry => state.votes[entry.id]).length
    el('review-count').textContent = `${count} avis sur 50`
    el('progress').value = count
    const preferred = choice => data.entries.filter(entry => state.votes[entry.id] === choice).length
    el('summary').textContent = `${preferred('after')} préférences pour après · ${preferred('before')} pour avant · ${preferred('review')} à revoir.`
  }
  const render = () => {
    players.forEach(player => player.pause())
    el('playback-error').hidden = true
    el('empty').hidden = visible.length > 0
    el('card').hidden = !visible.length
    summary()
    if (!visible.length) return
    position = Math.min(position, visible.length - 1)
    const entry = visible[position]
    el('latin').textContent = entry.latin
    el('translation').textContent = entry.fr
    el('arabic').textContent = entry.arabe
    el('category').textContent = data.themes[entry.theme] || entry.theme
    el('position').textContent = `${position + 1} / ${visible.length}`
    el('before').src = entry.before
    el('after').src = entry.after
    players.forEach(player => { player.playbackRate = Number(el('speed').value) })
    el('previous').disabled = position === 0
    el('next').disabled = position === visible.length - 1
    el('note').value = state.notes[entry.id] || ''
    document.querySelectorAll('[data-vote]').forEach(button => button.setAttribute('aria-pressed', String(state.votes[entry.id] === button.dataset.vote)))
    const warnings = entry.warnings.filter(reason => reason !== 'latin_darija_pronunciation_not_verified')
    el('alert').hidden = warnings.length === 0
    el('alert').textContent = warnings.includes('long_edge_silence') ? 'Un silence prolongé a été détecté dans le nouveau fichier.' : 'Le nouveau fichier présente une durée ou des pauses inhabituelles.'
  }
  const filter = () => {
    const query = el('search').value.toLocaleLowerCase('fr')
    const theme = el('theme').value
    visible = data.entries.filter(entry => (!theme || entry.theme === theme) && `${entry.latin} ${entry.fr}`.toLocaleLowerCase('fr').includes(query))
    position = 0
    render()
  }
  for (const theme of new Set(data.entries.map(entry => entry.theme))) {
    const option = document.createElement('option')
    option.value = theme
    option.textContent = data.themes[theme] || theme
    el('theme').append(option)
  }
  document.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', () => {
    state.votes[visible[position].id] = button.dataset.vote
    persist()
    document.querySelectorAll('[data-vote]').forEach(b => b.setAttribute('aria-pressed', String(b === button)))
    summary()
  }))
  el('note').addEventListener('input', () => { state.notes[visible[position].id] = el('note').value; persist() })
  el('previous').addEventListener('click', () => { position--; render() })
  el('next').addEventListener('click', () => { position++; render() })
  el('search').addEventListener('input', filter)
  el('theme').addEventListener('change', filter)
  el('speed').addEventListener('change', () => players.forEach(player => { player.playbackRate = Number(el('speed').value) }))
  players.forEach(player => {
    player.addEventListener('play', () => players.filter(other => other !== player).forEach(other => other.pause()))
    player.addEventListener('error', () => {
      el('playback-error').hidden = false
      el('playback-error').textContent = 'Ce fichier ne peut pas être lu. Réessayez après avoir vérifié votre connexion.'
    })
  })
  el('decision').value = state.decision
  el('decision').addEventListener('change', () => { state.decision = el('decision').value; persist() })
  el('export').addEventListener('click', () => {
    const result = { review_id: data.review_id, model: data.model, source_script: 'latin', decision: state.decision,
      created_at: new Date().toISOString(), linguistic_certification: false,
      entries: data.entries.map(entry => ({ id: entry.id, latin: entry.latin, after_sha256: entry.after_sha256,
        vote: state.votes[entry.id] || 'unreviewed', note: state.notes[entry.id] || '' })) }
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'avis-hadra-50-mots.json'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  })
  render()
})()
