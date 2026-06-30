import openMouthImg from '../../images/char-mouth-open.png';
import closedMouthImg from '../../images/char-mouth-closed.png';

export function initCompanionAI({ textInput, sendButton, characterImage, voiceSelect, status, responsesContainer, isMutedRef, onResponseAdded }) {
    let voices = [];
    let lipSyncInterval;

    function populateVoiceList() {
        const allVoices = speechSynthesis.getVoices();
        voices = allVoices.filter(voice => voice.name.includes('Google'));
        if (!voiceSelect) return;
        voiceSelect.innerHTML = '';

        let usVoiceIndex = -1;

        voices.forEach((voice, i) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);

            if (voice.lang === 'en-US' && usVoiceIndex === -1) {
                usVoiceIndex = i;
            }
        });

        if (usVoiceIndex !== -1) {
            voiceSelect.selectedIndex = usVoiceIndex;
        }
    }

    const typewriter = (text, element, speed = 50) => {
        if (!element) return;
        if (window.Intl && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
            const segments = Array.from(segmenter.segment(text)).map(s => s.segment);
            let i = 0;
            element.innerHTML = "";
            (function type() {
                if (i < segments.length) {
                    element.innerHTML += segments[i++];
                    setTimeout(type, speed);
                }
            })();
        } else {
            let i = 0;
            element.innerHTML = "";
            (function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i++);
                    setTimeout(type, speed);
                }
            })();
        }
    };

    const speak = (text) => {
        if (!text) return;

        // If muted, skip speech synthesis entirely and keep mouth static (closed)
        if (isMutedRef && isMutedRef.current) {
            console.log('🔇 Muted - not speaking');
            if (characterImage) characterImage.src = closedMouthImg;
            return;
        }

        console.log('🔊 Speaking:', text.substring(0, 50) + '...');

        // Cancel any existing speech
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        clearInterval(lipSyncInterval);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 1; // Full volume
        utterance.rate = 1;
        utterance.pitch = 1;

        if (voiceSelect && voiceSelect.selectedOptions.length) {
            const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
            const selectedVoice = voices.find(voice => voice.name === selectedOption);
            if (selectedVoice) utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
            console.log('Speech started');
            // Only animate if not muted
            if (!characterImage || (isMutedRef && isMutedRef.current)) {
                speechSynthesis.cancel();
                return;
            }
            let mouthOpen = true;
            lipSyncInterval = setInterval(() => {
                // Check if still not muted before updating image
                if (isMutedRef && isMutedRef.current) {
                    clearInterval(lipSyncInterval);
                    if (characterImage) characterImage.src = closedMouthImg;
                    speechSynthesis.cancel();
                    return;
                }
                characterImage.src = mouthOpen ? openMouthImg : closedMouthImg;
                mouthOpen = !mouthOpen;
            }, 150);
        };

        utterance.onend = utterance.onerror = () => {
            console.log('Speech ended or error');
            clearInterval(lipSyncInterval);
            if (characterImage) characterImage.src = closedMouthImg;
        };

        speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async () => {
        if (!textInput) return;
        const message = textInput.value.trim();
        if (!message) return;

        textInput.value = '';
        textInput.style.height = '50px';
        if (status) status.textContent = "Thinking...";

        try {
            const response = await fetch('https://www.ahful.app/api/AHFULchats/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
                credentials: 'include' // include cookies for session management
            });

            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (onResponseAdded) {
                onResponseAdded(data.response);
            }
            speak(data.response);
            if (status) status.textContent = "Ask me something!";
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = 'Sorry, something went wrong. Please try again.';
            if (onResponseAdded) {
                onResponseAdded(errorMessage);
            }
            speak(errorMessage);
            if (status) status.textContent = "Ask me something!";
        }
    };

    // Attach listeners (guard with optional chaining)
    if (sendButton) sendButton.addEventListener('click', handleSendMessage);
    if (textInput) {
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        textInput.addEventListener('input', () => {
            textInput.style.height = 'auto';
            textInput.style.height = `${textInput.scrollHeight}px`;
        });
    }

    // Expose populateVoiceList so caller can trigger it after mount
    return {
        populateVoiceList,
        cancelSpeech: () => {
            console.log('cancelSpeech called - speechSynthesis.speaking:', speechSynthesis.speaking);
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
                console.log('Speech canceled');
            }
            clearInterval(lipSyncInterval);
            if (characterImage) {
                characterImage.src = closedMouthImg;
                console.log('Image set to closed mouth');
            }
        },
        setMuted: (muted) => {
            console.log('setMuted called with:', muted);
            isMutedRef.current = muted;
        },
        destroy: () => {
            clearInterval(lipSyncInterval);
            if (sendButton) sendButton.removeEventListener('click', handleSendMessage);
            // other cleanup if needed
        }
    };
}
