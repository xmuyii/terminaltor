export interface PlayerInfo {
  id: string;
  username: string;
  score: number;
  avatar?: string;
  alliance?: string;
  styleTitle?: string;
}

export interface WordFeedItem {
  word: string;
  player: string;
  points: number;
  at: number;
}

export interface WordFeedBatch {
  batch_id: number;
  words: WordFeedItem[];
}

export interface RoundEndScore {
  player_id: string;
  username: string;
  score: number;
  tokensEarned?: number;
  creditsEarned?: number;
  rank?: number;
  styleTitle?: string;
}

export interface QuestionMessage {
  question_id: string;
  text: string;
  codeSnippet?: string;
  targetAssertion?: string;
  canonicalAnswer: string;
  acceptedAnswers: string[];
  ends_at: number;
}

export interface AnswerRevealed {
  question_id: string;
  correctAnswer: string;
  solvedByUsername?: string | null;
  revealedAt: number;
}

export type ClientGameMessage =
  | { type: 'join'; roomCode: string; username: string; mode: string }
  | { type: 'submit_word'; word: string; username: string }
  | { type: 'submit_answer'; answer: string; username: string }
  | { type: 'typing'; text: string; username: string };

export type ServerGameMessage =
  | { type: 'player_joined'; player: PlayerInfo }
  | { type: 'game_start'; endsAt: number; pool: string[]; seedWords: string[]; language: string }
  | { type: 'word_accepted'; word: string; player: string; points: number }
  | { type: 'score_update'; players: PlayerInfo[] }
  | { type: 'new_question'; question: QuestionMessage }
  | { type: 'answer_revealed'; answer: AnswerRevealed }
  | { type: 'round_end'; scores: RoundEndScore[] };
