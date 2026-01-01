// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        const isActive = mobileMenu.classList.toggle('active');
        mobileMenuToggle.setAttribute('aria-expanded', isActive.toString());
    });
}

// Close mobile menu when clicking on a link
const mobileMenuLinks = mobileMenu.querySelectorAll('a');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

// Authentication Modal
const authModal = document.getElementById('authModal');
const authModalBtn = document.getElementById('authModalBtn');
const authModalBtnMobile = document.getElementById('authModalBtnMobile');
const authModalClose = document.getElementById('authModalClose');
const authToggleLink = document.getElementById('authToggleLink');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleText = document.getElementById('authToggleText');
const authPasswordInput = document.getElementById('authPassword');
const authForm = document.getElementById('signupForm');

let isSignUpMode = true;

// Open modal
function openAuthModal() {
    authModal.classList.add('active');
    authModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Reinitialize Google Sign-In when modal opens (buttons might not be available yet)
    setTimeout(() => {
        initGoogleSignIn();
        const firstInput = authModal.querySelector('input[type="email"], input[type="text"]');
        if (firstInput) firstInput.focus();
    }, 100);
}

// Close modal
function closeAuthModal() {
    authModal.classList.remove('active');
    authModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Reset to sign up mode
    if (!isSignUpMode) {
        toggleAuthMode();
    }
}

// Toggle between Sign Up and Log In
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;

    if (isSignUpMode) {
        authTitle.textContent = 'Welcome to ExamSolve';
        authSubtitle.textContent = 'Sign up to get your 100 free credits daily';
        authSubmitBtn.textContent = 'Sign Up';
        authToggleText.innerHTML = 'Already have an account? <a href="#" id="authToggleLink">Log In</a>';
        authPasswordInput.placeholder = 'Create a strong password';

        // Remove forgot password link if it exists
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.parentElement.remove();
        }
    } else {
        authTitle.textContent = 'Welcome Back!';
        authSubtitle.textContent = 'Log in to continue your learning journey';
        authSubmitBtn.textContent = 'Log In';
        authToggleText.innerHTML = 'Don\'t have an account? <a href="#" id="authToggleLink">Sign Up</a>';
        authPasswordInput.placeholder = 'Enter your password';

        // Add forgot password link
        const formGroup = authForm.querySelector('.form-group:last-child');
        if (formGroup && !document.getElementById('forgotPasswordLink')) {
            const forgotDiv = document.createElement('div');
            forgotDiv.className = 'forgot-password';
            forgotDiv.innerHTML = `<a href="#" id="forgotPasswordLink">Forgot password?</a>`;
            formGroup.after(forgotDiv);

            // Add event listener for forgot password
            document.getElementById('forgotPasswordLink').addEventListener('click', function (e) {
                e.preventDefault();
                const email = prompt("Enter your email to reset password:");
                if (email) {
                    alert(`Password reset link sent to ${email} (simulation).\nReal system coming soon.`);
                }
            });
        }
    }

    // Re-attach event listener to new toggle link
    const newToggleLink = document.getElementById('authToggleLink');
    if (newToggleLink) {
        newToggleLink.removeEventListener('click', toggleAuthMode);
        newToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }
}

// Event listeners for opening modal
authModalBtn.addEventListener('click', openAuthModal);
authModalBtnMobile.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    openAuthModal();
});

// Event listeners for closing modal
authModalClose.addEventListener('click', closeAuthModal);
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeAuthModal();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal.classList.contains('active')) {
        closeAuthModal();
    }
});

// Toggle link event listener
authToggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
});

// Form submission with Firebase
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const name = email.split('@')[0]; // Extract name from email
    
    // Show loading state
    const submitBtn = document.getElementById('authSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = isSignUpMode ? 'Signing Up...' : 'Signing In...';

    try {
        // Check if Firebase Auth is available
        if (!window.firebaseAuthFunctions) {
            throw new Error('Firebase Authentication is not loaded. Please refresh the page.');
        }

        let result;
        if (isSignUpMode) {
            result = await window.firebaseAuthFunctions.signUpWithEmail(email, password, name);
        } else {
            result = await window.firebaseAuthFunctions.signInWithEmail(email, password);
        }

        if (result.success) {
            // Reset form and close modal
            authForm.reset();
            closeAuthModal();
            
            // Trigger dashboard with user data
            handleLoginSuccess(result.user);
        } else {
            showError(result.error || 'Authentication failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Auth error:', error);
        showError(error.message || 'An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Google Sign-In with Firebase
async function handleGoogleSignIn() {
    console.log('handleGoogleSignIn called');
    
    try {
        // Check if Firebase Auth is available
        if (!window.firebaseAuthFunctions) {
            throw new Error('Firebase Authentication is not loaded. Please refresh the page.');
        }

        // Show loading state
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'auth-loading';
        loadingMsg.textContent = 'Signing in with Google...';
        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001;';
        document.body.appendChild(loadingMsg);

        const result = await window.firebaseAuthFunctions.signInWithGoogle();
        loadingMsg.remove();

        if (result.success) {
            // Close modal and show dashboard
            closeAuthModal();
            handleLoginSuccess(result.user);
            console.log('Google Sign-In successful');
        } else {
            showError(result.error || 'Failed to sign in with Google');
        }
    } catch (error) {
        console.error('Error in handleGoogleSignIn:', error);
        document.getElementById('auth-loading')?.remove();
        showError(error.message || 'An error occurred during sign-in. Please try again.');
    }
}

// Apple Sign-In with Firebase
async function handleAppleSignIn() {
    console.log('handleAppleSignIn called');
    
    try {
        // Check if Firebase Auth is available
        if (!window.firebaseAuthFunctions) {
            throw new Error('Firebase Authentication is not loaded. Please refresh the page.');
        }

        // Show loading state
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'auth-loading';
        loadingMsg.textContent = 'Signing in with Apple...';
        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001;';
        document.body.appendChild(loadingMsg);

        const result = await window.firebaseAuthFunctions.signInWithApple();
        loadingMsg.remove();

        if (result.success) {
            // Close modal and show dashboard
            closeAuthModal();
            handleLoginSuccess(result.user);
            console.log('Apple Sign-In successful');
        } else {
            showError(result.error || 'Failed to sign in with Apple');
        }
    } catch (error) {
        console.error('Error in handleAppleSignIn:', error);
        document.getElementById('auth-loading')?.remove();
        showError(error.message || 'An error occurred during sign-in. Please try again.');
    }
}

// Helper function to decode JWT token
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Make the function globally accessible for Google's callback
window.handleGoogleSignIn = handleGoogleSignIn;

// Fonctions globales pour les boutons onclick simplifiés - définies immédiatement
window.signInWithGoogle = async function() {
    console.log('signInWithGoogle called');
    if (typeof handleGoogleSignIn === 'function') {
        await handleGoogleSignIn();
    } else {
        console.error('handleGoogleSignIn function not available');
        alert('Erreur: Fonction de connexion Google non disponible. Veuillez rafraîchir la page.');
    }
};

// Initialiser le formulaire dès que possible
(function initSimpleAuthForm() {
    // Essayer immédiatement
    setTimeout(() => {
        const form = document.getElementById('simpleAuthForm');
        if (form && !form.dataset.listenerAdded) {
            form.addEventListener('submit', function(e) {
                console.log('Form submit (immediate init)');
                e.preventDefault();
                e.stopPropagation();
                if (typeof signInWithEmail === 'function') {
                    signInWithEmail(e);
                }
            }, true);
            form.dataset.listenerAdded = 'true';
            console.log('✅ Form listener added (immediate)');
        }
    }, 500);
    
    // Essayer après DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const form = document.getElementById('simpleAuthForm');
                if (form && !form.dataset.listenerAdded) {
                    form.addEventListener('submit', function(e) {
                        console.log('Form submit (DOMContentLoaded)');
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof signInWithEmail === 'function') {
                            signInWithEmail(e);
                        }
                    }, true);
                    form.dataset.listenerAdded = 'true';
                    console.log('✅ Form listener added (DOMContentLoaded)');
                }
            }, 100);
        });
    }
})();

window.signInWithEmail = async function(event) {
    console.log('=== signInWithEmail called ===', event);
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Hide previous error
    const errorMsg = document.getElementById('authErrorMsg');
    if (errorMsg) {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
    }
    
    const emailInput = document.getElementById('simpleEmail');
    const passwordInput = document.getElementById('simplePassword');
    const submitBtn = document.getElementById('simpleSubmitBtn');
    
    console.log('Inputs found:', { 
        emailInput: !!emailInput, 
        passwordInput: !!passwordInput,
        submitBtn: !!submitBtn
    });
    
    if (!emailInput || !passwordInput) {
        console.error('ERROR: Inputs not found!');
        const msg = 'Erreur: Les champs email et mot de passe sont introuvables.';
        if (errorMsg) {
            errorMsg.textContent = msg;
            errorMsg.style.display = 'block';
        } else {
            alert(msg);
        }
        return false;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        const msg = 'Veuillez remplir tous les champs.';
        if (errorMsg) {
            errorMsg.textContent = msg;
            errorMsg.style.display = 'block';
        } else {
            alert(msg);
        }
        return false;
    }
    
    console.log('Attempting sign in with email:', email);
    
    // Disable button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connexion...';
    }
    
    try {
        // Wait for Firebase to be ready
        let waitCount = 0;
        while (!window.firebaseAuthFunctions && waitCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitCount++;
        }
        
        if (!window.firebaseAuthFunctions) {
            throw new Error('Firebase Authentication n\'est pas chargé. Veuillez rafraîchir la page et réessayer.');
        }

        console.log('Calling Firebase signInWithEmail...');
        const result = await window.firebaseAuthFunctions.signInWithEmail(email, password);
        console.log('Firebase result:', result);

        if (result.success) {
            console.log('✅ Sign in successful!');
            if (emailInput.form) emailInput.form.reset();
            closeAuthModal();
            if (typeof handleLoginSuccess === 'function') {
                handleLoginSuccess(result.user);
            } else {
                console.error('handleLoginSuccess function not found!');
                alert('Connexion réussie mais erreur lors de l\'affichage du tableau de bord.');
            }
        } else {
            console.error('❌ Sign in failed:', result.error);
            const msg = result.error || 'Échec de la connexion. Veuillez réessayer.';
            if (errorMsg) {
                errorMsg.textContent = msg;
                errorMsg.style.display = 'block';
            } else {
                alert(msg);
            }
        }
    } catch (error) {
        console.error('❌ Auth error:', error);
        const msg = error.message || 'Une erreur est survenue. Veuillez réessayer.';
        if (errorMsg) {
            errorMsg.textContent = msg;
            errorMsg.style.display = 'block';
        } else {
            alert(msg);
        }
    } finally {
        // Re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            const isSignUp = submitBtn.textContent.includes('inscrire') || submitBtn.textContent.includes('Inscrire');
            submitBtn.textContent = isSignUp ? 'S\'inscrire' : 'Se connecter';
        }
    }
    
    return false;
};

