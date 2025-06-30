require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_USER = process.env.GITHUB_USER;
console.log("Loaded GitHub Username:", GITHUB_USER); 

const GITHUB_PROFILES = [
    {
        username: GITHUB_USER,
        name: "Jerwin Gubat",
        portfolio: "https://jerwingubatportfolio.vercel.app"
    },
    {
        username: "octocat",
        name: "Octocat",
        portfolio: "https://octocat.github.io"
    },
    {
        username: "torvalds",
        name: "Linus Torvalds",
        portfolio: "https://github.com/torvalds"
    }
];

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

async function fetchGitHubProfile(username) {
    try {
        const response = await axios.get(`https://api.github.com/users/${username}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching profile for ${username}:`, error.response?.data || error.message);
        return null;
    }
}

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
            mainProfile: profilesData[0]
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Error fetching GitHub profiles');
    }
});

app.get('/projects', (req, res) => {
    const projects = [
        {
            name: "Sweetrack App",
            description: "A food recognition Android app that identifies food items, estimates calorie and sugar content, and helps users manage their intake based on health conditions.",
            image: "/images/sweetrack.jpg",
            link: "https://github.com/jerwingubat/SweeTrack-App",
            author: "Jerwin Gubat"
        },
        {
            name: "Face Recognition using FaceNet",
            description: "This project implements a face recognition system using the MTCNN (Multi-task Cascaded Convolutional Neural Networks) for face detection and InceptionResnetV1 for generating face embeddings.",
            image: "/images/facenet.png",
            link: "https://github.com/jerwingubat/FaceNet-FaceRecognition",
            author: "Jerwin Gubat"
        },
        {
            name: "Machine Learning Algorithms",
            description: "Clear, modular Python implementations of fundamental machine learning algorithms for educational purposes. Ideal for learners who want to understand the math and logic behind popular ML techniques without relying on high-level libraries.",
            image: "/images/machineLearning.PNG",
            link: "https://github.com/jerwingubat/Machine-Learning-Algorithms",
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

        const sortedRepos = allRepos
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 10);

        res.render('activity', { repos: sortedRepos });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Error fetching repositories');
    }
});

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