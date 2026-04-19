import { describe, it, expect } from 'vitest';
import {
  computeSafeXpAndStreak,
  MAX_XP_INCREASE_PER_SYNC,
  MAX_STREAK,
} from '@/lib/api/syncProgressValidation';

describe('computeSafeXpAndStreak', () => {
  describe('XP validation', () => {
    it('accepts legitimate XP increase within cap', () => {
      const { safeXp } = computeSafeXpAndStreak(100, 0, 200, 0);
      expect(safeXp).toBe(200);
    });

    it('caps XP increase at MAX_XP_INCREASE_PER_SYNC', () => {
      const { safeXp } = computeSafeXpAndStreak(100, 0, 700, 0);
      expect(safeXp).toBe(100 + MAX_XP_INCREASE_PER_SYNC); // 600
    });

    it('never reduces XP below existing value', () => {
      const { safeXp } = computeSafeXpAndStreak(500, 0, 100, 0);
      expect(safeXp).toBe(500);
    });

    it('accepts XP exactly at cap boundary', () => {
      const { safeXp } = computeSafeXpAndStreak(100, 0, 600, 0);
      expect(safeXp).toBe(600);
    });

    it('caps XP one above boundary', () => {
      const { safeXp } = computeSafeXpAndStreak(100, 0, 601, 0);
      expect(safeXp).toBe(600);
    });

    it('preserves existing XP when client sends 0', () => {
      const { safeXp } = computeSafeXpAndStreak(500, 0, 0, 0);
      expect(safeXp).toBe(500);
    });

    it('handles existing=0, client within cap', () => {
      const { safeXp } = computeSafeXpAndStreak(0, 0, 400, 0);
      expect(safeXp).toBe(400);
    });

    it('handles existing=0, client above cap', () => {
      const { safeXp } = computeSafeXpAndStreak(0, 0, 600, 0);
      expect(safeXp).toBe(MAX_XP_INCREASE_PER_SYNC); // 500
    });

    it('handles client sending negative XP', () => {
      const { safeXp } = computeSafeXpAndStreak(100, 0, -50, 0);
      expect(safeXp).toBe(100); // never decreases
    });
  });

  describe('Streak validation', () => {
    it('accepts legitimate streak increase', () => {
      const { safeStreak } = computeSafeXpAndStreak(0, 5, 0, 6);
      expect(safeStreak).toBe(6);
    });

    it('caps streak at MAX_STREAK', () => {
      const { safeStreak } = computeSafeXpAndStreak(0, 360, 0, 400);
      expect(safeStreak).toBe(MAX_STREAK); // 365
    });

    it('never reduces streak below existing value', () => {
      const { safeStreak } = computeSafeXpAndStreak(0, 10, 0, 3);
      expect(safeStreak).toBe(10);
    });

    it('clamps negative client streak to 0 before comparison', () => {
      const { safeStreak } = computeSafeXpAndStreak(0, 5, 0, -1);
      expect(safeStreak).toBe(5); // Math.max(5, Math.min(Math.max(-1,0), 365)) = Math.max(5, 0) = 5
    });

    it('handles streak at exactly MAX_STREAK', () => {
      const { safeStreak } = computeSafeXpAndStreak(0, 365, 0, 365);
      expect(safeStreak).toBe(365);
    });

    it('handles existing streak above MAX_STREAK (legacy data)', () => {
      // Existing can be > MAX_STREAK from before the cap was added
      // Math.max(400, Math.min(Math.max(400,0), 365)) = Math.max(400, 365) = 400
      const { safeStreak } = computeSafeXpAndStreak(0, 400, 0, 400);
      expect(safeStreak).toBe(400);
    });

    it('handles both client and existing at 0', () => {
      const { safeStreak } = computeSafeXpAndStreak(0, 0, 0, 0);
      expect(safeStreak).toBe(0);
    });
  });

  describe('Combined validation', () => {
    it('validates XP and streak independently', () => {
      const result = computeSafeXpAndStreak(100, 5, 700, 400);
      expect(result.safeXp).toBe(600); // capped at 100+500
      expect(result.safeStreak).toBe(365); // capped at MAX_STREAK
    });

    it('uses custom maxXpIncrease and maxStreak', () => {
      const result = computeSafeXpAndStreak(0, 0, 200, 50, 100, 30);
      expect(result.safeXp).toBe(100); // custom cap
      expect(result.safeStreak).toBe(30); // custom max
    });
  });

  describe('Constants', () => {
    it('has expected MAX_XP_INCREASE_PER_SYNC value', () => {
      expect(MAX_XP_INCREASE_PER_SYNC).toBe(500);
    });

    it('has expected MAX_STREAK value', () => {
      expect(MAX_STREAK).toBe(365);
    });
  });
});
