To Do List for Tutor Product
PHASE 0 — Project & Infra Setup
•	Create repo & basic Next app
o	In Cursor: npx create-next-app@latest alaris --ts --eslint --app
o	Clean out boilerplate pages/components you don’t need.
o	Install Tailwind CSS (optional but recommended) or set up your minimal CSS approach.
•	Set up environment variables
o	OPENAI_API_KEY
o	NEXT_PUBLIC_SUPABASE_URL
o	SUPABASE_SERVICE_ROLE_KEY (server only)
o	Any Vercel-specific vars you’ll need.
•	Add Supabase
o	npm install @supabase/supabase-js
o	Create a lib/supabaseClient.ts for client-side calls.
o	Create a lib/supabaseAdmin.ts for server-side (service role) usage.
•	Create basic file structure
o	/src/app/(marketing)/page.tsx – landing page
o	/src/app/session/page.tsx – main session UI
o	/src/app/account/page.tsx – simple account/profile page
o	/src/app/api/session/route.ts – session creation API
o	/src/app/api/memory/route.ts – memory update API (later)
o	/src/lib/openai/realtime.ts – helper for Realtime sessions
o	/src/lib/memory/ – memory utilities + prompts
________________________________________
PHASE 1 — Auth & User Model
•	Supabase auth
o	Enable email or Google sign-in in Supabase dashboard.
o	In Next.js, create a simple auth context or hook (or just use Supabase client directly for now).
o	Add a “Sign in / Sign out” button in your navbar or header.
•	DB tables (in Supabase)
o	users
	id (UUID, PK)
	auth_id (Supabase auth id)
	created_at
	age_bracket (nullable string, e.g. "13-15", "16-18", etc.)
	country (derived from auth or user input later)
o	sessions
	id (UUID)
	user_id
	started_at
	ended_at
	topic_chosen (string)
	duration_seconds (int)
	engagement_score (float or int, nullable)
	summary (text, nullable)
o	memories
	user_id (PK, FK)
	profile_json (jsonb)
	updated_at
•	Link auth user → users row
o	On first login, create a users entry if it doesn’t exist.
o	Helper function: ensureUserRecord(authUser).
________________________________________
PHASE 2 — Realtime Voice Plumbing
Goal: You can talk to GPT via browser voice, no “Alaris logic” yet.
•	OpenAI Realtime helper
o	In src/lib/openai/realtime.ts:
	Function createRealtimeSession(userId: string) that:
	calls OpenAI API to create a Realtime session
	returns connection info (URL, token, etc.)
•	API route: /api/session
o	POST handler that:
	Authenticates user (via Supabase or cookies)
	Reads optional topic or metadata from body
	Calls createRealtimeSession
	Returns connection params (WebRTC or WebSocket URL + token) to frontend
•	Frontend WebRTC/WebSocket client
o	On /session/page.tsx:
	Request mic permission.
	Connect to Realtime endpoint via WebRTC or WS.
	Pipe mic audio → Realtime stream.
	Receive assistant audio → play via <audio> or AudioContext.
	Display basic status (Connecting…, Listening…, etc.).
•	Debug UI
o	Optional: show real-time transcript text in a small panel for you.
o	Show connection errors clearly.
________________________________________
PHASE 3 — Tutorial System Prompt & Session Flow
Goal: A single session feels like an “Alaris tutorial”: topic selection → calibration → conversation → reflection.
•	Define the system prompt
o	Create src/lib/openai/prompts/tutorPrompt.ts exporting a big template string:
	Introduce the tutor persona (warm, rigorous).
	Define the session phases:
	Greeting & topic offering (3 options)
	Knowledge calibration
	Open question diagnostic
	Scaffolding & explanation
	Challenge / reasoning
	Reflection & synthesis
	Define tone rules (encouraging, not condescending, no over-apologising).
	Define how to use learner_profile if provided.
o	Use clear headings like ### Phase 1: Greeting and Topic Options inside the prompt to help the model.
•	Inject the system prompt into Realtime session
o	In createRealtimeSession, include:
	system message with tutorPrompt
	learner_profile (if exists) as an extra system/message block.
