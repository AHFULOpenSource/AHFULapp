import veniceDesktop from "../../images/Login/Backgrounds/venice desktop with overlay.jpg";
import veniceMobile from "../../images/Login/Backgrounds/venice mobile with overlay.jpg";
import "./Auth.css";
import "../Dashboard/Dashboard.css";
import { useSelector, useDispatch } from "react-redux";
import { authLogin } from "./AuthSlice.jsx";
import { useState, useEffect } from "react";
import {useNavigate } from "react-router-dom";
import { onLoginCache } from "./OnLoginCache.jsx";
import { setSettings } from './SettingsSlice.jsx';
import { StreakCounter } from "../Dashboard/StreakCounter.jsx";
import { TOS } from "../TOS.jsx";
import { loginEmailPassword, createWithEmailPassword } from "../firebase.js";

export function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.setting?.theme || "Light");
  const [statusText, setStatusText] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [showScrollText, setShowScrollText] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTOS, setShowTOS] = useState(false);
  const [browser, setBrowser] = useState('');
  const scrollText = "∨ scroll down to learn more ∨";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);

  //Check if we are on a mobile device and if so resize. 
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      setShowScrollText(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const detectBrowser = () => {
      const ua = navigator.userAgent;
      if (ua.indexOf("Edg") !== -1 || ua.indexOf("Edge") !== -1) return "Microsoft Edge";
      if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1) return "Google Chrome";
      if (ua.indexOf("Trident") !== -1 || ua.indexOf("MSIE") !== -1) return "Internet Explorer";
      return "Other";
    };
    setBrowser(detectBrowser());
  }, []);

  useEffect(() => {
    setShowContent(true);
    const scrollTimer = setTimeout(() => {
      setShowScrollText(true);
      let index = 0;
      const typeInterval = setInterval(() => {
        setTypedText(scrollText.slice(0, index + 1));
        index++;
        if (index >= scrollText.length) {
          clearInterval(typeInterval);
        }
      }, 50);
    }, 2000);
    return () => clearTimeout(scrollTimer);
  }, []);

  const handleTOSClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowTOS(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try{
      const user = await loginEmailPassword(email, password );
      
    }catch (error) {
      console.error('Login Login Page Failed:', error);
      setLoginError(error);
    }

  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    try{
      const user = await createWithEmailPassword(email, password );
      
    }catch (error) {
      console.error('Sign up on the Login Page Failed:', error);
      setLoginError(error);
    }

  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.email_verified === false) {
        setStatusText(`Logged in as ${user.email}, email not verified`);
        navigate("/NotVerified", { replace: true });
      }
      else {
        setStatusText(`Logged in as ${user.email}`);
        onLoginCache();
        navigate("/Dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);
  
  // ----- LOGIN Page HTML ---------------------------------------------------------------------------
  return (
    <div className={`login-page ${isScrolled ? 'scrolled' : ''}`}>
      <div className="login-background" style={{ backgroundImage: `url(${isMobile ? veniceMobile : veniceDesktop})` }}></div>



      <div className="login-top-overlay">
        <div className={`login-content ${showContent ? 'fade-in' : ''}`}>
          <div className="login-title">
            <br/>
              <div>
                <h1>AHFUL</h1>
                A Helpful Fitness Utilization Logger App
              </div>
          </div>
          
          
              <form onSubmit={handleLoginSubmit}>
              <input
                id="login-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="login-google-button" type="submit"> Login with Email</button>
            </form>

            <form onSubmit={handleSignUpSubmit}>
              <input
                id="signup-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
              id="signup-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="login-google-button" type="submit"> Sign Up with Email</button>
            </form>
            {loginError && <p className="error">There was an error during login: {loginError.message}</p>}

            <br/>
            <br/>
            <button className="login-google-button"> Login with Gmail</button>




          <div className={`scroll-down-text ${showScrollText ? 'fade-in' : ''} ${isScrolled ? 'hidden' : ''}`}>
            {typedText}<span className="typing-cursor"></span>
          </div>
        </div>
      </div>
      <div className="login-dashboard-content">
          <section className="section">
            <div className="solo-page-container">
              <div className="hero-eyebrow">Now in early access</div>
              <h1>Your Personal Fitness, Built for Habit, Now in One AHFUL App.</h1>
              <p>
                AHFUL unites workout & food tracking, body metrics, AI coaching, and
                a real community — turning miserable routines into amazing progress.
                We say it's AHFUL-ly effective.
              </p>
              <div className="streaks-wrapper">
                <StreakCounter count={3} type="workout" loading={false} />
                <StreakCounter count={5} type="food" loading={false} />
              </div>
            </div>
          </section>
          <section id="features" className="section">
            <div className="solo-page-container">
              <div className="label">What AHFUL does</div>
              <div className="section-title">
                Everything your fitness life needs
              </div>
              <div className="section_grid">
                <div className="section_card">
                  <div className="section_icon">📊</div>
                  <div className="section_name">Track & Log Anything</div>
                  <div className="section_body">
                    Log sets, reps, weights, food, measurements and more.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_icon">🎯</div>
                  <div className="section_name">Habit Coach</div>
                  <div className="section_body">
                    Micro-goals and reminders to keep momentum every day.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_icon">🧠</div>
                  <div className="section_name">Smart Programs</div>
                  <div className="section_body">
                    Adaptive plans that respect your schedule and progress.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_icon">🏋️</div>
                  <div className="section_name">Workout Planning</div>
                  <div className="section_body">
                    Plan, record, and track your fitness journey with precision.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_icon">🤖</div>
                  <div className="section_name">AI Coaching</div>
                  <div className="section_body">
                    Get personalized workout and nutrition advice from our AI coach.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_icon">📍</div>
                  <div className="section_name">Gym Discovery</div>
                  <div className="section_body">
                    Find gyms near you and connect with fitness professionals.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_icon">👨‍🏫</div>
                  <div className="section_name">Trainer Tools</div>
                  <div className="section_body">
                    Personal trainers can manage clients and assign workouts.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_icon">🔔</div>
                  <div className="section_name">Real Time Task Notifications</div>
                  <div className="section_body">
                    Stay on track with reminders and motivational alerts.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="login-dashboard-content">
          <section id="features" className="section">
            <div className="solo-page-container">
              <div className="label">Who is it for?</div>
              <div className="section-title">
                One app, every role
              </div>
              <div className="section_grid">
                <div className="section_card">
                  <div className="section_name">Gym Member & Home Users</div>
                  <div className="section_body">
                    Private tracking, habit streaks, body metrics, and a customizable dashboard for your goals.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_name">Personal trainers</div>
                  <div className="section_body">
                    Manage clients, assign workouts, schedule sessions, and track client progress — all in one place.
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_name">Gym owners</div>
                  <div className="section_body">
                    Create events, publish workout calendars, and promote your gym to AHFUL's growing user base.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="login-dashboard-content">
          <section id="features" className="section">
            <div className="solo-page-container">
              <div className="label">By the numbers</div>
              <div className="section-title">
                Built to move with you
              </div>
              <div className="section_grid">
                <div className="section_card">
                  <div className="section_name">Two Factor Verification</div>
                  <div className="section_body">
                    Account security built in
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_name">User Roles</div>
                  <div className="section_body">
                    Member, Trainer, Gym Owner, Gym Admins, Developers
                  </div>
                </div>
                <div className="section_card">
                  <div className="section_name">Always on</div>
                  <div className="section_body">
                    Live notifications & reminders
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div> 
        <div className="login-tos-button">
          <button onClick={() => setShowTOS(true)} className="tos-link">Terms of Service</button>
        </div>
        <TOS isOpen={showTOS} onClose={() => setShowTOS(false)} />
        
    </div>
  );
}