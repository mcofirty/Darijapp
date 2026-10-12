/** Rappel quotidien en fichier calendrier .ics (logique pure) : l'iPhone le propose dans Calendrier. */

/** « 19:00 » → « 190000 » ; date « 2026-10-13 » → « 20261013 ». */
function horodatage(date: string, heure: string): string {
  return `${date.replaceAll('-', '')}T${heure.replace(':', '')}00`
}

/** Événement quotidien de 10 minutes, avec une alerte à l'heure choisie (heure locale du téléphone). */
export function fichierIcs(heure: string, aujourdhui: string, adresse: string): string {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(heure)) throw new Error(`Heure invalide : ${heure}`)
  const [h, m] = heure.split(':').map(Number)
  const fin = `${String(h + Math.floor((m + 10) / 60)).padStart(2, '0')}:${String((m + 10) % 60).padStart(2, '0')}`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Darijaapp//Rappel//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:darijaapp-rappel-${heure.replace(':', '')}@darijaapp`,
    `DTSTAMP:${horodatage(aujourdhui, '00:00')}`,
    `DTSTART:${horodatage(aujourdhui, heure)}`,
    `DTEND:${horodatage(aujourdhui, fin === '24:00' ? '23:59' : fin)}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Darijaapp : ma session de darija',
    `DESCRIPTION:5 à 10 minutes pour garder ta série. ${adresse}`,
    `URL:${adresse}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:C’est l’heure du darija !',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
