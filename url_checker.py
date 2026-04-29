import re
from urllib.parse import urlparse

def check_url(url):
    """
    Checks a URL for phishing characteristics and returns a score and reasons.
    """
    score = 0
    reasons = []

    # Check 0: Known Malicious Blacklist (Red Alert)
    # Even if the URL looks safe (HTTPS, no keywords), if it's on this list, it will be flagged.
    known_bad_domains = [
        "malicious-site.com", 
        "fake-paypal-login.com", 
        "free-iphone-winner.net", 
        "totally-not-a-scam.org"
    ]
    
    # Try to extract domain
    try:
        domain = urlparse(url).netloc.lower()
    except:
        domain = ""

    # If domain is in blacklist or URL contains the malicious string
    if domain in known_bad_domains or any(bad in url.lower() for bad in known_bad_domains):
        return {
            "status": "Phishing",
            "score": 5,
            "reasons": ["RED ALERT: This website is a known malicious site on our blacklist!"]
        }

    # Check 1: HTTPS vs HTTP
    if url.startswith("http://"):
        score += 1
        reasons.append("Uses HTTP instead of secure HTTPS.")

    # Check 2: Suspicious Keywords
    suspicious_keywords = ["login", "secure", "bank", "verify", "update", "account", "signin"]
    found_keywords = [kw for kw in suspicious_keywords if kw in url.lower()]
    if found_keywords:
        score += 1
        reasons.append(f"Contains suspicious keywords: {', '.join(found_keywords)}.")

    # Check 3: URL Length
    if len(url) > 75:
        score += 1
        reasons.append("URL is suspiciously long (over 75 characters).")

    # Check 4: IP Address instead of Domain
    try:
        domain = urlparse(url).netloc
        # Regex to check if domain is an IPv4 address
        if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", domain):
            score += 2
            reasons.append("Uses an IP address instead of a domain name.")
    except:
        pass

    # Cap score at 5
    score = min(score, 5)

    # Determine status based on score
    if score == 0:
        status = "Safe"
    elif score <= 2:
        status = "Suspicious"
    else:
        status = "Phishing"
    
    # Generate default message if safe
    if score == 0:
        reasons.append("No obvious signs of phishing detected.")

    return {
        "status": status,
        "score": score,
        "reasons": reasons
    }
