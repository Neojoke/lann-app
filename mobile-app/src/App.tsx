import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import OTPVerify from './pages/Auth/OTPVerify'; // 添加缺失的导入
import Profile from './pages/Profile/Profile';
import CreditApply from './pages/CreditApply/CreditApply';
import CreditStatus from './pages/CreditStatus/CreditStatus';
import Borrow from './pages/Borrow/Borrow';
import Repay from './pages/Repay/Repay';
import RepaySchedule from './pages/RepaySchedule/RepaySchedule';

// 导入性能优化和错误处理功能
import { ErrorBoundary } from './utils/error-handler';
import { initGlobalErrorHandler, getGlobalErrorHandler } from './utils/error-handler';
import { cacheManager, cleanupResources } from './utils/performance';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

// 初始化全局错误处理器
initGlobalErrorHandler((error, level) => {
  console.log(`App Error (${level}):`, error);
  // 这里可以发送错误到错误收集服务
});

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <ErrorBoundary
      fallback={
        <div className="error-boundary-container">
          <h2>Something went wrong.</h2>
          <p>We're sorry, but an unexpected error occurred.</p>
          <button onClick={() => window.location.reload()}>
            Reload App
          </button>
        </div>
      }
    >
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/login">
            <Login />
          </Route>
          <Route exact path="/register">
            <Register />
          </Route>
          <Route exact path="/otp-verify">
            <OTPVerify />
          </Route>
          <Route exact path="/profile">
            <Profile />
          </Route>
          <Route exact path="/credit-apply">
            <CreditApply />
          </Route>
          <Route exact path="/credit-status">
            <CreditStatus />
          </Route>
          <Route exact path="/borrow">
            <Borrow />
          </Route>
          <Route exact path="/repay">
            <Repay />
          </Route>
          <Route exact path="/repay-schedule">
            <RepaySchedule />
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </ErrorBoundary>
  </IonApp>
);

export default App;
