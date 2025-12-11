
1. Skills we’re trying to develop
Beyond “knowing about the King / solar power / dreams”, the session should be explicitly training:
A. Explanatory + conceptual skills
•	Building mental models, not fact lists.
o	Can they explain how something works (even roughly)?
o	Can they connect a new idea to something they already know?
•	Conversation behaviours:
o	“Okay, imagine you’re explaining this to a younger sibling – how would you describe what absolute monarchy is?”
o	“What’s a good analogy for what a solar cell does?”
B. Argumentation & reasoning
•	Making and evaluating arguments:
o	Giving reasons, not just opinions.
o	Seeing pros/cons, trade-offs, counterarguments.
•	Behaviours:
o	“What would be the best argument for X? And the best argument against it?”
o	“If someone disagreed with you, what might they say?”
C. Hypothetical & counterfactual thinking
•	Getting them to play with “what if…?”:
o	“If you were a merchant in 1200, how would the King’s power affect you?”
o	“If solar panels suddenly doubled in efficiency, what would change first in the world?”
•	This trains abstract reasoning and transfer (using a concept outside its original context).
D. Epistemic skills (how they hold beliefs)
•	Epistemic humility & calibration:
o	“How confident are you in that answer, on a scale from ‘wild guess’ to ‘I’d bet £100’?”
o	“What would change your mind?”
•	Source sensitivity:
o	“Is that something you’ve seen in a video, learnt in school, or something you’re inferring now?”
E. Metacognition & self-explanation
•	Not just “what do you think?” but “how did you get there?”
o	“Talk me through how you reached that conclusion.”
o	“If you got stuck on this, where exactly did the difficulty appear?”
•	This builds awareness of their own cognitive process.
F. Summarisation & synthesis
•	Compression:
o	“Can you summarise the last 10 minutes in 3 sentences?”
o	“What’s the most important thing you’ve learned so far?”
•	Synthesis:
o	“We’ve talked about the King, Parliament, and the people – how would you describe the relationship between them in one picture or metaphor?”
G. Question-asking
You absolutely want to train:
•	Asking better questions.
•	Turning vague curiosity into sharper, more precise queries.
•	Behaviours:
o	“If you could ask a historian one question about this period, what would it be?”
o	“Can you sharpen that question so it’s more specific or testable?”
H. Transfer & application
•	Applying ideas to:
o	their own life
o	other subjects
o	real-world decisions
•	Behaviours:
o	“Does this remind you of anything in modern politics / tech / your school?”
o	“Is there anywhere in your life where this pattern shows up?”
I. Affective / identity-level stuff
•	Enjoying thinking. Feeling proud of “I am someone who thinks hard.”
•	Resilience to difficulty. “This is tricky, but that’s good” framing instead of “I’m dumb”.
The product should see each session as training a vector of these skills, not just “topic understanding”.
________________________________________
2. What should be happening under the hood?
Inside that seemingly natural chat, the system should be quietly building and updating a model of:
A. Knowledge & concept graph
Per topic:
•	What core concepts have been mentioned?
•	For each, rough mastery: unknown → fragile → usable → robust
•	Misconceptions flagged:
o	“Thinks ‘constitutional monarchy’ = King has no power at all.”
B. Cognitive style profile
From their answers:
•	Are they:
o	more intuitive or more step-by-step?
o	verbose or terse?
o	cautious or overconfident?
o	story-driven or structure-driven?
•	This influences:
o	how you pose next questions
o	how much scaffolding you give
o	whether you nudge them toward alternative styles (“let’s try a more step-by-step approach this time”).
C. Engagement + affect
Signals like:
•	response latency
•	length of responses
•	hedging (“I dunno”, “this is boring”, “I’m confused”)
•	excitement (“wait, that’s cool”, “ohhh I didn’t know that”)
System uses this to:
•	change pace
•	switch mode (more questions, less exposition, or vice versa)
•	decide when to wrap vs push deeper.
D. Interest graph
From the “three topics” and their reactions:
•	Tags like: modern history, institutions, morality, physics, human mind, etc.
•	Likes:
o	“is animated when discussing human motivations”
o	“keeps returning to ‘fairness’ questions”
•	This is used to:
o	propose future sessions
o	personalise analogies
o	weave recurring themes (e.g. “You seem to care a lot about fairness – want to explore that in a different context?”).
E. Open loops & future hooks
Any time they:
•	express curiosity (“I’d love to know more about X”)
•	express uncertainty (“I’m not convinced about Y”)
•	start but don’t finish an argument
→ the system should log that as an “open loop” to revisit in future sessions.
F. Micro-assessment without feeling like a test
The tutorial should constantly be:
•	testing understanding via:
o	rephrases (“explain that back to me”)
o	small “what would happen if…?” probes
o	quick “which is more likely and why?” questions
•	but never as a visible “quiz” unless explicitly in quiz mode.
________________________________________
3. What does an ideal tutorial conversation look like?
What you’ve written covers the opening well. Here’s a slightly more structured skeleton with “extra things” layered in:
Phase 0 – Warm entry & calibration (2–4 mins)
You already have:
•	no surveys
•	3 topic options
•	ask what they already know
Add:
•	Confidence check: “Rough guess is totally fine – are you feeling more ‘I know bits’ or ‘I’m basically starting from zero’?”
•	Process framing: “My job isn’t to lecture you – it’s to help you think this through. You can interrupt, argue, change your mind – that’s ideal.”
Phase 1 – Open diagnostic question (3–5 mins)
You already have:
•	open “what do you know about X?” question
Add:
•	Reasoning follow-up, regardless of knowledge level:
o	“Why do you think that?”
o	“Where do you think you picked that up from?”
•	Use their answer to:
o	identify misconceptions
o	gauge abstractness level they’re comfortable with.
Phase 2 – Scaffolded model-building (10–15 mins)
Here you gradually build a conceptual model, but interleave:
1.	Small chunks of exposition (“Here’s one way to think about it…”)
2.	Feynman-style checks:
o	“Can you explain that in your own words?”
o	“If you were drawing this as a diagram, what would be in the boxes and arrows?”
3.	Hypothetical probes:
o	“Imagine you’re [role]. How does this situation look to you?”
4.	Contrasts + boundaries:
o	“What’s the difference between X and Y?”
o	“Can you think of a case that almost fits, but doesn’t?”
Phase 3 – Deepening & challenge (5–10 mins)
Here’s where it becomes tutorial-like:
•	Pose a small, chewy problem:
o	History example: “Imagine Parliament didn’t exist yet. What pressures might eventually force the King to share power?”
o	Science example: “If we suddenly doubled solar efficiency, what unintended consequences might that have?”
•	Let them struggle a bit. That’s the learning.
•	Then:
o	probe their reasoning
o	offer counterarguments
o	introduce 1–2 key “expert” insights.
Phase 4 – Transfer & personal connection (3–5 mins)
•	Link the content to:
o	a different domain
o	their own experience
o	modern issues
•	Example:
o	“Do you see any modern parallels where someone has power and others push back?”
o	“Does this remind you of anything you’ve seen in the news / online?”
This is where the topic stops being trivia and starts being a lens.
Phase 5 – Reflection, synthesis, and future hooks (3–5 mins)
This phase is underrated and crucial:
•	Synthesis prompt:
o	“If you had to explain what we covered today in 3 bullet points, what would they be?”
o	“What surprised you most?”
•	Metacognitive prompt:
o	“Where did you feel most confused or stuck?”
o	“What do you feel you can now do or explain that you couldn’t 30 minutes ago?”
•	Future hook:
o	“Of the things we touched on, what would you be most curious to dig deeper into next time?”
o	Maybe: “Want me to remember that and bring it up in a future session?”
Then a short, warm close that reinforces identity:
•	“You thought really carefully about X and Y today. This is exactly how people become seriously good thinkers – small sessions like this, over and over, where you actually wrestle with ideas.”
________________________________________
4. Extra “modes” that can run inside a session
Same 30 minutes, but different micro-modes the AI can switch between dynamically:
Mode A – Socratic probe mode
•	Primary action = asking layered questions.
•	No more than 1–2 sentences of exposition at a time.
•	Great when:
o	user is engaged
o	topic is conceptual
o	they’re not overwhelmed.
Mode B – Story & simulation mode
•	For younger users / humans who respond to narrative:
o	“Let me drop you into a story…”
o	Then ask them what they’d do, what they predict, etc.
•	This is good for:
o	motivation
o	empathy
o	understanding incentives / perspectives.
Mode C – Problem-solving mode
•	Small, well-defined puzzles:
o	“You’re given this situation. What’s your first step?”
o	“Here are two options – which one would you rule out and why?”
•	Great for analytical skills & applied reasoning.
Mode D – Feynman explanation mode
•	They teach you (or a fictional novice).
•	AI listens, identifies gaps, then:
o	says “That’s great. The one part I’d push you on is…”
o	fills in just-in-time gaps.
Mode E – Reflection / journaling mode
•	Particularly for older teens / adults:
o	“How does this topic change how you see [X in your own life / in the world]?”
o	“Is there anything you feel differently about now?”
•	This reinforces identity & emotional engagement.
Mode F – Quick drill / retrieval mode (sparingly)
•	Not “quiz app mode”, but:
o	2–3 rapid “do you remember…?” checks near the end or start of the next session.
•	This is just enough to:
o	strengthen memory
o	signal to the user that their earlier thinking “matters” and persists.
________________________________________
Pulling this together
So, beyond what you’ve already written, an ideal session is:
•	Training a vector of cognitive skills (argumentation, explanation, epistemic humility, question-asking, transfer, metacognition… not just “knowledge”).
•	Maintaining a rich internal learner model (concept graph, interest graph, style profile, open loops, confidence levels).
•	Moving through a structured arc (warm + calibrate → diagnose → scaffold → challenge → transfer → reflect).
•	Fluidly switching modes (Socratic, story, problem-solving, Feynman, reflection, quick drill) in response to how the user is doing and feeling.
If you want, next step could be:
•	I turn this into a concrete “Session Spec v0.1” with headings you can literally drop into your repo (session-architecture.md), including example prompts for each phase and some light implementation hooks (e.g. what to log on each turn for the learner model).

