/**
 * Realistic mock data matching the exact API contract.
 * A 3-episode mystery/thriller story with planted continuity issues.
 */

export const mockEpisodes = [
  {
    id: 1,
    number: 1,
    title: "The Vanishing",
    created_at: "2025-01-15T10:00:00Z",
    raw_text: `Maya Chen stepped through the rain-slicked streets of New Harbor, her detective badge weighing heavy in her pocket. She'd been called to the old lighthouse — the same one her father had warned her never to visit. "Trust no one in this town," he'd said before disappearing three years ago.

At the lighthouse, she found Dr. Elias Vorn, the town's reclusive physician, kneeling beside a body. "Detective Chen," he said, his voice steady despite the blood on his hands. "I found him like this. Thomas Blackwell — the harbor master."

Maya studied the scene. Blackwell's journal lay open, its last entry reading: "The Consortium knows. They'll come for me next." She pocketed the journal — evidence.

"You shouldn't have come here alone," Vorn said, his dark eyes unreadable. "This town has secrets that swallow people whole."

Maya's partner, Detective Rio Santos, arrived minutes later. Rio was brave — almost recklessly so — always first through the door, last to back down. "What do we have?" he asked, already scanning the perimeter.

"A murder that someone wants to stay buried," Maya replied. She trusted Rio implicitly. They'd been partners for five years, and he'd never given her reason to doubt him.`,
  },
  {
    id: 2,
    number: 2,
    title: "Threads of Deceit",
    created_at: "2025-01-16T10:00:00Z",
    raw_text: `Maya spread Blackwell's journal across her desk. The entries painted a picture of a shadow organization — "The Consortium" — that had controlled New Harbor for decades. Blackwell had been gathering evidence against them.

Dr. Vorn appeared at the precinct, offering his help. "Thomas was my patient," he explained. "I may know things that could help your investigation." Maya noticed his hands were steady, his manner calm — traits she'd expect from a surgeon, not a small-town doctor.

Rio returned from canvassing the harbor. He'd been cowardly during the interviews — avoiding direct confrontation with the dock workers, letting witnesses walk away without pressing them. It was unlike him. When Maya questioned his approach, he snapped, "Not everyone responds to intimidation, Maya."

That evening, Maya discovered a hidden compartment in Blackwell's journal. Inside: a list of names. Consortium members. And at the top of the list — a name that made her blood run cold.

Meanwhile, Vorn met secretly with a hooded figure at the marina. "She's getting close," Vorn whispered. "The detective found the journal." The figure replied, "Then we accelerate the timeline. The Promise must be kept — the artifact surfaces at the equinox, as it has for three hundred years." In New Harbor, the dead could never truly rest — the sea always returned what was taken from it. This was the town's oldest law, known by every fisherman's child.`,
  },
  {
    id: 3,
    number: 3,
    title: "Shattered Trust",
    created_at: "2025-01-17T10:00:00Z",
    raw_text: `Maya confronted Rio about his behavior. "You've been different since the lighthouse," she said. Rio looked away. "You don't know what I saw in those files, Maya. Some truths are better left buried."

But Maya pressed on. She'd always been relentless — it was what made her a great detective. She pulled out the list of Consortium names and showed it to Rio.

Rio's face went white. His own name was on the list.

"I can explain," he said, but Maya had already drawn her weapon. "Five years, Rio. Five years of lies."

"I was protecting you," Rio insisted. "The Consortium approached me before we were partnered. They said if I kept tabs on investigations, they'd make sure your father stayed alive. He's not dead, Maya — he's in hiding. I was cowardly, yes — but only because I was trying to keep you safe."

Dr. Vorn arrived at the precinct with crucial evidence — medical records showing Blackwell had been poisoned over months, not killed suddenly. "Someone had access to him regularly," Vorn said. "Someone he trusted."

That night, Maya found a body washed up on the shore — despite the town's oldest law that the sea never returns the dead. The body was fresh, wearing a Consortium ring. The sea had broken its own ancient rule, and the fishermen gathered on the dock, murmuring that this had never happened before in three centuries of New Harbor's history.`,
  },
];

