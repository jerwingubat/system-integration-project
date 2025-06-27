require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_USER = process.env.GITHUB_USER;
console.log("Loaded GitHub Username:", GITHUB_USER); 

// Multiple GitHub profiles configuration
const GITHUB_PROFILES = [
    {
        username: GITHUB_USER,
        name: "Jerwin Gubat",
        portfolio: "https://jerwingubatportfolio.vercel.app"
    },
    {
        username: "octocat", // Example second profile
        name: "Octocat",
        portfolio: "https://octocat.github.io"
    },
    {
        username: "torvalds", // Example third profile
        name: "Linus Torvalds",
        portfolio: "https://github.com/torvalds"
    }
];

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to fetch GitHub profile
async function fetchGitHubProfile(username) {
    try {
        const response = await axios.get(`https://api.github.com/users/${username}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching profile for ${username}:`, error.response?.data || error.message);
        return null;
    }
}

// Helper function to fetch GitHub repositories
async function fetchGitHubRepos(username) {
    try {
        const response = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated`);
        return response.data.slice(0, 5);
    } catch (error) {
        console.error(`Error fetching repos for ${username}:`, error.response?.data || error.message);
        return [];
    }
}

app.get('/', async (req, res) => {
    try {
        // Fetch all profiles
        const profilesData = await Promise.all(
            GITHUB_PROFILES.map(async (profile) => {
                const githubData = await fetchGitHubProfile(profile.username);
                return {
                    ...profile,
                    githubData
                };
            })
        );

        res.render('index', { 
            profiles: profilesData,
            mainProfile: profilesData[0] // First profile as main
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Error fetching GitHub profiles');
    }
});

app.get('/projects', (req, res) => {
    const projects = [
        {
            name: "Smart Portfolio",
            description: "A portfolio with 3D interactivity and animations.",
            image: "/images/portfolio.png",
            link: "https://github.com/jerwingubat/smart-portfolio",
            author: "Jerwin Gubat"
        },
        {
            name: "Clinic Management System",
            description: "Manages patient records and appointments.",
            image: "/images/clinic.png",
            link: "https://github.com/jerwingubat/clinic-system",
            author: "Jerwin Gubat"
        },
        {
            name: "Booking System",
            description: "Department booking with calendar and slot features.",
            image: "/images/booking.png",
            link: "https://github.com/jerwingubat/booking-system",
            author: "Jerwin Gubat"
        },
        {
            name: "Linux Kernel",
            description: "The Linux kernel source tree.",
            image: "/images/linux.png",
            link: "https://github.com/torvalds/linux",
            author: "Linus Torvalds"
        },
        {
            name: "Git",
            description: "Git Source Code Mirror.",
            image: "/images/git.png",
            link: "https://github.com/git/git",
            author: "Git Team"
        }
    ];
    res.render('projects', { projects });
});

app.get('/activity', async (req, res) => {
    try {
        // Fetch repositories from all profiles
        const allRepos = [];
        
        for (const profile of GITHUB_PROFILES) {
            const repos = await fetchGitHubRepos(profile.username);
            const reposWithAuthor = repos.map(repo => ({
                ...repo,
                author: profile.name,
                authorUsername: profile.username
            }));
            allRepos.push(...reposWithAuthor);
        }

        // Sort by update date and take top 10
        const sortedRepos = allRepos
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 10);

        res.render('activity', { repos: sortedRepos });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Error fetching repositories');
    }
});

// New route for individual profile view
app.get('/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const profileConfig = GITHUB_PROFILES.find(p => p.username === username);
        
        if (!profileConfig) {
            return res.status(404).send('Profile not found');
        }

        const githubData = await fetchGitHubProfile(username);
        const repos = await fetchGitHubRepos(username);

        res.render('profile', { 
            profile: { ...profileConfig, githubData },
            repos
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Error fetching profile data');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 