-- Create fertilizers table
CREATE TABLE public.fertilizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  npk_ratio text,
  brand text,
  price numeric,
  unit text DEFAULT 'kg',
  description text,
  benefits text,
  usage_instructions text,
  suitable_for_crops text[],
  treats_diseases text[],
  soil_compatibility text[],
  organic boolean DEFAULT false,
  rating numeric DEFAULT 4.0,
  stock_quantity integer DEFAULT 0,
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fertilizers ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view fertilizers
CREATE POLICY "Anyone can view fertilizers"
ON public.fertilizers FOR SELECT
TO public
USING (true);

-- Create indexes for performance
CREATE INDEX idx_fertilizers_crops ON public.fertilizers USING GIN (suitable_for_crops);
CREATE INDEX idx_fertilizers_diseases ON public.fertilizers USING GIN (treats_diseases);
CREATE INDEX idx_fertilizers_soil ON public.fertilizers USING GIN (soil_compatibility);
CREATE INDEX idx_fertilizers_type ON public.fertilizers (type);

-- Insert comprehensive fertilizer data
INSERT INTO public.fertilizers (name, type, npk_ratio, brand, price, description, benefits, suitable_for_crops, treats_diseases, soil_compatibility, organic) VALUES

-- NPK Complex Fertilizers
('NPK Complex 12:32:16', 'chemical', '12:32:16', 'Tata Chemicals', 850, 'Balanced NPK fertilizer for cereals', 'Promotes root development, enhances grain quality', ARRAY['wheat', 'rice', 'maize', 'barley'], ARRAY['nutrient deficiency', 'weak growth'], ARRAY['clay', 'loam', 'alluvial'], false),

('DAP (Di-Ammonium Phosphate)', 'chemical', '18:46:0', 'IFFCO', 1350, 'High phosphate fertilizer for root development', 'Excellent for seedling growth, root establishment', ARRAY['wheat', 'rice', 'pulses', 'oilseeds'], ARRAY['phosphorus deficiency', 'poor root growth'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], false),

('Urea', 'chemical', '46:0:0', 'IFFCO', 280, 'High nitrogen fertilizer for vegetative growth', 'Rapid leaf and stem growth, increases chlorophyll', ARRAY['wheat', 'rice', 'sugarcane', 'vegetables'], ARRAY['nitrogen deficiency', 'yellowing leaves'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], false),

('Potash (MOP)', 'chemical', '0:0:60', 'Rashtriya Chemicals', 920, 'Potassium-rich fertilizer for fruit development', 'Improves fruit quality, disease resistance, stress tolerance', ARRAY['tomatoes', 'potatoes', 'fruits', 'vegetables'], ARRAY['potassium deficiency', 'poor fruit quality'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], false),

-- Organic Fertilizers
('Vermicompost', 'organic', '2:1:1', 'Organic India', 350, 'Premium organic compost from earthworms', 'Improves soil structure, water retention, microbial activity', ARRAY['vegetables', 'fruits', 'flowers', 'all crops'], ARRAY['soil degradation', 'poor soil health'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], true),

('Neem Cake', 'organic', '5:1:2', 'Godrej Agrovet', 480, 'Natural neem-based fertilizer with pest control', 'Organic nitrogen source, natural pest repellent, soil conditioner', ARRAY['vegetables', 'fruits', 'pulses'], ARRAY['fungal diseases', 'nematodes', 'soil pests'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], true),

('Cow Dung Compost', 'organic', '3:2:1', 'Local Organic', 200, 'Traditional organic fertilizer from cow dung', 'Rich in organic matter, improves soil fertility naturally', ARRAY['wheat', 'rice', 'vegetables', 'fruits'], ARRAY['soil depletion'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], true),

-- Specialized Fertilizers
('Tomato Special NPK 10:10:10', 'specialized', '10:10:10', 'Coromandel', 650, 'Balanced fertilizer specially formulated for tomatoes', 'Prevents blossom end rot, improves fruit size and quality', ARRAY['tomatoes', 'peppers', 'eggplant'], ARRAY['blossom end rot', 'calcium deficiency'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], false),

('Micronutrient Mix (Zinc + Boron)', 'specialized', '0:0:0+Zn+B', 'Zuari', 420, 'Essential micronutrients for crop health', 'Treats micronutrient deficiencies, improves crop quality', ARRAY['rice', 'wheat', 'pulses', 'vegetables'], ARRAY['chlorosis', 'zinc deficiency', 'boron deficiency'], ARRAY['calcareous', 'alkaline'], false),

('Calcium Nitrate', 'specialized', '15.5:0:0+Ca', 'Yara', 890, 'Calcium and nitrogen for cell wall strength', 'Prevents fruit cracking, blossom end rot, improves shelf life', ARRAY['tomatoes', 'peppers', 'lettuce'], ARRAY['blossom end rot', 'tip burn'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], false),

-- Bio-Fertilizers
('Rhizobium Culture', 'bio-fertilizer', 'N-fixing', 'Bio-Tech', 180, 'Nitrogen-fixing bacteria for legumes', 'Natural nitrogen fixation, reduces urea requirement', ARRAY['pulses', 'beans', 'peas', 'groundnut'], ARRAY['nitrogen deficiency in legumes'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], true),

('Azotobacter', 'bio-fertilizer', 'N-fixing', 'Bio-Tech', 180, 'Free-living nitrogen-fixing bacteria', 'Fixes atmospheric nitrogen, promotes plant growth', ARRAY['wheat', 'rice', 'vegetables'], ARRAY['poor nitrogen availability'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], true),

-- Disease-Specific Treatments
('Fungicide + Fertilizer Combo', 'specialized', '12:12:17+Cu', 'Bayer CropScience', 1200, 'Combines nutrition with fungal disease prevention', 'Controls early blight, late blight while providing nutrition', ARRAY['tomatoes', 'potatoes'], ARRAY['early blight', 'late blight', 'fungal diseases'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], false),

('Sulfur-Enhanced NPK', 'chemical', '10:10:10+S', 'GSFC', 720, 'NPK with sulfur for disease resistance', 'Improves disease resistance, enhances protein synthesis', ARRAY['wheat', 'pulses', 'oilseeds'], ARRAY['powdery mildew', 'sulfur deficiency'], ARRAY['clay', 'sandy', 'loam', 'black', 'alluvial'], false);