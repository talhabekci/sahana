/**
 * BACKLOG #64 — gol sekansının sahne koordinat sistemi. Ekran boyutundan
 * bağımsız: SVG bu viewBox'ı kapsayıcıya göre ölçekler (responsive).
 */
export const SCENE_WIDTH = 400;
export const SCENE_HEIGHT = 220;
export const GROUND_Y = 190;

export const PLAYER_X = 55;
export const PLAYER_HEAD_Y = 116;
export const PLAYER_HIP_Y = 158;

export const GOAL_LEFT_X = 335;
export const GOAL_RIGHT_X = 388;
export const GOAL_TOP_Y = 58;

export const KEEPER_X = (GOAL_LEFT_X + GOAL_RIGHT_X) / 2;
export const KEEPER_HEAD_Y = 92;
export const KEEPER_HIP_Y = 130;

export const BALL_START = { x: PLAYER_X + 16, y: GROUND_Y - 4 };
export const BALL_END = { x: GOAL_RIGHT_X - 7, y: GOAL_TOP_Y + 9 };
/** Kavisli şut için kontrol noktası — düz bir çizgi yerine yay çizer. */
export const BALL_CONTROL = { x: 245, y: 12 };
