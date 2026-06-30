import { GoogleGenerativeAI } from '@google/generative-ai';
import { Player, AiSquadResult, AiTeamPlayer, PositionCode } from '@/types';
import { computeFieldRadar, computeGkRadar, computeOverall } from '@/utils';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

function buildPlayerContext(players: Player[]): string {
  return players
    .map((p) => {
      const fa = p.field_attributes;
      const ga = p.gk_attributes;
      const positions = p.position_ratings?.map((r) => `${r.position}:${r.rating}`).join(', ') ?? '';

      const fieldRadar = fa ? computeFieldRadar(fa) : null;
      const gkRadar = ga ? computeGkRadar(ga) : null;
      const ovr = fieldRadar ? computeOverall(fieldRadar) : (gkRadar ? Math.round(Object.values(gkRadar).reduce((s,v)=>s+v,0)/5) : 60);

      return JSON.stringify({
        id: p.id,
        name: p.display_name,
        overall: ovr,
        positions,
        field: fieldRadar ?? undefined,
        gk: gkRadar ?? undefined,
      });
    })
    .join('\n');
}

// Preset field coordinates per position for a top-down 4-3-3 / 4-4-2 style layout
const POSITION_COORDS: Record<PositionCode, { x: number; y: number }> = {
  GK:  { x: 50, y: 90 },
  CB:  { x: 50, y: 75 },
  LB:  { x: 20, y: 75 },
  RB:  { x: 80, y: 75 },
  CDM: { x: 50, y: 60 },
  LM:  { x: 20, y: 50 },
  CM:  { x: 50, y: 50 },
  RM:  { x: 80, y: 50 },
  LW:  { x: 20, y: 30 },
  RW:  { x: 80, y: 30 },
  CAM: { x: 50, y: 35 },
  CF:  { x: 50, y: 25 },
  ST:  { x: 50, y: 15 },
};

function mirrorForTeam2(player: AiTeamPlayer): AiTeamPlayer {
  return { ...player, y: 100 - player.y };
}

export async function generateSquad(
  players: Player[],
  playerCount: number
): Promise<AiSquadResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const halfCount = playerCount / 2;
  const playerContext = buildPlayerContext(players);

  const prompt = `Sen bir futbol antrenörüsün. Aşağıda ${players.length} futbolcunun özellikleri JSON formatında verilmiştir.
Bu oyunculardan 2 dengeli takım oluştur. Her takımda ${halfCount} oyuncu olacak.

Kurallar:
1. Her takımın toplam overall puanı birbirine MÜMKÜN OLDUĞUNCA yakın olmalı.
2. En az 1 kaleci (GK) her takımda zorunlu. GK özelliği olan oyuncuyu kaleye koy.
3. Her oyuncuyu en iyi pozisyonuna yerleştir (positions alanındaki en yüksek puanlı pozisyona göre).
4. Saha formatı: ${halfCount}v${halfCount}
5. Pozisyon seçerken şu formatı kullan: GK, LB, RB, CB, CDM, LM, CM, RM, LW, RW, CAM, CF, ST

Oyuncu verileri:
${playerContext}

Yanıtı SADECE geçerli JSON olarak ver, başka hiçbir şey yazma:
{
  "team1": [
    { "playerId": "...", "playerName": "...", "position": "ST" }
  ],
  "team2": [
    { "playerId": "...", "playerName": "...", "position": "GK" }
  ],
  "balance_score": 94.5,
  "notes": "Kısa açıklama"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const jsonText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const raw = JSON.parse(jsonText) as {
    team1: { playerId: string; playerName: string; position: string }[];
    team2: { playerId: string; playerName: string; position: string }[];
    balance_score: number;
    notes: string;
  };

  const mapTeam = (items: typeof raw.team1, mirrorY: boolean): AiTeamPlayer[] =>
    items.map((item) => {
      const pos = item.position as PositionCode;
      const coords = POSITION_COORDS[pos] ?? { x: 50, y: 50 };
      const y = mirrorY ? 100 - coords.y : coords.y;
      return {
        playerId: item.playerId,
        playerName: item.playerName,
        position: pos,
        x: coords.x,
        y,
      };
    });

  return {
    team1: mapTeam(raw.team1, false),
    team2: mapTeam(raw.team2, true),
    balance_score: raw.balance_score,
    notes: raw.notes,
  };
}
