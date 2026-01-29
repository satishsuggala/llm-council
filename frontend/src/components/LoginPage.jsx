/**
 * Login Page Component
 * Google OAuth sign-in page for LLM Council
 */

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const { login } = useAuth();

    const handleGoogleSuccess = async (credentialResponse) => {
        const result = await login(credentialResponse.credential);
        if (!result.success) {
            console.error('Login failed:', result.error);
        }
    };

    const handleGoogleError = () => {
        console.error('Google Sign-In failed');
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>🏛️ LLM Council</h1>
                    <p>Your AI Council of Experts</p>
                </div>

                <div className="login-card">
                    <h2>Welcome</h2>
                    <p className="login-subtitle">Sign in to continue</p>

                    <div className="google-login-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_blue"
                            size="large"
                            text="signin_with"
                            shape="rectangular"
                            width="280"
                        />
                    </div>

                    <p className="login-footer">
                        Ask questions to multiple AI models and get a synthesized council response
                    </p>
                </div>
            </div>
        </div>
    );
}
