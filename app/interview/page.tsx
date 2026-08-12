"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  CheckCircle2,
  Clock,
  Briefcase,
  ArrowRight,
  Camera,
  AlertCircle,
  Sparkles,
  User,
  ChevronRight,
  Square,
  Loader2,
  Volume2,
  Home,
} from "lucide-react";

type Step =
  | "welcome"
  | "payment"
  | "device-check"
  | "interview"
  | "completed"
  | "error";

type InterviewStatus =
  | "idle"
  | "generating"
  | "ai-speaking"
  | "listening"
  | "candidate-speaking"
  | "processing"
  | "finished";

interface InterviewAnswer {
  questionNumber: number;
  question: string;
  answer: string;
  answeredAt: string;
  durationMs?: number;
}

const TOTAL_QUESTIONS = 10;
const TOTAL_DURATION_SECONDS = 20 * 60; // 20 minutes
const ANSWER_SILENCE_MS = 2500; // 2.5s silence after speech ends → answer complete
const NO_ANSWER_PROMPT_MS = 30_000; // 30s with no speech → show confirm popup
const MAX_ANSWER_MS = 120_000; // hard cap per answer
const PAID_POLL_INTERVAL_MS = 8000;
const PAID_POLL_MAX_MS = 5 * 60 * 1000; // 5 minutes

