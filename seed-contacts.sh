#!/bin/bash
# Seed 12 test contacts into ~/.kaibook/contacts.json
mkdir -p ~/.kaibook
cat > ~/.kaibook/contacts.json << 'EOF'
{
  "contacts": [
  {
    "id": "c001",
    "name": "Alice Chen",
    "emailPrimary": "alice@innovate.co",
    "emailSecondary": "alice.chen@gmail.com",
    "phonePrimary": "+1 (555) 123-4567",
    "phoneSecondary": "",
    "address": "350 Fifth Avenue, New York, NY 10118",
    "timezone": "America/New_York",
    "notes": "Prefers email over phone. Available 10am-4pm ET.",
    "createdAt": "2026-05-20T09:00:00Z",
    "updatedAt": "2026-05-20T09:00:00Z"
  },
  {
    "id": "c002",
    "name": "Bob Sharma",
    "emailPrimary": "bob@techsolutions.in",
    "emailSecondary": "",
    "phonePrimary": "+91 98765 43210",
    "phoneSecondary": "+91 87654 32109",
    "address": "12 Park Street, Kolkata, West Bengal 700016",
    "timezone": "Asia/Kolkata",
    "notes": "WhatsApp is the best way to reach him.",
    "createdAt": "2026-05-21T14:30:00Z",
    "updatedAt": "2026-05-21T14:30:00Z"
  },
  {
    "id": "c003",
    "name": "Maria Lopez",
    "emailPrimary": "maria@designlab.es",
    "emailSecondary": "mlopez@outlook.com",
    "phonePrimary": "+34 612 345 678",
    "phoneSecondary": "",
    "address": "Calle Gran Via 42, 28013 Madrid, Spain",
    "timezone": "Europe/Madrid",
    "notes": "Speaks English and Spanish. Usually responds within 24h.",
    "createdAt": "2026-05-24T08:00:00Z",
    "updatedAt": "2026-05-24T08:00:00Z"
  },
  {
    "id": "c004",
    "name": "Yuki Tanaka",
    "emailPrimary": "yuki@studiocraft.jp",
    "emailSecondary": "",
    "phonePrimary": "+81 90-1234-5678",
    "phoneSecondary": "",
    "address": "Shibuya, Tokyo, Japan",
    "timezone": "Asia/Tokyo",
    "notes": "UX designer. Prefers async comms.",
    "createdAt": "2026-05-22T06:00:00Z",
    "updatedAt": "2026-05-22T06:00:00Z"
  },
  {
    "id": "c005",
    "name": "Liam O'Brien",
    "emailPrimary": "liam@greenfield.ie",
    "emailSecondary": "liam.obrien@proton.me",
    "phonePrimary": "+353 87 123 4567",
    "phoneSecondary": "",
    "address": "Dublin 2, Ireland",
    "timezone": "Europe/Dublin",
    "notes": "Full-stack dev. Usually online 9-6 GMT.",
    "createdAt": "2026-05-22T10:00:00Z",
    "updatedAt": "2026-05-22T10:00:00Z"
  },
  {
    "id": "c006",
    "name": "Fatima Al-Rashid",
    "emailPrimary": "fatima@nexustech.ae",
    "emailSecondary": "",
    "phonePrimary": "+971 50 987 6543",
    "phoneSecondary": "",
    "address": "DIFC, Dubai, UAE",
    "timezone": "Asia/Dubai",
    "notes": "Product manager. Responds quickly on Slack.",
    "createdAt": "2026-05-23T08:00:00Z",
    "updatedAt": "2026-05-23T08:00:00Z"
  },
  {
    "id": "c007",
    "name": "Carlos Rivera",
    "emailPrimary": "carlos@pixelworks.mx",
    "emailSecondary": "",
    "phonePrimary": "+52 55 1234 5678",
    "phoneSecondary": "",
    "address": "Roma Norte, Mexico City, Mexico",
    "timezone": "America/Mexico_City",
    "notes": "Motion designer. Night owl - often online late.",
    "createdAt": "2026-05-23T11:00:00Z",
    "updatedAt": "2026-05-23T11:00:00Z"
  },
  {
    "id": "c008",
    "name": "Sophie Laurent",
    "emailPrimary": "sophie@artisancode.fr",
    "emailSecondary": "s.laurent@gmail.com",
    "phonePrimary": "+33 6 12 34 56 78",
    "phoneSecondary": "",
    "address": "Le Marais, Paris, France",
    "timezone": "Europe/Paris",
    "notes": "Frontend specialist. Prefers email.",
    "createdAt": "2026-05-24T07:00:00Z",
    "updatedAt": "2026-05-24T07:00:00Z"
  },
  {
    "id": "c009",
    "name": "Oluwaseun Adeyemi",
    "emailPrimary": "seun@lagosbytes.ng",
    "emailSecondary": "",
    "phonePrimary": "+234 803 456 7890",
    "phoneSecondary": "",
    "address": "Victoria Island, Lagos, Nigeria",
    "timezone": "Africa/Lagos",
    "notes": "Backend engineer. Very responsive on WhatsApp.",
    "createdAt": "2026-05-24T09:00:00Z",
    "updatedAt": "2026-05-24T09:00:00Z"
  },
  {
    "id": "c010",
    "name": "Emma Johansson",
    "emailPrimary": "emma@nordicpixels.se",
    "emailSecondary": "",
    "phonePrimary": "+46 70 123 4567",
    "phoneSecondary": "",
    "address": "Södermalm, Stockholm, Sweden",
    "timezone": "Europe/Stockholm",
    "notes": "Illustrator. Part-time - available Mon/Wed/Fri.",
    "createdAt": "2026-05-24T12:00:00Z",
    "updatedAt": "2026-05-24T12:00:00Z"
  },
  {
    "id": "c011",
    "name": "James Walker",
    "emailPrimary": "james@outbackdev.au",
    "emailSecondary": "",
    "phonePrimary": "+61 4 1234 5678",
    "phoneSecondary": "",
    "address": "Surry Hills, Sydney, Australia",
    "timezone": "Australia/Sydney",
    "notes": "DevOps lead. Early riser - best before noon AEST.",
    "createdAt": "2026-05-25T03:00:00Z",
    "updatedAt": "2026-05-25T03:00:00Z"
  },
  {
    "id": "c012",
    "name": "Priya Nair",
    "emailPrimary": "priya@cloudleap.in",
    "emailSecondary": "priya.nair@yahoo.com",
    "phonePrimary": "+91 98765 12345",
    "phoneSecondary": "",
    "address": "Indiranagar, Bangalore, India",
    "timezone": "Asia/Kolkata",
    "notes": "Data scientist. Prefers scheduled calls over async.",
    "createdAt": "2026-05-25T05:30:00Z",
    "updatedAt": "2026-05-25T05:30:00Z"
  }
  ]
}
EOF
echo "Seeded 12 contacts to ~/.kaibook/contacts.json"
