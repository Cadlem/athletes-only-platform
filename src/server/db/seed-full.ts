// Seed script for full athlete and post data
// Run with: pnpm tsx src/server/db/seed-full.ts

import 'dotenv/config';
import crypto from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';

import * as existingSchema from './schema/existing-db-schema.js';
import seedPostsData from './seeds/seed_posts.json' assert { type: 'json' };

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: existingSchema });

// Extended athlete data for seeding
const athleteData = [
  { name: 'John Track Star', sport: 'Track & Field', school: 'UCLA', bio: 'NCAA D1 Sprinter specializing in 400m', tier: 'verified' },
  { name: 'Jane Basketball Pro', sport: 'Basketball', school: 'UConn', bio: 'Point guard, 2x All-American', tier: 'verified' },
  { name: 'Alex Soccer Star', sport: 'Soccer', school: 'Stanford', bio: 'Midfielder, Pac-12 Champion', tier: 'verified' },
  { name: 'Sarah Gymnast', sport: 'Gymnastics', school: 'Oklahoma', bio: 'All-Around, National Champion', tier: 'verified' },
  { name: 'Mike Swimmer', sport: 'Swimming', school: 'USC', bio: 'Freestyle specialist, Olympic Trials', tier: 'verified' },
  { name: 'Emily Tennis', sport: 'Tennis', school: 'Duke', bio: 'Singles and Doubles', tier: 'verified' },
  { name: 'Chris Football', sport: 'Football', school: 'Alabama', bio: 'Quarterback, Heisman Candidate', tier: 'verified' },
  { name: 'Maya Volleyball', sport: 'Volleyball', school: 'Texas', bio: 'Outside hitter, National Champ', tier: 'verified' },
  { name: 'David Baseball', sport: 'Baseball', school: 'LSU', bio: 'Pitcher, MLB Draft prospect', tier: 'pending' },
  { name: 'Lisa Softball', sport: 'Softball', school: 'UCLA', bio: 'Shortstop, World Series Champion', tier: 'verified' },
];

const schoolData = [
  { name: 'University of California Los Angeles', shortName: 'UCLA', conference: 'Pac-12' },
  { name: 'University of Connecticut', shortName: 'UConn', conference: 'Big East' },
  { name: 'Stanford University', shortName: 'Stanford', conference: 'Pac-12' },
  { name: 'University of Oklahoma', shortName: 'Oklahoma', conference: 'Big 12' },
  { name: 'University of Southern California', shortName: 'USC', conference: 'Pac-12' },
  { name: 'Duke University', shortName: 'Duke', conference: 'ACC' },
  { name: 'University of Alabama', shortName: 'Alabama', conference: 'SEC' },
  { name: 'University of Texas', shortName: 'Texas', conference: 'Big 12' },
  { name: 'Louisiana State University', shortName: 'LSU', conference: 'SEC' },
];

async function seedFull() {
  console.log('Starting full seed...');

  // Seed schools
  let schools = await db.select().from(existingSchema.schools).limit(10);
  if (schools.length === 0) {
    const inserted = await db.insert(existingSchema.schools).values(
      schoolData.map(s => ({
        name: s.name,
        shortName: s.shortName,
        conference: s.conference,
      }))
    ).returning();
    schools = inserted;
    console.log('Seeded schools:', schools.length);
  }

  // Get existing users to check if we need to seed
  const existingUsers = await db.select().from(existingSchema.users).limit(5);
  
  let athleteProfiles = await db.select().from(existingSchema.athleteProfiles).limit(20);
  
  if (athleteProfiles.length === 0) {
    // Create users and athletes
    for (const athlete of athleteData) {
      const userId = crypto.randomUUID();
      const athleteId = crypto.randomUUID();
      const school = schools.find(s => s.shortName === athlete.school) || schools[0];
      
      // Create user
      await db.insert(existingSchema.users).values({
        id: userId,
        email: `${athlete.name.toLowerCase().replace(' ', '.')}@athletesonly.com`,
        passwordHash: '$2b$10$ExampleHashForDemo123456789',
        role: 'athlete',
      });

      // Create athlete profile
      await db.insert(existingSchema.athleteProfiles).values({
        id: athleteId,
        userId: userId,
        schoolId: school?.id,
        displayName: athlete.name,
        sport: athlete.sport,
        bio: athlete.bio,
        verificationStatus: athlete.tier as 'verified' | 'pending',
        avatarUrl: `/media/${athlete.name.toLowerCase().replace(' ', '-')}.jpg`,
      });
    }
    
    athleteProfiles = await db.select().from(existingSchema.athleteProfiles);
    console.log('Seeded athletes:', athleteProfiles.length);
  }

  // Seed posts
  const existingPosts = await db.select().from(existingSchema.posts).limit(5);
  if (existingPosts.length === 0 && athleteProfiles.length > 0) {
    const postsToInsert = seedPostsData.map((p, i) => ({
      athleteId: athleteProfiles[i % athleteProfiles.length].id,
      contentType: p.contentType as 'text' | 'photo' | 'video',
      mediaUrl: p.mediaUrl,
      caption: p.caption,
      requiredTier: p.requiredTier as 'free' | 'bronze' | 'silver' | 'gold',
    }));
    
    await db.insert(existingSchema.posts).values(postsToInsert);
    console.log('Seeded posts:', postsToInsert.length);
  }

  // Seed live sessions
  const existingSessions = await db.select().from(existingSchema.liveSessions).limit(5);
  if (existingSessions.length === 0 && athleteProfiles.length > 0) {
    const sessions = athleteProfiles.slice(0, 5).map((athlete, i) => ({
      athleteId: athlete.id,
      title: `${athlete.displayName}'s Live Session`,
      status: i < 2 ? 'live' : 'scheduled' as const,
      viewerCount: i < 2 ? Math.floor(Math.random() * 5000) + 1000 : 0,
      peakViewers: i < 2 ? Math.floor(Math.random() * 3000) + 500 : 0,
      totalGiftsCents: i < 2 ? Math.floor(Math.random() * 10000) : 0,
      playbackUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    }));
    
    await db.insert(existingSchema.liveSessions).values(sessions);
    console.log('Seeded live sessions:', sessions.length);
  }

  console.log('Full seed complete!');
  console.log('Schools:', await db.select().from(existingSchema.schools));
  console.log('Athletes:', await db.select().from(existingSchema.athleteProfiles));
}

seedFull()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
