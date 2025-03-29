//@ts-nocheck
"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls, Cloud, Sky, useTexture } from "@react-three/drei";
import { useSphere, useBox, useCylinder } from "@react-three/cannon";
import * as THREE from "three";

// Game constants
const ROAD_LENGTH = 500;
const ROAD_WIDTH = 5;
const BALL_RADIUS = 0.8; // Increased ball size
const BALL_SPEED = 0.15;
const OBSTACLE_COUNT = 50; // Reduced obstacle count
const FINISH_POSITION = ROAD_LENGTH - 5;
const CLOUD_COUNT = 100;
const ROCK_HEIGHT = 3.5; // Increased rock height
const BILLBOARD_COUNT = 20; // Number of billboards to place along the road
const ROAD_SIGN_COUNT = 3; // Number of overhead road signs

// Dark theme colors
const DARK_COLORS = {
  primary: "#1e3a8a", // Deep blue
  secondary: "#312e81", // Deep indigo
  accent: "#4f46e5", // Bright indigo
  darkPurple: "#4c1d95", // Dark purple
  darkBlue: "#1e40af", // Dark blue
  midnight: "#0f172a", // Midnight blue
  charcoal: "#1e293b", // Charcoal
  slate: "#334155", // Slate
  darkGray: "#1f2937", // Dark gray
  mediumGray: "#4b5563", // Medium gray
  lightGray: "#9ca3af", // Light gray
  white: "#f8fafc", // Off-white
  highlight: "#6366f1", // Indigo highlight
  glow: "#818cf8", // Glowing indigo
};

// Add these theme color constants at the top of the file, after the existing DARK_COLORS
const LIGHT_COLORS = {
  primary: "#4361ee", // Blue
  secondary: "#3a0ca3", // Indigo
  accent: "#7209b7", // Purple
  highlight: "#f72585", // Pink
  white: "#ffffff",
  lightGray: "#f8f9fa",
  mediumGray: "#e9ecef",
  darkGray: "#6c757d",
  black: "#212529",
  glow: "#4cc9f0", // Cyan glow
};

type GameSceneProps = {
  onGameWon: () => void;
  isDarkTheme: boolean;
};

// Define the RoadSignData type
type RoadSignData = {
  position: [number, number, number];
};

