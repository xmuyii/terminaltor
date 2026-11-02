export interface HintResponse {
  hint: string;
  level: number;
  hintLevel: number;
  maxHints: number;
  cache_hit?: boolean;
  from_fallback?: boolean;
  remaining_today?: number | string;
}

export class AITutorService {
  static getDailyQuota(userId: string, tier: string): { remaining: number | string; max: number; limit: number | string; has_pro: boolean } {
    const isPro = tier === 'pro';
    return {
      remaining: isPro ? 'Unlimited' : 5,
      limit: isPro ? 'Unlimited' : 5,
      max: isPro ? 999 : 5,
      has_pro: isPro,
    };
  }

  static async requestHint(params: {
    challenge_id: string;
    code: string;
    level: number;
    test_passed?: number;
    test_total?: number;
    error_message?: string;
    user_tier?: string;
    user_id?: string;
    [key: string]: any;
  }): Promise<HintResponse> {
    const hints = [
      'Check your loop condition and ensure you are iterating over the correct range of indices.',
      'Remember that Python list slicing is exclusive of the stop index: list[start:stop].',
      'Here is the exact structure needed: check the assertion requirements in the test console.',
    ];
    const index = Math.min((params.level || 1) - 1, hints.length - 1);
    return {
      hint: hints[index] || hints[0],
      level: params.level || 1,
      hintLevel: params.level || 1,
      maxHints: 3,
      cache_hit: false,
      from_fallback: false,
      remaining_today: 'Unlimited (Pro Pass)',
    };
  }

  static async getHint(
    questId: string,
    code: string,
    errorText?: string,
    currentLevel: number = 1
  ): Promise<HintResponse> {
    return this.requestHint({ challenge_id: questId, code, level: currentLevel, error_message: errorText });
  }
}