window.signUpWithEmail = async function(event) {
    if (event) {
        event.preventDefault();
    }
    
    const emailInput = document.getElementById('simpleEmail') || document.getElementById('authEmail');
    const passwordInput = document.getElementById('simplePassword') || document.getElementById('authPassword');
    
    if (!emailInput || !passwordInput) {
        showError('Les champs email et mot de passe sont requis.');
        return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    const name = email.split('@')[0];
    
    try {
        if (!window.firebaseAuthFunctions) {
            throw new Error('Firebase Authentication is not loaded. Please refresh the page.');
        }

        const result = await window.firebaseAuthFunctions.signUpWithEmail(email, password, name);

        if (result.success) {
            if (emailInput.form) emailInput.form.reset();
            closeAuthModal();
            handleLoginSuccess(result.user);
        } else {
            showError(result.error || 'Échec de l\'inscription. Veuillez réessayer.');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showError(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    }
};

// Initialize Firebase Authentication buttons
function initGoogleSignIn() {
    // Show Google login button and attach event listeners
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.style.display = 'block';
        googleLoginBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Google login button clicked');
            handleGoogleSignIn();
        };
        console.log('Google login button initialized');
    }
    
    // Handle CTA button
    const googleCtaBtn = document.getElementById('googleCtaBtn');
    if (googleCtaBtn) {
        googleCtaBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Google CTA button clicked');
            handleGoogleSignIn();
        };
    }
    
    // Initialize Apple button
    const appleBtn = document.querySelector('.apple-btn');
    if (appleBtn) {
        appleBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Apple login button clicked');
            handleAppleSignIn();
        };
    }
    
    // Initialize Apple CTA button
    const appleCtaBtn = document.getElementById('appleCtaBtn');
    if (appleCtaBtn) {
        appleCtaBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Apple CTA button clicked');
            handleAppleSignIn();
        };
    }
    
    console.log('Firebase Authentication initialized');
}

// Event delegation for authentication buttons (backup)
document.addEventListener('click', function(e) {
    const clickedElement = e.target;
    
    // Google login button
    if (clickedElement.closest('#googleLoginBtn')) {
        e.preventDefault();
        e.stopPropagation();
        handleGoogleSignIn();
        return false;
    }
    
    // Google CTA button
    if (clickedElement.closest('#googleCtaBtn')) {
        e.preventDefault();
        e.stopPropagation();
        handleGoogleSignIn();
        return false;
    }
    
    // Apple login button
    if (clickedElement.closest('.apple-btn') || clickedElement.closest('#appleCtaBtn')) {
        e.preventDefault();
        e.stopPropagation();
        handleAppleSignIn();
        return false;
    }
}, true);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be ready
    const checkFirebase = setInterval(() => {
        if (window.firebaseAuthFunctions) {
            clearInterval(checkFirebase);
            initGoogleSignIn();
            
            // Monitor auth state changes
            window.firebaseAuthFunctions.onAuthStateChange((user) => {
                if (user && !isLoggedIn) {
                    // User is signed in, show dashboard
                    handleLoginSuccess(user);
                } else if (!user && isLoggedIn) {
                    // User signed out, hide dashboard
                    handleLogout();
                }
            });
            
            // Setup simple auth form - multiple ways to ensure it works
            const simpleAuthForm = document.getElementById('simpleAuthForm');
            if (simpleAuthForm) {
                // Remove any existing listeners
                const newForm = simpleAuthForm.cloneNode(true);
                simpleAuthForm.parentNode.replaceChild(newForm, simpleAuthForm);
                
                // Add new listener
                document.getElementById('simpleAuthForm').addEventListener('submit', function(e) {
                    console.log('Form submit event caught!');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Check if we're in signup mode
                    const submitBtn = document.getElementById('simpleSubmitBtn');
                    const isSignUp = submitBtn && (submitBtn.textContent.includes('inscrire') || submitBtn.textContent.includes('Inscrire'));
                    
                    if (isSignUp) {
                        console.log('Calling signUpWithEmail');
                        if (typeof signUpWithEmail === 'function') {
                            signUpWithEmail(e);
                        } else {
                            console.error('signUpWithEmail function not found!');
                        }
                    } else {
                        console.log('Calling signInWithEmail');
                        if (typeof signInWithEmail === 'function') {
                            signInWithEmail(e);
                        } else {
                            console.error('signInWithEmail function not found!');
                        }
                    }
                }, true); // Use capture phase
                console.log('✅ Simple auth form listener added');
            } else {
                console.warn('⚠️ Simple auth form not found!');
            }
            
            // Setup toggle signup/login link
            const toggleSignUpLink = document.getElementById('toggleSignUpLink');
            const simpleSubmitBtn = document.getElementById('simpleSubmitBtn');
            if (toggleSignUpLink && simpleSubmitBtn) {
                let isSignUpMode = false;
                toggleSignUpLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    isSignUpMode = !isSignUpMode;
                    
                    if (isSignUpMode) {
                        simpleSubmitBtn.textContent = 'S\'inscrire';
                        toggleSignUpLink.textContent = 'Déjà un compte ? Se connecter';
                    } else {
                        simpleSubmitBtn.textContent = 'Se connecter';
                        toggleSignUpLink.textContent = 'Pas de compte ? S\'inscrire';
                    }
                });
            }
        }
    }, 100);
    
    // Also try when window loads (in case script loads late)
    if (document.readyState === 'loading') {
        window.addEventListener('load', function() {
            initGoogleSignIn();
            
            // Setup simple auth form on load as well
            const simpleAuthForm = document.getElementById('simpleAuthForm');
            if (simpleAuthForm) {
                simpleAuthForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    signInWithEmail(e);
                });
            }
        });
    }
});

// Social authentication button handlers are now initialized in initGoogleSignIn()

// Pricing toggle (Monthly/Yearly) - Initialize when DOM is ready
function initPricingToggle() {
    const pricingToggle = document.getElementById('pricingToggle');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');
    const monthlyPeriods = document.querySelectorAll('.monthly-period');
    const yearlyPeriods = document.querySelectorAll('.yearly-period');
    const yearlyBillingTexts = document.querySelectorAll('.yearly-billing');
    const monthlyLabel = document.getElementById('monthlyLabel');
    const yearlyLabel = document.getElementById('yearlyLabel');

    if (!pricingToggle) {
        console.warn('Pricing toggle not found');
        return;
    }

    console.log('Initializing pricing toggle', {
        pricingToggle: !!pricingToggle,
        monthlyPrices: monthlyPrices.length,
        yearlyPrices: yearlyPrices.length
    });

    // Remove any existing listeners by cloning
    const newToggle = pricingToggle.cloneNode(true);
    pricingToggle.parentNode.replaceChild(newToggle, pricingToggle);
    
    // Get the new toggle element
    const toggle = document.getElementById('pricingToggle');
    
    toggle.addEventListener('change', function() {
        console.log('Pricing toggle changed:', this.checked);
        
        if (this.checked) {
            // Show yearly pricing
            monthlyPrices.forEach(price => {
                price.style.display = 'none';
            });
            yearlyPrices.forEach(price => {
                price.style.display = 'inline';
            });
            monthlyPeriods.forEach(period => {
                period.style.display = 'none';
            });
            yearlyPeriods.forEach(period => {
                period.style.display = 'inline';
            });
            yearlyBillingTexts.forEach(text => {
                text.style.display = 'block';
            });

            if (monthlyLabel) monthlyLabel.classList.remove('active');
            if (yearlyLabel) yearlyLabel.classList.add('active');
        } else {
            // Show monthly pricing
            monthlyPrices.forEach(price => {
                price.style.display = 'inline';
            });
            yearlyPrices.forEach(price => {
                price.style.display = 'none';
            });
            monthlyPeriods.forEach(period => {
                period.style.display = 'inline';
            });
            yearlyPeriods.forEach(period => {
                period.style.display = 'none';
            });
            yearlyBillingTexts.forEach(text => {
                text.style.display = 'none';
            });

            if (monthlyLabel) monthlyLabel.classList.add('active');
            if (yearlyLabel) yearlyLabel.classList.remove('active');
        }
    });

    // Set initial state for monthly pricing
    if (monthlyLabel) monthlyLabel.classList.add('active');
    if (yearlyLabel) yearlyLabel.classList.remove('active');
    
    console.log('Pricing toggle initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPricingToggle);
} else {
    initPricingToggle();
}

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    if (!question || !answer) return;

    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close other FAQ items
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
                const otherQuestion = otherItem.querySelector('.faq-question');
                const otherAnswer = otherItem.querySelector('.faq-answer');
                if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
                if (otherAnswer) otherAnswer.setAttribute('aria-hidden', 'true');
            }
        });

        // Toggle current item
        item.classList.toggle('active');
        const newIsActive = !isActive;
        question.setAttribute('aria-expanded', newIsActive.toString());
        answer.setAttribute('aria-hidden', (!newIsActive).toString());
    });
    
    // Initialize ARIA attributes
    question.setAttribute('aria-expanded', 'false');
    answer.setAttribute('aria-hidden', 'true');
});

