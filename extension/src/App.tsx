
import { useState } from "react";
import "./App.css";

interface AnalysisResult {
  category: string;
  confidence: number;
  priority: string;
  reply: string;
}

interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

declare const chrome: {
  runtime: {
    sendMessage: (
      message: { action: string },
      callback: (response: {
        success: boolean;
        emails?: GmailEmail[];
        error?: string;
      }) => void
    ) => void;
    lastError?: { message: string };
  };
};

function App() {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [selectedEmail, setSelectedEmail] =
    useState<GmailEmail | null>(null);

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // Fetch emails from Gmail
  const fetchEmails = () => {
    setFetching(true);
    setError("");

    chrome.runtime.sendMessage(
      { action: "FETCH_GMAIL_EMAILS" },
      (response) => {
        setFetching(false);

        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message);
          return;
        }

        if (!response?.success) {
          setError(response?.error || "Unable to fetch Gmail emails");
          return;
        }

        setEmails(response.emails || []);
        setSelectedEmail(null);
        setResult(null);
        setEmail("");
      }
    );
  };

  // Select an email
  const selectEmail = (mail: GmailEmail) => {
    setSelectedEmail(mail);

    setEmail(
      `From: ${mail.from}\nSubject: ${mail.subject}\n\n${mail.body}`
    );

    setResult(null);
    setError("");
  };

  // Analyze selected email
  const analyzeEmail = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze email");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      <header className="navbar">
        <h2>MailMind AI</h2>
        <span>AI Email Assistant</span>
      </header>

      <main className="container">

        <h1>Email Intelligence</h1>

        <p>
          Analyze emails, detect priority and generate
          smart replies using AI.
        </p>

        {/* Gmail Integration */}

        <div className="email-card">

          <h3>Gmail Integration</h3>

          <button
            onClick={fetchEmails}
            disabled={fetching}
          >
            {fetching
              ? "Connecting / Fetching..."
              : "Connect Gmail & Fetch Emails"}
          </button>

          {emails.length > 0 && (
            <p>
              Successfully fetched {emails.length} emails.
            </p>
          )}

          {emails.map((mail) => (
            <div
              key={mail.id}
              onClick={() => selectEmail(mail)}
              style={{
                padding: "12px",
                marginTop: "10px",
                border: "1px solid #ddd",
                borderRadius: "10px",
                cursor: "pointer",
                background:
                  selectedEmail?.id === mail.id
                    ? "#e9e7ff"
                    : "#ffffff",
                color: "#20263a",
              }}
            >
              <strong>{mail.subject || "(No Subject)"}</strong>

              <p style={{ margin: "5px 0" }}>
                {mail.from}
              </p>

              <small>{mail.date}</small>
            </div>
          ))}

        </div>

        {/* Manual or Selected Email */}

        <div className="email-card">

          <h3>
            {selectedEmail
              ? "Selected Gmail Email"
              : "Paste your email"}
          </h3>

          <textarea
            placeholder="Paste your email content here..."
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSelectedEmail(null);
            }}
          />

          <button
            onClick={analyzeEmail}
            disabled={!email.trim() || loading}
          >
            {loading ? "Analyzing..." : "Analyze Email"}
          </button>

          {error && (
            <p className="error">{error}</p>
          )}

        </div>

        {/* Analysis Results */}

        {result && (
          <div className="results">

            <h2>Email Analysis</h2>

            <div className="result-grid">

              <div className="result-box">
                <span>Category</span>
                <h3>{result.category}</h3>
              </div>

              <div className="result-box">
                <span>Confidence</span>
                <h3>{result.confidence}%</h3>
              </div>

              <div className="result-box">
                <span>Priority</span>
                <h3>{result.priority}</h3>
              </div>

            </div>

            <div className="reply-box">

              <h3>Suggested AI Reply</h3>

              <p>{result.reply}</p>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(result.reply)
                }
              >
                Copy Reply
              </button>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;
