# NutriCoach Service Contracts

## API Specifications & Service Boundaries

---

## 1. Calc Engine Service

**Type:** Internal Library (No HTTP endpoints)
**Location:** `lib/calc-engine.ts`

### Interface

```typescript
// Types
interface ProfileInput {
  age: number;          // 13-120
  sex: 'male' | 'female';
  weightKg: number;     // 20-500
  heightCm: number;     // 50-300
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
  macros?: MacroDistribution;
}

interface MacroDistribution {
  carbs: number;    // 0-100, must sum to 100
  protein: number;  // 0-100
  fat: number;      // 0-100
}

interface NutritionResult {
  bmr: number;              // Basal Metabolic Rate
  tdee: number;             // Total Daily Energy Expenditure
  targetCalories: number;   // Goal-adjusted calories
  macros: {
    carbsG: number;
    proteinG: number;
    fatG: number;
  };
  formulaVersion: string;   // For audit trail
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Functions
function calculateNutrition(input: ProfileInput): NutritionResult;
function adjustCaloriesForGoal(tdee: number, goal: Goal): number;
function calculateMacroGrams(calories: number, dist: MacroDistribution): MacroGrams;
function validateProfileInput(input: unknown): ValidationResult;
```

### Constraints

- **Pure Functions Only**: No database access, no side effects
- **Deterministic**: Same input always produces same output
- **Versioned**: Formula changes tracked via `formulaVersion`
- **AI Cannot Modify**: AI Coach can READ results but CANNOT change formulas

---

## 2. Plan Service

**Base Path:** `/api/meal-plan`

### Endpoints

#### Generate Meal Plan
```http
POST /api/meal-plan/generate
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "calculationId": "calc_abc123",  // Optional, uses latest if omitted
  "preferences": {
    "excludeIngredients": ["peanuts", "shellfish"],
    "cuisinePreferences": ["mexican", "mediterranean"],
    "mealCount": 3,
    "includeSnacks": true
  }
}
```

**Response (202 Accepted - Async):**
```json
{
  "jobId": "job_xyz789",
  "status": "queued",
  "estimatedTime": 30,
  "pollUrl": "/api/meal-plan/job/job_xyz789"
}
```

**Response (200 OK - Sync for simple plans):**
```json
{
  "id": "plan_abc123",
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "type": "breakfast",
          "name": "Protein Oatmeal",
          "foods": [...],
          "nutrition": { "calories": 450, "protein": 30, ... }
        }
      ]
    }
  ],
  "shoppingList": [...],
  "totalNutrition": { ... }
}
```

#### Get Meal Plan
```http
GET /api/meal-plan/{id}
Authorization: Bearer {session_token}
```

#### Get Shopping List
```http
GET /api/meal-plan/{id}/shopping
Authorization: Bearer {session_token}
```

---

## 3. Challenge/Streak Service

**Base Path:** `/api/challenges`, `/api/streak`

### Challenge Endpoints

#### List Challenges
```http
GET /api/challenges
Authorization: Bearer {session_token}

Query Parameters:
- status: active | upcoming | completed
- limit: number (default: 10)
- offset: number (default: 0)
```

**Response:**
```json
{
  "challenges": [
    {
      "id": "chal_7day_protein",
      "name": "7-Day High Protein Challenge",
      "description": "Hit your protein goals for 7 days straight",
      "durationDays": 7,
      "requirements": {
        "dailyProteinGoal": 120,
        "minMealsLogged": 3
      },
      "rewards": {
        "points": 500,
        "badge": "protein_champion"
      },
      "userStatus": "not_joined" | "active" | "completed"
    }
  ],
  "total": 15
}
```

#### Join Challenge
```http
POST /api/challenges/{id}/join
Authorization: Bearer {session_token}
```

#### Get Progress
```http
GET /api/challenges/{id}/progress
Authorization: Bearer {session_token}
```

**Response:**
```json
{
  "challengeId": "chal_7day_protein",
  "userId": "user_abc",
  "startedAt": "2026-03-01T00:00:00Z",
  "currentDay": 3,
  "dailyProgress": [
    { "day": 1, "completed": true, "proteinG": 135, "mealsLogged": 4 },
    { "day": 2, "completed": true, "proteinG": 128, "mealsLogged": 3 },
    { "day": 3, "completed": false, "proteinG": 45, "mealsLogged": 1 }
  ],
  "overallProgress": 0.43,
  "onTrack": true
}
```