// Signup form handling (CTA section)
const ctaSignupForm = document.getElementById('ctaSignupForm');

ctaSignupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = ctaSignupForm.querySelector('input[type="email"]').value;
    const name = email.split('@')[0];
    
    // Open auth modal for password entry
    openAuthModal();
    // Pre-fill email
    setTimeout(() => {
        const emailInput = document.getElementById('authEmail');
        if (emailInput) {
            emailInput.value = email;
        }
    }, 100);
});

// Google CTA button handler is now in initGoogleSignIn()

// Apple CTA button handler is now in initGoogleSignIn()

// Toggle login/signup in CTA
const showLoginCtaInitial = document.getElementById('showLoginCta');
if (showLoginCtaInitial) {
    showLoginCtaInitial.addEventListener('click', function toggleLoginSignup(e) {
        e.preventDefault();

        const loginForm = document.getElementById('loginFormCta');
        const signupForm = document.getElementById('ctaSignupForm');
        const socialButtons = document.querySelector('.social-cta-buttons');
        const toggleContainer = document.querySelector('.auth-cta-toggle p');

        if (loginForm && signupForm && socialButtons && toggleContainer) {
            if (loginForm.style.display === 'none' || !loginForm.style.display) {
                // Show login, hide signup
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                socialButtons.style.display = 'none';
                toggleContainer.innerHTML = 'Don\'t have an account? <a href="#" id="showLoginCta">Sign up instead</a>';
            } else {
                // Show signup, hide login
                loginForm.style.display = 'none';
                signupForm.style.display = 'flex';
                socialButtons.style.display = 'flex';
                toggleContainer.innerHTML = 'Already have an account? <a href="#" id="showLoginCta">Log in with email</a>';
            }

            // Re-attach event listener to new link
            const newShowLoginCta = document.getElementById('showLoginCta');
            if (newShowLoginCta) {
                newShowLoginCta.addEventListener('click', toggleLoginSignup);
            }
        }
    });
}

