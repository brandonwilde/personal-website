import { colors } from './constants.js';

// Single source of truth for where everything sits on the bookshelf. Each section
// is an object with an optional `label` and either `items` (an array of book ids
// for standard books) or `ref` (a special item whose content/tuning lives in
// bookConfigs.other.<key>).
export const shelfConfigs = {
    A: {
        sections: {
            1: { ref: 'blog' },
            2: { label: 'RECENT READS', ref: 'goodreads' },
        }
    },
    B: {
        sections: {
            2: { label: 'CODING PROJECTS', items: ['audiobookmarks', 'aitools', 'gdrivesync', 'xldefgen'] },
            4: { label: 'SKILLS', items: ['skillsA', 'skillsB', 'skillsC', 'skillsD'] },
        }
    },
    C: {
        sections: {
            1: { label: 'EDUCATION', items: ['bachelors', 'masters'] },
            3: { label: 'EMPLOYMENT', items: ['translate', 'montco', 'aei', 'msu1', 'msu2', 'inventives', 'syera', 'ruck', 'castle'] },
            4: { ref: 'contact' },
        }
    }
};

export const bookConfigs = {
    // Education books
    education: {
        bachelors: {
            id: 'bachelors',
            height: 8,
            thickness: 3,
            color: colors.brown,
            content: 'B.S. Chemical Engineering & German',
            modalInfo: {
                kind: 'education',
                logoSrc: "assets/images/Wyoming_Athletics_logo.svg",
                logoAlt: "Wyoming Logo",
                degree: "Bachelor of Science in German, Chemical Engineering, Engineering Honors",
                university: "University of Wyoming: Laramie, WY",
                gpa: "3.68",
                graduationDate: "Graduated May 2018",
                projects: [
                    "Carbon capture and storage (CCS) innovative cost recovery",
                    "Anti-cancer drug delivery methods"
                ]
            }
        },
        masters: {
            id: 'masters',
            height: 8,
            color: colors.red,
            content: 'M.S. Computational Linguistics',
            modalInfo: {
                kind: 'education',
                logoSrc: "assets/images/hawk-logo-color-2.svg",
                logoAlt: "Montclair Logo",
                logoScale: 1.25,
                degree: "Master of Science in Computational Linguistics",
                university: "Montclair State University: Montclair, NJ",
                gpa: "3.97",
                graduationDate: "Graduated May 2022",
                projects: [
                    "Cross-lingual definition modeling without bilingual corpora",
                    "Farsi NLP Tools"
                ]
            }
        }
    },

    // Skills books — like the education/experience/project books, these carry
    // modalInfo (kind:'skills') and auto-size from their content. Each holds one or
    // more labeled groups rendered as bullet lists on the page.
    skills: {
        skillsA: {
            id: 'skillsA',
            color: colors.gray,
            content: 'Programming Languages',
            modalInfo: {
                kind: 'skills',
                groups: [
                    { label: 'Primary',    items: ['Python', 'TypeScript / JavaScript', 'SQL', 'Bash'] },
                    { label: 'Also used',  items: ['MATLAB', 'VBA'] }
                ]
            }
        },
        skillsB: {
            id: 'skillsB',
            color: colors.purple,
            content: 'Tools & Frameworks',
            modalInfo: {
                kind: 'skills',
                columns: 2,
                groups: [
                    { label: 'AI / ML',          items: ['LangChain', 'LangGraph', 'LangSmith', 'Hugging Face', 'PyTorch', 'scikit-learn'] },
                    { label: 'Retrieval & Data', items: ['FAISS', 'Pinecone', 'PostgreSQL', 'Redis', 'MongoDB'] },
                    { label: 'Web',              items: ['React', 'Node.js', 'Next.js'] },
                    { label: 'Infrastructure',   items: ['AWS', 'Azure', 'Docker', 'Git', 'GitHub Actions (CI/CD)'] }
                ]
            }
        },
        skillsC: {
            id: 'skillsC',
            color: colors.blue,
            content: 'زبان‌ها',
            modalInfo: {
                kind: 'skills',
                title: 'Languages',
                groups: [
                    { label: '', items: [
                        'English — Native',
                        'German — Fluent',
                        'Spanish — Working',
                        'Persian (Farsi) — Limited',
                        'Egyptian Arabic — Basic'
                    ] }
                ]
            }
        },
        skillsD: {
            id: 'skillsD',
            color: colors.yellowGreen,
            content: 'Other Skills',
            modalInfo: {
                kind: 'skills',
                groups: [
                    { label: 'Beyond code', items: [
                        'Technical lecturing',
                        'Technical writing & documentation',
                        'Prompt engineering & LLM evaluation',
                        'CAD drafting (AutoCAD)',
                        'German–English translation'
                    ] }
                ]
            }
        }
    },
    
    // Professional experience books (middle shelf)
    experience: {
        translate: {
            id: 'translate',
            color: colors.yellow,
            content: 'Freelance Translation',
            modalInfo: {
                kind: 'experience',
                company: "Self-Employed",
                position: "Freelance German-English Translator",
                startDate: "December 2016",
                endDate: "June 2018",
                accomplishments: [
                    "Provided an array of services including audio translation, transcription, and software localization, as well as translating texts in the marketing, legal, and STEM disciplines. Projects included:",
                    "Localized a CAD software interface, ensuring user-friendly and culturally appropriate language.",
                    "Translated a body of legal documents for a county victim/witness assistance program.",
                    "Transcribed and translated sensitive German audio recordings for a legal case.",
                    "Provided German rewriting services for a marketing firm.",
                    "Rendered translation and editing services for an online media group."
                ]
            }
        },
        montco: {
            id: 'montco',
            color: colors.purple,
            content: 'Montco Hunger Solutions',
            modalInfo: {
                kind: 'experience',
                company: "Montco Hunger Solutions (a subsidiary of the Share Food Program)",
                position: "Program Assistant",
                startDate: "June 2018",
                endDate: "September 2018",
                accomplishments: [
                    "Managed a county-wide distribution of supplemental food to disadvantaged populations, ensuring quality control and timely deliveries.",
                    "Tracked invoices, scheduled food distribution, and handled box truck deliveries.",
                    "Provided training and mentoring to the food cupboard and shelter staff, also monitoring adherence to procedural standards.",
                    "Administered contracts, facilitated client enrollment, managed data collection, and maintained accurate records.",
                    "Assisted the development of promotional materials to support program engagement."
                ]
            }
        },
        aei: {
            id: 'aei',
            color: colors.gray,
            content: 'AEI',
            modalInfo: {
                kind: 'experience',
                company: "AEI Consultants",
                position: "Staff Engineer",
                startDate: "September 2018",
                endDate: "May 2022",
                accomplishments: [
                    "Directed hundreds of environmental investigations and remediation projects across residential, commercial, and industrial properties, concluding each with a technical report for clientele.",
                    "Expertly crafted precise, scaled CAD figures encompassing site layouts, isoconcentration maps, as well as detailed cross-sectional illustrations of geology and contaminant distributions.",
                    "Automated the creation of conditional, format-specific contaminant reporting tables using Excel VBA."
                ]
            }
        },
        msu1: {
            id: 'msu1',
            color: colors.red,
            content: 'MSU',
            modalInfo: {
                kind: 'experience',
                company: "Montclair State University",
                position: "Graduate Research Assistant",
                startDate: "September 2021",
                endDate: "June 2022",
                accomplishments: [
                    "Independently pioneered a research initiative in zero-shot cross-lingual definition generation utilizing deep learning techniques.",
                    "Appointed as a Teaching Assistant for APLN 550 (Computational Linguistics), providing support through tutoring and assignment grading.",
                    "Entrusted with full instructional duties for half of the semester, led the graduate course during the professor's leave of absence with success."
                ]
            }
        },
        msu2: {
            id: 'msu2',
            color: colors.red,
            content: 'MSU',
            modalInfo: {
                kind: 'experience',
                company: "Montclair State University",
                position: "Adjunct Lecturer",
                startDate: "August 2022",
                endDate: "December 2022",
                accomplishments: [
                    "Developed and taught LNGN 445, a beginner-friendly course in Natural Language Processing, with a significant emphasis on Python programming to reinforce theoretical knowledge with practical skills.",
                    "Crafted a syllabus that integrates Python coding from the ground up, enabling students with little or no programming experience to master foundational NLP techniques."
                ]
            }
        },
        inventives: {
            id: 'inventives',
            color: colors.yellowGreen,
            content: 'Inventives',
            modalInfo: {
                kind: 'experience',
                company: "Inventives",
                position: "Artificial Intelligence Developer",
                startDate: "June 2022",
                endDate: "January 2024",
                accomplishments: [
                    "Engineering lead for medical record analysis product, designing the system, backend API, and innovative document analysis methods.",
                    "Developed a performant spore counting software for an international biological firm, employing computer vision to identify and enumerate spores in large images, drastically boosting research efficiency.",
                    "Optimized a Retrieval-Augmented Generation (RAG) system enabling LLM responses to incorporate information from client databases.",
                    "Advanced voice synthesis technology for a digital alter ego platform, enabling user-customizable pronunciations and enriching voice realism.",
                    "Architected and built a robust file storage and retrieval system, engineered for use in diverse applications.",
                    "Designed bespoke machine learning classifiers with high precision, fostering intelligent document organization.",
                    "Instituted comprehensive AI model performance evaluation frameworks as well as tools for gauging live performance and reliability of outputs.",
                    "Revolutionized client workflows by automating complex browser tasks using Selenium, effectively eliminating hours of tedium.",
                    "Engineered a sophisticated, clean frontend application to serve as a file explorer and search tool for a client's private database.",
                    "Diligently maintained production-level codebases for both backend and frontend infrastructures, ensuring excellent user experience."
                ]
            }
        },
        syera: {
            id: 'syera',
            color: colors.blue,
            content: 'Syera',
            modalInfo: {
                kind: 'experience',
                company: "Syera",
                position: "Founding Software Engineer",
                startDate: "January 2024",
                endDate: "November 2024",
                accomplishments: [
                    "Architected an end-to-end ML pipeline for medical record processing, including OCR, record segmentation, classification, extraction, and timeline generation.",
                    "Built a chunked LLM orchestration system enabling classification and extraction over arbitrarily large documents (100+ pages).",
                    "Implemented multi-stage confidence scoring and LLM-based arbitration for ambiguous predictions, producing auditable outputs with reasoning traces.",
                    "Designed hybrid extraction approaches: regex-based date detection followed by LLM correction and significance labeling, balancing deterministic extraction with generative refinement for timeline event detection.",
                    "Led technical architecture as founding engineer on a 3-person dev team."
                ]
            }
        },
        ruck: {
            id: 'ruck',
            color: colors.green,
            content: 'Ruck',
            modalInfo: {
                kind: 'experience',
                company: "Ruck",
                position: "Software Engineer",
                startDate: "November 2024",
                endDate: "April 2026",
                accomplishments: [
                    "Built and maintained a multi-stage LLM pipeline for inventory processing, combining OCR, deterministic parsing, structured extraction, and generative enrichment.",
                    "Designed automated vendor onboarding with AI-assisted inventory ingestion, reducing onboarding from 2-3 days to 1-2 hours for 10-2,000+ SKUs.",
                    "Led architecture and deployment of a unified v2 platform consolidating 3 web apps and 1 mobile app onto shared backend infrastructure, eliminating data sync issues and supporting ~200 vendors processing 200+ orders monthly in production."
                ]
            }
        },
        castle: {
            id: 'castle',
            color: colors.tan,
            content: 'Castle Biosciences',
            modalInfo: {
                kind: 'experience',
                company: "Castle Biosciences",
                position: "AI Engineer",
                startDate: "April 2026",
                endDate: "Present",
                accomplishments: [
                    "Designing and deploying generative AI and agentic automation systems to streamline internal workflows and support decision-making across the organization.",
                    "Establishing AI governance best practices and guardrails for responsible enterprise use.",
                    "Collaborating with cross-functional stakeholders to translate business needs into scalable AI solutions."
                ]
            }
        }
    },

    // Project books — public GitHub repos (github.com/brandonwilde). Like the
    // education/experience books, these carry modalInfo, so they're auto-sized
    // from their content and the kind:'project' page renders their details.
    projects: {
        audiobookmarks: {
            id: 'audiobookmarks',
            color: colors.blue,
            content: 'AudioBookmarks',
            modalInfo: {
                kind: 'project',
                tagline: 'Turn audiobook bookmarks into searchable notes',
                tech: 'Python · Playwright · OpenAI Whisper',
                repoUrl: 'https://github.com/brandonwilde/audiobookmarks',
                highlights: [
                    'Drives Libby and Hoopla in the browser to capture the audio around each bookmark.',
                    'Transcribes the snippets with Whisper and selects the most relevant quote.',
                    'Saves the results as notes in an Obsidian vault.'
                ]
            }
        },
        aitools: {
            id: 'aitools',
            color: colors.green,
            content: 'AI Tools',
            modalInfo: {
                kind: 'project',
                tagline: 'A unified toolkit for everyday AI tasks',
                tech: 'Python · OpenAI · Anthropic · Google · Azure',
                repoUrl: 'https://github.com/brandonwilde/ai-tools',
                highlights: [
                    'One interface for LLM prompting and chat across multiple providers.',
                    'Bundled tools for translation, image analysis and generation, transcription, and OCR.',
                    'Installable as a package with optional per-provider dependencies.'
                ]
            }
        },
        gdrivesync: {
            id: 'gdrivesync',
            color: colors.yellowGreen,
            content: 'gdrive-sync',
            modalInfo: {
                kind: 'project',
                tagline: 'Keep a local folder in sync with Google Drive',
                tech: 'Bash · rclone · systemd',
                repoUrl: 'https://github.com/brandonwilde/gdrive-sync',
                highlights: [
                    'Mirrors a local directory to Google Drive via rclone whenever it changes.',
                    'Installs as a background systemd service with configurable sync delays.'
                ]
            }
        },
        xldefgen: {
            id: 'xldefgen',
            color: colors.red,
            content: 'XLdefgen',
            modalInfo: {
                kind: 'project',
                tagline: 'Zero-shot cross-lingual definition generation',
                tech: 'Python · PyTorch · mT5 · Hugging Face',
                repoUrl: 'https://github.com/brandonwilde/XLdefgen',
                highlights: [
                    'Turns a small multilingual mT5 into a language-agnostic definition generator.',
                    'Produces English definitions for foreign-language terms with no bilingual training data.',
                    "Master's research project; the full paper is included in the repo."
                ]
            }
        },
    },

    // Other books/items
    other: {
        blog: {
            id: 'blog',
            color: colors.green,
            link: 'https://the.btw.so',
            // Leans into the back-left corner of its shelf.
            placement: {
                leanBack:       -0.40, // rotation.x — tip the top back toward the panel (more negative = leans back more)
                swivel:          0.55, // rotation.y — turn the right side toward the back wall
                leanLeft:        0.22, // rotation.z — tip the top toward the left side wall
                offsetFromLeft:  4.2,  // inches inward from the left side wall
                offsetFromBack:  3.5,  // inches forward from the back panel
                flowReserve:     13,   // inches reserved from the left so flowed books clear the notebook
            },
        },
        // Goodreads recent reads, rendered as real 3D books from the committed snapshot
        // (data/goodreadsSnapshot.js), with a live RSS refresh swapped in if it differs.
        goodreads: {
            userId:  '7208433',
            // CORS proxy converting the Goodreads RSS feed to JSON; snapshot is the fallback.
            proxyBase: 'https://api.rss2json.com/v1/api.json?rss_url=',
        },
        contact: {
            id: 'contact',
            color: colors.white,
            placement: {
                shelfAngle: -0.35,  // radians — yaw applied to the holder
            },
            modalInfo: {
                name: "Brandon T Wilde",
                jobTitle1: "AI Engineer",
                jobTitle2: "Chemical Engineer",
                personalLogoSrc: "assets/images/wilde_ribbon_purple_sm_8.png",
                personalLogoAlt: "Personal Logo",
                emailSrc: "assets/images/email.png",
                linkedinUrl: "https://www.linkedin.com/in/brandon-wilde3/",
                linkedinText: "https://www.linkedin.com/in/brandon-wilde3/",
                githubUrl: "https://www.github.com/brandonwilde",
                githubText: "https://www.github.com/brandonwilde"
            }
        }
    }
};

