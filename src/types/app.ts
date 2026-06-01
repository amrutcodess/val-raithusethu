export interface Crop {
  id: string;
  name_en: string;
  name_te: string;
  name_hi: string;
  image_url?: string | null;
}

export interface Problem {
  id: string;
  crop_id: string;
  title_en: string;
  title_te: string;
  title_hi: string;
  image_url?: string | null;
  problem_type?: string | null;
  description?: string | null;
}

// UPDATED: Represents the new clean 'products' table
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  scientific_formula?: string | null;
  image_url?: string | null;
  pack_sizes: string[] | null;
  features?: string[] | null;
}

// NEW: Represents the 'product_mappings' table
// This contains the dosage logic and the nested 'products' details
export interface ProductMapping {
  id: string;
  product_id: string;
  crop_id: string;
  problem_id: string;

  // Added stage field
  stage?: string | null;

  // Dosage & Instructions (Specific to this Crop+Problem combo)
  dosage_recommendation: string;
  dosage_min: number;
  dosage_max: number;
  dosage_unit: string;
  
  spray_interval?: string | null;
  safety_notes?: string | null;
  instructions?: string | null;

  // The JOINED parent product info
  products: Product;
}

// UPDATED: Now uses ProductMapping to ensure TreatmentPlan works with the new structure
export interface TreatmentData {
  crop: Crop;
  problem: Problem;
  product: ProductMapping;
  acres: number;
}

// --- Legacy / Other Interfaces (Left Untouched) ---

export interface ProductProblem {
  id: string;
  product_id: string;
  problem_id: string;
  dosage_for_problem?: string | null;
}

export interface CropProblem {
  id: string;
  crop_id: string;
  problem_id: string;
}