
        class DashboardGestion {
            constructor() {
                this.clients = [];
                this.ventes = [];
                this.promotions = [];
                this.chargerDonnees();
                this.initialiserInterface();
        }
        
            chargerDonnees() {
                try {
                    this.clients = JSON.parse(localStorage.getItem('clients') || '[]');
                    this.ventes = JSON.parse(localStorage.getItem('ventes') || '[]');
                    this.promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
                } catch (erreur) {
                    console.error('Erreur de chargement des données', erreur);
                    this.clients = [];
                    this.ventes = [];
                    this.promotions = [];
                }
            }

            initialiserInterface() {
                this.mettreAJourStatistiques();
                this.peuplementSelects();
            }

            mettreAJourStatistiques() {
                // Nombre de clients
                document.getElementById('clientCount').textContent = this.clients.length;

                // Total des ventes
                const totalVentes = this.ventes.reduce((total, vente) => total + vente.prix, 0);
                document.getElementById('salesTotal').textContent = `${totalVentes.toFixed(2)}fCFA`;

                // Nombre de promotions
                document.getElementById('promotionCount').textContent = this.promotions.length;

                // Meilleur client (celui avec le plus d'achats)
                const clientAchats = this.ventes.reduce((acc, vente) => {
                    acc[vente.clientId] = (acc[vente.clientId] || 0) + vente.prix;
                    return acc;
                }, {});

                const meilleurClientId = Object.entries(clientAchats)
                    .reduce((a, b) => b[1] > a[1] ? b : a, [null, 0])[0];

                const meilleurClient = this.clients.find(c => c.id === parseInt(meilleurClientId));
                document.getElementById('topClient').textContent = 
                    meilleurClient ? `${meilleurClient.prenom} ${meilleurClient.nom}` : '-';
            }

            peuplementSelects() {
                const clientSelect = document.getElementById('clientSelect');
                const venteSelect = document.getElementById('venteSelect');
                
                clientSelect.innerHTML = '<option value="">Choisir un client</option>';
                venteSelect.innerHTML = '<option value="">Choisir une vente</option>';

                this.clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = `${client.prenom} ${client.nom}`;
                    clientSelect.appendChild(option);
                });

                this.ventes.forEach(vente => {
                    const option = document.createElement('option');
                    option.value = vente.id;
                    option.textContent = `${vente.client} - ${vente.produit} (${vente.prix.toFixed(2)}fCFA)`;
                    venteSelect.appendChild(option);
                });
            }

            genererRapportDetaille() {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('landscape');

                // Titre
                doc.setFontSize(18);
                doc.text('Rapport Détaillé de la Boutique', 14, 22);

                // Statistiques principales
                const statsData = [
                    ['Clients', this.clients.length],
                    ['Ventes', this.ventes.length],
                    ['Promotions', this.promotions.length],
                    ['Total des Ventes', this.ventes.reduce((t, v) => t + v.prix, 0).toFixed(2) + 'fCFA']
                ];

                doc.autoTable({
                    startY: 40,
                    head: [['Catégorie', 'Valeur']],
                    body: statsData
                });

                // Tableau des ventes
                doc.autoTable({
                    startY: doc.previousAutoTable.finalY + 10,
                    head: [['Client', 'Produit', 'Prix', 'Date']],
                    body: this.ventes.map(v => [v.client, v.produit, v.prix.toFixed(0) + 'fCFA', v.date])
                });

                doc.save('rapport_boutique_detaille.pdf');
            }

            genererRecu() {
                const clientId = document.getElementById('clientSelect').value;
                const venteId = document.getElementById('venteSelect').value;

                if (!clientId || !venteId) {
                    alert('Veuillez sélectionner un client et une vente');
                    return;
                }

                const client = this.clients.find(c => c.id === parseInt(clientId));
                const vente = this.ventes.find(v => v.id === parseInt(venteId));

                if (!client || !vente) {
                    alert('Informations introuvables');
                    return;
                }

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                doc.setFontSize(16);
                doc.text('Reçu de Paiement', 10, 20);

                doc.setFontSize(10);
                doc.text(`Date: ${vente.date}`, 10, 35);
                doc.text(`Client: ${client.prenom} ${client.nom}`, 10, 45);
                doc.text(`Email: ${client.email}`, 10, 55);
                doc.text(`Téléphone: ${client.telephone}`, 10, 65);

                doc.text(`Produit: ${vente.produit}`, 10, 80);
                doc.text(`Prix: ${vente.prix.toFixed(2)}€`, 10, 90);

                doc.save(`recu_${client.prenom}_${client.nom}_${vente.date}.pdf`);
            }

            exporterDonnees() {
                const donnees = {
                    clients: this.clients,
                    ventes: this.ventes,
                    promotions: this.promotions
                };

                const blob = new Blob([JSON.stringify(donnees, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_boutique_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            importerDonnees() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                
                input.onchange = (e) => {
                    const fichier = e.target.files[0];
                    const lecteur = new FileReader();
                    
                    lecteur.onload = (event) => {
                        try {
                            const donnees = JSON.parse(event.target.result);
                            
                            // Validation minimale des données
                            if (!donnees.clients || !donnees.ventes || !donnees.promotions) {
                                throw new Error('Format de fichier invalide');
                            }
 /*
importerDonnees() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const fichier = e.target.files[0];
        const lecteur = new FileReader();

        lecteur.onload = (event) => {
            try {
                const donnees = JSON.parse(event.target.result);

                // Validation minimale des données
                if (!donnees.clients || !donnees.ventes || !donnees.promotions) {
                    throw new Error('Format de fichier invalide');
                }

                
                localStorage.setItem('ventes', JSON.stringify(donnees.ventes));
                localStorage.setItem('promotions', JSON.stringify(donnees.promotions));

                this.chargerDonnees();
                this.initialiserInterface();

                alert('Données importées avec succès');
            } catch (erreur) {
                console.error(erreur);
                alert('Erreur d\'importation : ' + erreur.message);
            }
        };

        lecteur.readAsText(fichier);
    };

    input.click();
}*/

        localStorage.setItem('clients', JSON.stringify(donnees.clients));
        
        localStorage.setItem('ventes', JSON.stringify(donnees.ventes));
        
        localStorage.setItem('promotions', JSON.stringify(donnees.promotions));
                    
                    this.chargerDonnees();
                    this.initialiserInterface();
                    
                    alert('Données importées avec succès');
                        } catch (erreur) {
                            console.error(erreur);
                            alert('Erreur d\'importation : ' + erreur.message);
                        }
                    };
                    
                    lecteur.readAsText(fichier);
                };
                
                input.click();
            }
        }

        const dashboard = new DashboardGestion();
    