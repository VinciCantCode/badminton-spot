#!/usr/bin/env python3
import argparse
import re
import sys
from datetime import datetime
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
    try:
        with open("config.json", "r", encoding="utf-8") as f:
            file_config = json.load(f)
            # Ensure types are correct
            if "smtp_port" in file_config:
                file_config["smtp_port"] = int(file_config["smtp_port"])
            if "monitor_interval_seconds" in file_config:
                file_config["monitor_interval_seconds"] = int(file_config["monitor_interval_seconds"])
            return file_config
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"Warning: Error reading config.json: {e}", file=sys.stderr)
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

    if not sender or not password or not receiver:
        print("Error: Missing email settings in config.json.", file=sys.stderr)
        return False

    subject = "【NVRC 羽毛球场预订提醒】发现新的空余场次！"

    # Create HTML table for slots
    table_rows = ""
    for slot in new_slots:
        table_rows += f"""
        <tr>
            <td style="border:1px solid #ddd; padding:8px;">{slot[0]}</td>
            <td style="border:1px solid #ddd; padding:8px;">{slot[1]}</td>
            <td style="border:1px solid #ddd; padding:8px;">{slot[2]}</td>
            <td style="border:1px solid #ddd; padding:8px;">{slot[3]}</td>
            <td style="border:1px solid #ddd; padding:8px; font-weight:bold; color:#2e7d32;">{slot[4]}</td>
            <td style="border:1px solid #ddd; padding:8px;">{slot[5]}</td>
        </tr>
        """

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h3 style="color: #2e7d32;">🏸 系统监测到有符合条件的羽毛球场次开放预订或有人退订：</h3>
        <table style="border-collapse:collapse; width:100%; font-family:sans-serif; border: 1px solid #ddd;">
            <thead>
                <tr style="background-color:#f2f2f2;">
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">日期</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">时间</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">场馆位置</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">活动名称</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">空余状态</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:left;">价格</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>
        <br/>
        <p>预订链接：<a href="{BOOKING_PAGE_URL}" style="color: #1a73e8; font-weight: bold; text-decoration: none;">直接前往 NVRC PerfectMind 预订网页</a></p>
        <p style="font-size:12px; color:#888; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">此邮件由羽毛球监控爬虫自动发送，请勿直接回复。</p>
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
        slot_datetime = datetime.strptime(datetime_str, "%b %d, %Y %I:%M %p")
        return slot_datetime < datetime.now()
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

def main():
    parser = argparse.ArgumentParser(description="NVRC Badminton Court Booking Scraper & Monitor")
    parser.add_argument("-l", "--location", nargs="+", help="Filter by locations (space separated, e.g., Delbrook JBCC)")
    parser.add_argument("-d", "--days", nargs="+", help="Filter by day of week (e.g. Tuesday Thursday)")
    parser.add_argument("-a", "--available", action="store_true", help="Only show available slots (i.e. not Full)")
    parser.add_argument("-s", "--my-schedule", action="store_true", help="Filter by personal schedule (Workdays M-F after 6:00 PM, Weekends Sat-Sun anytime)")
    parser.add_argument("-m", "--monitor", action="store_true", help="Enable continuous monitoring mode with email notifications")
    args = parser.parse_args()

    config = load_config()

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
