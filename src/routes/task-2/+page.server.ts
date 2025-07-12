import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const db = locals.db;

  // Get all positive engagement events with user timezone info
  const query = `
    SELECT 
      ue.artist_id,
      a.name as artist_name,
      ue.event_type,
      ue.created_at,
      u.timezone
    FROM user_events ue
    JOIN users u ON ue.user_id = u.id
    JOIN artists a ON ue.artist_id = a.id
    WHERE ue.event_type IN ('like_track', 'add_track_to_playlist', 'play_track', 'share_track')
    ORDER BY ue.artist_id, ue.created_at
  `;

  const rawData = db.prepare(query).all();

  return {
    rawData,
  };
};