// Modify the GameScene component to include theme state
export function GameScene({ onGameWon, isDarkTheme }: GameSceneProps) {
  const [obstacles] = useState(() => generateObstacles());
  const [clouds] = useState(() => generateClouds());
  const [billboards] = useState(() => generateBillboards());
  const [roadSigns] = useState(() => generateRoadSigns());
  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();

  // Get the current theme colors
  const colors = useMemo(
    () => (isDarkTheme ? DARK_COLORS : LIGHT_COLORS),
    [isDarkTheme]
  );

  // Load the profile image directly from URL
  const profileTexture = useTexture(
    "https://assets.toptal.io/images?url=https%3A%2F%2Fbs-uploads.toptal.io%2Fblackfish-uploads%2Ftalent%2F427843%2Fpicture%2Foptimized%2Fhuge_c711f787694f240c7bb20e598bfdd6e8-e2b83df354d725bbf11311fddbcf3719.jpg&width=480",
    (texture) => {
      texture.needsUpdate = true;
      texture.flipY = false; // Sometimes helps with texture orientation
      texture.anisotropy = 16; // Improves texture sharpness at angles
    }
  );

  // Load the billboard ad texture
  const billboardTexture = useTexture(
    "https://appxcontent.kaxa.in/paid_course3/2024-07-09-0.40079486154772104.png",
    (texture) => {
      texture.needsUpdate = true;
      texture.anisotropy = 16;
    }
  );

  // Create the road sign texture
  const roadSignTexture = useMemo(() => createRoadSignTexture(), []);

  // Player ball physics
  const [ballRef, ballApi] = useSphere(() => ({
    mass: 3, // Increased mass
    position: [0, BALL_RADIUS + 0.5, 0],
    args: [BALL_RADIUS],
    type: "Dynamic",
    linearDamping: 0.8, // Increased damping to reduce unwanted movement
    material: {
      friction: 0.5, // Increased friction
      restitution: 0.05, // Reduced bounce significantly
    },
    gravity: [0, -20, 0], // Increased gravity
    fixedRotation: false, // Allow rotation for more natural movement
  }));

  // Track ball position for camera and game logic
  const ballPosition = useRef(new THREE.Vector3(0, BALL_RADIUS + 0.5, 0));
  const gameWon = useRef(false);

  // Update ball position ref when physics updates
  useEffect(() => {
    const unsubscribe = ballApi.position.subscribe((p) => {
      ballPosition.current.set(p[0], p[1], p[2]);

      // Check if player reached the finish line
      if (p[2] <= -FINISH_POSITION && !gameWon.current) {
        gameWon.current = true;
        onGameWon();
      }

      // Check if player fell off the road
      if (p[1] < -5) {
        // Reset position
        ballApi.position.set(0, BALL_RADIUS + 0.5, 0);
        ballApi.velocity.set(0, 0, 0);
      }
    });

    return unsubscribe;
  }, [ballApi, onGameWon]);

  // Game loop
  useFrame(() => {
    if (gameWon.current) return;

    const { forward, backward, left, right } = getKeys();

    // Apply forces based on key presses
    const impulse = { x: 0, y: 0, z: 0 };

    if (forward) impulse.z -= 0.5;
    if (backward) impulse.z += 0.3;
    if (left) impulse.x -= 0.5;
    if (right) impulse.x += 0.5;

    ballApi.applyImpulse([impulse.x, impulse.y, impulse.z], [0, 0, 0]);

    // Constant forward movement - apply to center of mass to prevent drift
    ballApi.applyImpulse([0, 0, -BALL_SPEED], [0, 0, 0]);

    // Update camera to follow the ball
    camera.position.x = ballPosition.current.x;
    camera.position.y = ballPosition.current.y + 5;
    camera.position.z = ballPosition.current.z + 10;
    camera.lookAt(ballPosition.current);
  });

  return (
    <>
      {/* Sky - changes based on theme */}
      <Sky
        distance={450000}
        sunPosition={isDarkTheme ? [0, -0.5, 0] : [0, 1, 0]} // Sun below/above horizon based on theme
        inclination={isDarkTheme ? 0.1 : 0.6}
        azimuth={0.25}
        rayleigh={isDarkTheme ? 3 : 1}
        turbidity={isDarkTheme ? 30 : 10}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Player Ball with enhanced texture visibility */}
      <mesh ref={ballRef} castShadow>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={colors.white}
          roughness={0.1}
          metalness={isDarkTheme ? 0.4 : 0.2}
          map={profileTexture}
          emissive={colors.glow}
          emissiveIntensity={0.2}
        />

        {/* Add a point light to illuminate the ball */}
        <pointLight intensity={1.2} distance={5} color={colors.glow} />
      </mesh>

      {/* Road */}
      <Road
        profileTexture={profileTexture}
        isDarkTheme={isDarkTheme}
        colors={colors}
      />

      {/* Road Signs */}
      {roadSigns.map((sign, index) => (
        <RoadSign
          key={`sign-${index}`}
          {...sign}
          texture={roadSignTexture}
          isDarkTheme={isDarkTheme}
          colors={colors}
        />
      ))}

      {/* Obstacles */}
      {obstacles.map((obstacle, index) =>
        obstacle.type === "rock" ? (
          <RockObstacle
            key={index}
            {...obstacle}
            isDarkTheme={isDarkTheme}
            colors={colors}
          />
        ) : (
          <HoleObstacle
            key={index}
            {...obstacle}
            isDarkTheme={isDarkTheme}
            colors={colors}
          />
        )
      )}

      {/* Clouds */}
      {clouds.map((cloud, index) => (
        <CloudGroup
          key={index}
          {...cloud}
          isDarkTheme={isDarkTheme}
          colors={colors}
        />
      ))}

      {/* Billboards */}
      {billboards.map((billboard, index) => (
        <Billboard
          key={index}
          {...billboard}
          texture={billboardTexture}
          isDarkTheme={isDarkTheme}
          colors={colors}
        />
      ))}

      {/* Finish Line */}
      <FinishLine
        position={[0, 0.1, -FINISH_POSITION]}
        isDarkTheme={isDarkTheme}
        colors={colors}
      />

      {/* Lighting - changes based on theme */}
      <ambientLight
        intensity={isDarkTheme ? 0.3 : 0.6}
        color={isDarkTheme ? colors.midnight : "#ffffff"}
      />
      <directionalLight
        position={[10, 10, 10]}
        intensity={isDarkTheme ? 0.8 : 1.2}
        castShadow
        color={isDarkTheme ? colors.white : "#ffffff"}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight
        args={[
          colors.glow,
          isDarkTheme ? colors.midnight : "#e0e0e0",
          isDarkTheme ? 0.5 : 0.7,
        ]}
      />

      {/* Fog - only in dark theme */}
      {isDarkTheme && <fog attach="fog" args={[colors.midnight, 30, 100]} />}
    </>
  );
}