function slugToTitle(slug: string): string {
  if (!slug) return "Position";
  return slug
    .replace(/^#/, "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function InterviewPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [jobTitle, setJobTitle] = useState("Position");
  const [jobSlug, setJobSlug] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [currentAnswerText, setCurrentAnswerText] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_DURATION_SECONDS);
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSilencePrompt, setShowSilencePrompt] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Email-based premium / paid access (source of truth: GET /api/paid-access)
  // Flow: email-check → (if unpaid) customer-info → jazzcash → waiting
  type AccessPhase = "email-check" | "customer-info" | "jazzcash" | "waiting";
  const [accessPhase, setAccessPhase] = useState<AccessPhase>("email-check");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paidAccess, setPaidAccess] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSubmitError, setPaymentSubmitError] = useState<string | null>(null);
  const paidPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paidPollStartedAtRef = useRef<number>(0);

  // JazzCash receiving number (display only — adjust if your project stores this elsewhere)
  const JAZZCASH_RECEIVER = "03245237429";

  const videoRef = useRef<HTMLVideoElement>(null);
  const interviewVideoRef = useRef<HTMLVideoElement>(null);

  // Timers
  const interviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Speech / recognition
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingResolveRef = useRef<(() => void) | null>(null);

  // Race-condition guards
  const isAdvancingRef = useRef(false);
  const isListeningActiveRef = useRef(false);
  const hasSpokenThisTurnRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const answerStartRef = useRef(0);
  const questionSessionIdRef = useRef(0); // increments on every new question to invalidate stale callbacks
  const hasSubmittedRef = useRef(false); // ensure completion API is called only once

  // Synced state refs
  const statusRef = useRef<InterviewStatus>("idle");
  const questionsRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const answersRef = useRef<InterviewAnswer[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stepRef = useRef<Step>("welcome");

  useEffect(() => {
    statusRef.current = interviewStatus;
  }, [interviewStatus]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    currentIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Job title from hash
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash || "";
      const slug = hash.replace(/^#/, "").trim();
      setJobSlug(slug);
      setJobTitle(slugToTitle(slug));
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  // Optional polling after payment submission until admin verifies
  const stopPaidPolling = useCallback(() => {
    if (paidPollRef.current) {
      clearInterval(paidPollRef.current);
      paidPollRef.current = null;
    }
  }, []);

  const startPaidPolling = useCallback(() => {
    stopPaidPolling();
    paidPollStartedAtRef.current = Date.now();
    paidPollRef.current = setInterval(async () => {
      if (Date.now() - paidPollStartedAtRef.current > PAID_POLL_MAX_MS) {
        stopPaidPolling();
        return;
      }
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !isValidEmail(trimmed)) return;
      try {
        const res = await fetch(
          `/api/paid-access?email=${encodeURIComponent(trimmed)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        // Only grant when API confirms paid — never from submission alone
        if (data.paid === true) {
          setPaidAccess(true);
          setEmailCheckError(false);
          stopPaidPolling();
        }
      } catch {
        /* keep polling */
      }
    }, PAID_POLL_INTERVAL_MS);
  }, [email, stopPaidPolling]);

  useEffect(() => {
    return () => stopPaidPolling();
  }, [stopPaidPolling]);

  /** Explicit Check Access — never grant from email input alone.
   *  Returns: "paid" | "unpaid" | "error" | "invalid"
   */
  const checkPaidAccess = useCallback(async (): Promise<
    "paid" | "unpaid" | "error" | "invalid"
  > => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setPaidAccess(false);
      setEmailCheckError(false);
      return "invalid";
    }
    setCheckingEmail(true);
    setEmailCheckError(false);
    try {
      const res = await fetch(
        `/api/paid-access?email=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) throw new Error("check failed");
      const data = await res.json();
      const isPaid = data.paid === true;
      setPaidAccess(isPaid);
      setEmailCheckError(false);
      return isPaid ? "paid" : "unpaid";
    } catch {
      setPaidAccess(false);
      setEmailCheckError(true);
      return "error";
    } finally {
      setCheckingEmail(false);
    }
  }, [email]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60)
      .toString()
      .padStart(2, "0");
    const s = (Math.max(0, seconds) % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const attachStream = useCallback(
    (videoEl: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
      if (videoEl && mediaStream) {
        videoEl.srcObject = mediaStream;
        videoEl.play().catch(() => {});
      }
    },
    []
  );

  useEffect(() => {
    if (stream) {
      attachStream(videoRef.current, stream);
      attachStream(interviewVideoRef.current, stream);
    }
  }, [stream, step, attachStream]);

  // ---------- Cleanup helpers ----------

  const clearAnswerSilenceTimer = useCallback(() => {
    if (answerSilenceTimerRef.current) {
      clearTimeout(answerSilenceTimerRef.current);
      answerSilenceTimerRef.current = null;
    }
  }, []);

  const clearNoAnswerTimer = useCallback(() => {
    if (noAnswerTimerRef.current) {
      clearTimeout(noAnswerTimerRef.current);
      noAnswerTimerRef.current = null;
    }
  }, []);

  const clearMaxAnswerTimer = useCallback(() => {
    if (maxAnswerTimerRef.current) {
      clearTimeout(maxAnswerTimerRef.current);
      maxAnswerTimerRef.current = null;
    }
  }, []);

  const clearAllAnswerTimers = useCallback(() => {
    clearAnswerSilenceTimer();
    clearNoAnswerTimer();
    clearMaxAnswerTimer();
  }, [clearAnswerSilenceTimer, clearNoAnswerTimer, clearMaxAnswerTimer]);

  const stopSpeechSynthesis = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    utteranceRef.current = null;
    if (speakingResolveRef.current) {
      const resolve = speakingResolveRef.current;
      speakingResolveRef.current = null;
      resolve();
    }
  }, []);

  const stopRecognition = useCallback(() => {
    isListeningActiveRef.current = false;
    clearAllAnswerTimers();
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.onspeechstart = null;
        rec.onspeechend = null;
        rec.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, [clearAllAnswerTimers]);

  const stopMediaTracks = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      setStream(null);
      streamRef.current = null;
    }
  }, []);

  const stopEverything = useCallback(() => {
    if (interviewTimerRef.current) {
      clearInterval(interviewTimerRef.current);
      interviewTimerRef.current = null;
    }
    stopSpeechSynthesis();
    stopRecognition();
    stopMediaTracks();
    setShowSilencePrompt(false);
  }, [stopSpeechSynthesis, stopRecognition, stopMediaTracks]);

  useEffect(() => {
    return () => {
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Interview countdown ----------

  useEffect(() => {
    if (step === "interview") {
      interviewTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            finishInterview("timeout");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (interviewTimerRef.current) {
          clearInterval(interviewTimerRef.current);
          interviewTimerRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ---------- TTS ----------

  const speakQuestion = useCallback(
    (text: string, sessionId: number): Promise<void> => {
      return new Promise((resolve) => {
        // Invalidate if a newer question session has started
        if (sessionId !== questionSessionIdRef.current) {
          resolve();
          return;
        }

        stopSpeechSynthesis();

        if (typeof window === "undefined" || !window.speechSynthesis) {
          // No TTS – short delay then continue
          setInterviewStatus("ai-speaking");
          setTimeout(() => {
            if (sessionId === questionSessionIdRef.current) {
              setInterviewStatus("listening");
            }
            resolve();
          }, 1200);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Google") ||
                v.name.includes("Natural") ||
                v.name.includes("Samantha") ||
                v.name.includes("Alex") ||
                v.name.includes("Microsoft"))
          ) || voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;

        utteranceRef.current = utterance;
        speakingResolveRef.current = resolve;

        const finish = () => {
          if (speakingResolveRef.current === resolve) {
            speakingResolveRef.current = null;
          }
          utteranceRef.current = null;
          // Only clear speaking state if this session is still current
          if (sessionId === questionSessionIdRef.current) {
            // Status will be set to listening by the caller after await
          }
          resolve();
        };

        utterance.onend = () => finish();
        utterance.onerror = () => finish();

        setInterviewStatus("ai-speaking");

        try {
          // Chrome sometimes needs a tiny delay after cancel
          window.speechSynthesis.cancel();
          setTimeout(() => {
            if (sessionId !== questionSessionIdRef.current) {
              finish();
              return;
            }
            try {
              window.speechSynthesis.speak(utterance);
            } catch {
              finish();
            }
          }, 40);
        } catch {
          finish();
        }
      });
    },
    [stopSpeechSynthesis]
  );

  // ---------- API ----------

  const fetchQuestion = useCallback(
    async (
      questionNumber: number,
      previousQuestions: string[]
    ): Promise<string> => {
      try {
        const res = await fetch("/api/ai/question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle,
            jobSlug,
            questionNumber,
            totalQuestions: TOTAL_QUESTIONS,
            previousQuestions,
          }),
        });
        if (!res.ok) throw new Error("Failed to generate question");
        const data = await res.json();
        const q =
          data.question ||
          data.text ||
          data.content ||
          data.data?.question ||
          data.message;
        if (typeof q === "string" && q.trim()) return q.trim();
        throw new Error("Invalid question response");
      } catch (err) {
        console.error("Question generation error:", err);
        return `Please describe your relevant experience and approach for the role of ${jobTitle}. (Question ${questionNumber})`;
      }
    },
    [jobTitle, jobSlug]
  );

  const saveAnswer = useCallback(
    async (answer: InterviewAnswer) => {
      try {
        await fetch("/api/interview/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle,
            jobSlug,
            ...answer,
          }),
        }).catch(() => {});
      } catch {
        /* non-blocking */
      }
    },
    [jobTitle, jobSlug]
  );

  const submitInterview = useCallback(
    async (
      finalAnswers: InterviewAnswer[],
      reason: "completed" | "timeout"
    ) => {
      // Prevent duplicate completion API calls
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      setIsSubmitting(true);
      try {
        await fetch("/api/interview/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle,
            jobSlug,
            status: reason === "timeout" ? "timed_out" : "completed",
            totalQuestions: TOTAL_QUESTIONS,
            answers: finalAnswers,
            durationSeconds: elapsedSeconds,
            completedAt: new Date().toISOString(),
          }),
        }).catch(() => {});
      } finally {
        setIsSubmitting(false);
      }
    },
    [jobTitle, jobSlug, elapsedSeconds]
  );

  // ---------- Finish ----------

  const finishInterview = useCallback(
    async (reason: "completed" | "timeout" = "completed") => {
      // Idempotent: ignore if already finishing/finished
      if (statusRef.current === "finished") return;
      setInterviewStatus("finished");
      setIsEnding(true);
      setShowSilencePrompt(false);

      // Invalidate any in-flight question session so stale callbacks no-op
      questionSessionIdRef.current += 1;
      isAdvancingRef.current = false;
      isListeningActiveRef.current = false;

      stopSpeechSynthesis();
      stopRecognition();
      stopMediaTracks();
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current);
        interviewTimerRef.current = null;
      }

      const finalAnswers = answersRef.current;
      await submitInterview(finalAnswers, reason);
      setStep("completed");
      setIsEnding(false);
    },
    [stopSpeechSynthesis, stopRecognition, stopMediaTracks, submitInterview]
  );

  // ---------- Advance to next question ----------

  const advanceToNextQuestion = useCallback(
    async (answerText: string) => {
      if (isAdvancingRef.current) return;
      if (statusRef.current === "finished") return;
      isAdvancingRef.current = true;

      // Invalidate any in-flight speech/listen callbacks for this question
      questionSessionIdRef.current += 1;
      const nextSessionId = questionSessionIdRef.current;

      setShowSilencePrompt(false);
      stopSpeechSynthesis();
      stopRecognition();
      setInterviewStatus("processing");
      setCurrentAnswerText("");
      finalTranscriptRef.current = "";

      const idx = currentIndexRef.current;
      const qList = questionsRef.current;
      const questionText = qList[idx] || "";
      const durationMs = Date.now() - answerStartRef.current;

      const newAnswer: InterviewAnswer = {
        questionNumber: idx + 1,
        question: questionText,
        answer: answerText.trim() || "(No verbal response detected)",
        answeredAt: new Date().toISOString(),
        durationMs,
      };

      const updatedAnswers = [...answersRef.current, newAnswer];
      setAnswers(updatedAnswers);
      answersRef.current = updatedAnswers;
      await saveAnswer(newAnswer);

      // Guard: session may have changed if user ended interview
      if (nextSessionId !== questionSessionIdRef.current) {
        isAdvancingRef.current = false;
        return;
      }

      const nextIndex = idx + 1;

      if (nextIndex >= TOTAL_QUESTIONS) {
        isAdvancingRef.current = false;
        await finishInterview("completed");
        return;
      }

      setInterviewStatus("generating");
      const nextQuestion = await fetchQuestion(nextIndex + 1, qList);

      if (nextSessionId !== questionSessionIdRef.current) {
        isAdvancingRef.current = false;
        return;
      }

      const updatedQuestions = [...qList, nextQuestion];
      setQuestions(updatedQuestions);
      questionsRef.current = updatedQuestions;
      setCurrentQuestionIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      setCurrentAnswerText("");
      finalTranscriptRef.current = "";
      hasSpokenThisTurnRef.current = false;

      // Speak then listen
      await speakQuestion(nextQuestion, nextSessionId);

      if (nextSessionId !== questionSessionIdRef.current) {
        isAdvancingRef.current = false;
        return;
      }

      isAdvancingRef.current = false;
      startListening(nextSessionId);
    },
    [
      stopSpeechSynthesis,
      stopRecognition,
      saveAnswer,
      finishInterview,
      fetchQuestion,
      speakQuestion,
      // startListening declared below – using function declaration pattern via ref
    ]
  );

  // Hold latest advance in a ref so recognition callbacks always see current version
  const advanceRef = useRef(advanceToNextQuestion);
  useEffect(() => {
    advanceRef.current = advanceToNextQuestion;
  }, [advanceToNextQuestion]);

  // ---------- Listening + silence detection ----------

  const startListening = useCallback(
    (sessionId: number) => {
      // Don't start if session is stale or interview ended
      if (sessionId !== questionSessionIdRef.current) return;
      if (statusRef.current === "finished") return;
      if (stepRef.current !== "interview") return;

      stopRecognition(); // clean any previous instance
      setShowSilencePrompt(false);
      setCurrentAnswerText("");
      finalTranscriptRef.current = "";
      hasSpokenThisTurnRef.current = false;
      answerStartRef.current = Date.now();
      setInterviewStatus("listening");
      isListeningActiveRef.current = true;

      const SpeechRecognitionAPI =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition
          : null;

      // ---- 30s no-answer timer ----
      const armNoAnswerTimer = () => {
        clearNoAnswerTimer();
        noAnswerTimerRef.current = setTimeout(() => {
          // Only show if still listening, same session, and candidate never spoke
          if (
            sessionId === questionSessionIdRef.current &&
            isListeningActiveRef.current &&
            !hasSpokenThisTurnRef.current &&
            (statusRef.current === "listening" ||
              statusRef.current === "candidate-speaking")
          ) {
            setShowSilencePrompt(true);
          }
        }, NO_ANSWER_PROMPT_MS);
      };

      // ---- After candidate stops speaking (2.5s silence) ----
      const armAnswerSilenceTimer = () => {
        clearAnswerSilenceTimer();
        answerSilenceTimerRef.current = setTimeout(() => {
          if (
            sessionId !== questionSessionIdRef.current ||
            !isListeningActiveRef.current
          ) {
            return;
          }
          // Answer complete
          const answer = finalTranscriptRef.current.trim();
          isListeningActiveRef.current = false;
          clearAllAnswerTimers();
          advanceRef.current(answer);
        }, ANSWER_SILENCE_MS);
      };

      // Hard max per answer
      clearMaxAnswerTimer();
      maxAnswerTimerRef.current = setTimeout(() => {
        if (
          sessionId === questionSessionIdRef.current &&
          isListeningActiveRef.current
        ) {
          const answer = finalTranscriptRef.current.trim();
          isListeningActiveRef.current = false;
          clearAllAnswerTimers();
          advanceRef.current(answer);
        }
      }, MAX_ANSWER_MS);

      armNoAnswerTimer();

      if (!SpeechRecognitionAPI) {
        // No SpeechRecognition – rely on 30s popup / user action only
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (sessionId !== questionSessionIdRef.current) return;
        if (!isListeningActiveRef.current) return;

        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + " ";
            hasSpokenThisTurnRef.current = true;
          } else {
            interim += transcript;
          }
        }

        const combined = (
          finalTranscriptRef.current + interim
        ).trim();
        setCurrentAnswerText(combined);

        if (combined) {
          // Candidate is speaking (or just finished a phrase)
          hasSpokenThisTurnRef.current = true;
          setInterviewStatus("candidate-speaking");
          setShowSilencePrompt(false);
          // Cancel the 30s "no answer" timer – they are answering
          clearNoAnswerTimer();
          // Restart silence debounce – they may still be talking
          armAnswerSilenceTimer();
        }
      };

      recognition.onspeechstart = () => {
        if (sessionId !== questionSessionIdRef.current) return;
        if (!isListeningActiveRef.current) return;
        hasSpokenThisTurnRef.current = true;
        setInterviewStatus("candidate-speaking");
        setShowSilencePrompt(false);
        clearNoAnswerTimer();
        clearAnswerSilenceTimer(); // wait for actual silence after speech ends
      };

      recognition.onspeechend = () => {
        if (sessionId !== questionSessionIdRef.current) return;
        if (!isListeningActiveRef.current) return;
        // Speech segment ended – start/refresh the 2.5s silence debounce
        armAnswerSilenceTimer();
      };

      recognition.onerror = (event: any) => {
        if (sessionId !== questionSessionIdRef.current) return;
        const err = event?.error;
        // no-speech / aborted are normal; don't break flow
        if (err === "no-speech" || err === "aborted" || err === "network") {
          return;
        }
        console.warn("Speech recognition error:", err);
      };

      recognition.onend = () => {
        // Browser may stop continuous recognition; restart if still active
        if (
          sessionId === questionSessionIdRef.current &&
          isListeningActiveRef.current &&
          recognitionRef.current === recognition
        ) {
          try {
            recognition.start();
          } catch {
            /* already started or finished */
          }
        }
      };

      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    },
    [
      stopRecognition,
      clearNoAnswerTimer,
      clearAnswerSilenceTimer,
      clearMaxAnswerTimer,
      clearAllAnswerTimers,
    ]
  );

  // Keep startListening stable for advanceToNextQuestion
  const startListeningRef = useRef(startListening);
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Re-wire advanceToNextQuestion to call latest startListening
  // (advance already uses startListening from closure; we also call via ref in startInterviewFlow)

  // ---------- Start interview flow ----------

  const startInterviewFlow = useCallback(async () => {
    setElapsedSeconds(0);
    setRemainingSeconds(TOTAL_DURATION_SECONDS);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    answersRef.current = [];
    setQuestions([]);
    questionsRef.current = [];
    setCurrentAnswerText("");
    finalTranscriptRef.current = "";
    hasSpokenThisTurnRef.current = false;
    isAdvancingRef.current = false;
    hasSubmittedRef.current = false;
    setIsEnding(false);
    setShowSilencePrompt(false);
    setInterviewStatus("generating");
    setStep("interview");

    questionSessionIdRef.current += 1;
    const sessionId = questionSessionIdRef.current;

    const firstQuestion = await fetchQuestion(1, []);
    if (sessionId !== questionSessionIdRef.current) return;

    setQuestions([firstQuestion]);
    questionsRef.current = [firstQuestion];
    setCurrentQuestionIndex(0);
    currentIndexRef.current = 0;

    await speakQuestion(firstQuestion, sessionId);
    if (sessionId !== questionSessionIdRef.current) return;

    startListeningRef.current(sessionId);
  }, [fetchQuestion, speakQuestion]);

  // ---------- Silence prompt actions ----------

  const handleSilenceNextQuestion = useCallback(() => {
    setShowSilencePrompt(false);
    // Treat as empty / skipped answer and advance
    if (isListeningActiveRef.current) {
      isListeningActiveRef.current = false;
      clearAllAnswerTimers();
      stopRecognition();
      advanceRef.current(finalTranscriptRef.current.trim());
    }
  }, [clearAllAnswerTimers, stopRecognition]);

  const handleSilenceImAnswering = useCallback(() => {
    setShowSilencePrompt(false);
    // Keep listening; re-arm the 30s timer so popup can appear again if still silent
    if (
      isListeningActiveRef.current &&
      statusRef.current !== "finished"
    ) {
      // Reset no-answer timer
      clearNoAnswerTimer();
      noAnswerTimerRef.current = setTimeout(() => {
        if (
          isListeningActiveRef.current &&
          !hasSpokenThisTurnRef.current &&
          (statusRef.current === "listening" ||
            statusRef.current === "candidate-speaking")
        ) {
          setShowSilencePrompt(true);
        }
      }, NO_ANSWER_PROMPT_MS);
      setInterviewStatus(
        hasSpokenThisTurnRef.current ? "candidate-speaking" : "listening"
      );
    }
  }, [clearNoAnswerTimer]);

  // ---------- Media / navigation ----------

  const requestMedia = async () => {
    setErrorMessage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setCameraReady(true);
      setMicReady(true);
      setCameraOn(true);
      setMicOn(true);
      setStep("device-check");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Camera or microphone access was denied. Please allow permissions in your browser and try again."
      );
      setStep("error");
    }
  };

  const resetAccessForm = useCallback(() => {
    setAccessPhase("email-check");
    setEmail("");
    setFullName("");
    setPhone("");
    setPaymentPhone("");
    setPaidAccess(false);
    setCheckingEmail(false);
    setEmailCheckError(false);
    setSubmittingPayment(false);
    setPaymentSubmitError(null);
    stopPaidPolling();
  }, [stopPaidPolling]);

  const handleStartInterview = () => {
    // Reset access state every time the premium step opens
    resetAccessForm();
    setStep("payment");
  };

  /** Check Access button handler */
  const handleCheckAccess = async () => {
    const result = await checkPaidAccess();
    if (result === "paid") {
      stopPaidPolling();
      await requestMedia();
      return;
    }
    if (result === "unpaid") {
      // Pre-fill email on customer form; do not grant access
      setAccessPhase("customer-info");
      return;
    }
    // error | invalid: stay on email-check
  };

  /** Only proceed when paidAccess is true (from API). */
  const handleContinueWithPaidAccess = () => {
    if (!paidAccess) return;
    stopPaidPolling();
    requestMedia();
  };

  const handleCustomerInfoContinue = () => {
    const nameOk = fullName.trim().length >= 2;
    const emailOk = isValidEmail(email.trim().toLowerCase());
    const phoneOk = phone.trim().replace(/\D/g, "").length >= 10;
    const payPhoneOk = paymentPhone.trim().replace(/\D/g, "").length >= 10;
    if (!nameOk || !emailOk || !phoneOk || !payPhoneOk) {
      setPaymentSubmitError("Please fill in all fields with valid details.");
      return;
    }
    setPaymentSubmitError(null);
    setAccessPhase("jazzcash");
  };

  /** Record payment request only — does NOT unlock premium access. */
  const handleSubmitPaymentRequest = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (
      !fullName.trim() ||
      !isValidEmail(trimmedEmail) ||
      !phone.trim() ||
      !paymentPhone.trim() ||
      submittingPayment
    ) {
      return;
    }
    setSubmittingPayment(true);
    setPaymentSubmitError(null);
    try {
      const res = await fetch("/api/payment-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: trimmedEmail,
          phone: phone.trim(),
          paymentPhone: paymentPhone.trim(),
          amount: 250,
        }),
      });
      if (!res.ok) throw new Error("submission failed");
      setAccessPhase("waiting");
      // Stay locked until GET /api/paid-access returns paid: true
      startPaidPolling();
    } catch {
      setPaymentSubmitError(
        "Could not submit payment confirmation. Please try again."
      );
    } finally {
      setSubmittingPayment(false);
    }
  };

  const toggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const handleContinueToInterview = () => {
    startInterviewFlow();
  };

  const handleEndInterview = () => {
    // Same path as finishing after question 10 — preserve recorded answers
    if (statusRef.current === "finished" || isEnding) return;
    finishInterview("completed");
  };

  const handleBackToHome = () => {
    // Prefer client-side navigation when available (Next.js)
    if (typeof window !== "undefined") {
      try {
        // Soft navigate if next/router is used elsewhere; fallback to location
        window.location.href = "/";
      } catch {
        window.location.assign("/");
      }
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setStep("welcome");
    setCameraReady(false);
    setMicReady(false);
    setInterviewStatus("idle");
    setShowSilencePrompt(false);
  };

  // ========== SHARED UI ==========

  const CardShell = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );

  // ========== SCREENS ==========

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-lg">
            <CardShell>
              <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-5">
                  <Video className="w-7 h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  Your AI Interview is Ready
                </h1>
                <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                  Complete your AI-powered interview for the position you&apos;re
                  applying for.
                </p>
              </div>

              <div className="px-6 sm:px-8 pb-2">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Position
                      </p>
                      <p className="text-base font-semibold text-slate-900 mt-0.5">
                        {jobTitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-5 grid grid-cols-2 gap-3">
                {[
                  { icon: Sparkles, label: "AI Interview" },
                  { icon: Clock, label: "Up to 20 minutes" },
                  { icon: CheckCircle2, label: "10 questions" },
                  { icon: Camera, label: "Camera & mic required" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2.5 rounded-lg bg-white border border-slate-100 px-3 py-2.5"
                  >
                    <item.icon className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-sm text-slate-700 font-medium">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-6 sm:px-8 pb-8 pt-2">
                <button
                  onClick={handleStartInterview}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-3.5 px-5 transition-colors shadow-sm shadow-indigo-200"
                >
                  Start Interview
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="mt-4 text-center text-xs text-slate-500">
                  Secure · Private · Powered by Axora AI
                </p>
              </div>
            </CardShell>
          </div>
        </main>
      </div>
    );
  }

  if (step === "payment") {
    const trimmedEmail = email.trim().toLowerCase();
    const emailOk = isValidEmail(trimmedEmail);
    const nameOk = fullName.trim().length >= 2;
    const phoneOk = phone.trim().replace(/\D/g, "").length >= 10;
    const payPhoneOk = paymentPhone.trim().replace(/\D/g, "").length >= 10;
    const customerFormOk = nameOk && emailOk && phoneOk && payPhoneOk;

    const fieldClass =
      "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60";
    const labelClass =
      "block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5";

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-md">
            <CardShell>
              {/* ---------- 1. Email Access Check ---------- */}
              {accessPhase === "email-check" && (
                <>
                  <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-5">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                      Premium Access
                    </h1>
                    <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                      Enter the email used for your application to check if you
                      already have AI interview access.
                    </p>
                  </div>

                  <div className="px-6 sm:px-8 pb-2">
                    <label htmlFor="access-email" className={labelClass}>
                      Email Address
                    </label>
                    <input
                      id="access-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setPaidAccess(false);
                        setEmailCheckError(false);
                        setPaymentSubmitError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && emailOk && !checkingEmail) {
                          e.preventDefault();
                          handleCheckAccess();
                        }
                      }}
                      placeholder="you@example.com"
                      disabled={checkingEmail}
                      className={fieldClass}
                    />
                    {emailCheckError && (
                      <p className="mt-2 text-xs text-red-600">
                        Unable to verify access. Please try again.
                      </p>
                    )}
                  </div>

                  <div className="px-6 sm:px-8 pb-8 pt-4">
                    <button
                      onClick={handleCheckAccess}
                      disabled={!emailOk || checkingEmail}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-5 transition-colors shadow-sm shadow-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      {checkingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking your access…
                        </>
                      ) : (
                        <>
                          Check Access
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <p className="mt-4 text-center text-xs text-slate-500">
                      Access is only granted for verified paid emails.
                    </p>
                  </div>
                </>
              )}

              {/* ---------- 2. Customer + payment phone info ---------- */}
              {accessPhase === "customer-info" && (
                <>
                  <div className="px-6 sm:px-8 pt-8 pb-4 text-center">
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                      AI Interview Access Fee
                    </h1>
                    <p className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
                      ₨250{" "}
                      <span className="text-base font-medium text-slate-500">
                        one-time
                      </span>
                    </p>
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                      This is an AI service access fee, not a company
                      subscription fee.
                    </p>
                  </div>

                  <div className="px-6 sm:px-8 space-y-3.5 pb-2">
                    <div>
                      <label htmlFor="pay-full-name" className={labelClass}>
                        Full Name
                      </label>
                      <input
                        id="pay-full-name"
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="pay-email" className={labelClass}>
                        Email Address
                      </label>
                      <input
                        id="pay-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="pay-phone" className={labelClass}>
                        WhatsApp / Phone Number
                      </label>
                      <input
                        id="pay-phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="03XX XXXXXXX"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="pay-payment-phone" className={labelClass}>
                        Payment Phone Number
                      </label>
                      <input
                        id="pay-payment-phone"
                        type="tel"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        placeholder="Number you will pay from"
                        className={fieldClass}
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        The JazzCash number from which you will send ₨250.
                      </p>
                    </div>
                  </div>

                  {paymentSubmitError && (
                    <p className="px-6 sm:px-8 text-xs text-red-600 text-center">
                      {paymentSubmitError}
                    </p>
                  )}

                  <div className="px-6 sm:px-8 pb-8 pt-4 space-y-2.5">
                    <button
                      onClick={handleCustomerInfoContinue}
                      disabled={!customerFormOk}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-5 transition-colors shadow-sm shadow-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      Continue to Payment
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccessPhase("email-check");
                        setPaymentSubmitError(null);
                      }}
                      className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
                    >
                      Back to email check
                    </button>
                  </div>
                </>
              )}

              {/* ---------- 3. JazzCash QR ---------- */}
              {accessPhase === "jazzcash" && (
                <>
                  <div className="px-6 sm:px-8 pt-8 pb-4 text-center">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                      JazzCash Payment
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Scan the QR code using JazzCash and send{" "}
                      <span className="font-semibold text-slate-800">₨250</span>{" "}
                      from the payment number you provided.
                    </p>
                  </div>

                  <div className="px-6 sm:px-8">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/jazzcash-qr.png"
                        alt="JazzCash QR code"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                      />
                      <p className="mt-3 text-xs text-slate-500 text-center">
                        Scan with JazzCash
                      </p>
                    </div>
                  </div>

                  <div className="px-6 sm:px-8 py-5">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 text-left text-sm">
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-semibold text-slate-900">
                          ₨250
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-slate-500">JazzCash number</span>
                        <span className="font-medium text-slate-900 tabular-nums">
                          {JAZZCASH_RECEIVER}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 gap-3">
                        <span className="text-slate-500 shrink-0">
                          Paying from
                        </span>
                        <span className="font-medium text-slate-900 tabular-nums text-right">
                          {paymentPhone.trim() || "—"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed text-center">
                      Scan the QR code using JazzCash and send ₨250 from the
                      payment number you provided above.
                    </p>
                  </div>

                  {paymentSubmitError && (
                    <p className="px-6 sm:px-8 text-xs text-red-600 text-center mb-2">
                      {paymentSubmitError}
                    </p>
                  )}

                  <div className="px-6 sm:px-8 pb-8 space-y-2.5">
                    <button
                      onClick={handleSubmitPaymentRequest}
                      disabled={submittingPayment}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-5 transition-colors shadow-sm shadow-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      {submittingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "I've Completed Payment"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccessPhase("customer-info");
                        setPaymentSubmitError(null);
                      }}
                      className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
                    >
                      Back
                    </button>
                    <p className="text-center text-xs text-slate-500">
                      Submitting does not unlock access. Access is granted only
                      after payment verification.
                    </p>
                  </div>
                </>
              )}

              {/* ---------- 4. Waiting for verification ---------- */}
              {accessPhase === "waiting" && (
                <>
                  <div className="px-6 sm:px-8 pt-10 pb-6 text-center">
                    {paidAccess ? (
                      <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-5">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                          Premium access verified
                        </h1>
                        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                          Your payment has been confirmed. You can continue to
                          the interview.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-5">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                          Payment Submitted Successfully
                        </h1>
                        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                          Your payment details have been submitted and are
                          waiting for verification.
                        </p>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          Please wait for verification. You will be able to
                          continue once your access is activated.
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-3.5 py-1.5 text-sm font-medium text-amber-800">
                          <Clock className="w-4 h-4 shrink-0" />
                          Waiting for Verification
                        </div>
                      </>
                    )}
                  </div>

                  <div className="px-6 sm:px-8 pb-8 space-y-2.5">
                    {paidAccess ? (
                      <button
                        onClick={handleContinueWithPaidAccess}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-3.5 px-5 transition-colors shadow-sm shadow-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      >
                        Continue to Interview
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            const result = await checkPaidAccess();
                            if (result === "paid") {
                              /* UI updates via paidAccess */
                            }
                          }}
                          disabled={checkingEmail}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium py-3 px-4 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        >
                          {checkingEmail ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Checking your access…
                            </>
                          ) : (
                            "Check access status"
                          )}
                        </button>
                        {emailCheckError && (
                          <p className="text-center text-xs text-red-600">
                            Unable to verify access. Please try again.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAccessPhase("email-check");
                            setPaidAccess(false);
                            stopPaidPolling();
                          }}
                          className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
                        >
                          Check a different email
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardShell>
          </div>
        </main>
      </div>
    );
  }

  if (step === "device-check") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
          <div className="w-full max-w-2xl">
            <CardShell>
              <div className="px-6 sm:px-8 pt-8 pb-4 text-center">
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                  Check your camera and microphone
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Make sure everything looks and sounds good before you begin.
                </p>
              </div>

              <div className="px-6 sm:px-8 py-4">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      !cameraOn ? "opacity-0" : ""
                    }`}
                  />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <div className="text-center">
                        <VideoOff className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Camera is off</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          cameraReady && cameraOn
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-700/80 text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cameraReady && cameraOn
                              ? "bg-emerald-400"
                              : "bg-slate-400"
                          }`}
                        />
                        {cameraReady && cameraOn
                          ? "Camera ready"
                          : "Camera off"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          micReady && micOn
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-700/80 text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            micReady && micOn
                              ? "bg-emerald-400"
                              : "bg-slate-400"
                          }`}
                        />
                        {micReady && micOn
                          ? "Microphone ready"
                          : "Microphone off"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-4 flex items-center justify-center gap-3">
                <button
                  onClick={toggleCamera}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-full border transition-colors ${
                    cameraOn
                      ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                  }`}
                  aria-label="Toggle camera"
                >
                  {cameraOn ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={toggleMic}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-full border transition-colors ${
                    micOn
                      ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                  }`}
                  aria-label="Toggle microphone"
                >
                  {micOn ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="px-6 sm:px-8 pb-8 pt-2">
                <button
                  onClick={handleContinueToInterview}
                  disabled={!cameraReady}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-5 transition-colors shadow-sm"
                >
                  Continue to Interview
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </CardShell>
          </div>
        </main>
      </div>
    );
  }

  if (step === "interview") {
    const progress =
      ((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100;
    const currentQ =
      questions[currentQuestionIndex] || "Generating question...";
    const isLowTime = remainingSeconds <= 60;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col relative">
        {/* Compact top bar */}
        <div className="shrink-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {jobTitle}
              </p>
              <p className="text-xs text-slate-500">AI Interview · Axora</p>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Question
                </span>
                <span className="text-sm font-medium tabular-nums text-slate-800">
                  {Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS)} of{" "}
                  {TOTAL_QUESTIONS}
                </span>
              </div>
              <div className="w-24 sm:w-32">
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 text-sm font-medium tabular-nums ${
                  isLowTime ? "text-red-600" : "text-slate-700"
                }`}
              >
                <Clock
                  className={`w-4 h-4 ${
                    isLowTime ? "text-red-500" : "text-slate-400"
                  }`}
                />
                {formatTime(remainingSeconds)}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 gap-5 lg:gap-6">
          {/* Left: AI + Question */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* AI Interviewer card */}
            <div
              className={`relative rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden transition-shadow duration-500 ${
                interviewStatus === "ai-speaking"
                  ? "shadow-indigo-200/60 ring-1 ring-indigo-200"
                  : ""
              }`}
            >
              <div className="aspect-[16/9] sm:aspect-[21/9] max-h-[220px] sm:max-h-[260px] flex items-center justify-center relative bg-gradient-to-b from-slate-50 to-white">
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg transition-transform duration-500 ${
                      interviewStatus === "ai-speaking" ? "scale-105" : ""
                    }`}
                  >
                    {interviewStatus === "ai-speaking" && (
                      <>
                        <span className="absolute inset-0 rounded-full border-2 border-indigo-400/50 animate-ping opacity-40" />
                        <span className="absolute -inset-2 rounded-full border border-indigo-300/30" />
                      </>
                    )}
                    <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                      AI
                    </span>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-slate-800">
                      Axora AI Interviewer
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1.5">
                      {interviewStatus === "ai-speaking" ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                          Speaking...
                        </>
                      ) : interviewStatus === "generating" ||
                        interviewStatus === "processing" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                          {interviewStatus === "generating"
                            ? "Generating next question..."
                            : "Processing your answer..."}
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Ready
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Question card */}
            <div className="flex-1 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col min-h-[160px]">
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-2">
                Question {Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS)}
              </p>
              <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-medium">
                {currentQ}
              </p>

              <div className="mt-auto pt-5 flex flex-col gap-3">
                {(interviewStatus === "listening" ||
                  interviewStatus === "candidate-speaking") && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-end gap-1 h-6">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className={`w-1 rounded-full bg-indigo-500 transition-all ${
                            interviewStatus === "candidate-speaking"
                              ? "animate-pulse"
                              : "opacity-40"
                          }`}
                          style={{
                            height:
                              interviewStatus === "candidate-speaking"
                                ? `${10 + (i % 3) * 6}px`
                                : "8px",
                            animationDelay: `${i * 100}ms`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">
                      {interviewStatus === "candidate-speaking"
                        ? "Your answer is being recorded"
                        : "Listening..."}
                    </span>
                  </div>
                )}

                {interviewStatus === "processing" && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    Processing your answer...
                  </div>
                )}

                {interviewStatus === "generating" && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    Generating next question...
                  </div>
                )}

                {currentAnswerText &&
                  (interviewStatus === "candidate-speaking" ||
                    interviewStatus === "listening") && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic">
                      “{currentAnswerText}”
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Right: Candidate video + controls */}
          <div className="lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm aspect-video lg:aspect-[4/3]">
              <video
                ref={interviewVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  !cameraOn ? "opacity-0" : ""
                }`}
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="text-center">
                    <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Camera off</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2">
                <span className="text-xs font-medium text-white/90 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
                  You
                </span>
              </div>
              {(interviewStatus === "listening" ||
                interviewStatus === "candidate-speaking") && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-white bg-red-500/90 px-2 py-0.5 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    REC
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 py-2">
              <button
                onClick={toggleMic}
                disabled={isEnding}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  micOn
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                    : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 active:bg-red-50"
                }`}
                aria-label="Toggle microphone"
              >
                {micOn ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={toggleCamera}
                disabled={isEnding}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  cameraOn
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                    : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 active:bg-red-50"
                }`}
                aria-label="Toggle camera"
              >
                {cameraOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleEndInterview}
                disabled={isEnding || interviewStatus === "finished"}
                className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-sm font-medium transition-colors shadow-sm border border-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="End interview"
              >
                {isEnding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Ending...
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    End Interview
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 px-2">
              Speak clearly. The interview advances automatically when you pause.
              No need to click next.
            </p>
          </div>
        </main>

        {/* 30-second silence confirmation popup */}
        {showSilencePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
              <div className="px-6 pt-6 pb-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Are you ready to continue?
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  We haven&apos;t detected an answer yet.
                </p>
              </div>
              <div className="px-6 pb-6 flex flex-col gap-2.5">
                <button
                  onClick={handleSilenceNextQuestion}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 transition-colors"
                >
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSilenceImAnswering}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium py-3 px-4 transition-colors"
                >
                  I&apos;m Answering
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-lg">
            <CardShell className="text-center">
              <div className="px-6 sm:px-8 pt-10 pb-6">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <span className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  Interview Completed
                </h1>
                <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
                  Thank you for completing your AI interview. Your responses
                  have been submitted successfully.
                </p>
              </div>

              <div className="px-6 sm:px-8 pb-2">
                <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 text-left">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-sm text-slate-500">Position</span>
                    <span className="text-sm font-medium text-slate-900">
                      {jobTitle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-sm text-slate-500">
                      Questions answered
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {answers.length} of {TOTAL_QUESTIONS}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-sm text-slate-500">
                      Interview duration
                    </span>
                    <span className="text-sm font-medium text-slate-900 tabular-nums">
                      {formatTime(elapsedSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 pt-6 pb-4">
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-4 flex items-start gap-3 text-left">
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      {isSubmitting
                        ? "Submitting your interview..."
                        : "Your interview is now being evaluated"}
                    </p>
                    <p className="text-xs text-indigo-700/80 mt-1">
                      Results will be available shortly. You will be notified
                      once the evaluation is complete.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 pb-8">
                <button
                  onClick={handleBackToHome}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-3.5 px-5 transition-colors shadow-sm shadow-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </CardShell>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <CardShell className="text-center px-6 sm:px-8 py-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 mb-5">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {errorMessage ||
                "We could not access your camera or microphone. Please check your browser permissions and try again."}
            </p>
            <button
              onClick={handleRetry}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-5 transition-colors"
            >
              Try Again
            </button>
          </CardShell>
        </div>
      </main>
    </div>
  );
}