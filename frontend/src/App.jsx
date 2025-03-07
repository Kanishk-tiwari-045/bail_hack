import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import DashboardPage from "./pages/DashboardPage";
import CasePage from "./pages/CaseForm";
import BailPage from "./pages/BailPage";
import CaseList from "./components/Caselist";
import LegalAidList from "./components/LegalAidList";
import RequestsList from "./components/CaseRequests";
import UserProfile from "./pages/UserProfile";
import Chat from "./components/Chat";
import ClientRequest from "./components/ClientRequest";
import FamilyNotificationPage from "./pages/FamilyNotifyPage";
import DocManage from "./components/DocManage";
import JudgeCaseList from "./components/JudgeCaseList";
import ChatBot from "./components/Chatbot";
import Calendar from "./components/Calender";
import LegalReport from "./components/LegalReport";

const App = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/client-requests" element={<ClientRequest />} />
          <Route path="/judge-case-list" element={<JudgeCaseList />} />
          {/* Updated routes to match login navigation */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/legal-report" element={<LegalReport />} />
          <Route path="/calender" element={<Calendar />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/dashboard/judge" element={<DashboardPage />} />
          <Route path="/dashboard/legal-aid" element={<DashboardPage />} />
          <Route path="/cases" element={<CasePage />} />
          <Route path="/doc-manager" element={<DocManage />} />
          <Route path="/case-list" element={<CaseList />} />
          <Route path="/family" element={<FamilyNotificationPage/>} />
          <Route path="/legalAidList" element={<LegalAidList />} />
          <Route path="/case-requests" element={<RequestsList />}/>
          <Route path="/bail" element={<BailPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
