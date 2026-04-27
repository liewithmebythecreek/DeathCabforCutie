require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data: rides, error: ridesErr } = await supabase.from('rides').select('*');
  console.log('Rides:', rides?.length, ridesErr);
  if (rides?.length > 0) {
    console.log('First ride:', rides[0]);
  }
  
  const { data: users, error: usersErr } = await supabase.from('users').select('id, email, fcm_token');
  console.log('Users with fcm_token:', users?.filter(u => u.fcm_token)?.length, 'out of', users?.length);
}
check();
