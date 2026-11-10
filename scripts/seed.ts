// Made-up information for the app's checks. Piezas writes this file from the
// data your description lists; edit it freely. Deterministic (fixed names,
// dates and amounts) so a check gives the same result today and next year.
//
// It runs ONLY against the TEST copy of the app (PIEZAS_TEST_API_KEY, made by
// `piezas test --setup`), never the live app, and it is safe to run again:
// each record is created only if it is not there yet. Names and emails are
// invented (example.test addresses never receive mail).
//
// `piezas test` runs it before every check:  npx tsx scripts/seed.ts
import { Piezas } from '@piezas/sdk';

const apiKey = process.env.PIEZAS_TEST_API_KEY;
if (!apiKey) {
  console.error('No test copy of the app yet (PIEZAS_TEST_API_KEY is missing). Run: piezas test --setup');
  process.exit(1);
}
const piezas = new Piezas({ apiKey, apiBaseUrl: process.env.PIEZAS_API_URL });

// upsert creates a record by title only when it does not exist yet. The record
// kinds must be defined by the app (piezas.defineEntities) before this runs.
async function upsert(accessor: string, title: string, data: Record<string, unknown>) {
  const records = (piezas as unknown as Record<string, any>)[accessor];
  if (!records?.list || !records?.create) {
    console.warn(`${accessor}: not defined yet; run the app once (it defines its records), then seed again`);
    return;
  }
  const found = await records.list({ search: title, limit: 10 });
  const items: any[] = Array.isArray(found) ? found : found?.data ?? found?.items ?? found?.records ?? [];
  if (items.some((r) => r?.title === title)) return;
  await records.create({ title, data });
}

// The test sign-in person: created and switched on directly with the test
// copy's key, so sign-up and sign-in checks never wait for an email.
async function testSignInUser() {
  const email = process.env.PIEZAS_TEST_USER_EMAIL;
  const password = process.env.PIEZAS_TEST_USER_PASSWORD;
  if (!email || !password) return;
  let user: any;
  try {
    ({ user } = await piezas.users.signUp({ email, password }));
  } catch {
    const listed: any = await piezas.users.listUsers({ email });
    user = (listed?.users ?? listed?.data ?? [])[0];
  }
  if (user?.id && user.status !== 'active') await piezas.users.updateUser(user.id, { status: 'active' });
}

