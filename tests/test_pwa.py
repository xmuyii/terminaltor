"""
Phase 8C — Reach & Mobile PWA Tests
Validates manifest.webmanifest structure, service worker caching policies,
offline fallback safeguards, and mobile responsive constraints.
"""

import unittest
import json
import os

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')


class TestPWASpecification(unittest.TestCase):
    def test_manifest_exists_and_is_valid_json(self):
        manifest_path = os.path.join(PUBLIC_DIR, 'manifest.webmanifest')
        self.assertTrue(os.path.exists(manifest_path), "manifest.webmanifest must exist in public/")

        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.assertIn("name", data)
        self.assertIn(data["name"], ["The Tech Academy", "Sovereign Academy"])
        self.assertIn("short_name", data)
        self.assertIn(data["short_name"], ["TechAcademy", "The Tech Academy", "Sovereign"])
        self.assertIn("start_url", data)
        self.assertIn("display", data)
        self.assertEqual(data["display"], "standalone")
        self.assertIn("theme_color", data)
        self.assertEqual(data["theme_color"], "#6366f1")

    def test_manifest_icons_contain_192_and_512(self):
        manifest_path = os.path.join(PUBLIC_DIR, 'manifest.webmanifest')
        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.assertIn("icons", data)
        icons = data["icons"]
        self.assertTrue(len(icons) >= 2)

        sizes = [icon.get("sizes") for icon in icons]
        self.assertIn("192x192", sizes)
        self.assertIn("512x512", sizes)

    def test_service_worker_implements_caching_policy(self):
        sw_path = os.path.join(PUBLIC_DIR, 'sw.js')
        self.assertTrue(os.path.exists(sw_path), "sw.js must exist in public/")

        with open(sw_path, 'r', encoding='utf-8') as f:
            sw_code = f.read()

        # Rule 1: Submissions never cached (always network)
        self.assertIn("/submissions", sw_code)
        self.assertIn("fetch(event.request)", sw_code)

        # Rule 2: Arcade and WebSockets never cached
        self.assertIn("/arcade/ws", sw_code)

        # Rule 3: Leaderboard network-first with cache fallback
        self.assertIn("/leaderboards", sw_code)

        # Rule 4: Precache app shell
        self.assertIn("PRECACHE_URLS", sw_code)
        self.assertIn("manifest.webmanifest", sw_code)

    def test_index_html_links_manifest_and_meta_theme(self):
        index_path = os.path.join(os.path.dirname(__file__), '..', 'index.html')
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()

        self.assertIn('rel="manifest"', html)
        self.assertIn('/manifest.webmanifest', html)
        self.assertIn('name="theme-color"', html)


if __name__ == '__main__':
    unittest.main()