export const mockStoryMemory = {
  characters: [
    {
      id: 1,
      name: "Maya Chen",
      traits: ["relentless", "perceptive", "distrustful"],
      motivations: ["Find her father", "Solve Blackwell's murder", "Expose the Consortium"],
      first_appearance_episode: 1,
      backstory: "Detective whose father disappeared three years ago after warning her about New Harbor",
    },
    {
      id: 2,
      name: "Rio Santos",
      traits: ["brave", "cowardly", "conflicted"],
      motivations: ["Protect Maya", "Keep his Consortium secret", "Survive"],
      first_appearance_episode: 1,
      backstory: "Maya's partner of five years, secretly compromised by the Consortium",
    },
    {
      id: 3,
      name: "Dr. Elias Vorn",
      traits: ["calm", "mysterious", "methodical"],
      motivations: ["Unknown — appears helpful but has hidden agenda"],
      first_appearance_episode: 1,
      backstory: "Reclusive town physician with connections to the Consortium",
    },
    {
      id: 4,
      name: "Thomas Blackwell",
      traits: ["brave", "secretive"],
      motivations: ["Expose the Consortium"],
      first_appearance_episode: 1,
      backstory: "Harbor master who was gathering evidence against the Consortium before being murdered",
    },
  ],
  relationships: [
    {
      id: 1,
      character_a_id: 1,
      character_b_id: 2,
      character_a_name: "Maya Chen",
      character_b_name: "Rio Santos",
      type: "partners",
      description: "Detective partners for five years — trust shattered after Consortium revelation",
      established_episode: 1,
    },
    {
      id: 2,
      character_a_id: 1,
      character_b_id: 3,
      character_a_name: "Maya Chen",
      character_b_name: "Dr. Elias Vorn",
      type: "uneasy allies",
      description: "Vorn offers help but Maya suspects his motives",
      established_episode: 1,
    },
    {
      id: 3,
      character_a_id: 3,
      character_b_id: 4,
      character_a_name: "Dr. Elias Vorn",
      character_b_name: "Thomas Blackwell",
      type: "doctor-patient",
      description: "Vorn was Blackwell's physician — had regular access",
      established_episode: 2,
    },
  ],
  timeline_events: [
    { id: 1, episode_id: 1, event_description: "Maya called to lighthouse for Blackwell's murder", characters_involved: [1, 3, 4], turning_point_type: null, sequence_order: 1 },
    { id: 2, episode_id: 1, event_description: "Maya finds Blackwell's journal mentioning 'The Consortium'", characters_involved: [1, 4], turning_point_type: "REVELATION", sequence_order: 2 },
    { id: 3, episode_id: 1, event_description: "Rio arrives and surveys the scene", characters_involved: [2], turning_point_type: null, sequence_order: 3 },
    { id: 4, episode_id: 2, event_description: "Maya discovers hidden Consortium member list in journal", characters_involved: [1], turning_point_type: "REVELATION", sequence_order: 4 },
    { id: 5, episode_id: 2, event_description: "Vorn meets secretly with hooded Consortium figure", characters_involved: [3], turning_point_type: "SECRET_REVEALED", sequence_order: 5 },
    { id: 6, episode_id: 3, event_description: "Maya discovers Rio's name on the Consortium list", characters_involved: [1, 2], turning_point_type: "BETRAYAL", sequence_order: 6 },
    { id: 7, episode_id: 3, event_description: "Rio reveals Maya's father is alive and in hiding", characters_involved: [1, 2], turning_point_type: "REVELATION", sequence_order: 7 },
    { id: 8, episode_id: 3, event_description: "Body washes ashore despite the town's law that the sea never returns the dead", characters_involved: [], turning_point_type: null, sequence_order: 8 },
  ],
  world_rules: [
    { id: 1, rule: "The Consortium has controlled New Harbor for decades from the shadows", established_episode: 1, category: "political" },
    { id: 2, rule: "The sea never returns the dead — this is the town's oldest and most inviolable law, known for three centuries", established_episode: 2, category: "supernatural" },
    { id: 3, rule: "An ancient artifact surfaces at the equinox, as it has for three hundred years", established_episode: 2, category: "supernatural" },
  ],
  promises: [
    { id: 1, description: "Maya will find her father", made_episode: 1, fulfilled: false, fulfilled_episode: null },
    { id: 2, description: "The artifact will surface at the equinox", made_episode: 2, fulfilled: false, fulfilled_episode: null },
    { id: 3, description: "Vorn's true allegiance will be revealed", made_episode: 2, fulfilled: false, fulfilled_episode: null },
  ],
  secrets: [
    { id: 1, description: "Rio is a Consortium informant", holder_character_id: 2, established_episode: 1, revealed: true, revealed_episode: 3 },
    { id: 2, description: "Maya's father is alive and in hiding", holder_character_id: 2, established_episode: 1, revealed: true, revealed_episode: 3 },
    { id: 3, description: "Vorn is connected to the Consortium", holder_character_id: 3, established_episode: 2, revealed: false, revealed_episode: null },
  ],
};

