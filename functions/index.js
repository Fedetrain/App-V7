const {onDocumentCreated, onDocumentDeleted, onDocumentUpdated} = 
require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

// Helper function per formattare la data
const formatDateTime = (date) => {
  const seconds = date.seconds;
  const nanoseconds = date.nanoseconds;
  const milliseconds = (seconds * 1000) + Math.floor(nanoseconds / 1000000);
  const dateObj = new Date(milliseconds);
  dateObj.setHours(dateObj.getHours() + 1);

  return {
    formattedDate: dateObj.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    formattedTime: dateObj.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  };
};



exports.onPrenotazioneDateUpdated = onDocumentUpdated(
    "Prenotazioni/{prenotazioneId}",
    async (event) => {
      // Verifica che `event` sia definito
      if (!event || !event.data) {
        console.error("Evento non valido:", event);
        return null;
      }

      // Ottieni i dati prima e dopo l'aggiornamento
      const beforeData = event.data.before.data();
      const afterData = event.data.after.data();

      // Verifica che i dati siano definiti
      if (!beforeData || !afterData) {
        console.error("Dati non validi:", { beforeData, afterData });
        return null;
      }

      // Controlla se il campo `dataPrenotazione` è cambiato
      if (beforeData.dataPrenotazione.isEqual(afterData.dataPrenotazione)) {
        console.log("Il campo dataPrenotazione non è cambiato.");
        return null;
      }

      // Prosegui con la logica per inviare la notifica
      const proprietarioUid = afterData.proprietarioUid;

      try {
        // Recupera il token dalla collection Gestore
        const userDocRef = admin.firestore().collection("Cliente")
            .doc(proprietarioUid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          console.log("Documento gestore non trovato");
          return null;
        }

        const notificationToken = userDoc.data().notificationToken;
        if (!notificationToken) {
          console.log("Nessun notification token trovato");
          return null;
        }

        // Formatta la nuova data
        const { formattedDate, formattedTime } = 
            formatDateTime(afterData.dataPrenotazione);
        const formattedDateTime = `${formattedDate} ore ${formattedTime}`;

        // Crea il messaggio
        const body = `Il gestore ha modificato l orario per la tua prenotazione.`;
        const title = `Prenotazione Modificata: ${formattedDateTime}`;

        // Invia la notifica
        const pushMessage = {
          token: notificationToken,
          notification: {
            title: title,
            body: body,
          },
        };

        await admin.messaging().send(pushMessage);
        console.log("Notifica inviata con successo");
        return null;
      } catch (error) {
        console.error("Errore invio notifica:", error);
        return null;
      }
    },
);
// Funzione per inviare una notifica quando una prenotazione viene aggiunta
exports.onPrenotazioneCreated = onDocumentCreated(
    "Prenotazioni/{prenotazioneId}",
    async (snap, context) => {
      const newPrenotazione2 = snap.data.data();

      const proprietarioUid = newPrenotazione2.proprietarioUid;

      try {
        // Recupera il token di notifica dell'utente dalla collection "Cliente"
        const userDocRef = admin.firestore().collection("Gestore")
            .doc(proprietarioUid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          return null;
        }

        const notificationToken = userDoc.data().notificationToken;

        if (!notificationToken) {
          return null;
        }

        const date = newPrenotazione2.dataPrenotazione;

        const seconds = date.seconds;
        const nanoseconds = date.nanoseconds;
        const milliseconds =
        (seconds * 1000) + Math.floor(nanoseconds / 1000000);
        const dateObj = new Date(milliseconds);
        dateObj.setHours(dateObj.getHours() + 1 );



        // Formatta la data in italiano(es. "11 novembre 2024")
        const formattedDate = dateObj.toLocaleDateString("it-IT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Formatta l'ora in italiano senza fuso orario (es. "17:00:00")
        const formattedTime = dateObj.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Unisci data e ora formattate
        const formattedDateTime = `${formattedDate} ore ${formattedTime}`;
        const nomeCliente= newPrenotazione2.nomeCliente;

        const body = `${nomeCliente} ha prenotato
`;
        const title = `Nuova Prenotazione: ${formattedDateTime} `;

        const pushMessage = {
          token: notificationToken,
          notification: {
            title: title,
            body: body,
          },
        };
        // Invia la notifica push al dispositivo dell'utente
        const response = await admin.messaging()
            .send(pushMessage);
        return null;
      } catch (error) {
        return null;
      }
    },
);
// Funzione per gestire l'update del campo 'stato' nelle Prenotazioni
exports.onPrenotazioneStatoUpdated = onDocumentUpdated(
  "Prenotazioni/{prenotazioneId}",
  async (event) => {
    // Verifica che `event` sia definito
    if (!event || !event.data) {
      console.error("Evento non valido:", event);
      return null;
    }

    // Ottieni i dati prima e dopo l'aggiornamento
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Controlla se il campo 'stato' è cambiato
    if (beforeData.stato === afterData.stato) {
      return null;
    }

    const clienteUid = afterData.idDocumentCliente;

    try {
      // Recupera il token di notifica del cliente
      const userDocRef = admin.firestore().collection("Cliente")
          .doc(clienteUid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.log("Documento cliente non trovato");
        return null;
      }

      const notificationToken = userDoc.data().notificationToken;
      if (!notificationToken) {
        console.log("Nessun notification token trovato per il cliente");
        return null;
      }

      // Determina il messaggio in base al nuovo stato
      let title, body;
      switch (afterData.stato) {
        case "Accettato":
          title = "Prenotazione Accettata";
          body = `La tua prenotazione è stata accettata.`;
          break;
        case "Completato":
          title = "Prenotazione Completata";
          body = `Il gestore ha completato il tuo ordine.`;
          break;
        default:
          // Se lo stato non è tra quelli gestiti, esci
          return null;
      }

      // Prepara il messaggio di notifica
      const pushMessage = {
        token: notificationToken,
        notification: {
          title: title,
          body: body,
        },
      };

      // Invia la notifica
      await admin.messaging().send(pushMessage);
      console.log(`Notifica inviata per stato: ${afterData.stato}`);
      return null;
    } catch (error) {
      console.error("Errore durante l'invio della notifica:", error);
      return null;
    }
  },
);

exports.onPrenotazioneDeleted = onDocumentDeleted(
    "Prenotazioni/{prenotazioneId}",
    async (snap, context) => {
      const deletedPrenotazione = snap.data.data();

      const proprietarioUid = deletedPrenotazione.idDocumentCliente;

      try {
        const userDocRef = admin.firestore().collection("Cliente")
            .doc(proprietarioUid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          return null;
        }

        const notificationToken = userDoc.data().notificationToken;

        if (!notificationToken) {
          return null;
        }

        const date = deletedPrenotazione.dataPrenotazione;

        const seconds = date.seconds;
        const nanoseconds = date.nanoseconds;
        const milliseconds =
          (seconds * 1000) + Math.floor(nanoseconds / 1000000);
        const dateObj = new Date(milliseconds);


        // Formatta la data in italiano (es. "11 novembre 2024")
        const formattedDate = dateObj.toLocaleDateString("it-IT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Formatta l'ora in italiano senza fuso orario (es. "17:00:00")
        const formattedTime = dateObj.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Unisci data e ora formattate
        const formattedDateTime = `${formattedDate} ore ${formattedTime}`;

        const body = `La prenotazione
è stata cancellata se non sei stato tu a cancellarla contatta il gestore.`;

        const title = `Prenotazione Cancellata: 
${formattedDateTime}`;

        const pushMessage = {
          token: notificationToken,
          notification: {
            title: title,
            body: body,
          },
        };

        // Invia la notifica push al dispositivo dell'utente
        const response = await admin.messaging()
            .send(pushMessage);
        return null;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
);

