
import { useState } from "react";
import "./App.css";

interface AnalysisResult {
  category: string;
  confidence: number;
  priority: string;
  reply: string;
}

function App() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeEmail = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze email");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
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

        <div className="email-card">
          <h3>Paste your email</h3>

          <textarea
            placeholder="Paste your email content here..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={analyzeEmail}
            disabled={!email.trim() || loading}
          >
            {loading ? "Analyzing..." : "Analyze Email"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>

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