export async function seed() {
  await testSignInUser();
  // Child: ID, display name, linked demo guardian, consent status
  await upsert("childs", "Avery Example", {"id":"Sample ID 1","displayName":"Avery Example","linkedDemoGuardian":"Sample linked demo guardian 1","consentStatus":"active"});
  await upsert("childs", "Jordan Sample", {"id":"Sample ID 2","displayName":"Jordan Sample","linkedDemoGuardian":"Sample linked demo guardian 2","consentStatus":"active"});
  await upsert("childs", "Riley Placeholder", {"id":"Sample ID 3","displayName":"Riley Placeholder","linkedDemoGuardian":"Sample linked demo guardian 3","consentStatus":"active"});

  // Group: ID, display label, assigned demo instructor
  await upsert("groups", "Sample ID 1", {"id":"Sample ID 1","displayLabel":"Sample display label 1","assignedDemoInstructor":"Sample assigned demo instructor 1"});
  await upsert("groups", "Sample ID 2", {"id":"Sample ID 2","displayLabel":"Sample display label 2","assignedDemoInstructor":"Sample assigned demo instructor 2"});
  await upsert("groups", "Sample ID 3", {"id":"Sample ID 3","displayLabel":"Sample display label 3","assignedDemoInstructor":"Sample assigned demo instructor 3"});

  // Attendance: lesson date, child ID, group ID, bib
  await upsert("attendances", "2030-01-10T15:00:00Z", {"lessonDate":"2030-01-10T15:00:00Z","childId":"Sample child ID 1","groupId":"Sample group ID 1","bib":"Sample bib 1"});
  await upsert("attendances", "2030-01-11T15:00:00Z", {"lessonDate":"2030-01-11T15:00:00Z","childId":"Sample child ID 2","groupId":"Sample group ID 2","bib":"Sample bib 2"});
  await upsert("attendances", "2030-01-12T15:00:00Z", {"lessonDate":"2030-01-12T15:00:00Z","childId":"Sample child ID 3","groupId":"Sample group ID 3","bib":"Sample bib 3"});

  // Guardian: ID, name, email, phone, fictional child links
  await upsert("guardians", "Avery Example", {"id":"Sample ID 1","name":"Avery Example","email":"avery.example@example.test","phone":"+1 555 0110","fictionalChildLinks":"Sample fictional child links 1"});
  await upsert("guardians", "Jordan Sample", {"id":"Sample ID 2","name":"Jordan Sample","email":"jordan.sample@example.test","phone":"+1 555 0111","fictionalChildLinks":"Sample fictional child links 2"});
  await upsert("guardians", "Riley Placeholder", {"id":"Sample ID 3","name":"Riley Placeholder","email":"riley.placeholder@example.test","phone":"+1 555 0112","fictionalChildLinks":"Sample fictional child links 3"});

  // Child profile details: birth date, emergency contact, phone, medical notes, pickup adults, guardian ID
  await upsert("childProfileDetailses", "Avery Example", {"birthDate":"2030-01-10T15:00:00Z","emergencyContact":"Avery Example","phone":"+1 555 0110","medicalNotes":"Made-up note 1 for testing.","pickupAdults":"Sample pickup adults 1","guardianId":"Sample guardian ID 1"});
  await upsert("childProfileDetailses", "Jordan Sample", {"birthDate":"2030-01-11T15:00:00Z","emergencyContact":"Jordan Sample","phone":"+1 555 0111","medicalNotes":"Made-up note 2 for testing.","pickupAdults":"Sample pickup adults 2","guardianId":"Sample guardian ID 2"});
  await upsert("childProfileDetailses", "Riley Placeholder", {"birthDate":"2030-01-12T15:00:00Z","emergencyContact":"Riley Placeholder","phone":"+1 555 0112","medicalNotes":"Made-up note 3 for testing.","pickupAdults":"Sample pickup adults 3","guardianId":"Sample guardian ID 3"});

  // Case detail additions: second emergency contact, phone, alternate name
  await upsert("caseDetailAdditionses", "Avery Example", {"secondEmergencyContact":"Avery Example","phone":"+1 555 0110","alternateName":"Avery Example"});
  await upsert("caseDetailAdditionses", "Jordan Sample", {"secondEmergencyContact":"Jordan Sample","phone":"+1 555 0111","alternateName":"Jordan Sample"});
  await upsert("caseDetailAdditionses", "Riley Placeholder", {"secondEmergencyContact":"Riley Placeholder","phone":"+1 555 0112","alternateName":"Riley Placeholder"});

  // Instructor: ID, name, email, phone, qualification
  await upsert("instructors", "Avery Example", {"id":"Sample ID 1","name":"Avery Example","email":"avery.example@example.test","phone":"+1 555 0110","qualification":"Sample qualification 1"});
  await upsert("instructors", "Jordan Sample", {"id":"Sample ID 2","name":"Jordan Sample","email":"jordan.sample@example.test","phone":"+1 555 0111","qualification":"Sample qualification 2"});
  await upsert("instructors", "Riley Placeholder", {"id":"Sample ID 3","name":"Riley Placeholder","email":"riley.placeholder@example.test","phone":"+1 555 0112","qualification":"Sample qualification 3"});

  // Preview parent alert: child references, text, creation time, never real delivery
  await upsert("previewParentAlerts", "Sample child references 1", {"childReferences":"Sample child references 1","text":"Sample text 1","creationTime":"2030-01-10T15:00:00Z","neverRealDelivery":"Sample never real delivery 1"});
  await upsert("previewParentAlerts", "Sample child references 2", {"childReferences":"Sample child references 2","text":"Sample text 2","creationTime":"2030-01-11T15:00:00Z","neverRealDelivery":"Sample never real delivery 2"});
  await upsert("previewParentAlerts", "Sample child references 3", {"childReferences":"Sample child references 3","text":"Sample text 3","creationTime":"2030-01-12T15:00:00Z","neverRealDelivery":"Sample never real delivery 3"});

  // Patrol alert: case number, stable child ID, registration, consent names, age, group, level, active status, issuing desk, place, visibility, reported clothing, its confidence, equipment, injuries, medical alert, optional lift scan, emergency contacts, escalation guidance
  await upsert("patrolAlerts", "Avery Example", {"caseNumber":2,"stableChildId":"Sample stable child ID 1","registration":"Sample registration 1","consentNames":"Avery Example","age":"Sample age 1","group":"Sample group 1","level":"Sample level 1","activeStatus":"active","issuingDesk":"Sample issuing desk 1","place":"Sample place 1","visibility":"Sample visibility 1","reportedClothing":"Sample reported clothing 1","itsConfidence":"Sample its confidence 1","equipment":"Sample equipment 1","injuries":"Sample injuries 1","medicalAlert":"Sample medical alert 1","optionalLiftScan":"Sample optional lift scan 1","emergencyContacts":"Avery Example","escalationGuidance":"Sample escalation guidance 1"});
  await upsert("patrolAlerts", "Jordan Sample", {"caseNumber":3,"stableChildId":"Sample stable child ID 2","registration":"Sample registration 2","consentNames":"Jordan Sample","age":"Sample age 2","group":"Sample group 2","level":"Sample level 2","activeStatus":"active","issuingDesk":"Sample issuing desk 2","place":"Sample place 2","visibility":"Sample visibility 2","reportedClothing":"Sample reported clothing 2","itsConfidence":"Sample its confidence 2","equipment":"Sample equipment 2","injuries":"Sample injuries 2","medicalAlert":"Sample medical alert 2","optionalLiftScan":"Sample optional lift scan 2","emergencyContacts":"Jordan Sample","escalationGuidance":"Sample escalation guidance 2"});
  await upsert("patrolAlerts", "Riley Placeholder", {"caseNumber":4,"stableChildId":"Sample stable child ID 3","registration":"Sample registration 3","consentNames":"Riley Placeholder","age":"Sample age 3","group":"Sample group 3","level":"Sample level 3","activeStatus":"active","issuingDesk":"Sample issuing desk 3","place":"Sample place 3","visibility":"Sample visibility 3","reportedClothing":"Sample reported clothing 3","itsConfidence":"Sample its confidence 3","equipment":"Sample equipment 3","injuries":"Sample injuries 3","medicalAlert":"Sample medical alert 3","optionalLiftScan":"Sample optional lift scan 3","emergencyContacts":"Riley Placeholder","escalationGuidance":"Sample escalation guidance 3"});

  // Lesson group details: ID, label, level, meeting place
  await upsert("lessonGroupDetailses", "Sample ID 1", {"id":"Sample ID 1","label":"Sample label 1","level":"Sample level 1","meetingPlace":"Sample meeting place 1"});
  await upsert("lessonGroupDetailses", "Sample ID 2", {"id":"Sample ID 2","label":"Sample label 2","level":"Sample level 2","meetingPlace":"Sample meeting place 2"});
  await upsert("lessonGroupDetailses", "Sample ID 3", {"id":"Sample ID 3","label":"Sample label 3","level":"Sample level 3","meetingPlace":"Sample meeting place 3"});
}

seed().then(
  () => console.log('test information ready'),
  (error) => {
    console.error(error?.message ?? error);
    process.exit(1);
  },
);
