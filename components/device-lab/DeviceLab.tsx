"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import * as THREE from "three";
import DeviceStage from "./DeviceStage";
import { createDefaultLabSettings } from "./device-settings";
import styles from "./device-lab.module.css";

export interface DeviceLabProps {
  onReady?: () => void;
}

export default function DeviceLab({ onReady }: DeviceLabProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [mobileOptimized, setMobileOptimized] = useState(false);
  const readySignaled = useRef(false);
  const settings = useMemo(createDefaultLabSettings, []);
  const scrollTrack = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollTrack,
    offset: ["start start", "end end"],
  });
  // Keep the existing 100svh transitions, but absorb roughly one wheel notch
  // at each composition before the next camera move begins.
  const heldScrollProgress = useTransform(
    scrollYProgress,
    [0, 1 / 28, 1 / 3, 31 / 84, 2 / 3, 59 / 84, 1],
    [0, 0, 1 / 3, 1 / 3, 2 / 3, 2 / 3, 1],
  );
  const cameraProgress = useSpring(heldScrollProgress, {
    stiffness: 86,
    damping: 24,
    mass: 0.42,
    restDelta: 0.0001,
  });
  const frameOneOpacity = useTransform(cameraProgress, [0, 0.25, 0.31], [1, 1, 0]);
  const frameTwoOpacity = useTransform(
    cameraProgress,
    [0.18, 0.27, 0.47, 0.58],
    [0, 1, 1, 0],
  );
  const frameTwoY = useTransform(cameraProgress, [0.18, 0.3, 0.56], [52, 0, -42]);
  const frameTwoScale = useTransform(cameraProgress, [0.18, 0.3, 0.56], [0.97, 1, 0.985]);
  const frameThreeOpacity = useTransform(
    cameraProgress,
    [0.47, 0.58, 0.74, 0.87],
    [0, 1, 1, 0],
  );
  const frameThreeY = useTransform(cameraProgress, [0.47, 0.61, 0.86], [48, 0, -38]);
  const frameThreeScale = useTransform(cameraProgress, [0.47, 0.61, 0.86], [0.975, 1, 0.99]);
  const frameFourOpacity = useTransform(cameraProgress, [0.76, 0.88, 1], [0, 1, 1]);
  const frameFourY = useTransform(cameraProgress, [0.76, 0.9, 1], [48, 0, 0]);
  const letterOExit = useTransform(cameraProgress, [0.13, 0.255], [0, 520]);
  const letterMExit = useTransform(cameraProgress, [0.145, 0.27], [0, 520]);
  const letterIExit = useTransform(cameraProgress, [0.16, 0.285], [0, 520]);
  const physicsRelease = useTransform(cameraProgress, [0.105, 0.205], [0, 1]);
  const navProgressScale = useTransform(cameraProgress, [0, 1], [0.08, 1]);
  const [isAwake, setIsAwake] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);
  const [filmOpen, setFilmOpen] = useState(false);
  const [thoughtHintVisible, setThoughtHintVisible] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageConnected, setMessageConnected] = useState(false);
  const [purchaseDetailsOpen, setPurchaseDetailsOpen] = useState(false);
  const thoughtHideTimer = useRef<number | null>(null);

  const signalReady = useCallback(() => {
    if (readySignaled.current) return;
    readySignaled.current = true;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => onReady?.());
    });
  }, [onReady]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 820px), (pointer: coarse)");
    const updateMobileMode = () => setMobileOptimized(query.matches);
    updateMobileMode();
    query.addEventListener("change", updateMobileMode);
    return () => query.removeEventListener("change", updateMobileMode);
  }, []);

  useMotionValueEvent(cameraProgress, "change", (progress) => {
    const nextFrame = Math.min(3, Math.max(0, Math.round(progress * 3)));
    setActiveFrame((currentFrame) => currentFrame === nextFrame ? currentFrame : nextFrame);
  });
  const goToFrame = useCallback((frameIndex: number) => {
    const track = scrollTrack.current;
    if (!track) return;

    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const scrollableDistance = Math.max(0, track.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: trackTop + scrollableDistance * (frameIndex / 3),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [reduceMotion]);
  const clearThoughtHide = useCallback(() => {
    if (thoughtHideTimer.current === null) return;
    window.clearTimeout(thoughtHideTimer.current);
    thoughtHideTimer.current = null;
  }, []);
  const scheduleThoughtHide = useCallback((delay = 900) => {
    clearThoughtHide();
    thoughtHideTimer.current = window.setTimeout(() => {
      setThoughtHintVisible(false);
      thoughtHideTimer.current = null;
    }, delay);
  }, [clearThoughtHide]);
  const openOmiMessage = useCallback(() => {
    if (activeFrame !== 1) return;
    clearThoughtHide();
    setThoughtHintVisible(false);
    setMessageConnected(false);
    setMessageOpen(true);
  }, [activeFrame, clearThoughtHide]);

  useEffect(() => {
    if (activeFrame !== 1) {
      clearThoughtHide();
      setThoughtHintVisible(false);
      setMessageOpen(false);
      setMessageConnected(false);
      setFilmOpen(false);
      return;
    }

    if (isAwake) {
      clearThoughtHide();
      setThoughtHintVisible(true);
    } else if (!messageOpen) {
      scheduleThoughtHide();
    }
  }, [activeFrame, clearThoughtHide, isAwake, messageOpen, scheduleThoughtHide]);

  useEffect(() => {
    if (activeFrame !== 3) setPurchaseDetailsOpen(false);
  }, [activeFrame]);

  useEffect(() => () => clearThoughtHide(), [clearThoughtHide]);

  useEffect(() => {
    if (!filmOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilmOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [filmOpen]);
  const navFrames = ["Device", "Intelligence", "Memory", "Get Omi"];
  const wordmarkLetters = [
    { character: "o", x: 12, length: 304, exitY: letterOExit },
    { character: "m", x: 326, length: 500, exitY: letterMExit },
    { character: "i", x: 848, length: 138, exitY: letterIExit },
  ];

  return (
    <main ref={scrollTrack} className={styles.lab}>
      <section className={styles.productSection} aria-labelledby="wearable-heading">
        <div className={styles.halo} aria-hidden="true" />
        <div className={styles.haze} aria-hidden="true" />

        <header className={styles.siteNav}>
          <a className={styles.navBrand} href="/device-lab" aria-label="Omi home">
            <img
              className={styles.navLogo}
              src="/images/omi-logo.png"
              width="118"
              height="52"
              alt=""
            />
            <span className={`${styles.navSignal} ${isAwake ? styles.navSignalAwake : ""}`}>
              <span className={styles.navSignalDot} aria-hidden="true" />
              {isAwake ? "awake" : "personal intelligence"}
            </span>
          </a>

          <nav className={styles.sceneNav} aria-label="Explore the Omi story">
            {navFrames.map((label, frameIndex) => (
              <button
                key={label}
                className={`${styles.sceneLink} ${activeFrame === frameIndex ? styles.sceneLinkActive : ""}`}
                type="button"
                onClick={() => goToFrame(frameIndex)}
                aria-current={activeFrame === frameIndex ? "step" : undefined}
                aria-label={`Go to scene ${frameIndex + 1}: ${label}`}
              >
                <span className={styles.sceneIndex}>0{frameIndex + 1}</span>
                <span className={styles.sceneName}>{label}</span>
              </button>
            ))}
          </nav>

          <a className={styles.navCta} href="https://www.omi.me/cart/53310207000868:1">
            <span>Get Omi</span>
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <path d="M4 9h9M9.5 4.5 14 9l-4.5 4.5" />
            </svg>
          </a>

          <motion.span
            className={styles.navProgress}
            style={{ scaleX: navProgressScale }}
            aria-hidden="true"
          />
        </header>

        <motion.div
          className={styles.frameOneUi}
          style={{ opacity: frameOneOpacity }}
        >
          <h1 id="wearable-heading" className={styles.wordmark}>
            <span className={styles.srOnly}>Omi</span>
            <svg
              className={styles.wordmarkSvg}
              viewBox="0 0 1000 500"
              preserveAspectRatio="xMidYMax meet"
              aria-hidden="true"
              focusable="false"
            >
              {wordmarkLetters.map(({ character, x, length, exitY }, index) => (
                <motion.g
                  key={character}
                  initial={{ y: reduceMotion ? 0 : 520 }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.78,
                    delay: reduceMotion ? 0 : 0.08 + index * 0.055,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <motion.text
                    className={styles.wordmarkLetter}
                    x={x}
                    y="472"
                    textLength={length}
                    lengthAdjust="spacingAndGlyphs"
                    style={{ y: reduceMotion ? 0 : exitY }}
                  >
                    {character}
                  </motion.text>
                </motion.g>
              ))}
            </svg>
          </h1>
        </motion.div>

        <LayoutGroup id="omi-frame-two-interactions">
          <motion.div
            className={styles.frameTwoUi}
            style={{
              opacity: frameTwoOpacity,
              y: reduceMotion ? 0 : frameTwoY,
              scale: reduceMotion ? 1 : frameTwoScale,
            }}
            aria-hidden={activeFrame !== 1}
          >
            <div className={styles.frameTwoCopy}>
              <motion.span
                className={styles.frameTwoEyebrow}
                animate={{
                  opacity: activeFrame === 1 ? 1 : 0,
                  y: activeFrame === 1 || reduceMotion ? 0 : 14,
                  filter: activeFrame === 1 || reduceMotion ? "blur(0px)" : "blur(8px)",
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.58,
                  delay: activeFrame === 1 && !reduceMotion ? 0.04 : 0,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                How omi works
              </motion.span>
              <motion.h2
                animate={{
                  opacity: activeFrame === 1 ? 1 : 0,
                  y: activeFrame === 1 || reduceMotion ? 0 : 22,
                  filter: activeFrame === 1 || reduceMotion ? "blur(0px)" : "blur(10px)",
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.68,
                  delay: activeFrame === 1 && !reduceMotion ? 0.13 : 0,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                Ask. Learn. Do.
              </motion.h2>
              <motion.p
                animate={{
                  opacity: activeFrame === 1 ? 1 : 0,
                  y: activeFrame === 1 || reduceMotion ? 0 : 18,
                  filter: activeFrame === 1 || reduceMotion ? "blur(0px)" : "blur(8px)",
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.64,
                  delay: activeFrame === 1 && !reduceMotion ? 0.22 : 0,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                Share your ideas or ask anything that&apos;s on your mind. Omi will
                answer, knowing everything about you.
              </motion.p>
            </div>

            <motion.div
              className={styles.frameTwoFilmDock}
              animate={{
                opacity: activeFrame === 1 ? 1 : 0,
                y: activeFrame === 1 || reduceMotion ? 0 : 28,
                clipPath: activeFrame === 1 || reduceMotion
                  ? "inset(0% 0% 0% 0%)"
                  : "inset(16% 0% 0% 0%)",
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.76,
                delay: activeFrame === 1 && !reduceMotion ? 0.31 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {!filmOpen && (
                <motion.div
                  layoutId="omi-launch-film"
                  className={styles.launchFilm}
                  transition={{ layout: { duration: reduceMotion ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] } }}
                >
                  <motion.img
                    className={styles.launchFilmPoster}
                    src="https://i.ytimg.com/vi/MZLzvN3vmtI/maxresdefault.jpg"
                    alt=""
                    animate={{
                      opacity: activeFrame === 1 ? 1 : 0,
                      scale: activeFrame === 1 || reduceMotion ? 1 : 1.055,
                    }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.86,
                      delay: activeFrame === 1 && !reduceMotion ? 0.34 : 0,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                  <div className={styles.launchFilmShade} aria-hidden="true" />
                  <motion.button
                    className={styles.launchFilmOpen}
                    type="button"
                    onClick={() => setFilmOpen(true)}
                    aria-label="Watch the Omi launch film in a larger player"
                    animate={{
                      opacity: activeFrame === 1 ? 1 : 0,
                      y: activeFrame === 1 || reduceMotion ? 0 : 13,
                    }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.52,
                      delay: activeFrame === 1 && !reduceMotion ? 0.54 : 0,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <span className={styles.launchFilmPlay} aria-hidden="true">
                      <svg viewBox="0 0 28 28"><path d="m11 8 8 6-8 6Z" /></svg>
                    </span>
                    <span>Watch launch film</span>
                  </motion.button>
                  <motion.span
                    className={styles.launchFilmMeta}
                    animate={{
                      opacity: activeFrame === 1 ? 1 : 0,
                      y: activeFrame === 1 || reduceMotion ? 0 : -9,
                    }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.48,
                      delay: activeFrame === 1 && !reduceMotion ? 0.45 : 0,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    Official film
                  </motion.span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {filmOpen && (
              <motion.div
                className={styles.filmModal}
                role="dialog"
                aria-modal="true"
                aria-label="Omi launch film"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.34 }}
                onMouseDown={() => setFilmOpen(false)}
              >
                <motion.div
                  layoutId="omi-launch-film"
                  className={styles.filmModalPanel}
                  transition={{ layout: { duration: reduceMotion ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] } }}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <iframe
                    className={styles.filmModalFrame}
                    src="https://www.youtube-nocookie.com/embed/MZLzvN3vmtI?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1&cc_load_policy=0&iv_load_policy=3"
                    title="Omi launch video"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                  <button
                    className={styles.filmModalClose}
                    type="button"
                    onClick={() => setFilmOpen(false)}
                    aria-label="Close launch film"
                  >
                    <span>Close</span>
                    <svg viewBox="0 0 18 18" aria-hidden="true">
                      <path d="m4.5 4.5 9 9m0-9-9 9" />
                    </svg>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeFrame === 1 && thoughtHintVisible && !messageOpen && (
              <motion.button
                className={styles.thoughtPrompt}
                type="button"
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92, x: reduceMotion ? 0 : -14 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, x: reduceMotion ? 0 : 10 }}
                transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.16, 1, 0.3, 1] }}
                onPointerEnter={clearThoughtHide}
                onPointerLeave={() => {
                  if (!isAwake) scheduleThoughtHide(650);
                }}
                onClick={openOmiMessage}
              >
                <span className={styles.thoughtPromptSignal} aria-hidden="true" />
                <span>Omi noticed a pattern</span>
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M4 9h9m-3.5-3.5L13 9l-3.5 3.5" />
                </svg>
              </motion.button>
            )}

            {activeFrame === 1 && messageOpen && (
              <motion.aside
                className={styles.thoughtMessage}
                aria-live="polite"
                initial={{
                  opacity: 0,
                  y: reduceMotion ? 0 : 24,
                  scale: reduceMotion ? 1 : 0.97,
                  clipPath: reduceMotion ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
                }}
                animate={{ opacity: 1, y: 0, scale: 1, clipPath: "inset(0% 0% 0% 0%)" }}
                exit={{
                  opacity: 0,
                  y: reduceMotion ? 0 : 12,
                  scale: reduceMotion ? 1 : 0.98,
                  clipPath: reduceMotion ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
                }}
                transition={{ duration: reduceMotion ? 0 : 0.56, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={styles.thoughtMessageTopline}>
                  <span><i aria-hidden="true" /> omi · now</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageOpen(false);
                      setThoughtHintVisible(false);
                    }}
                    aria-label="Close Omi message"
                  >
                    <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m4.5 4.5 9 9m0-9-9 9" /></svg>
                  </button>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  {!messageConnected ? (
                    <motion.div
                      key="pattern"
                      className={styles.thoughtMessageBody}
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
                      transition={{ duration: reduceMotion ? 0 : 0.46, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <h3>You keep coming back to the same idea.</h3>
                      <p>I found the three moments you mentioned it and saved the clearest one. Want me to connect them?</p>
                      <button type="button" onClick={() => setMessageConnected(true)}>
                        Connect the dots
                        <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h9m-3.5-3.5L13 9l-3.5 3.5" /></svg>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="connected"
                      className={styles.thoughtMessageBody}
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.46, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <h3>Already did.</h3>
                      <p>Today&apos;s lecture, Tuesday&apos;s voice note, and the thought you had on the walk home are now one memory.</p>
                      <span className={styles.thoughtMessageDone}>
                        <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m4 9.5 3 3 7-7" /></svg>
                        Thread ready
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.aside>
            )}
          </AnimatePresence>
        </LayoutGroup>

        <motion.div
          className={styles.frameThreeUi}
          style={{
            opacity: frameThreeOpacity,
            y: reduceMotion ? 0 : frameThreeY,
            scale: reduceMotion ? 1 : frameThreeScale,
          }}
          aria-hidden={activeFrame !== 2}
        >
          <div className={styles.frameThreeCopy}>
            <motion.span
              className={styles.storyEyebrow}
              animate={{
                opacity: activeFrame === 2 ? 1 : 0,
                y: activeFrame === 2 || reduceMotion ? 0 : 14,
                filter: activeFrame === 2 || reduceMotion ? "blur(0px)" : "blur(8px)",
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.56,
                delay: activeFrame === 2 && !reduceMotion ? 0.04 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              A memory you can ask
            </motion.span>
            <motion.h2
              animate={{
                opacity: activeFrame === 2 ? 1 : 0,
                y: activeFrame === 2 || reduceMotion ? 0 : 22,
                filter: activeFrame === 2 || reduceMotion ? "blur(0px)" : "blur(10px)",
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.68,
                delay: activeFrame === 2 && !reduceMotion ? 0.12 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Recall anything. Instantly.
            </motion.h2>
            <motion.p
              animate={{
                opacity: activeFrame === 2 ? 1 : 0,
                y: activeFrame === 2 || reduceMotion ? 0 : 18,
                filter: activeFrame === 2 || reduceMotion ? "blur(0px)" : "blur(8px)",
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.64,
                delay: activeFrame === 2 && !reduceMotion ? 0.21 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Omi turns the conversations around you into transcripts, summaries,
              tasks, and searchable memories—ready whenever you need them.
            </motion.p>
          </div>

          <div className={styles.memoryProof} aria-label="Examples of what Omi creates">
            {[
              { label: "Listening", value: "Conversation captured", status: "Live" },
              { label: "Understanding", value: "Summary ready", status: "08 sec" },
              { label: "Doing", value: "3 actions found", status: "Ready" },
              { label: "Recall", value: "What did we decide?", status: "Ask Omi" },
            ].map((item, index) => (
              <motion.div
                className={styles.memoryProofCard}
                key={item.label}
                animate={{
                  opacity: activeFrame === 2 ? 1 : 0,
                  x: activeFrame === 2 || reduceMotion ? 0 : -24,
                  clipPath: activeFrame === 2 || reduceMotion
                    ? "inset(0% 0% 0% 0%)"
                    : "inset(0% 100% 0% 0%)",
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.62,
                  delay: activeFrame === 2 && !reduceMotion ? 0.32 + index * 0.075 : 0,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <span className={styles.memoryProofIndex}>0{index + 1}</span>
                <span className={styles.memoryProofText}>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </span>
                <span className={styles.memoryProofStatus}>{item.status}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className={styles.frameFourUi}
          style={{
            opacity: frameFourOpacity,
            y: reduceMotion ? 0 : frameFourY,
          }}
          aria-hidden={activeFrame !== 3}
        >
          <div className={styles.frameFourCopy}>
            <motion.span
              className={styles.storyEyebrow}
              animate={{
                opacity: activeFrame === 3 ? 1 : 0,
                y: activeFrame === 3 || reduceMotion ? 0 : 14,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.54,
                delay: activeFrame === 3 && !reduceMotion ? 0.04 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Your Omi
            </motion.span>
            <motion.h2
              animate={{
                opacity: activeFrame === 3 ? 1 : 0,
                y: activeFrame === 3 || reduceMotion ? 0 : 24,
                filter: activeFrame === 3 || reduceMotion ? "blur(0px)" : "blur(10px)",
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.7,
                delay: activeFrame === 3 && !reduceMotion ? 0.13 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Remember more. Miss less.
            </motion.h2>
            <motion.p
              animate={{
                opacity: activeFrame === 3 ? 1 : 0,
                y: activeFrame === 3 || reduceMotion ? 0 : 18,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.64,
                delay: activeFrame === 3 && !reduceMotion ? 0.23 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              One small device for the conversations, ideas, and decisions that
              shape your day. Wear it, connect the app, and let Omi keep the details close.
            </motion.p>

            <motion.div
              className={styles.purchaseActions}
              animate={{
                opacity: activeFrame === 3 ? 1 : 0,
                y: activeFrame === 3 || reduceMotion ? 0 : 20,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.62,
                delay: activeFrame === 3 && !reduceMotion ? 0.33 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <a
                className={styles.purchasePrimary}
                href="https://www.omi.me/cart/53310207000868:1"
                tabIndex={activeFrame === 3 ? 0 : -1}
              >
                <span>Get Omi</span>
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M4 9h9M9.5 4.5 14 9l-4.5 4.5" />
                </svg>
              </a>
              <button
                className={styles.purchaseSecondary}
                type="button"
                tabIndex={activeFrame === 3 ? 0 : -1}
                aria-expanded={purchaseDetailsOpen}
                onClick={() => setPurchaseDetailsOpen((open) => !open)}
              >
                {purchaseDetailsOpen ? "Hide what’s included" : "See what’s included"}
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <path d={purchaseDetailsOpen ? "M4 11.5 9 6.5l5 5" : "m4 6.5 5 5 5-5"} />
                </svg>
              </button>
            </motion.div>

            <AnimatePresence initial={false}>
              {purchaseDetailsOpen && activeFrame === 3 && (
                <motion.div
                  className={styles.purchaseDetails}
                  initial={{ opacity: 0, height: 0, y: reduceMotion ? 0 : -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: reduceMotion ? 0 : -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
                >
                  Omi device · protective case · lanyard · magnetic USB-C charger
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.figure
            className={styles.frameFourImage}
            animate={{
              opacity: activeFrame === 3 ? 1 : 0,
              x: activeFrame === 3 || reduceMotion ? 0 : 42,
              clipPath: activeFrame === 3 || reduceMotion
                ? "inset(0% 0% 0% 0%)"
                : "inset(0% 0% 0% 100%)",
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.88,
              delay: activeFrame === 3 && !reduceMotion ? 0.27 : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <motion.img
              src="/images/omi-office-wearer.png"
              alt="A woman wearing Omi in an office"
              animate={{ scale: activeFrame === 3 || reduceMotion ? 1 : 1.065 }}
              transition={{
                duration: reduceMotion ? 0 : 1.15,
                delay: activeFrame === 3 && !reduceMotion ? 0.27 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
            <span aria-hidden="true" />
          </motion.figure>

          <motion.div
            className={styles.purchaseConfidence}
            animate={{
              opacity: activeFrame === 3 ? 1 : 0,
              y: activeFrame === 3 || reduceMotion ? 0 : 18,
              clipPath: activeFrame === 3 || reduceMotion
                ? "inset(0% 0% 0% 0%)"
                : "inset(0% 100% 0% 0%)",
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.74,
              delay: activeFrame === 3 && !reduceMotion ? 0.48 : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <span><strong>10–14 hr</strong> battery</span>
            <span><strong>Offline</strong> recording</span>
            <span><strong>Free plan</strong> included</span>
          </motion.div>
        </motion.div>

        <Canvas
          className={styles.canvas}
          dpr={mobileOptimized ? [0.7, 0.9] : [0.85, 1]}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
            stencil: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: settings.stage.exposure,
          }}
          aria-label="Interactive Omi pendant. Hover to wake its light and set it gently swinging."
          onCreated={signalReady}
        >
          <DeviceStage
            reduceMotion={reduceMotion}
            mobileOptimized={mobileOptimized}
            settings={settings}
            onWakeChange={setIsAwake}
            onActivate={openOmiMessage}
            physicsRelease={physicsRelease}
            scrollProgress={cameraProgress}
            activeFrame={activeFrame}
          />
        </Canvas>

      </section>
    </main>
  );
}
