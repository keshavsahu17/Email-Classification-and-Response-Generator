
// MailMind AI - Gmail Integration

// Get Google OAuth access token
function getGoogleToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(
      { interactive: true },
      (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!token) {
          reject(new Error("Google authentication failed."));
          return;
        }

        resolve(token);
      }
    );
  });
}

// Decode Gmail message body
function decodeBody(data) {
  if (!data) return "";

  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

// Extract email text from Gmail payload
function extractEmailBody(payload) {
  if (payload.body?.data) {
    return decodeBody(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBody(part.body.data);
      }
    }

    for (const part of payload.parts) {
      if (part.parts) {
        const body = extractEmailBody(part);
        if (body) return body;
      }
    }
  }

  return "";
}

// Fetch latest five Gmail messages
async function fetchGmailEmails() {
  const token = await getGoogleToken();

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status}`);
  }

  const data = await response.json();
  const messages = data.messages || [];

  const emails = await Promise.all(
    messages.map(async (message) => {
      const result = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!result.ok) {
        throw new Error("Could not retrieve an email.");
      }

      const email = await result.json();

      const headers = email.payload.headers;

      const getHeader = (name) =>
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      return {
        id: email.id,
        subject: getHeader("Subject"),
        from: getHeader("From"),
        date: getHeader("Date"),
        body: extractEmailBody(email.payload)
      };
    })
  );

  return emails;
}

// Listen for requests from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_GMAIL_EMAILS") {
    fetchGmailEmails()
      .then(emails => sendResponse({
        success: true,
        emails
      }))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));

    return true;
  }
});
