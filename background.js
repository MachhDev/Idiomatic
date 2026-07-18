(function () {
  "use strict";

  const API_URL = "http://localhost:8000/suggest-idiom";
  const FETCH_TIMEOUT_MS = 90000;

  async function requestSuggestions(payload) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: abortController.signal
      });
      if (!response.ok) {
        return {
          suggestions: [],
          message: `Local idiom backend returned ${response.status}.`
        };
      }
      const data = await response.json();
      return {
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        message: data.fallback_message || ""
      };
    } catch (error) {
      return {
        suggestions: [],
        message: "Local idiom backend is not connected. Start the backend, then keep typing."
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "suggest-idiom") {
      return false;
    }

    requestSuggestions(message.payload)
      .then(sendResponse)
      .catch(() => {
        sendResponse({
          suggestions: [],
          message: "Local idiom backend is not connected. Start the backend, then keep typing."
        });
      });
    return true;
  });
})();
