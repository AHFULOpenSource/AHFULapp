import React, { useEffect, useRef, useState } from "react";
import "./CompanionAI.css";
import { initCompanionAI } from "./CompanionAI.js";

export function CompanionAI() {
  const textRef = useRef(null);
  const sendRef = useRef(null);
  const imgRef = useRef(null);
  const statusRef = useRef(null);
  const aiInstanceRef = useRef(null);
  const responsesContainerRef = useRef(null);
  const isMutedRef = useRef(false);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const [responses, setResponses] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Web Audio API for global muting
  useEffect(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create a gain node to control volume
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // console.log('Web Audio API initialized for global muting');
    } catch (error) {
      console.error('Web Audio API not available:', error);
    }
  }, []);

  // Update the ref whenever the state changes
  useEffect(() => {
    isMutedRef.current = isMuted;

    // Keep image static when muted
    if (isMuted && imgRef.current) {
      imgRef.current.src = '../../images/char-mouth-closed.png';
      // console.log('Image set to static (mouth closed)');
    }
  }, [isMuted]);

  useEffect(() => {
    aiInstanceRef.current = initCompanionAI({
      textInput: textRef.current,
      sendButton: sendRef.current,
      characterImage: imgRef.current,
      status: statusRef.current,
      responsesContainer: responsesContainerRef.current,
      isMutedRef: isMutedRef,
      onResponseAdded: (response) => {
        setResponses(prev => [...prev, { id: Date.now(), text: response }]);
      }
    });

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        aiInstanceRef.current?.populateVoiceList();
      };
    } else {
      // populate immediately if voices are already loaded
      aiInstanceRef.current?.populateVoiceList();
    }

    return () => {
      aiInstanceRef.current?.destroy();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []); // runs once on mount

  // Auto-scroll to bottom when new responses are added
  useEffect(() => {
    if (responsesContainerRef.current) {
      setTimeout(() => {
        responsesContainerRef.current.scrollTop = responsesContainerRef.current.scrollHeight;
      }, 0);
    }
  }, [responses]);

  const handleDeleteResponse = (id) => {
    setResponses(prev => prev.filter(response => response.id !== id));
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    // console.log('🔊 Mute button clicked - new state:', newMutedState ? '🔇 MUTED' : '🔊 UNMUTED');

    // Update ref immediately
    isMutedRef.current = newMutedState;

    // Mute/unmute Web Speech API
    if (aiInstanceRef.current) {
      if (newMutedState) {
        // console.log('Canceling AI speech...');
        aiInstanceRef.current.cancelSpeech();
      }
      aiInstanceRef.current.setMuted(newMutedState);
    }

    // Mute/unmute all audio elements on the page
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.muted = newMutedState;
      // console.log('Audio element muted:', newMutedState);
    });

    // Mute/unmute Web Audio API contexts
    if (audioContextRef.current) {
      try {
        // Resume audio context if suspended
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      } catch (e) {
        console.error('Audio context error:', e);
      }
    }

    // Also set global mute on speechSynthesis as backup
    if (window.speechSynthesis) {
      if (newMutedState) {
        window.speechSynthesis.cancel();
        // console.log('Global speechSynthesis canceled');
      }
    }

    // Update state after all muting is done
    setIsMuted(newMutedState);
  };

  return (
    <div className="ai-chat-container">
      <header className="ai-chat-header">
        <h1>AI Companion</h1>
      </header>
      <div className="ai-character-viewer">
        <img
          ref={imgRef}
          id="ai-character-image"
          src="../../images/char-mouth-closed.png"
          alt="WakuWaku"
        />
      </div>
      <p ref={statusRef} id="ai-status">
        Ask me something!
      </p>
      <div className="ai-response-history" ref={responsesContainerRef}>
        {responses.length === 0 ? (
          <p className="ai-no-responses">No responses yet. Start chatting!</p>
        ) : (
          responses.map(response => (
            <div key={response.id} className="ai-response-box">
              <p className="ai-response-text">{response.text}</p>
              <button
                className="ai-delete-button"
                onClick={() => handleDeleteResponse(response.id)}
                title="Delete this response"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
      <footer className="ai-chat-input-area">
        <button
          className={`ai-mute-button ${isMuted ? 'muted' : ''}`}
          onClick={handleMuteToggle}
          title={isMuted ? 'Unmute AI' : 'Mute AI'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <textarea
          ref={textRef}
          id="ai-text-input"
          placeholder="Ask me anything..."
        />
        <button ref={sendRef} id="ai-send-button">
          <svg
            xmlns="https://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="24px"
            height="24px"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </footer>
    </div>
  );
}
