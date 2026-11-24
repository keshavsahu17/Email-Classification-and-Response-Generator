
from sklearn.model_selection import cross_val_score
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


# 1. Load our email dataset
data = pd.read_csv("dataset.csv")

X = data["email"]
y = data["category"]


# 2. Create our ML pipeline
model = Pipeline([
    ("tfidf", TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2)
    )),

    ("classifier", LogisticRegression(
        max_iter=1000
    ))
])


# 3. Evaluate the model

scores = cross_val_score(
    model,
    X,
    y,
    cv=4,
    scoring="accuracy"
)

print("Model Evaluation")
print("Accuracy:", round(scores.mean() * 100, 2), "%")


# 4. Train the model on complete dataset

model.fit(X, y)

print("Email classification model trained successfully!")


# 5. Create prediction function
def classify_email(email):

    prediction = model.predict([email])[0]

    probabilities = model.predict_proba([email])[0]

    confidence = max(probabilities) * 100

    return prediction, confidence

# Priority Detection

def detect_priority(email):

    email = email.lower()

    high_priority_words = [
        "urgent",
        "immediately",
        "as soon as possible",
        "account blocked",
        "payment overdue",
        "deadline today",
        "security alert",
        "action required"
    ]

    medium_priority_words = [
        "please confirm",
        "response required",
        "meeting scheduled",
        "deadline tomorrow",
        "reminder",
        "please respond"
    ]

    for word in high_priority_words:
        if word in email:
            return "High"

    for word in medium_priority_words:
        if word in email:
            return "Medium"

    return "Low"



# 6. Test our model
if __name__ == "__main__":

    test_email = """
Enjoy our latest collection.
Get 30 percent discount on all products.
"""

    category, confidence = classify_email(test_email)
    priority = detect_priority(test_email)

    print("\nEmail:", test_email)
    print("Predicted Category:", category)
    print("Confidence:", round(confidence, 2), "%")
    print("Priority:", priority)
