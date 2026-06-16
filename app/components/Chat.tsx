"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function Chat() {
  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<"start" | "signin" | "chat">("start");
  const [incognito, setIncognito] = useState(false);

  const [listening, setListening] = useState(false);
  const [voiceScreen, setVoiceScreen] = useState(false);
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
  const savedMessages = localStorage.getItem("vibe-messages");

  if (savedMessages) {
    setMessages(JSON.parse(savedMessages));
  }
}, []);

useEffect(() => {
  if (!incognito) {
    localStorage.setItem(
      "vibe-messages",
      JSON.stringify(messages)
    );
  }
}, [messages, incognito]);
function toggleIncognito() {
  const savedPin = localStorage.getItem("vibe-incognito-pin");

  if (!incognito) {
    if (!savedPin) {
      const newPin = prompt("Create a 4-digit incognito PIN:");

      if (!newPin || !/^\d{4}$/.test(newPin)) {
        alert("PIN must be exactly 4 numbers.");
        return;
      }

      localStorage.setItem("vibe-incognito-pin", newPin);
      setMessages([]);
      setIncognito(true);
      alert("Incognito mode created and unlocked.");
      return;
    }

    const enteredPin = prompt("Enter your incognito PIN:");

    if (enteredPin !== savedPin) {
      alert("Wrong PIN.");
      return;
    }

    setMessages([]);
    setIncognito(true);
    return;
  }

  setMessages([]);
  setIncognito(false);
}
function startListening() {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognitionRef.current = recognition;

  recognition.onstart = () => {
    setListening(true);
  };

  recognition.onend = () => {
    setListening(false);
  };

  recognition.onresult = (event: any) => {
  const transcript = event.results[0][0].transcript;

 setMessage(transcript);
};

  recognition.start();
}
  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  messages: [
    ...messages,
    {
      role: "user",
      text: userMessage,
    },
  ],
}),
      });

      const data = await response.json();
