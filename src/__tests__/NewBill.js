import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import '@testing-library/jest-dom/extend-expect';
import { ROUTES_PATH } from '../constants/routes.js';

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je suis sur la page Nouvelle Facture", () => {
    test("Alors la validation de l'extension du fichier doit fonctionner lorsque l'extension du fichier n'est pas autorisée", () => {
      // Crée une instance de NewBill avec les mocks appropriés
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({ email: "test@example.com" })),
      };
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          create: jest.fn().mockResolvedValue({ fileUrl: "example.com", key: "123" }),
        }),
      };
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: mockLocalStorage,
      });

      // Espionne la méthode `alert`
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

      // Crée un fichier avec une extension non autorisée (par exemple, un fichier texte)
      const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });

      // Sélectionne l'élément input de fichier et affecte le fichier créé
      const fileInput = screen.getByTestId('file');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Vérifie que l'alerte a été affichée
      expect(alertSpy).toHaveBeenCalledWith('fichier non accepté');

      // Nettoie le mock pour `alert` après le test
      alertSpy.mockRestore();
    });

    test("Alors le fichier doit être téléversé et les informations de la facture doivent être définies", async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({ email: "test@example.com" })),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      // Mock store avec la méthode create de bills
      const mockCreate = jest.fn().mockResolvedValue({ fileUrl: "http://example.com/file", key: "123" });
      const mockStore = {
        bills: jest.fn(() => ({ create: mockCreate })),
      };

      // Espionner sur console.error
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Configurer le DOM avec NewBillUI
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Événement de changement de l'input de fichier
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Soumission du formulaire simulée
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener('change', handleChangeFile);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Attendre que les promesses se résolvent
      await new Promise(process.nextTick);

      // Assertions
      expect(handleChangeFile).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: { noContentType: true }
      });

      const formData = mockCreate.mock.calls[0][0].data;
      expect(formData.get('file')).toEqual(file);
      expect(formData.get('email')).toEqual("test@example.com");
      expect(newBill.billId).toBe("123");
      expect(newBill.fileUrl).toBe("http://example.com/file");
      expect(newBill.fileName).toBe("test.jpg");

      // Vérifier que console.error n'est pas appelé
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test("Alors le formulaire doit être soumis avec les données correctes", () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify({ email: "test@example.com" })),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      // Mock du store et onNavigate
      const mockStore = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({ fileUrl: "http://example.com/file", key: "123" }),
          update: jest.fn().mockResolvedValue({}), // Ajouter cette ligne
        })),
      };
      const mockOnNavigate = jest.fn();

      // Configurer le DOM avec NewBillUI
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Définir fileUrl et fileName
      newBill.fileUrl = "http://example.com/file";
      newBill.fileName = "test.jpg";

      // Remplir le formulaire
      screen.getByTestId('expense-type').value = 'Transports';
      screen.getByTestId('expense-name').value = 'Train ticket';
      screen.getByTestId('amount').value = '50';
      screen.getByTestId('datepicker').value = '2022-12-01';
      screen.getByTestId('vat').value = '10';
      screen.getByTestId('pct').value = '20';
      screen.getByTestId('commentary').value = 'Business trip';

      // Espionner sur updateBill
      const updateBillSpy = jest.spyOn(newBill, 'updateBill');

      // Simuler la soumission du formulaire
      const form = screen.getByTestId('form-new-bill');
      fireEvent.submit(form);

      // Vérifier que updateBill est appelé avec les données correctes
      expect(updateBillSpy).toHaveBeenCalledWith({
        email: "test@example.com",
        type: "Transports",
        name: "Train ticket",
        amount: 50,
        date: "2022-12-01",
        vat: "10",
        pct: 20,
        commentary: "Business trip",
        fileUrl: "http://example.com/file",
        fileName: "test.jpg",
        status: "pending",
      });

      // Vérifier que onNavigate est appelé avec le chemin correct
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });

    test("Alors updateBill doit appeler update du store avec les bonnes données et naviguer vers la page des Factures", async () => {
      // Mock du store et onNavigate
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockStore = {
        bills: jest.fn(() => ({
          update: mockUpdate,
        })),
      };
      const mockOnNavigate = jest.fn();

      // Créer une instance de NewBill
      const newBill = new NewBill({
        document: document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Définir billId
      newBill.billId = "123";

      // Créer un objet de facture à mettre à jour
      const bill = {
        email: "test@example.com",
        type: "Transports",
        name: "Train ticket",
        amount: 50,
        date: "2022-12-01",
        vat: "10",
        pct: 20,
        commentary: "Business trip",
        fileUrl: "http://example.com/file",
        fileName: "test.jpg",
        status: "pending",
      };

      // Appeler updateBill
      await newBill.updateBill(bill);

      // Vérifier que update est appelé avec les bons arguments
      expect(mockUpdate).toHaveBeenCalledWith({
        data: JSON.stringify(bill),
        selector: "123",
      });

      // Vérifier que onNavigate est appelé avec le chemin correct
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  });
});

