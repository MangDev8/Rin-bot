const API_KEY = "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"; // Masukkan API Key OpenRouter
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");

// **1️⃣ Deteksi Pesan Toxic dengan TensorFlow**
async function isToxicMessage(message) {
  const threshold = 0.9; // Sensitivitas
  const model = await toxicity.load(threshold);
  const predictions = await model.classify([message]);
  
  return predictions.some(prediction => prediction.results[0].match);
}

// **2️⃣ Fungsi Text-to-Speech (Bicara)**
function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "id-ID"; // Bahasa Indonesia
  speech.rate = 1;
  window.speechSynthesis.speak(speech);
}

// **3️⃣ Kirim Pesan ke OpenRouter AI**
async function askAI(question) {
  try {
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
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error:", error);
    return "Maaf, ada kesalahan dalam sistem.";
  }
}

// **4️⃣ Kirim Pesan & Proses Balasan**
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
  
  chatBox.scrollTop = chatBox.scrollHeight;
}

// **5️⃣ Enter untuk Kirim**
function handleKeyPress(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

// **6️⃣ Speech-to-Text (Input Suara)**
function startVoice() {
  let recognition = new(window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "id-ID";
  
  recognition.onresult = function(event) {
    let voiceText = event.results[0][0].transcript;
    userInput.value = voiceText;
    sendMessage();
  };
  
  recognition.start();
}