// Create a road sign texture with "KiratPaglu Final Boss" text - beautiful but optimized for performance
function createRoadSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; // Keep reduced size for performance
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Create a theme-aware texture that will update when theme changes
    // We'll handle the actual theme in the material's map property

    // Create a subtle gradient background - minimal performance impact
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, "#4361ee"); // Blue
    bgGradient.addColorStop(0.5, "#3a0ca3"); // Indigo
    bgGradient.addColorStop(1, "#7209b7"); // Purple
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add a subtle pattern - minimal performance impact
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          i * (canvas.width / 5),
          j * (canvas.height / 2),
          canvas.width / 10,
          canvas.height / 15
        );
      }
    }
    ctx.restore();

    // Add a more elegant border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Add inner border for depth - minimal performance impact
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Add main text with very subtle shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 55px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🥰KiratPaglu🥰", canvas.width / 2, canvas.height / 2 - 18);

    // Add "Final Boss" text with contrasting color
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = "#f72585"; // Bright pink for contrast
    ctx.font = "bold 42px Impact, fantasy";
    ctx.fillText("🤟🏻FINAL BOSS🤟🏻", canvas.width / 2, canvas.height / 2 + 25);

    // Reset shadow for performance
    ctx.shadowColor = "transparent";

    // Add simple decorative elements at corners
    drawEnhancedCorner(ctx, 8, 8, 20);
    drawEnhancedCorner(ctx, canvas.width - 8, 8, 20);
    drawEnhancedCorner(ctx, 8, canvas.height - 8, 20);
    drawEnhancedCorner(ctx, canvas.width - 8, canvas.height - 8, 20);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

// Enhanced corner decoration that looks better but is still performance-friendly
function drawEnhancedCorner(ctx, x, y, size) {
  // Draw a circle with gradient for more visual appeal
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.7)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Add a small accent in the center
  ctx.fillStyle = "#4361ee"; // Blue
  ctx.beginPath();
  ctx.arc(x, y, size / 5, 0, Math.PI * 2);
  ctx.fill();
}

// Helper function to draw a star
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }

  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();

  ctx.fillStyle = DARK_COLORS.accent;
  ctx.fill();

  ctx.strokeStyle = DARK_COLORS.glow;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Helper function to draw corner decorations
function drawCornerDecoration(ctx, x, y, size, isLeft, isTop) {
  ctx.save();
  ctx.fillStyle = DARK_COLORS.accent;

  ctx.beginPath();
  if (isLeft && isTop) {
    // Top-left corner
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
  } else if (!isLeft && isTop) {
    // Top-right corner
    ctx.moveTo(x, y);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x, y + size);
  } else if (isLeft && !isTop) {
    // Bottom-left corner
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y - size);
  } else {
    // Bottom-right corner
    ctx.moveTo(x, y);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x, y - size);
  }
  ctx.closePath();
  ctx.fill();

  // Add a small circle in each corner for extra decoration
  ctx.fillStyle = DARK_COLORS.glow;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Road Sign component - dark-themed
