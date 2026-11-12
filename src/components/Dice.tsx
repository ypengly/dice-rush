import { useEffect, useRef, useState } from 'react';
import { ROLL_MS } from '../hooks/useGame';

/** Cube rotation (deg) that brings each face toward the viewer. Opposite faces sum to 7. */
const FACE_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  2: { x: -90, y: 0 },
  5: { x: 90, y: 0 },
};

/** Which of the 9 grid cells hold a pip for each face value. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const FACES: Array<{ cls: string; value: number }> = [
  { cls: 'front', value: 1 },
  { cls: 'back', value: 6 },
  { cls: 'right', value: 3 },
  { cls: 'left', value: 4 },
  { cls: 'top', value: 2 },
  { cls: 'bottom', value: 5 },
];

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

interface DiceProps {
  value: number;
  rollId: number;
  rolling: boolean;
  index: number;
}

/**
 * A CSS-3D cube. `value` is the already-decided result from the game engine;
 * this component only chooses a flashy path to land on it (extra full turns are
 * multiples of 360°, so the final face is always exactly `value`).
 */
export default function Dice({ value, rollId, rolling, index }: DiceProps) {
  const base = FACE_ROTATION[value] ?? FACE_ROTATION[1];
  const [rot, setRot] = useState({ x: base.x, y: base.y, z: 0 });
  const [animate, setAnimate] = useState(false);
  const current = useRef(rot);
  const lastRollId = useRef(rollId);

  useEffect(() => {
    if (rollId === lastRollId.current) return;
    lastRollId.current = rollId;
    const target = FACE_ROTATION[value] ?? FACE_ROTATION[1];
    const cur = current.current;
    const next = {
      x: target.x + 360 * (Math.ceil((cur.x - target.x) / 360) + randInt(2, 4)),
      y: target.y + 360 * (Math.ceil((cur.y - target.y) / 360) + randInt(2, 4)),
      z: cur.z + 360 * randInt(1, 2),
    };
    current.current = next;
    setAnimate(true);
    setRot(next);
  }, [rollId, value]);

  const duration = ROLL_MS - index * 220;
  const style = {
    transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) rotateZ(${rot.z}deg)`,
    transition: animate ? `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.2, 1)` : 'none',
  };

  return (
    <div className={`die-scene ${rolling ? 'tossing' : ''}`} style={{ animationDelay: `${index * 90}ms` }}>
      <div className="die" style={style} role="img" aria-label={`Die showing ${value}`}>
        {FACES.map((f) => (
          <div key={f.cls} className={`face ${f.cls}`}>
            {Array.from({ length: 9 }, (_, cell) => (
              <span key={cell} className={PIPS[f.value].includes(cell) ? 'pip' : 'pip off'} />
            ))}
          </div>
        ))}
      </div>
      <div className="die-shadow" />
    </div>
  );
}
