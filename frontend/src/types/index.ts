// 1. User Information Shape
export interface User {
  username: string;
  email: string;
  role: 'user' | 'admin'; // Enforces that role can ONLY be one of these two strings
}

// 2. Inspection Record Shape
export interface Inspection {
  _id: string;
  userId: string |{
    _id: string;
    username: string;
    email: string;
  };
  imageUrl: string;
  status: 'normal' | 'defective'; // Strict validation contract
  confidence: number;            // Notice this should be a number, not a string!
  gradCamUrl?: string;
  notes?: string;              // Optional field for any additional notes
  inferenceTimeMs: number;       // Match your backend field name (inferenceTimeMs)
  createdAt: string;             // ISO Date String from MongoDB
  __v?: number;                  // Optional MongoDB version key (indicated by '?')

}


// 3. Inspection Upload Response Shape
export interface InspectionResponse {
  success: boolean;             // booleans use true/false instead of string statuses
  inspection: Inspection;        // Reuses the Inspection interface we defined above!
}

// 4. Paginated History Response Shape
export interface PaginatedInspections {
  inspections: Inspection[];     // An array filled with our Inspection objects
  totalCount: number;
  currentPage: number;
  totalPages: number;
}


// 5. Admin stats response
export interface AdminStats {
  totalInspections: number;
  defectiveCount: number;
  averageConfidence: number;
  totalUsers: number;
  countsGroupedByDate: {
    _id: string;            // date string "2026-07-13"
    count: number;
  }[];
}

// 6. Admin users list response
export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}