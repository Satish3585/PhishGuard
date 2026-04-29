import re

def check_email(email_content):
    """
    Checks an email's content for phishing characteristics and returns a score and reasons.
    """
    score = 0
    reasons = []

    # Check 1: Urgent words
    urgent_words = [
        "urgent", "immediate action required", "alert", "warning", 
        "account suspended", "verify your account", "password expires"
    ]
    
    content_lower = email_content.lower()
    found_urgent = [word for word in urgent_words if word in content_lower]
    
    if found_urgent:
        score += 2
        reasons.append("Contains urgent language designed to create panic.")

    # Check 2: Suspicious Links (hidden or IP based)
    # Looking for links or IP addresses in the text
    if "http://" in content_lower:
        score += 1
        reasons.append("Contains non-secure (HTTP) links.")
        
    if re.search(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", content_lower):
        score += 2
        reasons.append("Contains raw IP addresses, which is unusual for legitimate emails.")

    # Check 3: Missing personalization / generic greeting
    generic_greetings = ["dear customer", "dear user", "valued member", "attention user"]
    if any(greeting in content_lower for greeting in generic_greetings):
        score += 1
        reasons.append("Uses a generic greeting instead of your name.")

    # Cap score at 5
    score = min(score, 5)

    if score == 0:
        status = "Safe"
    elif score <= 2:
        status = "Suspicious"
    else:
        status = "Phishing"
    
    if score == 0:
        reasons.append("No obvious signs of phishing detected.")

    return {
        "status": status,
        "score": score,
        "reasons": reasons
    }
