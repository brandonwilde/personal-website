import { colors } from './constants.js';

// Book configurations organized by shelf and section
export const shelfConfigs = {
    A: { // Education and Skills
        sections: {
            1: ['bachelors', 'masters'],  // Education
            3: ['skillsA', 'skillsB', 'skillsC', 'skillsD']  // Skills/Certifications
        }
    },
    B: { // Projects and Reviews
        sections: {
            1: ['projectsA', 'projectsB', 'projectsC', 'projectsD', 'projectsE', 'projectsF', 'projectsG'],
            3: ['reviewsA', 'reviewsB'],
            4: ['bookReviews', 'recentReads']
        }
    },
    C: { // Professional Experience and Contact
        sections: {
            2: ['misc'],
            3: ['translate', 'montco', 'aei', 'msu1', 'msu2', 'inventives', 'syera'],
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
                logoSrc: "assets/images/hawk-logo-color-2.svg",
                logoAlt: "Montclair Logo",
                degree: "Master of Science in Computational Linguistics",
                university: "Montclair State University: Montclair, NJ",
                gpa: "3.96",
                graduationDate: "Graduated May 2022",
                projects: [
                    "Cross-lingual definition modeling without bilingual corpora",
                    "Farsi NLP Tools"
                ]
            }
        }
    },

    // Skills/Certifications books
    skills: {
        skillsA: {
            id: 'skillsA',
            width: 5.5,
            height: 7.2,
            thickness: 2,
            color: colors.gray,
            content: 'Programming Languages'
        },
        skillsB: {
            id: 'skillsB',
            width: 5,
            height: 7.2,
            thickness: 1.5,
            color: colors.purple,
            content: 'Tools & Frameworks'
        },
        skillsC: {
            id: 'skillsC',
            width: 6,
            height: 7.2,
            thickness: 1.5,
            color: colors.purple,
            content: 'Languages'
        },
        skillsD: {
            id: 'skillsD',
            width: 7,
            height: 8,
            thickness: 2,
            color: colors.yellowGreen,
            content: 'Other Skills'
        }
    },
    
    // Professional experience books (middle shelf)
    experience: {
        translate: {
            id: 'translate',
            color: colors.yellow,
            content: 'Freelance Translation',
            modalInfo: {
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
                company: "Syera",
                position: "Software Engineer",
                startDate: "January 2024",
                endDate: "Present",
                accomplishments: [
                    "Architecting and developing core software, designing and building intelligent document processing and data extraction systems using ML and NLP techniques.",
                    "Engineering scalable, cloud-based infrastructure to transform legal case documents into intuitive visual timelines, enabling rapid evidence discovery."
                ]
            }
        }
    },

    // Project books
    projects: {
        projectsA: {
            id: 'projectsA',
            width: 5.5,
            height: 6.5,
            thickness: 2,
            color: colors.gray,
            content: 'Project A',
        },
        projectsB: {
            id: 'projectsB',
            width: 5,
            height: 7.5,
            thickness: 1.5,
            color: colors.yellowGreen,
            content: 'Project B'
        },
        projectsC: {
            id: 'projectsC',
            width: 6,
            height: 7.3,
            thickness: 1.8,
            color: colors.brown,
            content: 'Project C'
        },
        projectsD: {
            id: 'projectsD',
            width: 5.5,
            height: 7.0,
            thickness: 1.5,
            color: colors.gray,
            content: 'Project D'
        },
        projectsE: {
            id: 'projectsE',
            width: 5.7,
            height: 6.5,
            thickness: 1.5,
            color: colors.blue,
            content: 'Project E'
        },
        projectsF: {
            id: 'projectsF',
            width: 5.5,
            height: 6.5,
            thickness: 1.8,
            color: colors.red,
            content: 'Project F'
        },
        projectsG: {
            id: 'projectsG',
            width: 6.5,
            height: 6.5,
            thickness: 1.5,
            color: colors.green,
            content: 'Project G'
        }
    },

    // Review books
    reviews: {
        reviewsA: {
            id: 'reviewsA',
            width: 5.5,
            height: 6.5,
            thickness: 2,
            color: colors.green,
            content: 'Reviews A'
        },
        reviewsB: {
            id: 'reviewsB',
            width: 5.5,
            height: 6.5,
            thickness: 1.5,
            color: colors.blue,
            content: 'Reviews B'
        },
        bookReviews: {
            id: 'bookReviews',
            width: 4.9,
            height: 6.5,
            thickness: 1.8,
            color: colors.tan,
            content: 'Book Reviews'
        },
        recentReads: {
            id: 'recentReads',
            width: 5.9,
            height: 6.5,
            thickness: 1.5,
            color: colors.gray,
            content: 'Recent Reads'
        }
    },

    // Other books
    other: {
        blog: {
            id: 'blog',
            color: colors.green,
            link: 'https://the.btw.so',
            // Placement: tucked into the back-left corner of a shelf.
            // The notebook leans on three surfaces — shelf, left side wall, back panel.
            placement: {
                shelfId:        'C',
                leanBack:       -0.40, // rotation.x — tip the top back toward the panel (more negative = leans back more)
                swivel:          0.55, // rotation.y — turn the right side toward the back wall
                leanLeft:        0.22, // rotation.z — tip the top toward the left side wall
                offsetFromLeft:  4.2,  // inches inward from the left side wall
                offsetFromBack:  3.5,  // inches forward from the back panel
            },
        },
        misc: {
            id: 'misc',
            width: 5.5,
            height: 6.5,
            thickness: 1.2,
            color: colors.blue,
            content: 'Miscellaneous'
        },
        contact: {
            id: 'contact',
            color: colors.white,
            // Placement: angled slightly so it looks naturally placed on the shelf
            placement: {
                shelfId:    'C',
                section:    4,
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

