const db = require('./database');

const bodies = [
  { name: "Placements' Committee", category: "Committee", description: "Runs all summer and final placement activity — student outreach, recruiter coordination, and process management.", poc_name: "R. Sharma", poc_contact: "placements@iimamritsar.ac.in",
    updates: [{ title: "CV review deadline for Summer Placement Round 2 closes in 2 days.", tag: "deadline" }],
    resources: [{ title: "Placement Policy Doc", url: "#" }, { title: "Resume Template", url: "#" }] },

  { name: "Cultural Committee", category: "Committee", description: "Runs campus cultural life — fests, open mics, and performance nights.", poc_name: "K. Verma", poc_contact: "cultural@iimamritsar.ac.in",
    updates: [{ title: "Open mic + battle of bands this Friday, 7 PM, Amphitheatre.", tag: "event" }],
    resources: [{ title: "Event Calendar", url: "#" }] },

  { name: "Sports Committee", category: "Committee", description: "Organizes inter-batch tournaments and manages sports infrastructure bookings.", poc_name: "A. Singh", poc_contact: "sports@iimamritsar.ac.in",
    updates: [{ title: "Inter-batch cricket league fixtures out. Volunteers needed for scoring.", tag: "event" }, { title: "Scorer volunteer sign-ups open.", tag: "recruiting" }],
    resources: [{ title: "Fixtures PDF", url: "#" }] },

  { name: "Alumni Committee", category: "Committee", description: "Maintains alumni relations, the Halcyon newsletter, and Chapter Meet coordination.", poc_name: "P. Nair", poc_contact: "alumni@iimamritsar.ac.in",
    updates: [{ title: "Halcyon Q3 newsletter submissions open next month.", tag: "none" }],
    resources: [{ title: "Halcyon Archive", url: "#" }] },

  { name: "IT Committee", category: "Committee", description: "Manages campus IT infrastructure, intranet, and student-facing tech tools.", poc_name: "Monjyoti", poc_contact: "it.committee@iimamritsar.ac.in",
    updates: [{ title: "Junior Coordinator Round 5 task briefs released to shortlisted groups.", tag: "recruiting" }],
    resources: [{ title: "IT Asset Policy", url: "#" }] },

  { name: "Students' Council", category: "Committee", description: "Represents the student body to institute administration on policy matters.", poc_name: "D. Kaur", poc_contact: "council@iimamritsar.ac.in",
    updates: [{ title: "Monthly grievance redressal meeting minutes published.", tag: "none" }],
    resources: [{ title: "Meeting Minutes", url: "#" }] },

  { name: "ABC — Analytics & Business Computing", category: "Club", description: "Runs data analytics workshops, case competitions, and industry sessions.", poc_name: "S. Rao", poc_contact: "abc.club@iimamritsar.ac.in",
    updates: [{ title: "Induction case submissions close in 30 hours.", tag: "deadline" }, { title: "New member induction round open.", tag: "recruiting" }],
    resources: [{ title: "Kaggle Dataset Pack", url: "#" }, { title: "Past Case Decks", url: "#" }] },

  { name: "FEC — Finance & Economics Club", category: "Club", description: "Builds finance and economics acumen through sessions, simulations, and market updates.", poc_name: "N. Iyer", poc_contact: "fec@iimamritsar.ac.in",
    updates: [{ title: "Equity valuation workshop this Saturday.", tag: "event" }],
    resources: [{ title: "Valuation Primer", url: "#" }] },

  { name: "Vaani — Literary & Public Speaking", category: "Club", description: "Hosts debates, poetry slams, and public speaking circles.", poc_name: "M. Joshi", poc_contact: "vaani@iimamritsar.ac.in",
    updates: [{ title: "Poetry slam auditions open for new members.", tag: "recruiting" }],
    resources: [{ title: "Speaker Guidelines", url: "#" }] },

  { name: "Sankalp — Social Service", category: "Club", description: "Coordinates social service drives and NGO partnerships.", poc_name: "T. Bansal", poc_contact: "sankalp@iimamritsar.ac.in",
    updates: [{ title: "NGO visit this weekend — sign-ups on the sheet.", tag: "event" }],
    resources: [{ title: "Volunteer Form", url: "#" }] },

  { name: "50mm — Photography Club", category: "Club", description: "Documents campus life and runs photo-walks and exhibitions.", poc_name: "R. Dutta", poc_contact: "50mm@iimamritsar.ac.in",
    updates: [{ title: "Convocation photo essay submissions now live on the page.", tag: "none" }],
    resources: [{ title: "Photo Essay Archive", url: "#" }] },

  { name: "Stratagem — Strategy & Consulting", category: "Club", description: "Preps students for case competitions and consulting interviews.", poc_name: "V. Malhotra", poc_contact: "stratagem@iimamritsar.ac.in",
    updates: [{ title: "Case cracking bootcamp registration closes tomorrow.", tag: "deadline" }, { title: "Bootcamp mentor sign-ups open.", tag: "recruiting" }],
    resources: [{ title: "Bootcamp Slides", url: "#" }] },

  { name: "Anvesh — Research Cell", category: "Cell", description: "Faculty-mentored research collaborations across domains.", poc_name: "Dr. Bedi (Faculty)", poc_contact: "anvesh@iimamritsar.ac.in",
    updates: [{ title: "New faculty-mentored paper call for 2nd years.", tag: "none" }],
    resources: [{ title: "Research Paper Repository", url: "#" }, { title: "Call for Papers", url: "#" }] },

  { name: "Anukriti — Sustainability & Ethics", category: "Cell", description: "Drives campus sustainability initiatives and ethics awareness.", poc_name: "H. Grewal", poc_contact: "anukriti@iimamritsar.ac.in",
    updates: [{ title: "Campus clean-up drive this Sunday morning.", tag: "event" }],
    resources: [{ title: "Sustainability Report", url: "#" }] },

  { name: "Laughter Cell", category: "Cell", description: "Runs light, informal events to keep campus stress levels in check.", poc_name: "J. Oberoi", poc_contact: "laughter.cell@iimamritsar.ac.in",
    updates: [{ title: "Stand-up open night, Thursday, Student Activity Room.", tag: "event" }],
    resources: [] },
];

