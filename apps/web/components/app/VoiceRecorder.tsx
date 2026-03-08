"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import gsap from "gsap";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscript, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Use Web Speech API for real-time transcription
  const useSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    return recognition;
  }, []);

  // Pulse animation while recording
  useEffect(() => {
    if (isRecording && pulseRef.current) {
      gsap.to(pulseRef.current, {
        scale: 1.4,
        opacity: 0,
        duration: 1,
        repeat: -1,
        ease: "power2.out",
      });
    }
    return () => {
      if (pulseRef.current) {
        gsap.killTweensOf(pulseRef.current);
      }
    };
  }, [isRecording]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  async function startRecording() {
    setError(null);

    const recognition = useSpeechRecognition();

    if (recognition) {
      // Use Speech Recognition API (preferred — real-time)
      let finalTranscript = "";
      let interimTranscript = "";

      recognition.onresult = (event: any) => {
        interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
            onTranscript(finalTranscript.trim());
          } else {
            interimTranscript = transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed") {
          setError("Microphone access denied. Please allow microphone in your browser settings.");
        } else if (event.error !== "aborted") {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        // Auto-restart if still recording (speech recognition times out)
        if (isRecording && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // Already started
          }
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch (err) {
        setError("Failed to start speech recognition. Check microphone permissions.");
      }
    } else {
      // Fallback: MediaRecorder + no transcription (just record audio)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (err) {
        setError("Microphone access denied. Please allow microphone in your browser settings.");
      }
    }
  }

  function stopRecording() {
    setIsRecording(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    }
  }

  function formatDuration(s: number): string {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Record button */}
      <div className="relative">
        {isRecording && (
          <div
            ref={pulseRef}
            className="absolute inset-0 rounded-full bg-sunrise-coral/30"
          />
        )}
        <button
          ref={buttonRef}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-300
            ${
              isRecording
                ? "bg-sunrise-coral text-white shadow-lg shadow-sunrise-coral/30"
                : "bg-deep-sky text-white hover:bg-sky-blue shadow-lg shadow-deep-sky/30"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isRecording ? (
            <Square className="w-7 h-7" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Status text */}
      <div className="text-center">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sunrise-coral animate-pulse" />
            <span className="text-sm font-medium text-sunrise-coral font-body">
              Recording {formatDuration(duration)}
            </span>
          </div>
        ) : isProcessing ? (
          <span className="text-sm text-charcoal/60 font-body">Processing...</span>
        ) : (
          <span className="text-sm text-charcoal/50 font-body">
            Tap to speak your wisdom
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-error font-body text-center max-w-xs">
          {error}
        </p>
      )}
    </div>
  );
}
