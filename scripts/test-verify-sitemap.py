"""Regression cases for the committed-artifact verifier; no network access."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


class SitemapVerifierTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='origin-sitemap-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        for name in ['build.mjs', 'recipes.json', 'recipes.en.json']:
            shutil.copyfile(ROOT / name, self.root / name)
        shutil.copytree(ROOT / 'dist', self.root / 'dist')
        (self.root / 'scripts').mkdir()
        shutil.copyfile(ROOT / 'scripts/verify-sitemap.sh', self.root / 'scripts/verify-sitemap.sh')

    def snapshot(self):
        return {p.relative_to(self.root).as_posix(): p.read_bytes()
                for p in self.root.rglob('*') if p.is_file()}

    def verify(self):
        before = self.snapshot()
        env = dict(os.environ, PYTHONOPTIMIZE='1')
        result = subprocess.run(['bash', 'scripts/verify-sitemap.sh'], cwd=self.root,
                                env=env, text=True, capture_output=True)
        self.assertEqual(before, self.snapshot(), 'verification must never overwrite its input')
        return result

    def mutate_sitemap(self, mutate):
        path = self.root / 'dist/sitemap.xml'
        tree = ET.parse(path)
        mutate(tree.getroot())
        tree.write(path, encoding='utf-8', xml_declaration=True)

    def test_valid_committed_artifact_passes_under_optimization(self):
        result = self.verify()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_impossible_calendar_date_fails(self):
        self.mutate_sitemap(lambda root: setattr(root[0].find(NS + 'lastmod'), 'text', '2026-02-30'))
        self.assertNotEqual(self.verify().returncode, 0)

    def test_lookalike_xml_entry_fails(self):
        self.mutate_sitemap(lambda root: setattr(root[0], 'tag', NS + 'noturl'))
        self.assertNotEqual(self.verify().returncode, 0)

    def test_jointly_removed_route_and_entry_fail_fixed_contract(self):
        def remove_route(root):
            entry = next(node for node in root if node.findtext(NS + 'loc') == 'https://originespana.com/search/')
            root.remove(entry)
        self.mutate_sitemap(remove_route)
        shutil.rmtree(self.root / 'dist/search')
        result = self.verify()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('26 distinct', result.stderr)

    def test_stale_committed_html_fails_without_repairing_it(self):
        path = self.root / 'dist/index.html'
        path.write_text(path.read_text(encoding='utf-8') + '\n<!-- stale artifact -->\n', encoding='utf-8')
        result = self.verify()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('dist differs from a clean rebuild', result.stderr)


if __name__ == '__main__':
    unittest.main()
