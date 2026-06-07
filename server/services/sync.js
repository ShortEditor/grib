const { createClient } = require('@supabase/supabase-js');
const { dumps } = require('../db');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_KEY missing — cloud sync disabled');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Push a dump from laptop to Supabase cloud
 */
async function pushToCloud(dump) {
  if (!supabase) return;

  try {
    const { error } = await supabase.from('dumps_sync').insert({
      content: dump.content,
      mood_tag: dump.moodTag || 'random',
      word_count: dump.wordCount,
      source: 'laptop',
      created_at: dump.createdAt,
      synced_to_laptop: true,
      synced_to_mobile: false,
    });

    if (error) throw error;
    console.log('☁️  Dump pushed to cloud');
  } catch (err) {
    console.error('Cloud push failed:', err.message);
  }
}

/**
 * Pull unsynced dumps from Supabase and save to local NeDB
 */
async function pullFromCloud() {
  if (!supabase) return;

  try {
    const { data: rows, error } = await supabase
      .from('dumps_sync')
      .select('*')
      .eq('synced_to_laptop', false);

    if (error) throw error;
    if (!rows || rows.length === 0) return;

    console.log(`📥 Pulling ${rows.length} dump(s) from cloud...`);

    const syncedIds = [];

    for (const row of rows) {
      // Check if already exists locally (avoid duplicates)
      const existing = await dumps.findAsync({ cloudId: row.id });
      if (existing.length > 0) {
        syncedIds.push(row.id);
        continue;
      }

      await dumps.insertAsync({
        userId: 'default',
        content: row.content,
        moodTag: row.mood_tag,
        wordCount: row.word_count,
        createdAt: new Date(row.created_at),
        syncedFrom: 'mobile',
        cloudId: row.id,
      });

      syncedIds.push(row.id);
    }

    // Mark all as synced to laptop in Supabase
    if (syncedIds.length > 0) {
      const { error: updateError } = await supabase
        .from('dumps_sync')
        .update({ synced_to_laptop: true })
        .in('id', syncedIds);

      if (updateError) throw updateError;
      console.log(`✅ Synced ${syncedIds.length} dump(s) from cloud to local`);
    }

    // Cleanup: delete rows synced to both devices
    await cleanupSynced();
  } catch (err) {
    console.error('Cloud pull failed:', err.message);
  }
}

/**
 * Delete dumps from Supabase that both devices have synced
 */
async function cleanupSynced() {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('dumps_sync')
      .delete()
      .eq('synced_to_laptop', true)
      .eq('synced_to_mobile', true);
    if (error) console.error('Cleanup failed:', error.message);
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

/**
 * Start sync: pull once on startup, then every 5 minutes
 */
function startSync() {
  if (!supabase) {
    console.log('☁️  Cloud sync skipped (no credentials)');
    return;
  }

  console.log('☁️  Starting cloud sync...');
  pullFromCloud();

  setInterval(() => {
    pullFromCloud();
  }, 5 * 60 * 1000); // every 5 minutes
}

module.exports = { pushToCloud, pullFromCloud, startSync };

