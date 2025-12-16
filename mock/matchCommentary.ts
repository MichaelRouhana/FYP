export interface CommentaryItem {
  id: string;
  time: string;
  text: string;
}

export interface MatchCommentary {
  items: CommentaryItem[];
}

export const getMatchCommentary = (matchId: string): MatchCommentary => {
  // Mock data based on the image provided
  return {
    items: [
      {
        id: '1',
        time: 'FT',
        text: 'Final Score: Lorient 1-1 PSG.',
      },
      {
        id: '2',
        time: '90+5',
        text: 'Yellow card: Bradley Barcola (PSG) shown a yellow card for a foul. Foul by Barcola; also free-kick won by Lorient\'s Makengo.',
      },
      {
        id: '3',
        time: '90+2',
        text: 'Substitution for Lorient: Sambou Soumano replaces Noah Cadiou.',
      },
      {
        id: '4',
        time: '89',
        text: 'Attempt missed: Bradley Barcola (PSG) right-footed shot from centre of box misses to the right. Assisted by Ramos.',
      },
      {
        id: '5',
        time: '77',
        text: 'Substitution for PSG: Gonçalo Ramos replaces Warren Zaire-Emery.',
      },
      {
        id: '6',
        time: '69',
        text: 'Substitutions for FC Lorient: Arthur Avom replaces Dermane Karim; Aiyegun Tosin replaces Mohamed Bamba.',
      },
      {
        id: '7',
        time: '68',
        text: 'Yellow card: Illia Zabarnyi (PSG) shown a yellow card for a foul.',
      },
      {
        id: '8',
        time: '63',
        text: 'Injury & substitution: Désiré Doué (PSG) is injured and replaced by Bradley Barcola.',
      },
      {
        id: '9',
        time: '61',
        text: 'Substitution for PSG: Khvicha Kvaratskhelia replaces Ousmane Dembélé.',
      },
      {
        id: '10',
        time: '51',
        text: 'Goal! Lorient 1-1 PSG — Igor Silva (Lorient) scored a low shot from outside the box to the bottom left corner.',
      },
      {
        id: '11',
        time: '49',
        text: 'Goal! PSG 1-0 Lorient — Nuno Mendes (PSG) scored a right-footed shot from very close range.',
      },
      {
        id: '12',
        time: '45+2',
        text: 'Half time: PSG 0-0 Lorient.',
      },
      {
        id: '13',
        time: '38',
        text: 'Attempt saved: Ousmane Dembélé (PSG) right-footed shot from the right side of the box is saved in the centre of the goal.',
      },
      {
        id: '14',
        time: '25',
        text: 'Corner for PSG. Conceded by Mohamed Bamba.',
      },
      {
        id: '15',
        time: '12',
        text: 'Attempt missed: Warren Zaire-Emery (PSG) header from the centre of the box misses to the left.',
      },
      {
        id: '16',
        time: '1',
        text: 'First half begins. PSG get the match underway.',
      },
    ],
  };
};