### Streak Endpoints

#### Get Current Streak
```http
GET /api/streak
Authorization: Bearer {session_token}
```

**Response:**
```json
{
  "currentStreak": 12,
  "longestStreak": 45,
  "lastActivityDate": "2026-03-03",
  "todayCompleted": true,
  "activitiesRequired": [
    { "type": "LOG_MEAL", "completed": true },
    { "type": "AI_INTERACTION", "completed": true }
  ]
}
```

#### Record Activity
```http
POST /api/streak/activity
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "activityType": "LOG_MEAL" | "AI_INTERACTION" | "PLAN_VIEW" | "CHECK_IN"
}
```

---

## 4. Leaderboard Service

**Base Path:** `/api/leaderboard`

### Endpoints

#### Get Weekly Leaderboard
```http
GET /api/leaderboard/weekly
Authorization: Bearer {session_token} (optional for public)

Query Parameters:
- limit: number (default: 50, max: 100)
- offset: number (default: 0)
```

**Response:**
```json
{
  "periodKey": "2026-W09",
  "lastUpdated": "2026-03-03T12:00:00Z",
  "rankings": [
    {
      "rank": 1,
      "userId": "user_abc",
      "displayName": "FitJohn",
      "avatarUrl": "https://i.ytimg.com/vi/LBIr1RXiko4/sddefault.jpg",
      "points": 2450,
      "stats": {
        "streakDays": 15,
        "mealsLogged": 42,
        "challengesCompleted": 2
      }
    }
  ],
  "userRank": {
    "rank": 156,
    "points": 890
  },
  "total": 12500
}
```

#### Get All-Time Leaderboard
```http
GET /api/leaderboard/all-time
```

#### Get Challenge Leaderboard
```http
GET /api/leaderboard/challenge/{challengeId}
```

#### Get User Rank
```http
GET /api/leaderboard/user/{userId}/rank
```

**Response:**
```json
{
  "userId": "user_abc",
  "weeklyRank": 156,
  "weeklyTotal": 12500,
  "allTimeRank": 892,
  "allTimeTotal": 45000,
  "percentile": 98.2
}
```

---

## 5. Share Service

**Base Path:** `/api/share`

### Endpoints

#### Create Share Link
```http
POST /api/share/challenge/{challengeId}
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "includeStats": true,
  "customMessage": "Join me on this challenge!"
}
```

**Response:**
```json
{
  "shareId": "share_abc123",
  "slug": "fit-john-7day-x3k9",
  "url": "https://nutricoach.app/c/fit-john-7day-x3k9",
  "ogImageUrl": "https://images.fittfinder.com/668ee3cbf868d6d07338498388e06570168c79fb44ba0df3f0ba2259662b8b30/original.jpg",
  "expiresAt": "2026-04-03T00:00:00Z"
}
```

#### Get Public Payload (SSR)
```http
GET /api/share/{slug}
```

**Response:**
```json
{
  "type": "challenge",
  "title": "FitJohn's 7-Day Protein Challenge",
  "description": "Day 5 of 7 - 87% progress!",
  "user": {
    "displayName": "FitJohn",
    "avatarUrl": "..."
  },
  "challenge": {
    "name": "7-Day High Protein Challenge",
    "progress": 0.87,
    "currentDay": 5
  },
  "ogImage": "https://i.etsystatic.com/57327234/r/il/e69f50/7314940205/il_1080xN.7314940205_3mzn.jpg",
  "cta": {
    "text": "Join the Challenge",
    "url": "/get-started?ref=fit-john-7day-x3k9"
  }
}
```

#### Generate Share Card (Async)
```http
POST /api/share/generate-card
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "shareId": "share_abc123",
  "template": "challenge_progress"
}
```

**Response:**
```json
{
  "jobId": "job_card_xyz",
  "status": "queued",
  "pollUrl": "/api/share/card/job_card_xyz"
}
```

---

## 6. AI Coach Service

**Base Path:** `/api/chat`

### Endpoints

#### Send Message
```http
POST /api/chat
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "sessionId": "session_abc",  // Optional, creates new if omitted
  "message": "What should I eat for dinner to hit my protein goal?"
}
```