console.log("VOICE TEST:", data.reply);
console.log("AI reply:", data.reply);
if (data.reply) {
  // stop any previous voice
  window.speechSynthesis.cancel();

const speechText = data.reply
  .replace(/\bMmmmm+\b/gi, "mmm...")
  .replace(/\bHmmmm+\b/gi, "hmm...");

const utterance = new SpeechSynthesisUtterance(speechText);
  await new Promise<void>((resolve) => {
  const voices = window.speechSynthesis.getVoices();

  if (voices.length) {
    resolve();
  } else {
    window.speechSynthesis.onvoiceschanged = () => resolve();
  }
});

const voices = window.speechSynthesis.getVoices();
console.log(voices.map(v => v.name));
  console.log("AVAILABLE VOICES:", voices);

  // try to pick a female / natural voice
  const preferredVoice =
    voices.find(v =>
      v.name.toLowerCase().includes("aria") ||
      v.name.toLowerCase().includes("jenny") ||
      v.name.toLowerCase().includes("microsoft") ||
      v.name.toLowerCase().includes("female")
    ) || voices.find(v => v.lang.includes("en"));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // make it sound more natural
  utterance.rate = 0.9;   // slower = more human
  utterance.pitch = 1.15; // softer female tone
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply || "No response received.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Something went wrong.",
        },
      ]);
    }

    setLoading(false);
  }
  if (voiceScreen) {
  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-20" />

      <button
        onClick={() => setVoiceScreen(false)}
        className="absolute top-6 left-6 text-2xl"
      >
        ←
      </button>

      <div className="flex flex-col items-center">
        <div
          className="relative flex items-center justify-center mb-10 float-anim"
          style={{ width: "260px", height: "260px" }}
        >
          <div
            className="absolute inset-0 rounded-full pulse-orb"
            style={{
              background: "rgba(136,206,141,0.25)",
              filter: "blur(40px)",
            }}
          />

          <img
            src="/mine_heart.png"
            alt="Listening"
            className="shimmer-heart"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#286b35",
            marginBottom: "12px",
          }}
        >
          Listening...
        </h2>

        <div className="flex items-end gap-2 h-14">
          <div className="wave-bar w-2 h-8 bg-green-400 rounded-full"></div>
          <div
            className="wave-bar w-2 h-12 bg-green-400 rounded-full"
            style={{ animationDelay: "0.15s" }}
          ></div>
          <div
            className="wave-bar w-2 h-14 bg-green-400 rounded-full"
            style={{ animationDelay: "0.3s" }}
          ></div>
          <div
            className="wave-bar w-2 h-10 bg-green-400 rounded-full"
            style={{ animationDelay: "0.45s" }}
          ></div>
          <div
            className="wave-bar w-2 h-6 bg-green-400 rounded-full"
            style={{ animationDelay: "0.6s" }}
          ></div>
        </div>
      </div>
    </main>
  );
}
if (screen === "start") {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-30" />

      <div
        className="fixed top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "rgba(255,177,192,0.12)",
          filter: "blur(100px)",
          transform: "translate(30%, -30%)",
        }}
      />

      <div
        className="fixed bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "rgba(172,244,175,0.12)",
          filter: "blur(120px)",
          transform: "translate(-30%, 30%)",
        }}
      />

      <header className="fixed top-0 left-0 w-full flex items-center justify-center py-5 px-5 z-20">
        <div className="flex items-center gap-2">
          <span
            className="text-[#286b35]"
            style={{ fontSize: "22px" }}
          >
            ♥
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: "20px",
              color: "#286b35",
              letterSpacing: "-0.01em",
            }}
          >
            Vibe
          </span>
        </div>
      </header>

      <section className="flex flex-col items-center text-center px-6 z-10 max-w-sm w-full">
        <div
          className="relative flex items-center justify-center mb-8 float-anim"
          style={{ width: "220px", height: "220px" }}
        >
          <div
            className="absolute inset-0 rounded-full pulse-orb"
            style={{
              background: "rgba(136,206,141,0.25)",
              filter: "blur(40px)",
            }}
          />

          <img
            src="/mine_heart.png"
            alt="Vibe crystal heart"
            className="shimmer-heart"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              mixBlendMode: "screen",
              position: "relative",
              zIndex: 1,
              filter:
                "drop-shadow(0 16px 40px rgba(144,215,149,0.5))",
            }}
          />
        </div>

        <h1
          style={{
            fontWeight: 800,
            fontSize: "30px",
            lineHeight: "1.15",
            color: "#191d18",
            letterSpacing: "-0.02em",
            marginBottom: "12px",
          }}
        >
          I'm here for you.
        </h1>

        <p
          style={{
            fontSize: "17px",
            lineHeight: "1.6",
            color: "#40493f",
            opacity: 0.85,
            marginBottom: "44px",
            maxWidth: "280px",
          }}
        >
          Your safe space to talk, vibe, and be heard. No judgment.
          Just bestie energy.
        </p>

       <button
  onClick={() => setScreen("signin")}
  style={{
    width: "100%",
    maxWidth: "320px",
    padding: "16px 24px",
    borderRadius: "18px",
    background: "#286b35",
    color: "white",
    fontWeight: 700,
    fontSize: "18px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(40,107,53,0.25)",
  }}
>
  Get Started →
</button>

        <p
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "#40493f",
            opacity: 0.7,
          }}
        >
          Already have an account?{" "}
          <button
            onClick={() => setScreen("signin")}
            style={{
              color: "#286b35",
              fontWeight: 700,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Sign in
          </button>
        </p>
      </section>
    </main>
  );
}
if (screen === "signin") {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-30" />

      <button
        onClick={() => setScreen("start")}
        className="absolute top-6 left-6 text-2xl"
        style={{ color: "#286b35" }}
      >
        ←
      </button>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <img
            src="/mine_heart_nobg.png"
            alt="Vibe"
            className="w-20 h-20 shimmer-heart mb-5"
          />

          <h1
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#191d18",
              marginBottom: "10px",
            }}
          >
            Welcome back
          </h1>

          <p
            style={{
              color: "#40493f",
              fontSize: "16px",
              opacity: 0.75,
            }}
          >
            Sign in to continue your safe space.
          </p>
        </div>

       <div
  className="glass-card rounded-[32px] p-7 space-y-5"
  style={{
    boxShadow: "0 16px 50px rgba(40,107,53,0.08)",
  }}
>
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl px-4 py-4 outline-none border border-white/60 bg-white/70 text-black placeholder:text-gray-500"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl px-4 py-4 outline-none border border-white/60 bg-white/70 text-black placeholder:text-gray-500"
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
  <div
    style={{
      flex: 1,
      height: "1px",
      background: "rgba(112,122,110,0.2)",
    }}
  />
  <span
    style={{
      fontSize: "13px",
      color: "#707a6e",
      fontWeight: 600,
      letterSpacing: "0.04em",
    }}
  >
    OR CONTINUE WITH
  </span>
  <div
    style={{
      flex: 1,
      height: "1px",
      background: "rgba(112,122,110,0.2)",
    }}
  />
