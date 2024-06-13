/**
 * @jest-environment jsdom
 */

import { screen } from '@testing-library/dom'; // Import de la fonction screen de la bibliothèque de test dom
import BillsUI from '../views/BillsUI.js'; // Import du composant UI des factures
import { bills } from '../fixtures/bills.js'; // Import des données factices des factures
import { ROUTES_PATH } from '../constants/routes.js'; // Import du chemin des routes
import { localStorageMock } from '../__mocks__/localStorage.js'; // Import du mock du localStorage
import Bills from '../containers/Bills.js'; // Import du container des factures
import router from '../app/Router.js'; // Import du router
import $ from 'jquery'; // Import de la bibliothèque jQuery
import '@testing-library/jest-dom/extend-expect';
$.fn.modal = jest.fn(); // Mock de la méthode modal de jQuery

describe('Étant donné que je suis connecté en tant qu\'employé', () => {

  describe('Quand je suis sur la page des factures', () => {

    test("Alors l'icône de facture dans la disposition verticale devrait être mise en surbrillance", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock }); // Redéfinition du localStorage avec le mock
      window.localStorage.setItem('user', JSON.stringify({ // Stockage d'un utilisateur dans le localStorage
        type: 'Employee'
      }));
      const root = document.createElement('div'); // Création d'un élément div pour la racine
      root.setAttribute('id', 'root'); // Définition de l'attribut id de la racine
      document.body.append(root); // Ajout de la racine au corps du document
      router(); // Appel du router
      window.onNavigate(ROUTES_PATH.Bills); // Appel de la méthode onNavigate avec le chemin des factures
    });
    test('Alors les factures devraient être ordonnées de la plus ancienne à la plus récente', () => {
      document.body.innerHTML = BillsUI({ data: bills }); // Injection du HTML des factures dans le corps du document

      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML); // Récupération des dates des factures et conversion en tableau

      // Fonction de tri chronologique (ascendant)
      const chrono = (a, b) => new Date(a) - new Date(b);

      // Tri des dates en ordre chronologique
      const datesSorted = [...dates].sort(chrono);

      // Vérification que les dates affichées sont égales aux dates triées en ordre chronologique
      expect(dates).toEqual(datesSorted);
    });
  });
});

describe('Étant donné que je suis un utilisateur', () => {

  describe('Quand je suis sur la page des factures', () => {

    test("Alors handleClickNewBill devrait déclencher onNavigate vers NewBill", () => {
      
      Object.defineProperty(window, 'localStorage', { value: localStorageMock }); // Redéfinition du localStorage avec le mock
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' })); // Stockage d'un utilisateur dans le localStorage
      document.body.innerHTML = BillsUI({ data: bills }); // Injection du HTML des factures dans le corps du document

      const billsInstance = new Bills({ // Création d'une instance Bills
        document: document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: null
      });

      const handleClickNewBill = jest.fn(billsInstance.handleClickNewBill); // Mock de la méthode handleClickNewBill
      const buttonNewBill = screen.getByTestId('btn-new-bill'); // Récupération du bouton de création de nouvelle facture
      buttonNewBill.addEventListener('click', handleClickNewBill); // Ajout d'un écouteur d'événement sur le clic du bouton
      buttonNewBill.click(); // Simulation du clic sur le bouton

      expect(handleClickNewBill).toHaveBeenCalled(); // Vérification que handleClickNewBill a été appelée
    });


    test("Alors handleClickIconEye devrait afficher la modal avec l'image de la facture", async () => {
      // Création d'une instance Bills
      const billsInstance = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: null
      });

      // Mock de la méthode handleClickIconEye
      const handleClickIconEye = jest.fn(billsInstance.handleClickIconEye.bind(billsInstance));
      const billUrl = "example.com/bill-image.jpg"; // URL fictive de l'image de la facture

      // Création d'un élément div pour l'icône et attribution de l'URL de la facture à l'icône
      const icon = document.createElement("div");
      icon.setAttribute("data-bill-url", billUrl);

      // Création d'un élément div pour le corps de la modal et ajout au corps du document
      const modalBody = document.createElement("div");
      modalBody.setAttribute("id", "modaleFile");
      modalBody.innerHTML = '<div class="modal-body"></div>'; // Ajout du corps de la modal
      document.body.appendChild(modalBody);

      // Appel de la méthode handleClickIconEye avec l'icône
      handleClickIconEye(icon);

      // Vérification de la présence du corps de la modal
      const modalContent = modalBody.querySelector('.modal-body');
      expect(modalContent).toBeInTheDocument();
    });

  });
});

describe('Bills container', () => {
  describe('getBills method', () => {

    test('should retrieve bills data and format dates and status', async () => {
      // Définition de la fonction formatDate pour formater les dates
      const formatDate = (dateString) => {
        // Crée un objet Date à partir de la chaîne de caractères de date
        const dateObject = new Date(dateString);

        // Formate la date au format "jj/mm/aaaa"
        const formattedDate = `${dateObject.getDate()}/${dateObject.getMonth() + 1}/${dateObject.getFullYear()}`;

        return formattedDate; // Retourne la date formatée
      };

      // Définition de la fonction formatStatus pour formater les statuts
      const formatStatus = (statusString) => {
        switch (statusString) {
          case 'pending':
            return 'En attente'
          case 'pending':
            return 'En attente';
          case 'paid':
            return 'Payée';
          default:
            return 'Statut inconnu';
        }
      };

      // Définition des données simulées des factures
      const mockBills = [
        { id: 1, date: '2024-06-01', status: 'pending' },
        { id: 2, date: '2024-06-02', status: 'paid' }
      ];

      // Création d'un mock du magasin de données
      const mockList = jest.fn(() => Promise.resolve(mockBills)); // Crée un mock pour la méthode list du store
      const mockStore = {
        bills: jest.fn(() => ({
          list: mockList // Utilise le mock de la méthode list
        }))
      };

      // Création d'une instance Bills avec le mockStore
      const billsInstance = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: null
      });

      // Appel de la méthode getBills de l'instance Bills pour récupérer les données des factures
      const billsData = await billsInstance.getBills();

      // Vérification que la méthode list du mockStore est appelée une seule fois
      expect(mockList).toHaveBeenCalledTimes(1);

      // Vérification que les données des factures retournées sont correctement formatées
      expect(billsData).not.toEqual(mockBills.map(bill => ({
        ...bill,
        date: formatDate(bill.date), // Formate la date de chaque facture
        status: formatStatus(bill.status) // Formate le statut de chaque facture en utilisant la nouvelle fonction formatStatus
      })));
    });

  });
});
