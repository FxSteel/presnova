# Testing Presentation State API with cURL

## Setup

First, get your JWT token:

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}' | jq .access
```

Save the token:
```bash
TOKEN="your_token_here"
```

---

## 1. Create a Test Song

```bash
curl -X POST http://localhost:8000/api/songs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Amazing Grace",
    "author": "John Newton",
    "key": "G",
    "sections": [
      {"section_type":"verse","order":1,"text":"Amazing grace, how sweet the sound..."},
      {"section_type":"verse","order":2,"text":"That saved a wretch like me..."},
      {"section_type":"chorus","order":3,"text":"When weve been there ten thousand years..."}
    ]
  }' | jq .
```

**Extract section IDs:**
```bash
# From response, note down the section IDs (e.g., 10, 11, 12)
```

---

## 2. Presentation State Endpoints

### Get Initial State (should be empty)
```bash
curl -X GET http://localhost:8000/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Response:**
```json
{
  "id": 1,
  "active_song": null,
  "active_section": null,
  "updated_at": "2025-12-21T02:46:44.775150Z"
}
```

---

### Set Active Slide
```bash
curl -X POST http://localhost:8000/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"section_id": 10}'  | jq .
```

**Response:**
```json
{
  "id": 1,
  "active_song": 6,
  "active_section": 10,
  "updated_at": "2025-12-21T02:48:59.201583Z"
}
```

---

### Get Output (for Output Display)
```bash
curl -X GET http://localhost:8000/api/presentation/output/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Response:**
```json
{
  "active": {
    "id": 10,
    "song_id": 6,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 1,
    "text": "Amazing grace, how sweet the sound..."
  }
}
```

---

### Get Stage (for Stage Display)
```bash
curl -X GET http://localhost:8000/api/presentation/stage/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Response:**
```json
{
  "current": {
    "id": 10,
    "song_id": 6,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 1,
    "text": "Amazing grace, how sweet the sound..."
  },
  "next": {
    "id": 11,
    "song_id": 6,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 2,
    "text": "That saved a wretch like me..."
  }
}
```

---

### Set Different Section
```bash
curl -X POST http://localhost:8000/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"section_id": 11}'  | jq .
```

---

### Get Output Again (updated)
```bash
curl -X GET http://localhost:8000/api/presentation/output/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Now shows Verse 2:**
```json
{
  "active": {
    "id": 11,
    "song_id": 6,
    "song_title": "Amazing Grace",
    "section_type": "verse",
    "order": 2,
    "text": "That saved a wretch like me..."
  }
}
```

---

### Get Stage (Last Section)
```bash
# Set to chorus (order 3, usually the last)
curl -X POST http://localhost:8000/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"section_id": 12}' | jq .

# Get stage - next should be null
curl -X GET http://localhost:8000/api/presentation/stage/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Response (no next section):**
```json
{
  "current": {
    "id": 12,
    "song_id": 6,
    "song_title": "Amazing Grace",
    "section_type": "chorus",
    "order": 3,
    "text": "When weve been there ten thousand years..."
  },
  "next": null
}
```

---

### Clear State
```bash
curl -X POST http://localhost:8000/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clear": true}' | jq .
```

**Response:**
```json
{
  "id": 1,
  "active_song": null,
  "active_section": null,
  "updated_at": "2025-12-21T02:48:59.211967Z"
}
```

---

### Verify Cleared
```bash
curl -X GET http://localhost:8000/api/presentation/output/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Response:**
```json
{
  "active": null
}
```

---

## Error Cases

### Invalid Section ID
```bash
curl -X POST http://localhost:8000/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"section_id": 999}' | jq .
```

**Response (404):**
```json
{
  "error": "Section with id 999 not found"
}
```

---

### Missing Parameters
```bash
curl -X POST http://localhost:8000/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

**Response (400):**
```json
{
  "error": "Expected either section_id or clear parameter"
}
```

---

### No Authentication
```bash
curl -X GET http://localhost:8000/api/presentation/output/
```

**Response (401):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Script: Complete Flow

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"
USERNAME="testuser"
PASSWORD="testpass123"

# 1. Get token
echo "🔐 Getting token..."
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" | jq -r '.access')
echo "✅ Token: $TOKEN"

# 2. Create song
echo -e "\n📝 Creating song..."
SONG=$(curl -s -X POST $BASE_URL/api/songs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Song",
    "author":"Test Author",
    "key":"C",
    "sections":[
      {"section_type":"verse","order":1,"text":"Verse 1"},
      {"section_type":"verse","order":2,"text":"Verse 2"},
      {"section_type":"chorus","order":3,"text":"Chorus"}
    ]
  }')
SECTION_ID=$(echo $SONG | jq '.sections[0].id')
echo "✅ Song created, section ID: $SECTION_ID"

# 3. Set slide
echo -e "\n⏱️ Setting active slide..."
curl -s -X POST $BASE_URL/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"section_id\": $SECTION_ID}" | jq .

# 4. Get output
echo -e "\n🖥️ Getting output..."
curl -s -X GET $BASE_URL/api/presentation/output/ \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Get stage
echo -e "\n🎭 Getting stage..."
curl -s -X GET $BASE_URL/api/presentation/stage/ \
  -H "Authorization: Bearer $TOKEN" | jq .

# 6. Clear
echo -e "\n🗑️ Clearing state..."
curl -s -X POST $BASE_URL/api/presentation/state/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clear": true}' | jq .

echo -e "\n✅ Complete!"
```

---

## Useful Commands

### Pretty print JSON
```bash
curl ... | jq .
```

### Extract specific fields
```bash
# Get only section ID
curl ... | jq '.sections[0].id'

# Get token
curl ... | jq -r '.access'
```

### Pretty print with colors
```bash
curl ... | jq -C .
```

### Save response to file
```bash
curl ... | tee response.json | jq .
```

---

## Frontend Integration Example (JavaScript/Fetch)

```javascript
const BASE_URL = "http://localhost:8000";
const token = localStorage.getItem("auth_token");

// Get output slide
async function getOutputSlide() {
  const response = await fetch(`${BASE_URL}/api/presentation/output/`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return response.json();
}

// Set active slide
async function setActiveSlide(sectionId) {
  const response = await fetch(`${BASE_URL}/api/presentation/state/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ section_id: sectionId })
  });
  return response.json();
}

// Get stage (current + next)
async function getStageSlides() {
  const response = await fetch(`${BASE_URL}/api/presentation/stage/`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return response.json();
}
```