function RoadSign({
  position,
  texture,
  isDarkTheme,
  colors,
}: RoadSignData & {
  isDarkTheme: boolean;
  colors: typeof DARK_COLORS | typeof LIGHT_COLORS;
}) {
  // Create physics bodies for the sign supports
  const [leftSupportRef] = useBox(() => ({
    args: [0.5, 4, 0.5],
    position: [-(ROAD_WIDTH / 2) - 0.5, 2, position[2]],
    type: "Static",
  }));

  const [rightSupportRef] = useBox(() => ({
    args: [0.5, 4, 0.5],
    position: [ROAD_WIDTH / 2 + 0.5, 2, position[2]],
    type: "Static",
  }));

  return (
    <group position={position}>
      {/* Sign board */}
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <planeGeometry args={[ROAD_WIDTH + 2, 2]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          metalness={isDarkTheme ? 0.4 : 0.2}
          roughness={isDarkTheme ? 0.6 : 0.7}
          emissive={colors.accent}
          emissiveIntensity={isDarkTheme ? 0.2 : 0.1}
        />
      </mesh>

      {/* Left support */}
      <mesh
        ref={leftSupportRef}
        position={[-(ROAD_WIDTH / 2) - 0.5, 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, 4, 0.5]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.slate : colors.primary}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Right support */}
      <mesh
        ref={rightSupportRef}
        position={[ROAD_WIDTH / 2 + 0.5, 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, 4, 0.5]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.slate : colors.primary}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Horizontal support beam - below the sign */}
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[ROAD_WIDTH + 2, 0.5, 0.5]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.slate : colors.primary}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Additional horizontal support beam at the top of the sign */}
      <mesh position={[0, 7.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[ROAD_WIDTH + 2, 0.5, 0.5]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.slate : colors.primary}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Enhanced decorative caps */}
      <mesh position={[-(ROAD_WIDTH / 2) - 0.5, 4.1, 0]} castShadow>
        <boxGeometry args={[0.7, 0.2, 0.7]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.accent : colors.white}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      <mesh position={[ROAD_WIDTH / 2 + 0.5, 4.1, 0]} castShadow>
        <boxGeometry args={[0.7, 0.2, 0.7]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.accent : colors.white}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Add subtle decorative elements to supports */}
      <mesh position={[-(ROAD_WIDTH / 2) - 0.5, 1.5, 0.3]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.1]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.accent : colors.white}
        />
      </mesh>

      <mesh position={[ROAD_WIDTH / 2 + 0.5, 1.5, 0.3]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.1]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.accent : colors.white}
        />
      </mesh>

      {/* Add small decorative elements at the base of supports */}
      <mesh position={[-(ROAD_WIDTH / 2) - 0.5, 0.1, 0]} castShadow>
        <boxGeometry args={[0.7, 0.2, 0.7]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.darkPurple : colors.secondary}
        />
      </mesh>

      <mesh position={[ROAD_WIDTH / 2 + 0.5, 0.1, 0]} castShadow>
        <boxGeometry args={[0.7, 0.2, 0.7]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.darkPurple : colors.secondary}
        />
      </mesh>
    </group>
  );
}

// Generate road sign positions
function generateRoadSigns() {
  const signs: Omit<RoadSignData, "texture">[] = [];

  // Place signs at strategic positions along the road
  const positions = [
    -5, // Very beginning of the road (just after start position)
    -ROAD_LENGTH * 0.2, // First sign at 20% of the road
    -ROAD_LENGTH * 0.5, // Middle of the road
    -ROAD_LENGTH * 0.8, // Near the finish line
  ];

  positions.forEach((zPos) => {
    signs.push({
      position: [0, 0, zPos],
    });
  });

  return signs;
}