**Response (Streaming):**
```
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"type":"start","sessionId":"session_abc"}
data: {"type":"chunk","content":"Based on your"}
data: {"type":"chunk","content":" remaining protein goal"}
data: {"type":"tool_call","tool":"get_nutrition_target","result":{"proteinRemaining":45}}
data: {"type":"chunk","content":" of 45g, I recommend..."}
data: {"type":"done","usage":{"promptTokens":150,"completionTokens":89}}
```

### Tool Calling Interface

The AI Coach can call these internal tools:

```typescript
interface AICoachTools {
  // Read-only access to user data
  get_user_profile(): UserProfile;
  get_nutrition_target(): NutritionTarget;
  get_today_progress(): DailyProgress;
  get_meal_suggestions(criteria: MealCriteria): MealSuggestion[];
  
  // Read-only access to food database
  search_foods(query: string): FoodItem[];
  get_food_nutrition(foodId: string): FoodNutrition;
  
  // Read-only access to challenges
  get_active_challenges(): Challenge[];
  get_challenge_progress(challengeId: string): ChallengeProgress;
  
  // CANNOT modify calculations, only read
  get_calculation_result(calculationId?: string): NutritionResult;
}
```

**Constraint:** AI Coach CANNOT:
- Modify nutrition calculations
- Change user profile data
- Log meals on behalf of user
- Join/leave challenges

---

## 7. Analytics / Event Collector

**Base Path:** `/api/analytics`, `/api/acquisition`

### Event Collection

#### Track Event (Batched)
```http
POST /api/analytics/event
Content-Type: application/json

{
  "events": [
    {
      "type": "PAGE_VIEW",
      "data": { "page": "/tools/calorie-calculator" },
      "timestamp": "2026-03-03T10:30:00Z"
    },
    {
      "type": "CALCULATOR_USE",
      "data": { "calculatorType": "calorie", "result": { "tdee": 2200 } },
      "timestamp": "2026-03-03T10:31:00Z"
    }
  ],
  "sessionId": "sess_anonymous_xyz"
}
```

### Acquisition Tracking

#### Track Acquisition
```http
POST /api/acquisition/track
Content-Type: application/json

{
  "sessionId": "sess_xyz",
  "source": "seo" | "social" | "referral" | "direct" | "product_hunt",
  "referrer": "https://google.com/...",
  "landingPage": "/tools/calorie-calculator",
  "utmParams": {
    "source": "google",
    "medium": "organic",
    "campaign": null
  },
  "referralCode": "FITJOHN123"  // Optional
}
```

### Analytics Dashboard

#### Get Acquisition Analytics
```http
GET /api/analytics/acquisition
Authorization: Bearer {admin_token}

Query Parameters:
- startDate: ISO date
- endDate: ISO date
- groupBy: day | week | month
```

**Response:**
```json
{
  "period": {
    "start": "2026-02-01",
    "end": "2026-03-03"
  },
  "summary": {
    "totalVisitors": 45000,
    "totalSignups": 2800,
    "conversionRate": 0.062,
    "bySource": {
      "seo": { "visitors": 25000, "signups": 1500, "rate": 0.06 },
      "social": { "visitors": 8000, "signups": 600, "rate": 0.075 },
      "referral": { "visitors": 5000, "signups": 500, "rate": 0.10 },
      "direct": { "visitors": 5000, "signups": 150, "rate": 0.03 },
      "product_hunt": { "visitors": 2000, "signups": 50, "rate": 0.025 }
    }
  },
  "timeSeries": [
    { "date": "2026-02-01", "visitors": 1500, "signups": 85 },
    ...
  ]
}
```

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR" | "AUTH_ERROR" | "NOT_FOUND" | "RATE_LIMITED" | "SERVER_ERROR",
    "message": "Human-readable error message",
    "details": {  // Optional
      "field": "age",
      "reason": "Must be between 13 and 120"
    },
    "requestId": "req_abc123"  // For debugging
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async job queued) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Server error |

---

## Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Auth endpoints | 10 | 1 minute |
| Chat/AI | 30 | 1 minute |
| Plan generation | 5 | 1 hour |
| Calculator APIs | 60 | 1 minute |
| General APIs | 100 | 1 minute |
| Analytics (write) | 1000 | 1 minute |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709467200
```
