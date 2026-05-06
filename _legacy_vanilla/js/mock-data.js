/**
 * Schollective Mock Data
 */

const MOCK_PROFESSORS = [
    {
        id: 1,
        name: "Dr. Rachel Kim",
        avatar: "RK",
        field: "Computational Biology",
        institution: "MIT",
        availability: "Available now",
        tags: ["Research", "Thesis", "Bio-Computing"],
        bio: "Specializing in genomic sequencing algorithms and molecular modeling.",
        color: "amber"
    },
    {
        id: 2,
        name: "Prof. David Weaver",
        avatar: "DW",
        field: "Economics",
        institution: "Stanford University",
        availability: "Available next week",
        tags: ["Microeconomics", "Game Theory"],
        bio: "Research focus on behavioral economics and market design.",
        color: "sage"
    },
    {
        id: 3,
        name: "Dr. Sarah Jenkins",
        avatar: "SJ",
        field: "Physics",
        institution: "Caltech",
        availability: "Busy",
        tags: ["Quantum", "Particles"],
        bio: "Investigating dark matter interactions and high-energy physics.",
        color: "blue"
    },
    {
        id: 4,
        name: "Prof. Michael Chen",
        avatar: "MC",
        field: "Computer Science",
        institution: "Carnegie Mellon",
        availability: "Available now",
        tags: ["AI", "Robotics", "CV"],
        bio: "Deep learning expert with a focus on computer vision for autonomous systems.",
        color: "amber"
    }
];

const MOCK_THREADS = [
    {
        id: 101,
        student: "Alex T.",
        role: "Undergrad",
        professor: "Dr. Sarah Jenkins",
        topic: "Guidance on quantum error correction for senior thesis",
        status: "new",
        time: "2h ago"
    },
    {
        id: 102,
        student: "Priya M.",
        role: "Graduate",
        professor: "Dr. Rachel Kim",
        topic: "Research methodology for cross-cultural NLP dataset curation",
        status: "pending",
        time: "Yesterday"
    }
];