•	Topic selection UX
o	Let the model say the three topics in voice.
o	Also extract them from transcript and display as 3 clickable buttons.
o	If user clicks, send a short text event to the model:
"The user chose option 2: [topic text]".
•	End-of-session signal
o	Decide how to end:
	user clicks “End session”
	OR assistant is instructed to wrap after ~25–30 minutes.
o	On end:
	Close Realtime connection.
	Call backend to log session (create sessions row).
________________________________________
PHASE 4 — Memory System v0 (Single JSON Profile)
Goal: Each user has a persistent learner_profile JSON that evolves after each session.
•	Define LearnerProfile type
o	In src/lib/memory/types.ts:
o	export interface LearnerProfile {
o	  age_bracket?: string;
o	  country?: string;
o	  interest_tags: string[];
o	  known_topics: { name: string; level: "unknown" | "basic" | "intermediate" | "advanced" }[];
o	  skill_notes: {
o	    argumentation?: string;
o	    confidence_style?: string;
o	    explanation_style?: string;
o	  };
o	  open_loops: string[];
o	}
•	Read profile at session start
o	In /api/session:
	Fetch memories.profile_json for this user (or create a default).
	Pass it into createRealtimeSession so it’s embedded in the system context.
•	Summarise and update profile at session end
o	When a session ends, you need:
	Transcript (or summarised transcript) from Realtime.
	Previous learner_profile.
o	Create src/lib/memory/updateProfile.ts:
	Exports function that calls GPT-4 with a prompt:
	“Given the previous learner_profile and this session summary, produce an updated learner_profile JSON matching this TypeScript interface…”
	Write new JSON back to memories table.
•	API route /api/memory
o	POST or internal server util to:
	Accept session_id or summary
	Fetch existing profile
	Call updateProfile
	Save result
________________________________________
PHASE 5 — Session Logging & Basic Analytics
Goal: You can inspect what’s happening and iterate.
•	Store transcripts/summaries
o	Add summary column to sessions.
o	After each session:
	Call GPT-4 to summarise:
	topic
	main ideas covered
	user strengths/struggles
	1–2 “things to revisit later”
	Save summary into sessions.summary.
	Also feed the same into the memory update prompt.
•	Engagement score
o	Simple metric:
	derive from:
	session duration
	user talk time vs assistant talk time (approximate from transcript)
	or ask GPT-4 to label engagement from 1–5 and store in sessions.engagement_score.
•	Account page
o	In /account/page.tsx:
	List past sessions (date, topic, short summary).
	Show “What Alaris thinks you’re into” (interest_tags from profile).
	Show “Open questions for future sessions” (open_loops).
________________________________________
PHASE 6 — UX & Mobile Polish
Goal: It feels like a coherent product, not a lab demo.
•	Session UI
o	Large “Start Session” button on the main page.
o	During a session:
	show waveform / listening indicator
	show current “phase” subtly (e.g., “Exploring”, “Reflection”) if you want
	show the three topic options clearly at the start.
o	“End Session” button always visible.
•	Mobile-first layout
o	Test on your phone.
o	Ensure:
	mic permission prompts work
	text is legible
	controls are tap-friendly.
•	Error states
o	If Realtime fails to connect:
	show a clear message
	offer retry.
o	If auth fails:
	redirect to sign-in.
________________________________________
PHASE 7 — Internal Tools & Testing
•	Admin dashboard (even very basic)
o	/src/app/admin/page.tsx (protected or behind a quick flag)
o	List:
	users
	sessions
	quick links to summaries & profiles
o	Helps you debug quickly.
•	Session QA
o	Run 10–20 full sessions yourself.
o	Take notes:
	where the tutor repeats itself
	where it’s too shallow or too lecture-y
	where it fails to ask good follow-ups
o	Iterate on the system prompt and maybe add a tiny bit of orchestration:
	e.g., send explicit “Now begin reflection” messages if the model doesn’t reliably transition.
________________________________________
PHASE 8 — “Ready for Beta” Checklist
You’re ready to onboard real users when:
•	A user can:
o	sign up
o	click Start Session
o	have a 20–30 min conversation that feels structured and engaging
o	end it
o	see a short recap in their account page
o	come back later and feel some continuity.
•	You can:
o	view their sessions and summaries
o	inspect their learner_profile
o	see basic engagement patterns.
At that point, the product is real. Everything after is refinement, polish, and adding cleverness.
________________________________________

