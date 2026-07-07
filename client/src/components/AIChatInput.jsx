import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
 
const PLACEHOLDERS = [
  "Compare TS and AP school enrollment",
  "Which district has the best infrastructure?",
  "Analyze the student-teacher ratio",
  "Summarize the recent complaints",
  "What is the average priority score?",
];
 
export function AIChatInput({ onSend, disabled, useWeb, setUseWeb }) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
 
  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue) return;
 
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);
 
    return () => clearInterval(interval);
  }, [isActive, inputValue]);
 
  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        if (!inputValue) setIsActive(false);
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);
 
  const handleActivate = () => {
    setIsActive(true);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
       onSend(inputValue.trim());
       setInputValue("");
       setIsActive(false);
    }
  };
 
  const containerVariants = {
    collapsed: {
      height: 60,
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 110,
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.08)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  };
 
  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };
 
  const letterVariants = {
    initial: { opacity: 0, filter: "blur(12px)", y: 10 },
    animate: {
      opacity: 1, filter: "blur(0px)", y: 0,
      transition: {
        opacity: { duration: 0.25 }, filter: { duration: 0.4 }, y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0, filter: "blur(12px)", y: -10,
      transition: {
        opacity: { duration: 0.2 }, filter: { duration: 0.3 }, y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
  };
 
  return (
    <div className="w-full flex justify-center items-center text-black" style={{ background: 'rgba(0,0,0,0.015)', padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
      <motion.div
        ref={wrapperRef}
        className="w-full"
        variants={containerVariants}
        animate={isActive || inputValue ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "hidden", borderRadius: 24, background: "#fff", border: '1px solid var(--border-subtle)' }}
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          {/* Input Row */}
          <div className="flex items-center gap-2 p-2 rounded-full bg-white w-full h-[60px]">
            <button
              className="p-2 ml-1 rounded-full hover:bg-gray-100 transition"
              title="Attach file"
              type="button"
              tabIndex={-1}
              style={{ flexShrink: 0 }}
            >
              <Paperclip size={18} color="var(--text-muted)" />
            </button>
 
            {/* Text Input & Placeholder */}
            <div className="relative flex-1 h-full flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                disabled={disabled}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 border-0 outline-0 py-2 text-sm bg-transparent w-full font-normal"
                style={{ position: "relative", zIndex: 1, color: "var(--text-primary)" }}
                onFocus={handleActivate}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none text-sm"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {PLACEHOLDERS[placeholderIndex]
                        .split("")
                        .map((char, i) => (
                          <motion.span
                            key={i}
                            variants={letterVariants}
                            style={{ display: "inline-block" }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
 
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition flex-shrink-0"
              title="Voice input"
              type="button"
              tabIndex={-1}
            >
              <Mic size={18} color="var(--text-muted)" />
            </button>
            <button
              onClick={handleSend}
              disabled={disabled || !inputValue.trim()}
              className="flex items-center gap-1 p-2 mr-1 rounded-full font-medium justify-center transition-all flex-shrink-0"
              style={{
                background: disabled || !inputValue.trim() ? 'rgba(0,0,0,0.05)' : '#111',
                color: disabled || !inputValue.trim() ? 'var(--text-muted)' : 'white',
                cursor: disabled || !inputValue.trim() ? 'not-allowed' : 'pointer',
                width: 36, height: 36
              }}
              title="Send"
              type="button"
              tabIndex={-1}
            >
              <Send size={16} />
            </button>
          </div>
 
          {/* Expanded Controls */}
          <motion.div
            className="w-full flex justify-start px-4 items-center text-xs"
            variants={{
              hidden: { opacity: 0, y: 10, pointerEvents: "none", transition: { duration: 0.2 } },
              visible: { opacity: 1, y: 0, pointerEvents: "auto", transition: { duration: 0.3, delay: 0.05 } },
            }}
            initial="hidden"
            animate={isActive || inputValue ? "visible" : "hidden"}
            style={{ marginTop: 2, paddingBottom: 12 }}
          >
            <div className="flex gap-2 items-center">
              {/* Think Toggle */}
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-all font-medium group"
                style={{
                  background: thinkActive ? 'var(--orange-dim)' : 'rgba(0,0,0,0.04)',
                  color: thinkActive ? 'var(--orange)' : 'var(--text-secondary)',
                  border: thinkActive ? '1px solid var(--border-accent)' : '1px solid transparent'
                }}
                title="Think"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThinkActive((a) => !a);
                }}
              >
                <Lightbulb size={14} color={thinkActive ? 'var(--orange)' : 'var(--text-muted)'} />
                Think
              </button>
 
              {/* Deep Search Toggle (maps to TinyFish Web useWeb) */}
              <motion.button
                className="flex items-center gap-1 py-1.5 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start"
                style={{
                  background: useWeb ? 'var(--orange-dim)' : 'rgba(0,0,0,0.04)',
                  color: useWeb ? 'var(--orange)' : 'var(--text-secondary)',
                  border: useWeb ? '1px solid var(--border-accent)' : '1px solid transparent'
                }}
                title="Web Context"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUseWeb((a) => !a);
                }}
                initial={false}
                animate={{
                  width: useWeb ? 104 : 34,
                  paddingLeft: useWeb ? 10 : 9,
                  paddingRight: useWeb ? 12 : 9
                }}
              >
                <div className="flex-shrink-0" style={{ display: 'flex', alignItems: 'center' }}>
                  <Globe size={14} color={useWeb ? 'var(--orange)' : 'var(--text-muted)'} />
                </div>
                <motion.span
                  style={{ display: 'inline-block', paddingBottom: 1, marginLeft: 2 }}
                  initial={false}
                  animate={{ opacity: useWeb ? 1 : 0 }}
                >
                  Web Context
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