// Login form CTA submission
const loginCtaForm = document.getElementById('loginCtaForm');
if (loginCtaForm) {
    loginCtaForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;

        try {
            if (!window.firebaseAuthFunctions) {
                throw new Error('Firebase Authentication is not loaded. Please refresh the page.');
            }

            const result = await window.firebaseAuthFunctions.signInWithEmail(email, password);
            
            if (result.success) {
                this.reset();
                handleLoginSuccess(result.user);
            } else {
                showError(result.error || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'An error occurred. Please try again.');
        }
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animation on scroll (optional enhancement)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections for animation
document.querySelectorAll('.step, .pricing-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ==================== CONFIGURATION ====================
// ==================== CONFIGURATION ====================
// CONFIG is loaded from config.js

// ==================== UTILITY FUNCTIONS ====================

// Show user-friendly error message
function showError(message, duration = 5000) {
    // Remove existing error message if any
    const existingError = document.getElementById('error-message');
    if (existingError) {
        existingError.remove();
    }

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
        border: 2px solid #fca5a5;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 500px;
        animation: slideDown 0.3s ease;
        color: #991b1b;
        font-weight: 500;
    `;
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="margin-left: auto; background: none; border: none; color: #991b1b; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px;"
                    aria-label="Close error message">×</button>
        </div>
    `;

    // Add animation style if not already added
    if (!document.getElementById('error-animation-style')) {
        const style = document.createElement('style');
        style.id = 'error-animation-style';
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(errorDiv);

    // Auto-remove after duration
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, duration);
}

// ==================== LOGIN STATE ====================
// Login state
let isLoggedIn = false;
let currentUser = null;
let userCredits = CONFIG.DAILY_FREE_CREDITS; // Daily credits
let creditsUsedToday = 0; // Track credits used
let isProcessing = false; // Processing state

// Function to handle successful login
function handleLoginSuccess(userData) {
    isLoggedIn = true;
    currentUser = userData;

    // Hide public elements
    document.querySelector('nav').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.how-it-works').style.display = 'none';
    document.querySelector('.credit-system').style.display = 'none';
    document.querySelector('.pricing').style.display = 'none';
    document.querySelector('.faq').style.display = 'none';
    document.querySelector('.final-cta').style.display = 'none';
    // Footer stays visible on dashboard

    // Show dashboard
    showDashboard();

    // Close modal if open
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Function to display dashboard
function showDashboard() {
    // Remove old dashboard if it exists
    const oldDashboard = document.querySelector('.dashboard-container');
    if (oldDashboard) {
        oldDashboard.remove();
    }

    // Create dashboard HTML
    const dashboardHTML = `
        <div class="dashboard-container">
            <nav class="dashboard-nav">
                <div class="container">
                    <div class="logo">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M16 2L4 9V15C4 22 9 28 16 30C23 28 28 22 28 15V9L16 2Z" fill="#2563eb" stroke="#2563eb" stroke-width="2"/>
                            <path d="M12 16L15 19L21 13" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>ExamSolve</span>
                    </div>
                    <div class="user-menu">
                        <span id="dashboardUserName">${currentUser?.name || 'Student'}</span>
                        <div class="credits-badge" id="creditsBadge">
                            <span>${userCredits}</span> credits
                        </div>
                        <button class="btn-secondary-small" id="logoutBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" 
                                      stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Log Out
                        </button>
                    </div>
                </div>
            </nav>
            
            <main class="dashboard-main">
                <div class="container">
                    <!-- Dashboard Header -->
                    <div class="dashboard-header">
                        <div>
                            <h1>Welcome back, <span id="userName">${currentUser?.name || 'Student'}</span>!</h1>
                            <p class="user-plan">Free Plan • ${userCredits} credits left today (${creditsUsedToday}/${CONFIG.DAILY_FREE_CREDITS} used)</p>
                        </div>
                        <div class="credit-display">
                            <button class="btn-primary-small" id="buyCreditsBtn">Buy More Credits</button>
                        </div>
                    </div>
        
                    <!-- Educational Notice -->
                    <div class="educational-notice">
                        <div class="notice-icon">🎯</div>
                        <div class="notice-content">
                            <h4>Learning-Focused Assistance</h4>
                            <p>ExamSolve is designed to help you <strong>understand</strong> concepts, not just get answers. Our AI will guide you through each step, explain the reasoning, and help you master the material.</p>
                        </div>
                    </div>
        
                    <!-- Question Box -->
                    <div class="question-box">
                        <h2>Get Step-by-Step Help</h2>
                        <!-- New Dropdowns Section -->
                        
                        <!-- Choose Education Level Dropdown -->
                        <div class="dashboard-select-group">
                            <label for="chooseLevel" class="dashboard-select-label">Choose Education Level</label>
                            <select id="chooseLevel" class="dashboard-select">
                                <option value="" disabled selected>-- Select your level --</option>
                                <optgroup label="Primary School">
                                    <option value="grade-1">Grade 1 (Age 6-7)</option>
                                    <option value="grade-2">Grade 2 (Age 7-8)</option>
                                    <option value="grade-3">Grade 3 (Age 8-9)</option>
                                    <option value="grade-4">Grade 4 (Age 9-10)</option>
                                    <option value="grade-5">Grade 5 (Age 10-11)</option>
                                </optgroup>
                                <optgroup label="Middle School">
                                    <option value="grade-6">Grade 6 (Age 11-12)</option>
                                    <option value="grade-7">Grade 7 (Age 12-13)</option>
                                    <option value="grade-8">Grade 8 (Age 13-14)</option>
                                </optgroup>
                                <optgroup label="High School">
                                    <option value="grade-9">Grade 9 / Freshman (Age 14-15)</option>
                                    <option value="grade-10">Grade 10 / Sophomore (Age 15-16)</option>
                                    <option value="grade-11">Grade 11 / Junior (Age 16-17)</option>
                                    <option value="grade-12">Grade 12 / Senior (Age 17-18)</option>
                                </optgroup>
                                <optgroup label="University / College">
                                    <option value="freshman">Freshman (1st Year)</option>
                                    <option value="sophomore">Sophomore (2nd Year)</option>
                                    <option value="junior">Junior (3rd Year)</option>
                                    <option value="senior">Senior (4th Year)</option>
                                    <option value="masters">Master's Degree</option>
                                    <option value="phd">PhD / Doctorate</option>
                                </optgroup>
                                <optgroup label="Professional">
                                    <option value="professional">Professional / Career</option>
                                    <option value="certification">Certification Exam</option>
                                </optgroup>
                            </select>
                        </div>
                        
                        <!-- Choose Subject Dropdown -->
                        <div class="dashboard-select-group">
                            <label for="chooseSubject" class="dashboard-select-label">Choose Subject</label>
                            <select id="chooseSubject" class="dashboard-select">
                                <option value="" disabled selected>-- Select a subject --</option>
                                <optgroup label="Mathematics">
                                    <option value="algebra">Algebra</option>
                                    <option value="geometry">Geometry</option>
                                    <option value="calculus">Calculus</option>
                                    <option value="statistics">Statistics & Probability</option>
                                    <option value="trigonometry">Trigonometry</option>
                                    <option value="linear-algebra">Linear Algebra</option>
                                </optgroup>
                                <optgroup label="Sciences">
                                    <option value="physics">Physics</option>
                                    <option value="chemistry">Chemistry</option>
                                    <option value="biology">Biology</option>
                                    <option value="earth-science">Earth Science</option>
                                    <option value="environmental-science">Environmental Science</option>
                                </optgroup>
                                <optgroup label="Languages">
                                    <option value="english">English</option>
                                    <option value="french">French</option>
                                    <option value="spanish">Spanish</option>
                                    <option value="german">German</option>
                                    <option value="arabic">Arabic</option>
                                </optgroup>
                                <optgroup label="Humanities">
                                    <option value="history">History</option>
                                    <option value="geography">Geography</option>
                                    <option value="philosophy">Philosophy</option>
                                    <option value="economics">Economics</option>
                                    <option value="psychology">Psychology</option>
                                </optgroup>
                                <optgroup label="Computer Science">
                                    <option value="programming">Programming</option>
                                    <option value="web-development">Web Development</option>
                                    <option value="databases">Databases</option>
                                    <option value="algorithms">Algorithms</option>
                                    <option value="machine-learning">Machine Learning</option>
                                </optgroup>
                                <optgroup label="Other">
                                    <option value="business">Business & Finance</option>
                                    <option value="law">Law</option>
                                    <option value="medicine">Medicine & Health</option>
                                    <option value="arts">Arts & Music</option>
                                    <option value="other">Other</option>
                                </optgroup>
                            </select>
                        </div>
                        
                        <textarea id="questionInput" placeholder="Get step-by-step guidance to understand the problem, without direct answers

Describe your specific problem here...

Examples:
• 'I don't understand how to solve quadratic equations'
• 'Can you explain Newton's laws of motion?'
• 'Help me work through this chemistry calculation'

(10 credits per detailed solution)" rows="6"></textarea>
                        
                        <!-- Modern Attachment Area -->
                        <div class="modern-attachment-area" style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            margin-top: 12px;
                            padding: 12px 16px;
                            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                            border: 2px dashed #cbd5e1;
                            border-radius: 12px;
                            transition: all 0.3s ease;
                        ">
                            <button type="button" id="attachFileBtn" style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                padding: 10px 18px;
                                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 0.9rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(37, 99, 235, 0.4)';" 
                               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(37, 99, 235, 0.3)';">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l9.19-9.19"></path>
                                </svg>
                                <span>📎 Attach File</span>
                                <input type="file" id="fileAttachment" style="display: none;" multiple accept="image/*,.pdf,.doc,.docx,.txt">
                            </button>
                            <div style="flex: 1; display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.85rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                <span>Supports: Images, PDF, Word, Text files</span>
                            </div>
                        </div>
                        
                        <!-- Attached Files Display -->
                        <div id="attachedFilesList" style="
                            display: flex;
                            flex-wrap: wrap;
                            gap: 8px;
                            margin-top: 10px;
                        "></div>
                        <div class="question-controls">
                            <button class="btn-primary" id="solveBtn">
                                <span>Get Step-by-Step Help</span>
                                <small>(10 credits)</small>
                            </button>
                        </div>
                    </div>

                    <!-- Solution Display -->
                    <div class="solution-box" id="solutionBox" style="display: none;">
                        <h2>Step-by-Step Solution</h2>
                        <div class="solution-content" id="solutionContent">
                            <!-- Solution will appear here -->
                        </div>
                        <button class="btn-secondary" id="askAnotherBtn">Ask Another Question</button>
                    </div>

                    <!-- History -->
                    <div class="recent-questions">
                        <h2>Recent Questions</h2>
                        <div class="questions-list" id="questionsList">
                            <p class="empty-state">No questions yet. Ask your first question above!</p>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <h3 id="usedCredits">0</h3>
                            <p>Credits used today</p>
                        </div>
                        <div class="stat-card">
                            <h3 id="solvedQuestions">0</h3>
                            <p>Questions solved</p>
                        </div>
                        <div class="stat-card">
                            <h3 id="topSubject">--</h3>
                            <p>Top subject</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    // Insert dashboard BEFORE the footer so footer appears at the bottom
    const footer = document.querySelector('footer');
    footer.insertAdjacentHTML('beforebegin', dashboardHTML);

    // Force display
    document.querySelector('.dashboard-container').style.display = 'block';

    // Add event listeners
    setupDashboardEvents();

    // Initialize question field and subject selection
    setupQuestionField();
    setupSubjectSelection();
}

// Function to handle logout
async function handleLogout() {
    try {
        // Sign out from Firebase
        if (window.firebaseAuthFunctions) {
            await window.firebaseAuthFunctions.signOutUser();
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    isLoggedIn = false;
    currentUser = null;
    userCredits = CONFIG.DAILY_FREE_CREDITS; // Reset credits
    creditsUsedToday = 0; // Reset usage counter

    // Hide dashboard
    if (document.querySelector('.dashboard-container')) {
        document.querySelector('.dashboard-container').remove();
    }

    // Show all public site elements
    document.querySelector('nav').style.display = 'flex';
    document.querySelector('.hero').style.display = 'block';
    document.querySelector('.how-it-works').style.display = 'block';
    document.querySelector('.credit-system').style.display = 'block';
    document.querySelector('.pricing').style.display = 'block';
    document.querySelector('.faq').style.display = 'block';
    document.querySelector('.final-cta').style.display = 'block';
    document.querySelector('footer').style.display = 'block';
}

// ==================== QUESTION PREPARATION ====================

function prepareQuestion(userInput, level) {
    // Validation
    if (!validateQuestion(userInput)) {
        return null;
    }

    // Base instruction
    const baseInstruction = "Get step-by-step guidance to understand the problem, without direct answers: Explain each concept clearly as if I'm learning it for the first time. ";

    // Level-specific instruction
    const levelInstruction = {
        primary: "Use simple language suitable for primary school students. Focus on foundational concepts. ",
        middle: "Use clear explanations suitable for middle school students. Include relevant examples. ",
        high: "Include detailed explanations suitable for high school level. Show formulas and derivations. ",
        university: "Provide in-depth, university-level explanations with advanced theories and applications. "
    };

    // Build final question
    return baseInstruction +
        (levelInstruction[level] || levelInstruction.high) +
        "Here is the specific problem or concept I need help with: " +
        userInput.trim() +
        " Remember: Without ever giving me the solution, guide me to understand the concepts and figure it out myself.";
}

function validateQuestion(question) {
    // Check length
    if (question.trim().length < 15) {
        showError("Please provide more details about your question (at least 15 characters). The more information you give, the better we can help you!");
        return false;
    }

    // Blocked patterns list
    const blockedPatterns = [
        /just give me.?answer/i,
        /what.?s.?answer/i,
        /final.?answer/i,
        /only.?answer/i,
        /cheat|copy|plagiar|cheating/i,
        /do.?for.?me/i,
        /complete.?this/i,
        /finish.?this/i,
        /do.?my.?homework/i,
        /exam.?answer/i,
        /test.?answer/i
    ];

    // Check each pattern
    for (const pattern of blockedPatterns) {
        if (pattern.test(question)) {
            showError("Our service focuses on helping you learn and understand concepts, not just getting answers. Please rephrase your question to ask for explanations and step-by-step guidance instead.");
            return false;
        }
    }

    return true;
}

// Subject mapping for sub-subjects
const subjectMapping = {
    'mathematics': ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry'],
    'sciences': ['Physics', 'Chemistry', 'Biology', 'Earth Science'],
    'languages': ['English', 'French', 'Spanish', 'German'],
    'humanities': ['History', 'Geography', 'Sociology', 'Psychology'],
    'computer-science': ['Programming', 'Data Structures', 'Algorithms', 'Web Development'],
    'business': ['Accounting', 'Finance', 'Marketing', 'Management'],
    'test-prep': ['SAT', 'ACT', 'GRE', 'GMAT'],
    'arts': ['Visual Arts', 'Music', 'Theater', 'Literature'],
    'health': ['Medicine', 'Nursing', 'Pharmacology', 'Anatomy']
};

function setupSubjectSelection() {
    const mainSubject = document.getElementById('mainSubject');
    const subSubjectContainer = document.getElementById('subSubjectContainer');
    const subSubject = document.getElementById('subSubject');

    if (!mainSubject || !subSubjectContainer || !subSubject) return;

    mainSubject.addEventListener('change', function () {
        const selectedSubject = this.value;

        if (selectedSubject && subjectMapping[selectedSubject]) {
            // Clear and populate sub-subject dropdown
            subSubject.innerHTML = '<option value="" disabled selected>Choose a topic...</option>';

            subjectMapping[selectedSubject].forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.toLowerCase().replace(/\s+/g, '-');
                option.textContent = topic;
                subSubject.appendChild(option);
            });

            // Show sub-subject container
            subSubjectContainer.style.display = 'block';
        } else {
            // Hide sub-subject container if no valid subject is selected
            subSubjectContainer.style.display = 'none';
            subSubject.value = '';
        }
    });
}

function setupQuestionField() {
    const textarea = document.getElementById('questionInput');
    if (!textarea) return;

    // Add base instruction on focus
    textarea.addEventListener('focus', function () {
        if (!this.value.includes("Help me understand")) {
            const currentText = this.value.trim();
            if (currentText.length < 50) { // Only if little text
                this.value = "Get step-by-step guidance to understand the problem, without direct answers: " + currentText;
            }
        }
    });

    // Real-time validation
    textarea.addEventListener('input', function () {
        const solveBtn = document.getElementById('solveBtn');
        if (this.value.trim().length >= 15 && userCredits >= 10) {
            solveBtn.disabled = false;
        } else {
            solveBtn.disabled = true;
        }
    });
}

// ==================== CREDITS MANAGEMENT ====================

function updateCreditsDisplay() {
    const badge = document.getElementById('creditsBadge');
    if (badge) {
        badge.innerHTML = `<span>${userCredits}</span> credits`;

        // Change color if credits are low
        if (userCredits < CONFIG.CREDITS_PER_QUESTION) {
            badge.style.background = '#fef3c7';
            badge.style.color = '#92400e';
        } else {
            badge.style.background = '';
            badge.style.color = '';
        }
    }

    const solveBtn = document.getElementById('solveBtn');
    if (solveBtn) {
        if (userCredits < CONFIG.CREDITS_PER_QUESTION) {
            solveBtn.disabled = true;
            solveBtn.innerHTML = '<span>Credits Exhausted</span><small>Upgrade for more</small>';
            solveBtn.style.background = '#9ca3af';
            solveBtn.style.cursor = 'not-allowed';

            // Add warning message
            showCreditWarning();
        } else {
            solveBtn.disabled = false;
            solveBtn.innerHTML = `<span>Get Step-by-Step Help</span><small>(${CONFIG.CREDITS_PER_QUESTION} credits)</small>`;
            solveBtn.style.background = '';
            solveBtn.style.cursor = 'pointer';

            // Remove warning if it exists
            const warning = document.getElementById('creditWarning');
            if (warning) {
                warning.remove();
            }
        }
    }
}

function deductCredits(amount) {
    if (userCredits >= amount) {
        userCredits -= amount;
        creditsUsedToday += amount;
        updateCreditsDisplay();
        updateDashboardHeader();
        updateStats('credits', amount);
        return true;
    } else {
        // CREDITS EXHAUSTED: redirect to pricing plans
        showError('You\'ve used all your daily credits! Upgrade to a paid plan for unlimited access to continue learning.');

        // Hide dashboard
        document.querySelector('.dashboard-container').style.display = 'none';

        // Show pricing section
        document.querySelector('.pricing').style.display = 'block';
        document.querySelector('nav').style.display = 'flex';
        document.querySelector('footer').style.display = 'block';

        // Scroll to pricing plans
        setTimeout(() => {
            window.location.hash = '#pricing';
            document.querySelector('#pricing').scrollIntoView({ behavior: 'smooth' });
        }, 500);

        return false;
    }
}

function updateDashboardHeader() {
    const header = document.querySelector('.dashboard-header');
    if (header) {
        const creditInfo = header.querySelector('.user-plan');
        if (creditInfo) {
            creditInfo.innerHTML = `Free Plan • ${userCredits} credits left today (${creditsUsedToday}/${CONFIG.DAILY_FREE_CREDITS} used)`;
        }
    }
}

function showCreditWarning() {
    // Remove previous warning if it exists
    const oldWarning = document.querySelector('.credit-warning');
    if (oldWarning) oldWarning.remove();

    // Create warning message
    const warningHTML = `
        <div class="credit-warning" style="
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 2px solid #f59e0b;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        ">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">🎯 Daily Credits Used Up!</h3>
            <p style="color: #78350f; margin: 0 0 15px 0;">
                You've used all ${CONFIG.DAILY_FREE_CREDITS} free daily credits. Upgrade now for unlimited access!
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="upgradeNowBtn" style="
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                ">Upgrade Plan</button>
                <button id="learnMoreBtn" style="
                    background: white;
                    color: #2563eb;
                    border: 2px solid #2563eb;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                ">Learn More</button>
            </div>
        </div>
    `;

    // Insert warning before question box
    const questionBox = document.querySelector('.question-box');
    if (questionBox) {
        questionBox.insertAdjacentHTML('beforebegin', warningHTML);

        // Add event listeners to buttons
        document.getElementById('upgradeNowBtn').addEventListener('click', function () {
            handleLogout(); // Return to site
            setTimeout(() => {
                window.location.hash = '#pricing';
                document.querySelector('#pricing').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        document.getElementById('learnMoreBtn').addEventListener('click', function () {
            handleLogout();
        });
    }
}

// ==================== DASHBOARD EVENTS ====================

function setupDashboardEvents() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Solve button - NEW API INTEGRATION
    document.getElementById('solveBtn').addEventListener('click', async function () {
        const rawQuestion = document.getElementById('questionInput').value.trim();

        // Get values from the new dropdown menus
        const chooseLevel = document.getElementById('chooseLevel');
        const chooseSubject = document.getElementById('chooseSubject');

        const selectedLevel = chooseLevel ? chooseLevel.value : '';
        const selectedSubject = chooseSubject ? chooseSubject.value : '';

        // Validate education level selection
        if (!selectedLevel) {
            showError("Please select your education level to get the best help tailored to your level.");
            chooseLevel?.focus();
            return;
        }

        // Validate subject selection
        if (!selectedSubject) {
            showError("Please select a subject so we can provide the most relevant explanation.");
            chooseSubject?.focus();
            return;
        }

        if (!rawQuestion || rawQuestion.length < 10) {
            showError("Please provide more details about your question (at least 10 characters). The more information you give, the better we can help!");
            document.getElementById('questionInput')?.focus();
            return;
        }

        // Get text labels for the selected options
        const levelText = chooseLevel.options[chooseLevel.selectedIndex].text;
        const subjectText = chooseSubject.options[chooseSubject.selectedIndex].text;

        // Prepare question with educational instruction, education level, and subjects
        const instructionalPrefix = `Get step-by-step guidance to understand the problem, without direct answers. 
I'm a student at ${levelText} level, studying ${subjectText}. 
Please explain each concept clearly and adapt your explanation to my education level. `;
        const fullQuestion = instructionalPrefix + "Here's my specific question: " + rawQuestion;

        // Get attached files content from stored data
        let fileContent = '';

        if (window.attachedFilesData && window.attachedFilesData.length > 0) {
            fileContent = '\n\n--- ATTACHED FILES ---\n';

            for (const fileData of window.attachedFilesData) {
                fileContent += `\n📎 File: ${fileData.name} (${(fileData.size / 1024).toFixed(1)} KB)\n`;

                // For text files, include the actual content
                if (fileData.type.startsWith('text/') || fileData.name.endsWith('.txt') || fileData.name.endsWith('.md')) {
                    fileContent += `Content:\n${fileData.content}\n`;
                }
                // For images, mention that an image was attached
                else if (fileData.type.startsWith('image/')) {
                    fileContent += `[Image attached - Please describe the image content if relevant to your question]\n`;
                }
                // For other files like PDFs, just mention they're attached
                else {
                    fileContent += `[Document attached - Type: ${fileData.type}]\n`;
                }

                fileContent += '---\n';
            }
        }

        // Add file content to the question if available
        const finalQuestion = fullQuestion + fileContent;

        // Call API
        const success = await callDevstralAPI(finalQuestion, selectedLevel);

        if (success) {
            // Update stats
            updateStats();

            // Clear attached files list and stored data
            const attachedFilesList = document.getElementById('attachedFilesList');
            attachedFilesList.innerHTML = '';
            window.attachedFilesData = [];
        }
    });

    // Attachment button functionality
    document.getElementById('attachFileBtn').addEventListener('click', function () {
        document.getElementById('fileAttachment').click();
    });

    // Store attached files with their content
    window.attachedFilesData = [];

    // Handle file selection
    document.getElementById('fileAttachment').addEventListener('change', function (e) {
        const files = Array.from(e.target.files);
        const attachedFilesList = document.getElementById('attachedFilesList');

        files.forEach(file => {
            // Read file content
            const reader = new FileReader();
            const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            reader.onload = function (event) {
                const fileData = {
                    id: fileId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: event.target.result
                };

                // Store file data
                window.attachedFilesData.push(fileData);
            };

            // Read as text for text files, base64 for images
            if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                reader.readAsText(file);
            } else if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsDataURL(file);
            }

            // Determine icon based on file type
            let fileIcon = '📄';
            if (file.type.startsWith('image/')) fileIcon = '🖼️';
            else if (file.name.endsWith('.pdf')) fileIcon = '📕';
            else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) fileIcon = '📘';
            else if (file.name.endsWith('.txt')) fileIcon = '📝';

            // Create file item element with modern styling
            const fileItem = document.createElement('div');
            fileItem.className = 'attached-file-item';
            fileItem.dataset.fileId = fileId;
            fileItem.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border: 1px solid #93c5fd;
                border-radius: 20px;
                font-size: 0.85rem;
                color: #1e40af;
                animation: fadeIn 0.3s ease;
            `;
            fileItem.innerHTML = `
                <span class="file-icon">${fileIcon}</span>
                <span class="file-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
                <span style="color: #64748b; font-size: 0.75rem;">(${(file.size / 1024).toFixed(1)} KB)</span>
                <button type="button" class="remove-file" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                " title="Remove file">×</button>
            `;

            // Add to list
            attachedFilesList.appendChild(fileItem);

            // Add remove functionality
            const removeBtn = fileItem.querySelector('.remove-file');
            removeBtn.addEventListener('click', function () {
                // Remove from stored data
                window.attachedFilesData = window.attachedFilesData.filter(f => f.id !== fileId);
                fileItem.remove();
            });
        });

        // Clear the file input so the same file can be selected again
        e.target.value = '';
    });

    // Ask Another button
    document.getElementById('askAnotherBtn').addEventListener('click', function () {
        document.getElementById('solutionBox').style.display = 'none';
        document.getElementById('questionInput').value = '';
        document.querySelector('.question-box').style.display = 'block';
    });

    // Buy Credits button
    document.getElementById('buyCreditsBtn').addEventListener('click', function () {
        alert("Redirecting to pricing page...");
        // In production, redirect to /#pricing
        handleLogout(); // For this example, return to site
    });

    // Add solution styles
    addSolutionStyles();
}

