import unittest
import phonetic


class PhoneticTests(unittest.TestCase):
    def test_gemination_is_preserved_without_digits(self):
        self.assertEqual(phonetic.convert('we99e3')['tts_text'], 'weqqeʿ')
        self.assertEqual(phonetic.convert('we99e3', 'consonant_symbols')['tts_text'], 'weqqeʕ')

    def test_each_special_consonant_and_digraph(self):
        for source, expected in [('3afak', 'ʿafak'), ('7lib', 'ḥlib'), ('9elb', 'qelb'), ('net2ekked', 'netʾekked')]:
            self.assertEqual(phonetic.convert(source)['tts_text'], expected)
        self.assertEqual(phonetic.convert('ch7al?', 'consonant_symbols')['tts_text'], 'ʃħal?')
        self.assertEqual(phonetic.convert('3tchan', 'consonant_symbols')['tts_text'], 'ʕtʃan')

    def test_actual_numbers_and_numeric_codes_are_preserved(self):
        text = '3 7 9 23 2026 9:30 mp3 3g usb3 12.5'
        result = phonetic.convert(text)
        self.assertEqual(result['tts_text'], text)
        self.assertFalse(result['ambiguous_tokens'])

    def test_unknown_alphanumeric_word_is_blocked_instead_of_guessed(self):
        result = phonetic.convert('iphone9 et abc237')
        self.assertIsNone(result['tts_text'])
        self.assertEqual(result['ambiguous_tokens'], ['iphone9', 'abc237'])

    def test_source_spelling_and_vowels_are_not_rewritten(self):
        result = phonetic.convert('we99e3, 3afak!')
        self.assertEqual(result['display_latin'], 'we99e3, 3afak!')
        self.assertEqual(result['tts_text'], 'weqqeʿ, ʿafak!')
        self.assertFalse(result['complete_ipa'])
        self.assertIsNone(result['confidence'])

    def test_current_corpus_is_audited_without_ambiguous_conversion(self):
        result = phonetic.audit()
        self.assertEqual((result['word_count'], result['words_with_arabizi']), (1682, 650))
        self.assertEqual((result['audio_text_count'], result['audio_texts_with_arabizi']), (3511, 1818))
        self.assertTrue(result['lexicon_source_matches'])
        self.assertEqual(result['blocked_proposals'], 0)
        self.assertTrue(result['risk_is_not_confirmed_error'])
        for entry in result['entries']:
            for proposal in entry['proposals'].values():
                self.assertFalse(any(c.isdigit() for c in proposal['tts_text']))

    def test_arabic_is_not_a_hidden_fallback(self):
        with self.assertRaises(ValueError):
            phonetic.convert('وقع')
