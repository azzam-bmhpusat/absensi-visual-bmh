"use client";

// Diadaptasi dari React Bits <Counter /> (https://reactbits.dev/components/counter).
import { useEffect, type CSSProperties } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "motion/react";

function RollingNumber({ mv, number, height }: { mv: MotionValue<number>; number: number; height: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) memo -= 10 * height;
    return memo;
  });
  return (
    <motion.span
      style={{ y, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {number}
    </motion.span>
  );
}

function Digit({ place, value, height }: { place: number; value: number; height: number }) {
  const rounded = Math.floor(value / place);
  const animated = useSpring(rounded, { stiffness: 120, damping: 20 });
  useEffect(() => {
    animated.set(rounded);
  }, [animated, rounded]);
  return (
    <span style={{ position: "relative", height, width: "1ch", overflow: "hidden", display: "inline-block" }}>
      {Array.from({ length: 10 }, (_, i) => (
        <RollingNumber key={i} mv={animated} number={i} height={height} />
      ))}
    </span>
  );
}

interface CounterProps {
  value: number;
  places?: number[];
  fontSize?: number;
  fontWeight?: CSSProperties["fontWeight"];
  className?: string;
}

export default function Counter({ value, places = [10, 1], fontSize = 80, fontWeight = 600, className }: CounterProps) {
  const height = Math.round(fontSize * 1.05);
  return (
    <span
      className={className}
      style={{ display: "inline-flex", overflow: "hidden", fontSize, fontWeight, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
      aria-hidden="true"
    >
      {places.map((place) => (
        <Digit key={place} place={place} value={value} height={height} />
      ))}
    </span>
  );
}