// Road component with dark-themed textures
function Road({
  profileTexture,
  isDarkTheme,
  colors,
}: {
  profileTexture: THREE.Texture;
  isDarkTheme: boolean;
  colors: typeof DARK_COLORS | typeof LIGHT_COLORS;
}) {
  // Create a themed road texture
  const roadTexture = useMemo(
    () => createRoadTexture(isDarkTheme),
    [isDarkTheme]
  );

  // Create a box for the road physics - make it wider than visual to prevent falling off edges
  const [roadRef] = useBox(() => ({
    args: [ROAD_WIDTH, 0.5, ROAD_LENGTH],
    position: [0, -0.25, -ROAD_LENGTH / 2],
    type: "Static",
  }));

  return (
    <group>
      {/* Main road surface */}
      <mesh ref={roadRef} receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.5, ROAD_LENGTH]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.charcoal : "#444444"}
          roughness={0.9}
          metalness={isDarkTheme ? 0.2 : 0.1}
        />
      </mesh>

      {/* Road texture overlay - separate from physics body */}
      <mesh
        position={[0, 0.01, -ROAD_LENGTH / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.darkGray : "#555555"}
          roughness={0.9}
          metalness={isDarkTheme ? 0.2 : 0.1}
          map={roadTexture}
          depthWrite={true}
        />
      </mesh>

      {/* Profile image on the road at intervals */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0.02, -50 * (i + 1)]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
          receiveShadow
        >
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial
            map={profileTexture}
            transparent={true}
            opacity={0.8}
            depthWrite={false}
            emissive={colors.glow}
            emissiveIntensity={isDarkTheme ? 0.1 : 0.05}
          />
        </mesh>
      ))}

      {/* Road edges (curbs) */}
      <mesh position={[-ROAD_WIDTH / 2, 0.1, -ROAD_LENGTH / 2]} receiveShadow>
        <boxGeometry args={[0.3, 0.3, ROAD_LENGTH]} />
        <meshStandardMaterial
          color={colors.accent}
          roughness={0.8}
          emissive={colors.glow}
          emissiveIntensity={isDarkTheme ? 0.2 : 0.1}
        />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2, 0.1, -ROAD_LENGTH / 2]} receiveShadow>
        <boxGeometry args={[0.3, 0.3, ROAD_LENGTH]} />
        <meshStandardMaterial
          color={colors.accent}
          roughness={0.8}
          emissive={colors.glow}
          emissiveIntensity={isDarkTheme ? 0.2 : 0.1}
        />
      </mesh>

      {/* Center line - glowing */}
      <group>
        {Array.from({ length: Math.floor(ROAD_LENGTH / 5) }).map((_, i) => (
          <mesh key={i} position={[0, 0.02, -i * 5 - 2.5]} receiveShadow>
            <boxGeometry args={[0.15, 0.02, 2]} />
            <meshStandardMaterial
              color={colors.white}
              roughness={0.5}
              emissive={colors.glow}
              emissiveIntensity={isDarkTheme ? 0.5 : 0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Billboard component for roadside advertisements
type BillboardData = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  texture: THREE.Texture;
};

// Update the Billboard component to accept theme props
function Billboard({
  position,
  rotation,
  scale,
  texture,
  isDarkTheme,
  colors,
}: BillboardData & {
  isDarkTheme: boolean;
  colors: typeof DARK_COLORS | typeof LIGHT_COLORS;
}) {
  // Calculate aspect ratio based on the texture
  const aspectRatio = useMemo(() => {
    if (texture && texture.image) {
      return texture.image.width / texture.image.height;
    }
    return 16 / 9; // Default aspect ratio if texture dimensions not available
  }, [texture]);

  // Billboard dimensions
  const width = 6 * scale;
  const height = width / aspectRatio;

  return (
    <group position={position} rotation={rotation}>
      {/* Billboard structure */}
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          emissive={colors.glow}
          emissiveIntensity={isDarkTheme ? 0.2 : 0.1}
        />
      </mesh>

      {/* Support pole */}
      <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.2, height, 8]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.slate : "#555555"}
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Base */}
      <mesh castShadow receiveShadow position={[0, -height / 2 - 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 8]} />
        <meshStandardMaterial
          color={isDarkTheme ? colors.darkPurple : colors.secondary}
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

// Generate billboard positions
function generateBillboards() {
  const billboards: Omit<BillboardData, "texture">[] = [];

  // Place billboards along both sides of the road
  for (let i = 0; i < BILLBOARD_COUNT; i++) {
    // Alternate sides
    const side = i % 2 === 0 ? -1 : 1;

    // Space them out along the road
    const zPos = -25 - (i * (ROAD_LENGTH - 50)) / BILLBOARD_COUNT;

    // Position them a bit away from the road
    const xOffset = side * (ROAD_WIDTH / 2 + 4);

    // Rotate to face the road
    const yRotation = side === -1 ? Math.PI / 2 : -Math.PI / 2;

    billboards.push({
      position: [xOffset, 3, zPos],
      rotation: [0, yRotation, 0],
      scale: 0.8 + Math.random() * 0.4, // Vary the size slightly
    });
  }

  return billboards;
}

// Update the createRoadTexture function to accept theme parameter
function createRoadTexture(isDarkTheme: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Fill with asphalt color based on theme
    ctx.fillStyle = isDarkTheme ? DARK_COLORS.charcoal : "#444444";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise for asphalt texture
    for (let i = 0; i < 30000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2;
      const gray = isDarkTheme
        ? 20 + Math.random() * 30
        : 30 + Math.random() * 40;

      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray + (isDarkTheme ? 10 : 0)})`;
      ctx.fillRect(x, y, size, size);
    }

    // Add some larger gravel spots
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 2 + Math.random() * 4;
      const gray = isDarkTheme
        ? 30 + Math.random() * 20
        : 50 + Math.random() * 30;

      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray + (isDarkTheme ? 15 : 0)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 100);

  return texture;
}

// Obstacle types and generation
type ObstacleType = "rock" | "hole";
type ObstacleData = {
  type: ObstacleType;
  position: [number, number, number];
  size: [number, number, number];
  side: "left" | "right";
  rotation: [number, number, number];
  rockType: number;
};

function generateObstacles(): ObstacleData[] {
  const obstacles: ObstacleData[] = [];

  // Create a more structured pattern with gaps between obstacles
  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    // Space obstacles out more evenly
    const zPos = -20 - (i * (ROAD_LENGTH - 40)) / OBSTACLE_COUNT;

    // Alternate sides for a slalom pattern
    const side = i % 2 === 0 ? "left" : "right";
    const type = Math.random() > 0.3 ? "rock" : "hole"; // More rocks than holes

    // Position rocks to create a path in the middle
    const xOffset = side === "left" ? -ROAD_WIDTH * 0.25 : ROAD_WIDTH * 0.25;

    const rotation: [number, number, number] = [
      Math.random() * 0.5,
      Math.random() * Math.PI * 2,
      Math.random() * 0.5,
    ];

    // Make rocks bigger, especially taller
    const rockWidth = 1.2 + Math.random() * 1.0; // Slightly smaller to ensure path
    const rockHeight = ROCK_HEIGHT + Math.random() * 1;
    const rockDepth = 1.2 + Math.random() * 1.0;

    obstacles.push({
      type,
      position: [xOffset, type === "rock" ? rockHeight / 2 : -0.5, zPos],
      size:
        type === "rock" ? [rockWidth, rockHeight, rockDepth] : [1.5, 0.5, 1.5], // Smaller holes
      side,
      rotation,
      rockType: Math.floor(Math.random() * 4), // 0-3 for different rock types
    });
  }

  return obstacles;
}

// Cloud generation
type CloudData = {
  position: [number, number, number];
  scale: number;
  rotation: number;
};

function generateClouds(): CloudData[] {
  const clouds: CloudData[] = [];

  for (let i = 0; i < CLOUD_COUNT; i++) {
    // Position clouds on both sides of the road
    const side = Math.random() > 0.5 ? -1 : 1;
    const xOffset = side * (ROAD_WIDTH / 2 + 5 + Math.random() * 15);

    const zPos = -Math.random() * ROAD_LENGTH;
    const yPos = Math.random() * 10 + 2;

    clouds.push({
      position: [xOffset, yPos, zPos],
      scale: 0.5 + Math.random() * 2,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  return clouds;
}

// Update the CloudGroup component to accept theme props
function CloudGroup({
  position,
  scale,
  rotation,
  isDarkTheme,
  colors,
}: CloudData & {
  isDarkTheme: boolean;
  colors: typeof DARK_COLORS | typeof LIGHT_COLORS;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Cloud
        opacity={isDarkTheme ? 0.6 : 0.8}
        speed={0.1}
        width={scale * 10}
        depth={scale * 2}
        segments={20}
        color={isDarkTheme ? colors.midnight : "#ffffff"}
      />
    </group>
  );
}

// Rock obstacle component with dark-themed rocks
function RockObstacle({
  position,
  size,
  rotation,
  rockType,
  colors,
  isDarkTheme,
}: ObstacleData & {
  colors: typeof DARK_COLORS | typeof LIGHT_COLORS;
  isDarkTheme: boolean;
}) {
  // Create physics body for rock collision
  const [rockRef] = useBox(() => ({
    args: size,
    position,
    rotation,
    type: "Static",
  }));

  // Create different rock types for variety
  switch (rockType) {
    case 0: // Jagged mountain rock
      return (
        <group ref={rockRef} position={position} rotation={rotation}>
          {/* Main rock mass */}
          <mesh castShadow receiveShadow>
            <dodecahedronGeometry
              args={[Math.max(size[0], size[2]) * 0.5, 2]}
            />
            <meshStandardMaterial
              color={colors.slate}
              roughness={1}
              metalness={0.2}
              flatShading={true}
            />
          </mesh>

          {/* Rock details - jagged edges */}
          {Array.from({ length: 15 }).map((_, i) => {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = Math.max(size[0], size[2]) * 0.5;

            const x = radius * Math.sin(phi) * Math.cos(theta) * 0.9;
            const y = radius * Math.cos(phi) * 0.9;
            const z = radius * Math.sin(phi) * Math.sin(theta) * 0.9;

            const spikeHeight = 0.2 + Math.random() * 0.5;
            const spikeWidth = 0.1 + Math.random() * 0.2;

            return (
              <mesh
                key={i}
                position={[x, y, z]}
                rotation={[
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                ]}
                castShadow
              >
                <coneGeometry args={[spikeWidth, spikeHeight, 4]} />
                <meshStandardMaterial
                  color={colors.darkGray}
                  roughness={1}
                  flatShading={true}
                />
              </mesh>
            );
          })}

          {/* Rock cracks and crevices */}
          {Array.from({ length: 8 }).map((_, i) => {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = Math.max(size[0], size[2]) * 0.5;

            const x = radius * Math.sin(phi) * Math.cos(theta) * 0.7;
            const y = radius * Math.cos(phi) * 0.7;
            const z = radius * Math.sin(phi) * Math.sin(theta) * 0.7;

            return (
              <mesh
                key={`crack-${i}`}
                position={[x, y, z]}
                rotation={[
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                ]}
              >
                <boxGeometry args={[0.05, 0.3 + Math.random() * 0.3, 0.05]} />
                <meshStandardMaterial color={colors.midnight} roughness={1} />
              </mesh>
            );
          })}
        </group>
      );

    case 1: // Smooth boulder
      return (
        <group ref={rockRef} position={position} rotation={rotation}>
          {/* Main boulder */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[Math.max(size[0], size[2]) * 0.5, 16, 16]} />
            <meshStandardMaterial
              color={colors.darkBlue}
              roughness={0.9}
              metalness={0.2}
            />
          </mesh>

          {/* Boulder details - smaller attached rocks */}
          {Array.from({ length: 6 }).map((_, i) => {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = Math.max(size[0], size[2]) * 0.5;

            const x = radius * Math.sin(phi) * Math.cos(theta) * 0.8;
            const y = radius * Math.cos(phi) * 0.8 - radius * 0.3; // Position more toward bottom
            const z = radius * Math.sin(phi) * Math.sin(theta) * 0.8;

            return (
              <mesh key={i} position={[x, y, z]} castShadow>
                <sphereGeometry args={[0.2 + Math.random() * 0.3, 8, 8]} />
                <meshStandardMaterial color={colors.primary} roughness={0.9} />
              </mesh>
            );
          })}

          {/* Surface details - bumps and imperfections */}
          {Array.from({ length: 20 }).map((_, i) => {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = Math.max(size[0], size[2]) * 0.5;

            const x = radius * Math.sin(phi) * Math.cos(theta) * 0.98;
            const y = radius * Math.cos(phi) * 0.98;
            const z = radius * Math.sin(phi) * Math.sin(theta) * 0.98;

            return (
              <mesh key={`bump-${i}`} position={[x, y, z]} castShadow>
                <sphereGeometry args={[0.05 + Math.random() * 0.08, 4, 4]} />
                <meshStandardMaterial color={colors.darkPurple} roughness={1} />
              </mesh>
            );
          })}
        </group>
      );

    case 2: // Layered sedimentary rock
      return (
        <group ref={rockRef} position={position} rotation={rotation}>
          {/* Base rock shape */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[size[0], size[1], size[2]]} />
            <meshStandardMaterial
              color={colors.darkGray}
              roughness={1}
              metalness={0.1}
            />
          </mesh>

          {/* Rock layers */}
          {Array.from({ length: 8 }).map((_, i) => {
            const layerHeight = size[1] / 10;
            const yOffset = -size[1] / 2 + i * layerHeight * 1.5;
            const layerColor = i % 2 === 0 ? colors.slate : colors.darkPurple;

            return (
              <mesh key={i} position={[0, yOffset, 0]} castShadow>
                <boxGeometry
                  args={[size[0] * 1.02, layerHeight, size[2] * 1.02]}
                />
                <meshStandardMaterial
                  color={layerColor}
                  roughness={1}
                  metalness={0.1}
                />
              </mesh>
            );
          })}

          {/* Cracks and erosion */}
          {Array.from({ length: 12 }).map((_, i) => {
            const x = (Math.random() - 0.5) * size[0] * 0.9;
            const y = (Math.random() - 0.5) * size[1] * 0.9;
            const z = (Math.random() - 0.5) * size[2] * 0.9;

            return (
              <mesh
                key={`crack-${i}`}
                position={[x, y, z]}
                rotation={[
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                ]}
              >
                <boxGeometry args={[0.05, 0.4 + Math.random() * 0.4, 0.05]} />
                <meshStandardMaterial color={colors.midnight} roughness={1} />
              </mesh>
            );
          })}
        </group>
      );

    case 3: // Crystalline rock
      return (
        <group ref={rockRef} position={position} rotation={rotation}>
          {/* Main crystal structure */}
          <mesh castShadow receiveShadow>
            <octahedronGeometry args={[Math.max(size[0], size[2]) * 0.5, 0]} />
            <meshStandardMaterial
              color={colors.darkPurple}
              roughness={0.7}
              metalness={0.3}
              flatShading={true}
            />
          </mesh>

          {/* Crystal formations */}
          {Array.from({ length: 15 }).map((_, i) => {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = Math.max(size[0], size[2]) * 0.5;

            const x = radius * Math.sin(phi) * Math.cos(theta) * 0.8;
            const y = radius * Math.cos(phi) * 0.8;
            const z = radius * Math.sin(phi) * Math.sin(theta) * 0.8;

            return (
              <mesh
                key={i}
                position={[x, y, z]}
                rotation={[
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                ]}
                castShadow
              >
                <octahedronGeometry args={[0.15 + Math.random() * 0.25, 0]} />
                <meshStandardMaterial
                  color={colors.primary}
                  roughness={0.7}
                  metalness={0.3}
                  flatShading={true}
                  emissive={colors.accent}
                  emissiveIntensity={0.1}
                />
              </mesh>
            );
          })}

          {/* Small crystal details */}
          {Array.from({ length: 25 }).map((_, i) => {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = Math.max(size[0], size[2]) * 0.5;

            const x = radius * Math.sin(phi) * Math.cos(theta) * 0.9;
            const y = radius * Math.cos(phi) * 0.9;
            const z = radius * Math.sin(phi) * Math.sin(theta) * 0.9;

            return (
              <mesh
                key={`crystal-${i}`}
                position={[x, y, z]}
                rotation={[
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                ]}
                castShadow
              >
                <tetrahedronGeometry args={[0.08 + Math.random() * 0.12, 0]} />
                <meshStandardMaterial
                  color={colors.accent}
                  roughness={0.6}
                  metalness={0.4}
                  flatShading={true}
                  emissive={colors.glow}
                  emissiveIntensity={0.2}
                />
              </mesh>
            );
          })}
        </group>
      );

    default:
      return (
        <mesh
          ref={rockRef}
          position={position}
          rotation={rotation}
          castShadow
          receiveShadow
        >
          <boxGeometry args={size} />
          <meshStandardMaterial color={colors.slate} roughness={0.9} />
        </mesh>
      );
  }
}

// Hole obstacle component - dark-themed
function HoleObstacle({
  position,
  size,
  colors,
}: ObstacleData & { colors: any }) {
  // Create physics body for hole collision
  const [holeRef] = useCylinder(() => ({
    args: [size[0] / 2, size[0] / 2, size[1], 16],
    position,
    type: "Static",
    rotation: [Math.PI / 2, 0, 0],
  }));

  return (
    <group>
      <mesh
        position={[position[0], position[1] + 0.01, position[2]]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[size[0] / 2, 32]} />
        <meshStandardMaterial color={colors.midnight} roughness={1} />
      </mesh>
      <mesh ref={holeRef} visible={false} />

      {/* Add some debris around the hole */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = (size[0] / 2) * 0.8 + Math.random() * 0.3;
        const x = position[0] + Math.cos(angle) * radius;
        const z = position[2] + Math.sin(angle) * radius;
        const debrisSize = 0.05 + Math.random() * 0.1;

        return (
          <mesh key={i} position={[x, position[1] + 0.05, z]} castShadow>
            <boxGeometry args={[debrisSize, debrisSize, debrisSize]} />
            <meshStandardMaterial color={colors.darkGray} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

// Update the FinishLine component to accept theme props
function FinishLine({
  position,
  isDarkTheme,
  colors,
}: {
  position: [number, number, number];
  isDarkTheme: boolean;
  colors: typeof DARK_COLORS | typeof LIGHT_COLORS;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.1, 1]} />
        <meshStandardMaterial color={colors.primary} />
      </mesh>
      <mesh position={[-ROAD_WIDTH / 2 - 0.5, 2, 0]}>
        <boxGeometry args={[0.5, 4, 0.5]} />
        <meshStandardMaterial color={colors.primary} />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2 + 0.5, 2, 0]}>
        <boxGeometry args={[0.5, 4, 0.5]} />
        <meshStandardMaterial color={colors.primary} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 2, 0.5, 0.5]} />
        <meshStandardMaterial color={colors.primary} />
      </mesh>

      {/* Victory banner */}
      <mesh position={[0, 6, 0]}>
        <planeGeometry args={[8, 2]} />
        <meshStandardMaterial
          color={colors.secondary}
          side={THREE.DoubleSide}
          emissive={isDarkTheme ? colors.accent : colors.highlight}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Celebratory elements */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            Math.random() * 5 + 5,
            (Math.random() - 0.5) * 5,
          ]}
        >
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={`hsl(${Math.random() * 360}, 100%, 75%)`}
            emissive={`hsl(${Math.random() * 360}, 100%, 50%)`}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
