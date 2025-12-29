/**
 * Transform match events into natural-language commentary
 */

import { CommentaryItem } from '@/mock/matchCommentary';
import { FootballApiFixture } from '@/types/fixture';

interface ApiEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  } | null;
  type: string; // "Goal", "Card", "subst", "Var", etc.
  detail: string | null; // "Yellow Card", "Right Footed Shot", etc.
  comments: string | null;
}

/**
 * Format time string (e.g., "89", "90+5", "HT")
 */
const formatTime = (elapsed: number, extra: number | null): string => {
  if (elapsed === null || elapsed === undefined) return '';
  if (extra && extra > 0) {
    return `${elapsed}+${extra}`;
  }
  return `${elapsed}`;
};

/**
 * Get goal synonyms for variety
 */
const getGoalSynonym = (): string => {
  const synonyms = ["Goal!", "What a strike!", "They've scored!"];
  return synonyms[Math.floor(Math.random() * synonyms.length)];
};

/**
 * Transform API events into commentary items
 */
export const mapEventsToCommentary = (
  eventsData: any[],
  matchData: FootballApiFixture
): CommentaryItem[] => {
  if (!eventsData || eventsData.length === 0) {
    return [];
  }

  const commentaryItems: CommentaryItem[] = [];

  // Sort events by time ascending first to calculate scores correctly
  const sortedEventsAsc = [...eventsData].sort((a, b) => {
    const timeA = (a.time?.elapsed || 0) * 1000 + (a.time?.extra || 0);
    const timeB = (b.time?.elapsed || 0) * 1000 + (b.time?.extra || 0);
    return timeA - timeB; // Ascending order for score calculation
  });

  // Calculate score at each goal event
  let homeGoals = 0;
  let awayGoals = 0;
  const goalScores = new Map<number, { home: number; away: number }>();

  sortedEventsAsc.forEach((event: ApiEvent) => {
    if (event.type === 'Goal') {
      if (event.team.id === matchData.teams.home.id) {
        homeGoals++;
      } else {
        awayGoals++;
      }
      const eventKey = (event.time?.elapsed || 0) * 1000 + (event.time?.extra || 0);
      goalScores.set(eventKey, { home: homeGoals, away: awayGoals });
    }
  });

  // Now sort events by time descending (most recent first) for display
  const sortedEvents = [...eventsData].sort((a, b) => {
    const timeA = (a.time?.elapsed || 0) * 1000 + (a.time?.extra || 0);
    const timeB = (b.time?.elapsed || 0) * 1000 + (b.time?.extra || 0);
    return timeB - timeA; // Descending order
  });

  // Process each event
  sortedEvents.forEach((event: ApiEvent, index: number) => {
    const elapsed = event.time?.elapsed || 0;
    const extra = event.time?.extra || null;
    const timeStr = formatTime(elapsed, extra);
    const teamName = event.team?.name || 'Unknown';
    const playerName = event.player?.name || 'Unknown';
    const assistName = event.assist?.name || null;
    const type = event.type || '';
    const detail = event.detail || '';
    const comments = event.comments || null;

    let commentaryText = '';

    // 1. Goal events
    if (type === 'Goal') {
      const eventKey = elapsed * 1000 + (extra || 0);
      const score = goalScores.get(eventKey) || { home: 0, away: 0 };
      const currentScore = `${matchData.teams.home.name} ${score.home}-${score.away} ${matchData.teams.away.name}`;
      const goalSynonym = getGoalSynonym();
      const detailText = detail ? ` with a ${detail.toLowerCase()}` : '';
      const assistText = assistName ? ` Assisted by ${assistName}.` : '';
      
      commentaryText = `${goalSynonym} ${currentScore} — ${playerName} (${teamName}) scored${detailText}.${assistText}`;
    }
    // 2. Card events
    else if (type === 'Card') {
      const cardType = detail || 'card';
      commentaryText = `${cardType}: ${playerName} (${teamName}) shown a ${cardType.toLowerCase()}.`;
      if (comments) {
        commentaryText += ` ${comments}`;
      }
    }
    // 3. Substitution events
    else if (type === 'subst') {
      // In API-Football, for substitutions:
      // - player.name is the player coming IN
      // - assist.name might be the player going OUT, or we need to check the event structure
      // Some APIs structure it differently, so we'll handle both cases
      const playerIn = playerName;
      const playerOut = assistName || 'player';
      commentaryText = `Substitution for ${teamName}: ${playerIn} replaces ${playerOut}.`;
    }
    // 4. VAR review events
    else if (type === 'Var') {
      commentaryText = `VAR review: ${detail || comments || 'Checking decision'}.`;
    }
    // 5. Injury / Other events
    else if (type === 'Injury' || detail?.toLowerCase().includes('injury')) {
      const replacement = assistName || 'replacement';
      commentaryText = `Injury & substitution: ${playerName} (${teamName}) is injured and replaced by ${replacement}.`;
    }
    // 6. Other event types (Attempt, Corner, etc.)
    else {
      // Generic format for other events
      const eventType = detail || type;
      const assistText = assistName ? ` Assisted by ${assistName}.` : '';
      commentaryText = `${eventType}: ${playerName} (${teamName})${assistText}`;
      if (comments) {
        commentaryText += ` ${comments}`;
      }
    }

    if (commentaryText) {
      commentaryItems.push({
        id: `commentary-${index + 1}`,
        time: timeStr,
        text: commentaryText,
      });
    }
  });

  // Add final score at the top if match is finished
  const isFinished = ['FT', 'AET', 'PEN', 'WO', 'ABD', 'AWD'].includes(matchData.fixture.status.short);
  if (isFinished) {
    const finalScore = matchData.goals.home !== null && matchData.goals.away !== null
      ? `${matchData.teams.home.name} ${matchData.goals.home}-${matchData.goals.away} ${matchData.teams.away.name}`
      : `${matchData.teams.home.name} ${matchData.score.fulltime?.home || 0}-${matchData.score.fulltime?.away || 0} ${matchData.teams.away.name}`;
    
    commentaryItems.unshift({
      id: 'commentary-ft',
      time: 'FT',
      text: `Final Score: ${finalScore}.`,
    });
  }

  return commentaryItems;
};

