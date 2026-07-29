#!/usr/bin/env python3
import argparse
import re
import sys
from datetime import datetime, tzinfo, timedelta, timezone
import requests
import json
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from bs4 import BeautifulSoup
from tabulate import tabulate

# Hardcoded IDs for NVRC Badminton Court Booking
CALENDAR_ID = "107644e1-183f-4052-a809-52e13ec76293"
WIDGET_ID = "a28b2c65-61af-407f-80d1-eaa58f30a94a"
SERVICE_ID = "7ec04f89-f943-4b6e-8a9b-a1d64376bd53"

BASE_URL = "https://nvrc.perfectmind.com"
BOOKING_PAGE_URL = f"{BASE_URL}/23734/Clients/BookMe4BookingPages/BookingCoursesPage?calendarId={CALENDAR_ID}&widgetId={WIDGET_ID}&embed=False"
COURSES_API_URL = f"{BASE_URL}/23734/Clients/BookMe4BookingPagesV2/CoursesV2"
SENT_ALERTS_FILE = "sent_alerts.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest"
}

def load_config():
    """Reads email server settings from environment variables or config.json."""
    import os
    # Try reading from environment variables first (useful for GitHub Secrets)
    sender_email = os.environ.get("SENDER_EMAIL")
    sender_password = os.environ.get("SENDER_PASSWORD")
    receiver_email = os.environ.get("RECEIVER_EMAIL")
    
    if sender_email and sender_password and receiver_email:
        try:
            port = int(os.environ.get("SMTP_PORT", 587))
        except ValueError:
            port = 587
        try:
            interval = int(os.environ.get("MONITOR_INTERVAL_SECONDS", 300))
        except ValueError:
            interval = 300
            
        return {
            "smtp_server": os.environ.get("SMTP_SERVER", "smtp.gmail.com"),
            "smtp_port": port,
            "sender_email": sender_email,
            "sender_password": sender_password,
            "receiver_email": receiver_email,
            "monitor_interval_seconds": interval
        }

    # Otherwise fallback to config.json
    paths = ["config.json", "backend/config.json", "../config.json"]
    for path in paths:
        try:
            with open(path, "r", encoding="utf-8") as f:
                file_config = json.load(f)
                # Ensure types are correct
                if "smtp_port" in file_config:
                    file_config["smtp_port"] = int(file_config["smtp_port"])
                if "monitor_interval_seconds" in file_config:
                    file_config["monitor_interval_seconds"] = int(file_config["monitor_interval_seconds"])
                return file_config
        except FileNotFoundError:
            continue
        except Exception as e:
            print(f"Warning: Error reading {path}: {e}", file=sys.stderr)
            return None
    return None

def load_sent_alerts():
    """Reads sent alerts history to prevent duplicates."""
    try:
        with open(SENT_ALERTS_FILE, "r", encoding="utf-8") as f:
            return set(json.load(f))
    except (FileNotFoundError, json.JSONDecodeError):
        return set()

