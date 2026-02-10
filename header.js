// ============================================
// GESTION DE L'AUTHENTIFICATION
// ============================================

// Écouter les changements d'état d'authentification
function setupAuthStateListener() {
    auth.onAuthStateChanged((user) => {
        console.log("État d'authentification changé:", user ? "Connecté" : "Non connecté");
        updateHeaderForAuthState(user);
    });
}

// Mettre à jour le header en fonction de l'état d'authentification
function updateHeaderForAuthState(user) {
    const authButtonsDesktop = document.getElementById('auth-buttons-desktop');
    const authButtonsMobile = document.getElementById('auth-buttons-mobile');
    const userMenuDesktop = document.getElementById('user-menu-desktop');
    const userMenuMobile = document.getElementById('user-menu-mobile');
    
    if (user) {
        // Utilisateur connecté
        console.log("Utilisateur connecté:", user.email);
        
        // Masquer les boutons de connexion/inscription
        if (authButtonsDesktop) authButtonsDesktop.classList.add('auth-buttons-hidden');
        if (authButtonsMobile) authButtonsMobile.classList.add('auth-buttons-hidden');
        
        // Afficher le menu utilisateur
        if (userMenuDesktop) userMenuDesktop.classList.remove('user-menu-hidden');
        if (userMenuMobile) userMenuMobile.classList.remove('user-menu-hidden');
        
    } else {
        // Utilisateur non connecté
        console.log("Utilisateur non connecté");
        
        // Afficher les boutons de connexion/inscription
        if (authButtonsDesktop) authButtonsDesktop.classList.remove('auth-buttons-hidden');
        if (authButtonsMobile) authButtonsMobile.classList.remove('auth-buttons-hidden');
        
        // Masquer le menu utilisateur
        if (userMenuDesktop) userMenuDesktop.classList.add('user-menu-hidden');
        if (userMenuMobile) userMenuMobile.classList.add('user-menu-hidden');
    }
}

// Fonction de déconnexion
function logoutUser() {
    auth.signOut().then(() => {
        console.log("Déconnexion réussie");
        // Rediriger vers la page d'accueil après déconnexion
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Erreur lors de la déconnexion:", error);
    });
}

// ============================================
// GESTION DU HEADER (MENUS, DROPDOWNS)
// ============================================

function setupHeaderEventListeners() {
    // Menu mobile
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Dropdown menu utilisateur (desktop)
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        
        // Fermer le dropdown en cliquant ailleurs
        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
        
        // Empêcher la fermeture quand on clique dans le dropdown
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Boutons de déconnexion
    const logoutButton = document.getElementById('logout-button');
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }
    
    if (logoutButtonMobile) {
        logoutButtonMobile.addEventListener('click', logoutUser);
    }
    
    // Navigation fluide pour les liens internes
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href') && e.target.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href');
            if (targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Fermer le menu mobile si ouvert
                    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                        mobileMenu.classList.add('hidden');
                    }
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        }
    });
}
// ============================================
// INITIALISATION DE LA PAGE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation de la page...");
    
    // 1. Configurer l'authentification Firebase
    setupAuthStateListener();
    
    // 2. Configurer les événements du header
    setupHeaderEventListeners();
    
    // 3. Charger le contenu depuis Firebase
    loadHomepageContent();
    
    // 4. Configurer les autres événements
    setupEventListeners();
    
    console.log("Page initialisée avec succès");
});