const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/EventDetails.tsx', 'utf8');

const regex = /\/\/ Listen to real-time reviews from Firestore for this event[\s\S]*?return \(\) => unsubscribe\(\);/m;
const replacement = `const fetchReviews = async () => {
      try {
        const { data, error } = await supabase.from('reviews').select('*').eq('event_id', id).order('created_at', { ascending: false });
        if (data && !error) {
          const supabaseReviews = data.map((r: any) => ({
            id: r.id,
            eventId: r.event_id,
            userId: r.user_id,
            userName: r.user_name,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at
          }));
          const localReviews = getReviewsForEvent(id).filter(mock => !supabaseReviews.some(fire => fire.eventId === mock.eventId && (fire.comment === mock.comment || fire.id === mock.id)));
          const combined = [...supabaseReviews, ...localReviews];
          
          const sum = combined.reduce((acc, curr) => acc + curr.rating, 0);
          const average = combined.length > 0 ? Math.round((sum / combined.length) * 10) / 10 : 0;
          
          setReviews(combined);
          setAvgRating(average);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchReviews();
    
    const channel = supabase
      .channel('public:reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: \`event_id=eq.\${id}\` }, payload => {
        fetchReviews();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };`;

content = content.replace(regex, replacement);
fs.writeFileSync('Frontend/src/pages/EventDetails.tsx', content);
