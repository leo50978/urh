
        // Fonction pour charger le footer depuis Firestore
        async function loadFooter() {
            try {
                const footerDoc = doc(db, "footer", "content");
                const footerSnapshot = await getDoc(footerDoc);
                
                if (!footerSnapshot.exists()) {
                    console.warn("Aucune donnée de footer trouvée dans Firestore");
                    return;
                }
                
                const footerData = footerSnapshot.data();
                
                // Mise à jour des éléments avec les données
                updateElement("institutionName", footerData.institutionName);
                updateElement("description", footerData.description);
                updateElement("email", footerData.email, true);
                updateElement("phone", footerData.phone, true);
                updateElement("address", footerData.address);
                updateElement("copyright", footerData.copyright);
                
                // Gestion des liens sociaux (afficher seulement si le lien existe)
                updateSocialLink("facebook", footerData.socialLinks?.facebook);
                updateSocialLink("instagram", footerData.socialLinks?.instagram);
                updateSocialLink("twitter", footerData.socialLinks?.twitter);
                updateSocialLink("linkedin", footerData.socialLinks?.linkedin);
                
            } catch (error) {
                console.error("Erreur lors du chargement du footer:", error);
            }
        }

        // Fonction utilitaire pour mettre à jour un élément texte
        function updateElement(elementId, value, isLink = false) {
            const element = document.getElementById(elementId);
            if (element && value) {
                if (isLink && element.tagName === 'A') {
                    if (elementId === 'email') {
                        element.href = `mailto:${value}`;
                    } else if (elementId === 'phone') {
                        element.href = `tel:${value}`;
                    }
                    element.textContent = value;
                } else {
                    element.textContent = value;
                }
            } else if (element && !value) {
                element.parentElement?.classList.add('hidden');
            }
        }

        // Fonction pour mettre à jour les liens sociaux
        function updateSocialLink(platform, link) {
            const element = document.getElementById(`social-${platform}`);
            if (element) {
                if (link && link.trim() !== '') {
                    element.href = link;
                    element.target = "_blank";
                    element.rel = "noopener noreferrer";
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }
        }

        // Charger le footer quand la page est prête
        document.addEventListener('DOMContentLoaded', loadFooter);
