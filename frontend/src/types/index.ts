// 1. User Information Shape
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin'; // Enforces that role can ONLY be one of these two strings
}

// 2. Inspection Record Shape
export interface Inspection {
  _id: string;
  userId: string;
  imageUrl: string;
  status: 'normal' | 'defective'; // Strict validation contract
  confidence: number;            // Notice this should be a number, not a string!
  inferenceTimeMs: number;       // Match your backend field name (inferenceTimeMs)
  createdAt: string;             // ISO Date String from MongoDB
  __v?: number;                  // Optional MongoDB version key (indicated by '?')
}

// 3. Login Response Back Shape
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
}

// 4. Inspection Upload Response Shape
export interface InspectionResponse {
  success: boolean;             // booleans use true/false instead of string statuses
  inspection: Inspection;        // Reuses the Inspection interface we defined above!
}

// 5. Paginated History Response Shape
export interface PaginatedInspections {
  inspections: Inspection[];     // An array filled with our Inspection objects
  totalCount: number;
  currentPage: number;
  totalPages: number;
}