import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate import validate_dataset


class DatasetValidationTests(unittest.TestCase):
    def setUp(self):
        self.record = json.loads(Path('data/experiments.json').read_text(encoding='utf-8'))[0]
        self.record.update(oxygen_pct=None, pressure_kpa=None, airflow_cm_s=0)

    def validate(self, records):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'records.json'
            file.write_text(json.dumps(records), encoding='utf-8')
            return validate_dataset(file)

    def test_null_and_measured_zero_are_valid(self):
        self.assertTrue(self.validate([self.record]))

    def test_verified_record_requires_locator(self):
        self.record['source_locator'] = ''
        self.assertFalse(self.validate([self.record]))

    def test_boolean_and_invalid_pressure_are_rejected(self):
        for field, value in [('oxygen_pct', True), ('airflow_cm_s', False), ('pressure_kpa', -1)]:
            record = {**self.record, field: value}
            with self.subTest(field=field):
                self.assertFalse(self.validate([record]))

    def test_duplicate_id_is_rejected(self):
        self.assertFalse(self.validate([self.record, self.record]))


if __name__ == '__main__':
    unittest.main()
