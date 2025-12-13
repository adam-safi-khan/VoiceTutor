'use client';

/**
 * Topic Selector Component (Inline Version)
 * 
 * Displays topic options inline within the session UI.
 * Features:
 * - Animated slide-in as each topic becomes visible via visibleNumbers prop
 * - Selection highlighting with gold pulse animation
 * - Fade out of non-selected options after selection
 */

import { useEffect, useState } from 'react';
import type { PresentedTopic } from '@/types/session';

interface TopicSelectorProps {
  topics: PresentedTopic[];
  visibleNumbers: number[];  // Which topic numbers are currently visible
  selectedOption: number | null;
  onDismiss: () => void;
}

export default function TopicSelector({ 
  topics, 
  visibleNumbers,
  selectedOption, 
  onDismiss 
}: TopicSelectorProps) {
  const [isExiting, setIsExiting] = useState(false);
  
  // Auto-dismiss after selection animation completes
  useEffect(() => {
    if (selectedOption !== null) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDismiss, 500); // Wait for exit animation
      }, 2500); // Show selection for 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [selectedOption, onDismiss]);

  // Don't render if no topics yet
  if (topics.length === 0) return null;

  return (
    <div 
      className={`transition-all duration-500 ${
        isExiting ? 'opacity-0 transform -translate-y-4' : 'opacity-100'
      }`}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h3 
          className="text-lg font-semibold text-[var(--oxford-blue)]"
          style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
        >
          {selectedOption ? '✨ Great choice!' : 'Choose Your Topic'}
        </h3>
        {!selectedOption && visibleNumbers.length < 3 && (
          <p className="text-sm text-[var(--slate)] mt-1">Listening for topics...</p>
        )}
      </div>
      
      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((num) => {
          const topic = topics.find(t => t.optionNumber === num);
          const isVisible = visibleNumbers.includes(num);
          const isSelected = selectedOption === num;
          const isNotSelected = selectedOption !== null && selectedOption !== num;
          
          return (
            <div
              key={num}
              className={`
                relative rounded-xl p-4 border-2 transition-all duration-500 min-h-[100px]
                ${isVisible && topic ? 'opacity-100 transform translate-y-0' : 'opacity-30 transform translate-y-2'}
                ${!isVisible ? 'border-dashed' : ''}
                ${isSelected 
                  ? 'border-[var(--gold)] bg-[var(--gold)]/10 scale-105 shadow-lg animate-gold-pulse' 
                  : isNotSelected
                    ? 'border-[var(--silver)]/30 bg-gray-50 opacity-30 scale-95'
                    : isVisible && topic 
                      ? 'border-[var(--oxford-blue)]/20 bg-white'
                      : 'border-[var(--silver)]/20 bg-[var(--cream)]'
                }
              `}
            >
              {/* Option number badge */}
              <div 
                className={`
                  absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm
                  ${isSelected 
                    ? 'bg-[var(--gold)] text-white' 
                    : isVisible && topic
                      ? 'bg-[var(--oxford-blue)] text-white'
                      : 'bg-[var(--silver)]/50 text-white'
                  }
                `}
              >
                {num}
              </div>
              
              {isVisible && topic ? (
                <div className="pt-1">
                  <h4 
                    className={`font-semibold text-sm mb-1 ${
                      isSelected ? 'text-[var(--oxford-blue)]' : 'text-[var(--charcoal)]'
                    }`}
                    style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
                  >
                    {topic.title}
                  </h4>
                  <p className="text-xs text-[var(--slate)] line-clamp-2">
                    {topic.description}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-[var(--silver)] text-sm">
                    <span className="opacity-50">Waiting...</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Instruction text */}
      {!selectedOption && visibleNumbers.length === 3 && (
        <p className="text-center text-sm text-[var(--slate)] mt-3">
          Tell your tutor which one interests you most
        </p>
      )}
    </div>
  );
}
