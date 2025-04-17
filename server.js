// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Ton token HubSpot
const HUBSPOT_TOKEN = 'TON_TOKEN_SECRET_ICI';

app.use(cors()); // Autorise les requêtes depuis ton frontend
app.use(express.json());

// Get owners
app.get('/api/owners', async (req, res) => {
  const response = await fetch('https://api.hubapi.com/owners/v2/owners', {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` }
  });
  const data = await response.json();
  res.json(data);
});

// Get contacts
app.get('/api/contacts', async (req, res) => {
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email&limit=50', {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` }
  });
  const data = await response.json();
  res.json(data);
});

// Get statuses
app.get('/api/statuses', async (req, res) => {
  const response = await fetch('https://api.hubapi.com/properties/v2/contacts/properties/named/hs_status', {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` }
  });
  const data = await response.json();
  res.json(data);
});

// Update contact and add note
app.post('/api/update-contact', async (req, res) => {
  const { contactId, ownerId, status, note } = req.body;

  // 1. Update contact
  await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        hubspot_owner_id: ownerId,
        hs_status: status
      }
    })
  });

  // 2. Add note if needed
  if (note && note.trim() !== '') {
    await fetch('https://api.hubapi.com/engagements/v1/engagements', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        engagement: {
          active: true,
          type: 'NOTE',
          ownerId: parseInt(ownerId)
        },
        associations: {
          contactIds: [parseInt(contactId)]
        },
        metadata: {
          body: note
        }
      })
    });
  }

  res.json({ success: true, message: 'Contact mis à jour avec succès !' });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
