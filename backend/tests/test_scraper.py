import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scraper import (
    upsert_slots_to_supabase,
    fetch_active_subscriptions,
    parse_spots_count,
    parse_to_iso_datetimes
)


def test_upsert_slots_hard_failure_on_400_error():
    """Verify that a 400 Bad Request error from Supabase raises SystemExit with exit code 1."""
    mock_slots = [{
        "event_id": "test_123",
        "event_name": "Test Badminton Court",
        "location_name": "Delbrook",
        "date_desc": "Thu, Aug 6th, 2026",
        "start_time": "2026-08-06T17:45:00-07:00",
        "end_time": "2026-08-06T18:45:00-07:00",
        "spots": "1 spot left",
        "spots_count": 1,
        "price": 16.36,
        "button_text": "Book Now",
        "last_updated": "2026-07-28T21:00:00-07:00"
    }]

    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = '{"code":"PGRST204","message":"Could not find column"}'
        mock_response.raise_for_status.side_effect = Exception("400 Client Error: Bad Request")
        mock_post.return_value = mock_response

        # Assert SystemExit(1) is raised when DB write fails
        with pytest.raises(SystemExit) as exc_info:
            upsert_slots_to_supabase("https://fake.supabase.co", "fake_key", mock_slots)

        assert exc_info.value.code == 1


def test_upsert_slots_success():
    """Verify that successful Supabase upsert executes cleanly without exiting."""
    mock_slots = [{
        "event_id": "test_123",
        "event_name": "Test Badminton Court"
    }]

    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Should execute cleanly without raising SystemExit
        upsert_slots_to_supabase("https://fake.supabase.co", "fake_key", mock_slots)
        assert mock_post.called


def test_fetch_active_subscriptions_hard_failure():
    """Verify that a 500 Server Error when fetching subscriptions raises SystemExit with exit code 1."""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = Exception("500 Internal Server Error")
        mock_get.return_value = mock_response

        with pytest.raises(SystemExit) as exc_info:
            fetch_active_subscriptions("https://fake.supabase.co", "fake_key")

        assert exc_info.value.code == 1


def test_parse_spots_count():
    """Test parsing spot counts from various status strings."""
    assert parse_spots_count("3 spots left") == 3
    assert parse_spots_count("1 spot left") == 1
    assert parse_spots_count("Full") == 0
    assert parse_spots_count("FULL - Waitlist Available") == 0
    assert parse_spots_count("More Info") == 1
    assert parse_spots_count("") == 1


def test_parse_to_iso_datetimes():
    """Test parsing formatted date and time descriptions into ISO strings."""
    date_desc = "Thu, Aug 6th, 2026"
    time_desc = "05:45 pm - 06:45 pm"
    start_iso, end_iso = parse_to_iso_datetimes(date_desc, time_desc)

    assert start_iso is not None
    assert end_iso is not None
    assert "2026-08-06T17:45:00" in start_iso
    assert "2026-08-06T18:45:00" in end_iso
