
import Image from 'next/image';

export function FootballField({ team1, team2 }: FootballFieldProps) {
  const allPlayers = [
    ...team1.squad_players.map((sp) => ({ sp, color: team1.jersey_color })),
    ...team2.squad_players.map((sp) => ({ sp, color: team2.jersey_color })),
  ];

  return (
    <div className="relative w-full aspect-[100/160] rounded-xl overflow-hidden border-2 border-white/20">
      
      {/* 1. Saha Çizimi (SVG Zemin) */}
      <svg viewBox="0 0 100 160" className="absolute inset-0 w-full h-full">
        <rect width="100" height="160" fill="#16a34a" />
        <rect x="5" y="5" width="90" height="150" fill="none" stroke="white" strokeWidth="0.6" opacity="0.8" />
        <line x1="5" y1="80" x2="95" y2="80" stroke="white" strokeWidth="0.5" opacity="0.8" />
        <circle cx="50" cy="80" r="12" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
      </svg>

      {/* 2. Futbolcular (HTML Katmanı) */}
      {allPlayers.map(({ sp }) => {
        const p = sp.player;
        if (!p) return null;
        const photoUrl = p.user?.photo_url;

        return (
          <div
            key={sp.id}
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${sp.field_x}%`, top: `${sp.field_y}%` }}
          >
            {/* Fotoğraf Dairesi */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-slate-700 shadow-lg">
              {photoUrl ? (
                <Image src={photoUrl} alt={p.display_name} width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold bg-slate-600">
                  {p.display_name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* İsim Etiketi */}
            <span className="mt-1 text-[8px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
              {p.display_name.split(' ').pop()?.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}