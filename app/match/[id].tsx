import { GoalPowerChart, TeamBalanceChart, TeamPowerChart } from '@/components/charts';
import { CommentaryItem, getMatchCommentary } from '@/mock/matchCommentary';
import { getMatchDetails } from '@/mock/matchDetails';
import { getH2HData, H2HMatch } from '@/mock/matchH2H';
import { getMatchLineups, getRatingColor, Player } from '@/mock/matchLineups';
import { getMatchPowerData } from '@/mock/matchPower';
import { CHART_COLORS } from '@/mock/matchPower/constants';
import { getMatchStats } from '@/mock/matchStats';
import { eventLegend, EventType, getMatchSummary, MatchEvent } from '@/mock/matchSummary';
import { getMatchTable, TeamStanding } from '@/mock/matchTable';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'details' | 'summary' | 'lineups' | 'stats' | 'h2h' | 'table' | 'power' | 'commentary';
type BetSelection = 'home' | 'draw' | 'away' | null;

const TABS: { id: TabType; label: string }[] = [
  { id: 'details', label: 'DETAILS' },
  { id: 'summary', label: 'SUMMARY' },
  { id: 'lineups', label: 'LINEUP' },
  { id: 'table', label: 'STANDINGS' },
  { id: 'commentary', label: 'COMMENTARY' },
  { id: 'stats', label: 'STATS' },
  { id: 'h2h', label: 'H2H' },
  { id: 'power', label: 'POWER' },
];

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const match = getMatchDetails(id || 'default');
  const summary = getMatchSummary(id || 'default');
  const lineups = getMatchLineups(id || 'default');
  const stats = getMatchStats(id || 'default');
  const h2h = getH2HData(id || 'default');
  const table = getMatchTable(id || 'default');
  const commentary = getMatchCommentary(id || 'default');
  const powerData = getMatchPowerData(id || 'default');

  const [selectedTab, setSelectedTab] = useState<TabType>('details');
  const [h2hFilter, setH2hFilter] = useState<'meetings' | 'home' | 'away'>('meetings');
  const [h2hShowAll, setH2hShowAll] = useState(false);
  const [tableFilter, setTableFilter] = useState<'all' | 'home' | 'away'>('all');
  const [betSelection, setBetSelection] = useState<BetSelection>(null);
  const [stake, setStake] = useState('');
  const [isFavorite, setIsFavorite] = useState(match.isFavorite);

  const potentialWinnings = useMemo(() => {
    if (!stake || !betSelection) return 0;
    const stakeNum = parseFloat(stake) || 0;
    const odds =
      betSelection === 'home'
        ? match.odds.home
        : betSelection === 'draw'
        ? match.odds.draw
        : match.odds.away;
    return Math.round(stakeNum * odds);
  }, [stake, betSelection, match.odds]);

  const renderDetailsTab = () => (
    <View style={styles.detailsContainer}>
      {/* Betting Card */}
      <View style={styles.bettingCard}>
        <Text style={styles.bettingTitle}>Who will win?</Text>

        {/* Bet Options */}
        <View style={styles.betOptionsContainer}>
          <TouchableOpacity
            style={[
              styles.betOption,
              styles.betOptionDefault,
              betSelection === 'home' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('home')}
          >
            <Text style={styles.betOptionLabel}>HOME</Text>
            <Text style={styles.betOptionOdds}>{match.odds.home}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.betOption,
              styles.betOptionDraw,
              betSelection === 'draw' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('draw')}
          >
            <Text style={styles.betOptionLabel}>DRAW</Text>
            <Text style={styles.betOptionOdds}>{match.odds.draw}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.betOption,
              styles.betOptionAway,
              betSelection === 'away' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('away')}
          >
            <Text style={[styles.betOptionLabel, styles.betOptionLabelAway]}>AWAY</Text>
            <Text style={[styles.betOptionOdds, styles.betOptionOddsAway]}>{match.odds.away}x</Text>
          </TouchableOpacity>
        </View>

        {/* Stake Input */}
        <Text style={styles.stakeLabel}>Stake</Text>
        <View style={styles.stakeInputContainer}>
          <TextInput
            style={styles.stakeInput}
            placeholder="Enter your stake"
            placeholderTextColor="#6b7280"
            value={stake}
            onChangeText={setStake}
            keyboardType="numeric"
          />
          <Text style={styles.stakeUnit}>pts</Text>
        </View>

        {/* Potential Winnings */}
        <View style={styles.potentialWinningsContainer}>
          <View style={styles.potentialWinningsLeft}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color="#2B5555" />
            <Text style={styles.potentialWinningsText}>Potential Winnings</Text>
          </View>
          <Text style={styles.potentialWinningsAmount}>{potentialWinnings} pts</Text>
        </View>

        {/* Place Bid Button */}
        <TouchableOpacity style={styles.placeBidButton} activeOpacity={0.8}>
          <Text style={styles.placeBidButtonText}>PLACE BID</Text>
        </TouchableOpacity>
      </View>

      {/* Match Info Card */}
      <View style={styles.matchInfoCard}>
        {/* Venue */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={24} color="#6b7280" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoValueText}>{match.venue.name}</Text>
            <Text style={styles.infoLabelText}>{match.venue.location}</Text>
          </View>
        </View>

        {/* Capacity & Surface */}
        <View style={styles.infoRowDouble}>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="account-group" size={24} color="#6b7280" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoValueText}>{match.venue.capacity}</Text>
              <Text style={styles.infoLabelText}>Capacity</Text>
            </View>
          </View>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="grass" size={24} color="#6b7280" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoValueText}>{match.venue.surface}</Text>
              <Text style={styles.infoLabelText}>Surface</Text>
            </View>
          </View>
        </View>

        {/* Weather & Temperature */}
        <View style={styles.infoRowDouble}>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color="#6b7280" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoValueText}>{match.weather.condition}</Text>
              <Text style={styles.infoLabelText}>Weather</Text>
            </View>
          </View>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="thermometer" size={24} color="#6b7280" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoValueText}>{match.weather.temperature}</Text>
              <Text style={styles.infoLabelText}>Temperature</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'goal':
        return <MaterialCommunityIcons name="soccer" size={16} color="#9ca3af" />;
      case 'own_goal':
        return <MaterialCommunityIcons name="soccer" size={16} color="#ef4444" />;
      case 'yellow_card':
        return <View style={[styles.cardIcon, styles.yellowCard]} />;
      case 'red_card':
        return <View style={[styles.cardIcon, styles.redCard]} />;
      case 'two_yellow_card':
  return (
          <View style={styles.twoYellowCard}>
            <View style={[styles.cardIconSmall, styles.yellowCard]} />
            <View style={[styles.cardIconSmall, styles.redCard, styles.cardOverlap]} />
          </View>
        );
      case 'substitution':
        return <MaterialCommunityIcons name="swap-vertical" size={18} color="#22c55e" />;
      case 'penalty_scored':
        return <MaterialCommunityIcons name="soccer" size={16} color="#22c55e" />;
      case 'penalty_missed':
        return <MaterialCommunityIcons name="soccer" size={16} color="#ef4444" />;
      case 'canceled_goal':
        return <MaterialCommunityIcons name="soccer-field" size={16} color="#ef4444" />;
      default:
        return null;
    }
  };

  const renderEventRow = (event: MatchEvent) => {
    const isHome = event.team === 'home';
    const isSubstitution = event.type === 'substitution';
    const hasScore = event.score && (event.type === 'goal' || event.type === 'own_goal' || event.type === 'penalty_scored');

    return (
      <View key={event.id} style={styles.eventRow}>
        {/* Home team side */}
        <View style={styles.eventSide}>
          {isHome && (
            <View style={styles.eventContent}>
              {isSubstitution ? (
                <View style={styles.substitutionNames}>
                  <Text style={styles.playerNameSubIn}>{event.playerName}</Text>
                  <Text style={styles.playerNameSubOut}>{event.playerOut}</Text>
                </View>
              ) : (
                <Text style={styles.playerNameSingle}>{event.playerName}</Text>
              )}
              {hasScore && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{event.score}</Text>
                </View>
              )}
              {getEventIcon(event.type)}
            </View>
          )}
        </View>

        {/* Time in center */}
        <Text style={styles.eventTime}>{event.time}</Text>

        {/* Away team side */}
        <View style={styles.eventSide}>
          {!isHome && (
            <View style={[styles.eventContent, styles.eventContentAway]}>
              {getEventIcon(event.type)}
              {hasScore && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{event.score}</Text>
                </View>
              )}
              {isSubstitution ? (
                <View style={styles.substitutionNames}>
                  <Text style={styles.playerNameSubIn}>{event.playerName}</Text>
                  <Text style={styles.playerNameSubOut}>{event.playerOut}</Text>
                </View>
              ) : (
                <Text style={styles.playerNameSingle}>{event.playerName}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSummaryTab = () => {
    // Split events into first half and second half
    const firstHalfEvents = summary.events.filter((e) => {
      const time = parseInt(e.time.replace("'", '').replace('+', ''));
      return time <= 45 || e.time.includes('45+');
    });
    const secondHalfEvents = summary.events.filter((e) => {
      const time = parseInt(e.time.replace("'", '').replace('+', ''));
      return time > 45 && !e.time.includes('45+');
    });

    return (
      <View style={styles.summaryContainer}>
        {/* Events Timeline Card */}
        <View style={styles.timelineCard}>
          {/* Match End Whistle */}
          <View style={styles.whistleRow}>
            <MaterialCommunityIcons name="whistle" size={24} color="#22c55e" />
          </View>

          {/* Full Time */}
          <View style={styles.scoreRow}>
            <Text style={styles.scoreRowText}>{summary.fulltimeScore} FT</Text>
          </View>

          {/* Second Half Events (reversed to show latest first) */}
          {[...secondHalfEvents].reverse().map(renderEventRow)}

          {/* Half Time */}
          <View style={styles.scoreRow}>
            <Text style={styles.scoreRowText}>{summary.halftimeScore} HT</Text>
          </View>

          {/* First Half Events (reversed to show latest first) */}
          {[...firstHalfEvents].reverse().map(renderEventRow)}

          {/* Match Start Whistle */}
          <View style={styles.whistleRow}>
            <MaterialCommunityIcons name="whistle" size={24} color="#22c55e" />
          </View>
        </View>

        {/* Legend Card */}
        <View style={styles.legendCard}>
          {eventLegend.map((item) => (
            <View key={item.type} style={styles.legendItem}>
              {getEventIcon(item.type)}
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPlayerNode = (player: Player) => (
    <TouchableOpacity 
      key={player.id} 
      style={styles.playerNode}
      onPress={() => router.push(`/player/${player.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.playerPhoto}>
        <Text style={styles.playerInitial}>{player.name.charAt(0)}</Text>
      </View>
      <View style={[styles.playerRating, { backgroundColor: getRatingColor(player.rating) }]}>
        <Text style={styles.playerRatingText}>{player.rating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFormationRow = (players: Player[]) => (
    <View style={styles.formationRow}>
      {players.map((player) => renderPlayerNode(player))}
    </View>
  );

  const renderSubstituteCard = (player: Player) => (
    <TouchableOpacity 
      key={player.id} 
      style={styles.substituteCard}
      onPress={() => router.push(`/player/${player.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.substitutePhoto}>
        <Text style={styles.substituteInitial}>{player.name.charAt(0)}</Text>
      </View>
      <View style={styles.substituteInfo}>
        <Text style={styles.substituteName}>{player.name}</Text>
        <Text style={styles.substitutePosition}>{player.number} - {player.position}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLineupsTab = () => {
    const { homeTeam, awayTeam } = lineups;

    return (
      <View style={styles.lineupsContainer}>
        {/* Away Team Header */}
        <View style={styles.teamLineupHeader}>
          <View style={styles.teamLineupLogo}>
            <Text style={styles.teamLineupLogoText}>{awayTeam.teamName.charAt(0)}</Text>
          </View>
          <Text style={styles.teamLineupName}>{awayTeam.teamName}</Text>
          <Text style={styles.teamLineupFormation}>{awayTeam.formation}</Text>
          <View style={styles.teamLineupRating}>
            <Text style={styles.teamLineupRatingText}>{awayTeam.teamRating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Football Pitch */}
        <View style={styles.pitchContainer}>
          <ImageBackground
            source={require('@/images/Field.jpg')}
            style={styles.pitchImage}
            resizeMode="cover"
          >
            {/* Away Team (Top - attacking down) */}
            <View style={styles.teamFormation}>
              {renderFormationRow(awayTeam.starters.goalkeeper)}
              {renderFormationRow(awayTeam.starters.defenders)}
              {renderFormationRow(awayTeam.starters.midfielders)}
              {renderFormationRow(awayTeam.starters.forwards)}
            </View>

            {/* Home Team (Bottom - attacking up) */}
            <View style={styles.teamFormation}>
              {renderFormationRow(homeTeam.starters.forwards)}
              {renderFormationRow(homeTeam.starters.midfielders)}
              {renderFormationRow(homeTeam.starters.defenders)}
              {renderFormationRow(homeTeam.starters.goalkeeper)}
            </View>
          </ImageBackground>
        </View>

        {/* Home Team Header */}
        <View style={styles.teamLineupHeader}>
          <View style={styles.teamLineupLogo}>
            <Text style={styles.teamLineupLogoText}>{homeTeam.teamName.charAt(0)}</Text>
          </View>
          <Text style={styles.teamLineupName}>{homeTeam.teamName}</Text>
          <Text style={styles.teamLineupFormation}>{homeTeam.formation}</Text>
          <View style={styles.teamLineupRating}>
            <Text style={styles.teamLineupRatingText}>{homeTeam.teamRating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Substitutes Section */}
        <View style={styles.substitutesSection}>
          <Text style={styles.substitutesTitle}>SUBSTITUTES</Text>
          <View style={styles.substitutesGrid}>
            {[...homeTeam.substitutes, ...awayTeam.substitutes].slice(0, 6).map(renderSubstituteCard)}
          </View>
        </View>
      </View>
    );
  };

  const renderStatBar = (homeValue: number, awayValue: number) => {
    const total = homeValue + awayValue;
    const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
    
    const homeIsHigher = homeValue >= awayValue;
    const awayIsHigher = awayValue > homeValue;

    return (
      <View style={styles.statBarContainer}>
        {/* Home bar - grows from left toward center */}
        <View style={[styles.statBarTrack, styles.statBarTrackHome]}>
          <View style={styles.statBarHomeWrapper}>
            <View 
              style={[
                styles.statBar, 
                styles.statBarHome,
                { 
                  width: `${homePercent}%`,
                  backgroundColor: homeIsHigher ? '#3FAC66' : '#7782A2',
                }
              ]} 
            />
          </View>
        </View>
        {/* Away bar - grows from right toward center */}
        <View style={[styles.statBarTrack, styles.statBarTrackAway]}>
          <View style={styles.statBarAwayWrapper}>
            <View 
              style={[
                styles.statBar, 
                styles.statBarAway,
                { 
                  width: `${awayPercent}%`,
                  backgroundColor: awayIsHigher ? '#3FAC66' : '#7782A2',
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const renderStatsTab = () => {
    return (
      <View style={styles.statsContainer}>
        {/* TOP STATS Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>TOP STATS</Text>

          {/* Ball Possession */}
          <Text style={styles.statName}>Ball possession</Text>
          <View style={styles.possessionBarContainer}>
            <View style={[styles.possessionBarHome, { flex: stats.possession.home }]}>
              <Text style={styles.possessionText}>{stats.possession.home}%</Text>
            </View>
            <View style={[styles.possessionBarAway, { flex: stats.possession.away }]}>
              <Text style={styles.possessionText}>{stats.possession.away}%</Text>
            </View>
          </View>

          {/* Other Stats */}
          {stats.topStats.map((stat, index) => (
            <View key={`top-${index}`} style={styles.statRow}>
              <View style={styles.statRowHeader}>
                <Text style={styles.statValue}>{stat.homeValue}</Text>
                <Text style={styles.statName}>{stat.name}</Text>
                <Text style={[styles.statValue, styles.statValueRight]}>{stat.awayValue}</Text>
              </View>
              {renderStatBar(stat.homeValue, stat.awayValue)}
            </View>
          ))}
        </View>

        {/* SHOTS Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>SHOTS</Text>

          {stats.shots.map((stat, index) => (
            <View key={`shots-${index}`} style={styles.statRow}>
              <View style={styles.statRowHeader}>
                <Text style={styles.statValue}>{stat.homeValue}</Text>
                <Text style={styles.statName}>{stat.name}</Text>
                <Text style={[styles.statValue, styles.statValueRight]}>{stat.awayValue}</Text>
              </View>
              {renderStatBar(stat.homeValue, stat.awayValue)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderH2HMatchRow = (match: H2HMatch) => (
    <View key={match.id} style={styles.h2hMatchRow}>
      {/* Home Team */}
      <View style={styles.h2hTeamLeft}>
        <Text style={styles.h2hTeamName}>{match.homeTeam}</Text>
        <View style={styles.h2hTeamLogo}>
          <Text style={styles.h2hTeamLogoText}>{match.homeTeam.charAt(0)}</Text>
        </View>
      </View>

      {/* Center - Date & Score/Time */}
      <View style={styles.h2hMatchCenter}>
        <Text style={styles.h2hMatchDate}>{match.date}</Text>
        {match.isCompleted ? (
          <View style={styles.h2hScoreRow}>
            <Text style={styles.h2hScore}>{match.homeScore}</Text>
            <Text style={styles.h2hScore}>{match.awayScore}</Text>
          </View>
        ) : (
          <Text style={styles.h2hTime}>{match.time}</Text>
        )}
      </View>

      {/* Away Team */}
      <View style={styles.h2hTeamRight}>
        <View style={styles.h2hTeamLogo}>
          <Text style={styles.h2hTeamLogoText}>{match.awayTeam.charAt(0)}</Text>
        </View>
        <Text style={styles.h2hTeamName}>{match.awayTeam}</Text>
      </View>
    </View>
  );

  const renderH2HTab = () => {
    const total = h2h.stats.homeWins + h2h.stats.draws + h2h.stats.awayWins;
    const homePercent = total > 0 ? (h2h.stats.homeWins / total) * 100 : 0;
    const drawPercent = total > 0 ? (h2h.stats.draws / total) * 100 : 0;
    const awayPercent = total > 0 ? (h2h.stats.awayWins / total) * 100 : 0;

    return (
      <View style={styles.h2hContainer}>
        {/* Filter Tabs */}
        <View style={styles.h2hFilterContainer}>
          <TouchableOpacity
            style={[styles.h2hFilterTab, h2hFilter === 'meetings' && styles.h2hFilterTabActive]}
            onPress={() => setH2hFilter('meetings')}
          >
            <Text style={[styles.h2hFilterText, h2hFilter === 'meetings' && styles.h2hFilterTextActive]}>
              MEETINGS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.h2hFilterTab, h2hFilter === 'home' && styles.h2hFilterTabActive]}
            onPress={() => setH2hFilter('home')}
          >
            <Text style={[styles.h2hFilterText, h2hFilter === 'home' && styles.h2hFilterTextActive]}>
              {h2h.homeTeam}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.h2hFilterTab, h2hFilter === 'away' && styles.h2hFilterTabActive]}
            onPress={() => setH2hFilter('away')}
          >
            <Text style={[styles.h2hFilterText, h2hFilter === 'away' && styles.h2hFilterTextActive]}>
              {h2h.awayTeam}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={styles.h2hStatsCard}>
          {/* Stats Summary */}
          <View style={styles.h2hStatsSummary}>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, styles.h2hStatPillHome]}>
                <Text style={styles.h2hStatNumber}>{h2h.stats.homeWins}</Text>
              </View>
              <Text style={styles.h2hStatLabel}>Won</Text>
            </View>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, styles.h2hStatPillDraw]}>
                <Text style={[styles.h2hStatNumber, styles.h2hStatNumberDark]}>{h2h.stats.draws}</Text>
              </View>
              <Text style={styles.h2hStatLabel}>Drawn</Text>
            </View>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, styles.h2hStatPillAway]}>
                <Text style={styles.h2hStatNumber}>{h2h.stats.awayWins}</Text>
              </View>
              <Text style={styles.h2hStatLabel}>Won</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.h2hProgressBar}>
            <View style={[styles.h2hProgressHome, { flex: homePercent }]} />
            <View style={[styles.h2hProgressDraw, { flex: drawPercent }]} />
            <View style={[styles.h2hProgressAway, { flex: awayPercent }]} />
          </View>

          {/* Match History */}
          {(h2hShowAll ? h2h.matches : h2h.matches.slice(0, 6)).map(renderH2HMatchRow)}

          {/* See All / Show Less Button */}
          {h2h.matches.length > 6 && (
            <TouchableOpacity style={styles.h2hSeeAllButton} onPress={() => setH2hShowAll(!h2hShowAll)}>
              <Text style={styles.h2hSeeAllText}>{h2hShowAll ? 'SHOW LESS' : 'SEE ALL MATCHES'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const isTeamPlaying = (teamName: string) => {
    // Check if the team is one of the teams playing in this match
    const homeTeamName = match.homeTeam.name.toLowerCase();
    const awayTeamName = match.awayTeam.name.toLowerCase();
    const checkName = teamName.toLowerCase();
    return checkName.includes(homeTeamName) || homeTeamName.includes(checkName) ||
           checkName.includes(awayTeamName) || awayTeamName.includes(checkName);
  };

  const renderTableRow = (team: TeamStanding) => {
    const isHighlighted = isTeamPlaying(team.teamName);
    
    return (
      <View 
        key={team.position} 
        style={[styles.tableRow, isHighlighted && styles.tableRowHighlighted]}
      >
        <View style={[styles.tablePositionCircle, isHighlighted && styles.tablePositionCircleHighlighted]}>
          <Text style={[styles.tablePositionText, isHighlighted && styles.tablePositionTextHighlighted]}>
            {team.position}
          </Text>
        </View>
        <Text style={[styles.tableTeamName, isHighlighted && styles.tableTextHighlighted]}>
          {team.teamName}
        </Text>
        <Text style={[styles.tableStat, isHighlighted && styles.tableTextHighlighted]}>{team.played}</Text>
        <Text style={[styles.tableStat, isHighlighted && styles.tableTextHighlighted]}>{team.won}</Text>
        <Text style={[styles.tableStat, isHighlighted && styles.tableTextHighlighted]}>{team.drawn}</Text>
        <Text style={[styles.tableStat, isHighlighted && styles.tableTextHighlighted]}>{team.lost}</Text>
        <Text style={[styles.tableGoals, isHighlighted && styles.tableTextHighlighted]}>
          {team.goalsFor}:{team.goalsAgainst}
        </Text>
        <Text style={[styles.tablePoints, isHighlighted && styles.tableTextHighlighted]}>{team.points}</Text>
      </View>
    );
  };

  const renderTableTab = () => {
    return (
      <View style={styles.tableContainer}>
        {/* Table Card */}
        <View style={styles.tableCard}>
          {/* Filter Tabs */}
          <View style={styles.tableFilterContainer}>
            <TouchableOpacity
              style={[styles.tableFilterTab, tableFilter === 'all' && styles.tableFilterTabActive]}
              onPress={() => setTableFilter('all')}
            >
              <Text style={[styles.tableFilterText, tableFilter === 'all' && styles.tableFilterTextActive]}>
                ALL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableFilterTab, tableFilter === 'home' && styles.tableFilterTabActive]}
              onPress={() => setTableFilter('home')}
            >
              <Text style={[styles.tableFilterText, tableFilter === 'home' && styles.tableFilterTextActive]}>
                HOME
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableFilterTab, tableFilter === 'away' && styles.tableFilterTabActive]}
              onPress={() => setTableFilter('away')}
            >
              <Text style={[styles.tableFilterText, tableFilter === 'away' && styles.tableFilterTextActive]}>
                AWAY
              </Text>
            </TouchableOpacity>
          </View>

          {/* League Title */}
          <Text style={styles.tableLeagueTitle}>{table.leagueName}</Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderPosition}>#</Text>
            <Text style={styles.tableHeaderTeam}>Team</Text>
            <Text style={styles.tableHeaderStat}>P</Text>
            <Text style={styles.tableHeaderStat}>W</Text>
            <Text style={styles.tableHeaderStat}>D</Text>
            <Text style={styles.tableHeaderStat}>L</Text>
            <Text style={styles.tableHeaderGoals}>Goals</Text>
            <Text style={styles.tableHeaderPoints}>PTS</Text>
          </View>

          {/* Table Rows */}
          {table.standings.map(renderTableRow)}
        </View>
      </View>
    );
  };

  const renderPowerTab = () => {
    return (
      <View style={styles.powerContainer}>
        {/* Team Balance Section */}
        <View style={styles.powerSection}>
          <Text style={styles.powerSectionTitle}>TEAM BALANCE</Text>
          <Text style={styles.powerSectionDescription}>
            A chart comparing two team's strength and performance
          </Text>
          <TeamBalanceChart
            data={powerData.teamBalance}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
          />
        </View>

        {/* Separator */}
        <View style={styles.powerSeparator} />

        {/* Team Power Section */}
        <View style={styles.powerSection}>
          <Text style={styles.powerSectionTitle}>TEAM POWER</Text>
          <Text style={styles.powerSectionDescription}>
            Comparison of the team's power based on past matches
          </Text>
          <TeamPowerChart
            data={powerData.teamPower}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
          />
        </View>

        {/* Separator */}
        <View style={styles.powerSeparator} />

        {/* Goal Power Section */}
        <View style={styles.powerSection}>
          <Text style={styles.powerSectionTitle}>GOAL POWER</Text>
          <Text style={styles.powerSectionDescription}>
            A chart that display's the timing of the goals scored during a match showing when each team found the net
          </Text>
          <GoalPowerChart
            data={powerData.goalPower}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
          />
        </View>
      </View>
    );
  };

  const renderCommentaryItem = (item: CommentaryItem) => (
    <View key={item.id} style={styles.commentaryCard}>
      <View style={styles.commentaryTimeBadge}>
        <Text style={styles.commentaryTimeText}>{item.time}</Text>
      </View>
      <Text style={styles.commentaryText}>{item.text}</Text>
    </View>
  );

  const renderCommentaryTab = () => {
    return (
      <View style={styles.commentaryContainer}>
        {commentary.items.map(renderCommentaryItem)}
      </View>
    );
  };

  const renderPlaceholderTab = () => (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Coming Soon</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header & Score Section with Gradient */}
      <LinearGradient
        colors={['#202D4B', '#111828', '#080C17']}
        locations={[0, 0.4, 1]}
        style={styles.gradientHeader}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Feather name="chevron-left" size={28} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.leagueName}>{match.league}</Text>
            <Text style={styles.matchDate}>{match.date}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? '#22c55e' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <View style={styles.teamContainer}>
            <View style={styles.teamLogo}>
              <Text style={styles.teamLogoText}>{match.homeTeam.name.charAt(0)}</Text>
            </View>
            <Text style={styles.teamName}>{match.homeTeam.name}</Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              {match.homeScore} - {match.awayScore}
            </Text>
            {match.matchTime && <Text style={styles.matchTimeText}>{match.matchTime}</Text>}
          </View>

          <View style={styles.teamContainer}>
            <View style={styles.teamLogo}>
              <Text style={styles.teamLogoText}>{match.awayTeam.name.charAt(0)}</Text>
            </View>
            <Text style={styles.teamName}>{match.awayTeam.name}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.id && styles.tabTextSelected,
                ]}
              >
                {tab.label}
          </Text>
              {selectedTab === tab.id && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {selectedTab === 'details' && renderDetailsTab()}
        {selectedTab === 'summary' && renderSummaryTab()}
        {selectedTab === 'lineups' && renderLineupsTab()}
        {selectedTab === 'stats' && renderStatsTab()}
        {selectedTab === 'h2h' && renderH2HTab()}
        {selectedTab === 'table' && renderTableTab()}
        {selectedTab === 'power' && renderPowerTab()}
        {selectedTab === 'commentary' && renderCommentaryTab()}
        {!['details', 'summary', 'lineups', 'stats', 'h2h', 'table', 'power', 'commentary'].includes(selectedTab) && renderPlaceholderTab()}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C17',
  },
  gradientHeader: {
    paddingBottom: 0,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  leagueName: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
  },
  matchDate: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  // Score Section
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamLogoText: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  teamName: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 40,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  matchTimeText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
    marginTop: 4,
  },
  // Tab Navigation
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: '#6b7280',
  },
  tabTextSelected: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  // Content
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  detailsContainer: {
    gap: 16,
  },
  // Betting Card
  bettingCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
  },
  bettingTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    marginBottom: 16,
  },
  betOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  betOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  betOptionDefault: {
    backgroundColor: '#0E1C1C',
  },
  betOptionDraw: {
    backgroundColor: '#080C17',
  },
  betOptionAway: {
    backgroundColor: '#3FAC66',
  },
  betOptionSelected: {
    borderColor: '#24C45F',
  },
  betOptionLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  betOptionLabelAway: {
    color: '#ffffff',
  },
  betOptionOdds: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#9ca3af',
    marginTop: 2,
  },
  betOptionOddsAway: {
    color: '#ffffff',
  },
  stakeLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    marginBottom: 8,
  },
  stakeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080C17',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stakeInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    paddingVertical: 14,
  },
  stakeUnit: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
  },
  potentialWinningsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E1C1C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#142A28',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  potentialWinningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  potentialWinningsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#2B5555',
  },
  potentialWinningsAmount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#22c55e',
  },
  placeBidButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeBidButtonText: {
    fontSize: 15,
    fontFamily: 'Montserrat_900Black',
    color: '#ffffff',
  },
  // Match Info Card
  matchInfoCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    gap: 12,
  },
  infoRowDouble: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  infoHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoValueText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
  },
  infoLabelText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#B3B3B3',
    marginTop: 2,
  },
  // Placeholder
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#6b7280',
  },
  // Summary Tab
  summaryContainer: {
    gap: 16,
  },
  timelineCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    overflow: 'hidden',
  },
  whistleRow: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#101828',
  },
  scoreRow: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#1A253D',
  },
  scoreRowText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A253D',
  },
  eventSide: {
    flex: 1,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  eventContentAway: {
    justifyContent: 'flex-start',
  },
  eventTime: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
    width: 50,
    textAlign: 'center',
  },
  playerNameSingle: {
    fontSize: 10,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  substitutionNames: {
    alignItems: 'flex-end',
  },
  playerNameSubIn: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  playerNameSubOut: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#919191',
  },
  scoreBadge: {
    backgroundColor: '#24C45F',
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  cardIcon: {
    width: 12,
    height: 16,
    borderRadius: 2,
  },
  cardIconSmall: {
    width: 10,
    height: 14,
    borderRadius: 2,
  },
  yellowCard: {
    backgroundColor: '#fbbf24',
  },
  redCard: {
    backgroundColor: '#ef4444',
  },
  twoYellowCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOverlap: {
    marginLeft: -6,
  },
  // Legend
  legendCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  // Lineups Tab
  lineupsContainer: {
    gap: 0,
  },
  teamLineupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111828',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  teamLineupLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLineupLogoText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  teamLineupName: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  teamLineupFormation: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#B4B4B4',
    flex: 1,
  },
  teamLineupRating: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  teamLineupRatingText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#000000',
  },
  // Football Pitch
  pitchContainer: {
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  pitchImage: {
    width: '100%',
    aspectRatio: 0.7,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  teamFormation: {
    paddingVertical: 2,
  },
  formationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  playerNode: {
    alignItems: 'center',
  },
  playerPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  playerRating: {
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  playerRatingText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  // Substitutes
  substitutesSection: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  substitutesTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
    marginBottom: 16,
  },
  substitutesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  substituteCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111828',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  substitutePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteInitial: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  substituteInfo: {
    flex: 1,
  },
  substituteName: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  substitutePosition: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
    marginTop: 2,
  },
  // Stats Tab
  statsContainer: {
    gap: 16,
  },
  statsCard: {
    backgroundColor: '#080C17',
    borderWidth: 1,
    borderColor: '#1A253D',
    borderRadius: 12,
    padding: 16,
  },
  statsCardTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  // Possession Bar
  possessionBarContainer: {
    flexDirection: 'row',
    height: 25,
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  possessionBarHome: {
    backgroundColor: '#3FAC66',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  possessionBarAway: {
    backgroundColor: '#111828',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  possessionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
  },
  // Stat Rows
  statRow: {
    marginBottom: 16,
  },
  statRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statName: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    width: 30,
  },
  statValueRight: {
    textAlign: 'right',
  },
  statBarContainer: {
    flexDirection: 'row',
    height: 15,
    gap: 8,
  },
  statBarTrack: {
    flex: 1,
    height: 15,
    backgroundColor: '#111828',
    overflow: 'hidden',
  },
  statBarTrackHome: {
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  statBarTrackAway: {
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
  },
  statBarHomeWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statBarAwayWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statBar: {
    height: 15,
  },
  statBarHome: {
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  statBarAway: {
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
  },
  // H2H Tab
  h2hContainer: {
    gap: 16,
  },
  h2hFilterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  h2hFilterTab: {
    backgroundColor: '#080C17',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  h2hFilterTabActive: {
    backgroundColor: '#32A95D',
    borderColor: '#32A95D',
  },
  h2hFilterText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hFilterTextActive: {
    fontFamily: 'Montserrat_800ExtraBold',
  },
  h2hStatsCard: {
    backgroundColor: '#111828',
    borderRadius: 12,
    padding: 16,
  },
  h2hStatsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  h2hStatItem: {
    alignItems: 'center',
  },
  h2hStatPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  h2hStatPillHome: {
    backgroundColor: '#2A50CD',
  },
  h2hStatPillDraw: {
    backgroundColor: '#FFFFFF',
  },
  h2hStatPillAway: {
    backgroundColor: '#D3473B',
  },
  h2hStatNumber: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  h2hStatNumberDark: {
    color: '#000000',
  },
  h2hStatLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hProgressBar: {
    flexDirection: 'row',
    height: 8,
    marginBottom: 20,
  },
  h2hProgressHome: {
    backgroundColor: '#2A50CD',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  h2hProgressDraw: {
    backgroundColor: '#FFFFFF',
  },
  h2hProgressAway: {
    backgroundColor: '#D3473B',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  h2hMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#202D4B',
  },
  h2hTeamLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  h2hTeamRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  h2hTeamName: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hTeamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h2hTeamLogoText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  h2hMatchCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  h2hMatchDate: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  h2hScoreRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  h2hScore: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hTime: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginTop: 4,
  },
  h2hSeeAllButton: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#202D4B',
  },
  h2hSeeAllText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  // Table Tab
  tableContainer: {
    gap: 16,
  },
  tableFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222F4E',
    marginBottom: 16,
  },
  tableFilterTab: {
    backgroundColor: '#080C17',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  tableFilterTabActive: {
    backgroundColor: '#3FAC66',
  },
  tableFilterText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  tableFilterTextActive: {
    color: '#ffffff',
  },
  tableCard: {
    backgroundColor: '#111828',
    borderRadius: 12,
    padding: 16,
  },
  tableLeagueTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2F384C',
  },
  tableHeaderPosition: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderTeam: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
  },
  tableHeaderStat: {
    width: 32,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderGoals: {
    width: 50,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderPoints: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tableRowHighlighted: {
    backgroundColor: '#3FAC66',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tablePositionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2F384C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tablePositionCircleHighlighted: {
    backgroundColor: '#ffffff',
  },
  tablePositionText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  tablePositionTextHighlighted: {
    color: '#000000',
  },
  tableTeamName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
  },
  tableStat: {
    width: 32,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableGoals: {
    width: 50,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tablePoints: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableTextHighlighted: {
    color: '#ffffff',
  },
  // Commentary Tab
  commentaryContainer: {
    gap: 12,
  },
  commentaryCard: {
    backgroundColor: '#111828',
    borderRadius: 5,
    padding: 16,
  },
  commentaryTimeBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  commentaryTimeText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#000000',
  },
  commentaryText: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    lineHeight: 22,
  },
  // Power Tab
  powerContainer: {
    gap: 0,
  },
  powerSection: {
    paddingVertical: 20,
  },
  powerSectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  powerSectionDescription: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
    marginBottom: 20,
  },
  powerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
