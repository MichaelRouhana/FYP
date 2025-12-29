/**
 * Transform predictions API data into Power Tab format
 */

import { MatchPowerData, TeamBalanceData, TeamPowerData, GoalPowerData, GoalsByMinute } from '@/mock/matchPower/types';
import { FootballApiFixture } from '@/types/fixture';

/**
 * Map predictions API response to Power Tab data format
 */
export const mapPredictionsToPower = (
  predictionsData: any,
  matchData: FootballApiFixture
): MatchPowerData | null => {
  console.log('[powerMapper] 🔍 Starting mapping process');
  console.log('[powerMapper] Match:', matchData?.teams?.home?.name, 'vs', matchData?.teams?.away?.name);
  
  if (!predictionsData || !matchData) {
    console.warn('[powerMapper] ⚠️ Missing data:', {
      hasPredictionsData: !!predictionsData,
      hasMatchData: !!matchData,
    });
    return null;
  }

  const homeTeamName = matchData.teams.home.name;
  const awayTeamName = matchData.teams.away.name;
  const homeTeamId = matchData.teams.home.id;
  const awayTeamId = matchData.teams.away.id;

  console.log('[powerMapper] Teams:', { homeTeamName, awayTeamName, homeTeamId, awayTeamId });

  // Handle array response (API might return array)
  let actualPredictionsData = predictionsData;
  if (Array.isArray(predictionsData) && predictionsData.length > 0) {
    actualPredictionsData = predictionsData[0];
    console.log('[powerMapper] 📦 Predictions is array, using first item');
  }

  // Extract comparison data (form, att, def, etc.)
  // API-Football structure: predictions.comparison or just comparison
  const comparison = actualPredictionsData.comparison || actualPredictionsData.predictions?.comparison || {};
  const form = comparison.form || {};
  const att = comparison.att || {};
  const def = comparison.def || {};
  const goals = comparison.goals || {};
  const wins = comparison.wins || {};
  const draws = comparison.draws || {};
  const loses = comparison.loses || {};

  console.log('[powerMapper] 📊 Comparison data extracted:', {
    hasForm: !!form && Object.keys(form).length > 0,
    hasAtt: !!att && Object.keys(att).length > 0,
    hasDef: !!def && Object.keys(def).length > 0,
    formHome: form.home,
    formAway: form.away,
    attHome: att.home,
    attAway: att.away,
    defHome: def.home,
    defAway: def.away,
  });

  // Extract goals data for goal power chart
  // API-Football structure: predictions.teams[].goals or predictions.goals
  const teams = actualPredictionsData.teams || [];
  const homeTeamData = teams.find((t: any) => t.id === homeTeamId) || {};
  const awayTeamData = teams.find((t: any) => t.id === awayTeamId) || {};
  
  console.log('[powerMapper] 🎯 Teams data:', {
    teamsArrayLength: teams.length,
    homeTeamFound: !!homeTeamData && Object.keys(homeTeamData).length > 0,
    awayTeamFound: !!awayTeamData && Object.keys(awayTeamData).length > 0,
    homeTeamId: homeTeamId,
    awayTeamId: awayTeamId,
  });
  
  const homeGoals = homeTeamData.goals || actualPredictionsData.goals?.home || {};
  const awayGoals = awayTeamData.goals || actualPredictionsData.goals?.away || {};
  
  console.log('[powerMapper] ⚽ Goals data:', {
    homeGoalsKeys: Object.keys(homeGoals),
    awayGoalsKeys: Object.keys(awayGoals),
    homeGoalsFor: !!homeGoals.for,
    awayGoalsFor: !!awayGoals.for,
    homeGoalsMinute: !!homeGoals.for?.minute,
    awayGoalsMinute: !!awayGoals.for?.minute,
  });

  // Helper to convert percentage string to number (e.g., "85%" -> 85)
  const parsePercentage = (value: string | number | null | undefined): number => {
    if (typeof value === 'number') return Math.round(value);
    if (typeof value === 'string') {
      const num = parseFloat(value.replace('%', ''));
      return isNaN(num) ? 0 : Math.round(num);
    }
    return 0;
  };

  // Helper to normalize value to 0-100 scale
  const normalize = (value: number, max: number = 100): number => {
    return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  };

  // Map Team Balance Data (Radar Chart)
  const teamBalance: TeamBalanceData = {
    homeTeam: {
      name: homeTeamName,
      stats: {
        strength: parsePercentage(form.home) || 50,
        attacking: parsePercentage(att.home) || 50,
        defensive: parsePercentage(def.home) || 50,
        wins: parsePercentage(wins.home) || 50,
        draws: parsePercentage(draws.home) || 50,
        loss: parsePercentage(loses.home) || 50,
        goals: parsePercentage(goals.home) || 50,
      },
    },
    awayTeam: {
      name: awayTeamName,
      stats: {
        strength: parsePercentage(form.away) || 50,
        attacking: parsePercentage(att.away) || 50,
        defensive: parsePercentage(def.away) || 50,
        wins: parsePercentage(wins.away) || 50,
        draws: parsePercentage(draws.away) || 50,
        loss: parsePercentage(loses.away) || 50,
        goals: parsePercentage(goals.away) || 50,
      },
    },
  };

  // Map Team Power Data (Line Chart) - Use form progression if available
  // If not available, generate a simple time series based on form
  const homeFormValue = parsePercentage(form.home) || 50;
  const awayFormValue = parsePercentage(form.away) || 50;
  
  const teamPower: TeamPowerData = {
    homeTeam: {
      name: homeTeamName,
      timeSeries: [
        { minute: 5, value: Math.max(0, homeFormValue - 10) },
        { minute: 10, value: Math.max(0, homeFormValue - 5) },
        { minute: 15, value: homeFormValue },
        { minute: 20, value: Math.min(100, homeFormValue + 5) },
        { minute: 25, value: Math.min(100, homeFormValue + 10) },
        { minute: 30, value: homeFormValue },
        { minute: 35, value: Math.max(0, homeFormValue - 5) },
        { minute: 40, value: homeFormValue },
        { minute: 45, value: Math.min(100, homeFormValue + 5) },
      ],
    },
    awayTeam: {
      name: awayTeamName,
      timeSeries: [
        { minute: 5, value: Math.max(0, awayFormValue - 10) },
        { minute: 10, value: Math.max(0, awayFormValue - 5) },
        { minute: 15, value: awayFormValue },
        { minute: 20, value: Math.min(100, awayFormValue + 5) },
        { minute: 25, value: Math.min(100, awayFormValue + 10) },
        { minute: 30, value: awayFormValue },
        { minute: 35, value: Math.max(0, awayFormValue - 5) },
        { minute: 40, value: awayFormValue },
        { minute: 45, value: Math.min(100, awayFormValue + 5) },
      ],
    },
  };

  // Map Goal Power Data (Bar Chart) - Extract from goals.for.minute structure
  const mapGoalsByMinute = (goalsMinute: any): GoalsByMinute => {
    if (!goalsMinute || typeof goalsMinute !== 'object') {
      // Return empty structure if no data
      return {
        '0-15': { total: 0, percentage: '0%' },
        '16-30': { total: 0, percentage: '0%' },
        '31-45': { total: 0, percentage: '0%' },
        '46-60': { total: 0, percentage: '0%' },
        '61-75': { total: 0, percentage: '0%' },
        '76-90': { total: 0, percentage: '0%' },
        '91-105': { total: 0, percentage: '0%' },
        '106-120': { total: 0, percentage: '0%' },
      };
    }

    // API-Football structure: goals.for.minute has keys like "0-15", "16-30", etc.
    const mapMinuteRange = (key: string): keyof GoalsByMinute => {
      if (key === '0-15' || key.startsWith('0')) return '0-15';
      if (key === '16-30' || key.startsWith('16') || key.startsWith('1')) return '16-30';
      if (key === '31-45' || key.startsWith('31') || key.startsWith('3')) return '31-45';
      if (key === '46-60' || key.startsWith('46') || key.startsWith('4')) return '46-60';
      if (key === '61-75' || key.startsWith('61') || key.startsWith('6')) return '61-75';
      if (key === '76-90' || key.startsWith('76') || key.startsWith('7')) return '76-90';
      if (key === '91-105' || key.startsWith('91') || key.startsWith('9')) return '91-105';
      if (key === '106-120' || key.startsWith('106') || key.startsWith('10')) return '106-120';
      return '0-15'; // Default
    };

    const result: GoalsByMinute = {
      '0-15': { total: 0, percentage: '0%' },
      '16-30': { total: 0, percentage: '0%' },
      '31-45': { total: 0, percentage: '0%' },
      '46-60': { total: 0, percentage: '0%' },
      '61-75': { total: 0, percentage: '0%' },
      '76-90': { total: 0, percentage: '0%' },
      '91-105': { total: 0, percentage: '0%' },
      '106-120': { total: 0, percentage: '0%' },
    };

    // Sum up goals by minute range
    let totalGoals = 0;
    Object.keys(goalsMinute).forEach((key) => {
      const value = goalsMinute[key];
      const total = typeof value === 'number' ? value : (value?.total || 0);
      const range = mapMinuteRange(key);
      result[range].total = (result[range].total || 0) + total;
      totalGoals += total;
    });

    // Calculate percentages
    Object.keys(result).forEach((key) => {
      const range = key as keyof GoalsByMinute;
      const total = result[range].total || 0;
      const percentage = totalGoals > 0 ? Math.round((total / totalGoals) * 100) : 0;
      result[range].percentage = `${percentage}%`;
    });

    return result;
  };

  const homeGoalsMinute = homeGoals.for?.minute || homeGoals.minute || {};
  const awayGoalsMinute = awayGoals.for?.minute || awayGoals.minute || {};

  const goalPower: GoalPowerData = {
    homeTeam: {
      name: homeTeamName,
      goals: {
        for: {
          minute: mapGoalsByMinute(homeGoalsMinute),
        },
      },
    },
    awayTeam: {
      name: awayTeamName,
      goals: {
        for: {
          minute: mapGoalsByMinute(awayGoalsMinute),
        },
      },
    },
  };

  const result = {
    teamBalance,
    teamPower,
    goalPower,
  };

  console.log('[powerMapper] ✅ Mapping complete:', {
    homeTeamBalance: teamBalance.homeTeam.stats,
    awayTeamBalance: teamBalance.awayTeam.stats,
    homeTeamPowerPoints: teamPower.homeTeam.timeSeries.length,
    awayTeamPowerPoints: teamPower.awayTeam.timeSeries.length,
    homeGoalPowerRanges: Object.keys(goalPower.homeTeam.goals.for.minute).length,
    awayGoalPowerRanges: Object.keys(goalPower.awayTeam.goals.for.minute).length,
  });

  return result;
};