const insertBody = db.prepare(`INSERT INTO bodies (name, category, description, poc_name, poc_contact) VALUES (@name, @category, @description, @poc_name, @poc_contact)`);
const insertUpdate = db.prepare(`INSERT INTO updates (body_id, title, tag) VALUES (?, ?, ?)`);
const insertResource = db.prepare(`INSERT INTO resources (body_id, title, url) VALUES (?, ?, ?)`);
const insertQuery = db.prepare(`INSERT INTO queries (body_id, question, answer) VALUES (?, ?, ?)`);

function clearAll(){
  db.exec('DELETE FROM queries; DELETE FROM resources; DELETE FROM updates; DELETE FROM bodies;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('bodies','updates','resources','queries');");
}

function seed(){
  db.exec('BEGIN');
  try {
    clearAll();
    for (const b of bodies) {
      const info = insertBody.run({
        name: b.name,
        category: b.category,
        description: b.description,
        poc_name: b.poc_name,
        poc_contact: b.poc_contact
      });
      const bodyId = info.lastInsertRowid;
      for (const u of b.updates) insertUpdate.run(bodyId, u.title, u.tag);
      for (const r of b.resources) insertResource.run(bodyId, r.title, r.url);
    }
    // A couple of sample queries, attached to the first body, mirroring the general FAQ pattern
    const firstId = db.prepare('SELECT id FROM bodies LIMIT 1').get().id;
    insertQuery.run(firstId, "Who do I contact for reimbursement after an NGO visit?", "Reach out to the body's POC directly — reimbursement forms are linked under Resources.");
    insertQuery.run(firstId, "Can 1st years apply to more than one club during induction?", "Yes, there's no cap — just watch for overlapping deadlines.");
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

seed();
console.log(`Seeded ${bodies.length} bodies with updates and resources.`);
db.close();
