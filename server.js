const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// FIXED: Stricter Email Validation Regex (Requires @ and a domain extension)
const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};

// 1. Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/moviesDB")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err.message));

// 2. Schemas & Models
const Movie = mongoose.model("movies", new mongoose.Schema({
    Title: String,
    Year: String,
    genre: String,
    director: String,
    Actor: String,
    Category: String
}));

const User = mongoose.model("users", new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

const Music = mongoose.model("music", new mongoose.Schema({
    title: String,
    artist: String,
    url: String
}));

// 3. Email Config (Update with your credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'YOUR_GMAIL@gmail.com', pass: 'YOUR_APP_PASSWORD' }
});

let otpStore = {};

/* --- API ROUTES --- */

app.post("/signup", async(req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation: Blocks invalid emails before they reach MongoDB
        if (!isValidEmail(email)) {
            return res.status(400).json({
                message: "Invalid email! Please enter a real address (e.g., name@gmail.com)."
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered. Please login." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });

        await newUser.save();
        res.status(201).json({ userName: newUser.name });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Internal server error during registration" });
    }
});

app.post("/login", async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ userName: user.name });
    } else { res.status(400).json({ message: "Invalid credentials" }); }
});

app.post("/forgot-password", async(req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;
    transporter.sendMail({
        from: 'YOUR_GMAIL@gmail.com',
        to: email,
        subject: 'CINEFLIX Reset OTP',
        text: `Your OTP is: ${otp}`
    }, (err) => err ? res.status(500).json({ message: "Fail" }) : res.json({ message: "OTP Sent" }));
});

app.post("/reset-password", async(req, res) => {
    const { email, otp, newPassword } = req.body;
    if (otpStore[email] && otpStore[email] == otp) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate({ email }, { password: hashedPassword });
        delete otpStore[email];
        res.json({ message: "Password updated successfully" });
    } else {
        res.status(400).json({ message: "Invalid OTP" });
    }
});

app.get("/movie-media/:title", async(req, res) => {
    const media = await Music.findOne({ title: { $regex: req.params.title, $options: "i" } });
    res.json(media ? { success: true, title: media.title, artist: media.artist } : { success: false });
});

app.get("/movies/featured", async(req, res) => {
    res.json(await Movie.aggregate([{ $sample: { size: 10 } }]));
});

app.get("/movies", async(req, res) => {
    const { actor, genre, category } = req.query;
    let filter = {};
    if (actor) filter.Actor = { $regex: actor, $options: "i" };
    if (genre) filter.genre = { $regex: genre, $options: "i" };
    if (category) filter.Category = category;
    res.json(await Movie.find(filter).limit(20));
});

app.listen(5000, () => console.log("🚀 Server Port 5000"));