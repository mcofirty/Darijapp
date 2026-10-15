import unittest
from audio_texts import audio_catalog


class AudioTextsTests(unittest.TestCase):
    def test_each_entry_has_separate_audio_text_without_changing_latin(self):
        result = audio_catalog()
        self.assertEqual(len(result['entries']), 3511)
        entry = result['entries']['verbes-085']
        self.assertEqual(entry['latin'], 'we99e3')
        self.assertEqual(entry['audio_text']['latin_phonetic'], 'weqqeʿ')
        self.assertEqual(entry['audio_text']['consonant_symbols'], 'weqqeʕ')
        self.assertFalse(result['display_fields_modified'])
        self.assertIsNone(result['confidence'])

    def test_word_override_does_not_modify_canonical_spelling(self):
        source = {'word': {'latin': 'we99e3'}}
        overrides = {'word': {'latin': 'we99e3', 'audio_text': {'latin_phonetic': 'weqqeʿ'}}}
        result = audio_catalog(source, overrides)
        self.assertEqual(source['word']['latin'], 'we99e3')
        self.assertEqual(result['entries']['word']['origin'], 'word_override')

    def test_stale_override_is_blocked(self):
        with self.assertRaisesRegex(ValueError, 'périmée'):
            audio_catalog({'word': {'latin': 'we99e3'}}, {'word': {'latin': 'old', 'audio_text': {}}})

    def test_override_cannot_restore_digits_or_hide_arabic(self):
        for value in ['we99e3', 'وقع']:
            with self.assertRaises(ValueError):
                audio_catalog({'word': {'latin': 'we99e3'}},
                              {'word': {'latin': 'we99e3', 'audio_text': {'latin_phonetic': value}}})
