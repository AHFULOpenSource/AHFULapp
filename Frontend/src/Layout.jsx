import { Navbar } from "./navbar.jsx";
import { Outlet } from "react-router-dom";
import { Header } from "./Header.jsx";
import { Footer } from "./Footer.jsx";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { CalendarButton } from "./Calendar/CalendarButton.jsx";
import { useTutorial } from "./Auth/useTutorial.js";
import { TutorialOverlay } from "./Auth/TutorialOverlay.jsx";


export function Layout() {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const theme = useSelector((state) => state.setting.theme);
    const {
        isActive: tutorialActive,
        currentStep,
        totalSteps,
        currentStepData,
        skipTutorial,
        nextStep,
        completeTutorial
    } = useTutorial();

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    const closeNav = () => {
        setIsNavOpen(false);
    };

    // Apply theme globally whenever it changes
    useEffect(() => {
        if (theme === "dark") {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }
    }, [theme]);

    return (
        <>
            <main>
            <Header onMenuToggle={toggleNav} isMenuOpen={isNavOpen} onNavClick={closeNav} />
            <Navbar isOpen={isNavOpen} onNavClick={closeNav} />
            <div className="page-content">
                <CalendarButton />
                <Outlet />
                {tutorialActive && currentStepData && (
                    <TutorialOverlay
                    step={currentStep}
                    totalSteps={totalSteps}
                    title={currentStepData.title}
                    message={currentStepData.message}
                    highlightSelector={currentStepData.highlightSelector}
                    onNext={nextStep}
                    onSkip={skipTutorial}
                    onComplete={completeTutorial}
                    />
                )}

                <Footer />
            </div>
            </main>
        </>
    )
}