export const mockIssues = [
  {
    id: "issue-001",
    episode_id: 2,
    category: "CHARACTER_CONTRADICTION",
    status: "critical",
    problem: "Rio Santos is described as 'cowardly' in Episode 2, directly contradicting his established 'brave' characterization from Episode 1 — with no turning-point event to justify this personality shift.",
    evidence: [
      {
        episode_number: 1,
        episode_title: "The Vanishing",
        excerpt: "Rio was brave — almost recklessly so — always first through the door, last to back down.",
        relevance: "Establishes Rio as definitively brave — this is presented as a core, consistent trait.",
      },
      {
        episode_number: 2,
        episode_title: "Threads of Deceit",
        excerpt: "He'd been cowardly during the interviews — avoiding direct confrontation with the dock workers, letting witnesses walk away without pressing them.",
        relevance: "Directly contradicts Episode 1's characterization without any intervening event that would explain why Rio changed.",
      },
    ],
    reasoning: "In Episode 1, Rio is explicitly described as brave and reckless. By Episode 2, he's described as cowardly — but nothing happens between these episodes to explain the shift. The Consortium connection is revealed later in Episode 3, which could retroactively explain his hesitance, but the audience experiences this as an unexplained inconsistency at the time of Episode 2.",
    impact: "Listeners will notice Rio acting out of character and may lose trust in the narrative's internal logic. This undermines the later Episode 3 reveal — if Rio already seems inconsistent, the betrayal twist feels less impactful because the audience has already stopped believing in his characterization.",
    suggested_fixes: [
      "Add a brief scene in Episode 2 where Rio receives a threatening message from the Consortium before the interviews, establishing why he's holding back.",
      "Change the Episode 2 language from 'cowardly' to 'cautious' or 'guarded' — this reads as intentional restraint rather than a personality contradiction.",
      "Add internal monologue for Rio in Episode 2 showing his conflict: he wants to push harder but can't without exposing his Consortium connection.",
    ],
    resolved: false,
    resolved_evidence: null,
  },
  {
    id: "issue-002",
    episode_id: 3,
    category: "WORLD_RULE_VIOLATION",
    status: "critical",
    problem: "A body washes ashore in Episode 3, directly violating the world rule established in Episode 2 that 'the sea never returns the dead' — a rule described as the town's oldest law, known for three centuries.",
    evidence: [
      {
        episode_number: 2,
        episode_title: "Threads of Deceit",
        excerpt: "In New Harbor, the dead could never truly rest — the sea always returned what was taken from it. This was the town's oldest law, known by every fisherman's child.",
        relevance: "Establishes an absolute supernatural/cultural rule about the sea and the dead.",
      },
      {
        episode_number: 3,
        episode_title: "Shattered Trust",
        excerpt: "That night, Maya found a body washed up on the shore — despite the town's oldest law that the sea never returns the dead.",
        relevance: "The narrative acknowledges the rule while breaking it, but provides no supernatural or plot-driven explanation for why this exception occurred.",
      },
    ],
    reasoning: "The story establishes a clear world rule in Episode 2: the sea never returns the dead. Episode 3 then has a body wash ashore with the narrator explicitly noting this contradicts the rule. While rule-breaking can be a powerful story device, the text provides no explanation — supernatural, scientific, or conspiratorial — for why this happens. The fishermen react with surprise, but the mechanism is left entirely unexplained.",
    impact: "If this is intentional foreshadowing, it needs at least a hint at the mechanism (the Consortium, the artifact, a broken seal). Without one, it reads as a plot hole rather than a mystery. Listeners in a serialized format will flag this immediately.",
    suggested_fixes: [
      "Add a line connecting the body's appearance to the approaching equinox or the artifact — 'The equinox was three days away. Perhaps the old protections were already failing.'",
      "Have Dr. Vorn react with specific knowledge — 'This shouldn't be possible. Unless someone disturbed the seabed anchors...' — hinting at a deliberate Consortium action.",
      "If this is meant to be unexplained, lean into the horror: have the body show signs that don't match drowning, suggesting it was placed there deliberately.",
    ],
    resolved: false,
    resolved_evidence: null,
  },
  {
    id: "issue-003",
    episode_id: 3,
    category: "BROKEN_PROMISE",
    status: "needs_review",
    problem: "The narrative promise that Maya will find her father, set up in Episode 1, remains unaddressed after 3 episodes. While Rio reveals the father is alive in Episode 3, there's no forward momentum toward actually finding him.",
    evidence: [
      {
        episode_number: 1,
        episode_title: "The Vanishing",
        excerpt: "'Trust no one in this town,' he'd said before disappearing three years ago.",
        relevance: "Sets up the central promise: Maya's father disappeared and she will search for him.",
      },
      {
        episode_number: 3,
        episode_title: "Shattered Trust",
        excerpt: "'He's not dead, Maya — he's in hiding. I was cowardly, yes — but only because I was trying to keep you safe.'",
        relevance: "Partially addresses the promise by confirming the father is alive, but doesn't advance toward resolution.",
      },
    ],
    reasoning: "The father's disappearance is the emotional engine of the story. After 3 episodes, we know he's alive (good — keeps the promise active) but Maya hasn't taken any concrete steps to find him. In serialized audio, audiences track these promises closely. The reveal that he's alive resets the clock somewhat, but the next episode needs to show Maya actively pursuing this thread.",
    impact: "If Episode 4 doesn't advance this thread, listeners may feel the promise is being strung along rather than developed. This is the story's emotional core — it can't be a background detail.",
    suggested_fixes: [
      "End Episode 3 with Maya demanding Rio tell her where her father is hiding — gives the audience a clear 'next episode' hook.",
      "Have Maya find a clue in Blackwell's journal that connects to her father's location — ties the A-plot and B-plot together.",
    ],
    resolved: false,
    resolved_evidence: null,
  },
];
