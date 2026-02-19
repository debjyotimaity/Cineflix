import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
    const [view, setView] = useState("login");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState("");
    const [movies, setMovies] = useState([]);
    const [inputs, setInputs] = useState({ name: "", email: "", password: "", otp: "" });
    const [search, setSearch] = useState({ actor: "", genre: "", category: "" });
    const [currentMedia, setCurrentMedia] = useState("Select a movie to play media");

    // NEW: Scroll state for Navbar
    const [scrolled, setScrolled] = useState(false);

    const OMDB_API_KEY = "e88b8f11";

    const isValidEmail = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    };

    // NEW: Scroll Listener Effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const activeUser = localStorage.getItem("userName");
        if (activeUser) { setUser(activeUser);
            setIsLoggedIn(true);
            setView("dashboard"); }
    }, []);

    const loadPosters = async(movieList) => {
        const updated = await Promise.all(movieList.map(async(m) => {
            try {
                const res = await fetch(`https://www.omdbapi.com/?t=${m.Title}&apikey=${OMDB_API_KEY}`);
                const data = await res.json();
                return {...m, Poster: data.Poster && data.Poster !== "N/A" ? data.Poster : null };
            } catch { return {...m, Poster: null }; }
        }));
        setMovies(updated);
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetch("http://localhost:5000/movies/featured").then(res => res.json()).then(data => loadPosters(data));
        }
    }, [isLoggedIn]);

    const handleAuth = async(type) => {
        if (!isValidEmail(inputs.email)) {
            alert("Invalid email! Please include '@' and a domain extension (e.g., .com)");
            return;
        }
        const res = await fetch(`http://localhost:5000/${type}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inputs)
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("userName", data.userName);
            setUser(data.userName);
            setIsLoggedIn(true);
            setView("dashboard");
        } else { alert(data.message); }
    };

    const sendOtp = () => {
        if (!isValidEmail(inputs.email)) { alert("Enter a valid email address"); return; }
        fetch("http://localhost:5000/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inputs.email })
        }).then(r => r.json()).then(d => alert(d.message));
    };

    const resetPassword = async() => {
        const res = await fetch("http://localhost:5000/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inputs.email, otp: inputs.otp, newPassword: inputs.password })
        });
        const data = await res.json();
        if (res.ok) { alert(data.message);
            setView("login"); } else { alert(data.message); }
    };

    // UPDATED: Redirects to YouTube Music search instead of internal server
    const handleMediaClick = (movieTitle) => {
        const searchQuery = encodeURIComponent(`${movieTitle} official jukebox soundtrack`);
        const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        setCurrentMedia(`🎵 Redirecting to ${movieTitle} Music...`);
        window.open(youtubeUrl, "_blank");
    };

    const getTimeGreeting = () => {
        const hr = new Date().getHours();
        if (hr < 12) return "Good Morning";
        if (hr < 18) return "Good Afternoon";
        return "Good Evening";
    };

    if (!isLoggedIn) {
        return ( <
                div className = "auth-page" >
                <
                div className = "glow-orb crimson-orb" > < /div> <
                div className = "glow-orb cyan-orb" > < /div> <
                div className = "auth-container glass-morphism" >
                <
                div className = "auth-header" >
                <
                span className = "brand-icon" > 🎬 < /span> <
                h1 className = "brand-name" > CINEFLIX < /h1> <
                /div> {
                    view === "forgot" ? ( <
                        div className = "auth-card" >
                        <
                        h2 > Reset Password < /h2> <
                        p className = "auth-subtitle" > Verify your identity to regain access < /p> <
                        div className = "input-group" >
                        <
                        input placeholder = "Email Address"
                        onChange = { e => setInputs({...inputs, email: e.target.value }) }
                        /> <
                        button className = "otp-btn"
                        onClick = { sendOtp } > SEND OTP < /button> <
                        /div> <
                        div className = "input-stack" >
                        <
                        input placeholder = "6-Digit OTP"
                        onChange = { e => setInputs({...inputs, otp: e.target.value }) }
                        /> <
                        input type = "password"
                        placeholder = "New Password"
                        onChange = { e => setInputs({...inputs, password: e.target.value }) }
                        /> <
                        /div> <
                        button className = "submit-btn"
                        onClick = { resetPassword } > UPDATE PASSWORD < /button> <
                        p className = "auth-nav-link"
                        onClick = {
                            () => setView("login") } > Back to Sign In < /p> <
                        /div>
                    ) : ( <
                        div className = "auth-card" >
                        <
                        h2 > { view === "login" ? "Welcome Back" : "Create Account" } < /h2> <
                        p className = "auth-subtitle" > { view === "login" ? "Sign in to continue your cinematic journey" : "Join us for an iconic cinematic escape" } <
                        /p> <
                        div className = "input-stack" > {
                            view === "signup" && < input placeholder = "Full Name"
                            onChange = { e => setInputs({...inputs, name: e.target.value }) }
                            />} <
                            input type = "email"
                            placeholder = "Email Address"
                            onChange = { e => setInputs({...inputs, email: e.target.value }) }
                            /> <
                            input type = "password"
                            placeholder = "Password"
                            onChange = { e => setInputs({...inputs, password: e.target.value }) }
                            /> <
                            /div> <
                            button className = "submit-btn"
                            onClick = {
                                () => handleAuth(view) } > { view === "login" ? "SIGN IN" : "REGISTER" } <
                            /button> <
                            div className = "auth-footer" >
                            <
                            p className = "auth-nav-link"
                            onClick = {
                                () => setView(view === "login" ? "signup" : "login") } > { view === "login" ? "New to Cineflix? Register Now" : "Already a member? Sign In" } <
                            /p> {
                                view === "login" && < p className = "auth-nav-link forgot-pass"
                                onClick = {
                                        () => setView("forgot") } > Forgot Password ? < /p>} <
                                    /div> <
                                    /div>
                            )
                        } <
                        /div> <
                        /div>
                    );
                }

                return ( <
                    div className = "app" > { /* HEADER: Nav items removed for a cleaner look */ } <
                    div className = { `header ${scrolled ? "header-scrolled" : ""}` } >
                    <
                    div className = "header-left" >
                    <
                    h1 > 🎬CINEFLIX < /h1> <
                    span className = "tagline" > Your Cinematic Escape < /span> <
                    /div> <
                    div className = "header-right" >
                    <
                    div className = "user-profile" >
                    <
                    div className = "user-avatar" > { user.charAt(0).toUpperCase() } < /div> <
                    div className = "user-text" >
                    <
                    p className = "greeting" > { getTimeGreeting() }, < /p> <
                    span className = "user-name" > { user } < /span> <
                    /div> <
                    /div> <
                    button className = "logout-btn"
                    onClick = {
                        () => { localStorage.clear();
                            window.location.reload(); } } > Logout < /button> <
                    /div> <
                    /div>

                    <
                    div className = "iconic-media-bar" > < div className = "media-status" > { currentMedia } < /div></div >

                    <
                    div className = "search-box" >
                    <
                    input placeholder = "Actor Name"
                    onChange = { e => setSearch({...search, actor: e.target.value }) }
                    /> <
                    input placeholder = "Genre"
                    onChange = { e => setSearch({...search, genre: e.target.value }) }
                    /> <
                    select className = "region-select"
                    onChange = { e => setSearch({...search, category: e.target.value }) } >
                    <
                    option value = "" > All Regions < /option><option>Bollywood</option > < option > Hollywood < /option><option>Bengali</option >
                    <
                    /select> <
                    button className = "search-btn"
                    onClick = {
                        () => fetch(`http://localhost:5000/movies?actor=${search.actor}&genre=${search.genre}&category=${search.category}`).then(r => r.json()).then(d => loadPosters(d)) } > Search < /button> <
                    /div>

                    <
                    div className = "movies-container" > {
                        movies.map((m, i) => ( <
                                div className = "iconic-card"
                                key = { i } >
                                <
                                div className = "poster-stage" > {
                                    m.Poster ? < img src = { m.Poster }
                                    alt = { m.Title }
                                    className = "main-img" / > : < div className = "clapper" > 🎬 < /div>} <
                                        div className = "media-overlay" >
                                        <
                                        button className = "icon-btn"
                                    onClick = {
                                        () => handleMediaClick(m.Title) } > 🎵 < /button> <
                                    button className = "icon-btn"
                                    onClick = {
                                        () => window.open(`https://www.youtube.com/results?search_query=${m.Title}+trailer`, "_blank") } > ▶️ < /button> <
                                    /div> <
                                    /div> <
                                    div className = "info-tray" >
                                    <
                                    h3 className = "visible-title" > { m.Title } < /h3> <
                                    div className = "tray-bottom" >
                                    <
                                    div className = "tray-left" >
                                    <
                                    span className = "iconic-badge" > { m.Category } < /span> { /* Displays real year from DB */ } <
                                    span className = "year-stamp" > { m.Year || "N/A" } < /span> <
                                    /div> { /* Professional Rating Display */ } <
                                    div className = "rating-tag" > ⭐ < span className = "rating-num" > 8.5 < /span></div >
                                    <
                                    /div> <
                                    /div> <
                                    /div>
                                ))
                        } <
                        /div> <
                        /div>
                    );
                }
                export default App;