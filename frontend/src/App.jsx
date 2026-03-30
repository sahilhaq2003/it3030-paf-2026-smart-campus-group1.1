import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import AuthUnauthorizedBridge from "./routes/AuthUnauthorizedBridge";

export default function App() {
  return (
    <BrowserRouter>
      <AuthUnauthorizedBridge />
      <AppRoutes />
    </BrowserRouter>
  );
}