// ==================== API INTEGRATION ====================

// Main API call function
async function callDevstralAPI(question, level) {
    if (isProcessing) return false;

    const solveBtn = document.getElementById('solveBtn');
    const questionInput = document.getElementById('questionInput');

    // Validate question
    if (!validateQuestion(question)) return false;

    // Check and deduct credits
    if (!deductCredits(CONFIG.CREDITS_PER_QUESTION)) return false;

    // Processing state
    isProcessing = true;
    solveBtn.innerHTML = '🔍 Analyzing...';
    solveBtn.disabled = true;
    questionInput.disabled = true;

    try {
        let solution;

        if (CONFIG.USE_MOCK_API) {
            // Mock API while waiting for backend
            solution = await mockDevstralAPI(question, level);
        } else {
            // Real Devstral API
            solution = await callDevstralAPIEndpoint(question, level);
        }

        // Display solution
        displaySolution(solution, question);

        // Save to history
        addToHistory(question, solution);

        return true;

    } catch (error) {
        console.error('API Error, switching to mock:', error);

        // Explain to user we are switching to offline/backup mode
        showError('The AI service is temporarily unavailable. Switching to demo mode so you can see how it works.');

        try {
            // Fallback to Mock API
            const solution = await mockDevstralAPI(question, level);
            displaySolution(solution, question);
            addToHistory(question, solution);
            return true;
        } catch (mockError) {
            showError('Sorry, we couldn\'t process your request. Please try again later or contact support if the problem persists.');
            userCredits += CONFIG.CREDITS_PER_QUESTION;
            creditsUsedToday -= CONFIG.CREDITS_PER_QUESTION;
            updateCreditsDisplay();
            updateDashboardHeader();
            return false;
        }
    } finally {
        // Reset interface
        isProcessing = false;
        solveBtn.innerHTML = `<span>Get Step-by-Step Help</span><small>(${CONFIG.CREDITS_PER_QUESTION} credits)</small>`;
        solveBtn.disabled = userCredits < CONFIG.CREDITS_PER_QUESTION;
        questionInput.disabled = false;
    }
}

