/**
 * Curriculum content for the learning modules (Phase 4).
 *
 * Lessons are data, not code: a lesson is prose blocks, an optional embedded
 * interactive circuit written in the QuantumLab DSL, and a quiz. Adding
 * curriculum never requires touching the renderer.
 */

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  explain: string;
}

export type Block =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "math"; text: string };

export interface Lesson {
  id: string;
  trackId: string;
  title: string;
  blurb: string;
  minutes: number;
  body: Block[];
  circuit?: { caption: string; code: string };
  quiz: QuizQuestion[];
}

export interface Track {
  id: string;
  title: string;
  blurb: string;
  lessonIds: string[];
}

export const TRACKS: Track[] = [
  {
    id: "fundamentals",
    title: "Quantum fundamentals",
    blurb: "Qubits, superposition, measurement and entanglement from scratch.",
    lessonIds: ["qubits", "superposition", "measurement", "entanglement"],
  },
  {
    id: "gates",
    title: "Gates and circuits",
    blurb: "The gate set, rotations, interference and reading a circuit diagram.",
    lessonIds: ["single-gates", "rotations", "multi-gates", "interference"],
  },
  {
    id: "algorithms",
    title: "Quantum algorithms",
    blurb: "Deutsch–Jozsa, Grover, the Fourier transform, Shor and VQE in outline.",
    lessonIds: ["deutsch-jozsa", "grover", "qft", "shor-vqe"],
  },
];

