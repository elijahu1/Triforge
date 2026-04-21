let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

// ==================== STATUS BAR ====================

function setStatus(message, type = 'info') {
    const bar = document.getElementById('status-bar');
    const text = document.getElementById('status');
    text.textContent = message;
    bar.className = 'status-bar';
    if (type === 'error') bar.classList.add('error');
    if (type === 'success') bar.classList.add('success');
}

// ==================== MESSAGE HANDLING ====================

function addMessage(content, type = 'ai') {
    const container = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (typeof content === 'string') {
        contentDiv.innerHTML = content;
    } else {
        contentDiv.appendChild(content);
    }

    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);


}


// ==================== VOICE / STT ====================

async function startVoice() {
    if (isRecording) return;
    const micBtn = document.getElementById('mic-btn');
    const micIcon = document.getElementById('mic-icon');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;

        micBtn.classList.add('recording');
        micIcon.textContent = '⏺️';
        setStatus('🎤 Recording — release to stop');

        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await handleSTT(audioBlob);
            stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();

    } catch (error) {
        console.error('Mic error:', error);
        setStatus('❌ Microphone access denied', 'error');
        addMessage('❌ Could not access microphone. Please grant permission.');
    }
}

function stopVoice() {
    if (!isRecording) return;
    const micBtn = document.getElementById('mic-btn');
    const micIcon = document.getElementById('mic-icon');

    mediaRecorder.stop();
    isRecording = false;
    micBtn.classList.remove('recording');
    micIcon.textContent = '🎤';
    setStatus('🔄 Processing audio...');
}

async function handleSTT(audioBlob) {
    try {
        const base64Audio = await blobToBase64(audioBlob);

        const response = await fetch('/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio: base64Audio,
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const transcript = data.transcript || 'No transcription available';

        addMessage(`<strong>You said:</strong> "${transcript}"`);
        setStatus('✅ Transcription complete', 'success');

    } catch (error) {
        console.error('STT error:', error);
        addMessage(`❌ Transcription failed: ${error.message}`);
        setStatus('Transcription failed', 'error');
    }
}

// ==================== HELPERS ====================

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

window.addEventListener('load', () => {
    document.getElementById('message-input').focus();
    setStatus('Ready — try "Hello there"');
});