// Mock API (simulated)
async function mockDevstralAPI(question, level) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Detect subject
    const subject = detectSubject(question);

    // Generate subject-specific response
    return generateSubjectResponse(subject, question, level);
}

// Function to call the actual Devstral API
async function callDevstralAPIEndpoint(question, level) {
    try {
        // You'll need to replace this URL with the actual Devstral API endpoint
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', { // OpenRouter API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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', // Your API key
                'HTTP-Referer': window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'http://localhost', // Fallback for file:// protocol
                'X-Title': 'ExamSolve',
            },
            body: JSON.stringify({
                model: 'mistralai/mistral-7b-instruct:free', // Using a more stable free model
                messages: [
                    {
                        "role": "user",
                        "content": question
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;
            throw new Error(`API error (${response.status}): ${errorMessage}`);
        }

        const data = await response.json();

        // Convert OpenRouter response to our expected format
        if (data.choices && data.choices.length > 0) {
            // Extract the response content
            const content = data.choices[0].message.content;

            // Simple parsing of the content into steps (you might need to adjust this based on actual response)
            // For now, we'll return a single step with the full content
            const steps = [{
                title: "Solution",
                explanation: "Here's your step-by-step solution:",
                details: content
            }];

            // Return in the expected format
            return {
                success: true,
                steps: steps,
                tips: ["Review the solution carefully", "Ask if you need clarification on any step"]
            };
        } else {
            throw new Error('No response from AI model');
        }
    } catch (error) {
        console.error('Devstral API Error:', error);
        // Return a formatted error response that matches your solution format
        return {
            success: false,
            error: error.message,
            steps: [{
                title: "Error",
                explanation: "Sorry, we couldn't process your request.",
                details: "Please try again later or contact support."
            }],
            tips: []
        };
    }
}

// Subject detection
function detectSubject(question) {
    const q = question.toLowerCase();
    if (q.includes('math') || q.includes('calcul') || q.includes('equation') || q.includes('algebra') || /\d+[\+\-\*\/]/.test(q)) {
        return 'math';
    } else if (q.includes('science') || q.includes('physics') || q.includes('chemistry') || q.includes('biology')) {
        return 'science';
    } else if (q.includes('language') || q.includes('grammar') || q.includes('writing') || q.includes('essay')) {
        return 'language';
    } else if (q.includes('history') || q.includes('geography') || q.includes('social')) {
        return 'history';
    }
    return 'general';
}

// Generate subject-specific responses
function generateSubjectResponse(subject, question, level) {
    const generators = {
        math: generateMathSolution,
        science: generateScienceSolution,
        language: generateLanguageSolution,
        history: generateHistorySolution,
        general: generateGeneralSolution
    };

    return generators[subject](question, level);
}

function generateMathSolution(question, level) {
    return {
        success: true,
        steps: [
            {
                title: "Mathematical Problem Analysis",
                explanation: `We have: "${question.substring(0, 100)}..."`,
                details: "Let's identify the variables and what is being asked. We need to understand the given information and the unknown we're solving for."
            },
            {
                title: "Appropriate Formula",
                explanation: `${getLevelLabel(level)} level: Applying the adapted method.`,
                details: level === 'university' ?
                    "For this type of problem, we use advanced mathematical principles:\n• Calculus or Linear Algebra\n• Complex theorem applications\n• Rigorous proofs" :
                    level === 'high' ?
                        "For this problem, we apply:\n• Algebraic formulas\n• Geometric theorems\n• Mathematical operations" :
                        "For this problem, we use:\n• Basic arithmetic\n• Simple formulas\n• Step-by-step logic"
            },
            {
                title: "Step-by-Step Calculation",
                explanation: "Let's detail each step:",
                details: "1. Isolate the variable\n2. Apply the operation\n3. Simplify the expression\n4. Calculate the result\n5. Verify the answer makes sense"
            },
            {
                title: "Solution and Verification",
                explanation: "The result is obtained by following the logic.",
                details: "Answer: [Calculated example]\n\nVerification: We substitute back into the original equation to confirm our answer is correct. Always check your work!"
            },
            {
                title: "Key Mathematical Concepts",
                explanation: "What you should remember:",
                details: "• Understand the formula's purpose\n• Know when to apply each method\n• Practice similar problems\n• Check your units and reasonableness"
            }
        ],
        tips: [
            "Practice 5 similar problems to master the concept",
            "Review key formulas and when to use them",
            "Always check your units and verify the answer makes sense",
            "Draw diagrams when possible to visualize the problem"
        ]
    };
}

function generateScienceSolution(question, level) {
    return {
        success: true,
        steps: [
            {
                title: "Understanding the Scientific Concept",
                explanation: "Explanation of the phenomenon...",
                details: "The principles involved are fundamental to understanding this concept. Let's break down the scientific theory behind this question."
            },
            {
                title: "Applying Scientific Laws",
                explanation: "Using appropriate theories and principles.",
                details: level === 'university' ?
                    "Advanced concepts:\n• Quantum mechanics\n• Thermodynamics\n• Advanced molecular theory" :
                    level === 'high' ?
                        "Core principles:\n• Newton's Laws\n• Energy Conservation\n• Chemical reactions\n• Biological processes" :
                        "Basic concepts:\n• Simple cause and effect\n• Observable phenomena\n• Basic scientific method"
            },
            {
                title: "Methodical Resolution",
                explanation: "Systematic approach:",
                details: "Scientific Method:\n\n1. Observation - What do we see?\n2. Question - What are we asking?\n3. Hypothesis - What do we predict?\n4. Experiment/Analysis - How do we test?\n5. Conclusion - What did we learn?"
            },
            {
                title: "Detailed Explanation",
                explanation: "Here's the complete scientific reasoning:",
                details: "We apply the relevant scientific principles step by step. Each stage builds on the previous one, showing how scientific knowledge interconnects."
            },
            {
                title: "Scientific Insights",
                explanation: "Key takeaways:",
                details: "• Understand the underlying principles\n• See how theories apply to real situations\n• Connect concepts across topics\n• Think like a scientist"
            }
        ],
        tips: [
            "Draw diagrams and schematics to visualize concepts",
            "Relate to real-world examples you've experienced",
            "Understand the 'why' not just the 'how'",
            "Review related concepts to see connections"
        ]
    };
}

function generateLanguageSolution(question, level) {
    return {
        success: true,
        steps: [
            {
                title: "Understanding the Language Question",
                explanation: `Analyzing: "${question.substring(0, 100)}..."`,
                details: "Let's identify the grammar rules, vocabulary, or writing techniques needed for this question."
            },
            {
                title: "Grammar and Structure",
                explanation: "Applying language rules:",
                details: "Key grammar points:\n• Sentence structure\n• Parts of speech\n• Tenses and agreement\n• Proper punctuation"
            },
            {
                title: "Step-by-Step Analysis",
                explanation: "Breaking down the language elements:",
                details: "1. Identify the main components\n2. Apply grammar rules\n3. Check for clarity and correctness\n4. Refine and improve\n5. Verify the final version"
            },
            {
                title: "Best Practices",
                explanation: "Language tips and techniques:",
                details: "• Use clear, concise language\n• Vary sentence structure\n• Choose precise vocabulary\n• Proofread carefully"
            }
        ],
        tips: [
            "Read the sentence aloud to check if it sounds right",
            "Review grammar rules in context",
            "Practice writing regularly",
            "Read quality examples to improve your skills"
        ]
    };
}

function generateHistorySolution(question, level) {
    return {
        success: true,
        steps: [
            {
                title: "Historical Context",
                explanation: "Understanding the time period and setting...",
                details: "Let's examine the historical background, key figures, and important events related to this question."
            },
            {
                title: "Key Events and Causes",
                explanation: "What led to this historical moment?",
                details: "Important factors:\n• Political situation\n• Economic conditions\n• Social movements\n• Key individuals involved"
            },
            {
                title: "Analyzing the Impact",
                explanation: "What were the consequences?",
                details: "Short-term effects:\n• Immediate changes\n• Direct impacts\n\nLong-term effects:\n• Lasting influence\n• Historical significance"
            },
            {
                title: "Historical Connections",
                explanation: "How this relates to broader history:",
                details: "Understanding cause and effect relationships helps us see how historical events connect and influence each other across time."
            }
        ],
        tips: [
            "Create a timeline to visualize events",
            "Think about cause and effect relationships",
            "Consider multiple perspectives",
            "Connect to modern-day parallels"
        ]
    };
}

function generateGeneralSolution(question, level) {
    return {
        success: true,
        steps: [
            {
                title: "Understanding Your Question",
                explanation: `You asked about: "${question.substring(0, 100)}..."`,
                details: "Let me break down what this problem is asking. The key elements we need to identify are the given information, what we're solving for, and the best approach to use."
            },
            {
                title: "Relevant Concepts",
                explanation: `For this ${level} level problem, we need to recall:`,
                details: level === 'university' ?
                    "1. Advanced theoretical concepts\n2. Complex formulas and derivations\n3. Rigorous problem-solving methodology" :
                    level === 'high' ?
                        "1. Core principles and theorems\n2. Key formulas\n3. Systematic problem-solving approach" :
                        "1. Fundamental concepts\n2. Basic formulas\n3. Simple step-by-step method"
            },
            {
                title: "Step-by-Step Solution",
                explanation: "Let's solve this methodically:",
                details: "1. First, we identify and list all known values\n2. Next, we determine which formula or method applies\n3. Then, we substitute values and calculate step by step\n4. Finally, we verify our answer makes sense"
            },
            {
                title: "Detailed Explanation",
                explanation: "Here's the complete solution:",
                details: "Based on the problem requirements, we apply our chosen method carefully. Each step builds upon the previous one to ensure complete understanding. The key is to follow the logical progression and verify each calculation."
            },
            {
                title: "Key Takeaways",
                explanation: "What you should remember:",
                details: "1. The methodology matters more than memorizing the answer\n2. Always verify your result\n3. Practice similar problems to reinforce understanding\n4. Focus on the 'why' behind each step, not just the 'how'"
            }
        ],
        tips: [
            "Try solving a similar problem on your own to test your understanding",
            "Review this solution again in 24 hours to reinforce learning",
            "Focus on understanding the method, not just memorizing steps",
            "Ask yourself: 'Could I explain this to someone else?'"
        ]
    };
}

// Real backend API call
async function callRealBackendAPI(question, level) {
    const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Your backend will add the Devstral API key
        },
        body: JSON.stringify({
            question: question,
            level: level,
            userId: currentUser?.id || 'anonymous',
            creditsUsed: CONFIG.CREDITS_PER_QUESTION
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
}

// Display solution
function displaySolution(solutionData, originalQuestion) {
    const solutionBox = document.getElementById('solutionBox');
    const solutionContent = document.getElementById('solutionContent');

    if (!solutionData || !solutionData.steps) {
        solutionContent.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Unable to generate solution</h3>
                <p>Please try rephrasing your question or contact support.</p>
            </div>
        `;
        solutionBox.style.display = 'block';
        return;
    }

    let html = `
        <div class="solution-header">
            <h3>🎯 Step-by-Step Explanation</h3>
            <p class="solution-meta">${getLevelLabel(document.getElementById('chooseLevel').value)} Level • Generated just now</p>
        </div>
    `;

    // Add each step
    solutionData.steps.forEach((step, index) => {
        html += `
            <div class="solution-step">
                <div class="step-number">Step ${index + 1}</div>
                <div class="step-content">
                    <h4>${step.title}</h4>
                    <p>${step.explanation}</p>
                    ${step.details ? `<div class="step-details">${step.details.replace(/\n/g, '<br>')}</div>` : ''}
                </div>
            </div>
        `;
    });

    // Add learning tips
    if (solutionData.tips && solutionData.tips.length > 0) {
        html += `
            <div class="learning-tips">
                <h4>💡 Learning Tips</h4>
                <ul>
                    ${solutionData.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Add disclaimer
    html += `
        <div class="solution-disclaimer">
            <small>ℹ️ This AI-generated solution is for educational purposes. Always verify with your teacher or textbook.</small>
        </div>
    `;

    solutionContent.innerHTML = html;
    document.querySelector('.question-box').style.display = 'none';
    solutionBox.style.display = 'block';

    // Scroll to solution
    setTimeout(() => {
        solutionBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Utility functions
function getLevelLabel(level) {
    const labels = {
        primary: 'Primary School',
        middle: 'Middle School',
        high: 'High School',
        university: 'University'
    };
    return labels[level] || 'High School';
}

// Add dynamic CSS for solution display
function addSolutionStyles() {
    if (!document.querySelector('#solution-styles')) {
        const styles = `
            <style id="solution-styles">
                .subject-selection {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .subject-selection {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .subject-group, .level-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    width: 100%;
                    margin-bottom: 0;
                    min-width: 0;
                }
                
                #subSubjectContainer {
                    min-width: 0;
                    width: 100%;
                }
                
                .subject-group label, .level-group label {
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 0.9rem;
                    margin: 0;
                    padding: 0;
                }
                
                .subject-group select, .level-group select {
                    padding: 0.75rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: inherit;
                    background: white;
                    cursor: pointer;
                    transition: border-color 0.3s;
                    width: 100%;
                    box-sizing: border-box;
                    margin: 0;
                }
                
                .subject-group select:focus {
                    outline: none;
                    border-color: #2563eb;
                }
                
                .subject-group select:disabled {
                    background-color: #f9fafb;
                    color: #9ca3af;
                    cursor: not-allowed;
                }
                
                @media (min-width: 768px) {
                    .subject-selection {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: stretch; /* Align items to stretch */
                    }
                    
                    .subject-group {
                        flex: 0 0 auto;
                        min-width: 0; /* Prevent flex items from overflowing */
                        align-self: stretch; /* Align to stretch */
                    }
                }
                
                .subject-group select:focus {
                    outline: none;
                    border-color: #2563eb;
                }
                
                .subject-group select:disabled {
                    background-color: #f9fafb;
                    color: #9ca3af;
                    cursor: not-allowed;
                }
                
                .solution-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e5e7eb;
                }
                .solution-header h3 {
                    margin: 0 0 0.5rem 0;
                    color: #1e293b;
                }
                .solution-meta {
                    color: #64748b;
                    font-size: 0.9rem;
                    margin: 0;
                }
                .solution-step {
                    border-left: 4px solid #2563eb;
                    padding: 1rem 0 1rem 1rem;
                    margin-bottom: 1.5rem;
                    background: #f8fafc;
                    border-radius: 0 8px 8px 0;
                }
                .step-number {
                    display: inline-block;
                    background: #2563eb;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }
                .step-content h4 {
                    margin: 0.5rem 0;
                    color: #1e293b;
                    font-size: 1.1rem;
                }
                .step-content p {
                    margin: 0.5rem 0;
                    color: #475569;
                }
                .step-details {
                    background: white;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-top: 0.75rem;
                    border: 1px solid #e5e7eb;
                    font-family: 'Courier New', monospace;
                    font-size: 0.95rem;
                    line-height: 1.6;
                }
                .learning-tips {
                    background: #f0f9ff;
                    border: 2px solid #0ea5e9;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                }
                .learning-tips h4 {
                    color: #0369a1;
                    margin-top: 0;
                }
                .learning-tips ul {
                    padding-left: 1.5rem;
                    margin: 0.5rem 0 0 0;
                }
                .learning-tips li {
                    margin-bottom: 0.5rem;
                    color: #0c4a6e;
                }
                .solution-disclaimer {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-top: 2rem;
                    text-align: center;
                }
                .solution-disclaimer small {
                    color: #92400e;
                }
                .error-message {
                    background: #fef2f2;
                    border: 2px solid #dc2626;
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                }
                .error-message h3 {
                    color: #991b1b;
                    margin-top: 0;
                }
                .error-message p {
                    color: #7f1d1d;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Add logout button CSS
    if (!document.querySelector('#logout-btn-css')) {
        const logoutCSS = `
            <style id="logout-btn-css">
                .btn-secondary-small {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    color: #6b7280;
                    font-weight: 500;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                
                .btn-secondary-small:hover {
                    background: #fee2e2;
                    border-color: #fca5a5;
                    color: #dc2626;
                    transform: translateY(-1px);
                }
                
                .btn-secondary-small svg {
                    width: 16px;
                    height: 16px;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', logoutCSS);
    }
}

function addToHistory(question, solutionData = null) {
    const historyList = document.getElementById('questionsList');
    const historyItem = document.createElement('div');

    // Store the solution data in the element's dataset
    historyItem.className = 'question-item';
    historyItem.dataset.question = question;
    if (solutionData) {
        historyItem.dataset.solution = JSON.stringify(solutionData);
    }

    historyItem.innerHTML = `
        <p class="question-preview">${question.substring(0, 80)}${question.length > 80 ? '...' : ''}</p>
        <div class="question-meta">
            <span class="subject">Mathematics</span>
            <span class="date">Just now</span>
        </div>
        <button class="btn-secondary-small view-solution-btn">View Solution</button>
    `;

    // Add click event to the View Solution button
    const viewBtn = historyItem.querySelector('.view-solution-btn');
    viewBtn.addEventListener('click', function () {
        const storedSolution = historyItem.dataset.solution;
        const storedQuestion = historyItem.dataset.question;

        if (storedSolution) {
            const solutionData = JSON.parse(storedSolution);
            displaySolution(solutionData, storedQuestion);
        }
    });

    // Replace empty message if it's the first question
    if (historyList.querySelector('.empty-state')) {
        historyList.innerHTML = '';
    }

    historyList.prepend(historyItem);
}

function updateStats() {
    const usedCredits = document.getElementById('usedCredits');
    const solvedQuestions = document.getElementById('solvedQuestions');

    if (usedCredits) {
        usedCredits.textContent = parseInt(usedCredits.textContent) + 10;
    }

    if (solvedQuestions) {
        solvedQuestions.textContent = parseInt(solvedQuestions.textContent) + 1;
    }
}

// Make handleLoginSuccess available globally for authentication callbacks
window.handleLoginSuccess = handleLoginSuccess;

// ==================== COMPLETE CORRECTION SCRIPT ====================
// To execute AFTER DOM loading or integrate into existing script.js

document.addEventListener('DOMContentLoaded', function () {
    // ==================== CORRECTION 1: CSS DASHBOARD ====================
    // Replace CSS rule that hides dashboard
    const dashboardCSSFix = document.createElement('style');
    dashboardCSSFix.id = 'dashboard-css-fix';
    dashboardCSSFix.textContent = `
        .dashboard-container {
            display: block !important;
        }
        
        /* Remove duplicate CSS */
        .subject-selection:nth-of-type(1),
        .subject-group:nth-of-type(1),
        .level-group:nth-of-type(1) {
            display: none;
        }
    `;
    document.head.appendChild(dashboardCSSFix);

    // ==================== CORRECTION 2: PATCH FOR SHOWDASHBOARD ====================
    // Save original function
    const originalShowDashboard = window.showDashboard;

    // Replace with corrected version
    window.showDashboard = function () {
        // Call original function
        if (typeof originalShowDashboard === 'function') {
            originalShowDashboard();
        }

        // Wait for dashboard to render
        setTimeout(() => {
            // ==================== CORRECTION 3: DUPLICATE educationLevel ID ====================
            const educationLevels = document.querySelectorAll('#educationLevel');
            if (educationLevels.length > 1) {
                // Keep first one, rename others
                educationLevels.forEach((el, index) => {
                    if (index > 0) {
                        el.id = 'questionLevel_' + index;
                        el.name = 'questionLevel_' + index;
                    }
                });

                // Update event listener to use correct select
                const solveBtn = document.getElementById('solveBtn');
                const questionLevelSelect = document.querySelector('#educationLevel');

                if (solveBtn && questionLevelSelect) {
                    // Remove old listener
                    const newSolveBtn = solveBtn.cloneNode(true);
                    solveBtn.parentNode.replaceChild(newSolveBtn, solveBtn);

                    // Add corrected event listener
                    newSolveBtn.addEventListener('click', async function () {
                        const rawQuestion = document.getElementById('questionInput').value.trim();
                        const level = questionLevelSelect.value;
                        const mainSubject = document.getElementById('mainSubject').value;
                        const subSubject = document.getElementById('subSubject').value;

                        // Call corrected API function
                        await callDevstralAPICorrected(rawQuestion, level, mainSubject, subSubject);
                    });
                }
            }

            // ==================== CORRECTION 4: CREDITS DISPLAY UPDATE ====================
            updateCreditsDisplayCorrected();

            // ==================== CORRECTION 5: CREDITS TEXT CORRECTION ====================
            const authSubtitle = document.getElementById('authSubtitle');
            if (authSubtitle) {
                authSubtitle.textContent = 'Sign up to get your 100 free credits daily';
            }

        }, 100);
    };

    // ==================== CORRECTION 6: CORRECTED API FUNCTION ====================
    async function callDevstralAPICorrected(question, level, mainSubject, subSubject) {
        console.log("API call with parameters:", { question, level, mainSubject, subSubject });

        // Use original function if exists
        if (typeof callDevstralAPI === 'function') {
            // Prepare question correctly
            const levelText = getLevelLabelCorrected(level);
            const subjectText = getSubjectText(mainSubject);
            const subSubjectText = subSubject ? getSubSubjectText(subSubject) : '';

            let subjectInfo = `I'm studying ${subjectText}`;
            if (subSubjectText) {
                subjectInfo += ` - specifically ${subSubjectText}`;
            }

            const instructionalPrefix = `Get step-by-step guidance to understand the problem, without direct answers: I'm in ${levelText}. ${subjectInfo}. Explain each concept clearly. Here's my specific question: `;
            const fullQuestion = instructionalPrefix + question;

            return await callDevstralAPI(fullQuestion, level);
        }

        return null;
    }

    // ==================== CORRECTION 7: CORRECTED UPDATE STATS FUNCTION ====================
    window.updateStats = function (type = null, value = null) {
        const usedCredits = document.getElementById('usedCredits');
        const solvedQuestions = document.getElementById('solvedQuestions');

        if (type === 'credits' && usedCredits) {
            usedCredits.textContent = parseInt(usedCredits.textContent || '0') + (value || 10);
        } else if (!type && solvedQuestions) {
            solvedQuestions.textContent = parseInt(solvedQuestions.textContent || '0') + 1;
        }
    };

    // ==================== CORRECTION 8: CORRECTED DEDUCTCREDITS ====================
    const originalDeductCredits = window.deductCredits;
    window.deductCredits = function (amount) {
        if (typeof originalDeductCredits === 'function') {
            const result = originalDeductCredits(amount);

            // If insufficient credits, handle return to dashboard
            if (!result) {
                // Show clearer message
                const warning = document.querySelector('.credit-warning');
                if (warning) {
                    const backButton = document.createElement('button');
                    backButton.textContent = 'Back to Dashboard';
                    backButton.className = 'btn-secondary';
                    backButton.style.marginTop = '10px';
                    backButton.onclick = function () {
                        // Re-hide public sections
                        document.querySelector('nav').style.display = 'none';
                        document.querySelector('.hero').style.display = 'none';
                        document.querySelector('.how-it-works').style.display = 'none';
                        document.querySelector('.credit-system').style.display = 'none';
                        document.querySelector('.pricing').style.display = 'none';
                        document.querySelector('.faq').style.display = 'none';
                        document.querySelector('.final-cta').style.display = 'none';
                        document.querySelector('footer').style.display = 'none';

                        // Re-show dashboard
                        const dashboard = document.querySelector('.dashboard-container');
                        if (dashboard) {
                            dashboard.style.display = 'block';
                        }
                    };
                    warning.appendChild(backButton);
                }
            }

            return result;
        }
        return false;
    };

    // ==================== CORRECTION 9: CORRECTED UTILITY FUNCTIONS ====================
    function getLevelLabelCorrected(level) {
        const labels = {
            primary: 'Primary School',
            middle: 'Middle School',
            high: 'High School',
            university: 'University'
        };
        return labels[level] || 'High School';
    }

    function getSubjectText(subjectValue) {
        const subjects = {
            'mathematics': 'Mathematics',
            'sciences': 'Sciences',
            'languages': 'Languages',
            'humanities': 'Humanities & Social Sciences',
            'computer-science': 'Computer Science',
            'business': 'Business',
            'test-prep': 'Test Preparation',
            'arts': 'Arts',
            'health': 'Health & Medicine'
        };
        return subjects[subjectValue] || 'General';
    }

    function getSubSubjectText(subSubjectValue) {
        // Simple mapping for example
        const mapping = {
            'algebra': 'Algebra',
            'geometry': 'Geometry',
            'calculus': 'Calculus',
            'physics': 'Physics',
            'chemistry': 'Chemistry',
            'biology': 'Biology'
        };
        return mapping[subSubjectValue] || subSubjectValue;
    }

    // ==================== CORRECTION 10: CORRECTED DETECTSUBJECT ====================
    const originalDetectSubject = window.detectSubject;
    window.detectSubject = function (question) {
        if (typeof originalDetectSubject === 'function') {
            const result = originalDetectSubject(question);
            // Harmonize names with subjectMapping
            if (result === 'math') return 'mathematics';
            if (result === 'science') return 'sciences';
            if (result === 'language') return 'languages';
            if (result === 'history') return 'humanities';
            return result;
        }

        // Fallback
        const q = question.toLowerCase();
        if (q.includes('math') || q.includes('calcul') || q.includes('algebra') || /\d+[\+\-\*\/]/.test(q)) {
            return 'mathematics';
        } else if (q.includes('science') || q.includes('physics') || q.includes('chemistry') || q.includes('biology')) {
            return 'sciences';
        } else if (q.includes('language') || q.includes('grammar') || q.includes('writing') || q.includes('essay')) {
            return 'languages';
        } else if (q.includes('history') || q.includes('geography') || q.includes('social')) {
            return 'humanities';
        }
        return 'general';
    };

    // ==================== CORRECTION 11: CORRECTED UPDATE CREDITS DISPLAY ====================
    function updateCreditsDisplayCorrected() {
        const badge = document.getElementById('creditsBadge');
        if (badge) {
            const credits = window.userCredits || 100;
            badge.innerHTML = `<span>${credits}</span> credits`;

            if (credits < 10) {
                badge.style.background = '#fef3c7';
                badge.style.color = '#92400e';
            } else {
                badge.style.background = '#dbeafe';
                badge.style.color = '#2563eb';
            }
        }

        const solveBtn = document.getElementById('solveBtn');
        if (solveBtn) {
            const credits = window.userCredits || 100;
            if (credits < 10) {
                solveBtn.disabled = true;
                solveBtn.innerHTML = '<span>Credits Exhausted</span><small>Upgrade for more</small>';
                solveBtn.style.background = '#9ca3af';
                solveBtn.style.cursor = 'not-allowed';
            } else {
                solveBtn.disabled = false;
                solveBtn.innerHTML = '<span>Get Step-by-Step Help</span><small>(10 credits)</small>';
                solveBtn.style.background = '';
                solveBtn.style.cursor = 'pointer';
            }
        }
    }

    // ==================== CORRECTION 12: PATCH FOR SETUPDASHBOARDEVENTS ====================
    const originalSetupDashboardEvents = window.setupDashboardEvents;
    window.setupDashboardEvents = function () {
        if (typeof originalSetupDashboardEvents === 'function') {
            originalSetupDashboardEvents();
        }

        // Add additional event listeners for file attachments
        if (document.getElementById('attachFileBtn')) {
            document.getElementById('attachFileBtn').addEventListener('click', function () {
                document.getElementById('fileAttachment').click();
            });
        }

        if (document.getElementById('fileAttachment')) {
            document.getElementById('fileAttachment').addEventListener('change', function (e) {
                const files = Array.from(e.target.files);
                const attachedFilesList = document.getElementById('attachedFilesList');

                files.forEach(file => {
                    // Create file item element
                    const fileItem = document.createElement('div');
                    fileItem.className = 'attached-file-item';
                    fileItem.innerHTML = `
                        <span class="file-icon">📄</span>
                        <span class="file-name">${file.name}</span>
                        <button type="button" class="remove-file" title="Remove file">×</button>
                    `;

                    // Add to list
                    attachedFilesList.appendChild(fileItem);

                    // Add remove functionality
                    const removeBtn = fileItem.querySelector('.remove-file');
                    removeBtn.addEventListener('click', function () {
                        fileItem.remove();
                    });
                });

                // Clear the file input so the same file can be selected again
                e.target.value = '';
            });
        }
    };
});