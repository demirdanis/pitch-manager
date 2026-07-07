import { GoogleGenerativeAI } from '@google/generative-ai';
import { Player, AiSquadResult, AiTeamPlayer, PositionCode } from '@/types';
import { computeFieldRadar, computeGkRadar, computeOverall } from '@/utils';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Yardımcı bekleme fonksiyonu (Retry için)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// Oyuncu sayısına göre ön tanımlı takım şablonları (Y ekseni 0-50 arası baz alınarak - Takım 1)
const FORMATIONS: Record<number, { position: PositionCode; x: number; y: number }[]> = {
  5: [ // 5v5 -> Elmas (1-2-1)
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 50, y: 15 },
    { position: 'LM', x: 20, y: 30 },
    { position: 'RM', x: 80, y: 30 },
    { position: 'ST', x: 50, y: 45 },
  ],
  6: [ // 6v6 -> Defansif (3-1-1)
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 20 },
    { position: 'CB', x: 50, y: 15 },
    { position: 'RB', x: 85, y: 20 },
    { position: 'CM', x: 50, y: 35 },
    { position: 'ST', x: 50, y: 45 },
  ],
  7: [ // 7v7 -> Standart Halı Saha (3-2-1)
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 20 },
    { position: 'CB', x: 50, y: 15 },
    { position: 'RB', x: 85, y: 20 },
    { position: 'LM', x: 25, y: 35 },
    { position: 'RM', x: 75, y: 35 },
    { position: 'ST', x: 50, y: 45 },
  ]
};

// Beklenmedik oyuncu sayıları için varsayılan basit bir dizilim üreteci (Eğer 5,6,7 dışında bir rakam gelirse çökmemesi için)
function getFallbackFormation(count: number): { position: PositionCode; x: number; y: number }[] {
  const formation: { position: PositionCode; x: number; y: number }[] = [{ position: 'GK', x: 50, y: 5 }];
  for (let i = 1; i < count; i++) {
    formation.push({ position: 'CM', x: 20 + (i * 10), y: 25 }); // Basit yanyana dizilim
  }
  return formation;
}

export async function generateSquad(
  players: Player[],
  playerCount: number
): Promise<AiSquadResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const halfCount = playerCount / 2;
  const playerContext = buildPlayerContext(players);
  
  // İlgili kişi sayısına göre formasyonumuzu alıyoruz
  const activeFormation = FORMATIONS[halfCount] || getFallbackFormation(halfCount);
  const requiredPositionsList = activeFormation.map(f => f.position).join(', ');

  const prompt = `Sen bir uzman futbol antrenörüsün. Aşağıda ${players.length} futbolcunun özellikleri JSON formatında verilmiştir.
Bu oyunculardan güçleri birbirine MÜMKÜN OLDUĞUNCA eşit 2 adet dengeli takım oluştur.

Takımlarımız ${halfCount}v${halfCount} şeklinde oynanacaktır. 

ZORUNLU KURALLAR:
1. Her iki takım için DE şu pozisyonları BİREBİR doldurmak ZORUNDASIN: [${requiredPositionsList}]
2. Her takımda tam olarak 1 adet GK olmak zorunda.
3. Her oyuncuyu yeteneklerine ("positions" alanındaki verilere veya puanlarına) en uygun olduğu rolde oynat.
4. Toplam takım güçlerinin (overall) dengeli olmasına azami özen göster.

Oyuncu verileri:
${playerContext}

Yanıtı SADECE aşağıdaki geçerli JSON formatında ver, başka hiçbir şey (kod bloğu işareti vb) yazma. 
"position" alanına mutlaka zorunlu tutulan pozisyon kodlarından birini yaz:
{
  "team1": [
    { "playerId": "...", "playerName": "...", "position": "GK" },
    { "playerId": "...", "playerName": "...", "position": "CB" }
  ],
  "team2": [
    { "playerId": "...", "playerName": "...", "position": "GK" },
    { "playerId": "...", "playerName": "...", "position": "CB" }
  ],
  "balance_score": 94.5,
  "notes": "Kısa açıklama: Neden bu oyuncuları seçtiğin"
}`;

  let text = "";
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text().trim();
      break; 
    } catch (error: any) {
      if (error?.status === 429 && attempt < maxRetries - 1) {
        console.warn(`[Gemini API] Rate limit aşıldı. 15s bekleniyor (Deneme: ${attempt + 1})`);
        await delay(15000); 
      } else {
        throw error;
      }
    }
  }

  const jsonText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const raw = JSON.parse(jsonText) as {
    team1: { playerId: string; playerName: string; position: string }[];
    team2: { playerId: string; playerName: string; position: string }[];
    balance_score: number;
    notes: string;
  };

  // Gemini'dan gelen pozisyona göre haritadan bizim sabit X,Y koordinatımızı çekiyoruz
  // mirrorY true ise 2. takım için y eksenini 100 üzerinden ters çevirip rakip sahaya atıyoruz (50-100 arasına)
  const mapTeam = (items: typeof raw.team1, mirrorY: boolean): AiTeamPlayer[] =>
    items.map((item) => {
      const pos = item.position as PositionCode;
      // Formasyondan bu pozisyonun X ve Y'sini bul. Yoksa sahaya rastgele atma, merkeze al
      const formRole = activeFormation.find(f => f.position === pos);
      const coords = formRole ? { x: formRole.x, y: formRole.y } : { x: 50, y: 25 }; 
      
      const finalY = mirrorY ? 100 - coords.y : coords.y;

      return {
        playerId: item.playerId,
        playerName: item.playerName,
        position: pos,
        x: coords.x,
        y: finalY,
      };
    });

  return {
    team1: mapTeam(raw.team1, false), // Takım 1 Y: 0-50 arası kalır
    team2: mapTeam(raw.team2, true),  // Takım 2 Y: 50-100 arasına yansıtılır
    balance_score: raw.balance_score,
    notes: raw.notes,
  };
}