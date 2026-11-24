
from classifier import classify_email, detect_priority
from response_generator import generate_response


print("\n===== EMAIL AI ASSISTANT =====")

# 1. Get email from user
email = input("\nPaste your email here:\n")

# 2. Classify email
category, confidence = classify_email(email)

# 3. Detect priority
priority = detect_priority(email)

# 4. Generate AI response
reply = generate_response(email, category, priority)

# 5. Display results
print("\n===== EMAIL ANALYSIS =====")

print("Category:", category)
print("Confidence:", round(confidence, 2), "%")
print("Priority:", priority)

print("\n===== SUGGESTED REPLY =====")
print(reply)
