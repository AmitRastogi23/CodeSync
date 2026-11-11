/* eslint-disable react-hooks/static-components */
import "./App.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./Components/Navbar/Navbar";
import Hero from "./Components/Hero/Hero";
import Features from "./Components/Hero/Feature";
import HowItWorks from "./Components/Hero/HowitWorks";
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import Settings from "./Components/Settings/SettingsTab";
import ProfileTab from "./Components/Settings/Profile/ProfileTab";
import SecurityTab from "./Components/Settings/Security/SecurityTab";
import MyQuestions from "./Components/Settings/MyQuestions/MyQuestions";
import SharedQuestions from "./Components/Settings/SharedQuestions/SharedQuestions";
import MySessions from "./Components/Settings/MySessions/MySessions";
import WaitingRoom from "./Components/Interview/WaitingRoom";
import StartInterview from "./Components/Interview/StartInterview";
import InterviewRoom from "./Components/Interview/InterviewRoom";

import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import PublicRoute from "./Components/Auth/PublicRoute";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <div>
          <Navbar></Navbar>
          <Hero></Hero>
        </div>
      ),
    },
    {
      path: "/features",
      element: (
        <div>
          <Navbar></Navbar>
          <Features></Features>
        </div>
      ),
    },
    {
      path: "/howitworks",
      element: (
        <div>
          <Navbar></Navbar>
          <HowItWorks></HowItWorks>
        </div>
      ),
    },
    {
      element: <PublicRoute />,
      children: [
        {
          path: "/login",
          element: (
            <div>
              <Navbar />
              <Login />
            </div>
          ),
        },
        {
          path: "/signup",
          element: (
            <div>
              <Navbar />
              <Signup />
            </div>
          ),
        },
      ],
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/settings",
          element: (
            <div>
              <Navbar />
              <Settings />
            </div>
          ),
          children: [
            { path: "", element: <ProfileTab /> },
            { path: "profile", element: <ProfileTab /> },
            { path: "security", element: <SecurityTab /> },
            { path: "questions", element: <MyQuestions /> },
            { path: "shared-questions", element: <SharedQuestions /> },
            { path: "sessions", element: <MySessions /> },
          ],
        },
      ],
    },
    {
      path: "/join/:roomId",
      element: (
        <div>
          <Navbar></Navbar>
          <WaitingRoom />
        </div>
      ),
    },
    {
      path: "/start/:roomId",
      element: (
        <div>
          <Navbar />
          <StartInterview />
        </div>
      ),
    },
    {
      path: "/interview/:roomId",
      element: <InterviewRoom />,
    },
  ]);

  const AppContent = () => {
    const { loading } = useAuth();

    if (loading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          Loading CodeSync...
        </div>
      );
    }

    return <RouterProvider router={router} />;
  };

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
