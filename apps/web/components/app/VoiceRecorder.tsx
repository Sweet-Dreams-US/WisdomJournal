"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Pause, Loader2 } from "lucide-react";
import gsap from "gsap";

interface Props {
  onTranscript: (text: string) => void;
  currentText: string;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscript, currentText, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  // Track text that existed before this recording session started
  const baseTextRef = useRef<string>("");
  // Track text accumulated in the current recording session
  const sessionTextRef = useRef<string>("");
  const isRecordingRef = useRef(false);

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
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  function startRecording() {
    setError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Capture current text as the base to append to
    baseTextRef.current = currentText;
    sessionTextRef.current = "";

    recognition.onresult = (event: any) => {
      let sessionFinal = "";
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          sessionFinal += transcript + " ";
        } else {
          interim = transcript;
        }
      }

      sessionTextRef.current = sessionFinal;

      // Combine: previous text + this session's final + interim
      const combined = [
        baseTextRef.current,
        sessionFinal.trim(),
        interim,
      ].filter(Boolean).join(" ");

      onTranscript(combined);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Allow microphone in browser settings.");
      } else if (event.error === "no-speech") {
        // Silence timeout — restart if still recording
        if (isRecordingRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch { /* already running */ }
        }
        return;
      } else if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
      isRecordingRef.current = false;
    };

    recognition.onend = () => {
      // Finalize the session text into base
      if (sessionTextRef.current.trim()) {
        baseTextRef.current = [
          baseTextRef.current,
          sessionTextRef.current.trim(),
        ].filter(Boolean).join(" ");
        sessionTextRef.current = "";
      }

      // Auto-restart if still recording (speech API times out after silence)
      if (isRecordingRef.current) {
        try {
          recognitionRef.current?.start();
        } catch {
          // Already started or disposed
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch {
      setError("Failed to start speech recognition. Check microphone permissions.");
    }
  }

  function stopRecording() {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Finalize: make sure base text includes everything from this session
    if (sessionTextRef.current.trim()) {
      const final = [
        baseTextRef.current,
        sessionTextRef.current.trim(),
      ].filter(Boolean).join(" ");
      baseTextRef.current = final;
      sessionTextRef.current = "";
      onTranscript(final);
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
            <Pause className="w-7 h-7" />
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
              Listening... {formatDuration(duration)}
            </span>
          </div>
        ) : isProcessing ? (
          <span className="text-sm text-charcoal/60 font-body">Processing...</span>
        ) : currentText ? (
          <span className="text-sm text-charcoal/50 font-body">
            Tap to continue speaking
          </span>
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
