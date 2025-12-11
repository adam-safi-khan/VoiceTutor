'use client';

/**
 * Voice Session Component
 * 
 * Core voice tutoring interface using raw WebRTC for full control.
 * Features:
 * - WebRTC connection to OpenAI Realtime API
 * - Proper pause/resume with audio buffer clearing
 * - Function calling for session orchestration
 * - Time tracking and auto-end
 * - Transcript and skill observation logging
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getTutorPrompt } from '@/lib/openai/prompts/tutorPrompt';
import { formatToolsForSession } from '@/lib/openai/tools/tutorTools';
import TopicSelector from './TopicSelector';
import type { LearnerProfile } from '@/types/database-helpers';
import type {
  SessionStatus,
  TutorialPhase,
  TranscriptEntry,
  SkillObservation,
  SessionOpenLoop,
  SessionVisual,
  LessonPlanModification,
  SessionMisconception,
  GeneratedTopic,
  FunctionCall,
  PresentedTopic,
} from '@/types/session';

interface VoiceSessionProps {
  userId: string;
  userName?: string;
  ageBracket?: string;
  sessionCount?: number;
}

export default function VoiceSession({ 
  userId, 
  userName,
  ageBracket,
  sessionCount = 0 
}: VoiceSessionProps) {
  // Core state
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Session orchestration state
  const [currentPhase, setCurrentPhase] = useState<TutorialPhase>('warm_entry');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [visuals, setVisuals] = useState<SessionVisual[]>([]);
  
  // Topic presentation state
  const [presentedTopics, setPresentedTopics] = useState<PresentedTopic[]>([]);
  const [selectedTopicOption, setSelectedTopicOption] = useState<number | null>(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  
  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const prePauseStatusRef = useRef<SessionStatus>('connected');
  
  // Activity tracking for better resume context
  type ActivityState = 'greeting' | 'offering_topics' | 'awaiting_selection' | 'discussing' | 'reflecting';
  const [currentActivity, setCurrentActivity] = useState<ActivityState>('greeting');
  const currentActivityRef = useRef<ActivityState>('greeting');
  
  // Restart confirmation
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  
  // Transcript collapsed state (collapsed by default)
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  
  // Refs for WebRTC
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Session data refs (use refs to avoid stale closures)
  const sessionIdRef = useRef<string | null>(null);
  const learnerProfileRef = useRef<LearnerProfile | null>(null);
  const topicsRef = useRef<GeneratedTopic[]>([]);
  const skillObservationsRef = useRef<SkillObservation[]>([]);
  const openLoopsRef = useRef<SessionOpenLoop[]>([]);
  const lessonPlanModsRef = useRef<LessonPlanModification[]>([]);
  const misconceptionsRef = useRef<SessionMisconception[]>([]);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  
  // Timer refs
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);
  
  // Keep isPausedRef in sync
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  
  // Keep transcriptRef in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  
  // Keep currentActivityRef in sync
  useEffect(() => {
    currentActivityRef.current = currentActivity;
  }, [currentActivity]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time remaining (35 min max)
  const timeRemaining = Math.max(0, 35 * 60 - elapsedSeconds);
  const minutesRemaining = Math.floor(timeRemaining / 60);

  // Start timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
    timerIntervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 1000);
  }, [elapsedSeconds]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  // Send time update to AI
  const sendTimeUpdate = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') return;
    if (isPausedRef.current) return;
    
    const remaining = Math.max(0, 35 - Math.floor(elapsedSeconds / 60));
    
    let timeInstruction = `[TIME UPDATE: ${remaining} minutes remaining]`;
    if (remaining <= 5) {
      timeInstruction += '\n⚠️ BEGIN WRAP-UP: Move to reflection phase.';
    }
    if (remaining <= 3) {
      timeInstruction += '\n⚠️ FINAL MINUTES: Complete reflection, close warmly.';
    }
    
    dataChannelRef.current.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: timeInstruction
      }
    }));
  }, [elapsedSeconds]);

  // Generate lesson plan when topic is selected
  const generateLessonPlan = useCallback(async (topicTitle: string, userPriorKnowledge: string) => {
    try {
      const response = await fetch('/api/lesson-plan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle,
          userPriorKnowledge,
          userAge: ageBracket ? parseInt(ageBracket.split('-')[0]) : undefined,
          sessionCount,
        })
      });

      if (!response.ok) {
        console.error('Failed to generate lesson plan');
        return;
      }

      const { formattedPlan } = await response.json();

      // Inject lesson plan into session via session.update
      if (dataChannelRef.current?.readyState === 'open' && formattedPlan) {
        dataChannelRef.current.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: `[LESSON PLAN GENERATED - Follow this plan while staying responsive to the learner]\n\n${formattedPlan}`
          }
        }));
        console.log('Lesson plan injected into session');
      }
    } catch (error) {
      console.error('Lesson plan generation error:', error);
    }
  }, [ageBracket, sessionCount]);

  // Handle function calls from AI
  const handleFunctionCall = useCallback((functionCall: FunctionCall) => {
    const args = JSON.parse(functionCall.arguments);
    
    switch (functionCall.name) {
      case 'transition_phase':
        setCurrentPhase(args.phase as TutorialPhase);
        // Update activity state based on phase
        if (args.phase === 'reflection') {
          setCurrentActivity('reflecting');
        } else if (args.phase !== 'warm_entry') {
          setCurrentActivity('discussing');
        }
        break;
        
      case 'log_skill_observation':
        skillObservationsRef.current.push({
          skill: args.skill,
          observation: args.observation,
          evidence: args.evidence || '',
          strength_or_struggle: args.strength_or_struggle,
          timestamp: Date.now()
        });
        break;
        
      case 'create_open_loop':
        openLoopsRef.current.push({
          topic: args.topic,
          context: args.context,
          priority: args.priority || 'medium',
          timestamp: Date.now()
        });
        break;
        
      case 'display_visual':
        setVisuals(prev => [...prev, {
          type: args.type,
          description: args.description,
          timestamp: Date.now()
        }]);
        break;
        
      case 'update_lesson_plan':
        lessonPlanModsRef.current.push({
          modification: args.modification,
          rationale: args.rationale,
          timestamp: Date.now()
        });
        break;
        
      case 'flag_misconception':
        misconceptionsRef.current.push({
          misconception: args.misconception,
          topic_area: args.topic_area,
          addressed: args.addressed === 'true',
          timestamp: Date.now()
        });
        break;
        
      case 'present_topic_option':
        // Show the topic selector and add this topic
        setShowTopicSelector(true);
        setCurrentActivity('offering_topics');
        setPresentedTopics(prev => {
          // Avoid duplicates
          const existing = prev.find(t => t.optionNumber === parseInt(args.option_number));
          if (existing) return prev;
          return [...prev, {
            optionNumber: parseInt(args.option_number) as 1 | 2 | 3,
            title: args.title,
            description: args.description,
            isSelected: false,
            timestamp: Date.now()
          }];
        });
        // After presenting all 3, update activity
        if (parseInt(args.option_number) === 3) {
          setCurrentActivity('awaiting_selection');
        }
        break;
        
      case 'confirm_topic_selection':
        // Highlight the selected topic
        setSelectedTopicOption(parseInt(args.selected_option));
        setPresentedTopics(prev => prev.map(t => ({
          ...t,
          isSelected: t.optionNumber === parseInt(args.selected_option)
        })));
        break;
        
      case 'select_topic':
        // Topic selected - trigger lesson plan generation
        setCurrentActivity('discussing');
        // Call lesson plan generation API
        generateLessonPlan(args.topic_title, args.user_prior_knowledge || 'none stated');
        break;
    }
    
    // Send function output back
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: functionCall.call_id,
          output: JSON.stringify({ success: true })
        }
      }));
      
      // Trigger response to continue
      dataChannelRef.current.send(JSON.stringify({
        type: 'response.create'
      }));
    }
  }, [generateLessonPlan]);

  // Handle data channel messages
  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'session.created':
        case 'session.updated':
          console.log('Session event:', data.type);
          break;
          
        case 'response.done':
          // Check for function calls
          const outputs = data.response?.output || [];
          for (const output of outputs) {
            if (output.type === 'function_call') {
              handleFunctionCall({
                name: output.name,
                call_id: output.call_id,
                arguments: output.arguments
              });
            }
          }
          break;
          
        case 'response.output_audio_transcript.delta':
          // AI speech transcript update
          if (data.delta) {
            setTranscript(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, text: last.text + data.delta }];
              }
              return [...prev, { role: 'assistant', text: data.delta, timestamp: Date.now() }];
            });
          }
          break;
          
        case 'conversation.item.added':
        case 'conversation.item.done':
          // User speech transcribed
          if (data.item?.role === 'user' && data.item?.content) {
            const textContent = data.item.content.find((c: any) => c.type === 'input_text' || c.transcript);
            if (textContent) {
              const text = textContent.text || textContent.transcript || '';
              if (text.trim()) {
                setTranscript(prev => [...prev, { 
                  role: 'user', 
                  text: text.trim(), 
                  timestamp: Date.now() 
                }]);
              }
            }
          }
          break;
          
        case 'input_audio_buffer.speech_started':
          console.log('User started speaking');
          break;
          
        case 'input_audio_buffer.speech_stopped':
          console.log('User stopped speaking');
          break;
          
        case 'error':
          // Filter expected pause-related errors
          const isPauseRelated = isPausedRef.current && (
            data.error?.message?.includes('response.cancel') ||
            data.error?.message?.includes('audio_buffer.clear') ||
            data.error?.code === 'response_cancel_not_active'
          );
          
          if (!isPauseRelated) {
            console.error('Session error:', data);
            setError(data.error?.message || 'Session error occurred');
          }
          break;
      }
    } catch (err) {
      console.error('Error parsing data channel message:', err);
    }
  }, [handleFunctionCall]);

  // Start session - establish WebRTC connection
  const startSession = async () => {
    setStatus('connecting');
    setError(null);
    setTranscript([]);
    setElapsedSeconds(0);
    setCurrentPhase('warm_entry');
    setVisuals([]);
    setIsPaused(false);
    
    // Reset topic presentation state
    setPresentedTopics([]);
    setSelectedTopicOption(null);
    setShowTopicSelector(false);
    setCurrentActivity('greeting');
    
    // Reset refs
    skillObservationsRef.current = [];
    openLoopsRef.current = [];
    lessonPlanModsRef.current = [];
    misconceptionsRef.current = [];

    try {
      // 1. Get ephemeral token from backend
      const response = await fetch('/api/session/create', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const { ephemeralKey, learnerProfile, sessionId, topics } = await response.json();
      
      sessionIdRef.current = sessionId;
      learnerProfileRef.current = learnerProfile;
      topicsRef.current = topics || [];

      // 2. Get microphone access
      const localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      localStreamRef.current = localStream;

      // 3. Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      // 4. Set up audio output
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;
      
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 5. Add microphone track
      pc.addTrack(localStream.getTracks()[0]);

      // 6. Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      
      dc.onopen = () => {
        console.log('Data channel opened');
        
        // Configure session with tools and instructions
        const sessionConfig = {
          type: 'session.update',
          session: {
            type: 'realtime',
            model: 'gpt-realtime',
            instructions: getTutorPrompt(learnerProfile, {
              topics: topicsRef.current,
              sessionCount,
              ageBracket,
              userName
            }),
            tools: formatToolsForSession(),
            tool_choice: 'auto',
            audio: {
              input: {
                turn_detection: { type: 'semantic_vad' }
              },
              output: { voice: 'sage' }
            }
          }
        };
        
        dc.send(JSON.stringify(sessionConfig));
      };
      
      dc.onmessage = handleDataChannelMessage;
      
      dc.onerror = (err) => {
        console.error('Data channel error:', err);
      };

      // 7. Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 8. Exchange SDP with OpenAI
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to establish WebRTC connection');
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setStatus('connected');
      startTimer();
      
      // Start time update interval (every 5 minutes)
      timeUpdateIntervalRef.current = setInterval(() => {
        sendTimeUpdate();
      }, 5 * 60 * 1000);

    } catch (err) {
      console.error('Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setStatus('error');
      cleanup();
    }
  };

  // Pause session
  const pauseSession = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.warn('Data channel not available for pause');
      return;
    }

    prePauseStatusRef.current = status;
    setIsPaused(true);
    setStatus('paused');

    // 1. Disable microphone (don't stop - maintains connection)
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }

    // 2. Cancel any active AI response
    dataChannelRef.current.send(JSON.stringify({
      type: 'response.cancel',
      event_id: `pause_cancel_${Date.now()}`
    }));

    // 3. Clear output audio buffer
    dataChannelRef.current.send(JSON.stringify({
      type: 'output_audio_buffer.clear',
      event_id: `pause_clear_output_${Date.now()}`
    }));

    // 4. Clear input audio buffer
    dataChannelRef.current.send(JSON.stringify({
      type: 'input_audio_buffer.clear',
      event_id: `pause_clear_input_${Date.now()}`
    }));

    // 5. Pause audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  }, [status]);

  // Get activity-specific resume context and instructions
  const getResumeContext = useCallback(() => {
    const activity = currentActivityRef.current;
    
    switch (activity) {
      case 'greeting':
        return {
          context: '(The session was paused during the initial greeting.)',
          instructions: `The tutorial was briefly paused during your greeting.
            1. Say "Welcome back!" warmly.
            2. Continue with your greeting and then offer the 3 topic options.
            3. Remember to say "First...", "Second...", "Third..." as you present each option.`
        };
      case 'offering_topics':
        return {
          context: '(The session was paused while you were presenting topic options.)',
          instructions: `The tutorial was paused while you were presenting topic options.
            1. Say "Welcome back!" briefly.
            2. You may have been mid-way through presenting topics. Ask if they'd like you to go through the options again.
            3. If they say yes, re-present all 3 options clearly with "First...", "Second...", "Third...".
            4. If they remember, ask which one interests them most.`
        };
      case 'awaiting_selection':
        return {
          context: '(The session was paused after you presented 3 topic options. I was about to choose.)',
          instructions: `The tutorial was paused after you presented all 3 topic options.
            1. Say "Welcome back!" briefly.
            2. Ask which topic interested them most - do NOT re-list all topics.
            3. If they've forgotten, offer to briefly remind them of the options.`
        };
      case 'discussing':
        return {
          context: '(The session was paused during our discussion.)',
          instructions: `The tutorial was paused during the main discussion.
            1. Say "Welcome back!" or "Let's continue" briefly.
            2. Do NOT discuss the pause.
            3. Continue exactly where you left off - if you were mid-question, repeat it.
            4. If you were waiting for their response, indicate you're listening.`
        };
      case 'reflecting':
        return {
          context: '(The session was paused during the reflection/wrap-up phase.)',
          instructions: `The tutorial was paused during reflection.
            1. Say "Welcome back!" briefly.
            2. Continue with the reflection - ask for their summary or final thoughts.
            3. Be mindful of time - wrap up warmly.`
        };
      default:
        return {
          context: '(The session was paused briefly. I am ready to continue.)',
          instructions: `The tutorial was briefly paused.
            1. Acknowledge briefly: "Welcome back!" - nothing elaborate.
            2. Continue where you left off.
            3. Maintain your warm, Socratic tone.`
        };
    }
  }, []);

  // Resume session
  const resumeSession = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.warn('Data channel not available for resume');
      return;
    }

    // 1. Re-enable microphone
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }

    // 2. Resume audio element
    if (audioElementRef.current) {
      audioElementRef.current.play().catch(err => {
        console.error('Audio resume failed:', err);
      });
    }

    // 3. Get activity-specific context and instructions
    const { context, instructions } = getResumeContext();

    // 4. Inject context message with specific activity state
    dataChannelRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      event_id: `resume_context_${Date.now()}`,
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: context
        }]
      }
    }));

    // 5. Prompt AI to continue with activity-specific instructions
    setTimeout(() => {
      if (dataChannelRef.current?.readyState === 'open' && !isPausedRef.current) {
        dataChannelRef.current.send(JSON.stringify({
          type: 'response.create',
          event_id: `resume_continue_${Date.now()}`,
          response: {
            instructions: instructions
          }
        }));
      }
    }, 200);

    setIsPaused(false);
    setStatus('connected');
  }, [getResumeContext]);

  // Cleanup resources
  const cleanup = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
    
    stopTimer();
  }, [stopTimer]);

  // End session
  const endSession = async () => {
    setStatus('ending');
    
    cleanup();

    // Save session data to backend
    try {
      if (sessionIdRef.current) {
        await fetch('/api/session-end', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            transcript: transcriptRef.current,
            skillObservations: skillObservationsRef.current,
            openLoops: openLoopsRef.current,
            lessonPlanMods: lessonPlanModsRef.current,
            misconceptions: misconceptionsRef.current,
            duration: elapsedSeconds,
            phase: currentPhase,
          })
        });
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }

    setStatus('idle');
    setElapsedSeconds(0);
    sessionIdRef.current = null;
  };

  // Restart session (only first 5 mins)
  const confirmRestart = () => {
    if (elapsedSeconds <= 5 * 60) {
      setShowRestartConfirm(true);
    }
  };

  const executeRestart = async () => {
    setShowRestartConfirm(false);
    cleanup();
    await startSession();
  };

  // Auto-end at 35 minutes
  useEffect(() => {
    if (elapsedSeconds >= 35 * 60 && status === 'connected') {
      console.log('Auto-ending session at 35 minutes');
      endSession();
    }
  }, [elapsedSeconds, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Dismiss visual
  const dismissVisual = (index: number) => {
    setVisuals(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Idle State */}
      {status === 'idle' && (
        <div className="card-elevated p-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[var(--oxford-blue)]/5 rounded-full mb-6">
            <svg className="w-12 h-12 text-[var(--oxford-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-semibold text-[var(--oxford-blue)] mb-3" style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}>
            Ready for Your Tutorial
          </h2>
          
          <p className="text-[var(--slate)] max-w-lg mx-auto mb-8">
            Start a 30-minute voice conversation with your AI tutor. 
            You'll explore fascinating topics through Socratic dialogue.
          </p>

          <button onClick={startSession} className="btn-primary text-lg px-10 py-4">
            <svg className="w-5 h-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Start Tutorial
          </button>
        </div>
      )}

      {/* Connecting State */}
      {status === 'connecting' && (
        <div className="card-elevated p-12 text-center">
          <div className="spinner spinner-dark w-12 h-12 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-[var(--oxford-blue)] mb-2">Connecting...</h2>
          <p className="text-[var(--slate)]">Setting up your tutorial session</p>
        </div>
      )}

      {/* Connected/Paused State */}
      {(status === 'connected' || status === 'paused') && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {status === 'connected' ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-[var(--charcoal)]">Recording</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[var(--gold)] rounded-full" />
                    <span className="text-sm font-medium text-[var(--charcoal)]">Paused</span>
                  </div>
                )}
                
                <div className="text-2xl font-semibold text-[var(--oxford-blue)]">
                  {formatTime(elapsedSeconds)}
                </div>
                
                <div className="text-sm text-[var(--slate)] hidden sm:block">
                  Phase: {currentPhase.replace('_', ' ')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status === 'connected' ? (
                  <button onClick={pauseSession} className="btn-ghost" title="Pause">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                ) : (
                  <button onClick={resumeSession} className="btn-ghost" title="Resume">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}

                {elapsedSeconds <= 5 * 60 && (
                  <button onClick={confirmRestart} className="btn-ghost" title="Restart (available first 5 mins)">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}

                <button onClick={endSession} className="btn-secondary">
                  End Tutorial
                </button>
              </div>
            </div>

            {/* Time Warning */}
            {minutesRemaining <= 3 && minutesRemaining > 0 && (
              <div className="mt-4 p-3 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-lg">
                <p className="text-sm text-[var(--oxford-blue)] font-medium">
                  ⏰ Session will end in {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Waveform / Topic Selection Area */}
          <div className="card p-6 sm:p-8 text-center relative overflow-hidden min-h-[180px]">
            {/* Pause Overlay - positioned inside the waveform card with proper padding */}
            {status === 'paused' && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10 p-8">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-[var(--gold)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-[var(--oxford-blue)] text-lg mb-2">Tutorial Paused</p>
                  <p className="text-sm text-[var(--slate)]">Click Resume above to continue</p>
                </div>
              </div>
            )}
            
            {/* Topic Selector - shown inline when topics are being presented */}
            {showTopicSelector && presentedTopics.length > 0 ? (
              <TopicSelector
                topics={presentedTopics}
                selectedOption={selectedTopicOption}
                onDismiss={() => {
                  setShowTopicSelector(false);
                  setPresentedTopics([]);
                  setSelectedTopicOption(null);
                }}
              />
            ) : (
              <>
                {/* Waveform bars */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {status === 'connected' ? (
                    <>
                      <div className="w-2 h-8 bg-[var(--oxford-blue)] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-12 bg-[var(--oxford-blue)] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-6 bg-[var(--oxford-blue)] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      <div className="w-2 h-10 bg-[var(--oxford-blue)] rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                      <div className="w-2 h-8 bg-[var(--oxford-blue)] rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-4 bg-[var(--silver)] rounded-full" />
                      <div className="w-2 h-4 bg-[var(--silver)] rounded-full" />
                      <div className="w-2 h-4 bg-[var(--silver)] rounded-full" />
                      <div className="w-2 h-4 bg-[var(--silver)] rounded-full" />
                      <div className="w-2 h-4 bg-[var(--silver)] rounded-full" />
                    </>
                  )}
                </div>
                
                <p className="text-[var(--slate)]">
                  {status === 'connected' ? '🎙️ Listening...' : '⏸️ Paused'}
                </p>
              </>
            )}
          </div>

          {/* Transcript - Collapsible */}
          {transcript.length > 0 && (
            <div className="card overflow-hidden">
              {/* Clickable header to toggle */}
              <button
                onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-[var(--cream)] transition-colors"
              >
                <h3 className="text-lg font-semibold text-[var(--oxford-blue)]">
                  Conversation
                  <span className="text-sm font-normal text-[var(--slate)] ml-2">
                    ({transcript.length} message{transcript.length !== 1 ? 's' : ''})
                  </span>
                </h3>
                <svg 
                  className={`w-5 h-5 text-[var(--slate)] transition-transform duration-200 ${transcriptExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Expandable content */}
              <div 
                className={`transition-all duration-300 overflow-hidden ${
                  transcriptExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-4 pt-0 space-y-3 max-h-96 overflow-y-auto">
                  {transcript.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg ${
                        item.role === 'user' 
                          ? 'bg-[var(--oxford-blue)]/5 ml-8' 
                          : 'bg-[var(--cream-dark)] mr-8'
                      }`}
                    >
                      <div className="text-xs text-[var(--silver)] mb-1">
                        {item.role === 'user' ? 'You' : 'Tutor'}
                      </div>
                      <p className="text-[var(--charcoal)]">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Display */}
      {visuals.length > 0 && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-2xl border border-[var(--oxford-blue)]/10 overflow-hidden z-30">
          <div className="p-3 bg-[var(--oxford-blue)] text-white flex justify-between items-center">
            <span className="text-sm font-medium">
              {visuals[visuals.length - 1].type === 'diagram' && '📊 Diagram'}
              {visuals[visuals.length - 1].type === 'image' && '🖼️ Image'}
              {visuals[visuals.length - 1].type === 'whiteboard' && '📝 Whiteboard'}
              {visuals[visuals.length - 1].type === 'chart' && '📈 Chart'}
            </span>
            <button onClick={() => dismissVisual(visuals.length - 1)} className="text-white/70 hover:text-white">
              ✕
            </button>
          </div>
          <div className="p-4">
            <div className="bg-[var(--cream)] rounded-lg p-4 min-h-[150px] flex items-center justify-center text-center">
              <p className="text-[var(--slate)] text-sm">{visuals[visuals.length - 1].description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="card-elevated p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-semibold text-[var(--oxford-blue)] mb-2">Connection Error</h2>
          <p className="text-[var(--slate)] mb-6 max-w-md mx-auto">
            {error || 'Unable to connect. Please check your internet connection and try again.'}
          </p>

          <button onClick={startSession} className="btn-primary">Try Again</button>
        </div>
      )}

      {/* Ending State */}
      {status === 'ending' && (
        <div className="card-elevated p-12 text-center">
          <div className="spinner spinner-dark w-12 h-12 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-[var(--oxford-blue)] mb-2">Ending Session...</h2>
          <p className="text-[var(--slate)]">Saving your progress</p>
        </div>
      )}

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-elevated p-8 max-w-md w-full">
            <h3 className="text-2xl font-semibold text-[var(--oxford-blue)] mb-3" style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}>
              Restart Tutorial?
            </h3>
            <p className="text-[var(--slate)] mb-6">
              This will end your current session and start a new one. Your progress will not be saved.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRestartConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={executeRestart} className="btn-primary flex-1">Restart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
