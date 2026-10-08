export interface BreakpointInfo {
  organism: string;
  antibiotic: string;
  measurement_type: string;
  value: number;
  classification: string;
  standard?: string;
  standard_version?: string;
  source?: string;
  breakpoints?: {
    susceptible?: string;
    intermediate?: string;
    resistant?: string;
  };
  reason?: string;
}

export interface DiskDetection {
  disk_id: number;
  antibiotic_code: string;
  antibiotic_name: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  disk_diameter_px: number;
  disk_diameter_mm?: number;
  zone_diameter_px: number;
  zone_diameter_mm?: number;
  interpretation?: BreakpointInfo;
}

export interface PlateAnalysisResult {
  image_width: number;
  image_height: number;
  plate_detected: boolean;
  plate_bbox?: number[];
  calibration_method: string;
  pixels_per_mm?: number;
  calibration_warning?: string;
  disks: DiskDetection[];
  annotated_image_base64?: string;
  summary: {
    disks_detected: number;
    organism: string;
    resistant_count: number;
    susceptible_count: number;
    intermediate_count: number;
  };
}

export interface SurveillanceOverview {
  total_observations: number;
  total_isolates: number;
  antibiotics_analyzed: number;
  organisms_analyzed: number;
  resistance_rate_pct: number;
  susceptibility_rate_pct: number;
  intermediate_rate_pct: number;
  mdr_isolates_count: number;
  mdr_rate_pct: number;
  emerging_trends_count: number;
  years_covered: number[];
}

export interface TrendDataPoint {
  year: number;
  total_isolates: number;
  resistance_pct: number;
  susceptible_pct: number;
  intermediate_pct: number;
  confidence_level: string;
}

export interface HeatmapResponse {
  organisms: string[];
  antibiotics: string[];
  matrix: Array<{
    organism: string;
    [antibiotic: string]: any;
  }>;
}

export interface EmergingTrendItem {
  organism: string;
  antibiotic: string;
  trend_direction: string;
  current_resistance_pct: number;
  previous_resistance_pct: number;
  change_12mo_pct: number;
  annual_slope: number;
  p_value?: number;
  sample_size_total: number;
  sample_size_recent: number;
  confidence: string;
  amr_trend_score: number;
  status_flag: string;
  contributing_factors: string[];
}

export interface IsolateRecord {
  isolate_id: string;
  organism: string;
  collection_date: string;
  year: number;
  location: string;
  antibiotic: string;
  zone_diameter_mm?: number;
  mic?: number;
  susceptibility: string;
  genomic_features?: string;
  source_dataset: string;
}