def save_sent_alerts(alerts):
    """Saves sent alerts history to a local JSON file."""
    try:
        with open(SENT_ALERTS_FILE, "w", encoding="utf-8") as f:
            json.dump(list(alerts), f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Warning: Error writing {SENT_ALERTS_FILE}: {e}", file=sys.stderr)

def send_email_notification(config, new_slots):
    """Sends email notification using SMTP settings in config.json."""
    if not config:
        print("Error: config.json is required to send emails.", file=sys.stderr)
        return False

    sender = config.get("sender_email")
    password = config.get("sender_password")
    receiver = config.get("receiver_email")
    server_addr = config.get("smtp_server", "smtp.gmail.com")
    port = config.get("smtp_port", 587)
    token = config.get("unsubscribe_token")

    if not sender or not password or not receiver:
        print("Error: Missing email settings in config.json.", file=sys.stderr)
        return False

    subject = "[BadmintonSpot] New Court Availability Detected!"

    # Create HTML table for slots
    table_rows = ""
    for slot in new_slots:
        booking_link = slot[6] if len(slot) > 6 else BOOKING_PAGE_URL
        table_rows += f"""
        <tr>
            <td style="border:1px solid #ddd; padding:8px;">{slot[0]}</td>
            <td style="border:1px solid #ddd; padding:8px;">{slot[1]}</td>
            <td style="border:1px solid #ddd; padding:8px;">{slot[2]}</td>
            <td style="border:1px solid #ddd; padding:8px;">{slot[3]}</td>
            <td style="border:1px solid #ddd; padding:8px; font-weight:bold; color:#2e7d32;">{slot[4]}</td>
            <td style="border:1px solid #ddd; padding:8px;">{slot[5]}</td>
            <td style="border:1px solid #ddd; padding:8px; text-align:center;">
                <a href="{booking_link}" target="_blank" style="background-color: #84cc16; color: #000; padding: 6px 12px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Book Now</a>
            </td>
        </tr>
        """

    unsubscribe_footer = ""
    if token:
        unsubscribe_footer = f'<br/>Want to stop receiving alerts? <a href="https://badminton-spot.vercel.app/?unsubscribe={token}" style="color: #ef4444; text-decoration: underline;">Unsubscribe here</a>.'


    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h3 style="color: #2e7d32;">🏸 System detected available court slots matching your criteria:</h3>
        <table style="border-collapse:collapse; width:100%; font-family:sans-serif; border: 1px solid #ddd;">
            <thead>
                <tr style="background-color:#f2f2f2;">
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">Date</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">Time</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">Location</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">Activity</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">Availability</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">Price</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:center;">Direct Action</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>

        <br/>
        <p>Booking link: <a href="{BOOKING_PAGE_URL}" style="color: #1a73e8; font-weight: bold; text-decoration: none;">Book Now on NVRC PerfectMind</a></p>
        <p style="font-size:12px; color:#888; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            This is an automated notification from BadmintonSpot. Please do not reply to this email.{unsubscribe_footer}
        </p>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = receiver
    msg.attach(MIMEText(html, "html"))

    print(f"Connecting to SMTP server {server_addr}:{port} to send notification email...")
    try:
        server = smtplib.SMTP(server_addr, port)
        server.starttls()
        server.login(sender, password)
        server.sendmail(sender, receiver, msg.as_string())
        server.quit()
        print("Notification email sent successfully!")
        return True
    except Exception as e:
        print(f"Error sending email: {e}", file=sys.stderr)
        return False

def fetch_anti_forgery_token(session):
    """Fetches the main booking page and extracts the __RequestVerificationToken."""
    try:
        response = session.get(BOOKING_PAGE_URL, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching the booking page: {e}", file=sys.stderr)
        return None

    soup = BeautifulSoup(response.text, 'html.parser')
    token_input = soup.find("input", {"name": "__RequestVerificationToken"})
    if not token_input or not token_input.get("value"):
        print("Error: Could not find __RequestVerificationToken on the booking page.", file=sys.stderr)
        return None
    
    return token_input.get("value")

def fetch_booking_courses(session, token):
    """Sends the POST request to the CoursesV2 API to fetch badminton booking slots."""
    payload = {
        "calendarId": CALENDAR_ID,
        "widgetId": WIDGET_ID,
        "page": "0",
        "bookingMode": "0",
        "__RequestVerificationToken": token,
        "values[0][Name]": "Services",
        "values[0][Value]": SERVICE_ID,
        "values[0][ValueKind]": "Program"
    }

    try:
        response = session.post(COURSES_API_URL, headers=HEADERS, data=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data.get("courses", [])
    except Exception as e:
        print(f"Error fetching booking courses: {e}", file=sys.stderr)
        return []

def parse_day_from_date(formatted_date):
    """Helper to extract day of week from formatted date (e.g. 'Tue, Jun 30th, 2026' -> 'Tuesday')."""
    days_map = {
        "mon": "Monday",
        "tue": "Tuesday",
        "wed": "Wednesday",
        "thu": "Thursday",
        "fri": "Friday",
        "sat": "Saturday",
        "sun": "Sunday"
    }
    match = re.match(r"^([A-Za-z]+),", formatted_date)
    if match:
        prefix = match.group(1).lower()
        return days_map.get(prefix, prefix.capitalize())
    return ""

def is_after_6pm(time_str):
    """Checks if a time string like '04:30 PM' or '06:00 PM' is at or after 6:00 PM (18:00)."""
    match = re.match(r"^(\d+):(\d+)\s*(AM|PM)$", time_str, re.IGNORECASE)
    if not match:
        return False
    hour = int(match.group(1))
    minute = int(match.group(2))
    meridiem = match.group(3).upper()

    # Convert to 24-hour hour
    if meridiem == "PM" and hour != 12:
        hour += 12
    elif meridiem == "AM" and hour == 12:
        hour = 0

    return hour >= 18

def is_past_slot(date_desc, start_time_str):
    """Checks if a slot's date and start time have already passed relative to local time."""
    try:
        # Clean the ordinal suffixes (st, nd, rd, th) from date_desc (e.g. 'Thu, Jul 2nd, 2026' -> 'Thu, Jul 2, 2026')
        cleaned_date = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', date_desc)
        # Extract the date part (after the first comma)
        if ',' in cleaned_date:
            date_part = cleaned_date.split(',', 1)[1].strip()
        else:
            date_part = cleaned_date.strip()
            
        datetime_str = f"{date_part} {start_time_str}"
        slot_datetime = datetime.strptime(datetime_str, "%b %d, %Y %I:%M %p").replace(tzinfo=vancouver_tz)
        now_vancouver = datetime.now(vancouver_tz)
        return slot_datetime < now_vancouver
    except Exception:
        return False

def process_scraping(args, config, sent_alerts):
    """Runs a single scraping cycle, parses filters, and detects new slots."""
    session = requests.Session()
    token = fetch_anti_forgery_token(session)
    if not token:
        print("Failed to obtain anti-forgery token in this cycle.", file=sys.stderr)
        return [], []

    courses = fetch_booking_courses(session, token)
    if not courses:
        print("No courses returned from the API in this cycle.")
        return [], []

    matched_slots = []
    new_alerts = []

    for c in courses:
        location = c.get("Location", "")
        event_name = c.get("EventName", "")
        time_desc = c.get("EventTimeDescription", "")
        date_desc = c.get("FormattedStartDate", "")
        formatted_start_time = c.get("FormattedStartTime", "")
        spots = c.get("Spots", "").strip()
        price = c.get("PriceRange", "")
        button_text = c.get("BookButtonText", "")
        event_id = c.get("EventId", "")
        course_id = c.get("CourseId") or c.get("CourseIdTrimmed") or ""
        booking_url = f"{BASE_URL}/23734/Clients/BookMe4LandingPages/CoursesLandingPage?widgetId={WIDGET_ID}&redirectedFromEmbededMode=False&courseId={event_id}"


        # Determine readable status
        if spots == "Full":
            status = "FULL (No waitlist)"
        elif spots == "FULL - Waitlist Available":
            status = "FULL (Waitlist Available)"
        elif not spots:
            status = "Available (Click More Info / Book)"
        else:
            status = f"Available ({spots})"

        # 0. Skip slots that have already started (are in the past)
        if formatted_start_time and date_desc:
            if is_past_slot(date_desc, formatted_start_time):
                continue

        # 1. Skip slots that are not yet open for registration (button is "More Info" and spots is empty)
        if button_text == "More Info" and not spots:
            continue

        # 2. Check if the slots are actual badminton courts
        if "Badminton" not in event_name:
            continue

        # 3. Location filter
        if args.location:
            matched_loc = False
            for loc_filter in args.location:
                if loc_filter.lower() in location.lower():
                    matched_loc = True
                    break
            if not matched_loc:
                continue

        # 4. Available filter
        if args.available and spots in ["Full", "FULL - Waitlist Available"]:
            continue

        # 5. Day of week filter
        day_of_week = parse_day_from_date(date_desc)
        if args.days:
            days_lower = [d.lower() for d in args.days]
            matched_day = False
            for d in days_lower:
                if d in day_of_week.lower():
                    matched_day = True
                    break
            if not matched_day:
                continue

        # 6. Personal schedule filter
        if args.my_schedule:
            is_weekday = day_of_week in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            if is_weekday and not is_after_6pm(formatted_start_time):
                continue

        slot_info = [date_desc, time_desc, location, event_name, status, price, button_text]
        matched_slots.append(slot_info)

        # 7. Deduplication logic: Alert key contains EventId and current Spots value
        # If availability changes, it will trigger a new alert.
        spots_key = spots if spots else "Available"
        alert_key = f"{event_id}:{spots_key}"
        if alert_key not in sent_alerts:
            new_alerts.append(slot_info)
            sent_alerts.add(alert_key)

    return matched_slots, new_alerts

def load_env_file():
    """Loads environment variables from .env file into os.environ if it exists."""
    import os
    # Try to find .env in current directory, backend directory, or parent directory
    paths = [".env", "backend/.env", "../.env"]
    for p in paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, val = line.split("=", 1)
                            # Strip quotes if present
                            val = val.strip().strip('"').strip("'")
                            os.environ[key.strip()] = val
                break
            except Exception as e:
                print(f"Warning: Error loading .env file from {p}: {e}", file=sys.stderr)

class PacificTimezone(tzinfo):
    def utcoffset(self, dt):
        if dt is None:
            return timedelta(hours=-8)
        # DST in Canada: starts second Sunday of March, ends first Sunday of November.
        # Simple approximation of DST (April to October is UTC-7, November to March is UTC-8).
        if 3 < dt.month < 11:
            return timedelta(hours=-7)
        return timedelta(hours=-8)

    def dst(self, dt):
        if 3 < dt.month < 11:
            return timedelta(hours=1)
        return timedelta(0)

    def tzname(self, dt):
        return "Pacific Time"

vancouver_tz = PacificTimezone()

def parse_to_iso_datetimes(date_desc, time_desc):
    """Parses date_desc and time_desc into ISO-8601 string representations for start_time and end_time.
    e.g. date_desc = "Fri, Jul 3rd, 2026", time_desc = "06:45 pm - 07:45 pm"
    """
    try:
        # Clean ordinal suffixes
        cleaned_date = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', date_desc)
        if ',' in cleaned_date:
            date_part = cleaned_date.split(',', 1)[1].strip()
        else:
            date_part = cleaned_date.strip()

        times = [t.strip() for t in time_desc.split('-')]
        start_time_str = times[0]
        end_time_str = times[1] if len(times) > 1 else times[0]

        start_dt_str = f"{date_part} {start_time_str}"
        start_dt = datetime.strptime(start_dt_str, "%b %d, %Y %I:%M %p").replace(tzinfo=vancouver_tz)
        
        end_dt_str = f"{date_part} {end_time_str}"
        end_dt = datetime.strptime(end_dt_str, "%b %d, %Y %I:%M %p").replace(tzinfo=vancouver_tz)

        return start_dt.isoformat(), end_dt.isoformat()
    except Exception as e:
        print(f"Error parsing datetime to ISO: {e}", file=sys.stderr)
        return None, None

def parse_spots_count(spots):
    """Extracts numeric spot count from spots string."""
    if not spots:
        # If spots is empty, it means "Available (Book)" without a count
        return 1
    if "Full" in spots or "FULL" in spots:
        return 0
    match = re.search(r'\d+', spots)
    if match:
        return int(match.group())
    if "Available" in spots or "Book" in spots or "More Info" in spots:
        return 1
    return 0

def fetch_active_subscriptions(supabase_url, supabase_key):
    """Fetches all active subscriptions from Supabase."""
    url = f"{supabase_url}/rest/v1/subscriptions?is_active=eq.true"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching active subscriptions from Supabase: {e}", file=sys.stderr)
        return []

def upsert_slots_to_supabase(supabase_url, supabase_key, slots):
    """Upserts list of slots into Supabase 'slots' table."""
    if not slots:
        return
    url = f"{supabase_url}/rest/v1/slots"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    try:
        response = requests.post(url, headers=headers, json=slots, timeout=15)
        response.raise_for_status()
        print(f"Successfully upserted {len(slots)} slots to Supabase.")
    except Exception as e:
        print(f"Error upserting slots to Supabase: {e}", file=sys.stderr)
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response details: {e.response.text}", file=sys.stderr)

def purge_expired_slots_from_supabase(supabase_url, supabase_key):
    """Deletes slots from Supabase 'slots' table where end_time has passed relative to current time."""
    if not supabase_url or not supabase_key:
        return
    url = f"{supabase_url}/rest/v1/slots"
    now_iso = datetime.now(timezone.utc).isoformat()
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    try:
        delete_url = f"{url}?end_time=lt.{requests.utils.quote(now_iso)}"
        response = requests.delete(delete_url, headers=headers, timeout=15)
        response.raise_for_status()
        print("Successfully purged expired slots from Supabase database.")
    except Exception as e:
        print(f"Error purging expired slots from Supabase: {e}", file=sys.stderr)


def try_log_alert_history(supabase_url, supabase_key, subscription_id, event_id, spots_count):
    """Tries to log a sent notification in Supabase 'alert_history'.
    Returns True if the insert succeeded (meaning it's a new alert).
    Returns False if it failed or conflicted (meaning alert already sent).
    """
    url = f"{supabase_url}/rest/v1/alert_history"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "subscription_id": subscription_id,
        "event_id": event_id,
        "spots_count": spots_count
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 201:
            return True
        elif response.status_code == 409:
            # 409 Conflict: Already exists (unique constraint violated)
            return False
        else:
            # Other errors (e.g. invalid foreign keys)
            print(f"Alert history log returned status {response.status_code}: {response.text}", file=sys.stderr)
            return False
    except Exception as e:
        print(f"Error logging alert history in Supabase: {e}", file=sys.stderr)
        return False

def check_time_in_range(start_time_iso, min_time_str, max_time_str):
    """Checks if a slot's ISO start time is within the min and max time range strings (e.g. '18:00:00')."""
    try:
        # Extract the time part from ISO string (e.g., '2026-07-10T18:45:00-07:00' -> '18:45:00')
        dt = datetime.fromisoformat(start_time_iso)
        slot_time = dt.time()
        
        # Parse boundary times
        min_time = datetime.strptime(min_time_str, "%H:%M:%S").time()
        max_time = datetime.strptime(max_time_str, "%H:%M:%S").time()
        
        return min_time <= slot_time <= max_time
    except Exception as e:
        print(f"Error checking time range: {e}", file=sys.stderr)
        return False

def run_supabase_monitor_cycle(config, supabase_url, supabase_key):
    """Runs a single scraper cycle in Supabase multi-user mode."""
    # 1. Fetch active subscriptions
    subscriptions = fetch_active_subscriptions(supabase_url, supabase_key)
    if not subscriptions:
        print("No active subscriptions found in Supabase. Only updating slots dashboard.")

    # 2. Scrape raw courses from PerfectMind
    session = requests.Session()
    token = fetch_anti_forgery_token(session)
    if not token:
        print("Failed to obtain anti-forgery token in this cycle.", file=sys.stderr)
        return

    courses = fetch_booking_courses(session, token)
    if not courses:
        print("No courses returned from the API in this cycle.")
        return

    # 3. Parse and process all scraped slots
    all_slots_payload = []
    available_slots = [] # parsed structures for matchmaking
    
    for c in courses:
        location = c.get("Location", "")
        event_name = c.get("EventName", "")
        time_desc = c.get("EventTimeDescription", "")
        date_desc = c.get("FormattedStartDate", "")
        formatted_start_time = c.get("FormattedStartTime", "")
        spots = c.get("Spots", "").strip()
        price_str = c.get("PriceRange", "").replace("$", "").strip()
        button_text = c.get("BookButtonText", "")
        event_id = c.get("EventId", "")
        course_id = c.get("CourseId") or c.get("CourseIdTrimmed") or ""
        booking_url = f"{BASE_URL}/23734/Clients/BookMe4LandingPages/CoursesLandingPage?widgetId={WIDGET_ID}&redirectedFromEmbededMode=False&courseId={event_id}"


        # Skip slots that are not actual badminton courts
        if "Badminton" not in event_name:
            continue

        # Skip slots that are not yet open for registration
        if button_text == "More Info" and not spots:
            continue

        # Parse prices
        try:
            price = float(price_str)
        except ValueError:
            price = 16.36 # default standard price

        # Parse spots count
        spots_count = parse_spots_count(spots)

        # Parse ISO start and end times
        start_time_iso, end_time_iso = parse_to_iso_datetimes(date_desc, time_desc)
        if not start_time_iso or not end_time_iso:
            continue

        # Skip past slots
        if is_past_slot(date_desc, formatted_start_time):
            continue

        # Prepare payload for Supabase slots table
        slot_payload = {
            "event_id": event_id,
            "course_id": course_id,
            "event_name": event_name,
            "location_name": location,
            "date_desc": date_desc,
            "start_time": start_time_iso,
            "end_time": end_time_iso,
            "spots": spots if spots else "Available",
            "spots_count": spots_count,
            "price": price,
            "button_text": button_text,
            "last_updated": datetime.now().astimezone().isoformat()
        }
        all_slots_payload.append(slot_payload)

        # If it is available, add to available_slots list for matchmaking
        if spots_count > 0:
            available_slots.append(slot_payload)

    # 4. Upsert all slots into Supabase and purge expired ones
    if supabase_url and supabase_key:
        if all_slots_payload:
            upsert_slots_to_supabase(supabase_url, supabase_key, all_slots_payload)
        purge_expired_slots_from_supabase(supabase_url, supabase_key)

        
        # Also print to stdout for monitoring visibility
        headers = ["Date", "Time", "Location", "Event Name", "Status", "Price", "Action Button"]
        formatted_table = []
        for s in all_slots_payload:
            time_range = f"{datetime.fromisoformat(s['start_time']).strftime('%I:%M %p').lower()} - {datetime.fromisoformat(s['end_time']).strftime('%I:%M %p').lower()}"
            formatted_table.append([
                s["date_desc"],
                time_range,
                s["location_name"],
                s["event_name"],
                s["spots"],
                f"${s['price']:.2f}",
                s["button_text"]
            ])
        print(f"\nFound {len(all_slots_payload)} booking slots (also synced to Supabase):\n")
        print(tabulate(formatted_table, headers=headers, tablefmt="grid"))

    # 5. Perform matchmaking and build email alerts grouped by receiver email
    email_alerts = {} # map: email -> { "slots": list, "token": str }
    
    for sub in subscriptions:
        sub_id = sub.get("id")
        sub_email = sub.get("email")
        sub_token = sub.get("unsubscribe_token", "")
        pref_locations = sub.get("locations", [])
        pref_weekdays = sub.get("weekdays", [])
        start_min = sub.get("start_time_min", "00:00:00")
        start_max = sub.get("start_time_max", "23:59:59")

        for slot in available_slots:
            # Match Location
            loc_match = False
            for loc in pref_locations:
                if loc.lower() in slot["location_name"].lower():
                    loc_match = True
                    break
            if not loc_match and pref_locations: # If pref_locations is empty, default to match all
                continue

            # Match Weekday
            day_of_week = parse_day_from_date(slot["date_desc"])
            day_match = False
            for day in pref_weekdays:
                if day.lower() in day_of_week.lower():
                    day_match = True
                    break
            if not day_match and pref_weekdays: # If pref_weekdays is empty, default to match all
                continue

            # Match Time Range
            if not check_time_in_range(slot["start_time"], start_min, start_max):
                continue

            # If all match, try to write to alert_history (atomically checking deduplication)
            if try_log_alert_history(supabase_url, supabase_key, sub_id, slot["event_id"], slot["spots_count"]):
                # Succeeded! This is a new alert.
                if sub_email not in email_alerts:
                    email_alerts[sub_email] = {
                        "slots": [],
                        "token": sub_token
                    }
                email_alerts[sub_email]["slots"].append(slot)

    # 6. Send batched emails
    if email_alerts:
        print(f"Detected matched alerts for {len(email_alerts)} user(s). Sending emails...")
        for recipient_email, data in email_alerts.items():
            matched_slots = data["slots"]
            unsub_token = data["token"]
            
            # Customize the receiver_email in config dynamically for sending
            user_config = config.copy()
            user_config["receiver_email"] = recipient_email
            user_config["unsubscribe_token"] = unsub_token
            
            # Format slots for the existing HTML template
            # Table columns expected by send_email_notification:
            # slot[0]=date, slot[1]=time, slot[2]=location, slot[3]=event_name, slot[4]=status, slot[5]=price
            formatted_slots = []
            for s in matched_slots:
                time_range = f"{datetime.fromisoformat(s['start_time']).strftime('%I:%M %p').lower()} - {datetime.fromisoformat(s['end_time']).strftime('%I:%M %p').lower()}"
                formatted_slots.append([
                    s["date_desc"],
                    time_range,
                    s["location_name"],
                    s["event_name"],
                    s["spots"],
                    f"${s['price']:.2f}",
                    s["booking_url"]
                ])
            
            send_email_notification(user_config, formatted_slots)
    else:
        print("No new matches found or all alerts were already notified in this cycle.")

def main():
    import os
    parser = argparse.ArgumentParser(description="NVRC Badminton Court Booking Scraper & Monitor")
    parser.add_argument("-l", "--location", nargs="+", help="Filter by locations (space separated, e.g., Delbrook JBCC)")
    parser.add_argument("-d", "--days", nargs="+", help="Filter by day of week (e.g. Tuesday Thursday)")
    parser.add_argument("-a", "--available", action="store_true", help="Only show available slots (i.e. not Full)")
    parser.add_argument("-s", "--my-schedule", action="store_true", help="Filter by personal schedule (Workdays M-F after 6:00 PM, Weekends Sat-Sun anytime)")
    parser.add_argument("-m", "--monitor", action="store_true", help="Enable continuous monitoring mode with email notifications")
    args = parser.parse_args()

    # Load environment variables from local file
    load_env_file()
    config = load_config()

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")

    if supabase_url and supabase_key:
        print("Supabase credentials found. Running in Supabase mode...")
        if args.monitor:
            interval = config.get("monitor_interval_seconds", 300) if config else 300
            print(f"Continuous Supabase monitoring started. Checking every {interval} seconds...")
            try:
                while True:
                    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
                    print(f"\n[{timestamp}] Supabase scraping cycle started...")
                    run_supabase_monitor_cycle(config, supabase_url, supabase_key)
                    print(f"Cycle finished. Sleeping for {interval} seconds...")
                    time.sleep(interval)
            except KeyboardInterrupt:
                print("\nMonitoring stopped by user.")
        else:
            run_supabase_monitor_cycle(config, supabase_url, supabase_key)
    else:
        print("Supabase credentials not found. Falling back to local CLI mode...")
        if not args.monitor:
            # Standard one-off execution
            print("Connecting to NVRC PerfectMind portal to retrieve session cookies and token...")
            sent_alerts = load_sent_alerts() if config else set()
            matched, new_alerts = process_scraping(args, config, sent_alerts)
            if not matched:
                print("\nNo slots matched your filters.")
                return
            headers = ["Date", "Time", "Location", "Event Name", "Status", "Price", "Action Button"]
            print(f"\nFound {len(matched)} booking slots:\n")
            print(tabulate(matched, headers=headers, tablefmt="grid"))

            if config and new_alerts:
                print(f"Detected {len(new_alerts)} new available/updated slot(s)!")
                if send_email_notification(config, new_alerts):
                    save_sent_alerts(sent_alerts)
        else:
            # Continuous monitoring mode
            if not config:
                print("Error: config.json is required for monitoring mode. Please check README.md for configuration instructions.", file=sys.stderr)
                sys.exit(1)
            
            interval = config.get("monitor_interval_seconds", 300)
            print(f"Continuous monitoring mode started. Checking every {interval} seconds...")
            sent_alerts = load_sent_alerts()

            try:
                while True:
                    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
                    print(f"\n[{timestamp}] Scraping cycle started...")
                    
                    matched, new_alerts = process_scraping(args, config, sent_alerts)
                    
                    if matched:
                        headers = ["Date", "Time", "Location", "Event Name", "Status", "Price", "Action Button"]
                        print(tabulate(matched, headers=headers, tablefmt="grid"))
                    else:
                        print("No slots matched your filters in this cycle.")

                    if new_alerts:
                        print(f"Detected {len(new_alerts)} new available/updated slot(s)!")
                        if send_email_notification(config, new_alerts):
                            save_sent_alerts(sent_alerts)
                    else:
                        print("No new slots to notify (no changes since last alert).")

                    print(f"Cycle finished. Sleeping for {interval} seconds...")
                    time.sleep(interval)
            except KeyboardInterrupt:
                print("\nMonitoring stopped by user.")

if __name__ == "__main__":
    main()
