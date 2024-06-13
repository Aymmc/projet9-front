import { ROUTES_PATH } from '../constants/routes.js'
import { formatDate, formatStatus } from "../app/format.js"
import Logout from "./Logout.js"

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
     
    const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`);
    if (buttonNewBill) {
      buttonNewBill.addEventListener('click', this.handleClickNewBill);
      
    }

    
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye) {
      iconEye.forEach(icon => {
        icon.addEventListener('click', () => this.handleClickIconEye(icon));
      });
    }

    
    
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill']);
  }

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5);
    const modalBody = $('#modaleFile').find(".modal-body");
    modalBody.empty(); // Vide le contenu précédent de la modal
    modalBody.html(`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src="${billUrl}" alt="Bill" /></div>`);
    $('#modaleFile').modal('show');
  }
  
  getBills = () => {
    if (this.store) {
      // Vérifie si un magasin de données existe
      return this.store
        .bills() // Accède à la collection des factures dans le magasin de données
        .list() // Récupère la liste des factures
        .then(snapshot => {
          // Utilise la méthode then pour traiter les données lorsque la promesse est résolue
          const bills = snapshot.map(doc => {
            // Mappe chaque document de facture dans le snapshot
            try {
              // Tente de formater la date et le statut de la facture
              return {
                ...doc,
                date: formatDate(doc.date), // Formate la date de la facture
                status: formatStatus(doc.status) // Formate le statut de la facture
              };
            } catch (e) {
              // En cas d'erreur pendant le formatage, retourne la facture sans formatage
              return {
                ...doc,
                date: doc.date, // Garde la date d'origine
                status: formatStatus(doc.status) // Formate le statut de la facture
              };
            }
          });
  
          return bills; // Retourne les factures formatées
        });
    }
  }
  

}
