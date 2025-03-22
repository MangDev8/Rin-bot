const API_KEY = "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"; // API Key OpenRouter
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");

let toxicityModel; // Simpan model biar nggak reload terus

// **1️⃣ Load Model Toxicity Sekali Saja**
async function loadToxicityModel() {
  try {
    console.log("Loading model Toxicity...");
    const threshold = 0.9;
    toxicityModel = await toxicity.load(threshold);
    console.log("Model Toxicity siap!");
  } catch (error) {
    console.error("Gagal load model Toxicity:", error);
  }
}
loadToxicityModel(); // Load saat halaman dibuka

// **2️⃣ Deteksi Pesan Toxic**
async function isToxicMessage(message) {
  if (!toxicityModel) return false; // Kalau model belum siap, anggap aman
  const predictions = await toxicityModel.classify([message]);
  return predictions.some(prediction => prediction.results[0].match);
}

// **3️⃣ Text-to-Speech (Bicara)**
function speak(text) {
  if (!text) return;
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "id-ID";
  speech.rate = 1;
  window.speechSynthesis.speak(speech);
}

// **4️⃣ Kirim ke OpenRouter AI**
async function askAI(question) {
  try {
    console.log("Mengirim ke AI:", question);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: question }]
      })
    });
    
    if (!response.ok) throw new Error(`Error API: ${response.status}`);
    
    const data = await response.json();
    console.log("Respon AI:", data);
    
    return data.choices[0]?.message?.content || "Maaf, ada kesalahan sistem.";
  } catch (error) {
    console.error("Error API:", error);
    return "Maaf, sistem sedang bermasalah.";
  }
}

// **5️⃣ Kirim Pesan & Tampilkan Balasan**
async function sendMessage() {
  let message = userInput.value.trim();
  if (message === "") return;
  
  chatBox.innerHTML += `<div class="message user">${message}</div>`;
  userInput.value = "";
  
  // Cek apakah pesan toxic
  if (await isToxicMessage(message)) {
    let warning = "Pesan mengandung kata tidak pantas.";
    chatBox.innerHTML += `<div class="message bot">${warning}</div>`;
    speak(warning);
    return;
  }
  
  // Kirim ke AI & dapatkan balasan
  let botReply = await askAI(message);
  chatBox.innerHTML += `<div class="message bot">${botReply}</div>`;
  speak(botReply);
  
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll ke bawah
}

// **6️⃣ Enter untuk Kirim**
userInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") sendMessage();
});

// **7️⃣ Speech-to-Text (Input Suara)**
function startVoice() {
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    alert("Browser tidak mendukung Speech Recognition.");
    return;
  }
  
  let recognition = new(window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "id-ID";
  
  recognition.onresult = function(event) {
    let voiceText = event.results[0][0].transcript;
    userInput.value = voiceText;
    sendMessage();
  };
  
  recognition.onerror = function(event) {
    console.error("Speech Recognition Error:", event.error);
  };
  
  recognition.start();
}