</div>

<div style={{ display: "flex", gap: "12px" }}>
  <button
    type="button"
    style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px",
      background: "rgba(255,255,255,0.5)",
      border: "1px solid rgba(255,255,255,0.7)",
      borderRadius: "16px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 600,
      color: "#191d18",
    }}
  >
    <img
      src="/google.svg"
      alt="Google"
      style={{ width: "18px", height: "18px" }}
    />
    Google
  </button>

  <button
    type="button"
    style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px",
      background: "rgba(255,255,255,0.5)",
      border: "1px solid rgba(255,255,255,0.7)",
      borderRadius: "16px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 600,
      color: "#191d18",
    }}
  >
    <img
      src="/apple.svg"
      alt="Apple"
      style={{ width: "18px", height: "18px" }}
    />
    Apple
  </button>
</div>

          <button
            onClick={() => setScreen("chat")}
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, #88ce8d 0%, #acf4af 100%)",
              color: "#115925",
              fontWeight: 800,
              fontSize: "17px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 30px rgba(136, 206, 141, 0.35)",
            }}
          >
            Sign In
          </button>
        </div>

        <p
          className="text-center mt-6"
          style={{
            color: "#40493f",
            fontSize: "14px",
            opacity: 0.75,
          }}
        >
          New here?{" "}
          <button
            onClick={() => setScreen("chat")}
            style={{
              color: "#286b35",
              fontWeight: 800,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Continue as guest
          </button>
        </p>
      </div>
    </main>
  );
}
  return (
    <main
 className="min-h-screen flex justify-center p-5 relative"
  style={{ background: "#f7faf3" }}
>
  <div className="mesh-bg" />
  <div className="light-ray opacity-20" />

      <div className="w-full max-w-4xl">
      <div
  className="sticky top-4 z-50 glass-card rounded-3xl px-5 py-4 mb-6 flex items-center justify-between"
  style={{
    boxShadow: "0 12px 40px rgba(40, 107, 53, 0.10)",
  }}
>
  <img
  src="/mine_heart_nobg.png"
  alt="Vibe"
  className="w-11 h-11 shimmer-heart"
/>

  <h1
  className="text-2xl font-bold"
  style={{ color: "#286b35" }}
>
    Vibe AI
  </h1>
  <div className="text-sm text-gray-500">
  Online ✨
</div>
</div>

      <div
  className="glass-card rounded-[32px] p-6 min-h-[75vh] mb-4"
  style={{
    boxShadow: "0 16px 60px rgba(40, 107, 53, 0.08)",
  }}
>
        {messages.length === 0 && (
          <p>Start chatting...</p>
        )}

        {messages.map((msg, index) => (
  <div
    key={index}
    className={`mb-4 flex ${
      msg.role === "user" ? "justify-end" : "justify-start"
    }`}
  >
    <div
      className={`max-w-[75%] rounded-3xl px-5 py-3 shadow-sm ${
        msg.role === "user"
          ? "bg-pink-500 text-white rounded-br-md"
          : "bg-pink-50 text-gray-900 border border-pink-100 rounded-bl-md"
      }`}
    >
      <p className="text-xs font-semibold opacity-70 mb-1">
        {msg.role === "user" ? "You" : "Vibe"}
      </p>

      <p className="leading-relaxed">{msg.text}</p>
    </div>
  </div>
))}
      </div>
<div className="sticky bottom-4 z-50 bg-white/90 backdrop-blur border border-pink-100 rounded-3xl shadow-lg p-3 flex gap-2">
        <input
         className="bg-pink-50 text-black placeholder:text-gray-500 border border-pink-100 p-3 flex-1 rounded-2xl outline-none focus:ring-2 focus:ring-pink-200"
          placeholder="Type a message..."
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />

       <button
  onClick={() => setVoiceScreen(true)}
  className={`px-4 py-3 rounded-2xl shadow-sm transition ${
    listening
      ? "bg-pink-500 text-white"
      : "bg-white border border-pink-100 text-pink-600 hover:bg-pink-50"
  }`}
>
  {listening ? "Listening..." : "🎤"}
</button>

<button
  onClick={toggleIncognito}
  className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50"
>
  {incognito ? "🌙 Exit Incognito" : "🌙 Incognito"}
</button>

<button
  onClick={sendMessage}
  className="bg-pink-500 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-pink-600 transition disabled:opacity-50"
  disabled={loading}
>
  {loading ? "..." : "Send"}
</button>
      </div>
      </div>
    </main>
  );
}