export const LESSONS: Lesson[] = [
  {
    id: "qubits",
    trackId: "fundamentals",
    title: "What a qubit really is",
    blurb: "State vectors, the Bloch sphere and why |0> and |1> are only the poles.",
    minutes: 8,
    body: [
      { kind: "h", text: "From bits to qubits" },
      {
        kind: "p",
        text: "A classical bit is either 0 or 1. A qubit is described by two complex numbers — amplitudes — one for |0> and one for |1>. The only rule is that the squared magnitudes add up to 1.",
      },
      { kind: "math", text: "|psi> = a|0> + b|1>,   |a|^2 + |b|^2 = 1" },
      { kind: "h", text: "The Bloch sphere" },
      {
        kind: "p",
        text: "Because a global phase is unobservable, every single-qubit state can be drawn as a point on the surface of a sphere. |0> sits at the north pole, |1> at the south pole, and everything in between is a superposition with a particular relative phase.",
      },
      {
        kind: "list",
        items: [
          "The z axis encodes the probability split between |0> and |1>.",
          "The x-y angle encodes the relative phase between the two amplitudes.",
          "Points inside the sphere are mixed states — what a qubit looks like when it is entangled with another.",
        ],
      },
    ],
    circuit: {
      caption: "A single qubit left untouched stays at the north pole of the Bloch sphere.",
      code: "qreg q[1]\n\nmeasure q[0]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "What normalisation condition must a single-qubit state satisfy?",
        options: ["a + b = 1", "|a|^2 + |b|^2 = 1", "a = b", "|a| + |b| = 1"],
        answer: 1,
        explain: "Probabilities are squared magnitudes, and they must sum to one.",
      },
      {
        id: "q2",
        prompt: "Where on the Bloch sphere does the state |1> live?",
        options: ["North pole", "Equator", "South pole", "Centre"],
        answer: 2,
        explain: "|0> is the north pole and |1> the antipodal south pole.",
      },
    ],
  },
  {
    id: "superposition",
    trackId: "fundamentals",
    title: "Superposition with the Hadamard gate",
    blurb: "One gate turns a definite bit into a perfectly balanced quantum coin.",
    minutes: 7,
    body: [
      { kind: "h", text: "The Hadamard" },
      {
        kind: "p",
        text: "H maps |0> to an equal superposition of |0> and |1>, and |1> to the same superposition with a minus sign on |1>. That minus sign is the whole reason quantum algorithms can beat classical ones.",
      },
      { kind: "math", text: "H|0> = (|0> + |1>)/sqrt(2)      H|1> = (|0> - |1>)/sqrt(2)" },
      { kind: "h", text: "Superposition is not ignorance" },
      {
        kind: "p",
        text: "A coin hidden under your hand is 0 or 1 and you simply don't know which. A qubit in superposition is genuinely both, which you can prove by applying H twice: the two branches interfere and you get your original state back with certainty.",
      },
    ],
    circuit: {
      caption: "Run this: the histogram should be roughly 50% |0> and 50% |1>.",
      code: "qreg q[1]\n\nh q[0]\nmeasure q[0]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "What does applying H twice to |0> produce?",
        options: ["|1>", "|0>", "An equal superposition", "A random state"],
        answer: 1,
        explain: "H is its own inverse: H·H = I, so the branches interfere back to |0>.",
      },
      {
        id: "q2",
        prompt: "After a single H on |0>, the probability of measuring 1 is:",
        options: ["0", "0.25", "0.5", "1"],
        answer: 2,
        explain: "The amplitude is 1/sqrt(2), so the probability is 1/2.",
      },
    ],
  },
  {
    id: "measurement",
    trackId: "fundamentals",
    title: "Measurement and collapse",
    blurb: "Born's rule, sampling with shots, and why phase disappears when you look.",
    minutes: 7,
    body: [
      { kind: "h", text: "Born's rule" },
      {
        kind: "p",
        text: "Measuring in the computational basis returns outcome k with probability equal to the squared magnitude of amplitude k. The state then collapses onto that outcome, so a second measurement repeats the first.",
      },
      { kind: "h", text: "Shots" },
      {
        kind: "p",
        text: "A single run gives one bitstring. To see the distribution you repeat the circuit many times — 'shots'. The lab's shot count and seed make this reproducible: same seed, same histogram.",
      },
      {
        kind: "list",
        items: [
          "Measurement destroys relative phase information.",
          "More shots means less sampling noise, roughly 1/sqrt(shots).",
          "Statevector simulation lets you cheat and read amplitudes directly — real hardware cannot.",
        ],
      },
    ],
    circuit: {
      caption: "Two different phases, identical measurement statistics — phase is invisible here.",
      code: "qreg q[2]\n\nh q[0]\nh q[1]\nz q[1]\nmeasure q[0]\nmeasure q[1]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "A Z gate applied just before a computational-basis measurement changes the outcome probabilities how?",
        options: ["Flips them", "Not at all", "Halves them", "Randomises them"],
        answer: 1,
        explain: "Z only changes phase, and the basis probabilities depend on magnitudes.",
      },
      {
        id: "q2",
        prompt: "Sampling error with N shots scales roughly as:",
        options: ["1/N", "1/sqrt(N)", "N", "log N"],
        answer: 1,
        explain: "Standard Monte-Carlo scaling.",
      },
    ],
  },
  {
    id: "entanglement",
    trackId: "fundamentals",
    title: "Entanglement and Bell states",
    blurb: "Correlations no classical pair of coins can reproduce.",
    minutes: 9,
    body: [
      { kind: "h", text: "Building a Bell pair" },
      {
        kind: "p",
        text: "Put the first qubit in superposition with H, then CNOT onto the second. The result cannot be written as a product of two single-qubit states — that is the definition of entanglement.",
      },
      { kind: "math", text: "|Phi+> = (|00> + |11>)/sqrt(2)" },
      { kind: "h", text: "What you observe" },
      {
        kind: "p",
        text: "Each qubit alone looks completely random — its Bloch vector has zero length, sitting at the centre of the sphere. But the two outcomes always agree. Check both Bloch spheres in the lab after running the circuit below.",
      },
    ],
    circuit: {
      caption: "The canonical Bell pair: only 00 and 11 ever appear.",
      code: "qreg q[2]\n\nh q[0]\ncx q[0], q[1]\nmeasure q[0]\nmeasure q[1]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "In the state (|00> + |11>)/sqrt(2), what is the Bloch vector length of qubit 0 alone?",
        options: ["1", "0.5", "0", "sqrt(2)"],
        answer: 2,
        explain: "Maximal entanglement leaves each subsystem maximally mixed — a point at the centre.",
      },
      {
        id: "q2",
        prompt: "Which outcome is impossible for |Phi+>?",
        options: ["00", "11", "01", "None of them"],
        answer: 2,
        explain: "Only the perfectly correlated outcomes have non-zero amplitude.",
      },
    ],
  },

  {
    id: "single-gates",
    trackId: "gates",
    title: "The single-qubit gate set",
    blurb: "X, Y, Z, S and T — flips, phases and the road to universality.",
    minutes: 8,
    body: [
      { kind: "h", text: "Pauli gates" },
      {
        kind: "p",
        text: "X is the quantum NOT: it swaps the |0> and |1> amplitudes. Z leaves |0> alone and multiplies |1> by -1. Y does both at once, with an extra factor of i.",
      },
      { kind: "h", text: "Phase gates" },
      {
        kind: "p",
        text: "S is a quarter turn about the z axis (a 90 degree phase on |1>) and T is half of that again. Clifford gates alone are classically simulable; adding T is what makes the gate set universal.",
      },
      {
        kind: "list",
        items: [
          "X·X = Y·Y = Z·Z = identity.",
          "S = T·T, and Z = S·S.",
          "H maps the z axis to the x axis, so H·Z·H = X.",
        ],
      },
    ],
    circuit: {
      caption: "H then Z then H is exactly an X gate — verify with the Bloch sphere.",
      code: "qreg q[1]\n\nh q[0]\nz q[0]\nh q[0]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "Which identity is correct?",
        options: ["H·X·H = Y", "H·Z·H = X", "H·Z·H = Z", "X·Z = Z·X"],
        answer: 1,
        explain: "H exchanges the x and z axes of the Bloch sphere.",
      },
      {
        id: "q2",
        prompt: "Which gate makes a Clifford-only set universal?",
        options: ["S", "T", "H", "CZ"],
        answer: 1,
        explain: "Clifford + T is the standard universal set.",
      },
    ],
  },
  {
    id: "rotations",
    trackId: "gates",
    title: "Continuous rotations",
    blurb: "RX, RY and RZ, and how any single-qubit gate decomposes into three of them.",
    minutes: 7,
    body: [
      { kind: "h", text: "Angles on the sphere" },
      {
        kind: "p",
        text: "RX(theta) rotates the Bloch vector by theta radians about the x axis, and likewise for y and z. Note the half-angle: RX(pi) is X up to a global phase, and RY(pi/2) takes |0> to the +x equator, the same place H sends it.",
      },
      { kind: "math", text: "RY(theta)|0> = cos(theta/2)|0> + sin(theta/2)|1>" },
      {
        kind: "p",
        text: "This half-angle is why a variational circuit tunes probabilities smoothly: sweep the parameter slider in the lab and watch the histogram move continuously.",
      },
    ],
    circuit: {
      caption: "Select the RY gate in the lab and drag the angle slider to see probabilities move.",
      code: "qreg q[1]\n\nry(pi/3) q[0]\nmeasure q[0]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "What angle theta makes RY(theta)|0> an equal superposition?",
        options: ["pi/4", "pi/2", "pi", "2*pi"],
        answer: 1,
        explain: "cos(pi/4) = sin(pi/4) = 1/sqrt(2).",
      },
      {
        id: "q2",
        prompt: "RZ acting on |0> changes measurement probabilities how?",
        options: ["Not at all", "Inverts them", "Depends on the angle", "Makes them equal"],
        answer: 0,
        explain: "|0> is an eigenstate of RZ, so only an unobservable phase changes.",
      },
    ],
  },
  {
    id: "multi-gates",
    trackId: "gates",
    title: "Multi-qubit gates",
    blurb: "CNOT, CZ, SWAP and Toffoli — how qubits talk to each other.",
    minutes: 8,
    body: [
      { kind: "h", text: "Controlled operations" },
      {
        kind: "p",
        text: "A controlled gate applies its target operation only on the branches where the control is |1>. Because branches exist simultaneously, this creates correlation rather than an if-statement.",
      },
      {
        kind: "list",
        items: [
          "CNOT (cx): flips the target when the control is 1.",
          "CZ: adds a minus sign only to the |11> branch — symmetric in its two qubits.",
          "SWAP: exchanges two qubits, equal to three CNOTs.",
          "Toffoli (ccx): flips the target only when both controls are 1 — classical universality inside a quantum circuit.",
        ],
      },
      {
        kind: "p",
        text: "CNOT plus arbitrary single-qubit rotations is a universal gate set, which is why hardware vendors focus so hard on two-qubit gate fidelity.",
      },
    ],
    circuit: {
      caption: "A Toffoli acting on |11> flips the third qubit to 1.",
      code: "qreg q[3]\n\nx q[0]\nx q[1]\nccx q[0], q[1], q[2]\nmeasure q[0]\nmeasure q[1]\nmeasure q[2]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "How many CNOTs make a SWAP?",
        options: ["1", "2", "3", "4"],
        answer: 2,
        explain: "Three alternating CNOTs exchange the two qubits.",
      },
      {
        id: "q2",
        prompt: "CZ differs from CNOT by which conjugation on the target?",
        options: ["X on both sides", "H on both sides", "Z before only", "Nothing"],
        answer: 1,
        explain: "CNOT = (I ⊗ H) CZ (I ⊗ H).",
      },
    ],
  },
  {
    id: "interference",
    trackId: "gates",
    title: "Interference: the actual resource",
    blurb: "Why algorithms cancel wrong answers instead of searching for right ones.",
    minutes: 9,
    body: [
      { kind: "h", text: "Amplitudes can cancel" },
      {
        kind: "p",
        text: "Probabilities only add. Amplitudes add and subtract. Every quantum speedup is an arrangement where the paths leading to wrong answers cancel and the paths leading to right answers reinforce.",
      },
      { kind: "h", text: "The one-qubit prototype" },
      {
        kind: "p",
        text: "H, then a phase, then H again. With no phase you get |0> with certainty. With a Z in the middle you get |1> with certainty. Same gates, opposite results — purely from the sign.",
      },
    ],
    circuit: {
      caption: "H · Z · H sends |0> deterministically to |1>. Remove the z line and it returns to |0>.",
      code: "qreg q[1]\n\nh q[0]\nz q[0]\nh q[0]\nmeasure q[0]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "Interference is possible because amplitudes are:",
        options: ["Positive numbers", "Complex numbers", "Integers", "Probabilities"],
        answer: 1,
        explain: "Complex amplitudes can cancel; probabilities never can.",
      },
      {
        id: "q2",
        prompt: "H · H on |0> gives |0> because the |1> paths:",
        options: ["Never existed", "Cancel", "Reinforce", "Are measured away"],
        answer: 1,
        explain: "The two |1> paths carry opposite signs.",
      },
    ],
  },

  {
    id: "deutsch-jozsa",
    trackId: "algorithms",
    title: "Deutsch–Jozsa",
    blurb: "One query where classical computers may need exponentially many.",
    minutes: 10,
    body: [
      { kind: "h", text: "The problem" },
      {
        kind: "p",
        text: "You are promised a black-box function on n bits is either constant or balanced. Classically you may need 2^(n-1)+1 queries in the worst case. Quantumly, one query suffices.",
      },
      { kind: "h", text: "The recipe" },
      {
        kind: "list",
        items: [
          "Hadamard every input qubit to query all inputs at once.",
          "Apply the oracle, which writes the answer into the phase.",
          "Hadamard again — interference concentrates everything on the all-zeros string if the function is constant.",
        ],
      },
      {
        kind: "p",
        text: "The circuit below implements a balanced oracle on two qubits, so the measurement never returns 00.",
      },
    ],
    circuit: {
      caption: "Balanced oracle: measuring the input register never yields 00.",
      code: "qreg q[3]\n\nx q[2]\nh q[0]\nh q[1]\nh q[2]\ncx q[0], q[2]\ncx q[1], q[2]\nh q[0]\nh q[1]\nmeasure q[0]\nmeasure q[1]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "How many oracle queries does Deutsch–Jozsa need?",
        options: ["1", "n", "2^n", "log n"],
        answer: 0,
        explain: "A single query, thanks to phase kickback plus interference.",
      },
      {
        id: "q2",
        prompt: "Measuring all zeros at the end means the function is:",
        options: ["Balanced", "Constant", "Undefined", "Random"],
        answer: 1,
        explain: "Constant functions interfere constructively onto the all-zero string.",
      },
    ],
  },
  {
    id: "grover",
    trackId: "algorithms",
    title: "Grover search",
    blurb: "Quadratic speedup by rotating amplitude towards the marked item.",
    minutes: 11,
    body: [
      { kind: "h", text: "Two reflections" },
      {
        kind: "p",
        text: "Grover alternates an oracle that flips the sign of the marked state with a diffusion operator that reflects about the average amplitude. Each pair of reflections rotates the state a little closer to the answer.",
      },
      { kind: "math", text: "iterations ≈ (pi/4)·sqrt(N/M)" },
      {
        kind: "p",
        text: "For two qubits and one marked item a single iteration is exact: the circuit below finds |11> with probability 1. Running more iterations than optimal actually rotates you back past the target.",
      },
    ],
    circuit: {
      caption: "Two-qubit Grover marking |11>: one iteration gives a certain answer.",
      code: "qreg q[2]\n\nh q[0]\nh q[1]\ncz q[0], q[1]\nh q[0]\nh q[1]\nx q[0]\nx q[1]\ncz q[0], q[1]\nx q[0]\nx q[1]\nh q[0]\nh q[1]\nmeasure q[0]\nmeasure q[1]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "Grover's speedup over brute force is:",
        options: ["Exponential", "Quadratic", "Linear", "None"],
        answer: 1,
        explain: "sqrt(N) queries instead of N.",
      },
      {
        id: "q2",
        prompt: "What happens if you run far too many Grover iterations?",
        options: [
          "The answer stays correct",
          "Success probability oscillates back down",
          "The circuit errors",
          "The state becomes classical",
        ],
        answer: 1,
        explain: "It is a rotation, so overshooting reduces the overlap again.",
      },
    ],
  },
  {
    id: "qft",
    trackId: "algorithms",
    title: "The quantum Fourier transform",
    blurb: "Phase estimation's engine, in O(n^2) gates instead of N log N.",
    minutes: 10,
    body: [
      { kind: "h", text: "What it does" },
      {
        kind: "p",
        text: "The QFT maps a computational basis state to an equally weighted superposition whose phases wind at a rate set by that state. Periodicity in the amplitudes becomes a sharp peak you can measure.",
      },
      {
        kind: "list",
        items: [
          "Structure: Hadamard, then controlled phase rotations, repeated down the register, then reverse the qubit order.",
          "On n qubits it takes O(n^2) gates versus N log N classically — but you cannot read out all amplitudes.",
          "Phase estimation, order finding and Shor's algorithm are all built on top of it.",
        ],
      },
      {
        kind: "p",
        text: "On one qubit the QFT is just a Hadamard. On two qubits it is H, a controlled-S, another H and a SWAP.",
      },
    ],
    circuit: {
      caption: "Two-qubit QFT applied to |01>.",
      code: "qreg q[2]\n\nx q[0]\nh q[1]\ncz q[0], q[1]\nh q[0]\nswap q[0], q[1]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "The QFT on a single qubit is equivalent to:",
        options: ["X", "H", "T", "SWAP"],
        answer: 1,
        explain: "The 2-point Fourier transform is exactly the Hadamard matrix.",
      },
      {
        id: "q2",
        prompt: "Why doesn't the QFT give an exponential speedup for signal processing?",
        options: [
          "It is too slow",
          "You cannot read out all amplitudes",
          "It needs too many qubits",
          "It is not unitary",
        ],
        answer: 1,
        explain: "Measurement returns one sample, not the full spectrum.",
      },
    ],
  },
  {
    id: "shor-vqe",
    trackId: "algorithms",
    title: "Shor and VQE in outline",
    blurb: "Where the famous algorithms sit, and what runs on today's noisy devices.",
    minutes: 9,
    body: [
      { kind: "h", text: "Shor's algorithm" },
      {
        kind: "p",
        text: "Factoring reduces to finding the period of a modular exponentiation. Quantum phase estimation plus the QFT extracts that period efficiently; the rest is classical continued fractions. It needs deep circuits and error correction, so it is a fault-tolerant-era algorithm.",
      },
      { kind: "h", text: "Variational algorithms" },
      {
        kind: "p",
        text: "VQE takes the opposite approach: a shallow parameterised circuit prepares a trial state, hardware measures its energy, and a classical optimiser adjusts the angles. Shallow depth makes it survivable on noisy hardware, which is why chemistry and optimisation demos use it today.",
      },
      {
        kind: "list",
        items: [
          "Shor: exponential speedup, fault-tolerant hardware required.",
          "Grover: quadratic speedup, still needs deep circuits for real problems.",
          "VQE/QAOA: heuristic, near-term, no proven speedup but runnable now.",
        ],
      },
    ],
    circuit: {
      caption: "A minimal two-parameter VQE ansatz — tune the angles and watch the state move.",
      code: "qreg q[2]\n\nry(pi/4) q[0]\nry(pi/3) q[1]\ncx q[0], q[1]\nry(pi/8) q[1]\n",
    },
    quiz: [
      {
        id: "q1",
        prompt: "Shor's algorithm solves factoring by finding:",
        options: ["A minimum", "A period", "A marked item", "A ground state"],
        answer: 1,
        explain: "Order finding via phase estimation is the quantum core.",
      },
      {
        id: "q2",
        prompt: "Why is VQE suited to today's hardware?",
        options: [
          "It needs no measurement",
          "Its circuits are shallow",
          "It is exact",
          "It needs no classical computer",
        ],
        answer: 1,
        explain: "Shallow circuits accumulate less noise; a classical optimiser does the heavy lifting.",
      },
    ],
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function trackOf(lesson: Lesson): Track | undefined {
  return TRACKS.find((t) => t.id === lesson.trackId);
}

export function lessonsOfTrack(trackId: string): Lesson[] {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return [];
  return track.lessonIds
    .map((id) => getLesson(id))
    .filter((l): l is Lesson => Boolean(l));
}

/** Ordered flat list used for next/previous navigation. */
export const LESSON_ORDER: string[] = TRACKS.flatMap((t) => t.lessonIds);

export function neighbours(id: string): { prev: Lesson | undefined; next: Lesson | undefined } {
  const i = LESSON_ORDER.indexOf(id);
  const prevId = i > 0 ? LESSON_ORDER[i - 1] : undefined;
  const nextId = i >= 0 && i < LESSON_ORDER.length - 1 ? LESSON_ORDER[i + 1] : undefined;
  return {
    prev: prevId ? getLesson(prevId) : undefined,
    next: nextId ? getLesson(nextId) : undefined,
  };
}
