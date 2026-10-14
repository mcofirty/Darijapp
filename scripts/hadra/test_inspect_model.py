import json
import unittest
from unittest.mock import patch

import inspect_model


class InspectionTests(unittest.TestCase):
    def test_reads_text_configuration_at_exact_revision_without_weights(self):
        revision = "a" * 40
        metadata = {"sha": revision, "siblings": [{"rfilename": name} for name in
                    ["config.json", "README.md", "model.safetensors"]]}
        responses = [json.dumps(metadata).encode(), b"# HADRA", b'{"model_type":"speecht5"}',
                     json.dumps({"sha": "b" * 40}).encode()]
        with patch.object(inspect_model, "read_url", side_effect=responses) as fetch:
            report = inspect_model.inspect_model()
        self.assertEqual(report["revision"], revision)
        self.assertEqual(report["files"]["config.json"]["model_type"], "speecht5")
        urls = [call.args[0] for call in fetch.call_args_list]
        self.assertEqual(len(urls), 4)
        self.assertTrue(all(f"/resolve/{revision}/" in url for url in urls[1:3]))
        self.assertFalse(any("safetensors" in url for url in urls))

    def test_rejects_unpinned_revision_before_fetching_files(self):
        with patch.object(inspect_model, "read_url", return_value=b'{"sha":"main"}') as fetch:
            with self.assertRaises(ValueError):
                inspect_model.inspect_model()
        self.assertEqual(fetch.call_count, 1)


if __name__ == "__main__":
    unittest.main()
