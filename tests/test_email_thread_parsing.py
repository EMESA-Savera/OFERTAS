"""Regression tests for the non-destructive offer email thread parser."""

import importlib
import os
import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
API_DIR = PROJECT_ROOT / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))


def load_offer_app_module():
    """Load parser helpers without requiring the shared attachment path."""
    sys.modules.pop("app_ofertas", None)
    with patch("os.makedirs"):
        return importlib.import_module("app_ofertas")


class OfferEmailThreadParsingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = load_offer_app_module()

    def test_localized_and_graph_dates_are_normalized(self):
        self.assertEqual(
            self.app.normalize_email_datetime("lunes, 16 de febrero de 2026 13:55"),
            datetime(2026, 2, 16, 13, 55),
        )
        self.assertEqual(
            self.app.normalize_email_datetime("16. února 2026 13:55"),
            datetime(2026, 2, 16, 13, 55),
        )
        self.assertEqual(
            self.app.normalize_email_datetime("2026-02-16T13:55:01Z").isoformat(),
            "2026-02-16T13:55:01+00:00",
        )

    def test_outlook_thread_is_split_and_quoted_headers_are_retained(self):
        thread = """Buenas José,

Última actualización de la oferta.

Un saludo,
Pedro

________________________________

De: Kevin Jaworek <k.jaworek@saveragroup.com>
Enviado el: lunes, 16 de febrero de 2026 13:55
Para: Pedro Cortés <pi.cortes@saveragroup.com>
CC: José <j.barutell@saveragroup.com>
Asunto: Re: Oferta ES5

Hello Pedro,

I agree with the proposed BOM.

Best regards,
Kevin Jaworek

-----Original Message-----
From: Pedro Cortés <pi.cortes@saveragroup.com>
Sent: 16 February 2026 13:12
To: Kevin Jaworek <k.jaworek@saveragroup.com>
Subject: Oferta ES5

Hello Kevin,

Could you confirm the criteria?
"""
        records = self.app.build_offer_email_message_records(
            {
                "thread_body": thread,
                "source_type": "email_file",
                "sender_name": "Pedro Cortés",
                "sender_email": "pi.cortes@saveragroup.com",
                "received_at": datetime(2026, 2, 16, 16, 13),
                "subject": "RE: Oferta ES5",
                "internet_message_id": "outer-message@example.com",
                "in_reply_to_message_id": None,
                "reference_message_ids": [],
            }
        )

        self.assertEqual(len(records), 3)
        self.assertEqual(
            [record["sender_email"] for record in records],
            ["pi.cortes@saveragroup.com", "k.jaworek@saveragroup.com", "pi.cortes@saveragroup.com"],
        )
        self.assertEqual(records[1]["received_at"], datetime(2026, 2, 16, 13, 55))
        self.assertEqual(records[2]["received_at"], datetime(2026, 2, 16, 13, 12))
        self.assertEqual(records[1]["subject"], "Re: Oferta ES5")
        self.assertEqual(records[2]["subject"], "Oferta ES5")
        self.assertTrue(all(record["extraction_confidence"] == "high" for record in records))
        self.assertNotIn("Este mensaje", "\n".join(record["body_text"] for record in records))

    def test_farewell_and_text_that_follows_it_are_preserved(self):
        # A farewell is still part of a message. Some Outlook signatures are
        # also followed by a short final note, so neither may be discarded.
        segment = """Información de la oferta.

Un saludo,
Ana

Buenos días, añado que el plazo confirmado es el viernes.
"""

        cleaned_segment = self.app.clean_offer_email_segment(segment)
        cleaned_body = self.app.clean_email_body(segment)

        self.assertIn("Un saludo", cleaned_segment)
        self.assertIn("Buenos días", cleaned_segment)
        self.assertIn("Un saludo", cleaned_body)
        self.assertIn("Buenos días", cleaned_body)

        final_farewell = "Confirmamos la fecha solicitada.\n\nSaludos cordiales."
        self.assertEqual(self.app.clean_offer_email_segment(final_farewell), final_farewell)
        self.assertEqual(self.app.clean_email_body(final_farewell), final_farewell)

    def test_outlook_normalizer_keeps_raw_thread_only_for_separation(self):
        message = {
            "body_content_type": "text",
            "body_content": "Nueva respuesta\n\nFrom: Ana <ana@example.com>\nSent: 16 February 2026 09:30\nTo: Pedro <pedro@example.com>\nSubject: Oferta\n\nMensaje anterior",
            "sender_name": "Pedro",
            "sender_email": "pedro@example.com",
            "subject": "RE: Oferta",
            "received_at": "2026-02-16T10:00:00Z",
            "conversation_id": "conversation-123",
            "internet_message_id": "message-123@example.com",
        }

        normalized = self.app.normalize_outlook_message_for_offer(message)

        self.assertIn("From: Ana", normalized["thread_body"])
        self.assertNotIn("From: Ana", normalized["body"])
        self.assertEqual(normalized["conversation_id"], "conversation-123")
        self.assertEqual(normalized["received_at"].isoformat(), "2026-02-16T10:00:00+00:00")


if __name__ == "__main__":
    unittest.main()
